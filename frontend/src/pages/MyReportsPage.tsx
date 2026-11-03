import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ThumbsUp, 
  ChevronRight, 
  Loader2, 
  Calendar,
  Building,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { useCities } from '../api/hooks';
import { feedbackApi } from '../api/feedback';
import { CitizenReport } from '../types';

export const MyReportsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { data: cities = [] } = useCities();

  const [lookupId, setLookupId] = useState('');
  const [searchedReport, setSearchedReport] = useState<CitizenReport | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [localReports, setLocalReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [corroboratedIds, setCorroboratedIds] = useState<Set<string>>(new Set());

  // Load citizen's locally saved reports from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('my_citizen_reports') || '[]');
      setLocalReports(saved);
      if (saved.length > 0 && !selectedReport) {
        // Fetch first report details
        fetchReportDetails(saved[0].report_number);
      }
    } catch {
      setLocalReports([]);
    }
  }, []);

  const fetchReportDetails = async (reportNumberOrId: string) => {
    setIsSearching(true);
    setLookupError(null);
    try {
      // First try searching via API
      const res = await feedbackApi.getPublicReports({ search: reportNumberOrId, limit: 1 });
      if (res && res.length > 0) {
        setSelectedReport(res[0]);
        setSearchedReport(res[0]);
        setIsSearching(false);
        return;
      }
    } catch (err: any) {
      // API call failed, try local fallback
    }

    // Check locally saved citizen reports
    const saved = JSON.parse(localStorage.getItem('my_citizen_reports') || '[]');
    const localMatch = saved.find((r: any) => r.report_number === reportNumberOrId);
    if (localMatch) {
      const fallbackReport: any = {
        id: localMatch.id || localMatch.report_number,
        report_number: localMatch.report_number,
        title: localMatch.title,
        description: localMatch.description || 'Citizen reported issue logged in municipal telemetry.',
        category: localMatch.category,
        status: localMatch.status || 'submitted',
        created_at: localMatch.created_at,
        location_address: localMatch.location || localMatch.location_address || 'Municipal Area',
        severity_input: localMatch.severity || 'medium',
        corroboration_count: 1,
        assigned_department: localMatch.assigned_department || (localMatch.category === 'road_pothole' ? 'PWD Road Maintenance' : 'Municipal Services'),
        executive_summary_en: localMatch.executive_summary_en,
        executive_summary_hi: localMatch.executive_summary_hi,
        extracted_hazard: localMatch.extracted_hazard,
        recommended_action: localMatch.recommended_action,
        target_sla_hours: localMatch.target_sla_hours,
      };
      setSelectedReport(fallbackReport);
      setSearchedReport(fallbackReport);
    } else {
      setLookupError(`No public grievance found matching '${reportNumberOrId}'. Please verify the Complaint ID.`);
    }
    setIsSearching(false);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    fetchReportDetails(lookupId.trim());
  };

  const handleCorroborate = async (reportId: string) => {
    try {
      const res = await feedbackApi.corroborateReport(reportId, 'confirm_issue');
      setCorroboratedIds((prev) => new Set([...prev, reportId]));
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({
          ...selectedReport,
          corroboration_count: res.corroboration_count,
        });
      }
    } catch (err) {
      console.warn('Corroboration failed', err);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'submitted': return 1;
      case 'triaged':
      case 'assigned': return 2;
      case 'in_progress': return 3;
      case 'resolved': return 4;
      default: return 1;
    }
  };

  const currentStep = selectedReport ? getStatusStepIndex(selectedReport.status) : 1;

  return (
    <div className="min-h-screen w-full bg-[#0B132B] text-slate-100 flex flex-col font-sans select-none overflow-y-auto scrollbar-thin">
      <PublicHeader cities={cities} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>{i18n.language === 'hi' ? 'नागरिक शिकायत ट्रैकर' : 'Citizen Grievance Tracker'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {i18n.language === 'hi' 
              ? 'अपनी शिकायत की वर्तमान स्थिति, असाइन किया गया विभाग और फील्ड अधिकारी की कार्रवाई ट्रैक करें।'
              : 'Track grievance resolution lifecycle, assigned municipal department, and official inspection notes.'}
          </p>
        </div>

        {/* Complaint ID Search Bar */}
        <div className="p-4 bg-[#1C2541] border border-[#2E3D60] rounded-2xl shadow-xl">
          <form onSubmit={handleLookupSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter Complaint ID (e.g. ND-MP-2026-0001 or ND-MP-2026-0002)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#131B33] border border-[#2E3D60] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Track</span>
            </button>
          </form>

          {lookupError && (
            <p className="text-xs text-rose-400 mt-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lookupError}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Submissions / Saved List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{i18n.language === 'hi' ? 'आपकी हालिया शिकायतें' : 'Your Recent Submissions'}</span>
              <span className="text-[10px] text-cyan-400 font-mono">({localReports.length})</span>
            </h2>

            {localReports.length === 0 ? (
              <div className="p-6 bg-[#1C2541]/50 border border-[#2E3D60] rounded-xl text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No local reports saved</p>
                <p className="text-[11px] text-slate-500">
                  Reports you submit from this device will appear here automatically.
                </p>
                <a
                  href="/report"
                  className="inline-block mt-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-lg text-xs font-semibold"
                >
                  Submit a Report
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {localReports.map((r, idx) => (
                  <button
                    key={r.report_number || idx}
                    onClick={() => fetchReportDetails(r.report_number)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selectedReport?.report_number === r.report_number
                        ? 'bg-[#253258] border-cyan-500/60 shadow-lg'
                        : 'bg-[#1C2541] border-[#2E3D60] hover:bg-[#253258]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-cyan-400">{r.report_number}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">{r.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.location}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right 2 Columns: Detailed Status Tracker Card */}
          <div className="lg:col-span-2 space-y-4">
            {selectedReport ? (
              <div className="bg-[#1C2541] border border-[#2E3D60] rounded-2xl shadow-xl p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2E3D60] pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-bold text-cyan-400">{selectedReport.report_number}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {selectedReport.category.replace('_', ' ')}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-white">{selectedReport.title || 'Civic Grievance'}</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedReport.location_address || 'Municipal Ward Area'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Submitted On</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {new Date(selectedReport.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status Progress Stepper */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolution Lifecycle</span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    {[
                      { step: 1, label: 'Submitted', desc: 'Logged in PostGIS' },
                      { step: 2, label: 'Assigned', desc: 'Assigned to Dept' },
                      { step: 3, label: 'In Progress', desc: 'Field Action' },
                      { step: 4, label: 'Resolved', desc: 'Inspected & Closed' },
                    ].map((s) => (
                      <div key={s.step} className="space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            currentStep >= s.step
                              ? s.step === 4
                                ? 'bg-emerald-400'
                                : 'bg-cyan-400'
                              : 'bg-slate-700'
                          }`}
                        />
                        <p className={`font-bold ${currentStep >= s.step ? 'text-slate-100' : 'text-slate-500'}`}>
                          {s.label}
                        </p>
                        <p className="text-[9px] text-slate-400 hidden sm:block">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 bg-[#131B33] rounded-xl border border-[#2E3D60] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Citizen Raw Submission</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{selectedReport.description}</p>
                </div>

                {/* Sarvam AI Executive Intelligence Summary */}
                <div className="p-4 bg-gradient-to-br from-[#131B33] to-[#1C1A38] border border-cyan-500/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sarvam AI Executive Summarized Report</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Verified AI Grounded
                    </span>
                  </div>

                  {((selectedReport as any).extracted_hazard) && (
                    <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg">
                      <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider">
                        Extracted Hazard / पहचान किया गया जोखिम:
                      </span>
                      <p className="text-xs text-slate-100 font-semibold mt-0.5">
                        {(selectedReport as any).extracted_hazard}
                      </p>
                    </div>
                  )}

                  <div className="p-2.5 bg-[#0B132B]/80 rounded-lg border border-[#2E3D60] space-y-1">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                      Executive Summary / सारांश:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {i18n.language === 'hi'
                        ? ((selectedReport as any).executive_summary_hi || (selectedReport as any).executive_summary_en || selectedReport.description)
                        : ((selectedReport as any).executive_summary_en || (selectedReport as any).executive_summary_hi || selectedReport.description)}
                    </p>
                    {(selectedReport as any).executive_summary_hi && i18n.language !== 'hi' && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-[#2E3D60]/50 font-hindi">
                        "{(selectedReport as any).executive_summary_hi}"
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-[#0B132B] rounded-lg border border-[#2E3D60]">
                      <span className="text-slate-400 block">Assigned Dept:</span>
                      <span className="font-bold text-slate-200 truncate block">
                        {(selectedReport as any).assigned_department || 'Municipal Public Works'}
                      </span>
                    </div>
                    <div className="p-2 bg-[#0B132B] rounded-lg border border-[#2E3D60]">
                      <span className="text-slate-400 block">Resolution Target:</span>
                      <span className="font-bold text-amber-400">
                        {(selectedReport as any).target_sla_hours || 48}h Standard SLA
                      </span>
                    </div>
                  </div>

                  {((selectedReport as any).recommended_action) && (
                    <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-200">
                      <span className="font-bold block text-[10px] text-emerald-400 uppercase">Recommended Municipal Action:</span>
                      <p className="mt-0.5 leading-relaxed">{(selectedReport as any).recommended_action}</p>
                    </div>
                  )}
                </div>

                {/* Official Resolution Summary / Inspection Notes */}
                {selectedReport.resolution_summary ? (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Official Municipal Resolution</span>
                    </div>
                    <p className="text-xs text-slate-200">{selectedReport.resolution_summary}</p>
                    {selectedReport.assigned_officer_name && (
                      <p className="text-[10px] text-slate-400 font-mono pt-1">
                        Inspecting Officer: {selectedReport.assigned_officer_name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#131B33] rounded-xl border border-[#2E3D60] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Assigned to Municipal Dispatcher • Inspection Pending</span>
                    </div>
                    {selectedReport.assigned_officer_name && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Officer: {selectedReport.assigned_officer_name}
                      </span>
                    )}
                  </div>
                )}

                {/* Community Corroboration */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2E3D60]">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ThumbsUp className="w-4 h-4 text-cyan-400" />
                    <span>
                      <strong className="text-slate-200">{selectedReport.corroboration_count}</strong> citizens corroborated this issue
                    </span>
                  </div>

                  <button
                    onClick={() => handleCorroborate(selectedReport.id)}
                    disabled={corroboratedIds.has(selectedReport.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-cyan-500/30 rounded-lg text-xs font-semibold text-cyan-300 transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{corroboratedIds.has(selectedReport.id) ? 'Corroborated' : 'I also face this issue'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 bg-[#1C2541] border border-[#2E3D60] rounded-2xl text-center space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">Track Grievance Status</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a recent submission from the left panel or enter your Complaint ID above to view live inspection updates and resolution notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

