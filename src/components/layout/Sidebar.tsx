import React, { useState, useEffect, useRef } from 'react';
import {
  FolderTree,
  Plus,
  Upload,
  Copy,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  X,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { SpriteAsset } from '../../types/asset';
import { renderFrameToCanvas } from '../../domain/exportOperations';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '../ui/Toast';
import { trackMilestone } from '../../utils/telemetry';

// Mini canvas thumbnail for sidebar item
const AssetThumbnailComponent: React.FC<{ asset: SpriteAsset }> = ({ asset }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafId = useRef<number | null>(null);
  const firstFrame = asset.states[0]?.frames[0];

  useEffect(() => {
    if (!canvasRef.current || !firstFrame) return;
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!canvasRef.current || !firstFrame) return;
      const thumbScale = Math.max(1, Math.min(3, Math.floor(28 / Math.max(asset.width, asset.height))));

      const offscreen = renderFrameToCanvas(firstFrame, asset.width, asset.height, thumbScale);
      const canvas = canvasRef.current;
      canvas.width = asset.width * thumbScale;
      canvas.height = asset.height * thumbScale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0);
    });

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [firstFrame?.pixels, asset.width, asset.height]);

  return (
    <div className="w-8 h-8 flex items-center justify-center bg-studio-950/80 border border-studio-750/80 rounded-md overflow-hidden shrink-0 relative">
      <canvas ref={canvasRef} className="relative z-10 pixelated" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
};

const AssetThumbnail = React.memo(AssetThumbnailComponent);

export const Sidebar: React.FC = () => {
  const {
    project,
    selectAsset,
    duplicateAsset,
    deleteAsset,
    updateAsset,
  } = useProjectStore();

  const { openModal, toggleLeftSidebar } = useEditorStore();
  const { showToast } = useToast();

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [activeMenuAssetId, setActiveMenuAssetId] = useState<string | null>(null);
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Group assets by category
  const groupedAssets = React.useMemo(() => {
    const groups: Record<string, SpriteAsset[]> = {};
    for (const a of project.assets) {
      const cat = a.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    }
    return groups;
  }, [project.assets]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleStartRename = (asset: SpriteAsset) => {
    setRenamingAssetId(asset.id);
    setTempName(asset.name);
    setActiveMenuAssetId(null);
  };

  const handleSaveRename = (assetId: string) => {
    if (tempName.trim()) {
      updateAsset(assetId, { name: tempName.trim() });
      showToast(`Renamed asset to "${tempName.trim()}"`, 'info');
    }
    setRenamingAssetId(null);
  };

  const handleDuplicate = (assetId: string) => {
    const dup = duplicateAsset(assetId);
    if (dup) {
      showToast(`Duplicated asset "${dup.name}"`, 'success');
    }
    setActiveMenuAssetId(null);
  };

  const handleDelete = (assetId: string, name: string) => {
    if (project.assets.length <= 1) {
      alert('Cannot delete the last remaining asset.');
      return;
    }
    if (window.confirm(`Delete "${name}"?`)) {
      deleteAsset(assetId);
      trackMilestone('ASSET_DELETED', { assetName: name, remainingAssets: project.assets.length - 1 });
      showToast(`Deleted asset "${name}"`, 'info');
    }
    setActiveMenuAssetId(null);
  };

  return (
    <aside className="w-full h-full bg-studio-900/95 border-r border-studio-800 flex flex-col select-none shrink-0 z-20 backdrop-blur-md">
      {/* Sidebar Header */}
      <div className="p-3 sm:p-3.5 border-b border-studio-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <FolderTree className="w-4 h-4 text-accent-500" />
          <span>Assets ({project.assets.length})</span>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content="Import Sprite / Project">
            <button
              onClick={() => openModal('import')}
              className="p-1 rounded-md bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="New Asset">
            <button
              onClick={() => openModal('new-asset')}
              className="p-1 rounded-md bg-accent-600/20 text-accent-500 hover:bg-accent-600/30 hover:text-accent-cyan transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Mobile Drawer Close Button */}
          <button
            onClick={() => toggleLeftSidebar(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-studio-800 lg:hidden"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Asset Categories & Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3.5 scrollbar-thin">
        {Object.entries(groupedAssets).map(([category, assets]) => {
          const isCollapsed = collapsedCategories[category];

          return (
            <div key={category} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{category}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-studio-950 px-1.5 py-0.5 rounded">
                  {assets.length}
                </span>
              </button>

              {/* Category Asset Items */}
              {!isCollapsed && (
                <div className="space-y-1 pl-1">
                  {assets.map((asset) => {
                    const isSelected = asset.id === project.activeAssetId;
                    const isMenuOpen = activeMenuAssetId === asset.id;
                    const isRenaming = renamingAssetId === asset.id;

                    return (
                      <div
                        key={asset.id}
                        onClick={() => {
                          selectAsset(asset.id);
                          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            toggleLeftSidebar(false);
                          }
                        }}
                        className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                            : 'bg-studio-850/40 border-studio-800 hover:border-studio-700 hover:bg-studio-800 text-slate-300'
                        }`}
                      >
                        {/* Thumbnail & Meta */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <AssetThumbnail asset={asset} />

                          <div className="min-w-0 flex-1">
                            {isRenaming ? (
                              <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(asset.id);
                                  if (e.key === 'Escape') setRenamingAssetId(null);
                                }}
                                onBlur={() => handleSaveRename(asset.id)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-1 py-0.5 text-xs bg-studio-950 border border-accent-500 rounded text-white font-medium focus:outline-none"
                              />
                            ) : (
                              <div className="text-xs font-semibold truncate text-slate-200 group-hover:text-white">
                                {asset.name}
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{asset.width}×{asset.height}</span>
                              <span>•</span>
                              <span>{asset.states.length} states</span>
                            </div>
                          </div>
                        </div>

                        {/* Item Options Menu Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuAssetId(isMenuOpen ? null : asset.id);
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-studio-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Options Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-2 top-full mt-1 z-40 bg-studio-900 border border-studio-700 rounded-lg shadow-xl py-1 min-w-[130px] animate-in fade-in zoom-in-95 duration-150"
                          >
                            <button
                              onClick={() => handleStartRename(asset)}
                              className="w-full px-3 py-1.5 text-xs text-left text-slate-300 hover:text-white hover:bg-studio-800 flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3 text-accent-500" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => handleDuplicate(asset.id)}
                              className="w-full px-3 py-1.5 text-xs text-left text-slate-300 hover:text-white hover:bg-studio-800 flex items-center gap-2"
                            >
                              <Copy className="w-3 h-3 text-accent-cyan" />
                              <span>Duplicate</span>
                            </button>
                            {project.assets.length > 1 && (
                              <button
                                onClick={() => handleDelete(asset.id, asset.name)}
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
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Action Buttons */}
      <div className="p-2.5 sm:p-3 border-t border-studio-800 grid grid-cols-2 gap-2">
        <button
          onClick={() => openModal('new-asset')}
          className="py-2 px-2.5 rounded-lg bg-studio-800/80 hover:bg-studio-750 border border-studio-700/80 hover:border-accent-500 text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-accent-500" />
          <span>New Asset</span>
        </button>
        <button
          onClick={() => openModal('import')}
          className="py-2 px-2.5 rounded-lg bg-studio-800/80 hover:bg-studio-750 border border-studio-700/80 hover:border-accent-cyan text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Import</span>
        </button>
      </div>
    </aside>
  );
};
