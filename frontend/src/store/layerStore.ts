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
  activeLayerIds: new Set<string>(),
  layerOpacity: {},
  selectedFeature: null,
  selectedSectorId: null,
  selectedDepartmentId: null,
  layerSearchQuery: '',
  showWardBoundaries: false,

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

