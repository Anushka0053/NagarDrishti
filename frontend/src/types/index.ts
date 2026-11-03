export interface City {
  id: string;
  name_en: string;
  name_hi: string;
  slug: string;
  ulb_type: string;
  lgd_code?: string;
  center_latitude: number;
  center_longitude: number;
  default_zoom: number;
  is_reference_city: boolean;
  is_enabled: boolean;
  area_sq_km?: number;
  population_census?: number;
}

export interface Ward {
  id: string;
  city_id: string;
  ward_number: number;
  ward_code?: string;
  name_en: string;
  name_hi: string;
  zone_number?: number;
  zone_name_en?: string;
  zone_name_hi?: string;
  corporator_name?: string;
  corporator_contact?: string;
  population?: number;
  area_sq_km?: number;
  geometry: any;
  centroid?: any;
}

export interface Sector {
  id: string;
  code: string;
  name_en: string;
  name_hi: string;
  icon: string;
  display_order: number;
  color_hex: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  code: string;
  name_en: string;
  name_hi: string;
  short_name_en?: string;
  short_name_hi?: string;
  contact_phone?: string;
  is_active: boolean;
}

export interface DataSource {
  id: string;
  source_key: string;
  name_en: string;
  name_hi: string;
  provider_agency: string;
  authority_level: string;
  source_type: string;
  attribution_text_en?: string;
  attribution_text_hi?: string;
  sync_frequency?: string;
  health_status: 'healthy' | 'degraded' | 'unreachable' | 'maintenance' | 'unknown' | 'connected' | 'credential_required' | 'integration_pending';
  last_successful_sync?: string;
  records_count?: number;
}

export interface GISLayer {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  description_en?: string;
  description_hi?: string;
  sector_id?: string;
  department_id?: string;
  source_id?: string;
  category?: string;
  feature_count?: number;
  geometry_type: 'POINT' | 'LINESTRING' | 'POLYGON' | 'MULTIPOINT' | 'MULTILINESTRING' | 'MULTIPOLYGON';
  source_type: string;
  default_visibility: boolean;
  is_queryable: boolean;
  is_clusterable: boolean;
  min_zoom: number;
  max_zoom: number;
  style_config: {
    fill_color?: string;
    fill_opacity?: number;
    stroke_color?: string;
    stroke_width?: number;
    stroke_opacity?: number;
    point_radius?: number;
    icon_image?: string;
  };
  legend_config: {
    items: Array<{ label_en: string; label_hi: string; color: string }>;
  };
  freshness_sla_days: number;
  is_active: boolean;
  display_order?: number;
}

export type ProvenanceType = 
  | 'official_verified' 
  | 'community_open' 
  | 'citizen_submitted' 
  | 'internal_derived' 
  | 'development_fixture';

export type CoverageStatus = 
  | 'available' 
  | 'partial' 
  | 'metadata_only' 
  | 'integration_pending' 
  | 'credential_required' 
  | 'not_publicly_available' 
  | 'unavailable' 
  | 'development_only';

export interface DataCoverage {
  id: string;
  city_id: string;
  layer_id?: string;
  layer_slug?: string;
  layer_name_en?: string;
  layer_name_hi?: string;
  sector_id?: string;
  sector_name_en?: string;
  source_id?: string;
  source_name_en?: string;
  coverage_status: CoverageStatus;
  feature_count: number;
  geographic_coverage?: string;
  temporal_coverage?: string;
  authority_level?: string;
  provenance_type: ProvenanceType;
  last_source_update?: string;
  last_successful_sync?: string;
  completeness_notes?: string;
}

export interface CityCoverageSummary {
  city_id: string;
  city_name_en: string;
  city_name_hi: string;
  total_layers: number;
  available_layers: number;
  partial_layers: number;
  unavailable_layers: number;
  total_features: number;
  coverages: DataCoverage[];
}

export interface CategoryBreakdown {
  category: string;
  category_name_en?: string;
  category_name_hi?: string;
  count: number;
  open_count: number;
  resolved_count: number;
}

export interface WardBreakdown {
  ward_id?: string;
  ward_number?: number;
  ward_name_en?: string;
  ward_name_hi?: string;
  total_reports: number;
  open_reports: number;
}

