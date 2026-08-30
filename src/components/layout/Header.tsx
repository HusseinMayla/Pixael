import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Scaling,
  Plus,
  Undo2,
  Redo2,
  Keyboard,
  RotateCcw,
  Check,
  Edit2,
  HardDrive,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '../ui/Toast';

export const Header: React.FC = () => {
  const {
    project,
    setProjectName,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToDefault,
    isSaving,
  } = useProjectStore();

  const { openModal } = useEditorStore();
  const { showToast } = useToast();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(project.name);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setProjectName(tempName.trim());
      showToast(`Updated project name to "${tempName.trim()}"`, 'info');
    }
    setIsEditingName(false);
  };

  const handleReset = async () => {
    if (window.confirm('Reset project back to default sample assets? Any unsaved edits will be replaced.')) {
      await resetToDefault();
      showToast('Reset project to default sample assets', 'success');
    }
  };

  return (
    <header className="h-14 bg-studio-900/95 border-b border-studio-800 px-4 flex items-center justify-between gap-4 select-none z-30 shadow-md backdrop-blur-md">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-accent-600 to-accent-cyan shadow-glow-sm">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-white uppercase">
            Game Asset Studio
          </span>
        </div>

        <div className="h-4 w-px bg-studio-750" />

        {/* Project Name */}
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              autoFocus
              className="px-2 py-1 text-xs bg-studio-950 border border-accent-500 rounded text-white font-medium focus:outline-none"
            />
            <button
              onClick={handleSaveName}
              className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-studio-800"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setTempName(project.name);
              setIsEditingName(true);
            }}
            className="group flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-studio-800 cursor-pointer transition-colors"
          >
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
              {project.name}
            </span>
            <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Center / Action Toolbar */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-studio-950/80 border border-studio-800 rounded-lg p-0.5">
          <Tooltip content="Undo" shortcut="Ctrl+Z">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-20 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Redo" shortcut="Ctrl+Y">
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-20 transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Resize Canvas Modal Trigger */}
        <Tooltip content="Resize Sprite Canvas Dimensions">
          <button
            onClick={() => openModal('resize')}
            className="px-2.5 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-750 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Scaling className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Resize</span>
          </button>
        </Tooltip>

        {/* New Asset Modal Trigger */}
        <button
          onClick={() => openModal('new-asset')}
          className="px-3 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-750 border border-studio-700 hover:border-accent-500 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-accent-500" />
          <span>New Asset</span>
        </button>

        {/* Export Modal Trigger */}
        <button
          onClick={() => openModal('export')}
          className="px-3.5 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold transition-all shadow-glow-sm flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* Right Utility & Status */}
      <div className="flex items-center gap-2">
        {/* Persistence Status indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono pr-2">
          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
          <span className={isSaving ? 'text-accent-amber animate-pulse' : 'text-slate-400'}>
            {isSaving ? 'Saving...' : 'IndexedDB Synced'}
          </span>
        </div>

        {/* Shortcuts */}
        <Tooltip content="Keyboard Shortcuts">
          <button
            onClick={() => openModal('shortcuts')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-studio-800 rounded-lg transition-colors border border-transparent hover:border-studio-700"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Reset Demo Data */}
        <Tooltip content="Reset to Starter Assets">
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
