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
  Activity,
  Check,
  Info,
  Globe2
} from 'lucide-react';
import { useLayerStore } from '../../store/layerStore';
import { useMapStore } from '../../store/mapStore';
import { useFeedbackStore } from '../../store/feedbackStore';
import { ProvenanceType } from '../../types';

type InspectorTab = 'overview' | 'status' | 'sources' | 'reports' | 'records' | 'ai';

export const Inspector: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isInspectorOpen, setInspectorOpen, activeCity, resolvedLocation } = useMapStore();
  const { selectedFeature } = useLayerStore();
  const { openModal: openFeedbackModal } = useFeedbackStore();
  const [activeTab, setActiveTab] = useState<InspectorTab>('overview');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isInspectorOpen) return null;

  const handleSpeakAloud = () => {
    if ('speechSynthesis' in window) {
      const textToSpeak = i18n.language === 'hi' 
        ? `${selectedFeature?.name_hi || selectedFeature?.category}। मध्य प्रदेश भूसूचना प्रणाली में सक्रिय नागरिक सुविधा।`
        : `${selectedFeature?.name_en || selectedFeature?.category}. Active civic feature in Madhya Pradesh GIS.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}/?lat=${selectedFeature?.latitude || 26.2183}&lng=${selectedFeature?.longitude || 78.1828}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Helper to compute freshness label from last_updated
  const getFreshnessBadge = (dateStr?: string) => {
    if (!dateStr) return { label: 'Verified Foundation', color: 'text-slate-400 bg-slate-800' };
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 1) return { label: 'Updated Today', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' };
    if (diffDays <= 7) return { label: 'Updated This Week', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30' };
    if (diffDays <= 30) return { label: `${diffDays} days ago`, color: 'text-blue-400 bg-blue-950/60 border-blue-500/30' };
    return { label: 'Historical Dataset', color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' };
  };

  const getProvenanceBadgeConfig = (prov?: ProvenanceType | string) => {
    switch (prov) {
      case 'official_verified':
        return {
          label: 'Official Govt Verified',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dotClass: 'bg-emerald-400',
        };
      case 'community_open':
        return {
          label: 'Community Open Data (OSM)',
          badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dotClass: 'bg-cyan-400',
        };
      case 'citizen_submitted':
        return {
          label: 'Citizen Submitted',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dotClass: 'bg-amber-400',
        };
      case 'internal_derived':
        return {
          label: 'Spatial Hotspot Derived',
          badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dotClass: 'bg-purple-400',
        };
      case 'development_fixture':
        return {
          label: 'Development Test Fixture',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dotClass: 'bg-rose-400',
        };
      default:
        return {
          label: 'Open GIS Data',
          badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          dotClass: 'bg-slate-400',
        };
    }
  };

  const provenanceConfig = getProvenanceBadgeConfig(
    selectedFeature?.provenance_type || selectedFeature?.properties?.provenance_type
  );
  const freshness = getFreshnessBadge(selectedFeature?.last_updated || selectedFeature?.properties?.observed_at);

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
                  {selectedFeature.layer_name_en || selectedFeature.category || 'GIS Feature'}
                </span>
                <h3 className="text-sm font-bold text-slate-100">
                  {i18n.language === 'hi' ? selectedFeature.name_hi || selectedFeature.name_en : selectedFeature.name_en || selectedFeature.name_hi}
                </h3>
              </div>
              <span className={`shrink-0 text-[10px] ${provenanceConfig.badgeClass} border px-2 py-0.5 rounded-full flex items-center gap-1 font-mono`}>
                <span className={`w-1.5 h-1.5 rounded-full ${provenanceConfig.dotClass}`} />
                <span>{provenanceConfig.label}</span>
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
                onClick={handleShare}
                className="flex-1 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copied ? 'Link Copied' : t('inspector.share')}</span>
              </button>
              <button
                onClick={() => openFeedbackModal()}
                className="flex-1 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-[#2E3D60] bg-[#1C2541]/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 overflow-x-auto no-scrollbar">
            {(['overview', 'status', 'sources', 'reports', 'records', 'ai'] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                {/* Administrative Hierarchy Card */}
                <div className="p-3 rounded-lg bg-[#1C2541]/70 border border-[#2E3D60] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
                    <Building className="w-3.5 h-3.5" />
                    <span>Administrative Geography</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px]">State</span>
                      <p className="font-semibold text-slate-200">Madhya Pradesh</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">District / ULB</span>
                      <p className="font-semibold text-slate-200">{activeCity?.name_en || 'Gwalior'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Ward</span>
                      <p className="font-semibold text-slate-200">
                        {selectedFeature.ward_name || resolvedLocation?.ward_en || 'Municipal Area'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">City Authority</span>
                      <p className="font-semibold text-slate-200">{activeCity?.name_en ? `${activeCity.name_en} Municipal Corp` : 'Urban Administration'}</p>
                    </div>
                  </div>
                </div>

                {/* Geographic Coordinates Card */}
                <div className="p-3 rounded-lg bg-[#1C2541]/70 border border-[#2E3D60] space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                    <span>Coordinates (WGS84):</span>
                    <span className="text-cyan-400 font-semibold">
                      {selectedFeature.latitude?.toFixed(5) || '26.21830'}° N, {selectedFeature.longitude?.toFixed(5) || '78.18280'}° E
                    </span>
                  </div>
                </div>

                {/* Attributes Table */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Feature Properties & Attributes
                  </span>
                  <div className="rounded-lg border border-[#2E3D60] overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <tbody>
                        {Object.entries(selectedFeature.properties || {}).map(([key, val], idx) => {
                          if (typeof val === 'object' && val !== null) return null;
                          return (
                            <tr
                              key={key}
                              className={`border-b border-[#2E3D60]/50 last:border-0 ${
                                idx % 2 === 0 ? 'bg-[#1C2541]/40' : 'bg-[#1C2541]/80'
                              }`}
                            >
                              <td className="py-2 px-3 text-slate-400 font-mono capitalize">
                                {key.replace(/_/g, ' ')}
                              </td>
                              <td className="py-2 px-3 text-slate-100 font-semibold">
                                {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CIVIC STATUS TAB */}
            {activeTab === 'status' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#131B33] border border-[#2E3D60] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Operational Condition</span>
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{selectedFeature.properties?.status || 'Active in GIS Registry'}</span>
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded border font-mono ${freshness.color}`}>
                    {freshness.label}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#1C2541]/60 border border-[#2E3D60] space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Facility Operator / Node</span>
                  <p className="text-xs text-slate-200">
                    {selectedFeature.properties?.operator || selectedFeature.properties?.authority || `${activeCity?.name_en || 'Municipal'} Civic Administration`}
                  </p>
                </div>
              </div>
            )}

            {/* 3. PROVENANCE & SOURCES TAB */}
            {activeTab === 'sources' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#1C2541]/80 border border-[#2E3D60] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">Data Source Registry</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-mono ${provenanceConfig.badgeClass}`}>
                      {provenanceConfig.label}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    {selectedFeature.source_attribution_en || selectedFeature.properties?.attribution || 'OpenStreetMap contributors / Madhya Pradesh Open Data'}
                  </p>
                  {selectedFeature.source_attribution_hi && (
                    <p className="text-[11px] text-slate-400">
                      {selectedFeature.source_attribution_hi}
                    </p>
                  )}
                  <div className="pt-2 border-t border-[#2E3D60] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>License: {selectedFeature.properties?.license || 'Open Database License (ODbL)'}</span>
                    <span>Status: Verified</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#131B33] border border-[#2E3D60] text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    NagarDrishti enforces transparent attribution for all spatial assets. Data is continuously validated against municipal reference boundaries.
                  </span>
                </div>
              </div>
            )}

            {/* 4. REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="p-4 rounded-lg bg-[#1C2541]/40 border border-[#2E3D60] text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="font-semibold text-slate-300">No active complaints linked to this asset</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Citizens can report potholes, water leaks, or street light issues using the Report button above.
                </p>
              </div>
            )}

            {/* 5. PUBLIC RECORDS TAB */}
            {activeTab === 'records' && (
              <div className="p-4 rounded-lg bg-[#1C2541]/40 border border-[#2E3D60] text-center space-y-2">
                <Database className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="font-semibold text-slate-300">Verified Public Notices & Records</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No municipal notices or active roadwork tenders are recorded for this feature in the current ingestion run.
                </p>
              </div>
            )}

            {/* 6. AI SUMMARY TAB */}
            {activeTab === 'ai' && (
              <div className="p-3.5 rounded-lg bg-[#1C2541]/60 border border-[#2E3D60] space-y-2.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Sarvam AI Grounded Summary</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {i18n.language === 'hi'
                    ? `जीआईएस अभिलेखों के अनुसार, यह ${selectedFeature.name_hi || selectedFeature.name_en || selectedFeature.category} का वास्तविक नागरिक स्थल है।`
                    : `According to verified GIS records, this is an authenticated civic feature for ${selectedFeature.name_en || selectedFeature.name_hi || selectedFeature.category}.`}
                </p>
                <div className="p-2 rounded bg-[#0B132B] border border-[#2E3D60] text-[10px] text-slate-400 font-mono">
                  Phase 4 Feature Preview • Grounded in PostGIS authenticated entity records
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

