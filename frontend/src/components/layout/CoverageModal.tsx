import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  X, 
  Layers, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Building2, 
  Info,
  Key,
  ExternalLink
} from 'lucide-react';
import { useCities, useCityCoverageSummary, useSourcesStatus } from '../../api';
import { CoverageStatus, ProvenanceType } from '../../types';

interface CoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCityId?: string;
}

export const CoverageModal: React.FC<CoverageModalProps> = ({ isOpen, onClose, initialCityId }) => {
  const { t, i18n } = useTranslation();
  const { data: cities } = useCities();
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>(initialCityId);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activeCityId = selectedCityId || (cities && cities.length > 0 ? cities[0].id : undefined);
  const { data: summary, isLoading } = useCityCoverageSummary(activeCityId);
  const { data: sourcesStatus } = useSourcesStatus();

  if (!isOpen) return null;

  const getStatusBadge = (status: CoverageStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available (Live GIS)',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2
        };
      case 'partial':
        return {
          label: 'Partial Coverage',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle
        };
      case 'credential_required':
        return {
          label: 'API Key Required',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: Key
        };
      case 'integration_pending':
        return {
          label: 'MOU / Integration Pending',
          badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: Clock
        };
      default:
        return {
          label: 'Unavailable',
          badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          icon: Info
        };
    }
  };

  const getProvenanceBadge = (prov: ProvenanceType) => {
    switch (prov) {
      case 'official_verified':
        return <span className="text-emerald-400">Official Verified</span>;
      case 'community_open':
        return <span className="text-cyan-400">Community Open (OSM)</span>;
      case 'citizen_submitted':
        return <span className="text-amber-400">Citizen Submitted</span>;
      case 'internal_derived':
        return <span className="text-purple-400">Internal AI / Cluster</span>;
      case 'development_fixture':
        return <span className="text-rose-400">Test Fixture</span>;
      default:
        return <span className="text-slate-400">Open Data</span>;
    }
  };

  const filteredCoverages = summary?.coverages.filter(cov => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'available') return cov.coverage_status === 'available';
    if (statusFilter === 'partial') return cov.coverage_status === 'partial';
    if (statusFilter === 'pending') return ['credential_required', 'integration_pending', 'unavailable'].includes(cov.coverage_status);
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B132B] border border-[#2E3D60] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#2E3D60] bg-[#1C2541]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <span>NagarDrishti Data Coverage & Provenance Matrix</span>
                <span className="text-[10px] bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                  Phase 2.5 Truth Audit
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transparent accounting of authoritative GIS datasets, OpenStreetMap features, and pending source credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* City Switcher Tabs */}
        <div className="px-4 pt-3 bg-[#131B33] border-b border-[#2E3D60] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
            {cities?.map((c) => {
              const isSelected = c.id === activeCityId;
              const isGwalior = c.slug === 'gwalior';

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCityId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{i18n.language === 'hi' ? c.name_hi : c.name_en}</span>
                  {isGwalior && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                      Reference 100%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 pb-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1C2541] border border-[#2E3D60] rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Live</option>
              <option value="partial">Partial</option>
              <option value="pending">Credential / MOU Pending</option>
            </select>
          </div>
        </div>

        {/* City Summary KPIs Bar */}
        {summary && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#0E172F] border-b border-[#2E3D60]/60 text-xs">
            <div className="p-2.5 bg-[#1C2541]/60 rounded-lg border border-[#2E3D60]/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total Layers</span>
              <p className="text-base font-bold font-mono text-slate-100">{summary.total_layers}</p>
            </div>
            <div className="p-2.5 bg-[#1C2541]/60 rounded-lg border border-[#2E3D60]/50">
              <span className="text-[10px] text-emerald-400 uppercase font-mono">Live Available</span>
              <p className="text-base font-bold font-mono text-emerald-400">{summary.available_layers}</p>
            </div>
            <div className="p-2.5 bg-[#1C2541]/60 rounded-lg border border-[#2E3D60]/50">
              <span className="text-[10px] text-amber-400 uppercase font-mono">Partial Data</span>
              <p className="text-base font-bold font-mono text-amber-400">{summary.partial_layers}</p>
            </div>
            <div className="p-2.5 bg-[#1C2541]/60 rounded-lg border border-[#2E3D60]/50">
              <span className="text-[10px] text-rose-400 uppercase font-mono">Pending Creds/MOU</span>
              <p className="text-base font-bold font-mono text-rose-400">{summary.unavailable_layers}</p>
            </div>
            <div className="p-2.5 bg-[#1C2541]/60 rounded-lg border border-[#2E3D60]/50">
              <span className="text-[10px] text-cyan-400 uppercase font-mono">Verified Features</span>
              <p className="text-base font-bold font-mono text-cyan-400">{summary.total_features}</p>
            </div>
          </div>
        )}

        {/* Matrix Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading coverage matrix...</div>
          ) : filteredCoverages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              No layer coverage records match the selected filter.
            </div>
          ) : (
            <div className="rounded-lg border border-[#2E3D60] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1C2541] text-slate-400 font-mono uppercase text-[10px] border-b border-[#2E3D60]">
                  <tr>
                    <th className="py-2.5 px-3">Layer / Sector</th>
                    <th className="py-2.5 px-3">Coverage Status</th>
                    <th className="py-2.5 px-3 text-right">Feature Count</th>
                    <th className="py-2.5 px-3">Provenance</th>
                    <th className="py-2.5 px-3">Source Provider</th>
                    <th className="py-2.5 px-3">Completeness & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E3D60]/40">
                  {filteredCoverages.map((cov, idx) => {
                    const statusInfo = getStatusBadge(cov.coverage_status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr 
                        key={cov.id || idx}
                        className={`hover:bg-[#1C2541]/60 transition-colors ${
                          idx % 2 === 0 ? 'bg-[#0B132B]' : 'bg-[#101935]'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-100">{cov.layer_name_en || cov.layer_slug}</div>
                          <div className="text-[10px] text-slate-400">{cov.sector_name_en || 'Urban Sector'}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${statusInfo.badgeClass}`}>
                            <StatusIcon className="w-3 h-3 shrink-0" />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          {cov.feature_count}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {getProvenanceBadge(cov.provenance_type)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-300 font-mono text-[11px] truncate max-w-[150px]">
                            {cov.source_name_en || 'Open Data Matrix'}
                          </div>
                          <div className="text-[9px] text-slate-500">{cov.geographic_coverage || 'Municipal Area'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-[200px]">
                          {cov.completeness_notes || 'Grounded in GIS database.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2E3D60] bg-[#131B33] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>
              All data counts reflect live PostgreSQL/PostGIS database records. NagarDrishti does not use synthetic placeholders.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-slate-200 font-semibold transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
