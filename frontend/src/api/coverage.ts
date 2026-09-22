import { apiClient } from './client';
import { DataCoverage, CityCoverageSummary } from '../types';

export const coverageApi = {
  getCoverageMatrix: (filters?: { city_id?: string; sector_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.city_id) params.append('city_id', filters.city_id);
    if (filters?.sector_id) params.append('sector_id', filters.sector_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<DataCoverage[]>(`/coverage${query}`);
  },

  getCityCoverageSummary: (cityId: string) => {
    return apiClient<CityCoverageSummary>(`/coverage/city/${cityId}`);
  },
};
