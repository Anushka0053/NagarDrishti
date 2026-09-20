from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import verify_supabase_jwt
from app.models.feedback import CitizenReport
from app.schemas.feedback import CitizenReportCreate, CitizenReportResponse, ReportCorroborateRequest
from app.services.feedback_service import FeedbackService

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED, tags=["Citizen Feedback"])
def submit_feedback(
    report_in: CitizenReportCreate,
    claims: Optional[dict] = Depends(verify_supabase_jwt),
    db: Session = Depends(get_db)
):
    """Submit a citizen issue report with category, location, and optional media."""
    reporter_id = None
    if claims and "sub" in claims:
        try:
            reporter_id = UUID(claims["sub"])
        except Exception:
            pass

    report = FeedbackService.create_report(db, report_in, reporter_id=reporter_id)
    return {
        "status": "success",
        "message": "Citizen report submitted successfully.",
        "report_id": str(report.id),
        "report_number": report.report_number,
        "initial_status": report.status
    }


@router.get("", tags=["Citizen Feedback"])
def list_reports(
    city_id: Optional[UUID] = Query(None),
    ward_id: Optional[UUID] = Query(None),
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """List public, accepted citizen reports."""
    query = text("""
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
            r.corroboration_count,
            ST_X(r.location_geometry) AS longitude,
            ST_Y(r.location_geometry) AS latitude,
            r.location_address,
            r.created_at
        FROM citizen_reports r
        WHERE r.is_public = TRUE AND r.status != 'rejected_spam'
        ORDER BY r.created_at DESC
        LIMIT 50;
    """)
    rows = db.execute(query).fetchall()
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
            "status": r.status,
            "corroboration_count": r.corroboration_count,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "location_address": r.location_address,
            "created_at": r.created_at.isoformat()
        }
        for r in rows
    ]


@router.post("/{report_id}/corroborate", tags=["Citizen Feedback"])
def corroborate_report(
    report_id: UUID,
    req: ReportCorroborateRequest,
    claims: Optional[dict] = Depends(verify_supabase_jwt),
    db: Session = Depends(get_db)
):
    """Corroborate / validate an existing citizen report."""
    user_id = UUID(claims["sub"]) if claims and "sub" in claims else None
    if not user_id:
        # Generate temporary anonymous voter UUID for test environment
        import uuid
        user_id = uuid.uuid4()

    return FeedbackService.corroborate_report(db, report_id, user_id, req)
