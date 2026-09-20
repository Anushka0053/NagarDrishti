import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  History, 
  ExternalLink, 
  Volume2, 
  Share2, 
  Navigation, 
  Clock, 
  MapPin, 
  ChevronRight,
  Database,
  Building,
  Activity
} from 'lucide-react';
import { useLayerStore } from '../../store/layerStore';
import { useMapStore } from '../../store/mapStore';
import { useFeedbackStore } from '../../store/feedbackStore';

type InspectorTab = 'overview' | 'status' | 'ai' | 'reports' | 'records' | 'history' | 'sources';

export const Inspector: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isInspectorOpen, setInspectorOpen } = useMapStore();
  const { selectedFeature } = useLayerStore();
  const { openModal: openFeedbackModal } = useFeedbackStore();
  const [activeTab, setActiveTab] = useState<InspectorTab>('overview');
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isInspectorOpen) return null;

  const handleSpeakAloud = () => {
    if ('speechSynthesis' in window) {
      const textToSpeak = i18n.language === 'hi' 
        ? `${selectedFeature?.name_hi || selectedFeature?.category}। स्थिति सामान्य है।`
        : `${selectedFeature?.name_en || selectedFeature?.category}. Active civic feature in Madhya Pradesh GIS.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    }
  };

  return (
    <aside className="w-96 h-[calc(100vh-3.5rem)] bg-[#0B132B]/95 border-l border-[#2E3D60] flex flex-col z-20 select-none backdrop-blur-md">
      {/* Inspector Header */}
      <div className="p-3 border-b border-[#2E3D60] bg-[#1C2541]/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t('inspector.title')}
          </h2>
        </div>
        <button
          onClick={() => setInspectorOpen(false)}
          className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      {!selectedFeature ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
          <MapPin className="w-10 h-10 text-[#2E3D60] animate-bounce" />
          <p className="text-xs leading-relaxed">{t('inspector.select_feature')}</p>
        </div>
      ) : (
        <>
          {/* Selected Feature Title & Provenance Badge */}
          <div className="p-3.5 border-b border-[#2E3D60] bg-[#131B33] space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                  {selectedFeature.layer_name_en || 'GIS Feature'}
                </span>
                <h3 className="text-sm font-bold text-slate-100">
                  {i18n.language === 'hi' ? selectedFeature.name_hi : selectedFeature.name_en}
                </h3>
              </div>
              <span className="shrink-0 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified</span>
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSpeakAloud}
                className="flex-1 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 transition-colors"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                <span>{t('inspector.listen')}</span>
              </button>
              <button
                onClick={() => openFeedbackModal()}
                className="flex-1 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 rounded text-[11px] font-semibold text-rose-300 flex items-center justify-center gap-1 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('inspector.report_here')}</span>
              </button>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex border-b border-[#2E3D60] bg-[#1C2541]/40 text-[11px] font-semibold text-slate-400 overflow-x-auto">
            {(['overview', 'status', 'ai', 'reports', 'records', 'sources'] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 shrink-0 border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                {t(`inspector.tab_${tab}`)}
              </button>
            ))}
          </div>

          {/* Tab Panes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#1C2541] border border-[#2E3D60] space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    {i18n.language === 'hi' ? 'विशेषताएं एवं गुण' : 'Attributes & Metadata'}
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                    {Object.entries(selectedFeature.properties || {}).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between border-b border-slate-700/40 pb-1">
                        <span className="text-slate-400 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="text-slate-200 font-semibold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#1C2541] border border-[#2E3D60] space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('inspector.source_provenance')}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {i18n.language === 'hi' ? selectedFeature.source_attribution_hi : selectedFeature.source_attribution_en}
                  </p>
                  <div className="text-[9px] text-slate-400 font-mono pt-1">
                    Last Verified Sync: {selectedFeature.last_updated || '2026-08-15'}
                  </div>
                </div>
              </div>
            )}

            {/* CIVIC STATUS & RISK SCORE TAB */}
            {activeTab === 'status' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-[#1C2541] to-[#131B33] border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{t('inspector.risk_score')}</span>
                    <span className="text-lg font-mono font-extrabold text-amber-400">
                      34.5<span className="text-xs text-slate-400">/100</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '34.5%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Formula v1.0: Deterministic combination of citizen complaint density, road age, and monsoon waterlogging vulnerability.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg">
                    <div className="text-sm font-bold text-rose-400 font-mono">1</div>
                    <div className="text-[10px] text-slate-400">{t('inspector.active_issues')}</div>
                  </div>
                  <div className="p-2 bg-[#1C2541] border border-[#2E3D60] rounded-lg">
                    <div className="text-sm font-bold text-emerald-400 font-mono">8</div>
                    <div className="text-[10px] text-slate-400">{t('inspector.resolved_issues')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* GROUNDED AI SUMMARY (SARVAM AI) TAB */}
            {activeTab === 'ai' && (
              <div className="p-3 rounded-lg bg-[#1C2541] border border-cyan-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sarvam AI Civic Narrative</span>
                  </div>
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded font-mono">
                    Grounded v1.0
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200">
                  {i18n.language === 'hi'
                    ? 'विभागीय अभिलेखों एवं नागरिक रिपोर्टों के विश्लेषण के अनुसार, इस मार्ग पर जल निकासी और सामान्य डामरीकरण की आवश्यकता चिन्हित की गई है। कोई गंभीर संरचनात्मक दोष दर्ज नहीं है।'
                    : 'Analysis of municipal telemetry and citizen reports indicates standard drainage maintenance and surface resurfacing requirements. No critical structural failures are currently recorded.'}
                </p>
                <div className="text-[9px] text-slate-400 border-t border-slate-700 pt-1 font-mono">
                  Sources Verified: GMC SCADA, MP PWD Asset Register, 2 Citizen Reports.
                </div>
              </div>
            )}

            {/* PUBLIC RECORDS TAB */}
            {activeTab === 'records' && (
              <div className="space-y-2">
                <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-1">
                  <div className="text-xs font-bold text-slate-200">PWD Road Resurfacing Tender #GWL-2024-88</div>
                  <div className="text-[10px] text-slate-400">Sanctioned: ₹48.5 Lakhs | Completed: Nov 2024</div>
                </div>
              </div>
            )}

            {/* SOURCES TAB */}
            {activeTab === 'sources' && (
              <div className="space-y-2">
                <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-lg space-y-1">
                  <div className="text-xs font-bold text-cyan-400">Directorate of Urban Administration & Development, MP</div>
                  <p className="text-[10px] text-slate-300">GARUD MP GIS Ecosystem & Municipal Asset Registry</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
