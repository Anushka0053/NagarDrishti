import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Copy, Check, X } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useLayerStore } from '../../store/layerStore';

export const CoordinatesBar: React.FC = () => {
  const { i18n } = useTranslation();
  const {
    cursorCoordinates,
    clickCoordinates,
    currentZoom,
    activeCity,
    activeWard,
    setActiveWard,
    activeTool,
    resolvedLocation,
  } = useMapStore();
  const { activeLayerIds } = useLayerStore();
  const [copied, setCopied] = useState(false);

  const [lng, lat] = clickCoordinates || cursorCoordinates;

  const handleCopyCoords = () => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="absolute bottom-12 left-4 right-4 z-10 flex items-center justify-between pointer-events-none select-none text-[11px] font-mono">
      {/* Left: Administrative Context (City, Ward, Mode) */}
      <div className="bg-[#0B132B]/90 border border-[#2E3D60] rounded-md px-3 py-1.5 flex items-center gap-2.5 shadow-lg pointer-events-auto backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>{activeCity ? (i18n.language === 'hi' ? activeCity.name_hi : activeCity.name_en) : 'Madhya Pradesh'}</span>
        </div>

        {activeWard && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px]">
            <span>Ward {activeWard.ward_number}: {i18n.language === 'hi' ? activeWard.name_hi : activeWard.name_en}</span>
            <button
              onClick={() => setActiveWard(null)}
              title="Clear Ward Selection"
              className="hover:text-white ml-1 text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {resolvedLocation && !activeWard && resolvedLocation.ward_en && (
          <div className="text-[10px] text-slate-400 hidden sm:inline">
            • {resolvedLocation.ward_en}
          </div>
        )}

        {activeTool !== 'idle' && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            Mode: {activeTool}
          </div>
        )}
      </div>

      {/* Right: Coordinates, Copy Button, Zoom & Active Layers */}
      <div className="bg-[#0B132B]/90 border border-[#2E3D60] rounded-md px-3 py-1.5 flex items-center gap-3.5 shadow-lg pointer-events-auto text-slate-300 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold">{lat.toFixed(5)}° N, {lng.toFixed(5)}° E</span>
          <button
            onClick={handleCopyCoords}
            title="Copy Coordinates (WGS84 Lat, Lng)"
            className="p-1 hover:bg-[#1C2541] rounded text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-1 border-l border-[#2E3D60] pl-3">
          <span className="text-slate-500">Zoom:</span>
          <span className="text-cyan-400 font-semibold">{currentZoom.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-1.5 border-l border-[#2E3D60] pl-3 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
          <span>{activeLayerIds.size} Active</span>
        </div>
      </div>
    </div>
  );
};
