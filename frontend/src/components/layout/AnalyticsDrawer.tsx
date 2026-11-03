import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  Building2, 
  Layers,
  Wrench,
  Droplets,
  Trash2,
  Lightbulb,
  Activity,
  Sparkles
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useCityAnalytics } from '../../api';

export const AnalyticsDrawer: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAnalyticsDrawerOpen, toggleAnalyticsDrawer, activeCity } = useMapStore();
  const { data: analytics } = useCityAnalytics(activeCity?.id);

  // Compute metrics dynamically from API or local fallback
  const totalReports = analytics?.total_reports ?? 18;
  const openReports = analytics?.open_reports ?? 3;
  const inProgressReports = analytics?.in_progress_citizen_reports ?? 5;
  const resolvedReports = analytics?.resolved_reports ?? 10;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 83;
  const avgResolutionHours = analytics?.avg_resolution_hours ?? 28.5;
  const slaAdherence = analytics?.sla_adherence_rate ?? 91.4;

  const categories = [
    { 
      name: i18n.language === 'hi' ? 'सड़क गड्ढे एवं क्षति' : 'Road Distress & Potholes', 
      count: 7, 
      pct: 39, 
      color: 'from-amber-500 to-orange-400', 
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Wrench 
    },
    { 
      name: i18n.language === 'hi' ? 'पेयजल पाइपलाइन रिसाव' : 'Water Supply Leakage', 
      count: 4, 
      pct: 22, 
      color: 'from-cyan-500 to-blue-500', 
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: Droplets 
    },
    { 
      name: i18n.language === 'hi' ? 'कचरा एवं ठोस अपशिष्ट' : 'Solid Waste & Sanitation', 
      count: 4, 
      pct: 22, 
      color: 'from-emerald-500 to-teal-400', 
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: Trash2 
    },
    { 
      name: i18n.language === 'hi' ? 'स्ट्रीट लाइट खराबी' : 'Streetlight & Electrical', 
      count: 3, 
      pct: 17, 
      color: 'from-purple-500 to-pink-500', 
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: Lightbulb 
    },
  ];

  const departments = [
    { 
      name: 'PWD Roads & Highways', 
      active: 5, 
      resolved: 7, 
      rate: 58, 
      gradient: 'from-amber-400 to-orange-500',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
    },
    { 
      name: 'SWM Solid Waste Management', 
      active: 3, 
      resolved: 5, 
      rate: 62, 
      gradient: 'from-emerald-400 to-teal-500',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
    },
    { 
      name: 'PHED Water Distribution', 
      active: 2, 
      resolved: 4, 
      rate: 67, 
      gradient: 'from-cyan-400 to-blue-500',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' 
    },
    { 
      name: 'MPMKVVCL Street Lighting', 
      active: 2, 
      resolved: 3, 
      rate: 60, 
      gradient: 'from-purple-400 to-pink-500',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
    },
  ];

  const wards = [
    { 
      rank: '#1', 
      rankColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      ward: 'Ward 14 (Central Lashkar)', 
      pending: 4, 
      resolved: 6,
      pct: 60 
    },
    { 
      rank: '#2', 
      rankColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      ward: 'Ward 8 (Morar Cantt)', 
      pending: 3, 
      resolved: 5,
      pct: 62 
    },
    { 
      rank: '#3', 
      rankColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      ward: 'Ward 21 (Phoolbagh Zone)', 
      pending: 2, 
      resolved: 4,
      pct: 67 
    },
    { 
      rank: '#4', 
      rankColor: 'bg-slate-700/40 text-slate-300 border-slate-600',
      ward: 'Ward 3 (Thatipur Enclave)', 
      pending: 1, 
      resolved: 3,
      pct: 75 
    },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 bg-[#0B132B]/95 border-t border-cyan-500/30 backdrop-blur-xl transition-all duration-300 select-none shadow-[0_-12px_40px_rgba(0,0,0,0.65)] ${
        isAnalyticsDrawerOpen ? 'h-[23.5rem] sm:h-[22.5rem]' : 'h-11'
      }`}
    >
      {/* Drawer Toggle Bar */}
      <div
        onClick={toggleAnalyticsDrawer}
        className="h-11 px-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-[#1C2541]/50 border-b border-[#2E3D60]/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Live Pulsing Beacon */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-100 tracking-wide">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>
                {activeCity ? (i18n.language === 'hi' ? activeCity.name_hi : activeCity.name_en) : 'Gwalior'}{' '}
                {i18n.language === 'hi' ? 'नागरिक सेवा एवं शिकायत प्रदर्शन आंकड़े' : 'Civic Performance & Grievance Telemetry'}
              </span>
            </div>
          </div>

          {/* Quick summary chips in collapsed bar */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#2E3D60] text-[11px] font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 text-slate-200 border border-slate-700 shadow-sm">
              Total: <strong className="text-white font-bold">{totalReports}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Open: <strong className="font-bold">{openReports}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              In Progress: <strong className="font-bold">{inProgressReports}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Resolved: <strong className="font-bold">{resolvedReports} ({resolutionRate}%)</strong>
            </span>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-[11px] font-semibold transition-all">
            <span>{isAnalyticsDrawerOpen ? 'Collapse Telemetry' : 'View City Telemetry Dashboard'}</span>
            {isAnalyticsDrawerOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded 4 Visual Analytics Cards */}
      {isAnalyticsDrawerOpen && (
        <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 h-[calc(100%-2.75rem)] overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-[#2E3D60] scrollbar-track-transparent">
          
          {/* Card 1: Resolution Health & Circular Gauge */}
          <div className="p-3.5 bg-gradient-to-br from-[#131B33] to-[#1C2541] border border-[#2E3D60] rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Resolution Health</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Live KPI
                </span>
              </div>

              {/* Radial Donut Gauge & Metrics */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                {/* SVG Radial Gauge */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out"
                      strokeDasharray={`${Math.min(100, Math.max(0, resolutionRate))}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-black text-white font-mono leading-none">
                      {resolutionRate}%
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold mt-0.5">
                      Cleared
                    </span>
                  </div>
                </div>

                {/* 3 Metric Pill Blocks */}
                <div className="flex-1 space-y-1.5">
                  <div className="p-1.5 bg-[#0B132B]/80 rounded-lg border border-[#2E3D60]/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      Resolved
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">{resolvedReports}</span>
                  </div>
                  <div className="p-1.5 bg-[#0B132B]/80 rounded-lg border border-[#2E3D60]/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                      In Progress
                    </span>
                    <span className="font-mono font-bold text-purple-400 text-xs">{inProgressReports}</span>
                  </div>
                  <div className="p-1.5 bg-[#0B132B]/80 rounded-lg border border-[#2E3D60]/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      Submitted
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-xs">{openReports}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Turnaround & SLA Footer */}
            <div className="pt-2 border-t border-[#2E3D60]/60 flex items-center justify-between text-[11px] text-slate-300 mt-2">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Mean SLA:</span>
              </span>
              <span className="font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                {avgResolutionHours} hrs ({slaAdherence}% adherence)
              </span>
            </div>
          </div>

          {/* Card 2: Issue Breakdown (Horizontal Gradient Bars) */}
          <div className="p-3.5 bg-gradient-to-br from-[#131B33] to-[#1C2541] border border-[#2E3D60] rounded-xl flex flex-col justify-between shadow-lg hover:border-cyan-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Issue Breakdown</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                  {totalReports} Total Issues
                </span>
              </div>

              <div className="space-y-2 pt-0.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[150px]">
                          <span className={`w-5 h-5 rounded flex items-center justify-center border ${cat.bg} shrink-0`}>
                            <Icon className="w-3 h-3" />
                          </span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <span className="font-mono text-slate-100 font-bold text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                          {cat.count} ({cat.pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div 
                          className={`bg-gradient-to-r ${cat.color} h-full rounded-full transition-all duration-700`} 
                          style={{ width: `${cat.pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Department Workload Allocation */}
          <div className="p-3.5 bg-gradient-to-br from-[#131B33] to-[#1C2541] border border-[#2E3D60] rounded-xl flex flex-col justify-between shadow-lg hover:border-amber-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Department Workload</span>
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  Active Dispatch
                </span>
              </div>

              <div className="space-y-2 pt-0.5">
                {departments.map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 truncate max-w-[130px] font-medium">{dept.name}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${dept.badge}`}>
                          {dept.rate}% Done
                        </span>
                        <span className="text-slate-300">
                          <strong className="text-amber-400">{dept.active}</strong>/<span className="text-emerald-400">{dept.resolved}</span>
                        </span>
                      </div>
                    </div>
                    {/* Dual Stacked Progress Bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex border border-slate-800">
                      <div 
                        className="bg-emerald-500 h-full" 
                        style={{ width: `${dept.rate}%` }} 
                        title={`Resolved: ${dept.resolved}`}
                      />
                      <div 
                        className="bg-amber-400 h-full" 
                        style={{ width: `${100 - dept.rate}%` }} 
                        title={`Active: ${dept.active}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Top Affected Municipal Wards */}
          <div className="p-3.5 bg-gradient-to-br from-[#131B33] to-[#1C2541] border border-[#2E3D60] rounded-xl flex flex-col justify-between shadow-lg hover:border-purple-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Ward Hotspots</span>
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/50 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                  Spatial Load
                </span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                {wards.map((w) => (
                  <div 
                    key={w.ward} 
                    className="p-1.5 px-2 bg-[#0B132B]/90 hover:bg-[#1C2541] rounded-lg border border-[#2E3D60]/60 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${w.rankColor}`}>
                        {w.rank}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-200 text-[11px] block truncate max-w-[110px] group-hover:text-cyan-300 transition-colors">
                          {w.ward}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                          <span>{w.resolved} resolved</span>
                          <span>•</span>
                          <span className="text-cyan-400">{w.pct}% resolved</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shrink-0">
                      {w.pending} Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
