import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid, Layers, Disc } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { Tooltip } from '../ui/Tooltip';

export const CanvasControls: React.FC = () => {
  const {
    zoom,
    setZoom,
    resetView,
    showGrid,
    toggleGrid,
    showCheckerboard,
    toggleCheckerboard,
    onionSkinning,
    toggleOnionSkinning,
    brushSize,
    setBrushSize,
  } = useEditorStore();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1.5 p-1 sm:p-1.5 bg-studio-900/90 border border-studio-800 rounded-xl shadow-lg backdrop-blur-md relative z-[31]">
      {/* Brush Size Selector */}
      <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1.5 border-r border-studio-800">
        {[1, 2, 3, 4].map((sz) => (
          <Tooltip key={sz} content={`Brush ${sz}px`} position="bottom">
            <button
              onClick={() => setBrushSize(sz)}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs font-mono font-semibold transition-all ${
                brushSize === sz
                  ? 'bg-accent-500 text-white shadow-glow-sm'
                  : 'bg-studio-800/80 text-slate-400 hover:bg-studio-700 hover:text-white'
              }`}
            >
              {sz}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Grid & Background Toggles */}
      <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 border-r border-studio-800">
        <Tooltip content="Pixel Grid" shortcut="H" position="bottom">
          <button
            onClick={toggleGrid}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
              showGrid
                ? 'bg-accent-500/20 text-accent-500 border border-accent-500/40'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Checkerboard" position="bottom">
          <button
            onClick={toggleCheckerboard}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
              showCheckerboard
                ? 'bg-accent-500/20 text-accent-500 border border-accent-500/40'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <Disc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Onion Skinning" shortcut="O" position="bottom">
          <button
            onClick={toggleOnionSkinning}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
              onionSkinning
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 pl-0.5 sm:pl-1">
        <Tooltip content="Zoom Out" shortcut="-" position="bottom">
          <button
            onClick={() => setZoom((z) => Math.max(4, z - 4))}
            disabled={zoom <= 4}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-30 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>

        <span className="text-[11px] sm:text-xs font-mono text-slate-300 w-8 sm:w-10 text-center select-none font-semibold">
          {zoom}x
        </span>

        <Tooltip content="Zoom In" shortcut="+" position="bottom">
          <button
            onClick={() => setZoom((z) => Math.min(64, z + 4))}
            disabled={zoom >= 64}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-30 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Reset View" shortcut="0" position="bottom">
          <button
            onClick={resetView}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
