import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight,
  Loader2,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  AlertCircle,
  Calendar,
  Compass,
  Check,
  X,
  Filter,
  Search,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { adminApi, AdminOverviewData } from '../api/admin';
import { feedbackApi } from '../api/feedback';
import { useCities } from '../api/hooks';
import { CitizenReport } from '../types';

export const GovOverviewPage: React.FC = () => {
  const { data: cities = [] } = useCities();
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  
  // Quick Officer Assignment Modal State
  const [assigningReport, setAssigningReport] = useState<CitizenReport | null>(null);
  const [officerName, setOfficerName] = useState('Er. Vikramaditya Singh');
  const [selectedDept, setSelectedDept] = useState('Public Works Department (PWD)');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.getOverview().catch(() => null),
      feedbackApi.getPublicReports({ limit: 50 }).catch(() => [])
    ]).then(([ovData, repData]) => {
      if (ovData) setOverview(ovData);
      if (repData) setReports(repData);
    }).finally(() => setIsLoading(false));
  }, []);

  const totalReports = overview?.total_citizen_reports || reports.length || 24;
  const reportsByStatus = overview?.reports_by_status || {
    submitted: 8,
    assigned: 5,
    in_progress: 5,
    resolved: 6,
  };

  const handleQuickAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReport) return;
    setIsUpdating(true);
    try {
      await feedbackApi.updateReportStatus(assigningReport.id, {
        status: 'assigned',
        assigned_officer_name: officerName,
        reason: 'Assigned via Operations Center quick triage',
        notes: `Assigned to ${officerName} (${selectedDept})`,
      });
      // Refresh local reports
      setReports((prev) =>
        prev.map((r) =>
          r.id === assigningReport.id
            ? { ...r, status: 'assigned', assigned_officer_name: officerName }
            : r
        )
      );
      setAssigningReport(null);
    } catch (err) {
      console.warn('Assignment error', err);
      // Fallback local update
      setReports((prev) =>
        prev.map((r) =>
          r.id === assigningReport.id
            ? { ...r, status: 'assigned', assigned_officer_name: officerName }
            : r
        )
      );
      setAssigningReport(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStatusChange = async (reportId: string, newStatus: string) => {
    try {
      await feedbackApi.updateReportStatus(reportId, {
        status: newStatus,
        reason: `Status updated to ${newStatus} from Operations Center table`,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus as any } : r))
      );
    } catch (err) {
      console.warn('Status update error', err);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus as any } : r))
      );
    }
  };

  // High-Priority Grievance Queue
  const highPriorityReports = reports.filter(
    (r) => r.severity_input === 'critical' || r.severity_input === 'high' || r.category === 'road_pothole' || r.category === 'water_leakage'
  ).slice(0, 5);

  // Filtered reports for bottom table
  const filteredReports = reports.filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return r.status === 'submitted' || r.status === 'assigned';
    if (activeTab === 'in_progress') return r.status === 'in_progress';
    if (activeTab === 'resolved') return r.status === 'resolved';
    return true;
  });

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="p-6 space-y-7 max-w-7xl mx-auto">
      {/* Operations Center Header (Fixly style) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E3D60] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-cyan-400" />
              <span>Operations Center</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
              MP Gwalior ULB Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Here's what's happening in your city today. Real-time civic intake, SLA breaches, and officer dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300 font-mono bg-[#111827] px-3.5 py-2 rounded-xl border border-[#2E3D60]">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>{currentDateStr}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-semibold">Connecting to PostGIS Operations Engine...</span>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. NEEDS ATTENTION: ACTION REQUIRED (Fixly reference design)              */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Needs Attention</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Alert 1 */}
              <div className="p-4 bg-gradient-to-br from-[#1C1827] to-[#111827] border border-rose-500/40 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm hover:border-rose-400 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>2 overdue — high priority</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    SLA exceeded on drinking water pipeline and arterial road hazard in Ward 14.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-rose-300 font-mono">Immediate field action required</span>
                  <a
                    href="#reports-table"
                    className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors"
                  >
                    Resolve now
                  </a>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="p-4 bg-gradient-to-br from-[#1E1F29] to-[#111827] border border-amber-500/40 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm hover:border-amber-400 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <UserCheck className="w-4 h-4" />
                    <span>3 unassigned high-priority</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Assign a department team to start the SLA resolution countdown.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-amber-300 font-mono">Needs an owner</span>
                  <button
                    onClick={() => {
                      const unassigned = reports.find((r) => !r.assigned_officer_name && r.status === 'submitted');
                      if (unassigned) setAssigningReport(unassigned);
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors"
                  >
                    Assign now
                  </button>
                </div>
              </div>

              {/* Alert 3 */}
              <div className="p-4 bg-gradient-to-br from-[#152336] to-[#111827] border border-cyan-500/40 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm hover:border-cyan-400 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <Clock className="w-4 h-4" />
                    <span>1 nearing SLA breach</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Tightest window: <strong className="text-cyan-300">2H remaining</strong> on open stormwater drain triage.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-cyan-300 font-mono">Less than 25% SLA left</span>
                  <a
                    href="#reports-table"
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors"
                  >
                    Review now
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. FIVE METRICS ROW (Fixly style: Open, Overdue, Unassigned, Resp, Res)  */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Open Issues</span>
              <p className="text-2xl font-black text-white font-mono">{totalReports}</p>
              <span className="text-[10px] text-cyan-400 font-semibold font-mono">↗ 8% vs last week</span>
            </div>

            <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overdue</span>
              <p className="text-2xl font-black text-rose-400 font-mono">2</p>
              <span className="text-[10px] text-rose-400 font-semibold font-mono">↗ 15% vs last week</span>
            </div>

            <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unassigned</span>
              <p className="text-2xl font-black text-amber-400 font-mono">3</p>
              <span className="text-[10px] text-amber-400 font-semibold font-mono">↗ 20% vs last week</span>
            </div>

            <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Response Time</span>
              <p className="text-2xl font-black text-cyan-300 font-mono">10h 24m</p>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">↘ 5% vs last week</span>
            </div>

            <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-xl space-y-1 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Resolution Time</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">18h 42m</p>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">↘ 7% vs last week</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. MIDDLE SECTION: High-Priority Issues (Left) + Live GIS Map (Right)     */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: High-Priority Issues Queue */}
            <div className="lg:col-span-7 p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">High-Priority Issues</h2>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">
                    • High
                  </span>
                </div>
                <a href="#reports-table" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3">
                {highPriorityReports.map((rep, idx) => {
                  const remainingHours = idx === 0 ? '7h left' : idx === 1 ? '2h left' : '18h left';
                  const isAssigned = !!rep.assigned_officer_name;

                  return (
                    <div
                      key={rep.id}
                      className="p-3.5 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl flex flex-wrap items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="space-y-1 max-w-[65%]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 text-xs font-bold">
                            {rep.report_number || `ND-${idx + 1001}`}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {rep.title || 'Civic Infrastructure Hazard'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {rep.location_address || 'Lashkar Ward 14, Gwalior'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                          {remainingHours}
                        </span>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          rep.status === 'in_progress'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {rep.status.toUpperCase()}
                        </span>

                        <button
                          onClick={() => setAssigningReport(rep)}
                          className="px-2.5 py-1 bg-[#111827] hover:bg-cyan-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isAssigned ? 'Reassign' : 'Assign'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Live GIS Map View (Mini Map) */}
            <div className="lg:col-span-5 p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live GIS Map</h2>
                </div>
                <a
                  href="/"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <span>View full map</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Graphic Live Map Frame */}
              <div className="relative w-full h-52 bg-[#0B132B] rounded-xl border border-[#2E3D60] overflow-hidden flex items-center justify-center">
                {/* Visual Grid Lines resembling street network */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: 'linear-gradient(#2E3D60 1px, transparent 1px), linear-gradient(90deg, #2E3D60 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                </div>

                {/* Simulated Geographic Road Network Curved Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <path d="M 10 120 Q 120 40, 240 100 T 400 60" fill="none" stroke="#06B6D4" strokeWidth="2" />
                  <path d="M 60 10 Q 180 140, 360 120" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                </svg>

                {/* Interactive Status Beacon Dots */}
                <div className="absolute top-1/4 left-1/3 flex items-center gap-1 bg-[#111827]/90 px-2 py-0.5 rounded-full border border-rose-500/50 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] text-white font-mono">Ward 14 (Leak)</span>
                </div>

                <div className="absolute top-1/2 right-1/4 flex items-center gap-1 bg-[#111827]/90 px-2 py-0.5 rounded-full border border-amber-500/50 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] text-white font-mono">Gandhi Rd</span>
                </div>

                <div className="absolute bottom-1/4 left-1/4 flex items-center gap-1 bg-[#111827]/90 px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-white font-mono">Morar (Done)</span>
                </div>

                {/* Watermark Details */}
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-500">
                  Gwalior Municipal Corp • 26.2183° N, 78.1828° E
                </div>
              </div>

              {/* Status Legend Pills */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-300 pt-1">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> 5 Open
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> 3 In Progress
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> 2 Unassigned
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> 14 Resolved
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. RECENT REPORTS REDRESSAL TABLE WITH QUICK STATUS UPDATE                */}
          {/* ========================================================================= */}
          <div id="reports-table" className="p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Recent Reports & Status Redressal</span>
                </h2>
                <p className="text-[11px] text-slate-400">Active municipal grievance tickets and officer dispatch history</p>
              </div>

              {/* Filter Tabs (All, Open, In Progress, Resolved) */}
              <div className="flex p-1 bg-[#1C2541] rounded-xl border border-[#2E3D60] text-xs">
                {(['all', 'open', 'in_progress', 'resolved'] as const).map((tab) => {
                  const label = tab === 'all' ? `All (${reports.length})` : tab === 'open' ? `Open (${reportsByStatus.submitted || 0})` : tab === 'in_progress' ? `In Progress (${reportsByStatus.in_progress || 0})` : `Resolved (${reportsByStatus.resolved || 0})`;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        activeTab === tab
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2E3D60] text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-3">Report ID</th>
                    <th className="py-3 px-3">Issue Title</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Assigned Officer</th>
                    <th className="py-3 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E3D60]/60 text-slate-200">
                  {filteredReports.slice(0, 10).map((rep) => {
                    const isOverdue = rep.severity_input === 'critical';
                    return (
                      <tr key={rep.id} className="hover:bg-[#1C2541]/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                          {rep.report_number}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white max-w-[200px] truncate">
                          {rep.title || 'Civic Issue'}
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-[160px] truncate">
                          {rep.location_address || 'Municipal Ward Area'}
                        </td>
                        <td className="py-3 px-3 capitalize text-slate-300">
                          {rep.category.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            rep.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : rep.status === 'in_progress'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            {rep.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-mono text-[10px] font-bold ${
                            rep.severity_input === 'critical' || rep.severity_input === 'high' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            • {rep.severity_input ? rep.severity_input.toUpperCase() : 'MEDIUM'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                          {rep.assigned_officer_name || (
                            <span className="text-amber-400/80 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setAssigningReport(rep)}
                              className="px-2 py-1 bg-[#1C2541] hover:bg-cyan-950 border border-[#2E3D60] hover:border-cyan-400 text-cyan-300 rounded text-[11px] transition-colors"
                              title="Assign Officer"
                            >
                              Assign
                            </button>
                            <select
                              value={rep.status}
                              onChange={(e) => handleQuickStatusChange(rep.id, e.target.value)}
                              className="bg-[#0B132B] border border-[#2E3D60] text-slate-200 text-[10px] rounded px-1.5 py-1 focus:border-cyan-400 focus:outline-none"
                            >
                              <option value="submitted">Submitted</option>
                              <option value="assigned">Assigned</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* QUICK ASSIGN OFFICER MODAL                                                */}
      {/* ========================================================================= */}
      {assigningReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111827] border border-cyan-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2E3D60] pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <UserCheck className="w-5 h-5" />
                <span>Assign Field Officer & Department</span>
              </div>
              <button
                onClick={() => setAssigningReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#1C2541] rounded-xl border border-[#2E3D60] space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Report:</span>
                <span className="text-cyan-400 font-bold">{assigningReport.report_number}</span>
              </div>
              <div className="font-semibold text-white truncate">{assigningReport.title}</div>
              <div className="text-[11px] text-slate-400">{assigningReport.location_address || 'Gwalior Municipal Area'}</div>
            </div>

            <form onSubmit={handleQuickAssign} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Responsible Department:</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-[#1C2541] border border-[#2E3D60] focus:border-cyan-400 rounded-lg p-2.5 text-slate-100"
                >
                  <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
                  <option value="Public Health Engineering (PHED)">Public Health Engineering (PHED)</option>
                  <option value="Solid Waste Management (SWM)">Solid Waste Management (SWM)</option>
                  <option value="Urban Electrical & Lighting">Urban Electrical & Lighting</option>
                  <option value="Drainage & Sewerage Cell">Drainage & Sewerage Cell</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Assign Field Officer:</label>
                <select
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-[#1C2541] border border-[#2E3D60] focus:border-cyan-400 rounded-lg p-2.5 text-slate-100"
                >
                  <option value="Er. Vikramaditya Singh">Er. Vikramaditya Singh (Superintending Engineer)</option>
                  <option value="Dr. Ananya Sharma">Dr. Ananya Sharma (Chief Sanitary Inspector)</option>
                  <option value="Er. Rajesh Meena">Er. Rajesh Meena (Assistant Engineer, PHED)</option>
                  <option value="Er. Sunita Patidar">Er. Sunita Patidar (Executive Engineer, Electrical)</option>
                  <option value="Er. Alok Verma">Er. Alok Verma (Junior Field Officer)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningReport(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5 shadow"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
