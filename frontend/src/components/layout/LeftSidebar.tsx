import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  Grid, 
  Building2, 
  Map, 
  ListOrdered, 
  Search, 
  Eye, 
  EyeOff, 
  Sliders, 
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';
import { useLayerStore } from '../../store/layerStore';
import { useMapStore, BasemapStyle } from '../../store/mapStore';
import { Sector, Department, GISLayer } from '../../types';

interface LeftSidebarProps {
  sectors: Sector[];
  departments: Department[];
}

type TabType = 'layers' | 'sectors' | 'departments' | 'basemaps' | 'legend';

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ sectors, departments }) => {
  const { t, i18n } = useTranslation();
  const { isLeftSidebarOpen, activeBasemap, setActiveBasemap, activeCity } = useMapStore();
  const {
    layers,
    activeLayerIds,
    toggleLayer,
    setLayerOpacity,
    layerOpacity,
    selectedSectorId,
    setSelectedSectorId,
    selectedDepartmentId,
    setSelectedDepartmentId,
    showWardBoundaries,
    toggleWardBoundaries,
  } = useLayerStore();

  const [activeTab, setActiveTab] = useState<TabType>('layers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayerForInfo, setSelectedLayerForInfo] = useState<GISLayer | null>(null);

  if (!isLeftSidebarOpen) return null;

  // Filter layers by search term, sector, and department
  const filteredLayers = layers.filter((layer) => {
    const name = i18n.language === 'hi' ? layer.name_hi : layer.name_en;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = !selectedSectorId || layer.sector_id === selectedSectorId;
    const matchesDept = !selectedDepartmentId || layer.department_id === selectedDepartmentId;
    return matchesSearch && matchesSector && matchesDept;
  });

  // Calculate active layers for legend tab
  const activeLayersList = layers.filter((l) => activeLayerIds.has(l.id));

  return (
    <aside className="w-80 h-[calc(100vh-3.5rem)] bg-[#0B132B]/90 border-r border-[#2E3D60] flex flex-col z-20 select-none backdrop-blur-md">
      {/* Navigation Tabs Header */}
      <div className="flex border-b border-[#2E3D60] bg-[#1C2541]/60 text-[11px] font-semibold text-slate-400">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'layers'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('sidebar.layers_tab')}</span>
        </button>
        <button
          onClick={() => setActiveTab('sectors')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'sectors'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{t('sidebar.sectors_tab')}</span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'departments'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{t('sidebar.departments_tab')}</span>
        </button>
        <button
          onClick={() => setActiveTab('basemaps')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'basemaps'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>{t('sidebar.basemap_tab')}</span>
        </button>
        <button
          onClick={() => setActiveTab('legend')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'legend'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>{t('sidebar.legend_tab')}</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Active Filters Badges */}
        {(selectedSectorId || selectedDepartmentId) && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#1C2541]/80 rounded border border-[#2E3D60] text-[10px]">
            <span className="text-slate-400">Filters:</span>
            {selectedSectorId && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span>{sectors.find((s) => s.id === selectedSectorId)?.name_en}</span>
                <button onClick={() => setSelectedSectorId(null)}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {selectedDepartmentId && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <span>{departments.find((d) => d.id === selectedDepartmentId)?.short_name_en || 'Dept'}</span>
                <button onClick={() => setSelectedDepartmentId(null)}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* TAB 1: LAYERS LIST */}
        {activeTab === 'layers' && (
          <>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={t('sidebar.search_layers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1C2541] border border-[#2E3D60] focus:border-cyan-400 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Administrative Geography Boundaries Layer Row */}
            <div className="p-2.5 rounded bg-[#131B33] border border-[#2E3D60] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {i18n.language === 'hi' ? 'वार्ड सीमाएं एवं ज़ोन' : 'Ward Boundaries & Zones'}
                  </p>
                  <p className="text-[10px] text-slate-400">{activeCity?.name_en || 'Gwalior'} Wards</p>
                </div>
              </div>
              <button
                onClick={toggleWardBoundaries}
                className={`p-1.5 rounded transition-colors ${
                  showWardBoundaries ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {showWardBoundaries ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <span>{t('sidebar.active_layers')} ({activeLayerIds.size})</span>
                <span>{filteredLayers.length} {t('sidebar.total')}</span>
              </div>

              {filteredLayers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No layers match the current filter.
                </div>
              ) : (
                filteredLayers.map((layer) => {
                  const isActive = activeLayerIds.has(layer.id);
                  const currentOpacity = layerOpacity[layer.id] ?? 1.0;
                  return (
                    <div
                      key={layer.id}
                      className={`p-2.5 rounded-md border transition-all ${
                        isActive
                          ? 'bg-[#1C2541]/90 border-cyan-500/40 shadow-sm'
                          : 'bg-[#1C2541]/40 border-[#2E3D60]/60 hover:border-[#2E3D60]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={() => toggleLayer(layer.id)}
                            className={`p-1 rounded mt-0.5 transition-colors ${
                              isActive
                                ? 'text-cyan-400 hover:text-cyan-300 bg-cyan-950/50'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold truncate ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                              {i18n.language === 'hi' ? layer.name_hi : layer.name_en}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {layer.geometry_type}
                              </span>
                              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-emerald-400" />
                                {layer.source_type}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedLayerForInfo(layer)}
                          title="View Layer Metadata"
                          className="text-slate-400 hover:text-cyan-400 p-1"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Opacity Slider for Active Layers */}
                      {isActive && (
                        <div className="mt-2.5 pt-2 border-t border-[#2E3D60]/50 flex items-center gap-2">
                          <Sliders className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-400 w-12">
                            {Math.round(currentOpacity * 100)}%
                          </span>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={currentOpacity}
                            onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: SECTORS */}
        {activeTab === 'sectors' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 font-medium px-1">
              Select a sector to view and filter associated civic GIS layers.
            </p>
            {sectors.map((sec) => {
              const isSelected = selectedSectorId === sec.id;
              const sectorLayers = layers.filter((l) => l.sector_id === sec.id);
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSelectedSectorId(isSelected ? null : sec.id);
                    setActiveTab('layers');
                  }}
                  className={`w-full p-2.5 rounded-md border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                      : 'bg-[#1C2541]/50 border-[#2E3D60] hover:bg-[#1C2541] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sec.color_hex || '#F59E0B' }}
                    />
                    <div>
                      <p className="text-xs font-semibold">{i18n.language === 'hi' ? sec.name_hi : sec.name_en}</p>
                      <p className="text-[10px] text-slate-400">{sectorLayers.length} Layers</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Filtered</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 3: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 font-medium px-1">
              Browse civic infrastructure by responsible government departments.
            </p>
            {departments.map((dept) => {
              const isSelected = selectedDepartmentId === dept.id;
              const deptLayers = layers.filter((l) => l.department_id === dept.id);
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDepartmentId(isSelected ? null : dept.id);
                    setActiveTab('layers');
                  }}
                  className={`w-full p-2.5 rounded-md border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                      : 'bg-[#1C2541]/50 border-[#2E3D60] hover:bg-[#1C2541] text-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{i18n.language === 'hi' ? dept.name_hi : dept.name_en}</p>
                    <p className="text-[10px] text-slate-400">
                      {dept.short_name_en} • {deptLayers.length} Layers
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">Filtered</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 4: BASEMAP SELECTOR */}
        {activeTab === 'basemaps' && (
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'dark', name: 'Dark Matter', sub: 'High Contrast GIS', color: 'from-slate-900 to-indigo-950' },
              { id: 'light', name: 'Positron Light', sub: 'Minimalist Print', color: 'from-slate-100 to-slate-300 text-slate-900' },
              { id: 'osm', name: 'OpenStreetMap', sub: 'Standard Streets', color: 'from-blue-900 to-emerald-950' },
              { id: 'satellite', name: 'ESRI Satellite', sub: 'High-Res Aerial', color: 'from-emerald-900 to-stone-900' },
              { id: 'terrain', name: 'Voyager Topo', sub: 'Contours & Roads', color: 'from-cyan-950 to-slate-900' },
            ].map((bm) => (
              <button
                key={bm.id}
                onClick={() => setActiveBasemap(bm.id as BasemapStyle)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  activeBasemap === bm.id
                    ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
                    : 'border-[#2E3D60] hover:border-slate-400'
                }`}
              >
                <div className={`h-12 rounded bg-gradient-to-tr ${bm.color} mb-2 flex items-center justify-center`}>
                  <Map className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-xs font-bold text-slate-100">{bm.name}</p>
                <p className="text-[10px] text-slate-400">{bm.sub}</p>
              </button>
            ))}
          </div>
        )}

        {/* TAB 5: DYNAMIC LEGEND */}
        {activeTab === 'legend' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 font-medium px-1">
              Active Map Legend ({activeLayersList.length} visible layers)
            </p>

            {showWardBoundaries && (
              <div className="p-2.5 bg-[#1C2541]/70 rounded-md border border-[#2E3D60]">
                <p className="text-xs font-semibold text-slate-200 mb-1.5">Ward Boundaries</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="w-4 h-2.5 border border-cyan-400 bg-cyan-500/20 rounded-sm" />
                  <span>Municipal Ward Polygon</span>
                </div>
              </div>
            )}

            {activeLayersList.map((layer) => (
              <div key={layer.id} className="p-2.5 bg-[#1C2541]/70 rounded-md border border-[#2E3D60]">
                <p className="text-xs font-semibold text-slate-200 mb-2">
                  {i18n.language === 'hi' ? layer.name_hi : layer.name_en}
                </p>
                {layer.legend_config?.items ? (
                  <div className="space-y-1.5">
                    {layer.legend_config.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{i18n.language === 'hi' ? item.label_hi : item.label_en}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: layer.style_config?.fill_color || '#06B6D4' }}
                    />
                    <span>{layer.name_en}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layer Metadata Modal / Inspector Drawer */}
      {selectedLayerForInfo && (
        <div className="p-3 bg-[#131B33] border-t border-[#2E3D60] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-400">Layer Metadata</span>
            <button onClick={() => setSelectedLayerForInfo(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <p className="font-semibold text-slate-100">{selectedLayerForInfo.name_en}</p>
          <p className="text-[11px] text-slate-400">{selectedLayerForInfo.description_en || 'Authoritative GIS layer'}</p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono pt-1">
            <div>Type: {selectedLayerForInfo.geometry_type}</div>
            <div>Source: {selectedLayerForInfo.source_type}</div>
            <div>Zoom: {selectedLayerForInfo.min_zoom}-{selectedLayerForInfo.max_zoom}</div>
            <div>Queryable: {selectedLayerForInfo.is_queryable ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </aside>
  );
};
