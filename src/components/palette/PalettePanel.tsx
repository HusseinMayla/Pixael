import React, { useState } from 'react';
import { Palette, Plus, Trash2, ArrowLeftRight, Sparkles } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { PRESET_PALETTES } from '../../constants/palettes';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '../ui/Toast';

export const PalettePanel: React.FC = () => {
  const { getActiveAsset, setPalette, addPaletteColor, removePaletteColor } = useProjectStore();
  const {
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
    swapColors,
  } = useEditorStore();
  const { showToast } = useToast();

  const asset = getActiveAsset();
  const [customColor, setCustomColor] = useState('#ff77a8');
  const [showPresets, setShowPresets] = useState(false);

  if (!asset) return null;

  const handleAddCustomColor = () => {
    if (!asset) return;
    addPaletteColor(asset.id, customColor);
    setPrimaryColor(customColor);
    showToast(`Added color ${customColor} to palette`, 'info');
  };

  const handleApplyPreset = (presetColors: string[], presetName: string) => {
    if (!asset) return;
    setPalette(asset.id, presetColors);
    setPrimaryColor(presetColors[0] || '#ffffff');
    setShowPresets(false);
    showToast(`Loaded palette "${presetName}"`, 'success');
  };

  return (
    <div className="bg-studio-900/95 border border-studio-800 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 sm:gap-3 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent-500" />
          <span className="text-xs font-semibold text-slate-200">Palette</span>
        </div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-white bg-studio-800 hover:bg-studio-750 border border-studio-700 rounded-md transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-accent-cyan" />
          <span>Presets</span>
        </button>
      </div>

      {/* Preset Palettes Dropdown Drawer */}
      {showPresets && (
        <div className="p-2.5 bg-studio-950/90 border border-studio-750 rounded-lg flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[11px] font-medium text-slate-400 flex justify-between items-center">
            <span>Presets</span>
            <button
              onClick={() => setShowPresets(false)}
              className="text-slate-500 hover:text-slate-300 text-[10px]"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {PRESET_PALETTES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.colors, preset.name)}
                className="flex items-center justify-between p-2 rounded-md bg-studio-850 hover:bg-studio-800 border border-studio-750/70 text-left transition-colors group"
              >
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                  {preset.name}
                </span>
                <div className="flex gap-0.5">
                  {preset.colors.slice(0, 6).map((c, i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-sm border border-black/20"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Active Color Swatches */}
      <div className="flex items-center gap-3 p-2 sm:p-2.5 bg-studio-950/70 border border-studio-800/80 rounded-lg">
        <div className="relative w-11 h-11 flex items-center justify-center">
          {/* Secondary Swatch (Behind) */}
          <div
            className="absolute bottom-0 right-0 w-7 h-7 rounded-md border-2 border-studio-700 shadow-md cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: secondaryColor }}
            title={`Secondary: ${secondaryColor}`}
            onClick={() => setPrimaryColor(secondaryColor)}
          />
          {/* Primary Swatch (Front) */}
          <div
            className="absolute top-0 left-0 w-7 h-7 rounded-md border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: primaryColor }}
            title={`Primary: ${primaryColor}`}
          />
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">HEX</span>
            <span className="text-white font-semibold">{primaryColor.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Swap Primary & Secondary" shortcut="X">
              <button
                onClick={swapColors}
                className="p-1 rounded bg-studio-800 hover:bg-studio-700 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {/* Native HTML Color Input */}
            <input
              type="color"
              value={primaryColor.startsWith('#') ? primaryColor : '#000000'}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-7 h-6 rounded cursor-pointer bg-transparent border-0"
              title="Pick color"
            />
          </div>
        </div>
      </div>

      {/* Palette Swatch Matrix */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Swatches ({asset.palette.length})</span>
          <span className="text-[10px] text-slate-500">L: 1st | R: 2nd</span>
        </div>

        <div className="grid grid-cols-8 gap-1.5 p-2 bg-studio-950/60 border border-studio-800/80 rounded-lg max-h-36 overflow-y-auto">
          {asset.palette.map((colorHex, idx) => {
            const isPrimary = primaryColor.toLowerCase() === colorHex.toLowerCase();
            const isSecondary = secondaryColor.toLowerCase() === colorHex.toLowerCase();

            return (
              <button
                key={`${colorHex}_${idx}`}
                type="button"
                onClick={() => setPrimaryColor(colorHex)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSecondaryColor(colorHex);
                }}
                className={`relative group aspect-square rounded-md border transition-all duration-100 flex items-center justify-center ${
                  isPrimary
                    ? 'border-white ring-2 ring-accent-500/70 scale-105 z-10'
                    : isSecondary
                    ? 'border-accent-cyan ring-1 ring-accent-cyan scale-100'
                    : 'border-black/30 hover:scale-110 hover:border-slate-300'
                }`}
                style={{ backgroundColor: colorHex }}
                title={`${colorHex} (Left click: Primary, Right click: Secondary)`}
              >
                {isPrimary && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add & Remove Color Row */}
      <div className="flex items-center gap-2 pt-1 border-t border-studio-800">
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          placeholder="#hex"
          className="w-20 px-2 py-1 text-xs font-mono bg-studio-950 border border-studio-700 rounded text-slate-200 uppercase"
        />
        <button
          onClick={handleAddCustomColor}
          className="flex-1 py-1 px-2 text-xs font-medium text-white bg-studio-800 hover:bg-studio-700 border border-studio-700 rounded transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
        <Tooltip content="Remove Color">
          <button
            onClick={() => {
              removePaletteColor(asset.id, primaryColor);
              showToast(`Removed ${primaryColor} from palette`, 'info');
            }}
            disabled={asset.palette.length <= 2}
            className="p-1.5 text-slate-400 hover:text-rose-400 bg-studio-800 hover:bg-studio-750 border border-studio-700 rounded transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
