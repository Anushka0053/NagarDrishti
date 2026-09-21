import { apiClient } from './client';
import { SearchResult } from '../types';

export interface UniversalSearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

export const searchApi = {
  universalSearch: (query: string, cityId?: string, limit: number = 15) =>
    apiClient<UniversalSearchResponse>('/search', {
      params: { q: query, city_id: cityId, limit },
    }),
};
