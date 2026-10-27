import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, CircleDot, Radar, Route, Ruler, SplitSquareVertical, 
  Sparkles, AlertTriangle, CheckCircle2, ChevronRight,
  Play, RotateCcw, MapPin, Layers, Navigation, ShieldCheck,
  TrendingUp, Clock
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useCityWards } from '../../api/hooks';
import { useLayerStore } from '../../store/layerStore';
import { spatialApi } from '../../api/spatial';

export const AnalysisDrawer: React.FC = () => {
  const { t } = useTranslation();
  const { 
    activeTool,
    activeCity,
    clickCoordinates,
    isAnalysisDrawerOpen,
    setAnalysisDrawerOpen,
    bufferResult,
    setBufferResult,
    proximityResult,
    setProximityResult,
    routeResult,
    setRouteResult,
    measureResult,
    setMeasureResult,
    compareResult,
    setCompareResult,
    suitabilityResult,
    setSuitabilityResult,
    routeOrigin,
    setRouteOrigin,
    routeDestination,
    setRouteDestination,
    measurementPoints,
    setMeasurementPoints,
    clearAnalysis,
  } = useMapStore();

  const [bufferRadius, setBufferRadius] = useState<number>(1000);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [proximityCategory, setProximityCategory] = useState<string>('hospital');
  const [routingProfile, setRoutingProfile] = useState<string>('driving');
  const [compareWardA, setCompareWardA] = useState<string>('');
  const [compareWardB, setCompareWardB] = useState<string>('');
  const [suitabilityTarget, setSuitabilityTarget] = useState<string>('new_clinic');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: cityWards = [] } = useCityWards(activeCity?.id);
  const layers = useLayerStore(s => s.layers);
  useEffect(() => { setCompareWardA(''); setCompareWardB(''); setErrorMsg(null); }, [activeCity?.id]);

  if (!isAnalysisDrawerOpen || activeTool === 'idle' || activeTool === 'identify') {
    return null;
  }

  const handleRunBuffer = async () => {
    if (!clickCoordinates) {
      setErrorMsg('Please click a point on the map to set the buffer origin.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await spatialApi.runBufferAnalysis({
        origin_longitude: clickCoordinates[0],
        origin_latitude: clickCoordinates[1],
        buffer_meters: bufferRadius,
        city_id: activeCity?.id,
        target_layer_ids: selectedCategory !== 'all' ? [selectedCategory] : undefined,
      });
      if (useMapStore.getState().activeCity?.id === activeCity?.id && useMapStore.getState().activeTool === activeTool) setBufferResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Buffer analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunProximity = async () => {
    if (!clickCoordinates) {
      setErrorMsg('Please click a point on the map to set the origin point.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await spatialApi.runProximityAnalysis({
        origin_longitude: clickCoordinates[0],
        origin_latitude: clickCoordinates[1],
        city_id: activeCity?.id,
        facility_category: proximityCategory,
        max_radius_meters: 5000,
        limit: 10,
      });
      if (useMapStore.getState().activeCity?.id === activeCity?.id && useMapStore.getState().activeTool === activeTool) setProximityResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Proximity search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunRoute = async () => {
    if (!routeOrigin || !routeDestination) {
      setErrorMsg('Please set both Origin (click 1) and Destination (click 2) on the map.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await spatialApi.runRouteAnalysis({
        origin_longitude: routeOrigin[0],
        origin_latitude: routeOrigin[1],
        destination_longitude: routeDestination[0],
        destination_latitude: routeDestination[1],
        profile: routingProfile,
        include_civic_issues: true,
        city_id: activeCity?.id,
      });
      if (useMapStore.getState().activeCity?.id === activeCity?.id && useMapStore.getState().activeTool === activeTool) setRouteResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Routing failed or provider unreachable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCompare = async () => {
    if (!activeCity?.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await spatialApi.runCompare({
        city_id: activeCity.id,
        area_a_ward_id: compareWardA,
        area_b_ward_id: compareWardB,
        label_a: cityWards.find(w => w.id === compareWardA)?.name_en || 'Area A',
        label_b: cityWards.find(w => w.id === compareWardB)?.name_en || 'Area B',
      });
      if (useMapStore.getState().activeCity?.id === activeCity?.id && useMapStore.getState().activeTool === activeTool) setCompareResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSuitability = async () => {
    if (!activeCity?.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await spatialApi.runSuitability({
        city_id: activeCity.id,
        target_category: suitabilityTarget,
        criteria: [
          { layer_slug: 'osm_roads', weight: 0.5, criterion_type: 'proximity', max_distance_meters: 2000 },
          { layer_slug: 'osm_health', weight: 0.3, criterion_type: 'proximity', max_distance_meters: 3000 },
          { layer_slug: 'osm_safety', weight: 0.2, criterion_type: 'proximity', max_distance_meters: 2500 },
        ],
      });
      if (useMapStore.getState().activeCity?.id === activeCity?.id && useMapStore.getState().activeTool === activeTool) setSuitabilityResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Suitability calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      className="absolute top-16 right-4 z-20 w-96 max-h-[calc(100vh-5.5rem)] bg-[#0B132B]/95 border border-[#2E3D60] rounded-xl shadow-2xl backdrop-blur-xl flex flex-col text-slate-100 overflow-hidden"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#2E3D60] flex items-center justify-between bg-[#1C2541]/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {activeTool === 'buffer' && <CircleDot className="w-5 h-5" />}
            {activeTool === 'proximity' && <Radar className="w-5 h-5" />}
            {activeTool === 'route' && <Route className="w-5 h-5" />}
            {(activeTool === 'measure_distance' || activeTool === 'measure_area') && <Ruler className="w-5 h-5" />}
            {activeTool === 'compare' && <SplitSquareVertical className="w-5 h-5" />}
            {activeTool === 'suitability' && <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-100 capitalize">
              {activeTool.replace('_', ' ')} Analysis
            </h2>
            <p className="text-xs text-slate-400">
              {activeCity?.name_en || 'City'} • PostGIS Geospatial Engine
            </p>
          </div>
        </div>
        <button
          onClick={() => setAnalysisDrawerOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#2E3D60] rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* 1. BUFFER TOOL PARAMETERS */}
        {activeTool === 'buffer' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Buffer Radius: <span className="text-cyan-400 font-bold">{bufferRadius >= 1000 ? `${(bufferRadius/1000).toFixed(1)} km` : `${bufferRadius} m`}</span>
              </label>
              <input 
                type="range" 
                min={200} 
                max={5000} 
                step={100} 
                value={bufferRadius} 
                onChange={(e) => setBufferRadius(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Facilities</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#1C2541] border border-[#2E3D60] rounded-lg p-2 text-slate-200"
              >
                <option value="all">All Integrated Layers</option>
                {layers.filter(l => (l as any).feature_count > 0).map(l => <option key={l.id} value={l.id}>{l.name_en}</option>)}
              </select>
            </div>

            <div className="p-2.5 bg-[#1C2541]/50 border border-[#2E3D60] rounded-lg text-slate-400">
              <p>📍 Origin: {clickCoordinates ? `${clickCoordinates[1].toFixed(4)}, ${clickCoordinates[0].toFixed(4)}` : 'Click anywhere on map to set origin'}</p>
            </div>

            <button
              onClick={handleRunBuffer}
              disabled={isLoading || !clickCoordinates}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              {isLoading ? 'Calculating PostGIS Buffer...' : 'Run Buffer Analysis'}
            </button>

            {/* Buffer Results */}
            {bufferResult && (
              <div className="mt-4 pt-4 border-t border-[#2E3D60] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Matching Features</span>
                  <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded text-[11px] font-bold">
                    {bufferResult.feature_count} Found
                  </span>
                </div>

                {bufferResult.coverage_warning && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{bufferResult.coverage_warning}</span>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {bufferResult.features.map((feat) => (
                    <div key={feat.id} className="p-2 bg-[#1C2541]/60 border border-[#2E3D60] rounded flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-100">{feat.name_en}</p>
                        <p className="text-[10px] text-slate-400">{feat.category} • {feat.distance_meters}m from center</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                        {feat.provenance_type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. PROXIMITY TOOL PARAMETERS */}
        {activeTool === 'proximity' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Facility Type</label>
              <select 
                value={proximityCategory} 
                onChange={(e) => setProximityCategory(e.target.value)}
                className="w-full bg-[#1C2541] border border-[#2E3D60] rounded-lg p-2 text-slate-200"
              >
                <option value="hospital">Hospitals & Healthcare</option>
                <option value="university">Universities & Colleges</option>
                <option value="police">Police Stations</option>
                <option value="civic">Government & Public Offices</option>
              </select>
            </div>

            <div className="p-2.5 bg-[#1C2541]/50 border border-[#2E3D60] rounded-lg text-slate-400">
              <p>📍 Search Center: {clickCoordinates ? `${clickCoordinates[1].toFixed(4)}, ${clickCoordinates[0].toFixed(4)}` : 'Click anywhere on map'}</p>
            </div>

            <button
              onClick={handleRunProximity}
              disabled={isLoading || !clickCoordinates}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Radar className="w-4 h-4" />
              {isLoading ? 'Querying Nearest Facilities...' : 'Find Nearest (ST_DWithin)'}
            </button>

            {proximityResult && (
              <div className="mt-4 pt-4 border-t border-[#2E3D60] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Nearest Facilities</span>
                  <span className="text-xs text-cyan-400 font-medium">{proximityResult.results_count} within 5km</span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {proximityResult.results.map((item, idx) => (
                    <div key={item.id} className="p-2 bg-[#1C2541]/70 border border-[#2E3D60] rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-100">{item.name_en}</p>
                          <p className="text-[10px] text-slate-400">{item.distance_meters} m away</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. ROUTE TOOL PARAMETERS */}
        {activeTool === 'route' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#1C2541] border border-[#2E3D60] rounded">
                <p className="text-[10px] text-slate-400">Origin (Click 1)</p>
                <p className="font-medium text-slate-200 truncate">
                  {routeOrigin ? `${routeOrigin[1].toFixed(3)}, ${routeOrigin[0].toFixed(3)}` : 'Click on Map'}
                </p>
              </div>
              <div className="p-2 bg-[#1C2541] border border-[#2E3D60] rounded">
                <p className="text-[10px] text-slate-400">Destination (Click 2)</p>
                <p className="font-medium text-slate-200 truncate">
                  {routeDestination ? `${routeDestination[1].toFixed(3)}, ${routeDestination[0].toFixed(3)}` : 'Click on Map'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Mode of Travel</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['driving', 'walking', 'cycling'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRoutingProfile(mode)}
                    className={`py-1.5 capitalize rounded text-xs font-medium border transition-colors ${
                      routingProfile === mode
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-[#1C2541] border-[#2E3D60] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunRoute}
              disabled={isLoading || !routeOrigin || !routeDestination}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Navigation className="w-4 h-4" />
              {isLoading ? 'Routing via OSRM...' : 'Calculate Route & Corridor'}
            </button>

            {routeResult && (
              <div className="mt-4 pt-4 border-t border-[#2E3D60] space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded">
                    <p className="text-[10px] text-slate-400">Total Distance</p>
                    <p className="text-base font-bold text-cyan-400">{(routeResult.distance_meters / 1000).toFixed(2)} km</p>
                  </div>
                  <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded">
                    <p className="text-[10px] text-slate-400">Est. Duration</p>
                    <p className="text-base font-bold text-amber-400">{Math.round(routeResult.duration_seconds / 60)} min</p>
                  </div>
                </div>

                {/* Corridor Civic Issues */}
                <div className="p-2.5 bg-slate-900 border border-[#2E3D60] rounded">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-200 text-xs">Civic Issues on Route</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                      {routeResult.unresolved_issue_count} Reported
                    </span>
                  </div>
                  {routeResult.civic_issues_along_route.length > 0 ? (
                    <div className="space-y-1">
                      {routeResult.civic_issues_along_route.map((iss) => (
                        <p key={iss.id} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          {iss.title} ({iss.distance_to_route_meters}m)
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">No active pothole/drainage complaints within 150m corridor.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. MEASUREMENT TOOL */}
        {(activeTool === 'measure_distance' || activeTool === 'measure_area') && (
          <div className="space-y-3">
            <p className="text-slate-300">
              {activeTool === 'measure_distance' 
                ? 'Click sequential points on map to measure polyline distance.' 
                : 'Click 3 or more points to measure enclosed polygon area.'}
            </p>
            <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg">
              <p className="text-[10px] text-slate-400">Points Placed: {measurementPoints.length}</p>
              {measureResult ? (
                <div className="mt-2 space-y-1">
                  {measureResult.measure_type === 'distance' ? (
                    <>
                      <p className="text-base font-bold text-cyan-400">{measureResult.total_distance_km} km</p>
                      <p className="text-xs text-slate-400">({measureResult.total_distance_meters} meters)</p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-bold text-cyan-400">{measureResult.total_area_sq_km} sq km</p>
                      <p className="text-xs text-slate-400">Perimeter: {measureResult.perimeter_meters} m</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mt-1">Place points on map to view geodesic calculation</p>
              )}
            </div>
            <button
              onClick={() => {
                setMeasurementPoints([]);
                setMeasureResult(null);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            >
              Reset Points
            </button>
          </div>
        )}

        {/* 5. WARD COMPARISON TOOL */}
        {activeTool === 'compare' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[10px]">Area 1 (Ward)</label>
                <select 
                  value={compareWardA}
                  onChange={(e) => setCompareWardA(e.target.value)}
                  className="w-full bg-[#1C2541] border border-[#2E3D60] rounded p-1.5 text-xs text-slate-200"
                >
                  <option value="">Select a ward</option>{cityWards.map(w => <option key={w.id} value={w.id}>{w.ward_number}: {w.name_en}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Area 2 (Ward)</label>
                <select 
                  value={compareWardB}
                  onChange={(e) => setCompareWardB(e.target.value)}
                  className="w-full bg-[#1C2541] border border-[#2E3D60] rounded p-1.5 text-xs text-slate-200"
                >
                  <option value="">Select a ward</option>{cityWards.map(w => <option key={w.id} value={w.id}>{w.ward_number}: {w.name_en}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleRunCompare}
              disabled={isLoading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <SplitSquareVertical className="w-4 h-4" />
              Compare Ward Metrics
            </button>

            {compareResult && (
              <div className="mt-4 pt-4 border-t border-[#2E3D60] space-y-3">
                {compareResult.coverage_discrepancy_warning && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-[11px]">
                    {compareResult.coverage_discrepancy_warning}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-[#1C2541] rounded border border-[#2E3D60]">
                    <p className="font-bold text-slate-200 text-xs">{compareResult.area_a.name_en}</p>
                    <p className="text-cyan-400 font-bold text-sm mt-1">{compareResult.area_a.total_facilities} Facilities</p>
                    <p className="text-[10px] text-slate-400">{compareResult.area_a.population.toLocaleString()} pop • {compareResult.area_a.area_sq_km} km²</p>
                  </div>
                  <div className="p-2 bg-[#1C2541] rounded border border-[#2E3D60]">
                    <p className="font-bold text-slate-200 text-xs">{compareResult.area_b.name_en}</p>
                    <p className="text-cyan-400 font-bold text-sm mt-1">{compareResult.area_b.total_facilities} Facilities</p>
                    <p className="text-[10px] text-slate-400">{compareResult.area_b.population.toLocaleString()} pop • {compareResult.area_b.area_sq_km} km²</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. SUITABILITY TOOL */}
        {activeTool === 'suitability' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Proposed Civic Project</label>
              <select 
                value={suitabilityTarget}
                onChange={(e) => setSuitabilityTarget(e.target.value)}
                className="w-full bg-[#1C2541] border border-[#2E3D60] rounded-lg p-2 text-slate-200"
              >
                <option value="new_clinic">New Community Health Centre (PHC)</option>
                <option value="waste_transfer">Civic Waste Transfer Hub</option>
                <option value="emergency_post">Emergency Response Outpost</option>
              </select>
            </div>

            <div className="p-2.5 bg-slate-900 border border-[#2E3D60] rounded text-slate-400 text-[11px] space-y-1">
              <p className="font-medium text-slate-200">Weighted Multi-Criteria Model:</p>
              <p>• Road Network Accessibility (50% weight)</p>
              <p>• Existing Healthcare Proximity (30% weight)</p>
              <p>• Safety & Police Outpost Reach (20% weight)</p>
            </div>

            <button
              onClick={handleRunSuitability}
              disabled={isLoading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Computing Geospatial Overlay...' : 'Evaluate Spatial Suitability'}
            </button>

            {suitabilityResult && (
              <div className="mt-4 pt-4 border-t border-[#2E3D60] space-y-2">
                <span className="font-semibold text-slate-200 text-xs">Top Suitable Location Cells</span>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {suitabilityResult.top_suitable_locations.slice(0, 5).map((cell) => (
                    <div key={cell.cell_id} className="p-2 bg-[#1C2541] border border-[#2E3D60] rounded flex items-center justify-between">
                      <div>
                        <span className="font-bold text-cyan-400">Rank #{cell.rank}</span>
                        <p className="text-[10px] text-slate-400">Coords: {cell.centroid[1]}, {cell.centroid[0]}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold rounded">
                        {cell.score}% Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-[#2E3D60] bg-[#1C2541]/70 flex items-center justify-between">
        <button
          onClick={clearAnalysis}
          className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 text-slate-300 rounded text-xs transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Analysis
        </button>
        <button
          onClick={() => setAnalysisDrawerOpen(false)}
          className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded text-xs transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </aside>
  );
};

