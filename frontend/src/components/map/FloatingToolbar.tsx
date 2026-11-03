import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Minus, 
  Crosshair, 
  Maximize2,
  RotateCcw
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

interface FloatingToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateUser: () => void;
  onToggleFullscreen: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onLocateUser,
  onToggleFullscreen,
}) => {
  const { t } = useTranslation();
  const { activeTool, clearAnalysis } = useMapStore();

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 select-none">
      {/* Essential Navigation Controls */}
      <div className="bg-[#0B132B]/90 border border-[#2E3D60] rounded-xl p-1 flex flex-col gap-0.5 shadow-xl backdrop-blur-md">
        <button
          onClick={onZoomIn}
          title={t('toolbar.zoom_in')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded-lg transition-colors"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title={t('toolbar.zoom_out')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded-lg transition-colors"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-[#2E3D60] mx-1 my-0.5" />
        <button
          onClick={onLocateUser}
          title={t('toolbar.my_location')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded-lg transition-colors"
          aria-label="My Location"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleFullscreen}
          title={t('toolbar.fullscreen')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded-lg transition-colors"
          aria-label="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {activeTool !== 'idle' && (
          <>
            <div className="h-px bg-[#2E3D60] mx-1 my-0.5" />
            <button
              onClick={clearAnalysis}
              title="Clear Active Analysis Tool"
              className="p-2 text-rose-400 hover:text-white hover:bg-rose-600/50 rounded-lg transition-colors"
              aria-label="Clear Tool"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