export interface CityAnalytics {
  city_id: string;
  total_citizen_reports?: number;
  open_citizen_reports?: number;
  resolved_citizen_reports?: number;
  in_progress_citizen_reports?: number;
  total_reports?: number;
  open_reports?: number;
  resolved_reports?: number;
  active_clusters_count?: number;
  verified_features_count?: number;
  mapped_features_count?: number;
  healthcare_count?: number;
  education_count?: number;
  safety_count?: number;
  roads_count?: number;
  civic_count?: number;
  available_wards_count?: number;
  connected_sources_count?: number;
  resolution_rate?: number | null;
  resolution_rate_percent?: number | null;
  avg_resolution_hours?: number | null;
  sla_adherence_rate?: number | null;
  active_issue_clusters?: number;
  total_gis_features?: number;
  data_sources_connected?: number;
  data_sources_count?: number;
  total_data_sources?: number;
  data_truth_note?: string;
  category_breakdown?: CategoryBreakdown[];
  ward_breakdown?: WardBreakdown[];
}

export interface WardAnalytics {
  ward_id: string;
  ward_number: number;
  ward_name_en: string;
  ward_name_hi: string;
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  active_clusters: number;
  resolution_rate_percent?: number | null;
  category_breakdown: CategoryBreakdown[];
}

export interface SourceStatus {
  source_key: string;
  name_en: string;
  name_hi: string;
  authority_level: string;
  source_type: string;
  health_status: string;
  is_configured: boolean;
  records_count: number;
  last_sync?: string | null;
}

export interface IdentifyResult {
  feature_id?: string;
  layer_id?: string;
  layer_name_en?: string;
  layer_name_hi?: string;
  name_en?: string;
  name_hi?: string;
  category?: string;
  distance_meters?: number;
  properties: Record<string, any>;
  admin_hierarchy?: Record<string, any>;
  provenance_type?: ProvenanceType;
  source_attribution_en?: string;
  source_attribution_hi?: string;
  source_health?: string;
  last_updated?: string;
}

