import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Compass, 
  Search, 
  Globe, 
  User, 
  Mic, 
  Layers, 
  Sparkles,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useFeedbackStore } from '../../store/feedbackStore';
import { City } from '../../types';

interface HeaderProps {
  cities: City[];
}

export const Header: React.FC<HeaderProps> = ({ cities }) => {
  const { t, i18n } = useTranslation();
  const { activeCity, setActiveCity, toggleLeftSidebar, toggleInspector, toggleAnalyticsDrawer } = useMapStore();
  const { openModal: openFeedbackModal } = useFeedbackStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const handleCitySelect = (city: City) => {
    setActiveCity(city);
    setIsCityMenuOpen(false);
  };

  return (
    <header className="h-14 bg-[#0B132B]/95 border-b border-[#2E3D60] px-4 flex items-center justify-between select-none z-30 relative backdrop-blur-md">
      {/* Brand & MP City Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {t('app.name')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                MP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none hidden lg:block">
              {i18n.language === 'hi' ? 'मध्य प्रदेश भूसूचना प्लेटफॉर्म' : 'MP Civic Geospatial Intelligence'}
            </p>
          </div>
        </div>

        {/* Global MP City Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsCityMenuOpen(!isCityMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] hover:border-cyan-500/50 rounded-md text-xs font-semibold transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{i18n.language === 'hi' ? activeCity?.name_hi : activeCity?.name_en}</span>
            {activeCity?.is_reference_city && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded border border-emerald-500/30">
                Ref City
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isCityMenuOpen && (
            <div className="absolute top-full mt-1 left-0 w-48 bg-[#1C2541] border border-[#2E3D60] rounded-md shadow-xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 border-b border-[#2E3D60]">
                {t('app.select_city')} (Madhya Pradesh)
              </div>
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#253258] transition-colors ${
                    activeCity?.id === city.id ? 'text-cyan-400 bg-cyan-950/30 font-medium' : 'text-slate-200'
                  }`}
                >
                  <span>{i18n.language === 'hi' ? city.name_hi : city.name_en}</span>
                  {city.is_reference_city && (
                    <span className="text-[9px] text-emerald-400 font-mono">Gwalior</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Universal Search / Sarvam Natural Language Bar */}
      <div className="flex-1 max-w-xl mx-4 hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('app.search_placeholder')}
            className="w-full bg-[#1C2541]/90 hover:bg-[#1C2541] focus:bg-[#1C2541] border border-[#2E3D60] focus:border-cyan-400 pl-9 pr-20 py-1.5 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-inner"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              title="Voice Query (Sarvam AI Speech-to-Text)"
              onClick={() => openFeedbackModal()}
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-[#2E3D60]" />
            <button
              title="Grounded AI Civic Assistant"
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Controls & Language Switcher */}
      <div className="flex items-center gap-2">
        {/* Report Issue CTA Button */}
        <button
          onClick={() => openFeedbackModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs rounded-md shadow-md shadow-rose-900/30 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{t('nav.feedback')}</span>
        </button>

        {/* Hindi / English Language Toggle */}
        <button
          onClick={toggleLanguage}
          title={t('app.language')}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-md text-xs font-semibold text-slate-200 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono">{i18n.language === 'hi' ? 'हिन्दी' : 'EN'}</span>
        </button>

        {/* Panel Toggles for Desktop/Tablet */}
        <div className="h-5 w-px bg-[#2E3D60] mx-1 hidden sm:block" />

        <button
          onClick={toggleLeftSidebar}
          title={t('sidebar.layers_tab')}
          className="p-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-md text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* User Profile / Auth */}
        <a
          href="/login"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-md text-xs text-slate-200 transition-colors"
        >
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">{t('app.login')}</span>
        </a>
      </div>
    </header>
  );
};
