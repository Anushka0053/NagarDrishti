import { apiClient } from './client';

export interface GISFeatureDetail {
  id: string;
  layer_id: string;
  city_id?: string | null;
  ward_id?: string | null;
  locality_id?: string | null;
  source_id?: string | null;
  external_id?: string | null;
  name_en?: string | null;
  name_hi?: string | null;
  category: string;
  subcategory?: string | null;
  geojson_geometry: any;
  properties: Record<string, any>;
  observed_at?: string | null;
  source_updated_at?: string | null;
  source_attribution_en?: string | null;
  source_attribution_hi?: string | null;
}

export const featuresApi = {
  getFeatureById: (featureId: string) => apiClient<GISFeatureDetail>(`/features/${featureId}`),
};
