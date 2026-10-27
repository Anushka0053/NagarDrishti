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
  resolution_rate?: number | null;
  resolution_rate_percent?: number | null;
  avg_resolution_hours?: number | null;
  active_issue_clusters?: number;
  total_gis_features?: number;
  data_sources_connected?: number;
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
  geometry?: any;
  city_name?: string;
  ward_name?: string;
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
  public_records: Array<{
    id: string;
    title_en: string;
    title_hi: string;
    record_type: string;
    record_date: string;
  }>;
  ai_grounded_summary_hi?: string;
  ai_grounded_summary_en?: string;
  data_freshness_status: string;
}

export interface SearchResult {
  properties?: Record<string, any>;
  provenance_type?: ProvenanceType;
  source_attribution_en?: string;
  last_updated?: string;
  id: string;
  title: string;
  subtitle: string;
  type: 'city' | 'ward' | 'feature' | 'coordinate' | 'admin_unit' | 'external';
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
