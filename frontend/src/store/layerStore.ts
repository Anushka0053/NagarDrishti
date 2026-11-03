import { create } from 'zustand';
import { GISLayer, IdentifiedFeature } from '../types';

interface LayerState {
  layers: GISLayer[];
  activeLayerIds: Set<string>;
  layerOpacity: Record<string, number>;
  selectedFeature: IdentifiedFeature | null;
  selectedSectorId: string | null;
  selectedDepartmentId: string | null;
  selectedProvenance: string | null;
  selectedCategory: string | null;
  layerSearchQuery: string;
  showWardBoundaries: boolean;
  showIssueHotspots: boolean;

  setLayers: (layers: GISLayer[]) => void;
  toggleLayer: (layerId: string) => void;
  enableLayer: (layerId: string) => void;
  disableLayer: (layerId: string) => void;
  setAllLayersVisibility: (layerIds: string[], visible: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setSelectedFeature: (feature: IdentifiedFeature | null) => void;
  setSelectedSectorId: (sectorId: string | null) => void;
  setSelectedDepartmentId: (deptId: string | null) => void;
  setSelectedProvenance: (prov: string | null) => void;
  setSelectedCategory: (cat: string | null) => void;
  clearAllFilters: () => void;
  setLayerSearchQuery: (query: string) => void;
  setShowWardBoundaries: (show: boolean) => void;
  toggleWardBoundaries: () => void;
  setShowIssueHotspots: (show: boolean) => void;
  toggleIssueHotspots: () => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  activeLayerIds: new Set<string>(),
  layerOpacity: {},
  selectedFeature: null,
  selectedSectorId: null,
  selectedDepartmentId: null,
  selectedProvenance: null,
  selectedCategory: null,
  layerSearchQuery: '',
  showWardBoundaries: false,
  showIssueHotspots: true,

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
  setSelectedProvenance: (prov) => set({ selectedProvenance: prov }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  clearAllFilters: () =>
    set({
      selectedSectorId: null,
      selectedDepartmentId: null,
      selectedProvenance: null,
      selectedCategory: null,
      layerSearchQuery: '',
    }),
  setLayerSearchQuery: (query) => set({ layerSearchQuery: query }),
  setShowWardBoundaries: (show) => set({ showWardBoundaries: show }),
  toggleWardBoundaries: () => set((state) => ({ showWardBoundaries: !state.showWardBoundaries })),
  setShowIssueHotspots: (show) => set({ showIssueHotspots: show }),
  toggleIssueHotspots: () => set((state) => ({ showIssueHotspots: !state.showIssueHotspots })),
}));
