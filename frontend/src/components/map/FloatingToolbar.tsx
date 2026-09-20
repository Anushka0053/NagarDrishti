import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Minus, 
  Crosshair, 
  MousePointerClick, 
  CircleDot, 
  Radar, 
  Route, 
  Ruler, 
  SplitSquareVertical, 
  Trash2, 
  Maximize2 
} from 'lucide-react';
import { useMapStore, GISTool } from '../../store/mapStore';

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
  const { activeTool, setActiveTool } = useMapStore();

  const handleToolClick = (tool: GISTool) => {
    setActiveTool(activeTool === tool ? 'idle' : tool);
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 select-none">
      {/* Navigation Group */}
      <div className="bg-[#0B132B]/90 border border-[#2E3D60] rounded-lg p-1 flex flex-col gap-1 shadow-lg backdrop-blur-md">
        <button
          onClick={onZoomIn}
          title={t('toolbar.zoom_in')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title={t('toolbar.zoom_out')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-[#2E3D60] mx-1" />
        <button
          onClick={onLocateUser}
          title={t('toolbar.my_location')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* GIS Analysis Tools Group */}
      <div className="bg-[#0B132B]/90 border border-[#2E3D60] rounded-lg p-1 flex flex-col gap-1 shadow-lg backdrop-blur-md">
        <button
          onClick={() => handleToolClick('identify')}
          title={t('toolbar.identify')}
          className={`p-2 rounded transition-all ${
            activeTool === 'identify'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
              : 'text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541]'
          }`}
        >
          <MousePointerClick className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleToolClick('buffer')}
          title={t('toolbar.buffer')}
          className={`p-2 rounded transition-all ${
            activeTool === 'buffer'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541]'
          }`}
        >
          <CircleDot className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleToolClick('proximity')}
          title={t('toolbar.proximity')}
          className={`p-2 rounded transition-all ${
            activeTool === 'proximity'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541]'
          }`}
        >
          <Radar className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleToolClick('route')}
          title={t('toolbar.route')}
          className={`p-2 rounded transition-all ${
            activeTool === 'route'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541]'
          }`}
        >
          <Route className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleToolClick('measure')}
          title={t('toolbar.measure')}
          className={`p-2 rounded transition-all ${
            activeTool === 'measure'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541]'
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleToolClick('compare')}
          title={t('toolbar.compare')}
          className={`p-2 rounded transition-all ${
            activeTool === 'compare'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541]'
          }`}
        >
          <SplitSquareVertical className="w-4 h-4" />
        </button>

        <div className="h-px bg-[#2E3D60] mx-1" />

        <button
          onClick={() => setActiveTool('idle')}
          title={t('toolbar.clear')}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#1C2541] rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          title={t('toolbar.fullscreen')}
          className="p-2 text-slate-200 hover:text-cyan-400 hover:bg-[#1C2541] rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
