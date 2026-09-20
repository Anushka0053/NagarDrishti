import React from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-[#2E3D60] pb-4">
        <a href="/" className="p-2 bg-[#1C2541] hover:bg-[#253258] rounded-lg text-cyan-400">
          <ArrowLeft className="w-4 h-4" />
        </a>
        <h1 className="text-xl font-bold">Public Citizen Feedback & Issue Stream (Madhya Pradesh)</h1>
      </div>

      <div className="p-4 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-xs text-slate-300">
        Publicly accessible verified civic telemetry stream. Private citizen personal data is protected by design.
      </div>
    </div>
  );
};
