from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import verify_supabase_jwt
from app.models.feedback import CitizenReport, ReportStatusHistory, ReportMedia
from app.schemas.feedback import (
    CitizenReportCreate,
    ReportCorroborateRequest,
    CitizenReportStatusUpdate
)
from app.services.feedback_service import FeedbackService
from app.services.intelligence_service import IntelligenceService
from app.schemas.intelligence import IndividualReportAIAnalysisResponse

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED, tags=["Citizen Feedback"])
def submit_feedback(
    report_in: CitizenReportCreate,
    claims: Optional[dict] = Depends(verify_supabase_jwt),
    db: Session = Depends(get_db)
):
    """
    Submit a citizen issue report with category, location, and optional media.
    Automatically triggers Sarvam AI categorization, urgency rating, and PostGIS duplicate check.
    """
    reporter_id = None
    if claims and "sub" in claims:
        try:
            reporter_id = UUID(claims["sub"])
        except Exception:
            pass

    report = FeedbackService.create_report(db, report_in, reporter_id=reporter_id)
    return {
        "status": "success",
        "message": "Citizen report submitted successfully with automated AI triage.",
        "report_id": str(report.id),
        "report_number": report.report_number,
        "initial_status": report.status,
        "ai_metadata": report.ai_metadata
    }


