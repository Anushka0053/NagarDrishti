import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Clock, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-[#2E3D60] pb-4">
        <a href="/" className="p-2 bg-[#1C2541] hover:bg-[#253258] rounded-lg text-cyan-400">
          <ArrowLeft className="w-4 h-4" />
        </a>
        <h1 className="text-xl font-bold">Citizen Profile & Feedback Portfolio</h1>
      </div>

      {/* User Card */}
      <div className="p-6 bg-[#1C2541] border border-[#2E3D60] rounded-xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xl font-bold">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold">Citizen User (MP)</h2>
          <p className="text-xs text-slate-400 font-mono">Preferred City: Gwalior (Lashkar Zone)</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              Verified Citizen
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
              4 Submitted Reports
            </span>
          </div>
        </div>
      </div>

      {/* My Reports List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">My Submitted Issues</h3>
        <div className="space-y-2 text-xs">
          {[
            { id: 'ND-GWL-2026-000001', category: 'Road Pothole', location: 'Thatipur Circle', status: 'verified', date: '2026-08-20' },
            { id: 'ND-GWL-2026-000042', category: 'Water Leakage', location: 'Maharaj Bada', status: 'in_progress', date: '2026-08-28' },
          ].map((rep) => (
            <div key={rep.id} className="p-4 bg-[#1C2541] border border-[#2E3D60] rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">{rep.category}</div>
                <div className="text-[11px] text-slate-400 font-mono">{rep.id} • {rep.location}</div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/20 text-cyan-300 font-mono uppercase">
                {rep.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
