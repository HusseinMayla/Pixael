import React, { useState } from 'react';
import { X, Sparkles, Box } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { useToast } from '../ui/Toast';
import { PRESET_PALETTES } from '../../constants/palettes';
import { trackMilestone } from '../../utils/telemetry';

const DIMENSION_PRESETS = [
  { label: '16 × 16', w: 16, h: 16, desc: 'Classic Retro' },
  { label: '24 × 24', w: 24, h: 24, desc: 'Medium Sprite' },
  { label: '32 × 32', w: 32, h: 32, desc: 'Standard Character' },
  { label: '48 × 48', w: 48, h: 48, desc: 'Detailed Hero' },
  { label: '64 × 64', w: 64, h: 64, desc: 'Boss / High Detail' },
];

const CATEGORIES = ['Characters', 'Enemies', 'Environment', 'Items & Props', 'Effects', 'UI Icons'];

export const NewAssetModal: React.FC = () => {
  const { createAsset } = useProjectStore();
  const { closeModal } = useEditorStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Characters');
  const [width, setWidth] = useState(16);
  const [height, setHeight] = useState(16);
  const [selectedPaletteId, setSelectedPaletteId] = useState('pixel-game');
  const [template, setTemplate] = useState<'rpg' | 'single' | 'action'>('rpg');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const assetName = name.trim() || 'New Sprite';
    const chosenPalette = PRESET_PALETTES.find(p => p.id === selectedPaletteId)?.colors;

    let starterStates: string[] = ['Idle'];
    if (template === 'rpg') {
      starterStates = ['Idle', 'Walk', 'Attack'];
    } else if (template === 'action') {
      starterStates = ['Idle', 'Run', 'Jump', 'Hurt', 'Death'];
    }

    createAsset({
      name: assetName,
      category,
      width,
      height,
      palette: chosenPalette,
      starterStates,
    });

    showToast(`Created asset "${assetName}" (${width}×${height})`, 'success');
    trackMilestone('ASSET_CREATED', {
      assetName,
      category,
      dimensions: `${width}x${height}`,
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80">
      <div className="bg-studio-900 border border-studio-750 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-studio-800 bg-studio-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-500">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">New Sprite Asset</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Setup dimensions, animation states, and palette</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Archer"
                autoFocus
                className="w-full px-3 py-1.5 sm:py-2 text-sm bg-studio-950 border border-studio-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 text-sm bg-studio-950 border border-studio-700 rounded-lg text-white focus:outline-none focus:border-accent-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Dimensions</span>
              <span className="text-accent-500 font-mono text-xs">{width} × {height} px</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {DIMENSION_PRESETS.map((preset) => {
                const isSelected = width === preset.w && height === preset.h;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setWidth(preset.w);
                      setHeight(preset.h);
                    }}
                    className={`py-1.5 sm:py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-accent-500/20 border-accent-500 text-white shadow-glow-sm'
                        : 'bg-studio-800/60 border-studio-700/60 text-slate-300 hover:bg-studio-800 hover:text-white'
                    }`}
                  >
                    <div className="font-mono text-[11px] sm:text-xs">{preset.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animation Starter Template */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Template</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setTemplate('rpg')}
                className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all ${
                  template === 'rpg'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:bg-studio-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">RPG</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Idle, Walk, Attack</div>
              </button>
              <button
                type="button"
                onClick={() => setTemplate('action')}
                className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all ${
                  template === 'action'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:bg-studio-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">Action</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Run, Jump, Death</div>
              </button>
              <button
                type="button"
                onClick={() => setTemplate('single')}
                className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all ${
                  template === 'single'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:bg-studio-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">Static</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Single Frame</div>
              </button>
            </div>
          </div>

          {/* Starter Palette */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Palette</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PALETTES.slice(0, 4).map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => setSelectedPaletteId(pal.id)}
                  className={`p-2 sm:p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    selectedPaletteId === pal.id
                      ? 'bg-accent-500/15 border-accent-500 text-white'
                      : 'bg-studio-800/40 border-studio-700/60 text-slate-300 hover:bg-studio-800'
                  }`}
                >
                  <span className="text-xs font-medium truncate">{pal.name}</span>
                  <div className="flex gap-0.5 shrink-0">
                    {pal.colors.slice(0, 4).map((c, i) => (
                      <span key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 sm:pt-4 border-t border-studio-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-studio-800 hover:bg-studio-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-medium text-white bg-accent-600 hover:bg-accent-500 rounded-lg shadow-glow-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
