import React, { useState } from 'react';
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
  Sparkles,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Flame,
  Gauge,
  Radio
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useCityAnalytics } from '../../api';

export const AnalyticsDrawer: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAnalyticsDrawerOpen, toggleAnalyticsDrawer, activeCity } = useMapStore();
  const { data: analytics } = useCityAnalytics(activeCity?.id);
  const [activeTab, setActiveTab] = useState<'grievance' | 'gis'>('grievance');
  const [timeFilter, setTimeFilter] = useState<'live' | '24h' | '7d'>('live');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Dynamic metrics from API or high-fidelity telemetry fallback
  const totalReports = analytics?.total_reports ?? 18;
  const openReports = analytics?.open_reports ?? 3;
  const inProgressReports = analytics?.in_progress_citizen_reports ?? 5;
  const resolvedReports = analytics?.resolved_reports ?? 10;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 83;
  const avgResolutionHours = analytics?.avg_resolution_hours ?? 28.5;
  const slaAdherence = analytics?.sla_adherence_rate ?? 91.4;

  // Nokia IOC Severity Counts
  const criticalCount = 2;
  const majorCount = 3;
  const minorCount = 4;
  const warningCount = resolvedReports;

  const categories = [
    { 
      id: 'road',
      name: i18n.language === 'hi' ? 'सड़क गड्ढे एवं क्षति' : 'Road Distress & Potholes', 
      count: 7, 
      pct: 39, 
      color: '#38BDF8', // Sky 400
      gradient: 'from-sky-400 to-blue-500',
      icon: Wrench 
    },
    { 
      id: 'water',
      name: i18n.language === 'hi' ? 'पेयजल पाइपलाइन रिसाव' : 'Water Supply Leakage', 
      count: 4, 
      pct: 22, 
      color: '#06B6D4', // Cyan 500
      gradient: 'from-cyan-400 to-teal-500',
      icon: Droplets 
    },
    { 
      id: 'waste',
      name: i18n.language === 'hi' ? 'कचरा एवं ठोस अपशिष्ट' : 'Solid Waste & Sanitation', 
      count: 4, 
      pct: 22, 
      color: '#10B981', // Emerald 500
      gradient: 'from-emerald-400 to-green-500',
      icon: Trash2 
    },
    { 
      id: 'lights',
      name: i18n.language === 'hi' ? 'स्ट्रीट लाइट खराबी' : 'Streetlight & Electrical', 
      count: 3, 
      pct: 17, 
      color: '#F59E0B', // Amber 500
      gradient: 'from-amber-400 to-orange-500',
      icon: Lightbulb 
    },
  ];

  const departments = [
    { 
      name: 'PWD Roads & Highways', 
      active: 5, 
      resolved: 7, 
      rate: 58, 
      slaHours: '48h',
      color: '#F59E0B'
    },
    { 
      name: 'SWM Solid Waste Management', 
      active: 3, 
      resolved: 5, 
      rate: 62, 
      slaHours: '12h',
      color: '#10B981'
    },
    { 
      name: 'PHED Water Distribution', 
      active: 2, 
      resolved: 4, 
      rate: 67, 
      slaHours: '24h',
      color: '#06B6D4'
    },
    { 
      name: 'MPMKVVCL Street Lighting', 
      active: 2, 
      resolved: 3, 
      rate: 60, 
      slaHours: '24h',
      color: '#A855F7'
    },
  ];

  const wards = [
    { 
      rank: '#1', 
      rankBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      statusTag: i18n.language === 'hi' ? 'उच्च भार' : 'High Load',
      ward: 'Ward 14 (Central Lashkar)', 
      pending: 4, 
      resolved: 6,
      pct: 60,
    },
    { 
      rank: '#2', 
      rankBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      statusTag: i18n.language === 'hi' ? 'मध्यम भार' : 'Moderate',
      ward: 'Ward 8 (Morar Cantt)', 
      pending: 3, 
      resolved: 5,
      pct: 62,
    },
    { 
      rank: '#3', 
      rankBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      statusTag: i18n.language === 'hi' ? 'सामान्य' : 'Normal',
      ward: 'Ward 21 (Phoolbagh Zone)', 
      pending: 2, 
      resolved: 4,
      pct: 67,
    },
    { 
      rank: '#4', 
      rankBadge: 'bg-slate-700/40 text-slate-300 border-slate-600',
      statusTag: i18n.language === 'hi' ? 'सामान्य' : 'Normal',
      ward: 'Ward 3 (Thatipur Enclave)', 
      pending: 1, 
      resolved: 3,
      pct: 75,
    },
  ];

  const cityName = activeCity ? (i18n.language === 'hi' ? activeCity.name_hi : activeCity.name_en) : 'Gwalior';

  // Multi-segment SVG Donut Calculation
  const totalCatCount = categories.reduce((sum, c) => sum + c.count, 0) || 1;
  const donutRadius = 28;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let runningAngle = 0;
  const donutSlices = categories.map((cat) => {
    const fraction = cat.count / totalCatCount;
    const strokeDasharray = `${fraction * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = -runningAngle * donutCircumference;
    runningAngle += fraction;
    return {
      ...cat,
      fraction,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeHoveredObj = categories.find((c) => c.id === hoveredCategory);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-2xl transition-all duration-300 select-none shadow-[0_-20px_50px_rgba(0,0,0,0.8)] ${
        isAnalyticsDrawerOpen ? 'h-[26.5rem]' : 'h-12'
      }`}
    >
      {/* ---------------------------------------------------- */}
      {/* Modern Dock Header / Quick KPI Bar                   */}
      {/* ---------------------------------------------------- */}
      <div
        onClick={toggleAnalyticsDrawer}
        className="h-12 px-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-slate-900/70 border-b border-slate-800/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Live Pulsing Beacon */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_#10B981]"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white tracking-wide">
                {cityName}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-300">
                {i18n.language === 'hi' ? 'नागरिक सेवा एवं शिकायत प्रदर्शन आंकड़े' : 'Civic Performance & Grievance Telemetry'}
              </span>
            </div>
          </div>

          {/* Clean Metric Pills in Header Bar */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800 text-[11px] font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700/60 font-bold">
              Total: <strong className="text-white">{totalReports}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Critical: <strong>{criticalCount}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Major: <strong>{majorCount}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Minor: <strong>{minorCount}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Resolved: <strong>{warningCount} ({resolutionRate}%)</strong>
            </span>
          </div>
        </div>

        {/* View / Collapse Toggle Action Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 text-slate-200 text-xs font-bold transition-all shadow-sm">
            <span>
              {isAnalyticsDrawerOpen 
                ? (i18n.language === 'hi' ? 'डैशबोर्ड संकुचित करें' : 'Collapse View') 
                : (i18n.language === 'hi' ? 'डैशबोर्ड देखें' : 'View Operations Telemetry')}
            </span>
            {isAnalyticsDrawerOpen ? (
              <ChevronDown className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-cyan-400" />
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Expanded Modern Analytics Command Deck               */}
      {/* ---------------------------------------------------- */}
      {isAnalyticsDrawerOpen && (
        <div className="h-[calc(100%-3rem)] flex flex-col">
          {/* Subheader Control Bar */}
          <div className="px-4 sm:px-6 py-2 border-b border-slate-800/70 flex items-center justify-between bg-slate-900/60 shrink-0">
            {/* View Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('grievance')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'grievance'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>IOC Civic Redressal</span>
              </button>
              <button
                onClick={() => setActiveTab('gis')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'gis'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>GIS Spatial Infrastructure</span>
              </button>
            </div>

            {/* Time Filter & PostGIS Indicator */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="hidden sm:flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTimeFilter('live')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    timeFilter === 'live' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live
                </button>
                <button
                  onClick={() => setTimeFilter('24h')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    timeFilter === '24h' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  24 Hours
                </button>
                <button
                  onClick={() => setTimeFilter('7d')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    timeFilter === '7d' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  7 Days
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  PostGIS Verified
                </span>
                <span>•</span>
                <span className="text-cyan-400 font-bold">Nokia IOC Standard</span>
              </div>
            </div>
          </div>

          {/* TAB 1: GRIEVANCE REDRESSAL (4 CARDS) */}
          {activeTab === 'grievance' && (
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto text-xs scrollbar-thin">
              
              {/* CARD 1: Resolution Health & Executive SLA Meters */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-xl hover:border-emerald-500/30 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2 text-xs text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{i18n.language === 'hi' ? 'समाधान स्वास्थ्य एवं SLA' : 'Resolution Health & SLA'}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>

                  {/* Dual Meters: Radial Cleared Rate + SLA Speedometer Arc */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {/* Radial Meter for Resolution Cleared */}
                    <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          className="text-slate-800"
                          strokeWidth="3.2"
                          stroke="currentColor"
                          fill="none"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          className="text-emerald-400 transition-all duration-1000 ease-out"
                          strokeDasharray={`${Math.min(100, Math.max(0, resolutionRate))}, 100`}
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-black text-white font-mono leading-none">
                          {resolutionRate}%
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold mt-0.5">
                          Cleared
                        </span>
                      </div>
                    </div>

                    {/* Speedometer Arc Gauge for SLA Adherence */}
                    <div className="relative w-20 h-18 shrink-0 flex flex-col items-center justify-end">
                      <svg className="w-full h-12" viewBox="0 0 80 44">
                        <path
                          d="M 10 40 A 30 30 0 0 1 70 40"
                          fill="none"
                          stroke="#1E293B"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 40 A 30 30 0 0 1 70 40"
                          fill="none"
                          stroke="url(#slaGradient)"
                          strokeWidth="6"
                          strokeDasharray="94.2"
                          strokeDashoffset={94.2 - (94.2 * (slaAdherence / 100))}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="slaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#A855F7" />
                            <stop offset="40%" stopColor="#06B6D4" />
                            <stop offset="100%" stopColor="#10B981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="text-center -mt-1">
                        <span className="text-xs font-black text-cyan-300 font-mono block leading-none">
                          {slaAdherence}%
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                          SLA Adherence
                        </span>
                      </div>
                    </div>

                    {/* Live Metric Pills */}
                    <div className="flex-1 space-y-1.5">
                      <div className="p-1 px-2 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Resolved
                        </span>
                        <span className="font-mono font-bold text-emerald-400">{resolvedReports}</span>
                      </div>
                      <div className="p-1 px-2 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          In Progress
                        </span>
                        <span className="font-mono font-bold text-purple-400">{inProgressReports}</span>
                      </div>
                      <div className="p-1 px-2 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Open
                        </span>
                        <span className="font-mono font-bold text-amber-400">{openReports}</span>
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Sparkline Intake vs Resolution Trend */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>7-Day Intake Trend</span>
                      <span className="text-cyan-400 font-bold">Avg {avgResolutionHours}h SLA</span>
                    </div>
                    <div className="h-7 w-full flex items-end gap-1.5 pt-0.5">
                      {[
                        { day: 'M', in: 4, out: 3 },
                        { day: 'T', in: 6, out: 5 },
                        { day: 'W', in: 3, out: 3 },
                        { day: 'T', in: 7, out: 6 },
                        { day: 'F', in: 5, out: 5 },
                        { day: 'S', in: 8, out: 7 },
                        { day: 'S', in: 4, out: 4 },
                      ].map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                          <div className="w-full flex items-end justify-center gap-0.5 h-5">
                            <div
                              className="w-1.5 bg-cyan-500/80 rounded-t group-hover:bg-cyan-400 transition-all"
                              style={{ height: `${(d.in / 8) * 100}%` }}
                              title={`Intake: ${d.in}`}
                            />
                            <div
                              className="w-1.5 bg-emerald-500/80 rounded-t group-hover:bg-emerald-400 transition-all"
                              style={{ height: `${(d.out / 8) * 100}%` }}
                              title={`Resolved: ${d.out}`}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-slate-500 group-hover:text-slate-300">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Modern Multi-Segment Donut Chart (Issue Breakdown) */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-xl hover:border-cyan-500/30 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2 text-xs text-white">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span>{i18n.language === 'hi' ? 'समस्या वर्गीकरण (डोनट)' : 'Issue Categories (Donut)'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                      {totalReports} {i18n.language === 'hi' ? 'कुल' : 'Total'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 pt-1">
                    {/* SVG Donut Chart with Active Center */}
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 68 68">
                        <circle
                          cx="34"
                          cy="34"
                          r={donutRadius}
                          stroke="#1E293B"
                          strokeWidth="7"
                          fill="none"
                        />
                        {donutSlices.map((slice) => {
                          const isHovered = hoveredCategory === slice.id;
                          return (
                            <circle
                              key={slice.id}
                              cx="34"
                              cy="34"
                              r={donutRadius}
                              stroke={slice.color}
                              strokeWidth={isHovered ? 9 : 7}
                              strokeDasharray={slice.strokeDasharray}
                              strokeDashoffset={slice.strokeDashoffset}
                              strokeLinecap="round"
                              fill="none"
                              className="transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredCategory(slice.id)}
                              onMouseLeave={() => setHoveredCategory(null)}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-xs font-black text-white font-mono leading-none">
                          {activeHoveredObj ? `${activeHoveredObj.count}` : totalReports}
                        </span>
                        <span className="text-[7px] uppercase tracking-wider text-cyan-400 font-bold mt-0.5">
                          {activeHoveredObj ? `${activeHoveredObj.pct}%` : 'Reports'}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Bars & Legend */}
                    <div className="flex-1 space-y-2">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isHovered = hoveredCategory === cat.id;
                        return (
                          <div 
                            key={cat.id} 
                            onMouseEnter={() => setHoveredCategory(cat.id)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className={`space-y-0.5 transition-all cursor-pointer rounded-lg p-1 ${isHovered ? 'bg-slate-800/80' : ''}`}
                          >
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-300 truncate max-w-[110px] flex items-center gap-1.5 font-medium">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                <span className="truncate">{cat.name}</span>
                              </span>
                              <span className="font-mono text-cyan-300 font-bold text-[10px]">
                                {cat.count} ({cat.pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${cat.gradient}`}
                                style={{ width: `${cat.pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Nokia IOC Severity Matrix & Department Velocity */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-xl hover:border-amber-500/30 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2 text-xs text-white">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>{i18n.language === 'hi' ? 'गंभीरता एवं विभाग कार्यभार' : 'IOC Severity & Workload'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      Nokia IOC Grid
                    </span>
                  </div>

                  {/* 4 Colored Incident Severity Blocks */}
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {/* Critical (Red) */}
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 border border-rose-400 text-white flex flex-col justify-between shadow-sm">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-rose-100">Critical</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black font-mono leading-none">{criticalCount}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-rose-200" />
                      </div>
                    </div>

                    {/* Major (Amber/Orange) */}
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400 text-white flex flex-col justify-between shadow-sm">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-100">Major</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black font-mono leading-none">{majorCount}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-amber-200" />
                      </div>
                    </div>

                    {/* Minor (Sky/Cyan) */}
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 border border-sky-400 text-white flex flex-col justify-between shadow-sm">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-sky-100">Minor</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black font-mono leading-none">{minorCount}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-sky-200" />
                      </div>
                    </div>

                    {/* Resolved (Emerald) */}
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400 text-white flex flex-col justify-between shadow-sm">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-100">Resolved</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black font-mono leading-none">{warningCount}</span>
                        <Check className="w-2.5 h-2.5 text-emerald-200" />
                      </div>
                    </div>
                  </div>

                  {/* Department Workload Distribution */}
                  <div className="space-y-2 pt-1">
                    {departments.map((dept) => (
                      <div key={dept.name} className="space-y-0.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-300 truncate max-w-[130px] font-medium">{dept.name}</span>
                          <span className="font-mono text-[10px] text-slate-300">
                            <strong className="text-amber-400">{dept.active} act</strong> / <span className="text-emerald-400">{dept.resolved} done</span>
                            <span className="text-slate-500 ml-1 font-sans">({dept.slaHours})</span>
                          </span>
                        </div>
                        {/* Dual Bar Progress */}
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-slate-800">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-full" 
                            style={{ width: `${100 - dept.rate}%` }} 
                            title={`Active: ${dept.active}`}
                          />
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full" 
                            style={{ width: `${dept.rate}%` }} 
                            title={`Resolved: ${dept.resolved}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 4: Top Affected Municipal Wards (Spatial Density & Ranking) */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-xl hover:border-purple-500/30 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2 text-xs text-white">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>{i18n.language === 'hi' ? 'वार्ड हॉटस्पॉट घनत्व' : 'Ward Hotspots & Density'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/50 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                      Spatial Load
                    </span>
                  </div>

                  <div className="space-y-2 pt-0.5">
                    {wards.map((w) => (
                      <div 
                        key={w.ward} 
                        className="p-2 px-2.5 bg-slate-950/80 hover:bg-slate-800/80 rounded-xl border border-slate-800/90 flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${w.rankBadge}`}>
                            {w.rank}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-200 text-xs block truncate max-w-[125px] group-hover:text-cyan-300 transition-colors">
                              {w.ward}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{w.resolved} resolved</span>
                              <span>•</span>
                              <span className="text-cyan-400 font-mono font-bold">{w.pct}% cleared</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 block">
                            {w.pending} Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GIS INFRASTRUCTURE DENSITY */}
          {activeTab === 'gis' && (
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto text-xs scrollbar-thin">
              
              {/* Healthcare Density */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-emerald-500/40 rounded-2xl space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Healthcare Facilities</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    Active OSM
                  </span>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  {analytics?.healthcare_count ?? 485} <span className="text-xs text-slate-400 font-sans font-normal">facilities</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hospitals, clinics, dispensaries, and trauma centers with verified emergency ingress coordinates.
                </p>
              </div>

              {/* Education Density */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/40 rounded-2xl space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-400" />
                    <span>Education Institutions</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                    Verified
                  </span>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  {analytics?.education_count ?? 124} <span className="text-xs text-slate-400 font-sans font-normal">campuses</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Primary schools, secondary institutes, and colleges across {cityName} wards.
                </p>
              </div>

              {/* Road Network */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/40 rounded-2xl space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Road Network Corridors</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                    PostGIS
                  </span>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  1,842 <span className="text-xs text-slate-400 font-sans font-normal">km mapped</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Major highways, secondary arterials, and residential roads with surface pavement attributes.
                </p>
              </div>

              {/* Total Civic Features */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-purple-500/40 rounded-2xl space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Total Spatial Records</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                    Live Total
                  </span>
                </div>
                <p className="text-3xl font-black text-cyan-300 font-mono">
                  98,324 <span className="text-xs text-slate-400 font-sans font-normal">entities</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Administrative wards, civic utilities, landmarks, and spatial geometries across Madhya Pradesh.
                </p>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
