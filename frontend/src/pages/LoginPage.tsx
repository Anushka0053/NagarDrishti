import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Lock, Mail, ArrowRight, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to dashboard
    window.location.href = '/';
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B132B] px-4 select-none relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1C2541]/90 border border-[#2E3D60] rounded-2xl shadow-2xl p-8 backdrop-blur-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 mx-auto">
            <Compass className="w-7 h-7 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {t('app.name')}
          </h1>
          <p className="text-xs text-slate-400">
            {i18n.language === 'hi' ? 'मध्य प्रदेश नागरिक भूसूचना पोर्टल' : 'Madhya Pradesh Civic Geospatial Portal'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#131B33] border border-[#2E3D60] rounded-lg text-xs font-semibold text-slate-400">
          {[
            { id: 'citizen', label: 'Citizen' },
            { id: 'analyst', label: 'Analyst' },
            { id: 'admin', label: 'Admin' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`py-1.5 rounded transition-all ${
                role === r.id ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Email / Mobile Number</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@mp.gov.in"
                className="w-full p-2.5 pl-9 bg-[#131B33] border border-[#2E3D60] focus:border-cyan-400 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 pl-9 bg-[#131B33] border border-[#2E3D60] focus:border-cyan-400 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all mt-2"
          >
            <span>Sign In to NagarDrishti</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <a href="/" className="text-xs text-cyan-400 hover:underline">
            ← Return to GIS Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};
