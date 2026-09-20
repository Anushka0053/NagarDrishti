import React from 'react';
import { ArrowLeft, Shield, Database, Layers, RefreshCw, Users, FileCheck } from 'lucide-react';

export const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 p-6 max-w-6xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-[#2E3D60] pb-4">
        <div className="flex items-center gap-3">
          <a href="/" className="p-2 bg-[#1C2541] hover:bg-[#253258] rounded-lg text-cyan-400">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="text-xl font-bold">NagarDrishti — MP GIS Administration Portal</h1>
            <p className="text-xs text-slate-400">Metadata-Driven Layer Management, ETL Health & Data Governance</p>
          </div>
        </div>
        <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded">
          Super Admin
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Layers className="w-4 h-4" />
            <span>GIS Dynamic Layers</span>
          </div>
          <p className="text-slate-400">Manage PostGIS, WMS, and GeoJSON layer metadata, styles, zoom thresholds and SLAs.</p>
        </div>

        <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Database className="w-4 h-4" />
            <span>Data Source Registry</span>
          </div>
          <p className="text-slate-400">Configure GARUD MP, ISRO Bhuvan, OGD India, and MP eService API adapters.</p>
        </div>

        <div className="p-5 bg-[#1C2541] border border-[#2E3D60] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <RefreshCw className="w-4 h-4" />
            <span>ETL Ingestion Runs</span>
          </div>
          <p className="text-slate-400">Monitor background sync jobs, schema drift, quarantined rows and freshness logs.</p>
        </div>
      </div>
    </div>
  );
};
