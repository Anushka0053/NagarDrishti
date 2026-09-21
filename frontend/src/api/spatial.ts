import { apiClient } from './client';
import { IdentifiedFeature, ResolvedLocation } from '../types';

export const spatialApi = {
  identifyAtCoordinate: (params: { latitude: number; longitude: number; tolerance_meters?: number }) =>
    apiClient<IdentifiedFeature[]>('/spatial/identify', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  resolveLocation: (params: { latitude: number; longitude: number }) =>
    apiClient<ResolvedLocation>('/spatial/resolve-location', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateBuffer: (params: { origin_latitude: number; origin_longitude: number; buffer_meters: number }) =>
    apiClient<any>('/spatial/buffer', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  calculateProximity: (params: {
    origin_latitude: number;
    origin_longitude: number;
    facility_category?: string;
    max_radius_meters?: number;
    limit?: number;
  }) =>
    apiClient<any>('/spatial/proximity', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  calculateRoute: (params: {
    origin_latitude: number;
    origin_longitude: number;
    destination_latitude: number;
    destination_longitude: number;
    profile?: string;
  }) =>
    apiClient<any>('/spatial/routes', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
