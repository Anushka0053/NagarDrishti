from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.schemas.intelligence import EntityIntelligenceBundle, IssueClusterResponse
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


@router.get("/{entity_type}/{entity_id}", response_model=EntityIntelligenceBundle, tags=["Civic Intelligence"])
def get_intelligence_overview(entity_type: str, entity_id: UUID, db: Session = Depends(get_db)):
    """Retrieve comprehensive, explainable evidence bundle for a ward, city, or facility."""
    return IntelligenceService.get_entity_intelligence(db, entity_type, entity_id)
