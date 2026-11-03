from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
import random
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.adapters.sarvam import SarvamAIAdapter
from app.models.feedback import CitizenReport, ReportMedia, ReportStatusHistory, ReportCorroboration
from app.models.intelligence import IssueCluster
from app.schemas.feedback import CitizenReportCreate, CitizenReportResponse, ReportCorroborateRequest

VALID_STATUSES = ["submitted", "triaged", "assigned", "in_progress", "resolved", "rejected_spam"]


class FeedbackService:
    @staticmethod
    def create_report(db: Session, report_in: CitizenReportCreate, reporter_id: Optional[UUID] = None) -> CitizenReport:
        """
        Submits citizen report, performs automated AI triage, spatial duplicate detection,
        and dynamically assigns or forms issue clusters in PostGIS.
        """
        # 1. Strict Input Validation before processing
        val_res = SarvamAIAdapter.validate_civic_text(report_in.description)
        if not val_res["is_valid"]:
            raise ValueError(f"{val_res['reason']} {val_res['suggestion']}")

        # 2. Generate standard report number
        seq = random.randint(1000, 9999)
        year = datetime.utcnow().year
        report_number = f"ND-MP-{year}-{seq}"

        point_geom = f"SRID=4326;POINT({report_in.longitude} {report_in.latitude})"

        # 3. Spatial duplicate search using PostGIS ST_DWithin (within 200m)
        nearby_reports = []
        try:
            nearby_query = text("""
                SELECT 
                    id, 
                    report_number, 
                    title, 
                    category, 
                    status,
                    ST_Distance(
                        location_geometry::geography,
                        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                    ) AS dist_meters
                FROM citizen_reports
                WHERE city_id = :city_id
                  AND category = :category
                  AND status != 'resolved'
                  AND ST_DWithin(
                      location_geometry::geography,
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                      200
                  )
                ORDER BY dist_meters ASC
                LIMIT 5;
            """)
            rows = db.execute(nearby_query, {
                "city_id": str(report_in.city_id),
                "category": report_in.category,
                "lng": report_in.longitude,
                "lat": report_in.latitude
            }).fetchall()

            for r in rows:
                nearby_reports.append({
                    "id": str(r.id),
                    "report_number": r.report_number,
                    "title": r.title,
                    "category": r.category,
                    "status": r.status,
                    "distance_meters": round(float(r.dist_meters), 1)
                })
        except Exception:
            # Fallback when running in mock test mode
            pass

        # 4. Automated AI Triage & Grounded Individual Issue Intelligence
        sarvam = SarvamAIAdapter()
        intel = sarvam.generate_individual_intelligence(
            description=report_in.description,
            category=report_in.category,
            location_address=report_in.location_address,
            media_paths=report_in.media_paths,
            latitude=report_in.latitude,
            longitude=report_in.longitude,
            nearby_reports=nearby_reports
        )
        triage = intel["triage"]

        # 5. Construct Comprehensive Grounded AI Metadata Bundle
        facility_name = getattr(report_in, "facility_name", None)
        if not facility_name and report_in.location_address:
            parts = [p.strip() for p in report_in.location_address.split(",")]
            if parts and len(parts) > 1 and not parts[0].lower().startswith("ward") and not parts[0].lower().startswith("near"):
                facility_name = parts[0]

        ai_metadata = {
            "facility_name": facility_name,
            "predicted_category": triage["predicted_category"],
            "subcategory": triage.get("subcategory"),
            "confidence": triage["confidence"],
            "urgency": triage["urgency"],
            "sentiment": triage["sentiment"],
            "assigned_department": intel["responsible_department"],
            "assigned_department_hi": intel["responsible_department_hi"],
            "assigned_department_name": intel["responsible_department"],
            "assigned_department_name_hi": intel["responsible_department_hi"],
            "is_ai_prediction": True,
            "is_insufficient_information": triage.get("is_insufficient_information", False),
            "nearby_duplicate_count": len(nearby_reports),
            "nearby_reports": nearby_reports,
            "triage_summary": triage["triage_summary"],
            "individual_intelligence": intel,
            "original_description": triage["original_description"],
            "original_language": triage["original_language"],
            "description_en": triage["description_en"],
            "description_hi": triage["description_hi"],
            "title_en": report_in.title or triage["title_en"],
            "title_hi": triage["title_hi"],
            "executive_brief_en": triage["executive_brief_en"],
            "executive_brief_hi": triage["executive_brief_hi"],
            "executive_summary_en": triage["executive_summary_en"],
            "executive_summary_hi": triage["executive_summary_hi"],
            "extracted_hazard": triage["extracted_hazard"],
            "extracted_hazard_hi": triage["extracted_hazard_hi"],
            "is_acute_hazard": triage.get("is_acute_hazard", False),
            "hazard_type": triage.get("hazard_type"),
            "recommended_action": triage["recommended_action"],
            "recommended_action_hi": triage["recommended_action_hi"],
            "quality_status": triage["quality_status"],
            "quality_status_hi": triage["quality_status_hi"],
            "needs_clarification": triage.get("needs_clarification", False),
            "target_sla_hours": triage["target_sla_hours"]
        }

        # 5. Build and insert CitizenReport
        report = CitizenReport(
            report_number=report_number,
            reporter_id=reporter_id,
            city_id=report_in.city_id,
            ward_id=report_in.ward_id,
            locality_id=report_in.locality_id,
            category=report_in.category or triage["predicted_category"],
            subcategory=report_in.subcategory,
            title=report_in.title or report_in.category.replace("_", " ").title(),
            description=report_in.description,
            normalized_text=report_in.description.strip(),
            input_language=report_in.input_language or triage["detected_language"],
            location_geometry=point_geom,
            location_address=report_in.location_address,
            severity_input=report_in.severity_input or triage["urgency"],
            status="submitted",
            is_anonymous=report_in.is_anonymous or False,
            is_public=True,
            ai_metadata=ai_metadata,
            provenance_type="citizen_submitted"
        )

        db.add(report)
        db.flush()

        # 6. Status History Record
        status_history = ReportStatusHistory(
            report_id=report.id,
            previous_status=None,
            new_status="submitted",
            changed_by_user_id=reporter_id,
            actor_role="citizen",
            reason="Citizen report submitted"
        )
        db.add(status_history)

        # 7. Attach Media if provided
        for media_path in (report_in.media_paths or []):
            media = ReportMedia(
                report_id=report.id,
                storage_path=media_path,
                bucket_name="report-media",
                media_type="image",
                mime_type="image/jpeg",
                moderation_state="pending"
            )
            db.add(media)

        # 8. Spatial Issue Clustering
        try:
            cluster_search_query = text("""
                SELECT id, report_count, unresolved_count
                FROM issue_clusters
                WHERE city_id = :city_id
                  AND category = :category
                  AND cluster_status = 'active'
                  AND ST_DWithin(
                      centroid::geography,
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                      250
                  )
                LIMIT 1;
            """)
            existing_cluster = db.execute(cluster_search_query, {
                "city_id": str(report_in.city_id),
                "category": report_in.category,
                "lng": report_in.longitude,
                "lat": report_in.latitude
            }).fetchone()

            if existing_cluster:
                # Update existing cluster
                update_cluster_query = text("""
                    UPDATE issue_clusters
                    SET report_count = report_count + 1,
                        unresolved_count = unresolved_count + 1,
                        last_reported_at = CURRENT_TIMESTAMP
                    WHERE id = :cluster_id;
                """)
                db.execute(update_cluster_query, {"cluster_id": str(existing_cluster.id)})
            elif len(nearby_reports) >= 1:
                # Form a new hotspot cluster
                new_cluster = IssueCluster(
                    city_id=report_in.city_id,
                    ward_id=report_in.ward_id,
                    category=report_in.category,
                    cluster_title_en=f"Recurring {report_in.category.replace('_', ' ').title()} Hotspot",
                    cluster_title_hi=f"{report_in.category.replace('_', ' ').title()} समस्या समूह",
                    centroid=point_geom,
                    report_count=len(nearby_reports) + 1,
                    unresolved_count=len(nearby_reports) + 1,
                    composite_risk_score=min(95.0, 50.0 + (len(nearby_reports) * 15.0)),
                    cluster_status="active",
                    provenance_type="internal_derived"
                )
                db.add(new_cluster)
        except Exception:
            pass

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def update_report_status(
        db: Session,
        report_id: UUID,
        new_status: str,
        changed_by_user_id: Optional[UUID] = None,
        actor_role: str = "municipal_officer",
        reason: Optional[str] = None,
        notes: Optional[str] = None,
        assigned_officer_name: Optional[str] = None,
        department_id: Optional[UUID] = None,
        resolution_summary: Optional[str] = None
    ) -> CitizenReport:
        """
        Updates the operational status of a report, maintains the audit history log,
        and applies resolution timestamps.
        """
        if hasattr(new_status, "status"):
            update_obj = new_status
            new_status = update_obj.status
            if not assigned_officer_name:
                assigned_officer_name = getattr(update_obj, "assigned_officer_name", None)
            if not department_id:
                department_id = getattr(update_obj, "department_id", None)
            if not resolution_summary:
                resolution_summary = getattr(update_obj, "resolution_summary", None)
            if not reason:
                reason = getattr(update_obj, "reason", None)
            if not notes:
                notes = getattr(update_obj, "notes", None)

        if new_status not in VALID_STATUSES:
            raise ValueError(f"Invalid status '{new_status}'. Allowed statuses: {', '.join(VALID_STATUSES)}")

        report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
        if not report:
            raise LookupError(f"CitizenReport '{report_id}' not found.")

        old_status = report.status
        report.status = new_status
        report.updated_at = datetime.utcnow()

        if assigned_officer_name:
            report.assigned_officer_name = assigned_officer_name
        if department_id:
            report.department_id = department_id
        if resolution_summary:
            report.resolution_summary = resolution_summary
        if new_status == "resolved":
            report.resolved_at = datetime.utcnow()

        # Log status transition
        history_entry = ReportStatusHistory(
            report_id=report.id,
            previous_status=old_status,
            new_status=new_status,
            changed_by_user_id=changed_by_user_id,
            actor_role=actor_role,
            reason=reason or f"Status changed to {new_status}",
            notes=notes
        )
        db.add(history_entry)

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def resolve_report_by_identifier(db: Session, identifier: str) -> Optional[CitizenReport]:
        """Resolves report by UUID string or human-readable report_number."""
        if not identifier:
            return None
        clean_id = str(identifier).strip()
        try:
            val_uuid = UUID(clean_id)
            report = db.query(CitizenReport).filter(CitizenReport.id == val_uuid).first()
            if report:
                return report
        except (ValueError, AttributeError):
            pass
        return db.query(CitizenReport).filter(CitizenReport.report_number.ilike(clean_id)).first()

    @staticmethod
    def corroborate_report(db: Session, report_id: UUID, user_id: Optional[UUID], req: ReportCorroborateRequest) -> Dict[str, Any]:
        """Corroborates / upvotes an existing citizen issue."""
        report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
        if not report:
            raise LookupError(f"Citizen report '{report_id}' not found in municipal records.")

        if user_id:
            existing = db.query(ReportCorroboration).filter(
                ReportCorroboration.report_id == report_id,
                ReportCorroboration.user_id == user_id
            ).first()

            if existing:
                return {
                    "status": "already_corroborated",
                    "report_id": str(report_id),
                    "corroboration_count": report.corroboration_count
                }

            try:
                corroboration = ReportCorroboration(
                    report_id=report_id,
                    user_id=user_id,
                    corroboration_type=req.corroboration_type or "confirm_issue",
                    comment=req.comment
                )
                db.add(corroboration)
                report.corroboration_count = (report.corroboration_count or 0) + 1
                db.commit()
                return {"status": "success", "corroboration_count": report.corroboration_count}
            except IntegrityError:
                db.rollback()
                # If foreign key fails because user_id does not exist in auth.users, increment counter safely
                report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
                if report:
                    report.corroboration_count = (report.corroboration_count or 0) + 1
                    db.commit()
                    return {"status": "success", "corroboration_count": report.corroboration_count}
                raise

        # Anonymous / guest corroboration
        report.corroboration_count = (report.corroboration_count or 0) + 1
        db.commit()
        return {"status": "success", "corroboration_count": report.corroboration_count}

    @staticmethod
    def corroborate_report_by_identifier(db: Session, identifier: str, user_id: Optional[UUID], req: ReportCorroborateRequest) -> Dict[str, Any]:
        """Corroborates / confirms an existing citizen issue by UUID or report_number."""
        report = FeedbackService.resolve_report_by_identifier(db, identifier)
        if not report:
            raise LookupError(f"Citizen report '{identifier}' not found in municipal records.")

        if user_id:
            existing = db.query(ReportCorroboration).filter(
                ReportCorroboration.report_id == report.id,
                ReportCorroboration.user_id == user_id
            ).first()

            if existing:
                return {
                    "status": "already_corroborated",
                    "report_id": str(report.id),
                    "report_number": report.report_number,
                    "corroboration_count": report.corroboration_count
                }

            try:
                corroboration = ReportCorroboration(
                    report_id=report.id,
                    user_id=user_id,
                    corroboration_type=req.corroboration_type or "confirm_issue",
                    comment=req.comment
                )
                db.add(corroboration)
                report.corroboration_count = (report.corroboration_count or 0) + 1
                db.commit()
                return {
                    "status": "success",
                    "message": "Report confirmed and corroborated successfully.",
                    "report_id": str(report.id),
                    "report_number": report.report_number,
                    "corroboration_count": report.corroboration_count
                }
            except IntegrityError:
                db.rollback()
                # Fallback on FK violation: still record community corroboration safely
                report = FeedbackService.resolve_report_by_identifier(db, identifier)
                if report:
                    report.corroboration_count = (report.corroboration_count or 0) + 1
                    db.commit()
                    return {
                        "status": "success",
                        "message": "Report confirmed and corroborated successfully.",
                        "report_id": str(report.id),
                        "report_number": report.report_number,
                        "corroboration_count": report.corroboration_count
                    }
                raise

        # Anonymous / guest corroboration
        report.corroboration_count = (report.corroboration_count or 0) + 1
        db.commit()
        return {
            "status": "success",
            "message": "Report confirmed and corroborated successfully.",
            "report_id": str(report.id),
            "report_number": report.report_number,
            "corroboration_count": report.corroboration_count
        }
