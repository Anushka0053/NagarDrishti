import { apiClient } from './client';
import { GISLayer, Sector, Department } from '../types';

export const layersApi = {
  getLayers: (filters?: { city_id?: string; sector_id?: string; department_id?: string }) =>
    apiClient<GISLayer[]>('/layers', { params: filters }),

  getLayerById: (layerId: string) => apiClient<GISLayer>(`/layers/${layerId}`),

  getSectors: () => apiClient<Sector[]>('/layers/sectors'),

  getDepartments: () => apiClient<Department[]>('/layers/departments'),

  getLayerFeaturesGeoJSON: (layerId: string, options?: { city_id?: string; ward_id?: string; bbox?: string }) =>
    apiClient<any>(`/layers/${layerId}/features`, { params: options }),
};
