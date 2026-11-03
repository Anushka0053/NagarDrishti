import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  Map, 
  ListOrdered, 
  Search, 
  X, 
  SlidersHorizontal,
  Radio,
  MapPin,
  Activity
} from 'lucide-react';
import { useLayerStore } from '../../store/layerStore';
import { useMapStore, BasemapStyle } from '../../store/mapStore';
import { Sector, Department, GISLayer } from '../../types';

interface LeftSidebarProps {
  sectors: Sector[];
  departments: Department[];
}

type TabType = 'layers' | 'basemaps' | 'legend';

export const LeftSidebar: React.FC<LeftSidebarProps> = () => {
  const { t, i18n } = useTranslation();
  const { isLeftSidebarOpen, activeBasemap, setActiveBasemap, activeCity } = useMapStore();
  const {
    layers,
    activeLayerIds,
    toggleLayer,
    setLayerOpacity,
    layerOpacity,
    showWardBoundaries,
    toggleWardBoundaries,
    showCitizenReports,
    toggleCitizenReports,
  } = useLayerStore();

  const [activeTab, setActiveTab] = useState<TabType>('layers');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isLeftSidebarOpen) return null;

  // Filter layers by search term (strictly excluding cluster layers as requested)
  const filteredLayers = layers.filter((layer) => {
    const s = `${layer.name_en || ''} ${layer.slug || ''} ${layer.category || ''}`.toLowerCase();
    if (s.includes('cluster')) return false;
    const name = i18n.language === 'hi' ? layer.name_hi : layer.name_en;
    return (name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate active layers for legend tab (excluding clusters)
  const activeLayersList = layers.filter((l) => {
    const s = `${l.name_en || ''} ${l.slug || ''} ${l.category || ''}`.toLowerCase();
    return !s.includes('cluster') && activeLayerIds.has(l.id);
  });

  // Category color mapper for layer visual indicators
  const getCategoryColor = (layerSlug: string, cat?: string) => {
    const str = `${layerSlug} ${cat || ''}`.toLowerCase();
    if (str.includes('health') || str.includes('hospital')) return 'bg-emerald-400';
    if (str.includes('edu') || str.includes('school')) return 'bg-blue-400';
    if (str.includes('safety') || str.includes('police')) return 'bg-indigo-400';
    if (str.includes('road') || str.includes('transport')) return 'bg-amber-400';
    if (str.includes('park') || str.includes('garden')) return 'bg-green-400';
    if (str.includes('water')) return 'bg-cyan-400';
    if (str.includes('waste') || str.includes('sanitation')) return 'bg-teal-400';
    if (str.includes('light') || str.includes('electric')) return 'bg-yellow-400';
    return 'bg-purple-400';
  };

  return (
    <aside className="w-80 h-[calc(100vh-3rem)] bg-slate-950/95 border-r border-slate-800/80 flex flex-col z-20 select-none backdrop-blur-2xl shadow-2xl">
      {/* 3 Spacious Tabs (Layers, Basemaps, Legend) */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 shrink-0">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'layers'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-bold'
              : 'border-transparent hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{t('sidebar.layers_tab') || 'Layers'}</span>
        </button>

        <button
          onClick={() => setActiveTab('basemaps')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'basemaps'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-bold'
              : 'border-transparent hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Map className="w-4 h-4 text-blue-400" />
          <span>{t('sidebar.basemap_tab') || 'Basemaps'}</span>
        </button>

        <button
          onClick={() => setActiveTab('legend')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'legend'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-bold'
              : 'border-transparent hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ListOrdered className="w-4 h-4 text-amber-400" />
          <span>{t('sidebar.legend_tab') || 'Legend'}</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
        {/* ========================================================= */}
        {/* TAB 1: GIS LAYERS                                         */}
        {/* ========================================================= */}
        {activeTab === 'layers' && (
          <>
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={t('sidebar.search_layers') || 'Search GIS layers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Prominent Municipal Overlays & Civic Intelligence Toggles */}
            <div className="space-y-2">
              {/* 1. Active Citizen Reports (Individual Beacons on Map) */}
              <div
                onClick={toggleCitizenReports}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                  showCitizenReports
                    ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${showCitizenReports ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${showCitizenReports ? 'text-rose-200' : 'text-slate-200'}`}>
                      {i18n.language === 'hi' ? 'नागरिक शिकायत बीकन्स' : 'Active Citizen Reports'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {i18n.language === 'hi' ? 'मानचित्र पर व्यक्तिगत शिकायत बिंदु' : 'Individual complaint markers'}
                    </p>
                  </div>
                </div>

                <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${showCitizenReports ? 'bg-rose-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </div>
              </div>

              {/* 2. Ward Boundaries & Zones */}
              <div
                onClick={toggleWardBoundaries}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                  showWardBoundaries
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-cyan-950/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${showWardBoundaries ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${showWardBoundaries ? 'text-cyan-200' : 'text-slate-200'}`}>
                      {i18n.language === 'hi' ? 'वार्ड सीमाएं एवं ज़ोन' : 'Ward Boundaries & Zones'}
                    </p>
                    <p className="text-[10px] text-slate-400">{activeCity?.name_en || 'Gwalior'} Administrative Wards</p>
                  </div>
                </div>

                <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${showWardBoundaries ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </div>
              </div>
            </div>

            {/* GIS Layers Catalog Header */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1 pt-1">
              <span>{t('sidebar.active_layers', 'Active Layers')} ({activeLayerIds.size})</span>
              <span>{filteredLayers.length} {t('sidebar.total', 'Layers Total')}</span>
            </div>

            {/* Clean, Non-Congested Layers List */}
            <div className="space-y-2">
              {filteredLayers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                  No layers match your search query.
                </div>
              ) : (
                filteredLayers.map((layer) => {
                  const isActive = activeLayerIds.has(layer.id);
                  const currentOpacity = layerOpacity[layer.id] ?? 1.0;
                  const catDotColor = getCategoryColor(layer.slug, layer.category);

                  return (
                    <div
                      key={layer.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div
                        onClick={() => toggleLayer(layer.id)}
                        className="flex items-center justify-between gap-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${catDotColor} ${isActive ? 'ring-2 ring-cyan-400/30' : 'opacity-60'}`} />
                          <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {i18n.language === 'hi' ? layer.name_hi : layer.name_en}
                          </p>
                        </div>

                        {/* Clean Toggle Switch */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isActive ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                            <div className="bg-white w-3.5 h-3.5 rounded-full shadow-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Smooth Opacity Slider when layer is active */}
                      {isActive && (
                        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                            <span>Opacity</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.05"
                              value={currentOpacity}
                              onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                            <span className="font-mono text-[9px] text-cyan-300 w-6 text-right">
                              {Math.round(currentOpacity * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BASEMAP SELECTOR                                   */}
        {/* ========================================================= */}
        {activeTab === 'basemaps' && (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[
              { id: 'dark', name: 'Dark Matter', sub: 'High Contrast GIS', color: 'from-slate-900 to-indigo-950' },
              { id: 'light', name: 'Positron Light', sub: 'Clean Minimalist', color: 'from-slate-100 to-slate-300 text-slate-900' },
              { id: 'osm', name: 'OpenStreetMap', sub: 'Standard Streets', color: 'from-blue-900 to-emerald-950' },
              { id: 'satellite', name: 'ESRI Satellite', sub: 'High-Res Aerial', color: 'from-emerald-900 to-stone-900' },
              { id: 'satellite_labels', name: 'Satellite + Labels', sub: 'Aerial with Roads', color: 'from-blue-950 to-emerald-900' },
              { id: 'terrain', name: 'Voyager Topo', sub: 'Contours & Roads', color: 'from-cyan-950 to-slate-900' },
            ].map((bm) => (
              <button
                key={bm.id}
                onClick={() => setActiveBasemap(bm.id as BasemapStyle)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeBasemap === bm.id
                    ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg bg-slate-900'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className={`h-12 rounded-xl bg-gradient-to-tr ${bm.color} mb-2 flex items-center justify-center`}>
                  <Map className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-xs font-bold text-slate-100">{bm.name}</p>
                <p className="text-[10px] text-slate-400">{bm.sub}</p>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DYNAMIC LEGEND                                     */}
        {/* ========================================================= */}
        {activeTab === 'legend' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-300 font-semibold px-1">
              Active Map Legend ({activeLayersList.length + (showWardBoundaries ? 1 : 0) + (showCitizenReports ? 1 : 0)} visible)
            </p>

            {showCitizenReports && (
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-200">Active Citizen Reports</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white" />
                  <span>Verified Citizen Complaint Beacons</span>
                </div>
              </div>
            )}

            {showWardBoundaries && (
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-200">Ward Boundaries</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="w-4 h-2.5 border border-cyan-400 bg-cyan-500/20 rounded-sm" />
                  <span>Municipal Ward Boundaries & Administrative Zones</span>
                </div>
              </div>
            )}

            {activeLayersList.length === 0 && !showWardBoundaries && !showCitizenReports ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                No layers are currently active on the map. Toggle layers in the Layers tab to view symbols here.
              </div>
            ) : (
              activeLayersList.map((layer) => {
                const catDotColor = getCategoryColor(layer.slug, layer.category);
                return (
                  <div key={layer.id} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <p className="text-xs font-semibold text-slate-200">
                      {i18n.language === 'hi' ? layer.name_hi : layer.name_en}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span className={`w-3 h-3 rounded-full ${catDotColor}`} />
                      <span className="capitalize">{layer.category || layer.geometry_type}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
