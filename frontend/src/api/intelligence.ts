import { apiClient } from './client';
import { 
  IssueCluster, 
  EntityIntelligence, 
  AreaReportPreviewRequest, 
  AreaReportPreviewResponse, 
  AreaReportGenerateRequest, 
  AreaIntelligenceReport 
} from '../types';

export const intelligenceApi = {
  getActiveClusters: (cityId?: string, wardId?: string) =>
    apiClient<IssueCluster[]>('/intelligence/clusters', {
      params: { city_id: cityId, ward_id: wardId },
    }),

  getEntityIntelligence: (entityType: string, entityId: string) =>
    apiClient<EntityIntelligence>(`/intelligence/${entityType}/${entityId}`),

  previewAreaReport: (data: AreaReportPreviewRequest) =>
    apiClient<AreaReportPreviewResponse>('/intelligence/area-report/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateAreaReport: (data: AreaReportGenerateRequest) =>
    apiClient<AreaIntelligenceReport>('/intelligence/area-report/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listAreaReports: (params?: { city_id?: string; status?: string; limit?: number }) =>
    apiClient<AreaIntelligenceReport[]>('/intelligence/area-reports', {
      params,
    }),

  getAreaReportById: (reportId: string) =>
    apiClient<AreaIntelligenceReport>(`/intelligence/area-reports/${reportId}`),

  updateAreaReport: (reportId: string, data: { status?: string; executive_summary_en?: string; approved_by?: string }) =>
    apiClient<AreaIntelligenceReport>(`/intelligence/area-reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
