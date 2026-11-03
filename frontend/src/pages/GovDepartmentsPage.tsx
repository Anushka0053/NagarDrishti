import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Search, 
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { useDepartments } from '../api/hooks';
import { feedbackApi } from '../api/feedback';

export const GovDepartmentsPage: React.FC = () => {
  const { data: departments = [] } = useDepartments();
  const [departmentWorkload, setDepartmentWorkload] = useState<Record<string, { total: number; resolved: number; open: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    feedbackApi.getPublicReports({ limit: 100 }).then((reports) => {
      const stats: Record<string, { total: number; resolved: number; open: number }> = {};
      (reports || []).forEach((r) => {
        const dId = r.department_id || 'unassigned';
        if (!stats[dId]) stats[dId] = { total: 0, resolved: 0, open: 0 };
        stats[dId].total += 1;
        if (r.status === 'resolved') stats[dId].resolved += 1;
        else stats[dId].open += 1;
      });
      setDepartmentWorkload(stats);
    });
  }, []);

  const filteredDepts = departments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name_en.toLowerCase().includes(q) ||
      d.name_hi.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>Department Management & Workload Dispatch</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operational municipal departments, active complaint queues, and SLA performance indicators.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name or code (PWD, PHED, SWM)..."
            className="w-full pl-10 pr-4 py-2 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.map((dept) => {
          const stats = departmentWorkload[dept.id] || { total: 0, resolved: 0, open: 0 };
          const resolutionPct = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100;

          return (
            <div
              key={dept.id}
              className="p-5 bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-lg space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {dept.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Operational</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{dept.name_en}</h3>
                <p className="text-xs text-slate-400">{dept.name_hi}</p>

                {dept.contact_phone && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono pt-1">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{dept.contact_phone}</span>
                  </p>
                )}
              </div>

              {/* Workload Stats */}
              <div className="p-3 bg-[#1C2541] rounded-xl border border-[#2E3D60] space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Assigned Tasks:</span>
                  <span className="font-mono font-bold text-slate-200">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Resolution Rate:</span>
                  <span className="font-mono font-bold text-emerald-400">{resolutionPct}%</span>
                </div>
                <div className="w-full bg-[#131B33] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
                    style={{ width: `${resolutionPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

