from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.layers import GISLayer, Sector, Department
from app.schemas.layers import GISLayerResponse, SectorResponse, DepartmentResponse
from app.services.spatial_service import SpatialService

router = APIRouter()


@router.get("", response_model=List[GISLayerResponse], tags=["Layers"])
def get_layers(
    city_id: Optional[UUID] = Query(None, description="Filter layers enabled for a specific city"),
    sector_id: Optional[UUID] = Query(None, description="Filter layers by sector"),
    department_id: Optional[UUID] = Query(None, description="Filter layers by department"),
    db: Session = Depends(get_db)
):
    """Retrieve metadata-driven dynamic GIS layers."""
    query = db.query(GISLayer).filter(GISLayer.is_active == True)
    if sector_id:
        query = query.filter(GISLayer.sector_id == sector_id)
    if department_id:
        query = query.filter(GISLayer.department_id == department_id)
    
    layers = query.order_by(GISLayer.display_order.asc()).all()
    
    # Filter by city if specified
    if city_id:
        layers = [l for l in layers if not l.city_ids or city_id in l.city_ids]
        
    return layers


@router.get("/sectors", response_model=List[SectorResponse], tags=["Layers"])
def get_sectors(db: Session = Depends(get_db)):
    """Retrieve all active sectors taxonomy."""
    return db.query(Sector).filter(Sector.is_active == True).order_by(Sector.display_order.asc()).all()


@router.get("/departments", response_model=List[DepartmentResponse], tags=["Layers"])
def get_departments(db: Session = Depends(get_db)):
    """Retrieve government departments list."""
    return db.query(Department).filter(Department.is_active == True).order_by(Department.name_en.asc()).all()


@router.get("/{layer_id}", response_model=GISLayerResponse, tags=["Layers"])
def get_layer_by_id(layer_id: UUID, db: Session = Depends(get_db)):
    """Retrieve detailed metadata and styling config for a specific GIS layer."""
    layer = db.query(GISLayer).filter(GISLayer.id == layer_id, GISLayer.is_active == True).first()
    if not layer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Layer '{layer_id}' not found.")
    return layer


@router.get("/{layer_id}/features", tags=["Layers"])
def get_layer_features(
    layer_id: UUID,
    city_id: Optional[UUID] = Query(None, description="Filter by city"),
    ward_id: Optional[UUID] = Query(None, description="Filter by ward"),
    bbox: Optional[str] = Query(None, description="Bounding box comma-separated: min_lng,min_lat,max_lng,max_lat"),
    db: Session = Depends(get_db)
):
    """Retrieve layer features as GeoJSON FeatureCollection."""
    bbox_coords = None
    if bbox:
        try:
            bbox_coords = [float(c.strip()) for c in bbox.split(",")]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Expected: min_lng,min_lat,max_lng,max_lat")

    return SpatialService.get_features_geojson(db, layer_id=layer_id, city_id=city_id, ward_id=ward_id, bbox=bbox_coords)
