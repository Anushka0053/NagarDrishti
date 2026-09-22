from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class CategoryBreakdownItem(BaseModel):
    category: str
    category_name_en: Optional[str] = None
    category_name_hi: Optional[str] = None
    count: int = 0
    open_count: int = 0
    resolved_count: int = 0


class WardBreakdownItem(BaseModel):
    ward_id: Optional[UUID] = None
    ward_number: Optional[int] = None
    ward_name_en: Optional[str] = None
    ward_name_hi: Optional[str] = None
    count: int = 0
    open_count: int = 0
    resolved_count: int = 0


class MonthlyTrendItem(BaseModel):
    month: str
    submitted_count: int = 0
    resolved_count: int = 0


class CityAnalyticsResponse(BaseModel):
    city_id: UUID
    city_name_en: str
    city_name_hi: str
    total_reports: int = 0
    open_reports: int = 0
    resolved_reports: int = 0
    in_progress_reports: int = 0
    resolution_rate: Optional[float] = None  # None when total_reports == 0
    avg_resolution_hours: Optional[float] = None
    sla_adherence_rate: Optional[float] = None
    verified_features_count: int = 0
    active_clusters_count: int = 0
    category_breakdown: List[CategoryBreakdownItem] = Field(default_factory=list)
    ward_breakdown: List[WardBreakdownItem] = Field(default_factory=list)
    monthly_trend: List[MonthlyTrendItem] = Field(default_factory=list)
    is_mock_data: bool = False
    data_truth_note: Optional[str] = None


class WardAnalyticsResponse(BaseModel):
    ward_id: UUID
    ward_number: int
    ward_name_en: str
    ward_name_hi: str
    city_id: UUID
    total_reports: int = 0
    open_reports: int = 0
    resolved_reports: int = 0
    in_progress_reports: int = 0
    resolution_rate: Optional[float] = None
    category_breakdown: List[CategoryBreakdownItem] = Field(default_factory=list)
    features_count: int = 0
