from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class IdentifyRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
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
    origin_latitude: float = Field(..., ge=-90.0, le=90.0)
    origin_longitude: float = Field(..., ge=-180.0, le=180.0)
    buffer_meters: float = Field(default=1000.0, ge=10.0, le=50000.0)
    city_id: Optional[UUID] = None
    target_layer_ids: Optional[List[UUID]] = None
    category: Optional[str] = None


class BufferFeatureItem(BaseModel):
    id: str
    name_en: str
    name_hi: Optional[str] = None
    category: Optional[str] = None
    distance_meters: float
    provenance_type: str = "community_open"
    source_attribution: Optional[str] = None
    geometry: Dict[str, Any]


class BufferAnalysisResult(BaseModel):
    origin: List[float]
    buffer_meters: float
    buffer_geometry: Optional[Dict[str, Any]] = None
    feature_count: int = 0
    features: List[BufferFeatureItem] = Field(default_factory=list)
    coverage_status: str = "available"
    coverage_warning: Optional[str] = None
    provenance_type: str = "internal_derived"


class ProximityRequest(BaseModel):
    origin_latitude: float = Field(..., ge=-90.0, le=90.0)
    origin_longitude: float = Field(..., ge=-180.0, le=180.0)
    city_id: Optional[UUID] = None
    facility_category: Optional[str] = None
    layer_id: Optional[UUID] = None
    max_radius_meters: float = Field(default=3000.0, ge=50.0, le=50000.0)
    limit: int = Field(default=10, ge=1, le=50)


class ProximityFeatureItem(BaseModel):
    id: str
    name_en: str
    name_hi: Optional[str] = None
    category: Optional[str] = None
    distance_meters: float
    provenance_type: str = "community_open"
    source_attribution: Optional[str] = None
    geometry: Dict[str, Any]


class ProximityAnalysisResult(BaseModel):
    origin: List[float]
    max_radius_meters: float
    results_count: int
    results: List[ProximityFeatureItem] = Field(default_factory=list)
    coverage_status: str = "available"
    coverage_warning: Optional[str] = None


class RouteRequest(BaseModel):
    origin_latitude: float = Field(..., ge=-90.0, le=90.0)
    origin_longitude: float = Field(..., ge=-180.0, le=180.0)
    destination_latitude: float = Field(..., ge=-90.0, le=90.0)
    destination_longitude: float = Field(..., ge=-180.0, le=180.0)
    profile: Optional[str] = "driving"  # 'driving', 'walking', 'cycling'
    include_civic_issues: bool = True
    city_id: Optional[UUID] = None
    corridor_buffer_meters: float = Field(default=150.0, ge=20.0, le=1000.0)


class CivicIssueAlongRoute(BaseModel):
    id: str
    title: str
    category: str
    distance_to_route_meters: float
    status: str
    severity: str
    geometry: Dict[str, Any]


class RouteAnalysisResult(BaseModel):
    distance_meters: float
    duration_seconds: float
    profile: str
    route_geometry: Dict[str, Any]
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    civic_issues_along_route: List[CivicIssueAlongRoute] = Field(default_factory=list)
    unresolved_issue_count: int = 0
    corridor_buffer_meters: float = 150.0


class MeasureRequest(BaseModel):
    measure_type: str = Field(..., description="'distance' for line or 'area' for polygon")
    coordinates: List[List[float]] = Field(..., min_length=2, description="List of [lng, lat] coordinates")


class MeasureResult(BaseModel):
    measure_type: str
    total_distance_meters: Optional[float] = None
    total_distance_km: Optional[float] = None
    segment_distances_meters: List[float] = Field(default_factory=list)
    total_area_sq_meters: Optional[float] = None
    total_area_sq_km: Optional[float] = None
    perimeter_meters: Optional[float] = None
    geometry: Dict[str, Any]


class CompareRequest(BaseModel):
    city_id: UUID
    area_a_ward_id: Optional[UUID] = None
    area_b_ward_id: Optional[UUID] = None
    polygon_a: Optional[Dict[str, Any]] = None
    polygon_b: Optional[Dict[str, Any]] = None
    label_a: Optional[str] = "Area A"
    label_b: Optional[str] = "Area B"


class AreaMetrics(BaseModel):
    label: str
    ward_id: Optional[str] = None
    ward_code: Optional[str] = None
    name_en: str
    name_hi: Optional[str] = None
    area_sq_km: float = 0.0
    population: int = 0
    facility_counts: Dict[str, int] = Field(default_factory=dict)
    total_facilities: int = 0
    citizen_report_count: int = 0
    unresolved_report_count: int = 0
    resolved_report_count: int = 0
    coverage_status: str = "available"


class CompareResult(BaseModel):
    city_id: str
    area_a: AreaMetrics
    area_b: AreaMetrics
    has_coverage_discrepancy: bool = False
    coverage_discrepancy_warning: Optional[str] = None


class SuitabilityCriterion(BaseModel):
    layer_slug: str
    weight: float = Field(..., ge=0.0, le=1.0)
    criterion_type: str = Field("proximity", description="'proximity' (closer is better) or 'avoidance' (further is better)")
    max_distance_meters: float = Field(default=2000.0, ge=100.0, le=20000.0)


class SuitabilityRequest(BaseModel):
    city_id: UUID
    target_category: str = Field(..., description="e.g. 'new_healthcare_clinic' or 'waste_transfer_station'")
    criteria: List[SuitabilityCriterion] = Field(..., min_length=1)
    grid_size_meters: float = Field(default=500.0, ge=200.0, le=2000.0)


class SuitabilityCell(BaseModel):
    cell_id: str
    centroid: List[float]
    score: float = Field(..., ge=0.0, le=100.0)
    rank: int
    geometry: Dict[str, Any]


class SuitabilityResult(BaseModel):
    city_id: str
    target_category: str
    criteria_evaluated: List[Dict[str, Any]]
    cells_evaluated: int
    top_suitable_locations: List[SuitabilityCell] = Field(default_factory=list)
    missing_datasets: List[str] = Field(default_factory=list)
    is_sufficient_data: bool = True
    coverage_warning: Optional[str] = None
