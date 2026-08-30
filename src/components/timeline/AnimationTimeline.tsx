import React from 'react';
import { Plus, CopyPlus, Play, Pause } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { usePlaybackStore } from '../../store/playbackStore';
import { StateManager } from './StateManager';
import { FrameCard } from './FrameCard';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '../ui/Toast';

export const AnimationTimeline: React.FC = () => {
  const {
    getActiveAsset,
    getActiveState,
    project,
    selectFrame,
    addFrame,
    duplicateFrame,
    deleteFrame,
    reorderFrames,
  } = useProjectStore();
  const { isPlaying, togglePlay } = usePlaybackStore();
  const { showToast } = useToast();

  const asset = getActiveAsset();
  const state = getActiveState();

  if (!asset || !state) return null;

  const handleAddFrame = (copyPrevious = false) => {
    addFrame(asset.id, state.id, undefined, copyPrevious);
    showToast(copyPrevious ? 'Duplicated into new frame' : 'Added blank frame', 'info');
  };

  return (
    <div className="bg-studio-900/95 border-t border-studio-800 p-2 sm:p-3 flex flex-col gap-2 shadow-2xl backdrop-blur-md shrink-0">
      {/* Top Bar: State Selector & Timeline Stats */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-studio-800/80 pb-1.5 sm:pb-2">
        <StateManager />

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Tooltip content={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
            <button
              onClick={() => togglePlay(state.frames.length)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isPlaying
                  ? 'bg-accent-500/20 border-accent-500 text-accent-500'
                  : 'bg-studio-800 border-studio-700 text-slate-300 hover:text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="hidden xs:inline">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </Tooltip>

          <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 bg-studio-950 px-1.5 sm:px-2 py-1 rounded border border-studio-800">
            {project.activeFrameIndex + 1} / {state.frames.length}
          </span>
        </div>
      </div>

      {/* Frame Strip */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 sm:py-1 scrollbar-thin">
        {state.frames.map((frame, index) => (
          <FrameCard
            key={frame.id}
            frame={frame}
            index={index}
            totalFrames={state.frames.length}
            isActive={index === project.activeFrameIndex}
            width={asset.width}
            height={asset.height}
            onSelect={() => selectFrame(index)}
            onDuplicate={() => duplicateFrame(asset.id, state.id, index)}
            onDelete={() => deleteFrame(asset.id, state.id, index)}
            onMoveLeft={() => reorderFrames(asset.id, state.id, index, index - 1)}
            onMoveRight={() => reorderFrames(asset.id, state.id, index, index + 1)}
          />
        ))}

        {/* Add Frame Action Buttons */}
        <div className="flex flex-col gap-1 shrink-0 pl-1">
          <Tooltip content="Add Blank Frame" position="top">
            <button
              onClick={() => handleAddFrame(false)}
              className="px-2.5 py-1.5 rounded-lg bg-studio-800/80 hover:bg-studio-750 border border-studio-700/80 hover:border-accent-500 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-accent-500" />
              <span>+ Blank</span>
            </button>
          </Tooltip>

          <Tooltip content="Duplicate Active Frame" position="top">
            <button
              onClick={() => handleAddFrame(true)}
              className="px-2.5 py-1 rounded-lg bg-studio-850/60 hover:bg-studio-800 border border-studio-800 hover:border-studio-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-all flex items-center gap-1.5"
            >
              <CopyPlus className="w-3 h-3 text-accent-cyan" />
              <span>+ Copy</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
