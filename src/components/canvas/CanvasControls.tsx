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
    <div className="flex items-center gap-1.5 p-1.5 bg-studio-900/90 border border-studio-800 rounded-xl shadow-lg backdrop-blur-md">
      {/* Brush Size Selector */}
      <div className="flex items-center gap-1 px-1.5 border-r border-studio-800">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider pr-1">Size</span>
        {[1, 2, 3, 4].map((sz) => (
          <Tooltip key={sz} content={`Brush Size ${sz}px`}>
            <button
              onClick={() => setBrushSize(sz)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold transition-all ${
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
      <div className="flex items-center gap-1 px-1 border-r border-studio-800">
        <Tooltip content="Toggle Pixel Grid" shortcut="H">
          <button
            onClick={toggleGrid}
            className={`p-1.5 rounded-lg transition-colors ${
              showGrid
                ? 'bg-accent-500/20 text-accent-500 border border-accent-500/40'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Toggle Transparent Checkerboard">
          <button
            onClick={toggleCheckerboard}
            className={`p-1.5 rounded-lg transition-colors ${
              showCheckerboard
                ? 'bg-accent-500/20 text-accent-500 border border-accent-500/40'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <Disc className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Toggle Onion Skinning (Ghost adjacent frames)" shortcut="O">
          <button
            onClick={toggleOnionSkinning}
            className={`p-1.5 rounded-lg transition-colors ${
              onionSkinning
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 pl-1">
        <Tooltip content="Zoom Out" shortcut="-">
          <button
            onClick={() => setZoom((z) => Math.max(4, z - 4))}
            disabled={zoom <= 4}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-30 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </Tooltip>

        <span className="text-xs font-mono text-slate-300 w-12 text-center select-none font-semibold">
          {zoom}x
        </span>

        <Tooltip content="Zoom In" shortcut="+">
          <button
            onClick={() => setZoom((z) => Math.min(64, z + 4))}
            disabled={zoom >= 64}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-30 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Reset View & Center" shortcut="0">
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors ml-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
