export * from './client';
export * from './cities';
export * from './adminUnits';
export * from './layers';
export * from './features';
export * from './spatial';
export * from './search';
export * from './sources';
export * from './auth';
export * from './feedback';
export * from './intelligence';
export * from './ai';
export * from './coverage';
export * from './analytics';
export * from './admin';
export * from './hooks';

// Unified civicApi backward-compatibility facade
import { authApi } from './auth';
import { citiesApi } from './cities';
import { layersApi } from './layers';
import { spatialApi } from './spatial';
import { searchApi } from './search';
import { sourcesApi } from './sources';
import { feedbackApi } from './feedback';
import { intelligenceApi } from './intelligence';
import { aiApi } from './ai';
import { coverageApi } from './coverage';
import { analyticsApi } from './analytics';
import { adminApi } from './admin';

export const civicApi = {
  ...authApi,
  ...citiesApi,
  ...layersApi,
  ...spatialApi,
  ...searchApi,
  ...sourcesApi,
  ...feedbackApi,
  ...intelligenceApi,
  ...aiApi,
  ...coverageApi,
  ...analyticsApi,
  ...adminApi,
};

