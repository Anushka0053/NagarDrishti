import { apiClient } from './client';
import { DataSource, SourceStatus } from '../types';

export const sourcesApi = {
  getDataSources: () => apiClient<DataSource[]>('/sources'),
  getSourcesStatus: () => apiClient<SourceStatus[]>('/sources/status'),
};

