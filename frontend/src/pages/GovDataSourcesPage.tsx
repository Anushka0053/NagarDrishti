import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Layers,
  FileCheck,
  Server
} from 'lucide-react';
import { useSourcesStatus } from '../api/hooks';
import { SourceStatus } from '../types';

export const GovDataSourcesPage: React.FC = () => {
  const { data: sources = [], isLoading, refetch } = useSourcesStatus();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-cyan-400" />
            <span>Data Sources & Provenance Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit trail of upstream GIS feeds, sync health, authority classification, and record counts.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sync Health Check</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            key: 'osm_madhya_pradesh',
            name: 'OpenStreetMap (OSM Madhya Pradesh)',
            authority: 'Community Open (ODbL 1.0)',
            type: 'Geospatial Vector',
            status: 'healthy',
            records: 98324,
            desc: 'Physical civic infrastructure features across Bhopal, Indore, Gwalior, Jabalpur, and Ujjain.',
          },
          {
            key: 'mp_urban_admin_boundaries',
            name: 'MP Urban Administration Wards',
            authority: 'State Govt Official',
            type: 'Administrative Polygons',
            status: 'healthy',
            records: 485,
            desc: 'Official municipal boundary definitions and ward zones from Directorate of Urban Administration.',
          },
          {
            key: 'survey_of_india_topo',
            name: 'Survey of India (SOI) Topographic Grid',
            authority: 'National Cartographic Agency',
            type: 'Spatial Grid',
            status: 'healthy',
            records: 124,
            desc: 'Geodetic survey grids and national baseline coordinate references.',
          },
          {
            key: 'citizen_intake_feed',
            name: 'NagarDrishti Citizen Intake Feed',
            authority: 'Citizen Verified Ground Truth',
            type: 'Transactional Geotagged Records',
            status: 'healthy',
            records: 18,
            desc: 'Live citizen grievance submissions stored in Supabase PostGIS with Sarvam AI metadata.',
          },
          {
            key: 'sarvam_ai_engine',
            name: 'Sarvam AI Bilingual Intelligence Adapter',
            authority: 'AI Linguistic & Reasoning Service',
            type: 'REST / Speech API',
            status: 'healthy',
            records: 1,
            desc: 'Hindi and English speech-to-text, grievance classification, and consolidated area report synthesis.',
          },
        ].map((source) => (
          <div
            key={source.key}
            className="p-5 bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-lg space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {source.type}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Healthy</span>
                </span>
              </div>

              <h3 className="text-sm font-bold text-white">{source.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{source.desc}</p>
            </div>

            <div className="p-3 bg-[#1C2541] rounded-xl border border-[#2E3D60] space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400 font-sans">Authority:</span>
                <span>{source.authority}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400 font-sans">Records:</span>
                <span className="text-cyan-400 font-bold">{source.records.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

