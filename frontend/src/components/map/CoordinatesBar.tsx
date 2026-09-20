import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Layers, CheckCircle2, Shield } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useLayerStore } from '../../store/layerStore';

export const CoordinatesBar: React.FC = () => {
  const { i18n } = useTranslation();
  const { cursorCoordinates, currentZoom, activeCity, activeTool } = useMapStore();
  const { activeLayerIds } = useLayerStore();

  const [lng, lat] = cursorCoordinates;

  return (
    <div className="absolute bottom-12 left-4 right-4 z-10 flex items-center justify-between pointer-events-none select-none text-[11px] font-mono">
      {/* Left: Active City & Tool Mode Indicator */}
      <div className="bg-[#0B132B]/90 border border-[#2E3D60] rounded-md px-3 py-1 flex items-center gap-3 shadow-lg pointer-events-auto backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>{activeCity ? (i18n.language === 'hi' ? activeCity.name_hi : activeCity.name_en) : 'Gwalior'}</span>
        </div>

        {activeTool !== 'idle' && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            Mode: {activeTool}
          </div>
        )}
      </div>

      {/* Right: Coordinates, Zoom, Layers and Health */}
      <div className="bg-[#0B132B]/90 border border-[#2E3D60] rounded-md px-3 py-1 flex items-center gap-4 shadow-lg pointer-events-auto text-slate-300 backdrop-blur-md">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Lat:</span>
          <span className="text-slate-200 font-semibold">{lat.toFixed(5)}° N</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-500">Lng:</span>
          <span className="text-slate-200 font-semibold">{lng.toFixed(5)}° E</span>
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
