import React, { useState } from 'react';
import { X, Download, FileImage, Layers, FileCode } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { useToast } from '../ui/Toast';
import { renderFrameToPngBlob, generateSpriteSheet, downloadBlob, downloadJson } from '../../domain/exportOperations';
import { SpriteSheetLayout } from '../../types/export';

export const ExportModal: React.FC = () => {
  const { getActiveAsset, getActiveState, getActiveFrame, project } = useProjectStore();
  const { closeModal } = useEditorStore();
  const { showToast } = useToast();

  const asset = getActiveAsset();
  const state = getActiveState();
  const frame = getActiveFrame();

  const [exportType, setExportType] = useState<'sheet' | 'frame' | 'json'>('sheet');
  const [scale, setScale] = useState<number>(4);
  const [layout, setLayout] = useState<SpriteSheetLayout>('horizontal');
  const [columns, setColumns] = useState<number>(4);
  const [padding] = useState<number>(0);
  const [includeAllStates, setIncludeAllStates] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!asset || !state) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportType === 'frame') {
        if (!frame) throw new Error('No frame selected');
        const blob = await renderFrameToPngBlob(frame, asset.width, asset.height, scale);
        const filename = `${asset.name.toLowerCase().replace(/\s+/g, '_')}_${state.name.toLowerCase()}_f${project.activeFrameIndex + 1}_${scale}x.png`;
        downloadBlob(blob, filename);
        showToast(`Exported frame "${filename}"`, 'success');
      } else if (exportType === 'sheet') {
        const { blob, metadata } = await generateSpriteSheet(asset, state.id, {
          scale,
          layout,
          columns,
          padding,
          includeAllStates,
        });

        const sheetName = `${asset.name.toLowerCase().replace(/\s+/g, '_')}_sheet_${scale}x.png`;
        downloadBlob(blob, sheetName);

        if (includeMetadata) {
          const jsonName = `${asset.name.toLowerCase().replace(/\s+/g, '_')}_sheet_${scale}x.json`;
          downloadJson(metadata, jsonName);
        }

        showToast(`Exported sprite sheet "${sheetName}"`, 'success');
      } else if (exportType === 'json') {
        const jsonName = `${project.name.toLowerCase().replace(/\s+/g, '_')}_project.json`;
        downloadJson(project, jsonName);
        showToast(`Exported project data "${jsonName}"`, 'success');
      }

      closeModal();
    } catch (err) {
      console.error(err);
      showToast(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-studio-900 border border-studio-700/80 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-800 bg-studio-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-500">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export Game Assets</h2>
              <p className="text-xs text-slate-400">Download PNG spritesheets, single frames, and engine metadata</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Export Type</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setExportType('sheet')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  exportType === 'sheet'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:bg-studio-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent-500" />
                  <span className="text-xs font-semibold">Sprite Sheet</span>
                </div>
                <span className="text-[11px] text-slate-500">Packed frame sequence</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('frame')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  exportType === 'frame'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:bg-studio-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-accent-500" />
                  <span className="text-xs font-semibold">Current Frame</span>
                </div>
                <span className="text-[11px] text-slate-500">Single PNG image</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('json')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  exportType === 'json'
                    ? 'bg-accent-500/15 border-accent-500 text-white shadow-glow-sm'
                    : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:bg-studio-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-accent-500" />
                  <span className="text-xs font-semibold">Project Backup</span>
                </div>
                <span className="text-[11px] text-slate-500">Full JSON workspace</span>
              </button>
            </div>
          </div>

          {/* Scale Resolution Selection */}
          {exportType !== 'json' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Output Resolution Scale</span>
                <span className="text-xs font-mono text-accent-500">
                  {asset.width * scale} × {asset.height * scale} px per frame
                </span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 4, 8, 16].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setScale(sc)}
                    className={`py-2 text-xs font-mono font-medium rounded-lg border transition-all ${
                      scale === sc
                        ? 'bg-accent-500/20 border-accent-500 text-white shadow-glow-sm'
                        : 'bg-studio-800/60 border-studio-700/60 text-slate-400 hover:bg-studio-800 hover:text-white'
                    }`}
                  >
                    {sc}× {sc === 1 ? '(1:1)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sprite Sheet Specific Configurations */}
          {exportType === 'sheet' && (
            <>
              {/* Sheet Layout */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Sheet Layout</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'horizontal', label: 'Horizontal Strip' },
                    { id: 'grid', label: 'Grid Matrix' },
                    { id: 'vertical', label: 'Vertical Strip' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLayout(item.id as SpriteSheetLayout)}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        layout === item.id
                          ? 'bg-accent-500/20 border-accent-500 text-white'
                          : 'bg-studio-800/40 border-studio-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Columns if Grid */}
              {layout === 'grid' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Columns in Grid</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={columns}
                    onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm bg-studio-950 border border-studio-700 rounded-lg text-white font-mono"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="w-4 h-4 rounded border-studio-600 text-accent-600 focus:ring-0 bg-studio-950"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-slate-200">Include JSON Metadata</span>
                    <p className="text-slate-500 text-[11px]">Exports frame coordinates, bounding rects, and FPS timing</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAllStates}
                    onChange={(e) => setIncludeAllStates(e.target.checked)}
                    className="w-4 h-4 rounded border-studio-600 text-accent-600 focus:ring-0 bg-studio-950"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-slate-200">Export All Animation States</span>
                    <p className="text-slate-500 text-[11px]">Combines all states ({asset.states.map(s => s.name).join(', ')}) into one atlas</p>
                  </div>
                </label>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-studio-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-studio-800 hover:bg-studio-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-medium text-white bg-accent-600 hover:bg-accent-500 rounded-lg shadow-glow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Download Assets'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