export interface IdentifiedFeature extends IdentifyResult {
  id?: string;
  source_record_id?: string;
  geometry?: any;
  city_name?: string;
  ward_name?: string;
  facility_name?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface CitizenReport {
  id: string;
  report_number: string;
  city_id: string;
  ward_id?: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  normalized_text?: string;
  input_language: string;
  severity_input: string;
  status: string;
  provenance_type?: ProvenanceType;
  corroboration_count: number;
  latitude: number;
  longitude: number;
  location_address?: string;
  ai_metadata?: {
    is_ai_prediction?: boolean;
    predicted_category?: string;
    predicted_urgency?: string;
    predicted_department?: string;
    sentiment_score?: number;
    confidence?: number;
    detected_language?: string;
    summary_en?: string;
    summary_hi?: string;
    detected_duplicates?: any[];
    [key: string]: any;
  };
  assigned_officer_name?: string;
  department_id?: string;
  resolution_summary?: string;
  resolved_at?: string;
  updated_at?: string;
  status_history?: {
    id: string;
    previous_status?: string;
    new_status: string;
    actor_role?: string;
    reason?: string;
    notes?: string;
    created_at: string;
  }[];
  created_at: string;
}

export interface IssueCluster {
  id: string;
  city_id: string;
  category: string;
  cluster_title_en?: string;
  cluster_title_hi?: string;
  latitude: number;
  longitude: number;
  report_count: number;
  unresolved_count: number;
  composite_risk_score: number;
  cluster_status: string;
  provenance_type?: ProvenanceType;
}

export type UserRole = 
  | 'super_admin' 
  | 'city_admin' 
  | 'department_head' 
  | 'field_officer' 
  | 'gis_officer' 
  | 'citizen';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  city_id?: string;
  department_id?: string;
  phone_number?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface LinkedCitizenReport {
  id: string;
  report_number: string;
  title: string;
  category: string;
  status: string;
  distance_meters: number;
  relationship_type: 'located_at' | 'nearby' | 'reported_against' | 'infrastructure_associated';
  created_at: string;
}

export interface EntityIntelligence {
  entity_type: string;
  entity_id: string;
  title_en: string;
  title_hi: string;
  risk_score?: {
    score: number;
    score_grade?: string;
    components: Record<string, any>;
  };
  active_reports_count: number;
  resolved_reports_count: number;
  linked_citizen_reports?: LinkedCitizenReport[];
  recent_reports?: Array<any>;
  public_records?: Array<{
    id: string;
    title_en: string;
    title_hi: string;
    record_type: string;
    record_date: string;
  }>;
  ai_grounded_summary_hi?: string;
  ai_grounded_summary_en?: string;
  frequently_reported_issues?: Array<{
    category: string;
    category_label_en: string;
    category_label_hi: string;
    count: number;
    percentage: number;
  }>;
  positive_observations?: string[];
  positive_observations_hi?: string[];
  negative_observations?: string[];
  negative_observations_hi?: string[];
  recurring_issues_trends?: string[];
  recurring_issues_trends_hi?: string[];
  evidence_photographs?: Array<{
    id: string;
    photo_url: string;
    report_number: string;
    category: string;
    caption_en: string;
    caption_hi: string;
  }>;
  recommended_actions_en?: string[];
  recommended_actions_hi?: string[];
  overall_civic_condition_en?: string;
  overall_civic_condition_hi?: string;
  data_freshness_status: string;
}

export interface AreaReportPreviewRequest {
  city_id: string;
  ward_id?: string;
  bbox?: number[];
  custom_polygon?: any;
  start_date?: string;
  end_date?: string;
  categories?: string[];
  statuses?: string[];
}

export interface AreaReportGenerateRequest extends AreaReportPreviewRequest {
  title?: string;
}

export interface AreaReportPreviewResponse {
  report_count: number;
  categories: Record<string, number>;
  statuses: Record<string, number>;
  sample_reports: Array<{
    id: string;
    report_number: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface AreaIntelligenceReport {
  id: string;
  report_number: string;
  city_id: string;
  city_name?: string;
  ward_id?: string;
  ward_name?: string;
  title: string;
  status: 'draft' | 'under_review' | 'approved' | 'published';
  report_type?: string;
  analysis_period?: string;
  analysis_period_start?: string;
  analysis_period_end?: string;
  source_reports_count?: number;
  total_submissions?: number;
  pending_count?: number;
  resolved_count?: number;
  distinct_issue_groups_count?: number;
  distinct_issue_groups?: number;
  category_distribution?: Record<string, number>;
  categories_breakdown?: Record<string, number>;
  spatial_distribution?: Record<string, any>;
  spatial_distribution_summary?: string;
  recurring_issues: Array<{
    issue_type?: string;
    category?: string;
    frequency?: number;
    count?: number;
    locations: string[];
    description: string;
  }>;
  suggested_departments: any;
  recommended_actions: string[];
  limitations?: string;
  limitations_notes?: string;
  confidence_score: number;
  executive_summary?: string;
  executive_summary_en: string;
  executive_summary_hi?: string;
  distinct_issues_breakdown?: Array<{
    category: string;
    category_name_en: string;
    category_name_hi: string;
    count: number;
    percentage: number;
    distinct_incidents_count: number;
    probable_duplicates_count: number;
    description_en: string;
    description_hi: string;
    locations: string[];
    sample_quotes?: string[];
    media_count?: number;
    associated_media?: Array<{ report_number: string; storage_path: string }>;
    citizen_impact_en: string;
    citizen_impact_hi: string;
    recommended_action_en: string;
    recommended_action_hi: string;
    responsible_department_en: string;
    responsible_department_hi: string;
  }>;
  grouped_evidence_media?: Array<{
    report_number: string;
    category: string;
    storage_path: string;
    location_address: string;
    created_at?: string;
  }>;
  probable_duplicates?: Array<{
    category: string;
    primary_report_number: string;
    primary_address: string;
    corroborating_reports: string[];
    total_corroborations: number;
  }>;
  source_report_ids: string[];
  source_reports?: any[];
  created_at: string;
  generated_at?: string;
  approved_by?: string;
}

export interface IndividualReportAIAnalysis {
  report_id: string;
  report_number: string;
  original_complaint?: string;
  detected_language: string;
  category: string;
  suggested_category?: string;
  suggested_department?: string;
  suggested_department_hi?: string;
  priority_suggestion?: string;
  urgency_level?: string;
  sentiment_score?: any;
  confidence?: number;
  summary_en?: string;
  summary_hi?: string;
  short_summary?: string;
  evidence_references?: string[];
  ai_recommendations?: string[];
  detected_duplicates?: any[];
  reported_problem?: string;
  reported_problem_hi?: string;
  affected_infrastructure?: string;
  affected_infrastructure_hi?: string;
  reported_impact?: string;
  reported_impact_hi?: string;
  location_summary?: string;
  responsible_department?: string;
  responsible_department_hi?: string;
  evidence_available?: string[];
  missing_information?: string[];
  recommended_action?: string;
  recommended_action_hi?: string;
  reported_facts?: string[];
  ai_interpretations?: string[];
  recommendations?: string[];
  media_references?: Array<{ storage_path: string; media_type?: string }>;
  analyzed_at?: string;
  sentiment_urgency?: {
    urgency: string;
    sentiment_score: number;
    rationale: string;
  };
  recommended_department?: string;
  suggested_actions?: string[];
  confidence_score?: number;
  potential_duplicates: Array<{
    id: string;
    report_number: string;
    title: string;
    distance_meters: number;
    status: string;
  }>;
}

export interface SearchResult {
  properties?: Record<string, any>;
  provenance_type?: ProvenanceType;
  source_attribution_en?: string;
  last_updated?: string;
  id: string;
  title: string;
  subtitle: string;
  type: 'city' | 'ward' | 'feature' | 'coordinate' | 'admin_unit' | 'external' | 'external_place';
  category?: string | null;
  city_id?: string | null;
  ward_id?: string | null;
  coordinates?: [number, number] | null;
  zoom?: number;
  bbox?: [number, number, number, number] | null;
  geometry?: any;
}

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  state: string;
  state_code: string;
  district_en: string;
  district_hi: string;
  city_id?: string | null;
  city_en: string;
  city_hi: string;
  ulb_type?: string | null;
  ward_id?: string | null;
  ward_number?: number | null;
  ward_code?: string | null;
  ward_en?: string | null;
  ward_hi?: string | null;
  zone_en?: string | null;
  corporator?: string | null;
  is_exact_containment: boolean;
}

// ==========================================
// PHASE 3 ADVANCED GIS ANALYSIS & DATA TYPES
// ==========================================

export type GISToolType = 
  | 'idle' 
  | 'identify' 
  | 'buffer' 
  | 'proximity' 
  | 'route' 
  | 'measure_distance' 
  | 'measure_area' 
  | 'draw_point' 
  | 'draw_line' 
  | 'draw_polygon' 
  | 'compare' 
  | 'suitability' 
  | 'upload' 
  | 'add_feature';

export interface BufferAnalysisResult {
  origin: [number, number];
  buffer_meters: number;
  buffer_geometry?: any;
  feature_count: number;
  features: Array<{
    id: string;
    name_en: string;
    name_hi?: string;
    category?: string;
    distance_meters: number;
    provenance_type: ProvenanceType;
    source_attribution?: string;
    geometry: any;
  }>;
  coverage_status: string;
  coverage_warning?: string | null;
  provenance_type: ProvenanceType;
}

export interface ProximityAnalysisResult {
  origin: [number, number];
  max_radius_meters: number;
  results_count: number;
  results: Array<{
    id: string;
    name_en: string;
    name_hi?: string;
    category?: string;
    distance_meters: number;
    provenance_type: ProvenanceType;
    source_attribution?: string;
    geometry: any;
  }>;
  coverage_status: string;
  coverage_warning?: string | null;
}

export interface RouteAnalysisResult {
  distance_meters: number;
  duration_seconds: number;
  profile: string;
  route_geometry: any;
  steps: Array<any>;
  civic_issues_along_route: Array<{
    id: string;
    title: string;
    category: string;
    distance_to_route_meters: number;
    status: string;
    severity: string;
    geometry: any;
  }>;
  unresolved_issue_count: number;
  corridor_buffer_meters: number;
}

export interface MeasureResult {
  measure_type: 'distance' | 'area';
  total_distance_meters?: number;
  total_distance_km?: number;
  segment_distances_meters?: number[];
  total_area_sq_meters?: number;
  total_area_sq_km?: number;
  perimeter_meters?: number;
  geometry: any;
}

export interface AreaMetrics {
  label: string;
  ward_id?: string;
  ward_code?: string;
  name_en: string;
  name_hi?: string;
  area_sq_km: number;
  population: number;
  facility_counts: Record<string, number>;
  total_facilities: number;
  citizen_report_count: number;
  unresolved_report_count: number;
  resolved_report_count: number;
  coverage_status: string;
}

export interface CompareResult {
  city_id: string;
  area_a: AreaMetrics;
  area_b: AreaMetrics;
  has_coverage_discrepancy: boolean;
  coverage_discrepancy_warning?: string | null;
}

export interface SuitabilityCell {
  cell_id: string;
  centroid: [number, number];
  score: number;
  rank: number;
  geometry: any;
}

export interface SuitabilityResult {
  city_id: string;
  target_category: string;
  criteria_evaluated: Array<{
    layer_slug: string;
    layer_name: string;
    weight: number;
    type: string;
    max_distance_meters: number;
  }>;
  cells_evaluated: number;
  top_suitable_locations: SuitabilityCell[];
  missing_datasets: string[];
  is_sufficient_data: boolean;
  coverage_warning?: string | null;
}

export interface DatasetValidateResponse {
  filename: string;
  file_format: string;
  feature_count: number;
  detected_crs: string;
  geometry_types: string[];
  bounding_box: number[];
  sample_properties: string[];
  sample_features: any[];
  valid_record_count: number;
  invalid_record_count: number;
  validation_warnings: string[];
  validation_token: string;
}

export interface DatasetImportPayload {
  validation_token: string;
  city_id: string;
  layer_id: string;
  source_name: string;
  provenance_type: ProvenanceType;
  authority_level: string;
  field_mappings: Record<string, string>;
}
