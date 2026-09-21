import { apiClient } from './client';

export const aiApi = {
  askCivicAI: (queryText: string, cityId?: string, language: string = 'hi') =>
    apiClient<any>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query_text: queryText, city_id: cityId, language }),
    }),

  translateText: (text: string, sourceLang: string = 'auto', targetLang: string = 'hi') =>
    apiClient<any>('/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ text, source_language: sourceLang, target_language: targetLang }),
    }),
};
