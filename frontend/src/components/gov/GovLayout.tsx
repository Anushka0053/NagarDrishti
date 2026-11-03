import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  Map, 
  Building2, 
  Users, 
  BarChart3, 
  Database, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Compass, 
  ExternalLink,
  ChevronDown,
  UserCheck,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { AuthUser, UserRole } from '../../types';

interface GovLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/gov/overview', label: 'Overview', icon: LayoutDashboard, roles: ['super_admin', 'city_admin', 'department_head', 'field_officer', 'gis_officer'] },
  { path: '/gov/reports', label: 'Reports Center', icon: FileText, roles: ['super_admin', 'city_admin', 'department_head', 'field_officer'] },
  { path: '/gov/ai-intelligence', label: 'AI Intelligence Reports', icon: Sparkles, roles: ['super_admin', 'city_admin', 'department_head'] },
  { path: '/gov/gis-explorer', label: 'GIS Explorer', icon: Map, roles: ['super_admin', 'city_admin', 'department_head', 'field_officer', 'gis_officer'] },
  { path: '/gov/departments', label: 'Department Management', icon: Building2, roles: ['super_admin', 'city_admin', 'department_head'] },
  { path: '/gov/officers', label: 'Officer Management', icon: Users, roles: ['super_admin', 'city_admin'] },
  { path: '/gov/analytics', label: 'Analytics', icon: BarChart3, roles: ['super_admin', 'city_admin', 'department_head', 'gis_officer'] },
  { path: '/gov/sources', label: 'Data Sources', icon: Database, roles: ['super_admin', 'gis_officer'] },
  { path: '/gov/audit', label: 'Audit Logs', icon: ShieldCheck, roles: ['super_admin', 'city_admin'] },
  { path: '/gov/settings', label: 'Settings', icon: Settings, roles: ['super_admin'] },
];

const DEMO_ROLES: { role: UserRole; email: string; label: string }[] = [
  { role: 'super_admin', email: 'superadmin@mp.gov.in', label: 'Super Admin' },
  { role: 'city_admin', email: 'cityadmin.gwalior@mp.gov.in', label: 'City Admin (Gwalior)' },
  { role: 'department_head', email: 'depthead.pwd@mp.gov.in', label: 'Dept Head (PWD)' },
  { role: 'field_officer', email: 'fieldofficer.pwd@mp.gov.in', label: 'Field Officer (PWD)' },
  { role: 'gis_officer', email: 'gisofficer@mp.gov.in', label: 'GIS Officer' },
];

export const GovLayout: React.FC<GovLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    return authApi.getStoredUser() || {
      id: 'super-admin-01',
      email: 'superadmin@mp.gov.in',
      full_name: 'Shri Rajesh Sharma',
      role: 'super_admin',
    };
  });

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleRoleSwitch = async (demoRole: { role: UserRole; email: string; label: string }) => {
    try {
      const res = await authApi.login(demoRole.email, demoRole.role);
      setCurrentUser(res.user);
      setIsRoleMenuOpen(false);
    } catch {
      // Offline fallback: set role locally
      const updatedUser: AuthUser = {
        id: `demo-${demoRole.role}`,
        email: demoRole.email,
        full_name: demoRole.label,
        role: demoRole.role,
      };
      localStorage.setItem('nd_auth_role', demoRole.role);
      localStorage.setItem('nd_auth_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setIsRoleMenuOpen(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  const roleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'city_admin': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'department_head': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'field_officer': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'gis_officer': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[#0B132B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Government Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111827] border-r border-[#2E3D60] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#2E3D60]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">NagarDrishti</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  GOV
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Government Administration</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Mini Card */}
        <div className="p-3 border-b border-[#2E3D60]/60 bg-[#162038]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.full_name}</p>
              <span className={`inline-block text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${roleBadgeColor(currentUser.role)}`}>
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const hasAccess = item.roles.includes(currentUser.role);
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                disabled={!hasAccess}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : hasAccess
                    ? 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
                    : 'text-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {!hasAccess && (
                  <span className="ml-auto text-[9px] text-slate-600 uppercase font-mono">Restricted</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#2E3D60] space-y-2">
          <a
            href="/"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] text-xs font-semibold text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Public Portal</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Live</span>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-950/30 text-xs font-semibold text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Government Top Bar */}
        <header className="h-16 bg-[#111827] border-b border-[#2E3D60] px-4 lg:px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm lg:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Madhya Pradesh Urban Grievance & GIS Intelligence</span>
            </h1>
          </div>

          {/* Quick Role Switcher for Demonstration & Evaluation */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-cyan-500/40 rounded-lg text-xs font-semibold text-cyan-300 transition-colors"
                title="Switch role for demonstration assessment"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Role:</span>
                <span className="capitalize">{currentUser.role.replace('_', ' ')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#1C2541] border border-[#2E3D60] rounded-lg shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-[#2E3D60]">
                    Evaluation Role Switcher
                  </div>
                  {DEMO_ROLES.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#253258] transition-colors ${
                        currentUser.role === r.role ? 'text-cyan-400 bg-cyan-950/40 font-semibold' : 'text-slate-200'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{r.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.email}</p>
                      </div>
                      {currentUser.role === r.role && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#0B132B]">
          {children}
        </main>
      </div>
    </div>
  );
};

