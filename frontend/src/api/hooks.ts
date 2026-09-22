import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { citiesApi } from './cities';
import { layersApi } from './layers';
import { spatialApi } from './spatial';
import { searchApi } from './search';
import { sourcesApi } from './sources';
import { feedbackApi } from './feedback';
import { intelligenceApi } from './intelligence';
import { coverageApi } from './coverage';
import { analyticsApi } from './analytics';

// ==========================================
// CITIES & WARDS
// ==========================================
export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: () => citiesApi.getCities(),
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useCityWards(cityId?: string | null) {
  return useQuery({
    queryKey: ['cities', cityId, 'wards'],
    queryFn: () => (cityId ? citiesApi.getCityWards(cityId) : Promise.resolve([])),
    enabled: !!cityId,
    staleTime: 1000 * 60 * 15,
  });
}

// ==========================================
// LAYERS & TAXONOMY
// ==========================================
export function useLayers(filters?: { city_id?: string; sector_id?: string; department_id?: string }) {
  return useQuery({
    queryKey: ['layers', filters],
    queryFn: () => layersApi.getLayers(filters),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: () => layersApi.getSectors(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => layersApi.getDepartments(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useLayerFeaturesGeoJSON(
  layerId?: string | null,
  options?: { city_id?: string; ward_id?: string; bbox?: string },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['layer-features', layerId, options],
    queryFn: () => (layerId ? layersApi.getLayerFeaturesGeoJSON(layerId, options) : Promise.resolve(null)),
    enabled: !!layerId && enabled,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

// ==========================================
// SOURCES & PROVENANCE
// ==========================================
export function useDataSources() {
  return useQuery({
    queryKey: ['data-sources'],
    queryFn: () => sourcesApi.getDataSources(),
    staleTime: 1000 * 60 * 30,
  });
}

export function useSourcesStatus() {
  return useQuery({
    queryKey: ['sources-status'],
    queryFn: () => sourcesApi.getSourcesStatus(),
    staleTime: 1000 * 60 * 5,
  });
}

// ==========================================
// DATA COVERAGE MATRIX
// ==========================================
export function useCoverageMatrix(filters?: { city_id?: string; sector_id?: string }) {
  return useQuery({
    queryKey: ['coverage-matrix', filters],
    queryFn: () => coverageApi.getCoverageMatrix(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCityCoverageSummary(cityId?: string | null) {
  return useQuery({
    queryKey: ['city-coverage-summary', cityId],
    queryFn: () => (cityId ? coverageApi.getCityCoverageSummary(cityId) : Promise.resolve(null)),
    enabled: !!cityId,
    staleTime: 1000 * 60 * 5,
  });
}

// ==========================================
// LIVE CITY & WARD ANALYTICS
// ==========================================
export function useCityAnalytics(cityId?: string | null) {
  return useQuery({
    queryKey: ['city-analytics', cityId],
    queryFn: () => (cityId ? analyticsApi.getCityAnalytics(cityId) : Promise.resolve(null)),
    enabled: !!cityId,
    staleTime: 1000 * 30, // 30s
  });
}

export function useWardAnalytics(wardId?: string | null) {
  return useQuery({
    queryKey: ['ward-analytics', wardId],
    queryFn: () => (wardId ? analyticsApi.getWardAnalytics(wardId) : Promise.resolve(null)),
    enabled: !!wardId,
    staleTime: 1000 * 30,
  });
}

// ==========================================
// UNIVERSAL SEARCH
// ==========================================
export function useUniversalSearch(query: string, cityId?: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['search', trimmed, cityId],
    queryFn: () => searchApi.universalSearch(trimmed, cityId),
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 2,
  });
}

// ==========================================
// INTELLIGENCE & REPORTS
// ==========================================
export function useActiveClusters(cityId?: string, wardId?: string) {
  return useQuery({
    queryKey: ['clusters', cityId, wardId],
    queryFn: () => intelligenceApi.getActiveClusters(cityId, wardId),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicReports(cityId?: string, wardId?: string) {
  return useQuery({
    queryKey: ['public-reports', cityId, wardId],
    queryFn: () => feedbackApi.getPublicReports(cityId, wardId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feedbackApi.submitCitizenReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-reports'] });
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['city-analytics'] });
    },
  });
}

