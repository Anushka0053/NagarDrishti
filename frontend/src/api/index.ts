export * from './client';
export * from './cities';
export * from './adminUnits';
export * from './layers';
export * from './features';
export * from './spatial';
export * from './search';
export * from './sources';
export * from './feedback';
export * from './intelligence';
export * from './ai';
export * from './hooks';

// Unified civicApi backward-compatibility facade
import { citiesApi } from './cities';
import { layersApi } from './layers';
import { spatialApi } from './spatial';
import { searchApi } from './search';
import { sourcesApi } from './sources';
import { feedbackApi } from './feedback';
import { intelligenceApi } from './intelligence';
import { aiApi } from './ai';

export const civicApi = {
  ...citiesApi,
  ...layersApi,
  ...spatialApi,
  ...searchApi,
  ...sourcesApi,
  ...feedbackApi,
  ...intelligenceApi,
  ...aiApi,
};
