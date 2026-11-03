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
    provenance_type: str = "internal_derived"
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


class AreaReportPreviewRequest(BaseModel):
    city_id: UUID
    ward_id: Optional[UUID] = None
    bbox: Optional[List[float]] = None  # [min_lng, min_lat, max_lng, max_lat]
    categories: Optional[List[str]] = None
    statuses: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class AreaReportGenerateRequest(AreaReportPreviewRequest):
    title: Optional[str] = None
    language: str = "en"  # "en" or "hi"
    notes: Optional[str] = None


class AreaReportUpdateRequest(BaseModel):
    title: Optional[str] = None
    executive_summary: Optional[str] = None
    recommended_actions: Optional[List[str]] = None
    status: Optional[str] = None  # "draft", "reviewed", "approved"
    approved_by: Optional[str] = None


class AreaIntelligenceReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    report_number: str
    title: str
    city_id: UUID
    city_name: str
    ward_id: Optional[UUID] = None
    ward_name: Optional[str] = None
    analysis_period: str
    generated_at: datetime
    total_submissions: int
    pending_count: int
    resolved_count: int
    distinct_issue_groups: int
    category_distribution: Dict[str, int]
    spatial_distribution_summary: str
    recurring_issues: List[Dict[str, Any]]
    evidence_references: List[Dict[str, Any]]
    suggested_departments: List[str]
    recommended_actions: List[str]
    executive_summary: str
    confidence_score: float
    limitations: str
    source_report_ids: List[str]
    source_reports: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "draft"
    approved_by: Optional[str] = None


class IndividualReportAIAnalysisResponse(BaseModel):
    report_id: UUID
    report_number: str
    original_complaint: str
    detected_language: str
    short_summary: str
    category: str
    suggested_category: str
    suggested_department: str
    priority_suggestion: str
    urgency_level: str
    sentiment_score: str
    confidence: float
    evidence_references: List[str]
    ai_recommendations: List[str]
    detected_duplicates: List[Dict[str, Any]] = Field(default_factory=list)
    analyzed_at: datetime
