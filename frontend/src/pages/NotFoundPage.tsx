import React from 'react';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B132B] text-slate-100 p-4 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg">
        <Compass className="w-8 h-8 text-slate-950 font-bold" />
      </div>
      <h1 className="text-4xl font-extrabold text-cyan-400 font-mono">404</h1>
      <p className="text-sm text-slate-400">The requested civic or GIS workspace route does not exist.</p>
      <a
        href="/"
        className="flex items-center gap-2 px-4 py-2 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-xs font-semibold text-cyan-400 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Return to GIS Dashboard</span>
      </a>
    </div>
  );
};
