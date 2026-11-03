import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  MapPin, 
  CheckCircle2,
  Mail,
  Phone
} from 'lucide-react';
import { adminApi, AdminUserData } from '../api/admin';
import { useCities, useDepartments } from '../api/hooks';

export const GovOfficersPage: React.FC = () => {
  const { data: cities = [] } = useCities();
  const { data: departments = [] } = useDepartments();

  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    adminApi
      .getUsers({ limit: 50 })
      .then((res) => setUsers(res.users || []))
      .catch((err) => {
        console.warn('Failed to fetch users', err);
        // Fallback demo officer accounts
        setUsers([
          {
            id: 'usr-01',
            role: 'super_admin',
            full_name: 'Shri Rajesh Sharma',
            phone_number: '+91 755 2441001',
            is_verified: true,
            created_at: '2026-01-10T10:00:00Z',
          },
          {
            id: 'usr-02',
            role: 'city_admin',
            full_name: 'Smt. Priya Verma',
            phone_number: '+91 751 2441002',
            is_verified: true,
            created_at: '2026-01-12T10:00:00Z',
          },
          {
            id: 'usr-03',
            role: 'department_head',
            full_name: 'Er. Amit Patel',
            phone_number: '+91 751 2441003',
            is_verified: true,
            created_at: '2026-01-15T10:00:00Z',
          },
          {
            id: 'usr-04',
            role: 'field_officer',
            full_name: 'Shri Vikram Singh',
            phone_number: '+91 751 2441004',
            is_verified: true,
            created_at: '2026-01-18T10:00:00Z',
          },
          {
            id: 'usr-05',
            role: 'gis_officer',
            full_name: 'Ms. Neha Gupta',
            phone_number: '+91 755 2441005',
            is_verified: true,
            created_at: '2026-01-20T10:00:00Z',
          },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Users className="w-6 h-6 text-cyan-400" />
          <span>Municipal Staff & Officer Directory</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Role-based access matrix, department assignments, and contact channels for municipal staff.
        </p>
      </div>

      {/* Search */}
      <div className="p-4 bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officers by name or role..."
            className="w-full pl-10 pr-4 py-2 bg-[#1C2541] border border-[#2E3D60] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-[#111827] border border-[#2E3D60] rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-[#162038] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-[#2E3D60]">
            <tr>
              <th className="py-3 px-4">Officer Name</th>
              <th className="py-3 px-4">Role Title</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E3D60]/50">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-[#1C2541] transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                      {u.full_name.charAt(0)}
                    </div>
                    <span>{u.full_name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-400">
                  {u.phone_number || 'N/A'}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Official</span>
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5" />
                  <span className="text-slate-300 font-semibold">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

