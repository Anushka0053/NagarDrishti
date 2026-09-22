export interface City {
  id: string;
  name_en: string;
  name_hi: string;
  slug: string;
  ulb_type: string;
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
  zone_name_en?: string;
  zone_name_hi?: string;
  corporator_name?: string;
  area_sq_km?: number;
  population?: number;
  geometry?: any;
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
  contact_email?: string;
  portal_url?: string;
  is_active: boolean;
}

export interface DataSource {
  id: string;
  source_key: string;
  name_en: string;
  name_hi: string;
  provider: string;
  authority_level: string;
  homepage_url?: string;
  access_type: string;
  attribution_text_en: string;
  attribution_text_hi: string;
  health_status: string;
  last_source_update?: string;
  last_successful_sync?: string;
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
  geometry_type: string;
  source_type: string;
  external_layer_name?: string;
  service_url_template?: string;
  min_zoom: number;
  max_zoom: number;
  default_visibility: boolean;
  is_queryable: boolean;
  is_clusterable: boolean;
  style_config: Record<string, any>;
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
  count: number;
  open_count: number;
  resolved_count: number;
}

export interface CityAnalytics {
  city_id: string;
  city_name_en: string;
  city_name_hi: string;
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  in_progress_reports: number;
  resolution_rate: number | null;
  avg_resolution_hours?: number | null;
  sla_adherence_rate?: number | null;
  verified_features_count: number;
  active_clusters_count: number;
  category_breakdown: CategoryBreakdown[];
  ward_breakdown: WardBreakdown[];
  monthly_trend?: Array<{ month: string; submitted_count: number; resolved_count: number }>;
  is_mock_data: boolean;
  data_truth_note?: string | null;
}

export interface WardAnalytics {
  ward_id: string;
  ward_number: number;
  ward_name_en: string;
  ward_name_hi: string;
  city_id: string;
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  in_progress_reports: number;
  resolution_rate: number | null;
  category_breakdown: CategoryBreakdown[];
  features_count: number;
}

export interface SourceStatus {
  source_id: string;
  source_key: string;
  name_en: string;
  name_hi: string;
  provider: string;
  authority_level: string;
  health_status: string;
  is_configured: boolean;
  access_type: string;
  license_type: string;
  notes?: string;
  last_successful_sync?: string | null;
}

export interface IdentifiedFeature {
  feature_id?: string;
  layer_id?: string;
  layer_name_en?: string;
  layer_name_hi?: string;
  name_en?: string;
  name_hi?: string;
  category?: string;
  distance_meters?: number;
  properties: Record<string, any>;
  provenance_type?: ProvenanceType;
  source_attribution_en?: string;
  source_attribution_hi?: string;
  source_health?: string;
  last_updated?: string;
  state?: string;
  district?: string;
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
  title?: string;
  description: string;
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
  id: string;
  title: string;
  subtitle: string;
  type: 'city' | 'ward' | 'feature' | 'coordinate' | 'admin_unit';
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

