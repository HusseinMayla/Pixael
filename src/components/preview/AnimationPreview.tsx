import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Repeat, StepBack, StepForward, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { usePlaybackStore } from '../../store/playbackStore';
import { useEditorStore } from '../../store/editorStore';
import { renderFrameToCanvas } from '../../domain/exportOperations';
import { Tooltip } from '../ui/Tooltip';

export const AnimationPreview: React.FC = () => {
  const { getActiveAsset, getActiveState, updateAnimationState } = useProjectStore();
  const { toggleRightSidebar } = useEditorStore();
  const {
    isPlaying,
    currentPreviewFrame,
    customFps,
    loop,
    previewZoom,
    pause,
    togglePlay,
    setPreviewFrame,
    stepFrame,
    setCustomFps,
    setLoop,
    setPreviewZoom,
  } = usePlaybackStore();

  const asset = getActiveAsset();
  const state = getActiveState();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fps = customFps !== null ? customFps : (state?.fps || 8);
  const totalFrames = state?.frames.length || 0;

  // Sync state loop property
  useEffect(() => {
    if (state && state.loop !== undefined) {
      setLoop(state.loop);
    }
  }, [state?.id, state?.loop, setLoop]);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) return;

    const intervalTime = 1000 / Math.max(1, fps);
    const timer = setInterval(() => {
      const { currentPreviewFrame: curr, loop: isLooping } = usePlaybackStore.getState();
      if (curr >= totalFrames - 1) {
        if (isLooping) {
          setPreviewFrame(0);
        } else {
          pause();
        }
      } else {
        setPreviewFrame(curr + 1);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, fps, totalFrames, setPreviewFrame, pause]);

  // Render preview frame to canvas
  useEffect(() => {
    if (!canvasRef.current || !asset || !state || totalFrames === 0) return;

    const frameIdx = Math.max(0, Math.min(currentPreviewFrame, totalFrames - 1));
    const frame = state.frames[frameIdx];
    if (!frame) return;

    const offscreen = renderFrameToCanvas(frame, asset.width, asset.height, previewZoom);
    const canvas = canvasRef.current;
    canvas.width = asset.width * previewZoom;
    canvas.height = asset.height * previewZoom;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0);
  }, [asset, state, currentPreviewFrame, previewZoom, totalFrames]);

  if (!asset || !state) {
    return (
      <div className="p-4 text-xs text-slate-500 text-center">
        No active animation
      </div>
    );
  }

  const handleFpsChange = (newFps: number) => {
    const clamped = Math.max(1, Math.min(30, newFps));
    setCustomFps(clamped);
    updateAnimationState(asset.id, state.id, { fps: clamped });
  };

  const handleLoopToggle = () => {
    const newLoop = !loop;
    setLoop(newLoop);
    updateAnimationState(asset.id, state.id, { loop: newLoop });
  };

  return (
    <div className="bg-studio-900/95 border border-studio-800 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 sm:gap-3 shadow-lg backdrop-blur-sm">
      {/* Title & State Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-slate-200">Preview</span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-studio-800 border border-studio-700 text-accent-cyan rounded truncate">
            {state.name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            {totalFrames > 0 ? `${currentPreviewFrame + 1}/${totalFrames}` : '0/0'}
          </div>
          <button
            onClick={() => toggleRightSidebar(false)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-studio-800 xl:hidden"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="relative flex items-center justify-center p-4 bg-studio-950/80 border border-studio-800/80 rounded-lg min-h-[140px] overflow-hidden group">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#2d3446_1px,transparent_1px)] [background-size:12px_12px] opacity-30" />

        <canvas
          ref={canvasRef}
          className="relative z-10 drop-shadow-md pixelated transition-transform duration-75"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Viewport Zoom Overlay Controls */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-studio-900/90 border border-studio-700/70 rounded-md p-0.5">
          <button
            onClick={() => setPreviewZoom(previewZoom - 1)}
            disabled={previewZoom <= 2}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-studio-800"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono px-1 text-slate-300">{previewZoom}x</span>
          <button
            onClick={() => setPreviewZoom(previewZoom + 1)}
            disabled={previewZoom >= 12}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-studio-800"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Playback Transport Controls */}
      <div className="flex items-center justify-between gap-1 px-1">
        <div className="flex items-center gap-1">
          <Tooltip content="Step Back Frame" shortcut=",">
            <button
              onClick={() => stepFrame(-1, totalFrames)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
            >
              <StepBack className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
            <button
              onClick={() => togglePlay(totalFrames)}
              className={`p-2 rounded-lg font-medium transition-all ${
                isPlaying
                  ? 'bg-accent-600/20 text-accent-500 border border-accent-500/40 hover:bg-accent-600/30'
                  : 'bg-studio-800 text-white hover:bg-studio-700'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </Tooltip>

          <Tooltip content="Step Forward Frame" shortcut=".">
            <button
              onClick={() => stepFrame(1, totalFrames)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
            >
              <StepForward className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Restart From Frame 1">
            <button
              onClick={() => setPreviewFrame(0)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        <Tooltip content={loop ? 'Loop Enabled' : 'Play Once'}>
          <button
            onClick={handleLoopToggle}
            className={`p-1.5 rounded-lg transition-all ${
              loop
                ? 'bg-accent-500/20 border border-accent-500/50 text-accent-500'
                : 'bg-studio-800/60 border border-studio-700/60 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Speed (FPS) Control Slider */}
      <div className="space-y-1.5 pt-1 border-t border-studio-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Speed</span>
          <span className="font-mono text-accent-500 text-xs font-semibold">{fps} FPS</span>
        </div>
        <input
          type="range"
          min="1"
          max="24"
          value={fps}
          onChange={(e) => handleFpsChange(parseInt(e.target.value) || 8)}
          className="w-full h-1.5 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-accent-500"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>1 FPS</span>
          <span>8 FPS</span>
          <span>16 FPS</span>
          <span>24 FPS</span>
        </div>
      </div>
    </div>
  );
};
