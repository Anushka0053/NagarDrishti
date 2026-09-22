from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CitizenReportCreate(BaseModel):
    city_id: UUID
    ward_id: Optional[UUID] = None
    locality_id: Optional[UUID] = None
    category: str
    subcategory: Optional[str] = None
    title: Optional[str] = None
    description: str
    latitude: float
    longitude: float
    location_address: Optional[str] = None
    severity_input: Optional[str] = "medium"
    input_language: Optional[str] = "hi"
    is_anonymous: Optional[bool] = False
    media_paths: Optional[List[str]] = Field(default_factory=list)


class ReportMediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    storage_path: str
    media_type: str
    mime_type: str
    moderation_state: str
    created_at: datetime


class ReportStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    previous_status: Optional[str] = None
    new_status: str
    actor_role: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime


class CitizenReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    report_number: str
    city_id: UUID
    ward_id: Optional[UUID] = None
    category: str
    subcategory: Optional[str] = None
    title: Optional[str] = None
    description: str
    latitude: float
    longitude: float
    location_address: Optional[str] = None
    severity_input: str
    status: str
    provenance_type: str = "citizen_submitted"
    is_public: bool
    corroboration_count: int
    created_at: datetime
    updated_at: datetime
    media: List[ReportMediaResponse] = Field(default_factory=list)
    status_history: List[ReportStatusHistoryResponse] = Field(default_factory=list)


class ReportCorroborateRequest(BaseModel):
    corroboration_type: str = "confirm_issue"
    comment: Optional[str] = None
