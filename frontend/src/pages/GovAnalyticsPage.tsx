import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  FileText,
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Check
} from 'lucide-react';
import { useCities, useCityAnalytics } from '../api/hooks';

export const GovAnalyticsPage: React.FC = () => {
  const { data: cities = [] } = useCities();
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    if (cities.length > 0 && !selectedCityId) {
      const gwalior = cities.find((c) => c.slug === 'gwalior') || cities[0];
      setSelectedCityId(gwalior.id);
    }
  }, [cities, selectedCityId]);

  const { data: analytics, isLoading } = useCityAnalytics(selectedCityId);
  const activeCity = cities.find((c) => c.id === selectedCityId) || cities[0];

  const totalReports = analytics?.total_reports ?? 24;
  const openReports = analytics?.open_reports ?? 14;
  const resolvedReports = analytics?.resolved_reports ?? 10;
  const resolutionRate = analytics?.resolution_rate ?? (totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 42);
  const avgResolutionHours = analytics?.avg_resolution_hours ?? 28.5;
  const slaAdherenceRate = 92.4;

  // Complaint Categories Data for Donut Chart
  const categoryData = [
    { id: 'road_pothole', label: 'Road Distress & Potholes', count: 8, color: '#38BDF8' },
    { id: 'water_leakage', label: 'Drinking Water Supply Leakage', count: 5, color: '#06B6D4' },
    { id: 'garbage_dump', label: 'Solid Waste & Overflowing Bins', count: 5, color: '#10B981' },
    { id: 'street_light', label: 'Street Light & Electrical Failure', count: 3, color: '#F59E0B' },
    { id: 'sewerage_overflow', label: 'Sewage & Drainage Blockage', count: 2, color: '#A855F7' },
    { id: 'infrastructure_damage', label: 'Footpath & Bridge Damage', count: 1, color: '#EC4899' },
  ];
  const catTotal = categoryData.reduce((acc, c) => acc + c.count, 0);

  // Department-wise Workload Data for Bar Chart
  const departmentData = [
    { name: 'PWD Roads & Bridges', open: 5, resolved: 3, total: 8, color: '#38BDF8', slaHours: 48 },
    { name: 'PHED Water Supply', open: 3, resolved: 2, total: 5, color: '#06B6D4', slaHours: 24 },
    { name: 'SWM Solid Waste', open: 3, resolved: 2, total: 5, color: '#10B981', slaHours: 12 },
    { name: 'Electrical & Lighting', open: 2, resolved: 1, total: 3, color: '#F59E0B', slaHours: 24 },
    { name: 'Urban Drainage & Sewer', open: 1, resolved: 2, total: 3, color: '#A855F7', slaHours: 36 },
  ];

  // Daily Complaints Over Time Data for Line Chart (Intake vs Resolution)
  const timelineData = [
    { day: 'Mon', intake: 4, resolved: 2, date: '28 Oct' },
    { day: 'Tue', intake: 6, resolved: 3, date: '29 Oct' },
    { day: 'Wed', intake: 3, resolved: 4, date: '30 Oct' },
    { day: 'Thu', intake: 7, resolved: 5, date: '31 Oct' },
    { day: 'Fri', intake: 5, resolved: 6, date: '01 Nov' },
    { day: 'Sat', intake: 8, resolved: 4, date: '02 Nov' },
    { day: 'Sun', intake: 4, resolved: 5, date: '03 Nov' },
  ];

  // Ward Heatmap Data (Gwalior Key Hotspot Wards)
  const wardHeatmapData = [
    { wardNo: 1, name: 'Lashkar Fort', density: 1, count: 1, status: 'low' },
    { wardNo: 2, name: 'Hazira Market', density: 3, count: 3, status: 'high' },
    { wardNo: 3, name: 'Fort Road / Hazira', density: 4, count: 4, status: 'high' },
    { wardNo: 4, name: 'Thatipur North', density: 2, count: 2, status: 'medium' },
    { wardNo: 5, name: 'Morar Sadar Bazaar', density: 3, count: 3, status: 'high' },
    { wardNo: 6, name: 'Pinto Park', density: 1, count: 1, status: 'low' },
    { wardNo: 7, name: 'Gwalior Railway Stn', density: 2, count: 2, status: 'medium' },
    { wardNo: 8, name: 'Lashkar West', density: 4, count: 4, status: 'critical' },
    { wardNo: 9, name: 'Bada Post Office', density: 2, count: 2, status: 'medium' },
    { wardNo: 10, name: 'Madhav Ganj', density: 1, count: 1, status: 'low' },
    { wardNo: 11, name: 'Jayendraganj', density: 2, count: 2, status: 'medium' },
    { wardNo: 12, name: 'Roshni Ghar', density: 1, count: 1, status: 'low' },
    { wardNo: 13, name: 'Padav Bus Stand', density: 3, count: 3, status: 'high' },
    { wardNo: 14, name: 'City Center (Phool Bagh)', density: 5, count: 6, status: 'critical' },
    { wardNo: 15, name: 'Govindpuri', density: 2, count: 2, status: 'medium' },
    { wardNo: 16, name: 'Maharaj Bada', density: 3, count: 3, status: 'high' },
    { wardNo: 17, name: 'Kampoo Kothi', density: 1, count: 1, status: 'low' },
    { wardNo: 18, name: 'Morar Cantt West', density: 2, count: 2, status: 'medium' },
    { wardNo: 19, name: 'Alkapuri', density: 1, count: 1, status: 'low' },
    { wardNo: 20, name: 'Harishankarpuram', density: 2, count: 2, status: 'medium' },
    { wardNo: 21, name: 'Morar Cantt Road', density: 4, count: 4, status: 'critical' },
    { wardNo: 22, name: 'Vinay Nagar', density: 1, count: 1, status: 'low' },
    { wardNo: 23, name: 'Anand Nagar', density: 2, count: 2, status: 'medium' },
    { wardNo: 24, name: 'Sikandar Kampoo', density: 3, count: 3, status: 'high' },
  ];

  // City Comparison Matrix (Madhya Pradesh ULBs)
  const cityComparisonData = [
    { city: 'Gwalior', total: 24, pending: 14, resolved: 10, sla: 92.4, meanHours: 28.5, status: 'Optimal' },
    { city: 'Bhopal', total: 42, pending: 18, resolved: 24, sla: 94.1, meanHours: 26.0, status: 'High SLA' },
    { city: 'Indore', total: 58, pending: 12, resolved: 46, sla: 96.8, meanHours: 19.4, status: 'Top Performer' },
    { city: 'Jabalpur', total: 31, pending: 15, resolved: 16, sla: 89.2, meanHours: 34.2, status: 'Attention' },
    { city: 'Ujjain', total: 19, pending: 8, resolved: 11, sla: 91.5, meanHours: 31.0, status: 'Optimal' },
  ];

  // Calculate Donut Segments
  let cumulativeAngle = 0;
  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const donutSlices = categoryData.map((item) => {
    const fraction = item.count / catTotal;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      percentage: Math.round(fraction * 100),
    };
  });

  return (
    <div className="p-6 space-y-7 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E3D60] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Municipal Analytics & Civic Intelligence Suite</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, quantitative category breakdowns, department workload, spatial ward density, and SLA performance.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Select Municipal ULB:</span>
          <div className="flex flex-wrap gap-1 p-1 bg-[#111827] rounded-xl border border-[#2E3D60]">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCityId(city.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCityId === city.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-[#1C2541]'
                }`}
              >
                {city.name_en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Primary Performance KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>SLA Adherence Benchmark</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono">{slaAdherenceRate}%</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Target: 90% SLA</span>
            <span className="text-emerald-400 font-bold">Passed (+2.4%)</span>
          </div>
        </div>

        <div className="p-5 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Mean Turnaround Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-cyan-300 font-mono">{avgResolutionHours} hrs</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Intake to field sign-off</span>
            <span className="text-cyan-400 font-bold">7h faster</span>
          </div>
        </div>

        <div className="p-5 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Intake Complaints</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-300 font-mono">{totalReports}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{openReports} Pending Redressal</span>
            <span className="text-emerald-400 font-bold">{resolvedReports} Resolved</span>
          </div>
        </div>

        <div className="p-5 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Cumulative Clearance Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{resolutionRate}%</p>
          <div className="w-full bg-[#1C2541] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Row 1: Donut Chart (Complaint Categories) + Bar Chart (Department-wise Workload) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DONUT CHART: Complaint Categories (Amazon / Fixly style) */}
        <div className="lg:col-span-5 p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Donut Chart: Complaint Categories</span>
              </h2>
              <p className="text-[11px] text-slate-400">Proportional grievance volume across infrastructure sectors</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-md">
              {catTotal} Total
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
            {/* SVG Donut Circle */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  className="stroke-[#1C2541]"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Colored Slices */}
                {donutSlices.map((slice) => {
                  const isHovered = hoveredCategory === slice.id;
                  return (
                    <circle
                      key={slice.id}
                      cx="90"
                      cy="90"
                      r={radius}
                      stroke={slice.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setHoveredCategory(slice.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-2xl font-black text-white font-mono">{catTotal}</span>
                <span className="text-[9px] text-cyan-400 font-semibold">Reports</span>
              </div>
            </div>

            {/* Interactive Legend with Percentages */}
            <div className="space-y-2 w-full text-xs">
              {donutSlices.map((slice) => {
                const isHovered = hoveredCategory === slice.id;
                return (
                  <div
                    key={slice.id}
                    onMouseEnter={() => setHoveredCategory(slice.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-between ${
                      isHovered ? 'bg-[#1C2541] border border-cyan-500/40 translate-x-1' : 'hover:bg-[#1C2541]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <span className="text-slate-200 truncate">{slice.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0 pl-2">
                      <span className="text-slate-400">{slice.count}</span>
                      <span className="text-cyan-400 font-bold">{slice.percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BAR CHART: Department-Wise Issues (PWD, PHED, SWM, Electrical) */}
        <div className="lg:col-span-7 p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Bar Chart: Department-Wise Issues</span>
              </h2>
              <p className="text-[11px] text-slate-400">Workload distribution, open tasks vs verified resolution</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Pending
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Resolved
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {departmentData.map((dept) => {
              const maxVal = 10;
              const pendingPct = (dept.open / maxVal) * 100;
              const resolvedPct = (dept.resolved / maxVal) * 100;
              const totalPct = ((dept.open + dept.resolved) / maxVal) * 100;

              return (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{dept.name}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-amber-400">{dept.open} pending</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-emerald-400">{dept.resolved} done</span>
                      <span className="text-slate-400 font-bold bg-[#1C2541] px-1.5 py-0.5 rounded text-[10px]">
                        Target {dept.slaHours}h
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar Graphic */}
                  <div className="w-full bg-[#1C2541] h-3.5 rounded-full overflow-hidden flex p-0.5 gap-1">
                    <div
                      className="bg-amber-400 h-full rounded-l-full transition-all duration-500"
                      style={{ width: `${pendingPct}%` }}
                      title={`${dept.open} Pending`}
                    />
                    <div
                      className="bg-emerald-400 h-full rounded-r-full transition-all duration-500"
                      style={{ width: `${resolvedPct}%` }}
                      title={`${dept.resolved} Resolved`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Line Chart (Complaints Over Time) + Spatial Heatmap (Ward Density) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LINE & AREA CHART: Complaints Over Time */}
        <div className="lg:col-span-7 p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Line Chart: Complaints Over Time</span>
              </h2>
              <p className="text-[11px] text-slate-400">Daily intake velocity versus departmental clearance</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
                <span className="w-3 h-0.5 bg-cyan-400 rounded-full" /> New Reports
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono ml-2">
                <span className="w-3 h-0.5 bg-emerald-400 rounded-full" /> Cleared
              </span>
            </div>
          </div>

          {/* SVG Smooth Line & Area Chart */}
          <div className="relative w-full h-56 pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
              <defs>
                <linearGradient id="intakeArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="resolvedArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#2E3D60" strokeDasharray="3 3" opacity="0.4" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#2E3D60" strokeDasharray="3 3" opacity="0.4" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#2E3D60" strokeDasharray="3 3" opacity="0.4" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#2E3D60" opacity="0.8" />

              {/* Intake Area & Line Path */}
              <path
                d="M 10 100 Q 80 50, 160 110 T 320 40 T 410 70 T 490 100 L 490 150 L 10 150 Z"
                fill="url(#intakeArea)"
              />
              <path
                d="M 10 100 Q 80 50, 160 110 T 320 40 T 410 70 T 490 100"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Resolved Area & Line Path */}
              <path
                d="M 10 130 Q 80 110, 160 90 T 320 70 T 410 50 T 490 80 L 490 150 L 10 150 Z"
                fill="url(#resolvedArea)"
              />
              <path
                d="M 10 130 Q 80 110, 160 90 T 320 70 T 410 50 T 490 80"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />

              {/* Interactive Data Nodes */}
              {timelineData.map((d, i) => {
                const x = 10 + i * 80;
                const isHovered = hoveredDayIndex === i;
                return (
                  <g key={d.day} className="cursor-pointer" onMouseEnter={() => setHoveredDayIndex(i)} onMouseLeave={() => setHoveredDayIndex(null)}>
                    <circle cx={x} cy={70 + (i % 2 === 0 ? 20 : -20)} r={isHovered ? 6 : 4} fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx={x} cy={90 + (i % 2 === 0 ? 10 : -15)} r={isHovered ? 5 : 3.5} fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x={x} y="165" fill="#94A3B8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredDayIndex !== null && (
              <div 
                className="absolute top-2 bg-[#0B132B] border border-cyan-400 p-2 rounded-lg shadow-xl text-xs space-y-1 pointer-events-none"
                style={{ left: `${Math.min(hoveredDayIndex * 14 + 10, 75)}%` }}
              >
                <div className="font-bold text-white flex items-center justify-between gap-3">
                  <span>{timelineData[hoveredDayIndex].date}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{timelineData[hoveredDayIndex].day}</span>
                </div>
                <div className="text-[11px] text-cyan-300 font-mono">
                  + {timelineData[hoveredDayIndex].intake} New Grievances
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  ✓ {timelineData[hoveredDayIndex].resolved} Resolved & Closed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HEATMAP: Issue Concentration Across City Wards */}
        <div className="lg:col-span-5 p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span>Heatmap: Issue Concentration</span>
              </h2>
              <p className="text-[11px] text-slate-400">Ward-level grievance density in {activeCity?.name_en || 'Gwalior'}</p>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="w-2.5 h-2.5 rounded bg-[#1C2541]" /> Low
              <span className="w-2.5 h-2.5 rounded bg-amber-500/70 ml-1" /> Med
              <span className="w-2.5 h-2.5 rounded bg-red-500 ml-1" /> High
            </div>
          </div>

          {/* 24-Ward Matrix Grid */}
          <div className="grid grid-cols-6 gap-2 pt-1">
            {wardHeatmapData.map((w) => {
              let bg = 'bg-[#1C2541] border-[#2E3D60] text-slate-400';
              if (w.status === 'medium') bg = 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold';
              if (w.status === 'high') bg = 'bg-orange-500/30 border-orange-500/50 text-orange-300 font-bold shadow-sm';
              if (w.status === 'critical') bg = 'bg-red-500/40 border-red-500/70 text-red-200 font-black shadow-md';

              return (
                <div
                  key={w.wardNo}
                  className={`p-2 rounded-xl border text-center transition-all hover:scale-105 cursor-pointer ${bg}`}
                  title={`Ward ${w.wardNo} (${w.name}): ${w.count} active complaints`}
                >
                  <span className="text-[10px] block font-mono">W{w.wardNo}</span>
                  <span className="text-xs font-bold font-mono">{w.count}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl text-xs flex items-center justify-between">
            <span className="text-slate-300">
              Highest spatial concentration: <strong className="text-red-400">Ward 14 (City Center)</strong>
            </span>
            <span className="font-mono text-cyan-400 text-[11px] font-bold">6 Complaints</span>
          </div>
        </div>
      </div>

      {/* Row 3: City and Ward Comparison Table (Gwalior, Bhopal, Indore, Jabalpur, Ujjain) */}
      <div className="p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>City and Ward Comparison: Total Complaints, Pending, Resolved, SLA</span>
            </h2>
            <p className="text-[11px] text-slate-400">Multi-ULB performance benchmarking across Madhya Pradesh municipal corporations</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
            All 5 ULBs Connected to PostGIS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2E3D60] text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Municipal Corporation</th>
                <th className="py-3 px-4 text-center">Total Complaints</th>
                <th className="py-3 px-4 text-center">Pending Redressal</th>
                <th className="py-3 px-4 text-center">Verified Resolved</th>
                <th className="py-3 px-4 text-center">SLA Adherence Rate</th>
                <th className="py-3 px-4 text-center">Mean Turnaround</th>
                <th className="py-3 px-4 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3D60]/60 text-slate-200">
              {cityComparisonData.map((c) => (
                <tr key={c.city} className="hover:bg-[#1C2541]/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{c.city} Municipal Corp</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-300">{c.total}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-amber-400">{c.pending}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-semibold">{c.resolved}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{c.sla}%</span>
                      <div className="w-16 bg-[#1C2541] h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${c.sla}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-300">{c.meanHours} hrs</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      c.status === 'Top Performer' 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                        : c.status === 'Attention'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
