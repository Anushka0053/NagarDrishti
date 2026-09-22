import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Compass, 
  Search, 
  Globe, 
  Mic, 
  MapPin, 
  ChevronDown,
  Layers,
  Sparkles,
  Building,
  Navigation,
  X,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useLayerStore } from '../../store/layerStore';
import { useFeedbackStore } from '../../store/feedbackStore';
import { City, SearchResult } from '../../types';
import { useCities, useUniversalSearch, searchApi } from '../../api';
import { CoverageModal } from './CoverageModal';

interface HeaderProps {
  cities: City[];
}

export const Header: React.FC<HeaderProps> = ({ cities }) => {
  const { t, i18n } = useTranslation();
  const {
    activeCity,
    setActiveCity,
    setActiveWard,
    setTempMarker,
    setInspectorOpen,
    toggleLeftSidebar,
    toggleInspector,
    toggleAnalyticsDrawer,
  } = useMapStore();
  const { setSelectedFeature } = useLayerStore();
  const { openModal: openFeedbackModal } = useFeedbackStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const handleCitySelect = (city: City) => {
    setActiveCity(city);
    setIsCityMenuOpen(false);
  };

  // Debounced search query
  useEffect(() => {
    const queryStr = searchQuery.trim();
    if (queryStr.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      searchApi
        .universalSearch(queryStr, activeCity?.id)
        .then((res) => {
          setSearchResults(res.results || []);
          setIsSearchOpen(true);
        })
        .catch((err) => {
          console.warn('[Search error]', err);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeCity?.id]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (item: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');

    if (item.type === 'coordinate' && item.coordinates) {
      setTempMarker(item.coordinates);
      setSelectedFeature({
        name_en: item.title,
        name_hi: item.title,
        category: 'coordinate_pin',
        properties: {
          latitude: item.coordinates[1],
          longitude: item.coordinates[0],
        },
        source_attribution_en: 'Direct Coordinate Lookup',
        source_health: 'healthy',
        latitude: item.coordinates[1],
        longitude: item.coordinates[0],
      });
      setInspectorOpen(true);
    } else if (item.type === 'city' && item.city_id) {
      const foundCity = cities.find((c) => c.id === item.city_id);
      if (foundCity) setActiveCity(foundCity);
    } else if (item.type === 'ward') {
      if (item.coordinates) setTempMarker(item.coordinates);
      setActiveWard({
        id: item.id,
        city_id: item.city_id || activeCity?.id || '',
        ward_number: 1,
        name_en: item.title,
        name_hi: item.title,
        geometry: item.geometry,
      });
    } else if (item.type === 'feature') {
      if (item.coordinates) setTempMarker(item.coordinates);
      setSelectedFeature({
        feature_id: item.id,
        name_en: item.title,
        name_hi: item.title,
        category: item.category || 'civic_feature',
        properties: {
          feature_id: item.id,
          name: item.title,
          category: item.category,
        },
        source_attribution_en: 'NagarDrishti Master Features Catalog',
        source_health: 'healthy',
      });
      setInspectorOpen(true);
    }
  };

  return (
    <>
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

        {/* Universal Search Bar & Autocomplete Dropdown */}
        <div ref={searchContainerRef} className="flex-1 max-w-md mx-4 relative hidden sm:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setIsSearchOpen(true)}
              placeholder={
                i18n.language === 'hi'
                  ? 'सड़क, अस्पताल, वार्ड, या निर्देशांक खोजें...'
                  : 'Search roads, hospitals, wards, coordinates (e.g. 26.21, 78.18)...'
              }
              className="w-full bg-[#1C2541]/80 hover:bg-[#1C2541] focus:bg-[#1C2541] border border-[#2E3D60] focus:border-cyan-400/80 rounded-full pl-9 pr-16 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all font-sans"
            />

            <div className="absolute right-2.5 flex items-center gap-1.5">
              {isSearching && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
              {searchQuery && !isSearching && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => alert('Voice search will be enabled with Sarvam AI STT integration in Phase 4.')}
                title="Voice Search"
                className="text-slate-400 hover:text-cyan-400 p-0.5"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#1C2541] border border-[#2E3D60] rounded-lg shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-cyan-400 tracking-wider bg-[#131B33] border-b border-[#2E3D60]">
                {t('app.search_results')} ({searchResults.length})
              </div>
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#253258] border-b border-[#2E3D60]/50 last:border-0 flex items-start gap-2.5 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {res.type === 'coordinate' && <Navigation className="w-3.5 h-3.5 text-amber-400" />}
                    {res.type === 'ward' && <Building className="w-3.5 h-3.5 text-cyan-400" />}
                    {res.type === 'city' && <MapPin className="w-3.5 h-3.5 text-emerald-400" />}
                    {res.type === 'feature' && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">{res.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{res.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Tools & Controls */}
        <div className="flex items-center gap-2">
          {/* Data Coverage Audit Button */}
          <button
            onClick={() => setIsCoverageModalOpen(true)}
            title="Data Coverage Matrix Audit"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-cyan-500/30 hover:border-cyan-400 rounded-md text-xs font-semibold text-cyan-300 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Data Matrix</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title="Toggle Hindi / English"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-md text-xs font-semibold text-slate-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{i18n.language === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>

          {/* Citizen Feedback Modal Trigger */}
          <button
            onClick={() => openFeedbackModal()}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-md text-xs shadow-md shadow-cyan-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('header.report_issue')}</span>
          </button>

          {/* Panel Toggles */}
          <div className="flex items-center gap-1 border-l border-[#2E3D60] pl-2">
            <button
              onClick={toggleLeftSidebar}
              title="Toggle Left Sidebar"
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-[#1C2541] rounded transition-colors"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={toggleInspector}
              title="Toggle Intelligence Inspector"
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-[#1C2541] rounded transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Coverage Modal */}
      <CoverageModal
        isOpen={isCoverageModalOpen}
        onClose={() => setIsCoverageModalOpen(false)}
        initialCityId={activeCity?.id}
      />
    </>
  );
};

