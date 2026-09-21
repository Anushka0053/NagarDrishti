import { create } from 'zustand';
import { GISLayer, IdentifiedFeature } from '../types';

interface LayerState {
  layers: GISLayer[];
  activeLayerIds: Set<string>;
  layerOpacity: Record<string, number>;
  selectedFeature: IdentifiedFeature | null;
  selectedSectorId: string | null;
  selectedDepartmentId: string | null;
  layerSearchQuery: string;
  showWardBoundaries: boolean;

  setLayers: (layers: GISLayer[]) => void;
  toggleLayer: (layerId: string) => void;
  enableLayer: (layerId: string) => void;
  disableLayer: (layerId: string) => void;
  setAllLayersVisibility: (layerIds: string[], visible: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setSelectedFeature: (feature: IdentifiedFeature | null) => void;
  setSelectedSectorId: (sectorId: string | null) => void;
  setSelectedDepartmentId: (deptId: string | null) => void;
  setLayerSearchQuery: (query: string) => void;
  setShowWardBoundaries: (show: boolean) => void;
  toggleWardBoundaries: () => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  // Start with Roads & Hospitals layers enabled by default
  activeLayerIds: new Set([
    'fa000000-0000-0000-0000-000000000001', // Major Roads
    'fa000000-0000-0000-0000-000000000002', // Hospitals
    'fa000000-0000-0000-0000-000000000005', // Issue Clusters
  ]),
  layerOpacity: {},
  selectedFeature: {
    feature_id: 'f0000000-0000-0000-0000-000000000001',
    layer_id: 'fa000000-0000-0000-0000-000000000001',
    layer_name_en: 'Major Urban Roads & Arterials',
    layer_name_hi: 'प्रमुख शहरी एवं मुख्य सड़कें',
    name_en: 'University Road (City Center to Jiwaji)',
    name_hi: 'विश्वविद्यालय मार्ग (सिटी सेंटर से जीवाजी)',
    category: 'arterial_road',
    distance_meters: 0,
    properties: {
      surface: 'bituminous',
      lanes: 4,
      width_meters: 24,
      maintenance_dept: 'MP PWD',
      condition: 'good',
    },
    source_attribution_en: 'Directorate of Urban Administration & Development, Govt of MP (GARUD GIS)',
    source_attribution_hi: 'स्रोत: नगरीय प्रशासन एवं विकास संचालनालय, म.प्र. शासन (गरुड़)',
    source_health: 'healthy',
    last_updated: '2026-08-15T10:00:00Z',
    city_name: 'Gwalior',
    ward_name: 'Ward 52 - City Center',
  },
  selectedSectorId: null,
  selectedDepartmentId: null,
  layerSearchQuery: '',
  showWardBoundaries: true,

  setLayers: (layers) => set({ layers }),
  toggleLayer: (layerId) =>
    set((state) => {
      const next = new Set(state.activeLayerIds);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return { activeLayerIds: next };
    }),
  enableLayer: (layerId) =>
    set((state) => {
      const next = new Set(state.activeLayerIds);
      next.add(layerId);
      return { activeLayerIds: next };
    }),
  disableLayer: (layerId) =>
    set((state) => {
      const next = new Set(state.activeLayerIds);
      next.delete(layerId);
      return { activeLayerIds: next };
    }),
  setAllLayersVisibility: (layerIds, visible) =>
    set((state) => {
      const next = new Set(state.activeLayerIds);
      layerIds.forEach((id) => (visible ? next.add(id) : next.delete(id)));
      return { activeLayerIds: next };
    }),
  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layerOpacity: { ...state.layerOpacity, [layerId]: opacity },
    })),
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  setSelectedSectorId: (sectorId) => set({ selectedSectorId: sectorId }),
  setSelectedDepartmentId: (deptId) => set({ selectedDepartmentId: deptId }),
  setLayerSearchQuery: (query) => set({ layerSearchQuery: query }),
  setShowWardBoundaries: (show) => set({ showWardBoundaries: show }),
  toggleWardBoundaries: () => set((state) => ({ showWardBoundaries: !state.showWardBoundaries })),
}));
