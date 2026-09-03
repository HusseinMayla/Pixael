import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Upload,
  Scaling,
  Plus,
  Undo2,
  Redo2,
  Keyboard,
  RotateCcw,
  Check,
  Edit2,
  HardDrive,
  PanelLeft,
  SlidersHorizontal,
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

  const {
    openModal,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useEditorStore();
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
    if (window.confirm('Reset project to default sample assets?')) {
      await resetToDefault();
      showToast('Reset project to default sample assets', 'success');
    }
  };

  return (
    <header className="h-12 sm:h-14 bg-studio-900/95 border-b border-studio-800 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-4 select-none z-30 shadow-md backdrop-blur-md shrink-0">
      {/* Left: Sidebar Toggle & Brand */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* Mobile/Desktop Left Sidebar Toggle */}
        <Tooltip content={isLeftSidebarOpen ? 'Close Assets' : 'Open Assets'}>
          <button
            onClick={() => toggleLeftSidebar()}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isLeftSidebarOpen
                ? 'bg-accent-600/20 border-accent-500/40 text-accent-cyan'
                : 'bg-studio-850 border-studio-750 text-slate-400 hover:text-white'
            }`}
            aria-label="Toggle Assets"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 px-2 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-accent-600 to-accent-cyan shadow-glow-sm shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-[11px] sm:text-xs font-bold tracking-wider text-white uppercase hidden xs:inline">
            Sprites
          </span>
        </div>

        <div className="h-4 w-px bg-studio-750 hidden sm:block" />

        {/* Project Name (Editable & Responsive) */}
        {isEditingName ? (
          <div className="flex items-center gap-1 min-w-0">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              autoFocus
              className="px-2 py-0.5 text-xs bg-studio-950 border border-accent-500 rounded text-white font-medium focus:outline-none w-24 sm:w-40"
            />
            <button
              onClick={handleSaveName}
              className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-studio-800 shrink-0"
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
            className="group flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-studio-800 cursor-pointer transition-colors min-w-0 max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-none"
            title="Click to rename project"
          >
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
              {project.name}
            </span>
            <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hidden sm:block" />
          </div>
        )}
      </div>

      {/* Center / Action Toolbar */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-studio-950/80 border border-studio-800 rounded-lg p-0.5">
          <Tooltip content="Undo" shortcut="Ctrl+Z">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-1 sm:p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-20 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Redo" shortcut="Ctrl+Y">
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-1 sm:p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-20 transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Resize Canvas Modal Trigger */}
        <Tooltip content="Resize Canvas">
          <button
            onClick={() => openModal('resize')}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-750 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Scaling className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="hidden md:inline">Resize</span>
          </button>
        </Tooltip>

        {/* New Asset Modal Trigger */}
        <Tooltip content="New Asset">
          <button
            onClick={() => openModal('new-asset')}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-studio-800 hover:bg-studio-750 border border-studio-700 hover:border-accent-500 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-accent-500" />
            <span className="hidden sm:inline">New Asset</span>
          </button>
        </Tooltip>

        {/* Import Modal Trigger */}
        <Tooltip content="Import Sprite / Project">
          <button
            onClick={() => openModal('import')}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-studio-800 hover:bg-studio-750 border border-studio-700 hover:border-accent-cyan text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </Tooltip>

        {/* Export Modal Trigger */}
        <button
          onClick={() => openModal('export')}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold transition-all shadow-glow-sm flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Export</span>
        </button>
      </div>

      {/* Right Utility & Drawer Toggle */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Persistence Status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono pr-1">
          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
          <span className={isSaving ? 'text-accent-amber animate-pulse' : 'text-slate-400'}>
            {isSaving ? 'Saving...' : 'Saved'}
          </span>
        </div>

        {/* Shortcuts */}
        <Tooltip content="Shortcuts">
          <button
            onClick={() => openModal('shortcuts')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-studio-800 rounded-lg transition-colors border border-transparent hover:border-studio-700 hidden sm:block"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Reset Demo Data */}
        <Tooltip content="Reset Project">
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-900/40 hidden sm:block"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Mobile/Desktop Right Panel Toggle */}
        <Tooltip content={isRightSidebarOpen ? 'Close Preview & Palette' : 'Open Preview & Palette'}>
          <button
            onClick={() => toggleRightSidebar()}
            className={`p-1.5 rounded-lg border transition-colors ${
              isRightSidebarOpen
                ? 'bg-accent-600/20 border-accent-500/40 text-accent-cyan'
                : 'bg-studio-850 border-studio-750 text-slate-400 hover:text-white'
            }`}
            aria-label="Toggle Preview & Palette"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
