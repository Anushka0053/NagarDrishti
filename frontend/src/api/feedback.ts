import { apiClient } from './client';
import { CitizenReport, IndividualReportAIAnalysis } from '../types';

export interface CitizenReportStatusUpdateData {
  status: string;
  reason?: string;
  notes?: string;
  assigned_officer_name?: string;
  department_id?: string;
  resolution_summary?: string;
}

export interface FeedbackFilterParams {
  city_id?: string;
  ward_id?: string;
  category?: string;
  status?: string;
  search?: string;
  department_id?: string;
  reporter_id?: string;
  is_demo?: boolean;
  limit?: number;
  offset?: number;
}

export const feedbackApi = {
  getPublicReports: (
    paramsOrCityId?: string | FeedbackFilterParams,
    wardId?: string
  ) => {
    let params: FeedbackFilterParams = {};

    if (typeof paramsOrCityId === 'string') {
      params = { city_id: paramsOrCityId, ward_id: wardId };
    } else if (paramsOrCityId) {
      params = paramsOrCityId;
    }

    return apiClient<CitizenReport[]>('/feedback', {
      params: {
        city_id: params.city_id,
        ward_id: params.ward_id,
        category: params.category,
        status: params.status,
        search: params.search,
        department_id: params.department_id,
        reporter_id: params.reporter_id,
        is_demo: params.is_demo,
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    });
  },

  getReportsMapFeatures: (params?: {
    city_id?: string;
    ward_id?: string;
    category?: string;
    status?: string;
  }) =>
    apiClient<{
      type: string;
      features: Array<{
        type: string;
        geometry: { type: string; coordinates: [number, number] };
        properties: {
          id: string;
          report_number: string;
          category: string;
          title: string;
          status: string;
          severity: string;
          created_at: string;
          location_address?: string;
          corroboration_count: number;
        };
      }>;
    }>('/feedback/map-features', { params }),

  getReportById: (reportId: string) => apiClient<CitizenReport>(`/feedback/${reportId}`),

  submitCitizenReport: (reportData: {
    city_id: string;
    ward_id?: string;
    locality_id?: string;
    category: string;
    subcategory?: string;
    title?: string;
    description: string;
    latitude: number;
    longitude: number;
    location_address?: string;
    input_language?: string;
    severity_input?: string;
    is_anonymous?: boolean;
    is_public?: boolean;
    media_paths?: string[];
  }) =>
    apiClient<{
      status: string;
      report_id: string;
      report_number: string;
      message: string;
      initial_status: string;
      ai_metadata?: Record<string, any>;
    }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  updateReportStatus: (reportId: string, updateData: CitizenReportStatusUpdateData) =>
    apiClient<{
      status: string;
      message: string;
      report_id: string;
      current_status: string;
      resolved_at?: string;
    }>(`/feedback/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),

  analyzeReportAI: (reportId: string) =>
    apiClient<IndividualReportAIAnalysis>(`/feedback/${reportId}/analyze-ai`, {
      method: 'POST',
    }),

  corroborateReport: (reportId: string, corroborationType: string = 'confirm_issue', comment?: string) =>
    apiClient<{ status: string; corroboration_count: number }>(`/feedback/${reportId}/corroborate`, {
      method: 'POST',
      body: JSON.stringify({ corroboration_type: corroborationType, comment }),
    }),
};
