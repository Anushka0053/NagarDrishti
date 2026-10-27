from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.spatial import (
    IdentifyRequest, IdentifyResult,
    BufferRequest, BufferAnalysisResult,
    ProximityRequest, ProximityAnalysisResult,
    RouteRequest, RouteAnalysisResult,
    MeasureRequest, MeasureResult,
    CompareRequest, CompareResult,
    SuitabilityRequest, SuitabilityResult
)
from app.services.spatial_service import SpatialService

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


@router.post("/buffer", response_model=BufferAnalysisResult, tags=["Spatial Analysis"])
def generate_buffer(request: BufferRequest, db: Session = Depends(get_db)):
    """
    Generate PostGIS buffer polygon around origin point and query features with distance sorting
    and dataset coverage verification.
    """
    return SpatialService.run_buffer_analysis(db, request)


@router.post("/proximity", response_model=ProximityAnalysisResult, tags=["Spatial Analysis"])
def calculate_proximity(request: ProximityRequest, db: Session = Depends(get_db)):
    """
    Find nearest facilities and civic features ordered by distance using PostGIS ST_DWithin.
    """
    return SpatialService.run_proximity_analysis(db, request)


@router.post("/measure", response_model=MeasureResult, tags=["Spatial Analysis"])
def measure_geometry(request: MeasureRequest, db: Session = Depends(get_db)):
    """
    Calculates geodesic distance (LineString) or geodesic area and perimeter (Polygon) using PostGIS.
    """
    return SpatialService.run_measurement(db, request)


@router.post("/compare", response_model=CompareResult, tags=["Spatial Analysis"])
def compare_areas(request: CompareRequest, db: Session = Depends(get_db)):
    """
    Performs comparative analysis between two administrative units or custom areas with coverage warnings.
    """
    return SpatialService.run_comparison(db, request)


@router.post("/suitability", response_model=SuitabilityResult, tags=["Spatial Analysis"])
def calculate_suitability(request: SuitabilityRequest, db: Session = Depends(get_db)):
    """
    Deterministic multi-criteria spatial suitability overlay analysis.
    """
    return SpatialService.run_suitability(db, request)


@router.post("/routes", response_model=RouteAnalysisResult, tags=["Spatial Analysis"])
async def calculate_route(request: RouteRequest, db: Session = Depends(get_db)):
    """
    Calculate route geometry using configured OSRM routing engine with civic corridor issues detection.
    """
    return await SpatialService.run_route_analysis(db, request)
