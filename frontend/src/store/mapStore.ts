import { create } from 'zustand';
import { City, Ward, ResolvedLocation } from '../types';

export type GISTool = 'idle' | 'identify' | 'buffer' | 'proximity' | 'route' | 'measure' | 'compare';
export type BasemapStyle = 'dark' | 'light' | 'osm' | 'satellite' | 'terrain';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface MapState {
  activeCity: City | null;
  activeWard: Ward | null;
  cursorCoordinates: [number, number]; // [lng, lat]
  clickCoordinates: [number, number] | null;
  currentZoom: number;
  activeTool: GISTool;
  activeBasemap: BasemapStyle;
  isAnalyticsDrawerOpen: boolean;
  isLeftSidebarOpen: boolean;
  isInspectorOpen: boolean;
  userLocation: UserLocation | null;
  resolvedLocation: ResolvedLocation | null;
  highlightedFeatureId: string | null;
  tempMarker: [number, number] | null; // [lng, lat]

  // Actions
  setActiveCity: (city: City) => void;
  setActiveWard: (ward: Ward | null) => void;
  setCursorCoordinates: (coords: [number, number]) => void;
  setClickCoordinates: (coords: [number, number] | null) => void;
  setCurrentZoom: (zoom: number) => void;
  setActiveTool: (tool: GISTool) => void;
  setActiveBasemap: (style: BasemapStyle) => void;
  toggleAnalyticsDrawer: () => void;
  setAnalyticsDrawerOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  setUserLocation: (loc: UserLocation | null) => void;
  setResolvedLocation: (res: ResolvedLocation | null) => void;
  setHighlightedFeatureId: (id: string | null) => void;
  setTempMarker: (marker: [number, number] | null) => void;
  resetContext: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  activeCity: {
    id: 'c0000000-0000-0000-0000-000000000001',
    name_en: 'Gwalior',
    name_hi: 'ग्वालियर',
    slug: 'gwalior',
    ulb_type: 'nagar_nigam',
    center_latitude: 26.2183,
    center_longitude: 78.1828,
    default_zoom: 12,
    is_reference_city: true,
    is_enabled: true,
    area_sq_km: 289.0,
    population_census: 1069276,
  },
  activeWard: null,
  cursorCoordinates: [78.1828, 26.2183],
  clickCoordinates: null,
  currentZoom: 12,
  activeTool: 'idle',
  activeBasemap: 'dark',
  isAnalyticsDrawerOpen: false,
  isLeftSidebarOpen: true,
  isInspectorOpen: true,
  userLocation: null,
  resolvedLocation: null,
  highlightedFeatureId: null,
  tempMarker: null,

  setActiveCity: (city) =>
    set({
      activeCity: city,
      activeWard: null,
      currentZoom: city.default_zoom,
      tempMarker: null,
      highlightedFeatureId: null,
    }),
  setActiveWard: (ward) => set({ activeWard: ward }),
  setCursorCoordinates: (coords) => set({ cursorCoordinates: coords }),
  setClickCoordinates: (coords) => set({ clickCoordinates: coords }),
  setCurrentZoom: (zoom) => set({ currentZoom: zoom }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveBasemap: (style) => set({ activeBasemap: style }),
  toggleAnalyticsDrawer: () => set((s) => ({ isAnalyticsDrawerOpen: !s.isAnalyticsDrawerOpen })),
  setAnalyticsDrawerOpen: (open) => set({ isAnalyticsDrawerOpen: open }),
  toggleLeftSidebar: () => set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
  setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setResolvedLocation: (res) => set({ resolvedLocation: res }),
  setHighlightedFeatureId: (id) => set({ highlightedFeatureId: id }),
  setTempMarker: (marker) => set({ tempMarker: marker }),
  resetContext: () =>
    set({
      activeWard: null,
      tempMarker: null,
      highlightedFeatureId: null,
      clickCoordinates: null,
    }),
}));
