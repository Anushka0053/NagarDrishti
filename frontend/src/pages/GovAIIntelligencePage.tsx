import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  FileText, 
  Download, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  ListFilter,
  Printer,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { useCities } from '../api/hooks';
import { intelligenceApi } from '../api/intelligence';
import { 
  AreaReportPreviewResponse, 
  AreaIntelligenceReport, 
  AreaReportGenerateRequest 
} from '../types';

export const GovAIIntelligencePage: React.FC = () => {
  const { data: cities = [] } = useCities();

  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('Consolidated Civic Area Intelligence Brief');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [previewData, setPreviewData] = useState<AreaReportPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<AreaIntelligenceReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<AreaIntelligenceReport[]>([]);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default city
  useEffect(() => {
    if (cities.length > 0 && !selectedCityId) {
      const gwalior = cities.find((c) => c.slug === 'gwalior') || cities[0];
      setSelectedCityId(gwalior.id);
    }
  }, [cities, selectedCityId]);

  // Load existing area reports
  const loadSavedReports = async () => {
    try {
      const reports = await intelligenceApi.listAreaReports({
        city_id: selectedCityId || undefined,
        limit: 20,
      });
      setSavedReports(reports || []);
    } catch (err) {
      console.warn('Failed to fetch area reports', err);
    }
  };

  useEffect(() => {
    if (selectedCityId) {
      loadSavedReports();
      handlePreview();
    }
  }, [selectedCityId, selectedCategory, selectedStatus]);

  const handlePreview = async () => {
    if (!selectedCityId) return;
    setIsPreviewing(true);
    setErrorMsg(null);
    try {
      const res = await intelligenceApi.previewAreaReport({
        city_id: selectedCityId,
        categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
        statuses: selectedStatus !== 'all' ? [selectedStatus] : undefined,
      });
      setPreviewData(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to preview matching area reports');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedCityId) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const payload: AreaReportGenerateRequest = {
        city_id: selectedCityId,
        title: reportTitle,
        categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
        statuses: selectedStatus !== 'all' ? [selectedStatus] : undefined,
      };
      const report = await intelligenceApi.generateAreaReport(payload);
      setGeneratedReport(report);
      loadSavedReports();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate consolidated area intelligence report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    setIsApproving(true);
    try {
      const updated = await intelligenceApi.updateAreaReport(reportId, {
        status: 'approved',
        approved_by: 'Super Admin (Rajesh Sharma)',
      });
      setGeneratedReport(updated);
      loadSavedReports();
    } catch (err) {
      console.warn('Approval failed', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const activeCity = cities.find((c) => c.id === selectedCityId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:bg-white print:text-black">
      {/* Page Header (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span>AI Consolidated Area Intelligence Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synthesize multiple citizen grievances into authoritative, ward-level municipal intelligence using Sarvam AI.
          </p>
        </div>

        <button
          onClick={loadSavedReports}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Control / Filter Panel (Hidden in Print) */}
      <div className="p-5 bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Select Municipality
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en} ({c.name_hi})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Issue Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Grievance Categories</option>
              <option value="road_pothole">Road Distress & Potholes</option>
              <option value="water_leakage">Water Supply Leakage</option>
              <option value="garbage_dump">Solid Waste Dumps</option>
              <option value="street_light">Lighting Failures</option>
              <option value="sewerage_overflow">Drainage & Sewerage</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Report Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Statuses (Active & Resolved)</option>
              <option value="submitted">Submitted Only</option>
              <option value="in_progress">Under Active Inspection</option>
              <option value="resolved">Resolved Complaints</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Report Document Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g. Ward 14 PWD Distress Synthesis"
              className="w-full p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Step 1: Preview Matching Reports */}
        <div className="p-4 bg-[#1C2541] rounded-xl border border-[#2E3D60] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">
                Matching Citizen Reports in PostGIS: {isPreviewing ? '...' : previewData?.report_count || 0}
              </p>
              <p className="text-[10px] text-slate-400">
                Selected Scope: {activeCity?.name_en || 'Municipal Area'} • Ready for Sarvam AI synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || (previewData?.report_count ?? 0) === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing with Sarvam AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Consolidated AI Area Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Generated Report Display / Official PDF View */}
      {generatedReport ? (
        <div className="bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-2xl p-6 sm:p-10 space-y-6 print:border-0 print:p-0 print:shadow-none print:bg-white print:text-black">
          {/* Printable Official Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2E3D60] pb-6 print:border-black print:pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-purple-400 print:text-black">
                  {generatedReport.report_number}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-300 print:text-black print:border-black">
                  {generatedReport.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white print:text-black">
                {generatedReport.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                Government of Madhya Pradesh • Urban Administration & Development Directorate
              </p>
            </div>

            {/* Actions (Hidden in Print) */}
            <div className="flex items-center gap-2.5 print:hidden">
              {generatedReport.status !== 'approved' && (
                <button
                  onClick={() => handleApproveReport(generatedReport.id)}
                  disabled={isApproving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Report</span>
                </button>
              )}

              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-xl text-xs font-bold text-slate-200 transition-colors"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Export / Print PDF</span>
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#162038] rounded-xl border border-[#2E3D60] text-xs font-mono print:bg-slate-50 print:border-slate-300 print:text-black">
            <div>
              <span className="text-[10px] text-slate-400 block print:text-slate-600">Scope City</span>
              <span className="font-bold text-slate-200 print:text-black">{activeCity?.name_en}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-slate-600">Source Grievances</span>
              <span className="font-bold text-cyan-300 print:text-black">{generatedReport.source_reports_count} Submissions</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-slate-600">Issue Clusters</span>
              <span className="font-bold text-purple-300 print:text-black">{generatedReport.distinct_issue_groups_count} Distinct Groups</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block print:text-slate-600">AI Grounding Score</span>
              <span className="font-bold text-emerald-400 print:text-black">{(generatedReport.confidence_score * 100).toFixed(0)}% Confidence</span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-black flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>Consolidated Executive Summary</span>
            </h3>
            <div className="p-4 bg-[#1C2541] rounded-xl border border-[#2E3D60] text-xs text-slate-200 leading-relaxed print:bg-white print:border-slate-300 print:text-black">
              {generatedReport.executive_summary_en}
            </div>
          </div>

          {/* Recurring Issues & Responsible Departments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Recurring Issues */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Recurring Issues</span>
              </h3>
              <div className="p-4 bg-[#1C2541] rounded-xl border border-[#2E3D60] space-y-3 print:bg-white print:border-slate-300">
                {generatedReport.recurring_issues && generatedReport.recurring_issues.length > 0 ? (
                  generatedReport.recurring_issues.map((rec, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-200 print:text-black">
                        <span>{rec.issue_type}</span>
                        <span className="text-amber-400 font-mono text-[11px] print:text-black">Frequency: {rec.frequency}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 print:text-slate-700">{rec.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No repetitive clusters detected.</p>
                )}
              </div>
            </div>

            {/* Suggested Responsible Departments */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-black flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>Recommended Department Action Plans</span>
              </h3>
              <div className="p-4 bg-[#1C2541] rounded-xl border border-[#2E3D60] space-y-3 print:bg-white print:border-slate-300">
                {generatedReport.suggested_departments && generatedReport.suggested_departments.length > 0 ? (
                  generatedReport.suggested_departments.map((dept, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="flex justify-between font-bold text-cyan-300 print:text-black">
                        <span>{dept.department_name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 print:text-black print:border-black">
                          {dept.priority} Priority
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 print:text-slate-700">{dept.action_item}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Department assignments pending officer review.</p>
                )}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-black flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Recommended Municipal Interventions</span>
            </h3>
            <div className="p-4 bg-[#1C2541] rounded-xl border border-[#2E3D60] print:bg-white print:border-slate-300">
              <ul className="space-y-2 text-xs text-slate-200 list-disc list-inside print:text-black">
                {generatedReport.recommended_actions?.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Provenance & Sign-off Footer */}
          <div className="p-4 bg-[#162038] rounded-xl border border-[#2E3D60] flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-slate-400 print:bg-slate-50 print:border-slate-300 print:text-black">
            <div>
              <span>Generated via Sarvam AI & PostGIS • {new Date(generatedReport.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span>Approved By: {generatedReport.approved_by || 'Pending Municipal Review'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Saved Area Reports List */
        <div className="bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl p-6 space-y-4 print:hidden">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Saved Area Intelligence Reports ({savedReports.length})</span>
          </h2>

          {savedReports.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No consolidated area reports generated yet. Use the controls above to synthesize matching grievances into a new report.
            </p>
          ) : (
            <div className="space-y-2.5">
              {savedReports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setGeneratedReport(rep)}
                  className="p-4 rounded-xl bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-300">{rep.report_number}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded border border-slate-700 bg-slate-800 text-slate-300">
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">{rep.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {rep.source_reports_count} source grievances • {new Date(rep.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGeneratedReport(rep);
                    }}
                    className="px-3 py-1.5 bg-[#131B33] hover:bg-purple-600 hover:text-white border border-purple-500/30 rounded-lg text-xs font-semibold text-purple-300 transition-colors"
                  >
                    View Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

