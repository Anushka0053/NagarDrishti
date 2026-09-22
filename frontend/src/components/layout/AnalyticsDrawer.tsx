import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ChevronUp, 
  ChevronDown, 
  Activity,
  Layers,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useCityAnalytics, useSourcesStatus } from '../../api';

export const AnalyticsDrawer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAnalyticsDrawerOpen, toggleAnalyticsDrawer, activeCity } = useMapStore();
  const { data: analytics, isLoading } = useCityAnalytics(activeCity?.id);
  const { data: sourcesStatus } = useSourcesStatus();

  const totalReports = analytics?.total_reports ?? 0;
  const openReports = analytics?.open_reports ?? 0;
  const resolvedReports = analytics?.resolved_reports ?? 0;
  const activeClusters = analytics?.active_clusters_count ?? 0;
  const verifiedAssets = analytics?.verified_features_count ?? 0;
  const resolutionRate = analytics?.resolution_rate;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 bg-[#0B132B]/95 border-t border-[#2E3D60] backdrop-blur-md transition-all duration-300 select-none ${
        isAnalyticsDrawerOpen ? 'h-64' : 'h-10'
      }`}
    >
      {/* Drawer Toggle Bar */}
      <div
        onClick={toggleAnalyticsDrawer}
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-[#1C2541]/50 border-b border-[#2E3D60]/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>
              {activeCity ? (i18n.language === 'hi' ? activeCity.name_hi : activeCity.name_en) : 'Madhya Pradesh'}{' '}
              {t('analytics.title')}
            </span>
          </div>

          {/* Quick inline KPIs in collapsed state - Authentically aggregated */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono pl-4 border-l border-[#2E3D60]">
            <span className={openReports > 0 ? "text-amber-400" : "text-slate-400"}>
              ● {openReports} {t('analytics.open_reports')}
            </span>
            <span className={resolvedReports > 0 ? "text-emerald-400" : "text-slate-400"}>
              ● {resolvedReports} {t('analytics.resolved_reports')}
            </span>
            <span className={activeClusters > 0 ? "text-rose-400" : "text-slate-400"}>
              ● {activeClusters} {t('analytics.active_clusters')}
            </span>
            <span className="text-cyan-400">
              ● {verifiedAssets} Verified Assets
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span className="text-[10px] hidden md:inline font-mono">
            {isAnalyticsDrawerOpen ? t('analytics.collapse') : t('analytics.expand')}
          </span>
          {isAnalyticsDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Analytics Content */}
      {isAnalyticsDrawerOpen && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100%-2.5rem)] overflow-y-auto text-xs">
          {/* Card 1: Key Metrics */}
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{i18n.language === 'hi' ? 'समस्या समाधान दर' : 'Resolution Performance'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold font-mono text-cyan-400">
                  {resolutionRate !== null && resolutionRate !== undefined ? `${resolutionRate}%` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {totalReports} total {totalReports === 1 ? 'report' : 'reports'}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${resolutionRate ?? 0}%` }} 
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 border-t border-[#2E3D60]/50 pt-1.5">
              {totalReports === 0 
                ? 'No citizen reports logged yet in live database.' 
                : `${openReports} pending action • ${resolvedReports} verified resolved`}
            </p>
          </div>

          {/* Card 2: Category Distribution */}
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2 overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('analytics.category_distribution')}
            </div>
            {analytics?.category_breakdown && analytics.category_breakdown.length > 0 ? (
              <div className="space-y-1.5 text-[10px]">
                {analytics.category_breakdown.map((cat) => {
                  const pct = totalReports > 0 ? Math.round((cat.count / totalReports) * 100) : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between text-slate-300">
                        <span className="capitalize">{cat.category_name_en || cat.category.replace('_', ' ')}</span>
                        <span className="font-mono text-cyan-400">{cat.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic py-3 text-center">
                No civic complaints recorded in live database yet.
              </div>
            )}
          </div>

          {/* Card 3: Ward Coverage & Assets */}
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{i18n.language === 'hi' ? 'स्थानिक कवरेज' : 'Spatial Foundation'}</span>
                <Layers className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Verified Civic Features:</span>
                  <span className="font-mono font-bold text-amber-400">{verifiedAssets}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Active Hotspot Clusters:</span>
                  <span className="font-mono font-bold text-rose-400">{activeClusters}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Administrative Wards:</span>
                  <span className="font-mono font-bold text-cyan-400">{analytics?.ward_breakdown?.length ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 font-mono bg-[#0B132B] p-1.5 rounded border border-[#2E3D60]/50">
              {analytics?.data_truth_note || 'Authentic PostGIS geospatial aggregations.'}
            </div>
          </div>

          {/* Card 4: Source Freshness & Health */}
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2 overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{i18n.language === 'hi' ? 'डेटा स्रोत स्वास्थ्य' : 'Data Feeds Health'}</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="space-y-1.5 text-[10px] text-slate-300">
              {sourcesStatus && sourcesStatus.length > 0 ? (
                sourcesStatus.slice(0, 4).map((s) => {
                  const isHealthy = s.health_status === 'healthy';
                  const isPending = s.health_status === 'integration_pending';
                  const isKeyReq = s.health_status === 'credential_required';

                  return (
                    <div key={s.source_key} className="flex items-center justify-between">
                      <span className="truncate pr-1">{s.name_en.split(' ')[0]}:</span>
                      {isHealthy && (
                        <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Operational
                        </span>
                      )}
                      {isKeyReq && (
                        <span className="text-amber-400 font-mono text-[9px] flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Key Req
                        </span>
                      )}
                      {isPending && (
                        <span className="text-slate-400 font-mono text-[9px] flex items-center gap-0.5">
                          MOU Pending
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] text-slate-500 italic py-2">Loading source telemetry...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

