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
  ShieldCheck,
  Activity,
  GraduationCap,
  Trees,
  Check,
  FileText,
  HelpCircle,
  LogIn,
  User
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useLayerStore } from '../../store/layerStore';
import { useFeedbackStore } from '../../store/feedbackStore';
import { City, SearchResult } from '../../types';
import { searchApi, authApi } from '../../api';

interface PublicHeaderProps {
  cities: City[];
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ cities }) => {
  const { t, i18n } = useTranslation();
  const {
    activeCity,
    setActiveCity,
    setActiveWard,
    setTempMarker,
    setFocusGeometry,
    setHighlightedFeatureId,
    setInspectorOpen,
  } = useMapStore();
  const { setSelectedFeature } = useLayerStore();
  const { openModal: openFeedbackModal } = useFeedbackStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isListening, setIsListening] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUser = authApi.getStoredUser();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nd_language', nextLang);
    }
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
      setIsSearchOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      searchApi
        .universalSearch(queryStr, activeCity?.id)
        .then((res) => {
          setSearchResults(res.results || []);
          setIsSearchOpen(true);
          setSelectedIndex(-1);
        })
        .catch((err) => {
          console.warn('[Search error]', err);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 200);

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

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(i18n.language === 'hi' ? 'आपके ब्राउज़र में आवाज़ पहचान समर्थित नहीं है।' : 'Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Voice input error', err);
      setIsListening(false);
    }
  };

  const handleSelectSearchResult = (item: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);

    if (item.type === 'coordinate' && item.coordinates) {
      setTempMarker(item.coordinates);
      setFocusGeometry({
        type: 'Point',
        coordinates: item.coordinates,
      });
      setSelectedFeature({
        name_en: item.title,
        name_hi: item.title,
        category: 'geographic_coordinate',
        properties: {
          latitude: item.coordinates[1],
          longitude: item.coordinates[0],
          coordinate_format: 'WGS84 (EPSG:4326)',
        },
        source_attribution_en: 'Direct Coordinate Lookup',
        source_health: 'healthy',
        latitude: item.coordinates[1],
        longitude: item.coordinates[0],
      });
      setInspectorOpen(true);
    } else if (item.type === 'city' && item.city_id) {
      const foundCity = cities.find((c) => c.id === item.city_id);
      if (foundCity) {
        setActiveCity(foundCity);
      }
    } else if (item.type === 'ward') {
      if (item.geometry) {
        setFocusGeometry(item.geometry);
      }
      if (item.coordinates) {
        setTempMarker(item.coordinates);
      }
      setActiveWard({
        id: item.id,
        city_id: item.city_id || activeCity?.id || '',
        ward_number: 1,
        name_en: item.title,
        name_hi: item.title,
        geometry: item.geometry,
      });
    } else if (item.type === 'feature' || item.type === 'external_place') {
      if (item.geometry) {
        setFocusGeometry(item.geometry);
      } else if (item.coordinates) {
        setTempMarker(item.coordinates);
      }

      setHighlightedFeatureId(item.id);

      setSelectedFeature({
        feature_id: item.id,
        name_en: item.title,
        name_hi: item.title,
        category: item.category || 'civic_feature',
        properties: item.properties || { name: item.title, category: item.category },
        provenance_type: (item as any).provenance_type || 'community_open',
        source_attribution_en: (item as any).source_attribution_en || 'Madhya Pradesh Spatial Registry',
        source_health: 'healthy',
        last_updated: (item as any).last_updated || new Date().toISOString(),
        latitude: item.coordinates ? item.coordinates[1] : undefined,
        longitude: item.coordinates ? item.coordinates[0] : undefined,
        geometry: item.geometry,
      });
      setInspectorOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectSearchResult(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelectSearchResult(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const renderResultIcon = (item: SearchResult) => {
    if (item.type === 'coordinate') return <Compass className="w-4 h-4 text-cyan-400" />;
    if (item.type === 'city') return <MapPin className="w-4 h-4 text-emerald-400" />;
    if (item.type === 'ward') return <Layers className="w-4 h-4 text-blue-400" />;

    const cat = (item.category || '').toLowerCase();
    if (cat.includes('health') || cat.includes('hospital') || cat.includes('clinic')) {
      return <Activity className="w-4 h-4 text-rose-400" />;
    }
    if (cat.includes('edu') || cat.includes('school') || cat.includes('college')) {
      return <GraduationCap className="w-4 h-4 text-emerald-400" />;
    }
    if (cat.includes('safety') || cat.includes('police') || cat.includes('fire')) {
      return <ShieldCheck className="w-4 h-4 text-purple-400" />;
    }
    if (cat.includes('road') || cat.includes('highway') || cat.includes('transport')) {
      return <Navigation className="w-4 h-4 text-amber-400" />;
    }
    if (cat.includes('park') || cat.includes('garden')) {
      return <Trees className="w-4 h-4 text-emerald-300" />;
    }
    return <Building className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <header className="h-16 bg-[#0B132B]/95 border-b border-[#2E3D60] px-4 lg:px-6 flex items-center justify-between select-none z-30 relative backdrop-blur-md">
      {/* Brand & MP City Selector */}
      <div className="flex items-center gap-3 lg:gap-5">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {i18n.language === 'hi' ? 'नगरदृष्टि' : 'NagarDrishti'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                MP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none hidden sm:block">
              {i18n.language === 'hi' ? 'मध्य प्रदेश नागरिक भूसूचना पोर्टल' : 'Civic Geospatial & Grievance Portal'}
            </p>
          </div>
        </a>

        {/* Global MP City Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsCityMenuOpen(!isCityMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] hover:border-cyan-500/50 rounded-lg text-xs font-semibold transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{i18n.language === 'hi' ? activeCity?.name_hi : activeCity?.name_en}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isCityMenuOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-52 bg-[#1C2541] border border-[#2E3D60] rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-[#2E3D60]">
                {i18n.language === 'hi' ? 'मध्य प्रदेश शहर' : 'Madhya Pradesh Cities'}
              </div>
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#253258] transition-colors ${
                    activeCity?.id === city.id ? 'text-cyan-400 bg-cyan-950/30 font-semibold' : 'text-slate-200'
                  }`}
                >
                  <div>
                    <span>{i18n.language === 'hi' ? city.name_hi : city.name_en}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({city.slug})</span>
                  </div>
                  {activeCity?.id === city.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Universal Search Input */}
      <div ref={searchContainerRef} className="flex-1 max-w-md mx-3 lg:mx-6 relative hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setIsSearchOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              i18n.language === 'hi'
                ? `सड़क, अस्पताल, स्कूल या निर्देशांक खोजें (${activeCity?.name_hi || 'ग्वालियर'})...`
                : `Search roads, hospitals, schools in ${activeCity?.name_en || 'Gwalior'}...`
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
              onClick={handleVoiceSearch}
              title={isListening ? 'Listening...' : (i18n.language === 'hi' ? 'ध्वनि खोज (हिंदी/अंग्रेजी)' : 'Voice Search (Hindi/English)')}
              className={`p-1 rounded-full transition-colors ${
                isListening ? 'text-rose-400 bg-rose-500/20 animate-pulse' : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#1C2541] border border-[#2E3D60] rounded-lg shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
            <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-cyan-400 tracking-wider bg-[#131B33] border-b border-[#2E3D60] flex items-center justify-between">
              <span>{i18n.language === 'hi' ? 'खोज परिणाम' : 'Search Results'} ({searchResults.length})</span>
              <span className="text-slate-400 font-normal">Use ↑↓ and Enter</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isSearching ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Searching PostGIS & Open Data...</span>
                  </div>
                ) : (
                  <span>No civic features or places matched '{searchQuery}' in {activeCity?.name_en || 'this area'}.</span>
                )}
              </div>
            ) : (
              searchResults.map((res, idx) => (
                <button
                  key={res.id || idx}
                  onClick={() => handleSelectSearchResult(res)}
                  className={`w-full text-left px-3.5 py-2.5 border-b border-[#2E3D60]/50 last:border-0 flex items-start gap-3 transition-colors ${
                    selectedIndex === idx ? 'bg-[#253258] ring-1 ring-cyan-500/50' : 'hover:bg-[#253258]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {renderResultIcon(res)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-100 truncate">{res.title}</p>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 font-mono">
                        {res.category || res.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{res.subtitle}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Navigation Links for Public Portal */}
      <nav className="flex items-center gap-1.5 lg:gap-2">
        <a
          href="/"
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-[#1C2541] rounded-lg transition-colors hidden sm:block"
        >
          {i18n.language === 'hi' ? 'मानचित्र' : 'Explore Map'}
        </a>

        <a
          href="/report"
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-[#1C2541] rounded-lg transition-colors hidden lg:block"
        >
          {i18n.language === 'hi' ? 'शिकायत दर्ज करें' : 'Report Issue'}
        </a>

        <a
          href="/my-reports"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-[#1C2541] rounded-lg transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>{i18n.language === 'hi' ? 'मेरी रिपोर्ट्स' : 'My Reports'}</span>
        </a>

        <a
          href="/insights"
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-[#1C2541] rounded-lg transition-colors hidden xl:block"
        >
          {i18n.language === 'hi' ? 'नागरिक आंकड़े' : 'Insights'}
        </a>

        <a
          href="/about"
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:bg-[#1C2541] rounded-lg transition-colors hidden xl:block"
        >
          {i18n.language === 'hi' ? 'परिचय' : 'About'}
        </a>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title="Toggle Hindi / English"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-xs font-semibold text-slate-200 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{i18n.language === 'hi' ? 'English' : 'हिंदी'}</span>
        </button>

        {/* Portal Separator & Official Login */}
        <div className="pl-2 border-l border-[#2E3D60] flex items-center gap-1.5">
          {currentUser && currentUser.role !== 'citizen' ? (
            <a
              href="/gov/overview"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 transition-colors"
              title="Return to Government Administration Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gov Portal</span>
            </a>
          ) : (
            <a
              href="/login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-lg text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-colors"
              title="Official / Administrative Login"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">{i18n.language === 'hi' ? 'अधिकारी प्रवेश' : 'Official Portal'}</span>
            </a>
          )}
        </div>
      </nav>
    </header>
  );
};

