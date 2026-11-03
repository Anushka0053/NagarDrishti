import { create } from 'zustand';
import { useLayerStore } from './layerStore';
import { 
  City, Ward, ResolvedLocation, GISToolType,
  BufferAnalysisResult, ProximityAnalysisResult, RouteAnalysisResult,
  MeasureResult, CompareResult, SuitabilityResult
} from '../types';

export type BasemapStyle = 'dark' | 'light' | 'osm' | 'satellite' | 'satellite_labels' | 'terrain';

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
  activeTool: GISToolType;
  activeBasemap: BasemapStyle;
  isAnalyticsDrawerOpen: boolean;
  isAnalysisDrawerOpen: boolean;
  isUploadModalOpen: boolean;
  isLeftSidebarOpen: boolean;
  isInspectorOpen: boolean;
  userLocation: UserLocation | null;
  resolvedLocation: ResolvedLocation | null;
  highlightedFeatureId: string | null;
  tempMarker: [number, number] | null; // [lng, lat]
  focusGeometry: any;
  setFocusGeometry: (geometry: any) => void;

  // Spatial Analysis & Routing Results
  bufferResult: BufferAnalysisResult | null;
  proximityResult: ProximityAnalysisResult | null;
  routeResult: RouteAnalysisResult | null;
  measureResult: MeasureResult | null;
  compareResult: CompareResult | null;
  suitabilityResult: SuitabilityResult | null;

  // Temporary Drawing State
  drawnCoordinates: Array<[number, number]>;
  measurementPoints: Array<[number, number]>;
  routeOrigin: [number, number] | null;
  routeDestination: [number, number] | null;

  // Actions
  setActiveCity: (city: City) => void;
  setActiveWard: (ward: Ward | null) => void;
  setCursorCoordinates: (coords: [number, number]) => void;
  setClickCoordinates: (coords: [number, number] | null) => void;
  setCurrentZoom: (zoom: number) => void;
  setActiveTool: (tool: GISToolType) => void;
  setActiveBasemap: (style: BasemapStyle) => void;
  toggleAnalyticsDrawer: () => void;
  setAnalyticsDrawerOpen: (open: boolean) => void;
  toggleAnalysisDrawer: () => void;
  setAnalysisDrawerOpen: (open: boolean) => void;
  setUploadModalOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  setUserLocation: (loc: UserLocation | null) => void;
  setResolvedLocation: (res: ResolvedLocation | null) => void;
  setHighlightedFeatureId: (id: string | null) => void;
  setTempMarker: (marker: [number, number] | null) => void;

  // Analysis Setters
  setBufferResult: (res: BufferAnalysisResult | null) => void;
  setProximityResult: (res: ProximityAnalysisResult | null) => void;
  setRouteResult: (res: RouteAnalysisResult | null) => void;
  setMeasureResult: (res: MeasureResult | null) => void;
  setCompareResult: (res: CompareResult | null) => void;
  setSuitabilityResult: (res: SuitabilityResult | null) => void;
  
  // Drawing Setters
  setDrawnCoordinates: (coords: Array<[number, number]>) => void;
  addDrawnCoordinate: (coord: [number, number]) => void;
  setMeasurementPoints: (pts: Array<[number, number]>) => void;
  addMeasurementPoint: (pt: [number, number]) => void;
  setRouteOrigin: (pt: [number, number] | null) => void;
  setRouteDestination: (pt: [number, number] | null) => void;

  // Cleaners
  clearAnalysis: () => void;
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
  activeBasemap: 'osm',
  isAnalyticsDrawerOpen: false,
  isAnalysisDrawerOpen: false,
  isUploadModalOpen: false,
  isLeftSidebarOpen: true,
  isInspectorOpen: true,
  userLocation: null,
  resolvedLocation: null,
  highlightedFeatureId: null,
  tempMarker: null,
  focusGeometry: null,
  setFocusGeometry: (focusGeometry) => set({ focusGeometry }),

  bufferResult: null,
  proximityResult: null,
  routeResult: null,
  measureResult: null,
  compareResult: null,
  suitabilityResult: null,

  drawnCoordinates: [],
  measurementPoints: [],
  routeOrigin: null,
  routeDestination: null,

  setActiveCity: (city) => {
    useLayerStore.setState({ selectedFeature: null, layers: [], activeLayerIds: new Set(), selectedSectorId: null, selectedDepartmentId: null });
    set({
      activeCity: city,
      activeWard: null,
      currentZoom: city.default_zoom,
      tempMarker: null,
      highlightedFeatureId: null,
      focusGeometry: null, resolvedLocation: null, clickCoordinates: null,
      bufferResult: null, proximityResult: null, routeResult: null, measureResult: null,
      compareResult: null, suitabilityResult: null, routeOrigin: null, routeDestination: null,
      measurementPoints: [], drawnCoordinates: [], activeTool: 'idle', isAnalysisDrawerOpen: false,
    });
  },
  setActiveWard: (ward) => set({ activeWard: ward }),
  setCursorCoordinates: (coords) => set({ cursorCoordinates: coords }),
  setClickCoordinates: (coords) => set({ clickCoordinates: coords }),
  setCurrentZoom: (zoom) => set({ currentZoom: zoom }),
  setActiveTool: (tool) => set({ 
    activeTool: tool,
    isAnalysisDrawerOpen: tool !== 'idle' && tool !== 'identify'
  }),
  setActiveBasemap: (style) => set({ activeBasemap: style }),
  toggleAnalyticsDrawer: () => set((s) => ({ isAnalyticsDrawerOpen: !s.isAnalyticsDrawerOpen })),
  setAnalyticsDrawerOpen: (open) => set({ isAnalyticsDrawerOpen: open }),
  toggleAnalysisDrawer: () => set((s) => ({ isAnalysisDrawerOpen: !s.isAnalysisDrawerOpen })),
  setAnalysisDrawerOpen: (open) => set({ isAnalysisDrawerOpen: open }),
  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),
  toggleLeftSidebar: () => set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
  setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setResolvedLocation: (res) => set({ resolvedLocation: res }),
  setHighlightedFeatureId: (id) => set({ highlightedFeatureId: id }),
  setTempMarker: (marker) => set({ tempMarker: marker }),

  setBufferResult: (res) => set({ bufferResult: res }),
  setProximityResult: (res) => set({ proximityResult: res }),
  setRouteResult: (res) => set({ routeResult: res }),
  setMeasureResult: (res) => set({ measureResult: res }),
  setCompareResult: (res) => set({ compareResult: res }),
  setSuitabilityResult: (res) => set({ suitabilityResult: res }),

  setDrawnCoordinates: (coords) => set({ drawnCoordinates: coords }),
  addDrawnCoordinate: (coord) => set((s) => ({ drawnCoordinates: [...s.drawnCoordinates, coord] })),
  setMeasurementPoints: (pts) => set({ measurementPoints: pts }),
  addMeasurementPoint: (pt) => set((s) => ({ measurementPoints: [...s.measurementPoints, pt] })),
  setRouteOrigin: (pt) => set({ routeOrigin: pt }),
  setRouteDestination: (pt) => set({ routeDestination: pt }),

  clearAnalysis: () =>
    set({
      focusGeometry: null,
      activeTool: 'idle',
      isAnalysisDrawerOpen: false,
      bufferResult: null,
      proximityResult: null,
      routeResult: null,
      measureResult: null,
      compareResult: null,
      suitabilityResult: null,
      drawnCoordinates: [],
      measurementPoints: [],
      routeOrigin: null,
      routeDestination: null,
      tempMarker: null,
      highlightedFeatureId: null,
      clickCoordinates: null,
    }),

  resetContext: () =>
    set({
      activeWard: null,
      tempMarker: null,
      highlightedFeatureId: null,
      clickCoordinates: null,
    }),
}));
