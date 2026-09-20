from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict


class IssueClusterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: Optional[UUID] = None
    category: str
    cluster_title_en: Optional[str] = None
    cluster_title_hi: Optional[str] = None
    latitude: float
    longitude: float
    report_count: int
    unresolved_count: int
    composite_risk_score: float
    cluster_status: str
    first_reported_at: datetime
    last_reported_at: datetime


class RiskScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entity_type: str
    entity_id: UUID
    score: float
    score_grade: Optional[str] = None
    components: Dict[str, Any]
    formula_version: str
    computed_at: datetime


class PublicRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    record_type: str
    title_en: str
    title_hi: str
    reference_number: Optional[str] = None
    content_summary_en: Optional[str] = None
    content_summary_hi: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    record_date: date
    original_document_url: Optional[str] = None
    is_verified: bool


class NewsMentionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    publication_name: str
    headline: str
    article_excerpt: Optional[str] = None
    article_url: str
    published_at: datetime
    sentiment_label: Optional[str] = None


class EntityIntelligenceBundle(BaseModel):
    entity_type: str
    entity_id: UUID
    title_en: str
    title_hi: str
    risk_score: Optional[RiskScoreResponse] = None
    active_reports_count: int = 0
    resolved_reports_count: int = 0
    recent_reports: List[Dict[str, Any]] = Field(default_factory=list)
    public_records: List[PublicRecordResponse] = Field(default_factory=list)
    news_mentions: List[NewsMentionResponse] = Field(default_factory=list)
    ai_grounded_summary_hi: Optional[str] = None
    ai_grounded_summary_en: Optional[str] = None
    data_freshness_status: str = "healthy"
