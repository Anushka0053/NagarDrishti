import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Volume2, 
  Share2, 
  MapPin, 
  Building, 
  Check, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Layers, 
  Loader2, 
  ThumbsUp, 
  CheckCircle2, 
  Clock, 
  Copy,
  AlertCircle
} from 'lucide-react';
import { useLayerStore } from '../../store/layerStore';
import { useMapStore } from '../../store/mapStore';
import { useFeedbackStore } from '../../store/feedbackStore';
import { ProvenanceType, EntityIntelligence } from '../../types';
import { intelligenceApi } from '../../api/intelligence';
import { feedbackApi } from '../../api/feedback';

export const Inspector: React.FC = () => {
  const { i18n } = useTranslation();
  const { isInspectorOpen, setInspectorOpen, activeCity, resolvedLocation } = useMapStore();
  const { selectedFeature } = useLayerStore();
  const { openModal: openFeedbackModal } = useFeedbackStore();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [corroborated, setCorroborated] = useState(false);
  const [corroborationCount, setCorroborationCount] = useState<number>(1);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const [entityIntelligence, setEntityIntelligence] = useState<EntityIntelligence | null>(null);
  const [isLoadingEntity, setIsLoadingEntity] = useState<boolean>(false);

  // Check if selected feature is a Citizen Report or Physical Facility
  const isCitizenReport = 
    selectedFeature?.provenance_type === 'citizen_submitted' ||
    !!selectedFeature?.properties?.['Report Number'] ||
    !!selectedFeature?.properties?.report_number;

  const props = selectedFeature?.properties || {};
  const reportNumber = props['Report Number'] || props.report_number || selectedFeature?.feature_id;

  // Initialize corroboration count from props
  useEffect(() => {
    if (isCitizenReport) {
      setCorroborationCount(Number(props['Corroboration Count'] || props.corroboration_count || 1));
      setCorroborated(false);
    }
  }, [selectedFeature?.id, reportNumber, isCitizenReport]);

  // Fetch nearby reports & intelligence for physical civic facilities only
  useEffect(() => {
    if (!selectedFeature || isCitizenReport) {
      setEntityIntelligence(null);
      return;
    }
    const entityType = selectedFeature.category || 'facility';
    const entityId = selectedFeature.feature_id || (selectedFeature as any).id || 'current';
    setIsLoadingEntity(true);

    intelligenceApi
      .getEntityIntelligence(entityType, entityId)
      .then((data) => setEntityIntelligence(data))
      .catch((err) => {
        console.warn('Facility intelligence fetch error', err);
        setEntityIntelligence(null);
      })
      .finally(() => setIsLoadingEntity(false));
  }, [selectedFeature?.feature_id, (selectedFeature as any)?.id, isCitizenReport]);

  if (!isInspectorOpen) return null;

  const handleSpeakAloud = () => {
    if ('speechSynthesis' in window) {
      let textToSpeak = '';
      if (isCitizenReport) {
        const catName = (selectedFeature?.category || 'Civic Issue').replace('_', ' ');
        textToSpeak = i18n.language === 'hi'
          ? `नागरिक शिकायत क्रमांक ${reportNumber}। श्रेणी: ${catName}। स्थिति: ${props.Status || props.status || 'विचाराधीन'}।`
          : `Citizen Grievance ${reportNumber}. Category: ${catName}. Current Status: ${props.Status || props.status || 'Under review'}.`;
      } else {
        const name = i18n.language === 'hi' 
          ? selectedFeature?.name_hi || selectedFeature?.name_en || selectedFeature?.category
          : selectedFeature?.name_en || selectedFeature?.name_hi || selectedFeature?.category;
        textToSpeak = i18n.language === 'hi' 
          ? `${name}। मध्य प्रदेश भूसूचना प्रणाली में दर्ज नागरिक अवसंरचना।`
          : `${name}. Civic infrastructure registered in Madhya Pradesh GIS.`;
      }
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}/?lat=${selectedFeature?.latitude || 26.2183}&lng=${selectedFeature?.longitude || 78.1828}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleCorroborate = async () => {
    if (corroborated) return;
    setCorroborated(true);
    setCorroborationCount((prev) => prev + 1);
    if (selectedFeature?.id) {
      try {
        await feedbackApi.corroborateReport(selectedFeature.id);
      } catch (e) {
        // Safe offline fallback
      }
    }
  };

  const isRoadFeature = 
    selectedFeature?.category === 'roads' || 
    selectedFeature?.layer_name_en?.toLowerCase().includes('road') ||
    !!props.highway;

  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || 'submitted').toLowerCase();
    switch (s) {
      case 'submitted':
        return { label: 'Submitted', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', step: 1 };
      case 'assigned':
        return { label: 'Assigned to Dept', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', step: 2 };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', step: 3 };
      case 'resolved':
        return { label: 'Resolved & Closed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', step: 4 };
      default:
        return { label: 'Active', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', step: 1 };
    }
  };

  const statusInfo = getStatusBadge(props.Status || props.status);

  return (
    <aside className="w-96 max-w-full h-[calc(100vh-3.5rem)] bg-[#0B132B]/95 border-l border-[#2E3D60] flex flex-col z-20 select-none backdrop-blur-md shadow-2xl">
      {/* Inspector Header */}
      <div className="p-3 border-b border-[#2E3D60] bg-[#1C2541]/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {isCitizenReport ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <Building className="w-4 h-4 text-cyan-400" />
          )}
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            {isCitizenReport ? 'Citizen Grievance Details' : 'Civic Feature Intelligence'}
          </h2>
        </div>
        <button
          onClick={() => setInspectorOpen(false)}
          className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Close Inspector"
        >
          ✕
        </button>
      </div>

      {!selectedFeature ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
          <MapPin className="w-10 h-10 text-[#2E3D60] animate-bounce" />
          <p className="text-xs leading-relaxed">
            Click on any citizen report beacon or GIS facility on the map to inspect verified details.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
          {/* ========================================================= */}
          {/* CASE A: CITIZEN GRIEVANCE CARD                            */}
          {/* ========================================================= */}
          {isCitizenReport ? (
            <div className="space-y-3.5">
              {/* Report Header Bar */}
              <div className="p-3.5 bg-[#131B33] border border-[#2E3D60] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                    <span>{reportNumber}</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 leading-snug">
                  {selectedFeature.name_en || props.title || 'Civic Grievance'}
                </h3>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span className="capitalize font-medium text-slate-300">
                    {(selectedFeature.category || props.category || 'Issue').replace('_', ' ')}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-[10px]">
                    {props['Submission Date'] ? new Date(props['Submission Date']).toLocaleDateString() : 'Active Grievance'}
                  </span>
                </div>
              </div>

              {/* Description Card */}
              <div className="p-3 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Citizen Description
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {props.description || selectedFeature.name_en || 'Public complaint registered by citizen for municipal inspection and resolution.'}
                </p>
              </div>

              {/* 4-Step Visual Progress Stepper */}
              <div className="p-3 bg-[#131B33] border border-[#2E3D60] rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Resolution Lifecycle
                </span>
                <div className="grid grid-cols-4 gap-1 text-center pt-1">
                  {[
                    { step: 1, label: 'Submitted' },
                    { step: 2, label: 'Assigned' },
                    { step: 3, label: 'In Progress' },
                    { step: 4, label: 'Resolved' }
                  ].map((s) => {
                    const isDone = statusInfo.step >= s.step;
                    const isCurrent = statusInfo.step === s.step;
                    return (
                      <div key={s.step} className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isDone 
                              ? 'bg-gradient-to-r from-blue-500 to-emerald-400' 
                              : 'bg-slate-700'
                          }`}
                        />
                        <span className={`text-[9px] block ${isCurrent ? 'text-cyan-300 font-bold' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Location & Administrative Hierarchy */}
              <div className="p-3 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Geographic Location</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Locality:</span>
                    <span className="font-semibold text-slate-100 truncate max-w-[180px]">
                      {props.Location || props.location_address || 'Municipal Area'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ward:</span>
                    <span className="font-semibold text-slate-200">
                      {selectedFeature.ward_name || resolvedLocation?.ward_en || 'Ward 14 (Central)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">City:</span>
                    <span className="font-semibold text-slate-200">{activeCity?.name_en || 'Gwalior'}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] pt-1 border-t border-[#2E3D60]/60">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-cyan-400">
                      {selectedFeature.latitude?.toFixed(5)}° N, {selectedFeature.longitude?.toFixed(5)}° E
                    </span>
                  </div>
                </div>
              </div>

              {/* Citizen Corroboration Card */}
              <div className="p-3 bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{corroborationCount} Citizens Affected</span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Community verification increases municipal triage priority.
                  </p>
                </div>
                <button
                  onClick={handleCorroborate}
                  disabled={corroborated}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                    corroborated
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                  }`}
                >
                  {corroborated ? 'Corroborated ✓' : '+1 Facing This'}
                </button>
              </div>

              {/* Sarvam AI Triage & Executive Summarized Report */}
              <div className="p-3.5 bg-gradient-to-br from-[#131B33] to-[#1C1A38] border border-cyan-500/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sarvam AI Executive Summarized Report</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    {props.triage_confidence || 94}% Confidence
                  </span>
                </div>

                {/* Extracted Hazard */}
                {(props.extracted_hazard || props.hazard) && (
                  <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg">
                    <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider">
                      Extracted Hazard / पहचान किया गया जोखिम:
                    </span>
                    <p className="text-xs text-slate-100 font-semibold mt-0.5">
                      {props.extracted_hazard || props.hazard}
                    </p>
                  </div>
                )}

                {/* Synthesized Executive Summary */}
                <div className="p-2.5 bg-[#0B132B]/90 rounded-lg border border-[#2E3D60] space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                    Executive Brief / कार्यकारी सारांश:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {i18n.language === 'hi'
                      ? (props.executive_summary_hi || props.executive_summary_en || props.summary || props.description)
                      : (props.executive_summary_en || props.executive_summary_hi || props.summary || props.description)}
                  </p>
                  {props.executive_summary_hi && i18n.language !== 'hi' && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-[#2E3D60]/50 font-hindi">
                      "{props.executive_summary_hi}"
                    </p>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-[#0B132B] rounded-lg border border-[#2E3D60]">
                    <span className="text-slate-400 block">Assigned Dept:</span>
                    <span className="font-bold text-slate-200 truncate block">
                      {props.assigned_department || props.department || (
                        selectedFeature.category === 'road_pothole'
                          ? 'PWD Road Maintenance'
                          : selectedFeature.category === 'water_leakage'
                          ? 'PHED Water Supply'
                          : selectedFeature.category === 'garbage_dump'
                          ? 'SWM Solid Waste'
                          : 'Municipal Civic Services'
                      )}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0B132B] rounded-lg border border-[#2E3D60]">
                    <span className="text-slate-400 block">Resolution Target:</span>
                    <span className="font-bold text-amber-400">
                      {props.target_sla_hours || 48}h Priority SLA
                    </span>
                  </div>
                </div>

                {props.recommended_action && (
                  <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-200">
                    <span className="font-bold block text-[10px] text-emerald-400 uppercase">Recommended Municipal Action:</span>
                    <p className="mt-0.5 leading-relaxed">{props.recommended_action}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSpeakAloud}
                  className="flex-1 py-2 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>Listen</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copied ? 'Link Copied' : 'Share'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* CASE B: CIVIC INFRASTRUCTURE / FACILITY CARD              */
            /* ========================================================= */
            <div className="space-y-3.5">
              {/* Feature Title Card */}
              <div className="p-3.5 bg-[#131B33] border border-[#2E3D60] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                    {selectedFeature.layer_name_en || selectedFeature.category || 'Civic Infrastructure'}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full border border-cyan-500/30 text-cyan-300 bg-cyan-950/40 font-mono">
                    Open GIS Verified
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {selectedFeature.name_en || selectedFeature.name_hi || (isRoadFeature ? 'Mapped Road Corridor' : 'Civic Facility')}
                </h3>
                {selectedFeature.name_hi && selectedFeature.name_hi !== selectedFeature.name_en && (
                  <p className="text-xs text-slate-400 font-hindi">{selectedFeature.name_hi}</p>
                )}
              </div>

              {/* Road or Facility Profile */}
              {isRoadFeature ? (
                <div className="p-3 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Road Corridor Attributes</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px]">Highway Class</span>
                      <p className="font-semibold text-slate-100 capitalize">{props.highway || 'Secondary'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Surface Type</span>
                      <p className="font-semibold text-slate-100">{props.surface || 'Paved / Asphalt'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Lanes</span>
                      <p className="font-semibold text-slate-100">{props.lanes || 'Standard 2-Lane'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">One-Way</span>
                      <p className="font-semibold text-slate-100">{props.oneway === 'yes' ? 'Yes' : 'Two-Way'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
                    <Building className="w-3.5 h-3.5" />
                    <span>Facility Attributes</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px]">Managing Authority</span>
                      <p className="font-semibold text-slate-100 truncate">{props.operator || props.authority || 'Urban Administration'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Service Status</span>
                      <p className="font-semibold text-emerald-400">Operational</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">City Authority</span>
                      <p className="font-semibold text-slate-100">{activeCity?.name_en ? `${activeCity.name_en} Municipal Corp` : 'Municipal Administration'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Ward</span>
                      <p className="font-semibold text-slate-100">{selectedFeature.ward_name || resolvedLocation?.ward_en || 'Municipal Area'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Geographic Coordinates */}
              <div className="p-3 bg-[#1C2541]/70 border border-[#2E3D60] rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-slate-400">WGS84 Coordinates:</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {selectedFeature.latitude?.toFixed(5)}° N, {selectedFeature.longitude?.toFixed(5)}° E
                </span>
              </div>

              {/* Nearby Citizen Grievances within 200m */}
              <div className="p-3 bg-[#131B33] border border-[#2E3D60] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    Nearby Citizen Grievances
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400">
                    200m Radius
                  </span>
                </div>

                {isLoadingEntity ? (
                  <div className="py-4 text-center text-xs text-cyan-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking nearby citizen complaints...</span>
                  </div>
                ) : entityIntelligence?.linked_citizen_reports && entityIntelligence.linked_citizen_reports.length > 0 ? (
                  <div className="space-y-2">
                    {entityIntelligence.linked_citizen_reports.map((lr) => (
                      <div key={lr.id} className="p-2.5 bg-[#1C2541] rounded-lg border border-[#2E3D60] space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-cyan-400">{lr.report_number}</span>
                          <span className="text-amber-400 uppercase font-semibold">{lr.status}</span>
                        </div>
                        <p className="font-semibold text-slate-100 text-xs">{lr.title}</p>
                        <span className="text-[10px] text-slate-400 block">
                          Distance: ~{lr.distance_meters}m from facility
                        </span>
                      </div>
                    ))}
                    {/* Area Intelligence Consolidation Link */}
                    <a
                      href="/gov/ai-intelligence"
                      className="w-full py-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold rounded-lg text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all mt-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Consolidate {entityIntelligence.linked_citizen_reports.length} Reports via Sarvam AI</span>
                    </a>
                  </div>
                ) : (
                  <div className="py-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 bg-[#0B132B]/60 rounded-lg border border-[#2E3D60]/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No active citizen complaints within 200m.</span>
                  </div>
                )}
              </div>

              {/* Report Issue Action Button */}
              <button
                onClick={() => openFeedbackModal()}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report an Issue at this Location</span>
              </button>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakAloud}
                  className="flex-1 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>Listen</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
              </div>

              {/* Collapsible Technical Details */}
              <div className="border border-[#2E3D60] rounded-xl overflow-hidden bg-[#1C2541]/40">
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:bg-[#1C2541]"
                >
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Technical & Source Metadata</span>
                  </span>
                  {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showTechnicalDetails && (
                  <div className="p-3 border-t border-[#2E3D60] space-y-1.5 bg-[#131B33] text-[10px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-400">Feature UUID: </span>
                      <span className="text-cyan-300 break-all">{selectedFeature.id || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Source: </span>
                      <span>{selectedFeature.source_attribution_en || 'OpenStreetMap contributors'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">External ID: </span>
                      <span>{props.osm_id || selectedFeature.source_record_id || 'OSM Entity'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
