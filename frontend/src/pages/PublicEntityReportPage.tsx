import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, 
  MapPin, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Camera, 
  ArrowLeft,
  Loader2,
  TrendingUp,
  ShieldCheck,
  ThumbsUp,
  X
} from 'lucide-react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { intelligenceApi } from '../api/intelligence';
import { useCities } from '../api/hooks';
import { EntityIntelligence } from '../types';

export const PublicEntityReportPage: React.FC = () => {
  const { entityType = 'facility', entityId = 'current' } = useParams<{ entityType: string; entityId: string }>();
  const navigate = useNavigate();
  const { data: cities = [] } = useCities();

  const [panelLang, setPanelLang] = useState<'en' | 'hi'>('en');
  const [data, setData] = useState<EntityIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    intelligenceApi
      .getEntityIntelligence(entityType, entityId)
      .then((res) => setData(res))
      .catch((err) => {
        console.warn('Failed to load public entity intelligence', err);
        setData(null);
      })
      .finally(() => setIsLoading(false));
  }, [entityType, entityId]);

  const reportCount = data?.recent_reports?.length || 0;
  const entityTitle = panelLang === 'hi' 
    ? (data?.title_hi || data?.title_en || 'नागरिक अवसंरचना')
    : (data?.title_en || data?.title_hi || 'Civic Infrastructure');

  return (
    <div className="min-h-screen w-full bg-[#0B132B] text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      <PublicHeader cities={cities} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6 pb-24">
        {/* Navigation back and language switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E3D60] pb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{panelLang === 'hi' ? 'मानचित्र पर वापस जाएं' : 'Back to Civic Map'}</span>
          </button>

          {/* Bilingual selector */}
          <div className="flex items-center gap-2 p-1 bg-[#111827] rounded-xl border border-[#2E3D60]">
            <button
              onClick={() => setPanelLang('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                panelLang === 'en'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPanelLang('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                panelLang === 'hi'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3 text-cyan-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-semibold">
              {panelLang === 'hi' ? 'नागरिक बुद्धिमत्ता रिपोर्ट लोड हो रही है...' : 'Loading public civic intelligence report...'}
            </span>
          </div>
        ) : !data || reportCount === 0 ? (
          /* Clear Empty State (No public report exists) */
          <div className="p-12 bg-[#111827] border border-[#2E3D60] rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">
                {panelLang === 'hi' 
                  ? 'इस स्थान के लिए अभी कोई सार्वजनिक रिपोर्ट उपलब्ध नहीं है।'
                  : 'No public intelligence report is available for this location yet.'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {panelLang === 'hi'
                  ? 'वर्तमान अवलोकन अवधि में 200 मीटर के दायरे में कोई सत्यापित नागरिक शिकायत दर्ज नहीं है।'
                  : 'No citizen reports recorded within 200m buffer in verified municipal telemetry during current observation window.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                {panelLang === 'hi' ? 'मानचित्र पर अन्य स्थल देखें' : 'Explore Other Locations on Map'}
              </button>
            </div>
          </div>
        ) : (
          /* Render Full Public Report */
          <div className="space-y-6">
            {/* Entity Header Banner */}
            <div className="p-6 bg-gradient-to-br from-[#111827] via-[#17223D] to-[#111827] border border-cyan-500/40 rounded-2xl space-y-3 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                  {entityType} • Public Civic Intelligence
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  {reportCount} {panelLang === 'hi' ? 'सत्यापित नागरिक रिपोर्ट' : 'Verified Citizen Reports'}
                </span>
              </div>

              <h1 className="text-2xl font-black text-white">{entityTitle}</h1>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Madhya Pradesh Municipal Telemetry • 200m Spatial Buffer</span>
              </div>
            </div>

            {/* AI Civic Feedback Overview */}
            <div className="p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>
                  {panelLang === 'hi' ? 'एआई समग्र नागरिक प्रतिक्रिया सारांश' : 'AI Civic Feedback Overview'}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-[#0B132B] p-4 rounded-xl border border-[#2E3D60]">
                {panelLang === 'hi' ? data.ai_grounded_summary_hi : data.ai_grounded_summary_en}
              </p>
            </div>

            {/* Frequently Reported Issues Breakdown */}
            {data.frequently_reported_issues && data.frequently_reported_issues.length > 0 && (
              <div className="p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {panelLang === 'hi' ? 'बारंबार दर्ज की गई समस्याएं' : 'Frequently Reported Issues'}
                </h2>
                <div className="space-y-3">
                  {data.frequently_reported_issues.map((iss) => (
                    <div key={iss.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-200 font-semibold">
                          {panelLang === 'hi' ? iss.category_label_hi : iss.category_label_en}
                        </span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {iss.count} {panelLang === 'hi' ? 'रिपोर्ट' : 'reports'} ({iss.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#1C2541] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${iss.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observations (Positive & Negative Feedback) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Frequently Reported Problems */}
              <div className="p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{panelLang === 'hi' ? 'नागरिकों द्वारा दर्ज समस्याएं' : 'What Citizens Report'}</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {((panelLang === 'hi' ? data.negative_observations_hi : data.negative_observations) || []).map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 bg-[#1C2541]/50 p-2.5 rounded-lg border border-[#2E3D60]/50">
                      <span className="text-rose-400 shrink-0 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Positive Observations & Resolutions */}
              <div className="p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span>{panelLang === 'hi' ? 'सकारात्मक टिप्पणियां एवं समाधान' : 'Positive Feedback & Resolutions'}</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {((panelLang === 'hi' ? data.positive_observations_hi : data.positive_observations) || []).map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 bg-[#1C2541]/50 p-2.5 rounded-lg border border-[#2E3D60]/50">
                      <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Representative Citizen Photographs */}
            {data.evidence_photographs && data.evidence_photographs.length > 0 && (
              <div className="p-6 bg-[#111827] border border-[#2E3D60] rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>{panelLang === 'hi' ? 'नागरिकों द्वारा संलग्न साक्ष्य चित्र' : 'Citizen Uploaded Evidence Photographs'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.evidence_photographs.map((photo) => {
                    const imgUrl = photo.photo_url.startsWith('http')
                      ? photo.photo_url
                      : `${window.location.origin}/uploads/${photo.photo_url}`;
                    return (
                      <div
                        key={photo.id}
                        onClick={() => setPreviewPhoto(imgUrl)}
                        className="relative aspect-video rounded-xl overflow-hidden border border-[#2E3D60] hover:border-cyan-400 cursor-pointer group bg-slate-900 shadow-md"
                      >
                        <img
                          src={imgUrl}
                          alt={photo.caption_en}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 left-2 bg-[#0B132B]/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 font-bold border border-[#2E3D60]">
                          {photo.report_number}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-cyan-500/50 shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhoto} alt="Evidence Full" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

