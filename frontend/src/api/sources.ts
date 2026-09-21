import { apiClient } from './client';
import { DataSource } from '../types';

export const sourcesApi = {
  getDataSources: () => apiClient<DataSource[]>('/sources'),
};
