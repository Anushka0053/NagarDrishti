import { apiClient } from './client';
import { City, Ward, Sector, Department, DataSource, GISLayer, CitizenReport, IssueCluster, EntityIntelligence } from '../types';

export const civicApi = {
  // Cities & Geography
  getCities: () => apiClient<City[]>('/cities'),
  getCityWards: (cityId: string) => apiClient<Ward[]>(`/cities/${cityId}/wards`),

  // Layers & Taxonomy
  getLayers: (cityId?: string) => apiClient<GISLayer[]>(`/layers${cityId ? `?city_id=${cityId}` : ''}`),
  getSectors: () => apiClient<Sector[]>('/layers/sectors'),
  getDepartments: () => apiClient<Department[]>('/layers/departments'),
  getDataSources: () => apiClient<DataSource[]>('/sources'),

  // Spatial Features & Identify
  getLayerFeaturesGeoJSON: (layerId: string, cityId?: string, bbox?: string) =>
    apiClient<any>(`/layers/${layerId}/features?${new URLSearchParams({ ...(cityId && { city_id: cityId }), ...(bbox && { bbox }) }).toString()}`),
  
  identifyAtCoordinate: (data: { latitude: number; longitude: number; tolerance_meters?: number }) =>
    apiClient<any[]>('/spatial/identify', { method: 'POST', body: JSON.stringify(data) }),

  // Intelligence & Reports
  getActiveClusters: (cityId?: string) =>
    apiClient<IssueCluster[]>(`/intelligence/clusters${cityId ? `?city_id=${cityId}` : ''}`),
  
  getEntityIntelligence: (entityType: string, entityId: string) =>
    apiClient<EntityIntelligence>(`/intelligence/${entityType}/${entityId}`),

  getPublicReports: (cityId?: string) =>
    apiClient<CitizenReport[]>(`/feedback${cityId ? `?city_id=${cityId}` : ''}`),

  submitCitizenReport: (reportData: any) =>
    apiClient<{ status: string; report_id: string; report_number: string }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  // Sarvam AI
  askCivicAI: (queryText: string, cityId?: string, language: string = 'hi') =>
    apiClient<any>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query_text: queryText, city_id: cityId, language }),
    }),
};
