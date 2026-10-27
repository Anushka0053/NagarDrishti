import { apiClient, API_BASE_URL } from './client';
import { DatasetValidateResponse, DatasetImportPayload } from '../types';

export const datasetsApi = {
  validateDataset: async (file: File): Promise<DatasetValidateResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('nd_auth_token') : null;
    const res = await fetch(`${API_BASE_URL}/admin/datasets/validate`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Dataset validation failed');
    }

    return (await res.json()) as DatasetValidateResponse;
  },

  importDataset: (payload: DatasetImportPayload) =>
    apiClient<{ message: string; records_imported: number }>('/admin/datasets/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getIngestionRuns: (limit: number = 20) =>
    apiClient<Array<{
      id: string;
      run_type: string;
      status: string;
      records_fetched: number;
      records_inserted: number;
      records_rejected: number;
      started_at: string;
      source_name?: string;
    }>>('/admin/datasets/runs', {
      params: { limit },
    }),
};
