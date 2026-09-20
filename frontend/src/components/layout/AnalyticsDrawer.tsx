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
  Clock
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

export const AnalyticsDrawer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAnalyticsDrawerOpen, toggleAnalyticsDrawer, activeCity } = useMapStore();

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
              {activeCity ? (i18n.language === 'hi' ? activeCity.name_hi : activeCity.name_en) : 'MP'}{' '}
              {t('analytics.title')}
            </span>
          </div>

          {/* Quick inline KPIs in collapsed state */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono pl-4 border-l border-[#2E3D60]">
            <span className="text-amber-400">
              ● 24 {t('analytics.open_reports')}
            </span>
            <span className="text-emerald-400">
              ● 118 {t('analytics.resolved_reports')}
            </span>
            <span className="text-rose-400">
              ● 3 {t('analytics.active_clusters')}
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
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {i18n.language === 'hi' ? 'समस्या समाधान दर' : 'Resolution Metrics'}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold font-mono text-cyan-400">83.1%</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-mono">
                <TrendingUp className="w-3 h-3" /> +4.2% (MoM)
              </span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" style={{ width: '83.1%' }} />
            </div>
            <p className="text-[10px] text-slate-400">Average resolution turnaround: 48.5 hours</p>
          </div>

          {/* Card 2: Category Distribution */}
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('analytics.category_distribution')}
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div>
                <div className="flex justify-between text-slate-300">
                  <span>Roads & Potholes</span>
                  <span className="font-mono">42%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300">
                  <span>Water Supply / Drainage</span>
                  <span className="font-mono">28%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: '28%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300">
                  <span>Sanitation / Waste</span>
                  <span className="font-mono">18%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '18%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 30-Day Velocity */}
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('analytics.trend_30d')}
            </div>
            <div className="flex items-center gap-1.5 h-16 pt-2">
              {[35, 42, 58, 48, 62, 54, 70, 65, 59, 48, 52, 45, 38].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-cyan-500/80 hover:bg-cyan-400 rounded-t transition-all"
                    style={{ height: `${(val / 70) * 100}%` }}
                    title={`Day ${idx + 1}: ${val} reports`}
                  />
                </div>
              ))}
            </div>
            <div className="text-[9px] text-slate-400 font-mono text-center">Past 14 Days Telemetry Wave</div>
          </div>

          {/* Card 4: Source Freshness & Health */}
          <div className="p-3 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{i18n.language === 'hi' ? 'डेटा स्रोत स्वास्थ्य' : 'Data Feeds Health'}</span>
              <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-mono">
                <CheckCircle2 className="w-3 h-3" /> All Normal
              </span>
            </div>
            <div className="space-y-1 text-[10px] text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>GARUD MP:</span>
                <span className="text-emerald-400">Synchronized</span>
              </div>
              <div className="flex justify-between">
                <span>ISRO Bhuvan WMS:</span>
                <span className="text-emerald-400">Operational</span>
              </div>
              <div className="flex justify-between">
                <span>MP eService Open API:</span>
                <span className="text-emerald-400">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Sarvam AI Engine:</span>
                <span className="text-cyan-400">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
