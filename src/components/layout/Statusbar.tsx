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
    <footer className="h-7 bg-studio-950 border-t border-studio-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none z-30 font-mono">
      {/* Left Info Badges */}
      <div className="flex items-center gap-4">
        {/* Dimensions */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Scaling className="w-3.5 h-3.5 text-accent-500" />
          <span>{asset.width} × {asset.height} px</span>
        </div>

        <span className="text-studio-700">|</span>

        {/* State & Frame */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Film className="w-3.5 h-3.5 text-accent-cyan" />
          <span>
            {state ? `${state.name} [Frame ${project.activeFrameIndex + 1}/${state.frames.length}]` : 'No State'}
          </span>
        </div>

        <span className="text-studio-700">|</span>

        {/* Tool */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 capitalize">Tool:</span>
          <span className="text-white font-semibold capitalize">{currentTool}</span>
          {currentTool === 'pencil' || currentTool === 'eraser' ? (
            <span className="text-slate-500">({brushSize}px)</span>
          ) : null}
        </div>
      </div>

      {/* Right Zoom & Shortcuts Helper */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-slate-400">
          <Info className="w-3 h-3 text-slate-500" />
          <span>Space + Drag to Pan • Wheel to Zoom</span>
        </div>

        <span className="text-studio-700">|</span>

        <div className="flex items-center gap-1.5 text-slate-300">
          <ZoomIn className="w-3.5 h-3.5 text-accent-500" />
          <span>{zoom * 100}%</span>
        </div>
      </div>
    </footer>
  );
};
