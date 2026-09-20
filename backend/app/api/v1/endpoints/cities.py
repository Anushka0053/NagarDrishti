from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.models.admin import City, Ward
from app.schemas.admin import CityResponse, WardResponse

router = APIRouter()


@router.get("", response_model=List[CityResponse], tags=["Cities"])
def get_enabled_cities(db: Session = Depends(get_db)):
    """Retrieve enabled Madhya Pradesh cities/ULBs."""
    return db.query(City).filter(City.is_enabled == True).order_by(City.is_reference_city.desc(), City.name_en.asc()).all()


@router.get("/{city_id}", response_model=CityResponse, tags=["Cities"])
def get_city_details(city_id: UUID, db: Session = Depends(get_db)):
    """Retrieve metadata and bounding box for a specific city."""
    city = db.query(City).filter(City.id == city_id, City.is_enabled == True).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"City with id '{city_id}' not found.")
    return city


@router.get("/{city_id}/wards", response_model=List[WardResponse], tags=["Cities"])
def get_city_wards(city_id: UUID, db: Session = Depends(get_db)):
    """Retrieve all municipal wards for a city."""
    wards = db.query(Ward).filter(Ward.city_id == city_id, Ward.is_active == True).order_by(Ward.ward_number.asc()).all()
    return wards
