from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class IdentifyRequest(BaseModel):
    latitude: float
    longitude: float
    city_id: Optional[UUID] = None
    tolerance_meters: Optional[float] = 25.0
    active_layer_ids: Optional[List[UUID]] = None


class IdentifyResult(BaseModel):
    feature_id: Optional[str] = None
    layer_id: Optional[str] = None
    layer_name_en: Optional[str] = None
    layer_name_hi: Optional[str] = None
    name_en: Optional[str] = None
    name_hi: Optional[str] = None
    category: Optional[str] = None
    distance_meters: Optional[float] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    admin_hierarchy: Dict[str, Any] = Field(default_factory=dict)
    provenance_type: Optional[str] = "official_verified"
    source_attribution_en: Optional[str] = None
    source_attribution_hi: Optional[str] = None
    source_health: Optional[str] = None
    last_updated: Optional[str] = None


class BufferRequest(BaseModel):
    origin_latitude: float
    origin_longitude: float
    buffer_meters: float = Field(default=500.0, ge=10.0, le=50000.0)
    target_layer_ids: Optional[List[UUID]] = None


class ProximityRequest(BaseModel):
    origin_latitude: float
    origin_longitude: float
    facility_category: Optional[str] = None
    layer_id: Optional[UUID] = None
    max_radius_meters: float = Field(default=3000.0, ge=50.0, le=50000.0)
    limit: int = Field(default=10, ge=1, le=50)


class RouteRequest(BaseModel):
    origin_latitude: float
    origin_longitude: float
    destination_latitude: float
    destination_longitude: float
    profile: Optional[str] = "driving"  # 'driving', 'walking', 'cycling'
    include_civic_issues: bool = True
