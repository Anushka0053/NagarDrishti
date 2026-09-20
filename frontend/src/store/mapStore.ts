import { create } from 'zustand';
import { City } from '../types';

export type GISTool = 'idle' | 'identify' | 'buffer' | 'proximity' | 'route' | 'measure' | 'compare';
export type BasemapStyle = 'dark' | 'satellite' | 'terrain' | 'light';

interface MapState {
  activeCity: City | null;
  cursorCoordinates: [number, number]; // [lng, lat]
  currentZoom: number;
  activeTool: GISTool;
  activeBasemap: BasemapStyle;
  isAnalyticsDrawerOpen: boolean;
  isLeftSidebarOpen: boolean;
  isInspectorOpen: boolean;

  // Actions
  setActiveCity: (city: City) => void;
  setCursorCoordinates: (coords: [number, number]) => void;
  setCurrentZoom: (zoom: number) => void;
  setActiveTool: (tool: GISTool) => void;
  setActiveBasemap: (style: BasemapStyle) => void;
  toggleAnalyticsDrawer: () => void;
  setAnalyticsDrawerOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
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
  cursorCoordinates: [78.1828, 26.2183],
  currentZoom: 12,
  activeTool: 'idle',
  activeBasemap: 'dark',
  isAnalyticsDrawerOpen: false,
  isLeftSidebarOpen: true,
  isInspectorOpen: true,

  setActiveCity: (city) => set({ activeCity: city, currentZoom: city.default_zoom }),
  setCursorCoordinates: (coords) => set({ cursorCoordinates: coords }),
  setCurrentZoom: (zoom) => set({ currentZoom: zoom }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveBasemap: (style) => set({ activeBasemap: style }),
  toggleAnalyticsDrawer: () => set((s) => ({ isAnalyticsDrawerOpen: !s.isAnalyticsDrawerOpen })),
  setAnalyticsDrawerOpen: (open) => set({ isAnalyticsDrawerOpen: open }),
  toggleLeftSidebar: () => set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
}));
