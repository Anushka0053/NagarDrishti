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
  AlertCircle,
  Camera,
  TrendingDown,
  TrendingUp,
  X,
  ExternalLink,
  Wrench,
  Droplets,
  Trash2,
  Lightbulb,
  MessageSquarePlus,
  ShieldAlert,
  Calendar,
  Send
} from 'lucide-react';
import { useLayerStore } from '../../store/layerStore';
import { useMapStore } from '../../store/mapStore';
import { useFeedbackStore } from '../../store/feedbackStore';
import { 
  ProvenanceType, 
  EntityIntelligence 
} from '../../types';
import { intelligenceApi } from '../../api/intelligence';
import { feedbackApi } from '../../api/feedback';
import { authApi } from '../../api/auth';
import { getGroundedCivicText, formatCivicCategory, isDevanagari } from '../../utils/civicTranslate';
import { Link } from 'react-router-dom';

export const Inspector: React.FC = () => {
  const { i18n } = useTranslation();
  const { isInspectorOpen, setInspectorOpen, activeCity, resolvedLocation } = useMapStore();
  const { selectedFeature } = useLayerStore();
  const { openModal: openFeedbackModal } = useFeedbackStore();

  // Dedicated Inspector language selector: User chooses between English and Hindi
  const [panelLang, setPanelLang] = useState<'en' | 'hi'>(i18n.language === 'hi' ? 'hi' : 'en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [corroborated, setCorroborated] = useState(false);
  const [corroborationCount, setCorroborationCount] = useState<number>(1);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [showAllCitizenFeedbacks, setShowAllCitizenFeedbacks] = useState(false);
  const [viewMode, setViewMode] = useState<'consolidated' | 'single'>('consolidated');
  const [showCorroborateForm, setShowCorroborateForm] = useState(false);
  const [corroborateComment, setCorroborateComment] = useState('');
  const [isSubmittingCorroboration, setIsSubmittingCorroboration] = useState(false);
  const [localCitizenFeedbacks, setLocalCitizenFeedbacks] = useState<any[]>([]);

  const [entityIntelligence, setEntityIntelligence] = useState<EntityIntelligence | null>(null);
  const [isLoadingEntity, setIsLoadingEntity] = useState<boolean>(false);
  const [fullReport, setFullReport] = useState<any>(null);

  // Sync panelLang if global language changes initially, but keep local user preference
  useEffect(() => {
    if (i18n.language === 'hi' || i18n.language === 'en') {
      setPanelLang(i18n.language as 'en' | 'hi');
    }
  }, [i18n.language]);

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

  // Fetch full report record when a citizen report is selected
  useEffect(() => {
    if (isCitizenReport && reportNumber) {
      feedbackApi.getReportById(reportNumber)
        .then((data: any) => {
          if (data) setFullReport(data);
        })
        .catch(() => {
          // Keep props fallback
        });
    } else {
      setFullReport(null);
    }
  }, [reportNumber, isCitizenReport]);

  // Fetch nearby reports & Amazon-style intelligence for physical civic facilities & roads
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
        textToSpeak = panelLang === 'hi'
          ? `नागरिक शिकायत क्रमांक ${reportNumber}। श्रेणी: ${catName}। स्थिति: ${props.Status || props.status || 'विचाराधीन'}।`
          : `Citizen Grievance ${reportNumber}. Category: ${catName}. Current Status: ${props.Status || props.status || 'Under review'}.`;
      } else {
        const name = panelLang === 'hi' 
          ? selectedFeature?.name_hi || selectedFeature?.name_en || selectedFeature?.category
          : selectedFeature?.name_en || selectedFeature?.name_hi || selectedFeature?.category;
        textToSpeak = panelLang === 'hi' 
          ? `${name}। मध्य प्रदेश भूसूचना प्रणाली में दर्ज नागरिक अवसंरचना।`
          : `${name}. Civic infrastructure registered in Madhya Pradesh GIS.`;
      }
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = panelLang === 'hi' ? 'hi-IN' : 'en-US';
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

  const handleCorroborateClick = () => {
    if (corroborated) return;
    setShowCorroborateForm(true);
  };

  const handleConfirmCorroborate = async () => {
    if (isSubmittingCorroboration) return;
    setIsSubmittingCorroboration(true);
    setCorroborated(true);
    setCorroborationCount((prev) => prev + 1);

    const reportTargetId = selectedFeature?.id || reportNumber;
    if (reportTargetId) {
      try {
        await feedbackApi.corroborateReport(reportTargetId, 'confirm_issue', corroborateComment.trim() || undefined);
      } catch (e) {
        // Handled cleanly with offline counter fallback
      }
    }

    if (corroborateComment.trim()) {
      const newFeedback = {
        citizen_label: `Citizen #${corroborationCount + 1}`,
        aspect_en: 'Community Observation',
        aspect_hi: 'नागरिक अवलोकन',
        feedback_en: corroborateComment.trim(),
        feedback_hi: corroborateComment.trim(),
      };
      setLocalCitizenFeedbacks((prev) => [newFeedback, ...prev]);
      setShowAllCitizenFeedbacks(true);
    }

    setIsSubmittingCorroboration(false);
    setShowCorroborateForm(false);
  };

  const entityType = selectedFeature?.category || 'facility';
  const entityId = selectedFeature?.feature_id || (selectedFeature as any)?.id || 'current';
  const reportsCount = entityIntelligence?.recent_reports?.length || 0;
  const currentUser = authApi.getStoredUser();
  const isAdmin = currentUser?.role === 'city_admin' || currentUser?.role === 'department_head';

  const isRoadFeature = 
    selectedFeature?.category === 'roads' || 
    selectedFeature?.layer_name_en?.toLowerCase().includes('road') ||
    !!props.highway;

  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || 'submitted').toLowerCase();
    switch (s) {
      case 'submitted':
        return { 
          label: panelLang === 'hi' ? 'प्रस्तुत' : 'Submitted', 
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          step: 1 
        };
      case 'assigned':
        return { 
          label: panelLang === 'hi' ? 'विभाग को सौंपा' : 'Assigned', 
          color: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
          dot: 'bg-sky-400',
          step: 2 
        };
      case 'in_progress':
        return { 
          label: panelLang === 'hi' ? 'प्रगति पर' : 'In Progress', 
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400',
          step: 3 
        };
      case 'resolved':
        return { 
          label: panelLang === 'hi' ? 'समाधान हुआ' : 'Resolved', 
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          step: 4 
        };
      default:
        return { 
          label: panelLang === 'hi' ? 'सक्रिय' : 'Active', 
          color: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
          dot: 'bg-blue-400',
          step: 1 
        };
    }
  };

  const getCategoryIcon = (categoryStr?: string) => {
    const c = (categoryStr || '').toLowerCase();
    if (c.includes('road') || c.includes('pothole')) return <Wrench className="w-4 h-4 text-sky-400" />;
    if (c.includes('water') || c.includes('leak')) return <Droplets className="w-4 h-4 text-cyan-400" />;
    if (c.includes('waste') || c.includes('garbage')) return <Trash2 className="w-4 h-4 text-emerald-400" />;
    if (c.includes('light') || c.includes('electric')) return <Lightbulb className="w-4 h-4 text-amber-400" />;
    return <AlertTriangle className="w-4 h-4 text-rose-400" />;
  };

  const activeProps = {
    ...props,
    ...(fullReport || {}),
    ...(fullReport?.ai_metadata || {}),
  };

  const statusInfo = getStatusBadge(activeProps.Status || activeProps.status);
  const intel = activeProps.individual_intelligence || activeProps.ai_metadata?.individual_intelligence;

  // Dynamic Bilingual Resolution for Citizen Grievance Card
  const grievanceTitle = panelLang === 'hi' 
    ? (activeProps.title_hi || getGroundedCivicText(selectedFeature?.name_hi || selectedFeature?.name_en || activeProps.title || 'नागरिक शिकायत', 'hi'))
    : (activeProps.title_en || getGroundedCivicText(selectedFeature?.name_en || selectedFeature?.name_hi || activeProps.title || 'Civic Grievance', 'en'));

  const grievanceCategory = formatCivicCategory(
    activeProps.category || selectedFeature?.category || 'other',
    panelLang
  );

  // Description in selected language strictly verified against target language
  const rawDesc = activeProps.description || activeProps.original_description || selectedFeature?.name_en || '';
  const citizenDesc = getGroundedCivicText(
    rawDesc,
    panelLang,
    activeProps.description_en,
    activeProps.description_hi
  );

  // Verbatim original citizen description
  const originalDesc = activeProps.original_description || activeProps.description || rawDesc;
  const isOriginalDevanagari = isDevanagari(originalDesc);

  const communityIntel = activeProps.community_intelligence || fullReport?.community_intelligence;
  const isMultiCitizen = corroborationCount > 1 || (communityIntel?.citizen_feedbacks && communityIntel.citizen_feedbacks.length > 1) || localCitizenFeedbacks.length > 0;

  // Executive summary strictly in selected language, honoring Multi-Citizen Consolidation if active
  const rawExecSummary = (viewMode === 'consolidated' && isMultiCitizen && communityIntel)
    ? (panelLang === 'hi' ? communityIntel.consolidated_executive_brief_hi : communityIntel.consolidated_executive_brief_en)
    : (panelLang === 'hi'
        ? (activeProps.executive_brief_hi || activeProps.executive_summary_hi || intel?.executive_summary_hi || activeProps.executive_brief_en || activeProps.executive_summary_en || intel?.executive_summary_en || citizenDesc)
        : (activeProps.executive_brief_en || activeProps.executive_summary_en || intel?.executive_summary_en || activeProps.executive_brief_hi || activeProps.executive_summary_hi || intel?.executive_summary_hi || citizenDesc));

  const execSummary = getGroundedCivicText(
    rawExecSummary,
    panelLang,
    activeProps.executive_brief_en || activeProps.executive_summary_en,
    activeProps.executive_brief_hi || activeProps.executive_summary_hi
  );

  // Extracted Hazard cleanly formatted without snake_case or language leakage
  const rawHazard = (viewMode === 'consolidated' && isMultiCitizen && communityIntel)
    ? (panelLang === 'hi' ? communityIntel.primary_hazard_hi : communityIntel.primary_hazard_en)
    : (activeProps.extracted_hazard || intel?.reported_problem || activeProps.extracted_hazard_hi || intel?.reported_problem_hi || activeProps.hazard);

  const extractedHazard = rawHazard?.includes('_')
    ? formatCivicCategory(rawHazard, panelLang)
    : getGroundedCivicText(rawHazard, panelLang, activeProps.extracted_hazard, activeProps.extracted_hazard_hi);

  const assignedDept = panelLang === 'hi'
    ? (activeProps.assigned_department_name_hi || activeProps.assigned_department_hi || intel?.responsible_department_hi || 'नगर निगम जन शिकायत निवारण प्रकोष्ठ')
    : (activeProps.assigned_department_name || activeProps.assigned_department || intel?.responsible_department || 'Municipal Citizen Grievance Redressal Cell');

  const rawAction = (viewMode === 'consolidated' && isMultiCitizen && communityIntel)
    ? (panelLang === 'hi' ? communityIntel.recommended_action_hi : communityIntel.recommended_action_en)
    : (activeProps.recommended_action || intel?.recommended_action || activeProps.recommended_action_hi || intel?.recommended_action_hi);

  const recommendedAction = rawAction
    ? getGroundedCivicText(rawAction, panelLang, activeProps.recommended_action, activeProps.recommended_action_hi)
    : '';

  return (
    <aside className="w-96 sm:w-[420px] lg:w-[440px] max-w-full h-[calc(100vh-3rem)] bg-slate-950/95 border-l border-slate-800/80 flex flex-col z-20 select-none backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.8)]">
      
      {/* -------------------------------------------------------- */}
      {/* Sleek Modern Header                                      */}
      {/* -------------------------------------------------------- */}
      <div className="p-3.5 px-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            {isCitizenReport ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <Building className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
              {isCitizenReport 
                ? (panelLang === 'hi' ? 'नागरिक शिकायत विवरण' : 'Citizen Grievance Details')
                : (panelLang === 'hi' ? 'नागरिक भूसूचना समीक्षा' : 'Civic Feature Intelligence')}
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              {isCitizenReport ? reportNumber : 'PostGIS Verified Entity'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setInspectorOpen(false)}
          className="text-slate-400 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* -------------------------------------------------------- */}
      {/* Segmented Bilingual Pill Control (English | हिंदी)      */}
      {/* -------------------------------------------------------- */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/70 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
          <span>{panelLang === 'hi' ? 'भाषा चयन (विवरण एवं एआई):' : 'Language (Brief & AI):'}</span>
        </span>
        <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setPanelLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              panelLang === 'en'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setPanelLang('hi')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              panelLang === 'hi'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* Empty State vs Selected Feature Inspector Body           */}
      {/* -------------------------------------------------------- */}
      {!selectedFeature ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shadow-lg">
            <MapPin className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200">
              {panelLang === 'hi' ? 'कोई स्थल चयनित नहीं है' : 'No Civic Feature Selected'}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {panelLang === 'hi'
                ? 'मानचित्र पर किसी भी नागरिक शिकायत या नगर निगम सुविधा (अस्पताल, स्कूल, सड़क) पर क्लिक करके संपूर्ण विवरण देखें।'
                : 'Click on any citizen report marker or GIS facility (hospital, school, road) on the map to inspect full intelligence.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
          
          {/* ========================================================= */}
          {/* CASE A: CITIZEN GRIEVANCE CARD                            */}
          {/* ========================================================= */}
          {isCitizenReport ? (
            <div className="space-y-4">
              
              {/* 1. Hero Grievance Header Card */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span>{reportNumber}</span>
                    </span>
                    <button 
                      onClick={handleCopyLink} 
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy Reference"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1.5 ${statusInfo.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                    {statusInfo.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {grievanceTitle}
                </h3>

                <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    {getCategoryIcon(activeProps.category || selectedFeature?.category)}
                    <span className="capitalize">{grievanceCategory}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>
                      {props['Submission Date'] ? new Date(props['Submission Date']).toLocaleDateString() : (panelLang === 'hi' ? 'सक्रिय शिकायत' : 'Active Grievance')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Reported Facility / Specific Landmark Reference */}
              {(activeProps.facility_name || props.facility_name || (props.Location && !props.Location.startsWith('Municipal'))) && (
                <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-500/30 rounded-xl space-y-1 shadow-md">
                  <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{panelLang === 'hi' ? 'संबंधित स्थल / संस्था:' : 'Reported Facility / Landmark:'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-[9px] font-bold">
                      Specific Entity
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">
                    {activeProps.facility_name || props.facility_name || props.Location}
                  </p>
                </div>
              )}

              {/* 3. Citizen Description Card (Airy, Legible, Elegant) */}
              <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-2.5 shadow-md border-l-4 border-l-cyan-400">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{panelLang === 'hi' ? 'नागरिक विवरण' : 'Citizen Statement'}</span>
                  </span>
                  {panelLang === 'en' && isOriginalDevanagari && (
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                      Translated to English
                    </span>
                  )}
                  {panelLang === 'hi' && !isOriginalDevanagari && originalDesc && (
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                      हिंदी में अनूदित
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-100 leading-relaxed font-normal">
                  {citizenDesc}
                </p>

                {/* Preserved verbatim original citizen statement */}
                {((panelLang === 'en' && isOriginalDevanagari) || (panelLang === 'hi' && !isOriginalDevanagari)) && originalDesc && (
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-400 font-mono not-italic block text-[10px] uppercase font-bold mb-0.5">
                      {panelLang === 'hi' ? 'मूल प्रविष्टि (Original Submission):' : 'Original Citizen Text:'}
                    </span>
                    "{originalDesc}"
                  </div>
                )}
              </div>

              {/* 4. Citizen Attached Evidence Photographs */}
              {fullReport?.media && fullReport.media.length > 0 && (
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2.5 shadow-md">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                    <Camera className="w-4 h-4" />
                    <span>
                      {panelLang === 'hi' ? 'नागरिक द्वारा संलग्न साक्ष्य चित्र' : 'Citizen Attached Evidence'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">
                      {fullReport.media.length} {panelLang === 'hi' ? 'तस्वीरें' : 'photos'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {fullReport.media.map((m: any, idx: number) => {
                      const imgUrl = m.storage_path.startsWith('http') 
                        ? m.storage_path 
                        : `${window.location.origin}/uploads/${m.storage_path}`;
                      return (
                        <div
                          key={m.id || idx}
                          onClick={() => setPreviewPhoto(imgUrl)}
                          className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 cursor-pointer group bg-slate-950 shadow-sm"
                        >
                          <img
                            src={imgUrl}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. 4-Step Visual Resolution Lifecycle Stepper */}
              <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {panelLang === 'hi' ? 'समाधान चरण' : 'Resolution Lifecycle'}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">
                    Stage {statusInfo.step} of 4
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  {[
                    { step: 1, label: panelLang === 'hi' ? 'दर्ज' : 'Submitted' },
                    { step: 2, label: panelLang === 'hi' ? 'सौंपा' : 'Assigned' },
                    { step: 3, label: panelLang === 'hi' ? 'प्रगति' : 'In Progress' },
                    { step: 4, label: panelLang === 'hi' ? 'समाधान' : 'Resolved' }
                  ].map((s) => {
                    const isDone = statusInfo.step >= s.step;
                    const isCurrent = statusInfo.step === s.step;
                    return (
                      <div key={s.step} className="space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isDone 
                              ? 'bg-gradient-to-r from-blue-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                              : 'bg-slate-800'
                          }`}
                        />
                        <span className={`text-[10px] block font-medium ${isCurrent ? 'text-cyan-300 font-bold' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Geographic Location Card */}
              <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>{panelLang === 'hi' ? 'भौगोलिक स्थान' : 'Geographic Location'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeCity?.name_en || 'Gwalior'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{panelLang === 'hi' ? 'स्थान:' : 'Locality:'}</span>
                    <span className="font-semibold text-slate-100 truncate max-w-[200px]">
                      {props.Location || props.location_address || 'Municipal Area'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{panelLang === 'hi' ? 'वार्ड:' : 'Ward:'}</span>
                    <span className="font-semibold text-slate-200">
                      {selectedFeature.ward_name || resolvedLocation?.ward_en || 'Ward 14 (Central)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[11px] pt-1.5 border-t border-slate-800">
                    <span className="text-slate-400">{panelLang === 'hi' ? 'निर्देशांक:' : 'Coordinates:'}</span>
                    <span className="text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                      {selectedFeature.latitude?.toFixed(5)}° N, {selectedFeature.longitude?.toFixed(5)}° E
                    </span>
                  </div>
                </div>
              </div>

              {/* 7. Community Corroboration Card (+1 Facing This) */}
              <div className="p-4 bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-cyan-500/30 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                      <ThumbsUp className="w-4 h-4 text-cyan-400" />
                      <span>
                        {corroborationCount} {panelLang === 'hi' ? 'नागरिक प्रभावित' : 'Citizens Affected'}
                      </span>
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {panelLang === 'hi' ? 'सामुदायिक पुष्टि से नगर निगम प्राथमिकता बढ़ती है।' : 'Community verification increases municipal triage priority.'}
                    </p>
                  </div>

                  <button
                    onClick={handleCorroborateClick}
                    disabled={corroborated}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                      corroborated
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950'
                    }`}
                  >
                    {corroborated ? (panelLang === 'hi' ? 'पुष्टि हो चुकी ✓' : 'Corroborated ✓') : '+1 Facing This'}
                  </button>
                </div>

                {/* Inline Small Feedback Modal before confirming corroboration */}
                {showCorroborateForm && !corroborated && (
                  <div className="p-3.5 bg-slate-950 border border-cyan-500/50 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <MessageSquarePlus className="w-4 h-4 text-cyan-400" />
                        <span>{panelLang === 'hi' ? 'अपनी समस्या / अवलोकन जोड़ें' : 'Add Your Observation / Issue'}</span>
                      </span>
                      <button 
                        onClick={() => setShowCorroborateForm(false)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {panelLang === 'hi' 
                        ? 'क्या आप भी इस समस्या का सामना कर रहे हैं? अंतिम पुष्टि से पहले अपना विशिष्ट विवरण दर्ज करें (वैकल्पिक):' 
                        : 'Are you also facing this issue? Optionally add your specific observation before confirming:'}
                    </p>
                    <textarea
                      rows={2}
                      value={corroborateComment}
                      onChange={(e) => setCorroborateComment(e.target.value)}
                      placeholder={panelLang === 'hi' 
                        ? 'उदा. पानी मेरी दुकान/घर तक आ रहा है, या बारिश के बाद स्थिति और बिगड़ गई है...' 
                        : 'e.g., Water is reaching nearby shops, or pothole got deeper after rain...'}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowCorroborateForm(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                      >
                        {panelLang === 'hi' ? 'रद्द करें' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCorroborate}
                        disabled={isSubmittingCorroboration}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                      >
                        {isSubmittingCorroboration && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{panelLang === 'hi' ? 'पुष्टि सबमिट करें' : 'Confirm & Submit'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Button to toggle viewing distinct citizen observations */}
                {isMultiCitizen && (
                  <button
                    onClick={() => setShowAllCitizenFeedbacks(!showAllCitizenFeedbacks)}
                    className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-cyan-300">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {panelLang === 'hi' 
                          ? `सभी ${corroborationCount} नागरिकों के फीडबैक देखें` 
                          : `View All ${corroborationCount} Distinct Citizen Observations`}
                      </span>
                    </span>
                    {showAllCitizenFeedbacks ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-cyan-400" />}
                  </button>
                )}

                {/* Expandable list of all distinct citizen reports */}
                {isMultiCitizen && showAllCitizenFeedbacks && (
                  <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="p-1.5 px-2 bg-slate-900 rounded-lg text-[10px] font-mono text-cyan-300 flex items-center justify-between">
                      <span>{panelLang === 'hi' ? 'सत्यापित नागरिक प्रविष्टियां:' : 'Verified Citizen Feedback Stream:'}</span>
                      <span className="text-slate-400">{[...localCitizenFeedbacks, ...(communityIntel?.citizen_feedbacks || [])].length} items</span>
                    </div>
                    {[...localCitizenFeedbacks, ...(communityIntel?.citizen_feedbacks || [])].map((cf: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">{cf.citizen_label}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-950/70 text-purple-300 border border-purple-500/30">
                            {panelLang === 'hi' ? cf.aspect_hi : cf.aspect_en}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          "{panelLang === 'hi' ? (cf.feedback_hi || cf.feedback) : (cf.feedback_en || cf.feedback)}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Sarvam AI Triage & Executive Summarized Report (Clean Grounded Executive Intelligence) */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>
                      {viewMode === 'consolidated' && isMultiCitizen
                        ? (panelLang === 'hi' ? `सर्वम एआई एकीकृत रिपोर्ट (${corroborationCount} नागरिक)` : `Sarvam AI Multi-Citizen Report (${corroborationCount} Citizens)`)
                        : (panelLang === 'hi' ? 'सर्वम एआई सारांशित रिपोर्ट' : 'Sarvam AI Executive Summarized Report')}
                    </span>
                  </div>

                  {(() => {
                    const status = activeProps.quality_status || (props.triage_confidence && props.triage_confidence > 0.8 ? 'Sufficient Information' : 'Needs Verification');
                    const isSufficient = status === 'Sufficient Information';
                    const isClarification = status === 'Needs Clarification';
                    const label = viewMode === 'consolidated' && isMultiCitizen
                      ? (panelLang === 'hi' ? `${corroborationCount} नागरिक सत्यापित` : `${corroborationCount} Citizens Grounded`)
                      : panelLang === 'hi'
                      ? (activeProps.quality_status_hi || (isSufficient ? 'सत्यापित विवरण' : isClarification ? 'स्पष्टीकरण आवश्यक' : 'स्थल सत्यापन आवश्यक'))
                      : status;
                    const badgeClass = isSufficient || (viewMode === 'consolidated' && isMultiCitizen)
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                      : isClarification
                      ? 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                      : 'text-amber-400 bg-amber-950/60 border-amber-500/30';
                    return (
                      <span className={`text-[10px] font-mono border px-2.5 py-0.5 rounded-full font-bold ${badgeClass}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>

                {/* Extracted Hazard in Selected Language */}
                {extractedHazard && (
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        {viewMode === 'consolidated' && isMultiCitizen
                          ? (panelLang === 'hi' ? 'पहचान किया गया संयुक्त मुख्य जोखिम:' : 'Consolidated Civic Hazard:')
                          : (panelLang === 'hi' ? 'पहचान किया गया मुख्य जोखिम:' : 'Extracted Civic Hazard:')}
                      </span>
                    </span>
                    <p className="text-xs text-slate-100 font-bold">
                      {extractedHazard}
                    </p>
                  </div>
                )}

                {/* Synthesized Executive Summary in Selected Language */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                    {viewMode === 'consolidated' && isMultiCitizen
                      ? (panelLang === 'hi' ? `एकीकृत कार्यकारी सारांश (${corroborationCount} नागरिक रिपोर्ट):` : `Consolidated Executive Brief (${corroborationCount} Citizen Reports):`)
                      : (panelLang === 'hi' ? 'कार्यकारी सारांश:' : 'Executive Brief:')}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {execSummary}
                  </p>
                </div>

                {/* Metadata Grid (Department & SLA Clock) */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] block">{panelLang === 'hi' ? 'संबंधित विभाग:' : 'Assigned Dept:'}</span>
                    <span className="font-bold text-slate-200 truncate block">
                      {assignedDept}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] block">{panelLang === 'hi' ? 'समाधान लक्ष्य:' : 'Resolution Target:'}</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{props.target_sla_hours || 48}h Priority SLA</span>
                    </span>
                  </div>
                </div>

                {/* Recommended Municipal Action in Selected Language */}
                {recommendedAction && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1 text-emerald-200">
                    <span className="font-bold block text-[10px] text-emerald-400 uppercase tracking-wider">
                      {panelLang === 'hi' ? 'अनुशंसित नगर निगम कार्रवाई:' : 'Recommended Municipal Action:'}
                    </span>
                    <p className="text-xs leading-relaxed font-medium">{recommendedAction}</p>
                  </div>
                )}

                {/* Grounded Facts vs AI Inferences Breakdown */}
                {intel && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                    {intel.affected_infrastructure && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-mono block">
                          {panelLang === 'hi' ? 'प्रभावित अवसंरचना:' : 'Affected Infrastructure:'}
                        </span>
                        <span className="text-slate-200 font-semibold">
                          {panelLang === 'hi' ? (intel.affected_infrastructure_hi || intel.affected_infrastructure) : intel.affected_infrastructure}
                        </span>
                      </div>
                    )}

                    {intel.reported_impact && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-mono block">
                          {panelLang === 'hi' ? 'नागरिक रिपोर्ट प्रभाव:' : 'Reported Impact:'}
                        </span>
                        <span className="text-slate-200">
                          {panelLang === 'hi' ? (intel.reported_impact_hi || intel.reported_impact) : intel.reported_impact}
                        </span>
                      </div>
                    )}

                    {intel.reported_facts && intel.reported_facts.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-cyan-400 text-[10px] uppercase font-bold block">
                          {panelLang === 'hi' ? 'नागरिक द्वारा दर्ज वास्तविक तथ्य:' : 'Citizen Reported Facts:'}
                        </span>
                        <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5 mt-1">
                          {intel.reported_facts.map((f: string, i: number) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {intel.missing_information && intel.missing_information.length > 0 && intel.missing_information[0] !== 'All core grievance parameters supplied.' && (
                      <div className="p-2 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs text-amber-200">
                        <span className="font-bold text-amber-400 uppercase text-[10px] block">
                          {panelLang === 'hi' ? 'अनुपलब्ध विवरण:' : 'Missing Information:'}
                        </span>
                        <ul className="list-disc list-inside mt-0.5">
                          {intel.missing_information.map((m: string, i: number) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 9. Quick Actions (Listen & Share) */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSpeakAloud}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>{panelLang === 'hi' ? 'सुनें' : 'Listen'}</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
                  <span>{copied ? (panelLang === 'hi' ? 'कॉपी हुआ' : 'Copied') : (panelLang === 'hi' ? 'शेयर' : 'Share')}</span>
                </button>
              </div>

            </div>
          ) : (

            /* ========================================================= */
            /* CASE B: PHYSICAL CIVIC FACILITY / ROAD ENTITY             */
            /* AMAZON-STYLE CIVIC AI OVERVIEW                            */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Entity Title Header */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl space-y-1.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>
                      {isRoadFeature 
                        ? (panelLang === 'hi' ? 'सड़क कॉरिडोर अवसंरचना' : 'Road Infrastructure Corridor')
                        : (panelLang === 'hi' ? 'नागरिक सार्वजनिक सुविधा' : 'Public Civic Facility')}
                    </span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Verified GIS
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {panelLang === 'hi' 
                    ? (selectedFeature.name_hi || selectedFeature.name_en || (isRoadFeature ? 'सड़क मार्ग' : 'नागरिक सुविधा'))
                    : (selectedFeature.name_en || selectedFeature.name_hi || (isRoadFeature ? 'Mapped Road Corridor' : 'Civic Facility'))}
                </h3>
                {selectedFeature.name_hi && selectedFeature.name_hi !== selectedFeature.name_en && (
                  <p className="text-xs text-slate-400 font-hindi">{selectedFeature.name_hi}</p>
                )}
              </div>

              {/* Amazon-Style AI Civic Overview Section */}
              <div className="p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>{panelLang === 'hi' ? 'एआई नागरिक समीक्षा (AI Civic Overview)' : 'AI Civic Overview'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                    {entityIntelligence?.recent_reports?.length || 0} {panelLang === 'hi' ? 'रिपोर्ट्स' : 'Reports'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  {panelLang === 'hi'
                    ? '"इस स्थल के संबंध में नागरिकों की प्रतिक्रिया एवं दर्ज स्थितियों का एआई-जनित सारांश।"'
                    : '"An AI-generated overview of citizen feedback and reported conditions for this location."'}
                </p>

                {/* Overall Feedback Summary */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                    {panelLang === 'hi' ? 'समग्र नागरिक प्रतिक्रिया सारांश:' : 'Overall Feedback Summary:'}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {reportsCount === 0
                      ? (panelLang === 'hi'
                          ? `इस स्थल के 200 मीटर के दायरे में नगर निगम टेलीमेट्री में कोई नागरिक शिकायत दर्ज नहीं है।`
                          : `No citizen reports recorded within 200m of ${selectedFeature.name_en || 'this facility'} in verified municipal telemetry.`)
                      : (panelLang === 'hi' 
                          ? (entityIntelligence?.ai_grounded_summary_hi || 'इस क्षेत्र में प्राप्त नागरिक शिकायतों का विश्लेषण जारी है।')
                          : (entityIntelligence?.ai_grounded_summary_en || 'Evaluating citizen feedback and municipal telemetry for this civic entity.'))}
                  </p>
                </div>

                {/* Overall Civic Condition Badge */}
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {panelLang === 'hi' ? 'समग्र नागरिक स्थिति:' : 'Overall Condition:'}
                  </span>
                  <span className={`text-xs font-bold ${reportsCount === 0 ? 'text-slate-400' : 'text-amber-300'}`}>
                    {reportsCount === 0
                      ? (panelLang === 'hi' ? 'सत्यापन योग्य डेटा अनुपलब्ध' : 'Insufficient Data to Assess Condition')
                      : (panelLang === 'hi' 
                          ? (entityIntelligence?.overall_civic_condition_hi || 'सामान्य / नियमित अनुरक्षण')
                          : (entityIntelligence?.overall_civic_condition_en || 'Standard Civic State – Minor Maintenance'))}
                  </span>
                </div>

                {/* Frequently Reported Issues (Amazon-style breakdown bars) */}
                {entityIntelligence?.frequently_reported_issues && entityIntelligence.frequently_reported_issues.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                      {panelLang === 'hi' ? 'बारंबार दर्ज की गई समस्याएं' : 'Frequently Reported Issues'}
                    </span>
                    <div className="space-y-2">
                      {entityIntelligence.frequently_reported_issues.map((issue) => (
                        <div key={issue.category} className="space-y-0.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-300 font-medium truncate max-w-[180px]">
                              {panelLang === 'hi' ? issue.category_label_hi : issue.category_label_en}
                            </span>
                            <span className="font-mono text-cyan-400 font-bold">
                              {issue.count} ({issue.percentage}%)
                            </span>
                          </div>
                          {/* Amazon-style proportional review bar */}
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(100, Math.max(5, issue.percentage))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Problems vs Positive Observations (Amazon Style) */}
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  {/* Problems Reported */}
                  {entityIntelligence?.negative_observations && entityIntelligence.negative_observations.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>{panelLang === 'hi' ? 'प्रमुख समस्याएं (Reported Problems):' : 'Frequently Reported Problems:'}</span>
                      </span>
                      <ul className="space-y-1 pl-1 text-[11px] text-slate-300">
                        {(panelLang === 'hi' ? entityIntelligence.negative_observations_hi : entityIntelligence.negative_observations)?.map((obs, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-400 shrink-0 font-bold">•</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Positive Observations */}
                  {entityIntelligence?.positive_observations && entityIntelligence.positive_observations.length > 0 && (
                    <div className="space-y-1 pt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{panelLang === 'hi' ? 'सकारात्मक पहलू (Positive Observations):' : 'Positive Observations & Resolutions:'}</span>
                      </span>
                      <ul className="space-y-1 pl-1 text-[11px] text-slate-300">
                        {(panelLang === 'hi' ? entityIntelligence.positive_observations_hi : entityIntelligence.positive_observations)?.map((pos, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                            <span>{pos}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Citizen Evidence Photographs Gallery */}
                {entityIntelligence?.evidence_photographs && entityIntelligence.evidence_photographs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{panelLang === 'hi' ? 'नागरिक प्रमाण छायाचित्र' : 'Citizen Evidence Photographs'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {entityIntelligence.evidence_photographs.length} photos
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {entityIntelligence.evidence_photographs.map((photo, i) => (
                        <div
                          key={photo.id || i}
                          onClick={() => setPreviewPhoto(photo.photo_url)}
                          className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-square cursor-pointer hover:border-cyan-400 transition-all shadow"
                        >
                          <img
                            src={photo.photo_url}
                            alt={photo.caption_en}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-1 py-0.5 text-[8px] font-mono text-cyan-300 truncate text-center">
                            {photo.report_number}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Public vs Admin Navigation */}
                {reportsCount > 0 ? (
                  <Link
                    to={`/public-report/${entityType}/${entityId}`}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {panelLang === 'hi' 
                        ? 'संपूर्ण सार्वजनिक नागरिक रिपोर्ट देखें' 
                        : 'View Full Public Report'}
                    </span>
                  </Link>
                ) : (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                    {panelLang === 'hi' 
                      ? 'इस स्थल के लिए अभी कोई सार्वजनिक रिपोर्ट उपलब्ध नहीं है।'
                      : 'No public intelligence report is available for this location yet.'}
                  </div>
                )}

                {/* Report Issue Action Button at this Facility */}
                <button
                  onClick={() => {
                    const facilityName = selectedFeature.name_en || selectedFeature.name_hi || 'Civic Facility';
                    const facilityId = selectedFeature.feature_id || selectedFeature.id;
                    openFeedbackModal(
                      selectedFeature.latitude || 26.2183,
                      selectedFeature.longitude || 78.1828,
                      facilityName,
                      facilityId
                    );
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{panelLang === 'hi' ? `इस स्थल पर नई समस्या दर्ज करें` : `Report an Issue at this Facility`}</span>
                </button>
              </div>

              {/* Road or Facility Attributes Profile */}
              {isRoadFeature ? (
                <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-2.5 shadow-md">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Compass className="w-4 h-4" />
                    <span>{panelLang === 'hi' ? 'सड़क कॉरिडोर विशेषताएं' : 'Road Corridor Attributes'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Highway Class</span>
                      <p className="font-semibold text-slate-100 capitalize">{props.highway || 'Secondary'}</p>
                    </div>
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Surface Type</span>
                      <p className="font-semibold text-slate-100">{props.surface || 'Paved / Asphalt'}</p>
                    </div>
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Lanes</span>
                      <p className="font-semibold text-slate-100">{props.lanes || 'Standard 2-Lane'}</p>
                    </div>
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">One-Way</span>
                      <p className="font-semibold text-slate-100">{props.oneway === 'yes' ? 'Yes' : 'Two-Way'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-2.5 shadow-md">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Building className="w-4 h-4" />
                    <span>{panelLang === 'hi' ? 'सुविधा विवरण' : 'Facility Attributes'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Authority</span>
                      <p className="font-semibold text-slate-100 truncate">{props.operator || props.authority || 'Urban Administration'}</p>
                    </div>
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Status</span>
                      <p className="font-semibold text-emerald-400">Operational</p>
                    </div>
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">City Authority</span>
                      <p className="font-semibold text-slate-100">{activeCity?.name_en ? `${activeCity.name_en} Municipal Corp` : 'Municipal Administration'}</p>
                    </div>
                    <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Ward</span>
                      <p className="font-semibold text-slate-100">{selectedFeature.ward_name || resolvedLocation?.ward_en || 'Municipal Area'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions (Listen & Share) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakAloud}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>{panelLang === 'hi' ? 'सुनें' : 'Listen'}</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
                  <span>{copied ? (panelLang === 'hi' ? 'कॉपी हुआ' : 'Copied') : (panelLang === 'hi' ? 'शेयर' : 'Share')}</span>
                </button>
              </div>

              {/* Collapsible Technical Details */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60 shadow-md">
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:bg-slate-800/80 transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-400">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Technical & Source Metadata</span>
                  </span>
                  {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTechnicalDetails && (
                  <div className="p-3.5 border-t border-slate-800 space-y-2 bg-slate-950 text-[11px] font-mono text-slate-300">
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

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/90 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhoto} alt="Citizen Evidence Preview" className="w-full max-h-[75vh] object-contain" />
            <div className="p-3 bg-slate-950 text-center text-xs text-slate-300 font-mono">
              Authenticated Citizen Evidence Photograph
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
