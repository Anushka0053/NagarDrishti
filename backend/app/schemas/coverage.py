from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DataCoverageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    layer_id: Optional[UUID] = None
    layer_slug: Optional[str] = None
    layer_name_en: Optional[str] = None
    layer_name_hi: Optional[str] = None
    sector_id: Optional[UUID] = None
    sector_name_en: Optional[str] = None
    source_id: Optional[UUID] = None
    source_name_en: Optional[str] = None
    coverage_status: str
    feature_count: int = 0
    geographic_coverage: Optional[str] = "Municipal Area"
    temporal_coverage: Optional[str] = None
    authority_level: Optional[str] = None
    provenance_type: str = "official_verified"
    last_source_update: Optional[datetime] = None
    last_successful_sync: Optional[datetime] = None
    completeness_notes: Optional[str] = None


class CityCoverageSummary(BaseModel):
    city_id: UUID
    city_name_en: str
    city_name_hi: str
    total_layers: int
    available_layers: int
    partial_layers: int
    unavailable_layers: int
    total_features: int
    coverages: List[DataCoverageResponse]
