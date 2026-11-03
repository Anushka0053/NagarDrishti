import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Filter, 
  Sparkles, 
  Volume2, 
  ThumbsUp, 
  Search,
  Building,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  ExternalLink,
  Layers
} from 'lucide-react';
import { feedbackApi, CitizenReportStatusUpdateData } from '../api/feedback';
import { aiApi } from '../api/ai';
import { useCities } from '../api/hooks';
import { CitizenReport } from '../types';

export const ReportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: cities = [] } = useCities();

  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<CitizenReport | null>(null);
  const [statusUpdateModalReport, setStatusUpdateModalReport] = useState<CitizenReport | null>(null);
  const [newStatus, setNewStatus] = useState<string>('in_progress');
  const [officerName, setOfficerName] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [playingReportId, setPlayingReportId] = useState<string | null>(null);

  // Set default city to Gwalior on load
  useEffect(() => {
    if (cities.length > 0 && !selectedCityId) {
      const gwalior = cities.find((c) => c.slug === 'gwalior') || cities[0];
      setSelectedCityId(gwalior.id);
    }
  }, [cities, selectedCityId]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await feedbackApi.getPublicReports({
        city_id: selectedCityId || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        limit: 100,
      });
      setReports(data || []);
    } catch (err) {
      console.warn('Failed to fetch reports', err);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedCityId, selectedCategory, selectedStatus]);

  // Text to speech playback using Sarvam TTS API
  const handleListenReport = async (report: CitizenReport) => {
    if (playingReportId === report.id) {
      setPlayingReportId(null);
      return;
    }

    setPlayingReportId(report.id);
    const textToSpeak = `${report.title || report.category}. ${report.description}`;

    try {
      const ttsRes = await aiApi.textToSpeech(
        textToSpeak,
        report.input_language === 'hi' ? 'hi-IN' : 'en-IN'
      );

      if (ttsRes.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${ttsRes.audio_base64}`);
        audio.play();
        audio.onended = () => setPlayingReportId(null);
        return;
      }
    } catch (e) {
      console.warn('Sarvam TTS API offline, falling back to browser synthesis');
    }

    // Web Speech API fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = report.input_language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.onend = () => setPlayingReportId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingReportId(null);
    }
  };

  const handleCorroborate = async (reportId: string) => {
    try {
      const res = await feedbackApi.corroborateReport(reportId, 'confirm_issue');
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, corroboration_count: res.corroboration_count } : r
        )
      );
    } catch (err) {
      console.warn('Corroboration failed', err);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateModalReport) return;

    setIsUpdatingStatus(true);
    try {
      const payload: CitizenReportStatusUpdateData = {
        status: newStatus,
        assigned_officer_name: officerName || undefined,
        resolution_summary: resolutionNote || undefined,
        reason: `Status updated via Municipal Dispatch`,
      };
      await feedbackApi.updateReportStatus(statusUpdateModalReport.id, payload);
      setStatusUpdateModalReport(null);
      setOfficerName('');
      setResolutionNote('');
      loadReports();
    } catch (err) {
      console.warn('Status update failed', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.report_number.toLowerCase().includes(q) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  const totalReportsCount = reports.length;
  const openReportsCount = reports.filter((r) => r.status !== 'resolved' && r.status !== 'rejected_spam').length;
  const resolvedReportsCount = reports.filter((r) => r.status === 'resolved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return { label: 'Submitted', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'triaged':
        return { label: 'AI Triaged', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'assigned':
        return { label: 'Assigned', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'in_progress':
        return { label: 'In Progress', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'resolved':
        return { label: 'Resolved', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'rejected_spam':
        return { label: 'Rejected', bg: 'bg-slate-700 text-slate-400 border-slate-600' };
      default:
        return { label: status, bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'critical':
        return { label: 'Critical Urgency', color: 'text-rose-400 bg-rose-950/50 border-rose-500/40' };
      case 'high':
        return { label: 'High Priority', color: 'text-amber-400 bg-amber-950/50 border-amber-500/40' };
      case 'low':
        return { label: 'Low Urgency', color: 'text-slate-400 bg-slate-900 border-slate-700' };
      default:
        return { label: 'Medium Priority', color: 'text-cyan-400 bg-cyan-950/50 border-cyan-500/40' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <header className="h-14 bg-[#1C2541] border-b border-[#2E3D60] px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="p-2 bg-[#0B132B] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-cyan-400 flex items-center gap-1.5 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>GIS Map Canvas</span>
          </a>
          <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Civic Intelligence & Citizen Feedback Stream</span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
              AI-Grounded Stream
            </span>
          </h1>
        </div>

        {/* City Scope Selector */}
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="bg-[#0B132B] border border-[#2E3D60] focus:border-cyan-400 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none font-semibold"
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name_en} ({city.name_hi})
              </option>
            ))}
          </select>

          <a
            href="/admin"
            className="px-2.5 py-1.5 bg-[#0B132B] hover:bg-[#253258] border border-cyan-500/40 rounded text-xs text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </a>

          <button
            onClick={loadReports}
            title="Refresh stream"
            className="p-1.5 bg-[#0B132B] hover:bg-[#253258] border border-[#2E3D60] rounded text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1C2541]/90 border border-[#2E3D60] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Submissions</p>
              <p className="text-2xl font-extrabold font-mono text-slate-100 mt-1">{totalReportsCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-[#1C2541]/90 border border-[#2E3D60] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open / In Triage</p>
              <p className="text-2xl font-extrabold font-mono text-amber-400 mt-1">{openReportsCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-[#1C2541]/90 border border-[#2E3D60] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Resolved</p>
              <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{resolvedReportsCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, keyword, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0B132B] border border-[#2E3D60] focus:border-cyan-400 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-64"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#0B132B] border border-[#2E3D60] focus:border-cyan-400 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">All Issue Categories</option>
              <option value="road_pothole">Road Pothole & Distress</option>
              <option value="water_leakage">Water Supply Leakage</option>
              <option value="garbage_dump">Solid Waste / Garbage Dump</option>
              <option value="street_light">Street Light Failure</option>
              <option value="sewerage_overflow">Drainage & Sewerage Overflow</option>
              <option value="encroachment">Public Land Encroachment</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B132B] border border-[#2E3D60] focus:border-cyan-400 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">All Operational Statuses</option>
              <option value="submitted">Submitted (Pending Triage)</option>
              <option value="triaged">AI Triaged</option>
              <option value="assigned">Department Assigned</option>
              <option value="in_progress">Work In Progress</option>
              <option value="resolved">Verified Resolved</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Showing <span className="text-cyan-400 font-bold">{filteredReports.length}</span> reports
          </div>
        </div>

        {/* Reports Stream List */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Querying live PostGIS citizen reports stream...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 bg-[#1C2541]/40 border border-[#2E3D60] rounded-xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
            <p className="font-semibold text-slate-300">No Citizen Reports Found</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are no reports matching the active filters for this city. Use the "Report Issue" button on the GIS map to file a new grievance.
            </p>
            <a
              href="/"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
            >
              Open Map & Report Issue
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => {
              const statusCfg = getStatusBadge(report.status);
              const urgencyCfg = getUrgencyBadge(report.ai_metadata?.urgency);
              const isPlaying = playingReportId === report.id;

              return (
                <div
                  key={report.id}
                  className="p-4 bg-[#1C2541]/80 hover:bg-[#1C2541] border border-[#2E3D60] hover:border-cyan-500/40 rounded-xl space-y-3 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold text-xs">
                            {report.report_number}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${statusCfg.bg}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-100 text-sm mt-1">
                          {report.title || report.category.replace('_', ' ').toUpperCase()}
                        </h3>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${urgencyCfg.color}`}>
                        {urgencyCfg.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {report.description}
                    </p>

                    {/* AI Grounded Triage Pill */}
                    {report.ai_metadata?.assigned_department && (
                      <div className="p-2 bg-[#131B33] border border-[#2E3D60]/70 rounded-lg flex items-center justify-between text-[10px] text-slate-300">
                        <span className="flex items-center gap-1 font-semibold text-cyan-400">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Dept: {report.ai_metadata.assigned_department}</span>
                        </span>
                        {report.ai_metadata.nearby_duplicate_count > 0 && (
                          <span className="text-amber-400 font-mono">
                            {report.ai_metadata.nearby_duplicate_count} nearby reports
                          </span>
                        )}
                      </div>
                    )}

                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{report.location_address || `GPS: ${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-[#2E3D60]/50 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleListenReport(report)}
                        className={`px-2.5 py-1 rounded border flex items-center gap-1 text-[11px] transition-colors ${
                          isPlaying
                            ? 'bg-rose-950 border-rose-400 text-rose-300 animate-pulse'
                            : 'bg-[#131B33] border-[#2E3D60] text-slate-300 hover:text-cyan-300'
                        }`}
                        title="Listen Aloud (Sarvam AI Speech)"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={() => handleCorroborate(report.id)}
                        className="px-2.5 py-1 bg-[#131B33] hover:bg-[#253258] border border-[#2E3D60] rounded flex items-center gap-1 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors"
                        title="I also see this civic issue"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{report.corroboration_count} Upvotes</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setStatusUpdateModalReport(report)}
                        className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-[11px] font-semibold transition-colors"
                      >
                        Update Status
                      </button>

                      <button
                        onClick={() => setSelectedReportForDetails(report)}
                        className="p-1 hover:text-cyan-400 text-slate-400"
                        title="View Full History Timeline"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Update Status Dispatch Modal */}
      {statusUpdateModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1C2541] border border-[#2E3D60] rounded-xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#2E3D60] pb-2">
              <h3 className="font-bold text-sm text-slate-100">
                Update Report Operational Lifecycle
              </h3>
              <button
                onClick={() => setStatusUpdateModalReport(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400">Report Reference</span>
                <p className="font-mono text-cyan-400 font-bold">{statusUpdateModalReport.report_number}</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Operational Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#131B33] border border-[#2E3D60] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="submitted">Submitted (Pending Triage)</option>
                  <option value="triaged">AI Triaged</option>
                  <option value="assigned">Department Assigned</option>
                  <option value="in_progress">Work In Progress</option>
                  <option value="resolved">Verified Resolved</option>
                  <option value="rejected_spam">Rejected / Spam</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Officer / Contractor</label>
                <input
                  type="text"
                  placeholder="e.g., Assistant Engineer Sharma (Zone 4)"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-[#131B33] border border-[#2E3D60] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resolution Summary / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Explain repair action, material used or reason for update..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-[#131B33] border border-[#2E3D60] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2E3D60]">
                <button
                  type="button"
                  onClick={() => setStatusUpdateModalReport(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded flex items-center gap-1.5"
                >
                  {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Report History & Details Modal */}
      {selectedReportForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#1C2541] border border-[#2E3D60] rounded-xl shadow-2xl p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2E3D60] pb-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {selectedReportForDetails.report_number}
                </span>
                <h3 className="font-bold text-sm text-slate-100">
                  {selectedReportForDetails.title || selectedReportForDetails.category}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#131B33] rounded-lg border border-[#2E3D60] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Citizen Description</span>
                <p className="text-slate-200 leading-relaxed">{selectedReportForDetails.description}</p>
              </div>

              {/* Status History Timeline */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Lifecycle Audit History</span>
                <div className="border border-[#2E3D60] rounded-lg p-3 bg-[#131B33] space-y-3">
                  {selectedReportForDetails.status_history && selectedReportForDetails.status_history.length > 0 ? (
                    selectedReportForDetails.status_history.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] border-b border-[#2E3D60]/40 last:border-0 pb-2 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-200">
                            Transitioned to <span className="text-cyan-300 uppercase">{h.new_status}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">{h.reason || 'Status transition logged'}</p>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(h.created_at).toLocaleString()} • Actor: {h.actor_role || 'System'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2 text-[11px]">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-200">
                          Initial submission: <span className="text-cyan-300 uppercase">{selectedReportForDetails.status}</span>
                        </p>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(selectedReportForDetails.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#2E3D60]">
                <a
                  href={`/?lat=${selectedReportForDetails.latitude}&lng=${selectedReportForDetails.longitude}`}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded flex items-center gap-1.5 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect on GIS Map</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
