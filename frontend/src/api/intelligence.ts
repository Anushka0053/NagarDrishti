import { apiClient } from './client';
import { IssueCluster, EntityIntelligence } from '../types';

export const intelligenceApi = {
  getActiveClusters: (cityId?: string, wardId?: string) =>
    apiClient<IssueCluster[]>('/intelligence/clusters', {
      params: { city_id: cityId, ward_id: wardId },
    }),

  getEntityIntelligence: (entityType: string, entityId: string) =>
    apiClient<EntityIntelligence>(`/intelligence/${entityType}/${entityId}`),
};
