import { apiClient } from './client';
import { CityAnalytics, WardAnalytics } from '../types';

export const analyticsApi = {
  getCityAnalytics: (cityId: string) => {
    return apiClient<CityAnalytics>(`/analytics/city/${cityId}`);
  },

  getWardAnalytics: (wardId: string) => {
    return apiClient<WardAnalytics>(`/analytics/ward/${wardId}`);
  },
};
