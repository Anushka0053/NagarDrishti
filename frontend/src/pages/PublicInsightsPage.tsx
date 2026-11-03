import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileText,
  MapPin,
  Building
} from 'lucide-react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { useCities, useCityAnalytics } from '../api/hooks';

export const PublicInsightsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { data: cities = [] } = useCities();
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  React.useEffect(() => {
    if (cities.length > 0 && !selectedCityId) {
      setSelectedCityId(cities[0].id);
    }
  }, [cities, selectedCityId]);

  const { data: analytics } = useCityAnalytics(selectedCityId);
  const activeCity = cities.find((c) => c.id === selectedCityId) || cities[0];

  const totalReports = analytics?.total_reports ?? 0;
  const openReports = analytics?.open_reports ?? 0;
  const resolvedReports = analytics?.resolved_reports ?? 0;
  const resolutionRate = analytics?.resolution_rate ?? 0;
  const mappedFeatures = analytics?.mapped_features_count ?? analytics?.verified_features_count ?? 0;

  return (
    <div className="min-h-screen w-full bg-[#0B132B] text-slate-100 flex flex-col font-sans select-none overflow-y-auto scrollbar-thin">
      <PublicHeader cities={cities} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              <span>Public Civic Intelligence Dashboard</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {i18n.language === 'hi' ? 'नागरिक आंकड़े एवं समाधान स्थिति' : 'Public Issue Insights & Resolution Metrics'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {i18n.language === 'hi' 
                ? 'मध्य प्रदेश के प्रमुख नगरों में नागरिक शिकायतों की समाधान दर और पारदर्शी प्रगति।'
                : 'Transparent, authenticated municipal response rates and spatial grievance distribution across Madhya Pradesh.'}
            </p>
          </div>

          {/* City Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#1C2541] rounded-xl border border-[#2E3D60]">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCityId(city.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCityId === city.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-[#253258]'
                }`}
              >
                {i18n.language === 'hi' ? city.name_hi : city.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Total Grievances</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white font-mono">{totalReports}</p>
            <p className="text-[10px] text-slate-400">Authenticated citizen submissions</p>
          </div>

          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Resolution Rate</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400 font-mono">
              {resolutionRate !== null ? `${resolutionRate}%` : 'N/A'}
            </p>
            <p className="text-[10px] text-slate-400">Verified resolved complaints</p>
          </div>

          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Under Action</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-300 font-mono">{openReports}</p>
            <p className="text-[10px] text-slate-400">Active municipal field tasks</p>
          </div>

          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Mapped Infrastructure</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-cyan-300 font-mono">{mappedFeatures.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Hospitals, schools, roads in GIS</p>
          </div>
        </div>

        {/* Category Breakdown & Provenance Commitment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="p-6 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Grievance Distribution by Category ({activeCity?.name_en})</span>
            </h2>

            {analytics?.category_breakdown && analytics.category_breakdown.length > 0 ? (
              <div className="space-y-3">
                {analytics.category_breakdown.map((cat) => {
                  const pct = totalReports > 0 ? Math.round((cat.count / totalReports) * 100) : 0;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize font-semibold text-slate-200">
                          {cat.category_name_en || cat.category.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-cyan-400">
                          {cat.count} reports ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#131B33] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">
                No active complaints currently recorded for {activeCity?.name_en}.
              </p>
            )}
          </div>

          {/* Data Authenticity & Citizen Commitment */}
          <div className="p-6 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Open Governance & Data Integrity Commitment</span>
            </h2>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-[#131B33] rounded-xl border border-[#2E3D60] space-y-1">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real PostGIS Records</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  All statistics are derived directly from authenticated municipal complaint records and OpenStreetMap GIS feature geometries in Madhya Pradesh.
                </p>
              </div>

              <div className="p-3 bg-[#131B33] rounded-xl border border-[#2E3D60] space-y-1">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Privacy Safeguards</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Citizen names and personal contact details are redacted from public views. Only aggregated complaint categories, coordinates, and resolution progress are shown.
                </p>
              </div>

              <div className="p-3 bg-[#131B33] rounded-xl border border-[#2E3D60] space-y-1">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sarvam AI Grounded Triage</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  AI insights assist departmental dispatch while preserving human officer verification and immutable append-only audit histories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

