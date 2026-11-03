import { apiClient } from './client';
import { 
  BufferAnalysisResult, ProximityAnalysisResult, RouteAnalysisResult,
  MeasureResult, CompareResult, SuitabilityResult, IdentifyResult, ResolvedLocation
} from '../types';

export const spatialApi = {
  identifyAtCoordinate: (payload: {
    latitude: number;
    longitude: number;
    tolerance_meters?: number;
    city_id?: string;
  }) => apiClient<IdentifyResult[]>('/spatial/identify', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  resolveLocation: (payload: {
    latitude: number;
    longitude: number;
  }) => apiClient<ResolvedLocation>('/spatial/resolve-location', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  runBufferAnalysis: (payload: {
    origin_latitude: number;
    origin_longitude: number;
    buffer_meters: number;
    city_id?: string;
    target_layer_ids?: string[];
    category?: string;
  }) => apiClient<BufferAnalysisResult>('/spatial/buffer', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  runProximityAnalysis: (payload: {
    origin_latitude: number;
    origin_longitude: number;
    city_id?: string;
    facility_category?: string;
    layer_id?: string;
    max_radius_meters: number;
    limit?: number;
  }) => apiClient<ProximityAnalysisResult>('/spatial/proximity', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  runRouteAnalysis: (payload: {
    origin_latitude: number;
    origin_longitude: number;
    destination_latitude: number;
    destination_longitude: number;
    profile?: string;
    include_civic_issues?: boolean;
    city_id?: string;
    corridor_buffer_meters?: number;
  }) => apiClient<RouteAnalysisResult>('/spatial/routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  runMeasure: (payload: {
    measure_type: 'distance' | 'area';
    coordinates: number[][];
  }) => apiClient<MeasureResult>('/spatial/measure', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  runCompare: (payload: {
    city_id: string;
    area_a_ward_id?: string;
    area_b_ward_id?: string;
    label_a?: string;
    label_b?: string;
  }) => apiClient<CompareResult>('/spatial/compare', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  runSuitability: (payload: {
    city_id: string;
    target_category: string;
    criteria: Array<{
      layer_slug: string;
      weight: number;
      criterion_type: 'proximity' | 'avoidance';
      max_distance_meters: number;
    }>;
  }) => apiClient<SuitabilityResult>('/spatial/suitability', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};
