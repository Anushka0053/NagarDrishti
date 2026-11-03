import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  X, 
  Loader2, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  ThumbsUp, 
  RefreshCw, 
  Calendar,
  Volume2,
  ExternalLink
} from 'lucide-react';
import { feedbackApi, FeedbackFilterParams, CitizenReportStatusUpdateData } from '../api/feedback';
import { useCities, useDepartments } from '../api/hooks';
import { CitizenReport, IndividualReportAIAnalysis } from '../types';

export const GovReportsCenterPage: React.FC = () => {
  const { data: cities = [] } = useCities();
  const { data: departments = [] } = useDepartments();

  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  // Status update form states
  const [newStatus, setNewStatus] = useState<string>('in_progress');
  const [assignDeptId, setAssignDeptId] = useState<string>('');
  const [assignOfficer, setAssignOfficer] = useState<string>('');
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Individual AI analysis states
  const [aiAnalysis, setAiAnalysis] = useState<IndividualReportAIAnalysis | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Default to Gwalior on load
  useEffect(() => {
    if (cities.length > 0 && !selectedCityId) {
      const gwalior = cities.find((c) => c.slug === 'gwalior') || cities[0];
      setSelectedCityId(gwalior.id);
    }
  }, [cities, selectedCityId]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const params: FeedbackFilterParams = {
        city_id: selectedCityId || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        department_id: selectedDeptId !== 'all' ? selectedDeptId : undefined,
        search: searchQuery.trim() || undefined,
        limit: 100,
      };
      const data = await feedbackApi.getPublicReports(params);
      setReports(data || []);
      if (selectedReport) {
        const refreshed = data.find((r) => r.id === selectedReport.id);
        if (refreshed) setSelectedReport(refreshed);
      }
    } catch (err) {
      console.warn('Failed to load reports', err);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedCityId, selectedCategory, selectedStatus, selectedDeptId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  const openReportDetail = (report: CitizenReport) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAssignDeptId(report.department_id || '');
    setAssignOfficer(report.assigned_officer_name || '');
    setResolutionSummary(report.resolution_summary || '');
    setStatusReason('');
    setAiAnalysis(null);
    setAiError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setIsUpdatingStatus(true);
    try {
      const updatePayload: CitizenReportStatusUpdateData = {
        status: newStatus,
        department_id: assignDeptId || undefined,
        assigned_officer_name: assignOfficer || undefined,
        resolution_summary: resolutionSummary || undefined,
        reason: statusReason || `Status updated via Municipal Reports Center`,
      };

      await feedbackApi.updateReportStatus(selectedReport.id, updatePayload);
      await loadReports();
    } catch (err) {
      console.warn('Status update failed', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTriggerAIAnalysis = async () => {
    if (!selectedReport) return;
    setIsAnalyzingAI(true);
    setAiError(null);
    try {
      const analysis = await feedbackApi.analyzeReportAI(selectedReport.id);
      setAiAnalysis(analysis);
    } catch (err: any) {
      setAiError(err.message || 'AI analysis unavailable');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'triaged':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'assigned':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Government Reports Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, assign, inspect, and update authenticated citizen grievances across Madhya Pradesh.
          </p>
        </div>

        <button
          onClick={loadReports}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Report ID (ND-MP-2026-XXXX), locality, keyword or description..."
              className="w-full pl-10 pr-4 py-2 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
          >
            Search
          </button>
        </form>

        {/* Multi-Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">City</label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 font-semibold focus:outline-none focus:border-cyan-400"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en} ({c.name_hi})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Categories</option>
              <option value="road_pothole">Road Pothole</option>
              <option value="water_leakage">Water Leakage</option>
              <option value="garbage_dump">Solid Waste</option>
              <option value="street_light">Street Light</option>
              <option value="sewerage_overflow">Drainage</option>
              <option value="encroachment">Encroachment</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_en} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table / Card View */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-semibold">Querying citizen complaints from PostGIS...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 bg-[#111827] border border-[#2E3D60] rounded-2xl text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Citizen Reports Match Filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, city, or status filter. All seeded and live citizen reports appear here.
          </p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#2E3D60] flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Displaying {reports.length} Reports</span>
            <span className="font-mono text-cyan-400">PostGIS Authenticated Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-[#162038] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-[#2E3D60]">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Title / Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Department / Officer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E3D60]/50">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => openReportDetail(report)}
                    className="hover:bg-[#1C2541] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {report.report_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-100 truncate">{report.title}</p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {report.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{report.location_address || 'Municipal Area'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getStatusBadge(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {report.assigned_officer_name ? (
                        <span className="text-slate-200 font-semibold">{report.assigned_officer_name}</span>
                      ) : (
                        <span className="text-amber-400/80 font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openReportDetail(report);
                        }}
                        className="px-2.5 py-1 bg-[#1C2541] hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 rounded-lg text-xs font-semibold text-cyan-300 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Report Drawer / Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#111827] border-l border-[#2E3D60] h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#2E3D60] flex items-center justify-between bg-[#162038]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-base font-bold text-cyan-400">
                    {selectedReport.report_number}
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getStatusBadge(selectedReport.status)}`}>
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white">{selectedReport.title}</h2>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1C2541]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-200">
              {/* Grievance Description & Evidence */}
              <div className="p-4 bg-[#1C2541] rounded-xl border border-[#2E3D60] space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Citizen Submission Details
                </span>
                <p className="text-xs leading-relaxed text-slate-100">{selectedReport.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-[#2E3D60]/60 font-mono">
                  <span>Category: {selectedReport.category}</span>
                  <span>•</span>
                  <span>Input Language: {selectedReport.input_language?.toUpperCase() || 'EN'}</span>
                  <span>•</span>
                  <span>Corroborations: {selectedReport.corroboration_count}</span>
                </div>
              </div>

              {/* Spatial Coordinates & Locality */}
              <div className="p-4 bg-[#1C2541] rounded-xl border border-[#2E3D60] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Geographic Provenance</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">PostGIS ST_Point</span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">{selectedReport.location_address}</p>
                <p className="text-[11px] text-cyan-300 font-mono">
                  Coordinates: {selectedReport.latitude.toFixed(5)}° N, {selectedReport.longitude.toFixed(5)}° E
                </p>
              </div>

              {/* Sarvam AI Grounded Individual Triage Card */}
              <div className="p-4 bg-gradient-to-br from-[#1C2541] to-[#131B33] rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Sarvam AI Issue Intelligence</span>
                  </span>
                  <button
                    onClick={handleTriggerAIAnalysis}
                    disabled={isAnalyzingAI}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{aiAnalysis ? 'Re-Analyze AI' : 'Run AI Analysis'}</span>
                  </button>
                </div>

                {aiAnalysis ? (
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">AI Executive Summary</span>
                      <p className="text-slate-200 font-semibold mt-0.5">{aiAnalysis.summary_en}</p>
                      {aiAnalysis.summary_hi && (
                        <p className="text-slate-400 text-[11px] mt-0.5">{aiAnalysis.summary_hi}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#2E3D60]">
                      <div>
                        <span className="text-slate-400">Suggested Dept:</span>
                        <p className="font-bold text-cyan-300">{aiAnalysis.recommended_department || aiAnalysis.suggested_department || 'Municipal Services'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Urgency Assessment:</span>
                        <p className="font-bold text-amber-400 capitalize">{aiAnalysis.sentiment_urgency?.urgency || aiAnalysis.urgency_level || 'Medium'}</p>
                      </div>
                    </div>

                    {aiAnalysis.suggested_actions && aiAnalysis.suggested_actions.length > 0 && (
                      <div className="pt-2 border-t border-[#2E3D60]">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Recommended Actions</span>
                        <ul className="mt-1 space-y-1 list-disc list-inside text-slate-300 text-[11px]">
                          {aiAnalysis.suggested_actions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Click 'Run AI Analysis' to extract bilingual summaries, urgency triage, department recommendations, and duplicate detection from Sarvam AI.
                  </p>
                )}
              </div>

              {/* Status Update & Officer Assignment Form */}
              <form onSubmit={handleUpdateStatus} className="p-4 bg-[#162038] rounded-xl border border-[#2E3D60] space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Update Resolution Status & Assignment</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 font-semibold focus:outline-none focus:border-cyan-400"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Assign Department</label>
                    <select
                      value={assignDeptId}
                      onChange={(e) => setAssignDeptId(e.target.value)}
                      className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 font-semibold focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Inspecting Officer Name</label>
                  <input
                    type="text"
                    value={assignOfficer}
                    onChange={(e) => setAssignOfficer(e.target.value)}
                    placeholder="e.g. Er. Vikram Singh (Ward 14 Inspector)"
                    className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Official Resolution Summary / Note</label>
                  <textarea
                    rows={2}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Document field repair details or closure rationale..."
                    className="w-full p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
                >
                  {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Status Update & Write Audit Record</span>
                </button>
              </form>

              {/* Status History Audit Trail */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Immutable Status History Audit Trail
                </span>
                {selectedReport.status_history && selectedReport.status_history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedReport.status_history.map((h) => (
                      <div key={h.id} className="p-3 bg-[#1C2541] rounded-xl border border-[#2E3D60] text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300 capitalize">{h.new_status.replace('_', ' ')}</span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(h.created_at).toLocaleString()}
                          </span>
                        </div>
                        {h.notes && <p className="text-slate-300">{h.notes}</p>}
                        {h.reason && <p className="text-slate-400 italic text-[10px]">{h.reason}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] italic">Initial submission record in PostgreSQL.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

