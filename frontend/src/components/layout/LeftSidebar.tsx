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
  Sparkles
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
  const { isLeftSidebarOpen, activeBasemap, setActiveBasemap } = useMapStore();
  const { layers, activeLayerIds, toggleLayer, setLayerOpacity, layerOpacity } = useLayerStore();
  const [activeTab, setActiveTab] = useState<TabType>('layers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayerForInfo, setSelectedLayerForInfo] = useState<GISLayer | null>(null);

  if (!isLeftSidebarOpen) return null;

  const filteredLayers = layers.filter((layer) => {
    const name = i18n.language === 'hi' ? layer.name_hi : layer.name_en;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: LAYERS LIST */}
        {activeTab === 'layers' && (
          <>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('sidebar.search_layers')}
                className="w-full bg-[#1C2541] border border-[#2E3D60] focus:border-cyan-400 pl-8 pr-3 py-1.5 rounded text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
                <span>{t('sidebar.active_layers')} ({activeLayerIds.size})</span>
                <span className="text-[10px] text-cyan-400 font-mono">Metadata-Driven</span>
              </div>

              {filteredLayers.map((layer) => {
                const isActive = activeLayerIds.has(layer.id);
                const layerName = i18n.language === 'hi' ? layer.name_hi : layer.name_en;
                const legendColor = layer.legend_config?.items?.[0]?.color || '#3B82F6';

                return (
                  <div
                    key={layer.id}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-[#1C2541] border-cyan-500/40 shadow-sm'
                        : 'bg-[#131B33]/60 border-[#2E3D60]/60 hover:border-[#2E3D60]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => toggleLayer(layer.id)}>
                        <div
                          className="w-3.5 h-3.5 rounded-sm shrink-0 border"
                          style={{
                            backgroundColor: isActive ? legendColor : 'transparent',
                            borderColor: legendColor,
                          }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{layerName}</span>
                            {layer.source_type === 'internal_postgis' && (
                              <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded font-mono">
                                PostGIS
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {i18n.language === 'hi' ? layer.description_hi : layer.description_en}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setSelectedLayerForInfo(layer)}
                          title={t('sidebar.source_info')}
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-[#253258]"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleLayer(layer.id)}
                          className={`p-1 rounded hover:bg-[#253258] ${
                            isActive ? 'text-cyan-400' : 'text-slate-500'
                          }`}
                        >
                          {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Opacity Control when Active */}
                    {isActive && (
                      <div className="mt-2 pt-2 border-t border-[#2E3D60]/50 flex items-center gap-2 text-[10px] text-slate-400">
                        <Sliders className="w-3 h-3 text-slate-400" />
                        <span>{t('sidebar.opacity')}:</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={layerOpacity[layer.id] ?? 0.85}
                          onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: SECTORS */}
        {activeTab === 'sectors' && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              {i18n.language === 'hi' ? 'क्षेत्रवार वर्गीकरण' : 'Civic Sectors Taxonomy'}
            </div>
            {sectors.map((sec) => (
              <div
                key={sec.id}
                className="p-2.5 rounded-lg bg-[#1C2541] border border-[#2E3D60] flex items-center justify-between hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sec.color_hex }}
                  />
                  <span className="text-xs font-semibold text-slate-100">
                    {i18n.language === 'hi' ? sec.name_hi : sec.name_en}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  {sec.code}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              {i18n.language === 'hi' ? 'शासकीय विभाग' : 'Government Departments'}
            </div>
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-2.5 rounded-lg bg-[#1C2541] border border-[#2E3D60] space-y-1"
              >
                <div className="text-xs font-semibold text-slate-100">
                  {i18n.language === 'hi' ? dept.name_hi : dept.name_en}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{dept.short_name_en}</span>
                  {dept.portal_url && (
                    <a
                      href={dept.portal_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline font-mono"
                    >
                      Portal ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: BASEMAPS */}
        {activeTab === 'basemaps' && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              {i18n.language === 'hi' ? 'मानचित्र शैली' : 'Select Basemap Style'}
            </div>
            {[
              { id: 'dark', label: t('basemap.street'), desc: 'Optimized dark GIS background' },
              { id: 'satellite', label: t('basemap.satellite'), desc: 'High-resolution aerial imagery' },
              { id: 'terrain', label: t('basemap.terrain'), desc: 'Topographic contour & hillshade' },
              { id: 'light', label: t('basemap.light'), desc: 'High-contrast light street canvas' },
            ].map((bm) => (
              <div
                key={bm.id}
                onClick={() => setActiveBasemap(bm.id as BasemapStyle)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeBasemap === bm.id
                    ? 'bg-cyan-950/30 border-cyan-400'
                    : 'bg-[#1C2541] border-[#2E3D60] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{bm.label}</span>
                  {activeBasemap === bm.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{bm.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layer Info Modal / Drawer */}
      {selectedLayerForInfo && (
        <div className="p-3 bg-[#131B33] border-t border-[#2E3D60] text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-400">
              {i18n.language === 'hi' ? selectedLayerForInfo.name_hi : selectedLayerForInfo.name_en}
            </span>
            <button
              onClick={() => setSelectedLayerForInfo(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] text-slate-300">
            {i18n.language === 'hi' ? selectedLayerForInfo.description_hi : selectedLayerForInfo.description_en}
          </p>
          <div className="text-[9px] text-slate-400 font-mono space-y-0.5 pt-1 border-t border-slate-700">
            <div>Type: {selectedLayerForInfo.geometry_type} ({selectedLayerForInfo.source_type})</div>
            <div>Freshness SLA: {selectedLayerForInfo.freshness_sla_days} days</div>
          </div>
        </div>
      )}
    </aside>
  );
};
