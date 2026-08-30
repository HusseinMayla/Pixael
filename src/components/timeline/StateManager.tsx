import React, { useState } from 'react';
import { Plus, MoreVertical, Edit2, Copy, Trash2, Check, X, Film } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '../ui/Toast';

export const StateManager: React.FC = () => {
  const {
    getActiveAsset,
    project,
    selectAnimationState,
    createAnimationState,
    renameAnimationState,
    duplicateAnimationState,
    deleteAnimationState,
  } = useProjectStore();
  const { showToast } = useToast();

  const asset = getActiveAsset();
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddingState, setIsAddingState] = useState(false);
  const [newStateName, setNewStateName] = useState('');
  const [openMenuStateId, setOpenMenuStateId] = useState<string | null>(null);

  if (!asset) return null;

  const handleStartRename = (stateId: string, currentName: string) => {
    setEditingStateId(stateId);
    setEditName(currentName);
    setOpenMenuStateId(null);
  };

  const handleSaveRename = (stateId: string) => {
    if (editName.trim()) {
      renameAnimationState(asset.id, stateId, editName.trim());
      showToast(`Renamed state to "${editName.trim()}"`, 'info');
    }
    setEditingStateId(null);
  };

  const handleCreateState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStateName.trim()) return;

    const created = createAnimationState(asset.id, {
      name: newStateName.trim(),
      fps: 8,
      loop: true,
      frameCount: 2,
    });

    if (created) {
      showToast(`Created animation state "${created.name}"`, 'success');
    }
    setNewStateName('');
    setIsAddingState(false);
  };

  const handleDuplicate = (stateId: string) => {
    const dup = duplicateAnimationState(asset.id, stateId);
    if (dup) {
      showToast(`Duplicated animation state "${dup.name}"`, 'success');
    }
    setOpenMenuStateId(null);
  };

  const handleDelete = (stateId: string, stateName: string) => {
    if (asset.states.length <= 1) {
      alert('Cannot delete the only remaining animation state.');
      return;
    }
    deleteAnimationState(asset.id, stateId);
    showToast(`Deleted state "${stateName}"`, 'info');
    setOpenMenuStateId(null);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none min-w-0 flex-1">
      <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mr-1 shrink-0">
        <Film className="w-3.5 h-3.5 text-accent-500" />
        <span className="hidden xs:inline">States:</span>
      </div>

      {asset.states.map((st) => {
        const isActive = st.id === project.activeStateId;
        const isEditing = editingStateId === st.id;
        const isMenuOpen = openMenuStateId === st.id;

        return (
          <div key={st.id} className="relative shrink-0 flex items-center">
            {isEditing ? (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-studio-950 border border-accent-500 rounded-lg">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(st.id);
                    if (e.key === 'Escape') setEditingStateId(null);
                  }}
                  autoFocus
                  className="w-16 sm:w-20 px-1 py-0.5 text-xs bg-transparent text-white focus:outline-none"
                />
                <button
                  onClick={() => handleSaveRename(st.id)}
                  className="p-0.5 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditingStateId(null)}
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                className={`group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-accent-500/20 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-900/80 border-studio-800 text-slate-400 hover:bg-studio-850 hover:text-slate-200'
                }`}
                onClick={() => selectAnimationState(asset.id, st.id)}
              >
                <span>{st.name}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-studio-950/60 px-1 rounded">
                  {st.frames.length}f
                </span>

                {/* State Options Menu Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuStateId(isMenuOpen ? null : st.id);
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full mt-1.5 left-0 z-40 bg-studio-900 border border-studio-700/80 rounded-lg shadow-xl py-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => handleStartRename(st.id, st.name)}
                  className="w-full px-3 py-1.5 text-xs text-left text-slate-300 hover:text-white hover:bg-studio-800 flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3 text-accent-500" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => handleDuplicate(st.id)}
                  className="w-full px-3 py-1.5 text-xs text-left text-slate-300 hover:text-white hover:bg-studio-800 flex items-center gap-2"
                >
                  <Copy className="w-3 h-3 text-accent-cyan" />
                  <span>Duplicate</span>
                </button>
                {asset.states.length > 1 && (
                  <button
                    onClick={() => handleDelete(st.id, st.name)}
                    className="w-full px-3 py-1.5 text-xs text-left text-rose-300 hover:text-rose-200 hover:bg-rose-950/60 flex items-center gap-2 border-t border-studio-800 mt-1 pt-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add New State Button / Inline Input */}
      {isAddingState ? (
        <form onSubmit={handleCreateState} className="flex items-center gap-1 px-1.5 py-0.5 bg-studio-950 border border-accent-500 rounded-lg shrink-0">
          <input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="e.g. Jump"
            autoFocus
            className="w-16 sm:w-20 px-1 py-0.5 text-xs bg-transparent text-white focus:outline-none"
          />
          <button type="submit" className="p-0.5 text-emerald-400 hover:text-emerald-300">
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsAddingState(false)}
            className="p-0.5 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <Tooltip content="Add Animation State">
          <button
            onClick={() => setIsAddingState(true)}
            className="p-1 sm:px-2 sm:py-1 rounded-lg bg-studio-900/60 hover:bg-studio-800 border border-dashed border-studio-700 hover:border-accent-500 text-slate-400 hover:text-white transition-colors shrink-0 flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] pr-0.5 hidden xs:inline">+ State</span>
          </button>
        </Tooltip>
      )}
    </div>
  );
};
