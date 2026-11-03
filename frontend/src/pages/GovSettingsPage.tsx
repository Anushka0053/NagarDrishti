import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Save
} from 'lucide-react';

export const GovSettingsPage: React.FC = () => {
  const [slaHours, setSlaHours] = useState('72');
  const [duplicateDistanceMeters, setDuplicateDistanceMeters] = useState('200');
  const [autoTriageEnabled, setAutoTriageEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Platform Settings & Governance Policies</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure municipal SLA thresholds, PostGIS spatial duplicate thresholds, and Sarvam AI parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl p-6 space-y-6 text-xs">
        {isSaved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully. Policies applied statewide across Madhya Pradesh.</span>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2E3D60] pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Service Level Agreement (SLA) Benchmarks</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Standard Resolution SLA (Hours)
              </label>
              <input
                type="number"
                value={slaHours}
                onChange={(e) => setSlaHours(e.target.value)}
                className="w-full p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-slate-100 font-mono focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Maximum permitted elapsed time from citizen intake to field resolution verification.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                PostGIS Duplicate Radius (Meters)
              </label>
              <input
                type="number"
                value={duplicateDistanceMeters}
                onChange={(e) => setDuplicateDistanceMeters(e.target.value)}
                className="w-full p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-slate-100 font-mono focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Spatial buffer (ST_DWithin) used to detect potential duplicate citizen complaints.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#2E3D60]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2E3D60] pb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Sarvam AI Autonomous Intake Pipeline</span>
          </h2>

          <div className="flex items-center justify-between p-3.5 bg-[#1C2541] rounded-xl border border-[#2E3D60]">
            <div>
              <p className="font-semibold text-slate-200">Automatic Bilingual Triage on Intake</p>
              <p className="text-[11px] text-slate-400">
                Automatically generate English and Hindi summaries, categorize issue, and suggest department dispatch upon submission.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoTriageEnabled}
              onChange={(e) => setAutoTriageEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

