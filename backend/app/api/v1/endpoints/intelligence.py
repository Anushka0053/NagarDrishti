from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.schemas.intelligence import (
    EntityIntelligenceBundle,
    IssueClusterResponse,
    AreaReportPreviewRequest,
    AreaReportGenerateRequest,
    AreaReportUpdateRequest,
    AreaIntelligenceReportResponse,
    IndividualReportAIAnalysisResponse
)
from app.services.intelligence_service import IntelligenceService
from app.models.intelligence import IssueCluster

router = APIRouter()


@router.get("/clusters", response_model=List[IssueClusterResponse], tags=["Civic Intelligence"])
def get_active_issue_clusters(city_id: Optional[UUID] = Query(None), db: Session = Depends(get_db)):
    """Retrieve active spatial issue clusters, optionally scoped to a city."""
    extra_filter = ""
    params = {}
    if city_id:
        extra_filter = " AND city_id = :city_id"
        params["city_id"] = city_id

    query = text(f"""
        SELECT 
            id,
            city_id,
            ward_id,
            category,
            cluster_title_en,
            cluster_title_hi,
            ST_Y(centroid) AS latitude,
            ST_X(centroid) AS longitude,
            report_count,
            unresolved_count,
            composite_risk_score,
            cluster_status,
            provenance_type,
            first_reported_at,
            last_reported_at
        FROM issue_clusters
        WHERE cluster_status = 'active' {extra_filter};
    """)
    rows = db.execute(query, params).fetchall()
    return [
        IssueClusterResponse(
            id=r.id,
            city_id=r.city_id,
            ward_id=r.ward_id,
            category=r.category,
            cluster_title_en=r.cluster_title_en,
            cluster_title_hi=r.cluster_title_hi,
            latitude=r.latitude,
            longitude=r.longitude,
            report_count=r.report_count,
            unresolved_count=r.unresolved_count,
            composite_risk_score=r.composite_risk_score,
            cluster_status=r.cluster_status,
            provenance_type=r.provenance_type or "internal_derived",
            first_reported_at=r.first_reported_at,
            last_reported_at=r.last_reported_at
        )
        for r in rows
    ]


@router.post("/area-reports/preview", tags=["Civic Intelligence"])
@router.post("/area-report/preview", tags=["Civic Intelligence"])
def preview_area_report_data(req: AreaReportPreviewRequest, db: Session = Depends(get_db)):
    """Fetch matching actual citizen reports for a proposed area synthesis before generating."""
    return IntelligenceService.preview_area_reports(db, req)


@router.post("/area-reports/generate", response_model=AreaIntelligenceReportResponse, tags=["Civic Intelligence"])
@router.post("/area-report/generate", response_model=AreaIntelligenceReportResponse, tags=["Civic Intelligence"])
def generate_area_report(req: AreaReportGenerateRequest, db: Session = Depends(get_db)):
    """
    Synthesize matching reports in an area into a grounded, comprehensive AI Area Intelligence Report
    using Sarvam AI. Persists to ai_reports table.
    """
    return IntelligenceService.generate_consolidated_area_report(db, req)


@router.get("/area-reports", tags=["Civic Intelligence"])
@router.get("/area-report", tags=["Civic Intelligence"])
def list_area_reports(city_id: Optional[UUID] = Query(None), limit: int = Query(20, ge=1, le=50), db: Session = Depends(get_db)):
    """List historical and active AI Area Intelligence Reports."""
    return IntelligenceService.list_area_reports(db, city_id=city_id, limit=limit)


@router.get("/area-reports/{report_id}", response_model=AreaIntelligenceReportResponse, tags=["Civic Intelligence"])
@router.get("/area-report/{report_id}", response_model=AreaIntelligenceReportResponse, tags=["Civic Intelligence"])
def get_area_report(report_id: UUID, db: Session = Depends(get_db)):
    """Retrieve full details of an AI Area Intelligence Report."""
    rep = IntelligenceService.get_area_report_by_id(db, report_id)
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Area report '{report_id}' not found.")
    return rep


@router.patch("/area-reports/{report_id}", response_model=AreaIntelligenceReportResponse, tags=["Civic Intelligence"])
@router.patch("/area-report/{report_id}", response_model=AreaIntelligenceReportResponse, tags=["Civic Intelligence"])
def update_area_report(report_id: UUID, req: AreaReportUpdateRequest, db: Session = Depends(get_db)):
    """Allow authorized municipal officers to edit findings or approve the report."""
    try:
        return IntelligenceService.update_area_report(db, report_id, req)
    except LookupError as le:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(le))


@router.post("/reports/{report_id}/analyze", response_model=IndividualReportAIAnalysisResponse, tags=["Civic Intelligence"])
def analyze_individual_report(report_id: UUID, db: Session = Depends(get_db)):
    """
    Execute individual AI triage, category & department verification, urgency rating,
    duplicate scanning, and recommendations for a single citizen issue.
    """
    try:
        return IntelligenceService.analyze_individual_report(db, report_id)
    except LookupError as le:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(le))


@router.get("/{entity_type}/{entity_id}", response_model=EntityIntelligenceBundle, tags=["Civic Intelligence"])
def get_intelligence_overview(
    entity_type: str,
    entity_id: str,
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """
    Retrieve comprehensive, explainable evidence bundle for a facility, road, ward, or city.
    Performs live spatial queries for citizen reports located at or near the entity.
    """
    return IntelligenceService.get_entity_intelligence(
        db, entity_type, entity_id, category=category, status=status_filter
    )
