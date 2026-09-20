from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict


class AdminUnitBase(BaseModel):
    name_en: str
    name_hi: str
    slug: str
    unit_type: str
    parent_id: Optional[UUID] = None
    lgd_code: Optional[str] = None
    census_code: Optional[str] = None
    state_code: Optional[str] = "MP"
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None


class AdminUnitResponse(AdminUnitBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class WardBase(BaseModel):
    ward_number: int
    ward_code: Optional[str] = None
    name_en: str
    name_hi: str
    zone_number: Optional[int] = None
    zone_name_en: Optional[str] = None
    zone_name_hi: Optional[str] = None
    corporator_name: Optional[str] = None
    corporator_contact: Optional[str] = None
    sanitation_inspector_contact: Optional[str] = None
    population: Optional[int] = None
    area_sq_km: Optional[float] = None
    properties: Optional[Dict[str, Any]] = None
    is_active: bool = True


class WardResponse(WardBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    geojson_geometry: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class CityBase(BaseModel):
    name_en: str
    name_hi: str
    slug: str
    ulb_type: str = "nagar_nigam"
    lgd_code: Optional[str] = None
    center_latitude: float
    center_longitude: float
    default_zoom: int = 12
    min_zoom: int = 9
    max_zoom: int = 19
    population_census: Optional[int] = None
    area_sq_km: Optional[float] = None
    is_reference_city: bool = False
    is_enabled: bool = True
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)


class CityResponse(CityBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    admin_unit_id: Optional[UUID] = None
    district_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
