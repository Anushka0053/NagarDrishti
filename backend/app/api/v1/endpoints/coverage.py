from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.admin import City
from app.models.layers import GISLayer, Sector, DataSource, DataCoverage
from app.models.features import GISFeature
from app.schemas.coverage import DataCoverageResponse, CityCoverageSummary

router = APIRouter()


@router.get("", response_model=List[DataCoverageResponse], tags=["Data Coverage"])
def get_coverage_matrix(
    city_id: Optional[UUID] = Query(None, description="Filter coverage by city ID"),
    sector_id: Optional[UUID] = Query(None, description="Filter coverage by sector ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieve the transparent data coverage matrix across all layers and jurisdictions.
    Shows exact coverage status, verified feature counts, provenance, and source freshness.
    """
    query = db.query(DataCoverage)
    if city_id:
        query = query.filter(DataCoverage.city_id == city_id)
    if sector_id:
        query = query.filter(DataCoverage.sector_id == sector_id)

    coverages = query.all()
    results = []

    for cov in coverages:
        layer_slug = cov.layer.slug if cov.layer else None
        layer_name_en = cov.layer.name_en if cov.layer else None
        layer_name_hi = cov.layer.name_hi if cov.layer else None
        sector_name_en = cov.sector.name_en if cov.sector else (cov.layer.sector.name_en if cov.layer and cov.layer.sector else None)
        source_name_en = cov.source.name_en if cov.source else (cov.layer.source.name_en if cov.layer and cov.layer.source else None)

        results.append(DataCoverageResponse(
            id=cov.id,
            city_id=cov.city_id,
            layer_id=cov.layer_id,
            layer_slug=layer_slug,
            layer_name_en=layer_name_en,
            layer_name_hi=layer_name_hi,
            sector_id=cov.sector_id,
            sector_name_en=sector_name_en,
            source_id=cov.source_id,
            source_name_en=source_name_en,
            coverage_status=cov.coverage_status,
            feature_count=cov.feature_count,
            geographic_coverage=cov.geographic_coverage,
            temporal_coverage=cov.temporal_coverage,
            authority_level=cov.authority_level,
            provenance_type=cov.provenance_type,
            last_source_update=cov.last_source_update,
            last_successful_sync=cov.last_successful_sync,
            completeness_notes=cov.completeness_notes
        ))

    return results


@router.get("/city/{city_id}", response_model=CityCoverageSummary, tags=["Data Coverage"])
def get_city_coverage_summary(city_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieve comprehensive data coverage summary for a specific city.
    """
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"City '{city_id}' not found.")

    coverages_db = db.query(DataCoverage).filter(DataCoverage.city_id == city_id).all()
    
    total_layers = len(coverages_db)
    available_layers = sum(1 for c in coverages_db if c.coverage_status == "available")
    partial_layers = sum(1 for c in coverages_db if c.coverage_status == "partial")
    unavailable_layers = sum(1 for c in coverages_db if c.coverage_status in ("unavailable", "credential_required", "integration_pending"))
    total_features = sum(c.feature_count for c in coverages_db)

    coverage_responses = []
    for cov in coverages_db:
        layer_slug = cov.layer.slug if cov.layer else None
        layer_name_en = cov.layer.name_en if cov.layer else None
        layer_name_hi = cov.layer.name_hi if cov.layer else None
        sector_name_en = cov.sector.name_en if cov.sector else (cov.layer.sector.name_en if cov.layer and cov.layer.sector else None)
        source_name_en = cov.source.name_en if cov.source else (cov.layer.source.name_en if cov.layer and cov.layer.source else None)

        coverage_responses.append(DataCoverageResponse(
            id=cov.id,
            city_id=cov.city_id,
            layer_id=cov.layer_id,
            layer_slug=layer_slug,
            layer_name_en=layer_name_en,
            layer_name_hi=layer_name_hi,
            sector_id=cov.sector_id,
            sector_name_en=sector_name_en,
            source_id=cov.source_id,
            source_name_en=source_name_en,
            coverage_status=cov.coverage_status,
            feature_count=cov.feature_count,
            geographic_coverage=cov.geographic_coverage,
            temporal_coverage=cov.temporal_coverage,
            authority_level=cov.authority_level,
            provenance_type=cov.provenance_type,
            last_source_update=cov.last_source_update,
            last_successful_sync=cov.last_successful_sync,
            completeness_notes=cov.completeness_notes
        ))

    return CityCoverageSummary(
        city_id=city.id,
        city_name_en=city.name_en,
        city_name_hi=city.name_hi,
        total_layers=total_layers,
        available_layers=available_layers,
        partial_layers=partial_layers,
        unavailable_layers=unavailable_layers,
        total_features=total_features,
        coverages=coverage_responses
    )
