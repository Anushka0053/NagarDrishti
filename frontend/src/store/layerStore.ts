import { create } from 'zustand';
import { GISLayer, IdentifiedFeature } from '../types';

interface LayerState {
  layers: GISLayer[];
  activeLayerIds: Set<string>;
  layerOpacity: Record<string, number>;
  selectedFeature: IdentifiedFeature | null;

  setLayers: (layers: GISLayer[]) => void;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setSelectedFeature: (feature: IdentifiedFeature | null) => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  activeLayerIds: new Set(['l0000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000005']),
  layerOpacity: {},
  selectedFeature: {
    feature_id: 'f0000000-0000-0000-0000-000000000001',
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
  },

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
  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layerOpacity: { ...state.layerOpacity, [layerId]: opacity },
    })),
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
}));
