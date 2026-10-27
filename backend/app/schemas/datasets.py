from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class DatasetValidateResponse(BaseModel):
    filename: str
    file_format: str
    feature_count: int
    detected_crs: str
    geometry_types: List[str]
    bounding_box: List[float] = Field(default_factory=list, description="[min_lng, min_lat, max_lng, max_lat]")
    sample_properties: List[str] = Field(default_factory=list)
    sample_features: List[Dict[str, Any]] = Field(default_factory=list)
    valid_record_count: int
    invalid_record_count: int
    validation_warnings: List[str] = Field(default_factory=list)
    validation_token: str


class DatasetImportRequest(BaseModel):
    validation_token: str
    city_id: UUID
    layer_id: UUID
    source_name: str
    provenance_type: str = "official_verified"  # 'official_verified', 'community_open', 'development_fixture'
    authority_level: str = "verified_urban_local_body"
    field_mappings: Dict[str, str] = Field(
        default_factory=dict,
        description="Mappings for name_en, name_hi, category, subcategory from source properties"
    )


class DatasetImportResponse(BaseModel):
    ingestion_run_id: Optional[str] = None
    city_id: str
    layer_id: str
    records_imported: int
    records_rejected: int
    provenance_type: str
    status: str
    message: str


class AdminCreateFeatureRequest(BaseModel):
    city_id: UUID
    layer_id: UUID
    ward_id: Optional[UUID] = None
    name_en: str
    name_hi: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    geometry: Dict[str, Any] = Field(..., description="GeoJSON geometry object")
    properties: Dict[str, Any] = Field(default_factory=dict)
    provenance_type: str = "official_verified"
    source_description: Optional[str] = "Admin manual entry"


class AdminFeatureResponse(BaseModel):
    id: str
    name_en: str
    category: Optional[str]
    provenance_type: str
    created_at: str
