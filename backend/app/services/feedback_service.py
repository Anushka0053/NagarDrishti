from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from app.models.feedback import CitizenReport, ReportMedia, ReportStatusHistory, ReportCorroboration
from app.schemas.feedback import CitizenReportCreate, CitizenReportResponse, ReportCorroborateRequest
import random


class FeedbackService:
    @staticmethod
    def create_report(db: Session, report_in: CitizenReportCreate, reporter_id: Optional[UUID] = None) -> CitizenReport:
        # Generate human-readable report number
        seq = random.randint(1000, 9999)
        year = datetime.utcnow().year
        report_number = f"ND-MP-{year}-{seq}"

        point_geom = f"SRID=4326;POINT({report_in.longitude} {report_in.latitude})"

        report = CitizenReport(
            report_number=report_number,
            reporter_id=reporter_id,
            city_id=report_in.city_id,
            ward_id=report_in.ward_id,
            locality_id=report_in.locality_id,
            category=report_in.category,
            subcategory=report_in.subcategory,
            title=report_in.title or report_in.category.replace("_", " ").title(),
            description=report_in.description,
            normalized_text=report_in.description.strip(),
            input_language=report_in.input_language or "hi",
            location_geometry=point_geom,
            location_address=report_in.location_address,
            severity_input=report_in.severity_input or "medium",
            status="submitted",
            is_anonymous=report_in.is_anonymous or False,
            is_public=True
        )

        db.add(report)
        db.flush()

        # Add initial status history record
        status_history = ReportStatusHistory(
            report_id=report.id,
            previous_status=None,
            new_status="submitted",
            changed_by_user_id=reporter_id,
            actor_role="citizen",
            reason="Initial citizen submission"
        )
        db.add(status_history)

        # Attach media if provided
        for media_path in report_in.media_paths:
            media = ReportMedia(
                report_id=report.id,
                storage_path=media_path,
                bucket_name="report-media",
                media_type="image",
                mime_type="image/jpeg",
                moderation_state="pending"
            )
            db.add(media)

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def corroborate_report(db: Session, report_id: UUID, user_id: UUID, req: ReportCorroborateRequest) -> Dict[str, Any]:
        existing = db.query(ReportCorroboration).filter(
            ReportCorroboration.report_id == report_id,
            ReportCorroboration.user_id == user_id
        ).first()

        if existing:
            return {"status": "already_corroborated", "report_id": str(report_id)}

        corroboration = ReportCorroboration(
            report_id=report_id,
            user_id=user_id,
            corroboration_type=req.corroboration_type,
            comment=req.comment
        )
        db.add(corroboration)

        # Increment count on report
        report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
        if report:
            report.corroboration_count += 1

        db.commit()
        return {"status": "success", "corroboration_count": report.corroboration_count if report else 1}
