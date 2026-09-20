from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.models.features import GISFeature
from app.schemas.features import GISFeatureDetailResponse

router = APIRouter()


@router.get("/{feature_id}", response_model=GISFeatureDetailResponse, tags=["Features"])
def get_feature_by_id(feature_id: UUID, db: Session = Depends(get_db)):
    """Retrieve complete details, properties and provenance for a single geographic feature."""
    query = text("""
        SELECT 
            f.id,
            f.layer_id,
            f.city_id,
            f.ward_id,
            f.locality_id,
            f.source_id,
            f.external_id,
            f.name_en,
            f.name_hi,
            f.category,
            f.subcategory,
            ST_AsGeoJSON(f.geometry)::json AS geojson_geometry,
            f.properties,
            f.observed_at,
            f.source_updated_at,
            ds.attribution_text_en,
            ds.attribution_text_hi
        FROM gis_features f
        LEFT JOIN data_sources ds ON f.source_id = ds.id
        WHERE f.id = :feature_id AND f.is_active = TRUE;
    """)

    row = db.execute(query, {"feature_id": feature_id}).fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Feature '{feature_id}' not found.")

    return GISFeatureDetailResponse(
        id=row.id,
        layer_id=row.layer_id,
        city_id=row.city_id,
        ward_id=row.ward_id,
        locality_id=row.locality_id,
        source_id=row.source_id,
        external_id=row.external_id,
        name_en=row.name_en,
        name_hi=row.name_hi,
        category=row.category,
        subcategory=row.subcategory,
        geojson_geometry=row.geojson_geometry,
        properties=row.properties or {},
        observed_at=row.observed_at,
        source_updated_at=row.source_updated_at,
        source_attribution_en=row.attribution_text_en,
        source_attribution_hi=row.attribution_text_hi
    )
