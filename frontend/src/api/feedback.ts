import { apiClient } from './client';
import { CitizenReport } from '../types';

export const feedbackApi = {
  getPublicReports: (cityId?: string, wardId?: string, status?: string) =>
    apiClient<CitizenReport[]>('/feedback', {
      params: { city_id: cityId, ward_id: wardId, status },
    }),

  getReportById: (reportId: string) => apiClient<CitizenReport>(`/feedback/${reportId}`),

  submitCitizenReport: (reportData: {
    city_id: string;
    ward_id?: string;
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
    reporter_phone?: string;
    reporter_name?: string;
  }) =>
    apiClient<{ status: string; report_id: string; report_number: string; message: string }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),
};