@router.get("/map-features", tags=["Citizen Feedback"])
def get_reports_map_features(
    city_id: Optional[UUID] = Query(None),
    ward_id: Optional[UUID] = Query(None),
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    bbox: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Returns citizen reports formatted as a GeoJSON FeatureCollection for MapLibre map rendering.
    Enables category-specific icons, status badges, and interactive popups/inspectors.
    """
    extra_filters = ""
    params: Dict[str, Any] = {"limit": limit}

    if city_id:
        extra_filters += " AND r.city_id = :city_id"
        params["city_id"] = str(city_id)
    if ward_id:
        extra_filters += " AND r.ward_id = :ward_id"
        params["ward_id"] = str(ward_id)
    if category and category != "all":
        extra_filters += " AND r.category = :category"
        params["category"] = category
    if status_filter and status_filter != "all":
        extra_filters += " AND r.status = :status"
        params["status"] = status_filter

    if bbox:
        try:
            coords = [float(c.strip()) for c in bbox.split(",")]
            if len(coords) == 4:
                extra_filters += " AND r.location_geometry && ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326)"
                params["min_lng"] = coords[0]
                params["min_lat"] = coords[1]
                params["max_lng"] = coords[2]
                params["max_lat"] = coords[3]
        except Exception:
            pass

    query = text(f"""
        SELECT 
            r.id,
            r.report_number,
            r.city_id,
            r.category,
            r.title,
            r.description,
            r.status,
            r.severity_input,
            r.is_demo,
            r.corroboration_count,
            r.location_address,
            ST_X(r.location_geometry) AS longitude,
            ST_Y(r.location_geometry) AS latitude,
            r.created_at
        FROM citizen_reports r
        WHERE r.is_public = TRUE AND r.status != 'rejected_spam' {extra_filters}
        ORDER BY r.created_at DESC
        LIMIT :limit;
    """)

    rows = db.execute(query, params).fetchall()

    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "id": str(r.id),
            "geometry": {
                "type": "Point",
                "coordinates": [r.longitude, r.latitude]
            },
            "properties": {
                "id": str(r.id),
                "report_number": r.report_number,
                "city_id": str(r.city_id),
                "category": r.category,
                "title": r.title,
                "description": r.description,
                "status": str(r.status),
                "severity": r.severity_input,
                "is_demo": bool(getattr(r, "is_demo", False)),
                "corroboration_count": r.corroboration_count,
                "location_address": r.location_address,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }


@router.get("", tags=["Citizen Feedback"])
def list_reports(
    city_id: Optional[UUID] = Query(None),
    ward_id: Optional[UUID] = Query(None),
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    department_id: Optional[UUID] = Query(None),
    reporter_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    include_demo: bool = Query(True),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    List citizen reports with comprehensive multi-attribute filtering,
    full-text keyword search, and pagination.
    """
    extra_filters = ""
    params: Dict[str, Any] = {"limit": limit, "offset": offset}

    if city_id:
        extra_filters += " AND r.city_id = :city_id"
        params["city_id"] = str(city_id)
    if ward_id:
        extra_filters += " AND r.ward_id = :ward_id"
        params["ward_id"] = str(ward_id)
    if department_id:
        extra_filters += " AND r.department_id = :department_id"
        params["department_id"] = str(department_id)
    if reporter_id:
        extra_filters += " AND r.reporter_id = :reporter_id"
        params["reporter_id"] = str(reporter_id)
    if category and category != "all":
        extra_filters += " AND r.category = :category"
        params["category"] = category
    if status_filter and status_filter != "all":
        extra_filters += " AND r.status = :status"
        params["status"] = status_filter
    if not include_demo:
        extra_filters += " AND r.is_demo = FALSE"

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        extra_filters += " AND (r.report_number ILIKE :search OR r.title ILIKE :search OR r.description ILIKE :search OR r.location_address ILIKE :search)"
        params["search"] = search_pattern

    # Count total matching query
    count_query = text(f"""
        SELECT COUNT(*) 
        FROM citizen_reports r
        WHERE r.is_public = TRUE AND r.status != 'rejected_spam' {extra_filters};
    """)
    total = db.execute(count_query, params).scalar() or 0

    query = text(f"""
        SELECT 
            r.id,
            r.report_number,
            r.city_id,
            r.ward_id,
            r.category,
            r.subcategory,
            r.title,
            r.description,
            r.severity_input,
            r.status,
            r.provenance_type,
            r.corroboration_count,
            r.ai_metadata,
            r.assigned_officer_name,
            r.department_id,
            r.resolution_summary,
            r.resolved_at,
            r.is_demo,
            ST_X(r.location_geometry) AS longitude,
            ST_Y(r.location_geometry) AS latitude,
            r.location_address,
            r.created_at,
            r.updated_at
        FROM citizen_reports r
        WHERE r.is_public = TRUE AND r.status != 'rejected_spam' {extra_filters}
        ORDER BY r.created_at DESC
        LIMIT :limit OFFSET :offset;
    """)
    rows = db.execute(query, params).fetchall()

    return [
        {
            "id": str(r.id),
            "report_number": r.report_number,
            "city_id": str(r.city_id),
            "ward_id": str(r.ward_id) if r.ward_id else None,
            "category": r.category,
            "subcategory": r.subcategory,
            "title": r.title,
            "description": r.description,
            "severity_input": r.severity_input,
            "status": str(r.status),
            "provenance_type": r.provenance_type or "citizen_submitted",
            "corroboration_count": r.corroboration_count,
            "ai_metadata": r.ai_metadata or {},
            "assigned_officer_name": r.assigned_officer_name,
            "department_id": str(r.department_id) if r.department_id else None,
            "resolution_summary": r.resolution_summary,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
            "is_demo": bool(getattr(r, "is_demo", False)),
            "latitude": r.latitude,
            "longitude": r.longitude,
            "location_address": r.location_address,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat() if r.updated_at else r.created_at.isoformat(),
            "total_count": total
        }
        for r in rows
    ]


@router.get("/{report_id}", tags=["Citizen Feedback"])
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of a single report including AI triage and status history by UUID or report_number."""
    report = FeedbackService.resolve_report_by_identifier(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{report_id}' not found in municipal records.")

    history = db.query(ReportStatusHistory).filter(
        ReportStatusHistory.report_id == report.id
    ).order_by(ReportStatusHistory.created_at.asc()).all()

    media_items = db.query(ReportMedia).filter(
        ReportMedia.report_id == report.id
    ).order_by(ReportMedia.created_at.asc()).all()

    coords = db.execute(text("SELECT ST_X(location_geometry) AS lng, ST_Y(location_geometry) AS lat FROM citizen_reports WHERE id = :id"), {"id": report.id}).fetchone()

    return {
        "id": str(report.id),
        "report_number": report.report_number,
        "city_id": str(report.city_id),
        "ward_id": str(report.ward_id) if report.ward_id else None,
        "category": report.category,
        "subcategory": report.subcategory,
        "title": report.title,
        "description": report.description,
        "severity_input": report.severity_input,
        "status": str(report.status),
        "provenance_type": report.provenance_type,
        "corroboration_count": report.corroboration_count,
        "ai_metadata": report.ai_metadata,
        "assigned_officer_name": report.assigned_officer_name,
        "department_id": str(report.department_id) if report.department_id else None,
        "resolution_summary": report.resolution_summary,
        "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None,
        "is_demo": bool(getattr(report, "is_demo", False)),
        "latitude": coords.lat if coords else 26.2183,
        "longitude": coords.lng if coords else 78.1828,
        "location_address": report.location_address,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
        "media": [
            {
                "id": str(m.id),
                "storage_path": m.storage_path,
                "media_type": m.media_type,
                "mime_type": m.mime_type
            }
            for m in media_items
        ],
        "status_history": [
            {
                "id": str(h.id),
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "actor_role": h.actor_role,
                "reason": h.reason,
                "notes": h.notes,
                "created_at": h.created_at.isoformat()
            }
            for h in history
        ]
    }


@router.post("/{report_id}/analyze-ai", response_model=IndividualReportAIAnalysisResponse, tags=["Citizen Feedback"])
def trigger_individual_ai_analysis(report_id: str, db: Session = Depends(get_db)):
    """Run Sarvam AI issue analysis, duplicate check, and recommendation on a report by UUID or report_number."""
    report = FeedbackService.resolve_report_by_identifier(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{report_id}' not found.")
    try:
        return IntelligenceService.analyze_individual_report(db, report.id)
    except LookupError as le:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(le))


@router.patch("/{report_id}/status", tags=["Citizen Feedback"])
def update_report_status(
    report_id: str,
    update_in: CitizenReportStatusUpdate,
    claims: Optional[dict] = Depends(verify_supabase_jwt),
    db: Session = Depends(get_db)
):
    """Update report operational lifecycle status with audit history by UUID or report_number."""
    report = FeedbackService.resolve_report_by_identifier(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{report_id}' not found.")

    user_id = None
    role = "department_officer"
    if claims and "sub" in claims:
        try:
            user_id = UUID(claims["sub"])
            role = claims.get("role", "department_officer")
        except Exception:
            pass

    try:
        updated_report = FeedbackService.update_report_status(
            db=db,
            report_id=report.id,
            new_status=update_in.status,
            changed_by_user_id=user_id,
            actor_role=role,
            reason=update_in.reason,
            notes=update_in.notes,
            assigned_officer_name=update_in.assigned_officer_name,
            department_id=update_in.department_id,
            resolution_summary=update_in.resolution_summary
        )
        return {
            "status": "success",
            "message": f"Report status transitioned to '{update_in.status}'",
            "report_id": str(updated_report.id),
            "report_number": updated_report.report_number,
            "current_status": updated_report.status,
            "resolved_at": updated_report.resolved_at.isoformat() if updated_report.resolved_at else None
        }
    except LookupError as le:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(le))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post("/{report_id}/corroborate", tags=["Citizen Feedback"])
@router.post("/{report_id}/confirm", tags=["Citizen Feedback"])
def corroborate_or_confirm_report(
    report_id: str,
    req: Optional[ReportCorroborateRequest] = None,
    claims: Optional[dict] = Depends(verify_supabase_jwt),
    db: Session = Depends(get_db)
):
    """Corroborate / confirm an existing citizen report by UUID or human-readable report_number (e.g. ND-MP-2026-7366)."""
    user_id = None
    if claims and "sub" in claims:
        try:
            user_id = UUID(claims["sub"])
        except Exception:
            pass
    if not user_id:
        import uuid
        user_id = uuid.uuid4()

    if req is None:
        req = ReportCorroborateRequest()

    try:
        return FeedbackService.corroborate_report_by_identifier(db, report_id, user_id, req)
    except LookupError as le:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(le))
