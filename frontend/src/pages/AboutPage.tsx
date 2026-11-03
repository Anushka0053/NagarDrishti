import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Compass, 
  MapPin, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { useCities } from '../api/hooks';

export const AboutPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { data: cities = [] } = useCities();

  return (
    <div className="h-screen w-full bg-[#0B132B] text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      <PublicHeader cities={cities} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-8 pb-24">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center shadow-xl shadow-cyan-500/20 mx-auto">
            <Compass className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h1 className="text-3xl font-black text-white">
            About <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">NagarDrishti</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Madhya Pradesh Urban Civic Geospatial Intelligence and Grievance Management Platform.
          </p>
        </div>

        {/* Overview Card */}
        <div className="p-6 bg-[#1C2541] border border-[#2E3D60] rounded-2xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-cyan-300 uppercase tracking-wider">
            Platform Mission
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            NagarDrishti transforms municipal grievance management across Madhya Pradesh by integrating real spatial GIS features, PostGIS geographic data processing, bilingual Sarvam AI assistance, and transparent citizen communication. The platform bridges the gap between citizens reporting local issues and municipal departments executing field inspections and repairs.
          </p>
        </div>

        {/* 5 Reference Cities */}
        <div className="p-6 bg-[#1C2541] border border-[#2E3D60] rounded-2xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Operational Geographic Scope</span>
          </h2>
          <p className="text-xs text-slate-400">
            NagarDrishti is calibrated for 5 major municipal corporations in Madhya Pradesh, with 98,324 genuine GIS features registered in the PostGIS spatial engine:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {[
              { name: 'Gwalior', slug: 'gwalior', ref: true },
              { name: 'Bhopal', slug: 'bhopal', ref: false },
              { name: 'Indore', slug: 'indore', ref: false },
              { name: 'Jabalpur', slug: 'jabalpur', ref: false },
              { name: 'Ujjain', slug: 'ujjain', ref: false },
            ].map((c) => (
              <div key={c.slug} className="p-3 bg-[#131B33] border border-[#2E3D60] rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-white">{c.name}</p>
                <p className="text-[10px] text-cyan-400 font-mono">{c.ref ? 'Primary Ref ULB' : 'Municipal Corp'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
              <Database className="w-4 h-4" />
              <span>PostGIS Spatial Engine</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spatial proximity algorithms (ST_DWithin 200m) link citizen complaints directly to roads, hospitals, and schools with explicit relationship types (located at, nearby, reported against, infrastructure associated).
            </p>
          </div>

          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Sarvam AI Intelligence</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Native Hindi and English speech-to-text, grievance classification, department assignment suggestions, and consolidated area intelligence reports for municipal leadership.
            </p>
          </div>

          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Immutable Audit Trail</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every status update, inspection note, and assignment change is written to an append-only PostgreSQL ledger protected by database trigger constraints.
            </p>
          </div>

          <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
              <Users className="w-4 h-4" />
              <span>Separated Portals</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clean public citizen portal for geotagged complaint intake and tracking; professional administrative portal for municipal dispatchers, department heads, and field officers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

