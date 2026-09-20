from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SectorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name_en: str
    name_hi: str
    icon: str
    display_order: int
    color_hex: str
    is_active: bool


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name_en: str
    name_hi: str
    short_name_en: Optional[str] = None
    short_name_hi: Optional[str] = None
    contact_email: Optional[str] = None
    portal_url: Optional[str] = None
    is_active: bool


class DataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_key: str
    name_en: str
    name_hi: str
    provider: str
    authority_level: str
    homepage_url: Optional[str] = None
    access_type: str
    license_type: str
    attribution_text_en: str
    attribution_text_hi: str
    geographic_coverage: str
    expected_refresh_interval: str
    last_source_update: Optional[datetime] = None
    last_successful_sync: Optional[datetime] = None
    health_status: str
    notes: Optional[str] = None
    is_enabled: bool


class GISLayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name_en: str
    name_hi: str
    description_en: Optional[str] = None
    description_hi: Optional[str] = None
    sector_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    geometry_type: str
    source_type: str
    external_layer_name: Optional[str] = None
    service_url_template: Optional[str] = None
    city_ids: List[UUID] = Field(default_factory=list)
    min_zoom: int = 0
    max_zoom: int = 22
    default_visibility: bool = False
    is_queryable: bool = True
    is_clusterable: bool = False
    display_order: int = 0
    style_config: Dict[str, Any] = Field(default_factory=dict)
    legend_config: Dict[str, Any] = Field(default_factory=dict)
    filter_config: Optional[Dict[str, Any]] = None
    freshness_sla_days: int = 30
    is_active: bool = True

    sector: Optional[SectorResponse] = None
    department: Optional[DepartmentResponse] = None
    source: Optional[DataSourceResponse] = None
