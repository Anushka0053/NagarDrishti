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
  source_attribution_en?: string;
  source_attribution_hi?: string;
  source_health?: string;
  last_updated?: string;
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
