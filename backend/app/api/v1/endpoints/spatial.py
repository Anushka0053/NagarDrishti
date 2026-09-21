from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.spatial import IdentifyRequest, IdentifyResult, BufferRequest, ProximityRequest, RouteRequest
from app.services.spatial_service import SpatialService
import httpx
from app.core.config import settings

router = APIRouter()


class ResolveLocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinate")


@router.post("/identify", response_model=List[IdentifyResult], tags=["Spatial Analysis"])
def identify_features_at_point(request: IdentifyRequest, db: Session = Depends(get_db)):
    """Identify GIS features, administrative hierarchy and records at clicked map coordinate."""
    return SpatialService.identify_at_coordinate(db, request)


@router.post("/resolve-location", tags=["Spatial Analysis"])
def resolve_location(request: ResolveLocationRequest, db: Session = Depends(get_db)):
    """
    Resolves administrative hierarchy (State > District > City > Ward) for user location / coordinates.
    """
    return SpatialService.resolve_location_hierarchy(db, request.latitude, request.longitude)


@router.post("/buffer", tags=["Spatial Analysis"])
def generate_buffer(request: BufferRequest, db: Session = Depends(get_db)):
    """Generate PostGIS buffer polygon around origin point."""
    from sqlalchemy import text
    query = text("""
        SELECT ST_AsGeoJSON(
            ST_Buffer(
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius_meters
            )::geometry
        )::json AS buffer_geom;
    """)
    row = db.execute(query, {
        "lng": request.origin_longitude,
        "lat": request.origin_latitude,
        "radius_meters": request.buffer_meters
    }).fetchone()

    return {
        "origin": [request.origin_longitude, request.origin_latitude],
        "buffer_meters": request.buffer_meters,
        "buffer_geometry": row.buffer_geom if row else None
    }


@router.post("/proximity", tags=["Spatial Analysis"])
def calculate_proximity(request: ProximityRequest, db: Session = Depends(get_db)):
    """Find nearest facilities and civic features ordered by distance."""
    from sqlalchemy import text
    category_filter = ""
    params = {
        "lng": request.origin_longitude,
        "lat": request.origin_latitude,
        "max_dist": request.max_radius_meters,
        "limit": request.limit
    }
    if request.facility_category:
        category_filter = "AND f.category = :category"
        params["category"] = request.facility_category

    query = text(f"""
        SELECT 
            f.id,
            f.name_en,
            f.name_hi,
            f.category,
            ST_Distance(
                f.geometry::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
            ) AS distance_meters,
            ST_AsGeoJSON(f.geometry)::json AS geometry
        FROM gis_features f
        WHERE f.is_active = TRUE
          {category_filter}
          AND ST_DWithin(
                f.geometry::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :max_dist
          )
        ORDER BY distance_meters ASC
        LIMIT :limit;
    """)

    rows = db.execute(query, params).fetchall()
    return {
        "origin": [request.origin_longitude, request.origin_latitude],
        "results_count": len(rows),
        "results": [
            {
                "id": str(r.id),
                "name_en": r.name_en,
                "name_hi": r.name_hi,
                "category": r.category,
                "distance_meters": round(r.distance_meters, 1),
                "geometry": r.geometry
            }
            for r in rows
        ]
    }


@router.post("/routes", tags=["Spatial Analysis"])
async def calculate_route(request: RouteRequest):
    """
    Calculate route geometry using configured OSRM routing engine.
    If routing engine is unavailable, returns a clean service unavailable error (no fabricated straight-line).
    """
    url = f"{settings.ROUTING_API_URL}/route/v1/{request.profile}/{request.origin_longitude},{request.origin_latitude};{request.destination_longitude},{request.destination_latitude}?overview=full&geometries=geojson"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                routes = data.get("routes", [])
                if routes:
                    primary_route = routes[0]
                    return {
                        "distance_meters": primary_route.get("distance"),
                        "duration_seconds": primary_route.get("duration"),
                        "route_geometry": primary_route.get("geometry"),
                        "civic_issues_along_route": []
                    }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Routing service is currently unreachable ({str(exc)}). Route calculation will be available in Phase 3."
        )

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="No valid road route found between the specified coordinates."
    )
