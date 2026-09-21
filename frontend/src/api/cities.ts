import { apiClient } from './client';
import { City, Ward } from '../types';

export const citiesApi = {
  getCities: () => apiClient<City[]>('/cities'),
  getCityById: (cityId: string) => apiClient<City>(`/cities/${cityId}`),
  getCityWards: (cityId: string) => apiClient<Ward[]>(`/cities/${cityId}/wards`),
};
