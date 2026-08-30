import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { Info, ZoomIn, Scaling, Film } from 'lucide-react';

export const Statusbar: React.FC = () => {
  const { getActiveAsset, getActiveState, project } = useProjectStore();
  const { currentTool, brushSize, zoom } = useEditorStore();

  const asset = getActiveAsset();
  const state = getActiveState();

  if (!asset) return null;

  return (
    <footer className="h-6 sm:h-7 bg-studio-950 border-t border-studio-800/80 px-2 sm:px-4 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 select-none z-30 font-mono overflow-hidden">
      {/* Left Info Badges */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Dimensions */}
        <div className="flex items-center gap-1 text-slate-300 shrink-0">
          <Scaling className="w-3 h-3 text-accent-500" />
          <span>{asset.width}×{asset.height}</span>
        </div>

        <span className="text-studio-700 hidden xs:inline">|</span>

        {/* State & Frame */}
        <div className="flex items-center gap-1 text-slate-300 min-w-0 truncate">
          <Film className="w-3 h-3 text-accent-cyan shrink-0" />
          <span className="truncate">
            {state ? `${state.name} (${project.activeFrameIndex + 1}/${state.frames.length})` : 'No State'}
          </span>
        </div>

        <span className="text-studio-700 hidden sm:inline">|</span>

        {/* Tool */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <span className="text-slate-400 capitalize">{currentTool}</span>
          {currentTool === 'pencil' || currentTool === 'eraser' ? (
            <span className="text-slate-500">({brushSize}px)</span>
          ) : null}
        </div>
      </div>

      {/* Right Zoom & Helpers */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1 text-slate-500 text-[10px]">
          <Info className="w-3 h-3 text-slate-600" />
          <span>Space+Drag Pan • Wheel Zoom</span>
        </div>

        <span className="text-studio-700 hidden md:inline">|</span>

        <div className="flex items-center gap-1 text-slate-300 font-semibold">
          <ZoomIn className="w-3 h-3 text-accent-500" />
          <span>{zoom}x</span>
        </div>
      </div>
    </footer>
  );
};
