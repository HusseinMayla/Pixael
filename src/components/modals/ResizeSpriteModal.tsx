import React, { useState } from 'react';
import { X, Scaling, ArrowUpLeft, AlignCenter } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { useToast } from '../ui/Toast';

export const ResizeSpriteModal: React.FC = () => {
  const { getActiveAsset, resizeSprite } = useProjectStore();
  const { closeModal } = useEditorStore();
  const { showToast } = useToast();

  const asset = getActiveAsset();
  const [width, setWidth] = useState(asset?.width || 16);
  const [height, setHeight] = useState(asset?.height || 16);
  const [lockAspect, setLockAspect] = useState(true);
  const [anchor, setAnchor] = useState<'center' | 'top-left'>('center');

  if (!asset) return null;

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect) {
      const ratio = asset.height / asset.width;
      setHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect) {
      const ratio = asset.width / asset.height;
      setWidth(Math.round(val * ratio));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (width <= 0 || height <= 0) return;

    resizeSprite(asset.id, width, height, anchor);
    showToast(`Resized sprite "${asset.name}" to ${width}×${height}`, 'info');
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-studio-900 border border-studio-700/80 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-800 bg-studio-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-500">
              <Scaling className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Resize Sprite Canvas</h2>
              <p className="text-xs text-slate-400">Current size: {asset.width} × {asset.height} px</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Width (pixels)</label>
              <input
                type="number"
                min="4"
                max="128"
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 text-sm font-mono bg-studio-950 border border-studio-700 rounded-lg text-white focus:outline-none focus:border-accent-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Height (pixels)</label>
              <input
                type="number"
                min="4"
                max="128"
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 text-sm font-mono bg-studio-950 border border-studio-700 rounded-lg text-white focus:outline-none focus:border-accent-500"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2">
            {[16, 24, 32, 48, 64].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  setWidth(sz);
                  setHeight(sz);
                }}
                className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors ${
                  width === sz && height === sz
                    ? 'bg-accent-500/20 border-accent-500 text-white'
                    : 'bg-studio-800/60 border-studio-700/60 text-slate-400 hover:text-white'
                }`}
              >
                {sz}×{sz}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Lock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
              className="w-4 h-4 rounded border-studio-600 text-accent-600 bg-studio-950"
            />
            <span>Maintain Aspect Ratio</span>
          </label>

          {/* Anchor placement */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Placement Anchor</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAnchor('center')}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                  anchor === 'center'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <AlignCenter className="w-4 h-4 text-accent-500" />
                <div>
                  <div className="text-xs font-medium">Center Anchor</div>
                  <div className="text-[10px] text-slate-500">Expands symmetrically</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAnchor('top-left')}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                  anchor === 'top-left'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpLeft className="w-4 h-4 text-accent-500" />
                <div>
                  <div className="text-xs font-medium">Top-Left Anchor</div>
                  <div className="text-[10px] text-slate-500">Preserves coordinates</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-studio-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-studio-800 hover:bg-studio-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-accent-600 hover:bg-accent-500 rounded-lg shadow-glow-sm transition-all"
            >
              Apply Resize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
