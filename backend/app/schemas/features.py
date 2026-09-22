from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[str] = None
    geometry: GeoJSONGeometry
    properties: Dict[str, Any] = Field(default_factory=dict)


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
    total_count: Optional[int] = None
    layer_id: Optional[str] = None


class GISFeatureDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    layer_id: UUID
    city_id: Optional[UUID] = None
    ward_id: Optional[UUID] = None
    locality_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    external_id: Optional[str] = None
    name_en: Optional[str] = None
    name_hi: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    geojson_geometry: Dict[str, Any]
    properties: Dict[str, Any]
    observed_at: Optional[datetime] = None
    source_updated_at: Optional[datetime] = None
    provenance_type: str = "official_verified"
    source_attribution_en: Optional[str] = None
    source_attribution_hi: Optional[str] = None
