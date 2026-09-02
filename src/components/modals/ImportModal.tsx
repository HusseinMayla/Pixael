import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Layers,
  FileCode,
  Sparkles,
  Play,
  Pause,
  Sliders,
  Check,
  Image as ImageIcon,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { useToast } from '../ui/Toast';
import {
  loadImageFromFile,
  sliceImageElement,
  buildAssetFromSlice,
} from '../../domain/importOperations';
import { renderFrameToCanvas } from '../../domain/exportOperations';
import { SliceOptions, ExtractedSliceResult } from '../../types/import';
import { getSampleKnightSlashAsset } from '../../persistence/sampleImportData';
import { trackMilestone } from '../../utils/telemetry';

const CATEGORIES = ['Characters', 'Enemies', 'Environment', 'Items & Props', 'Effects', 'UI Icons'];

export const ImportModal: React.FC = () => {
  const {
    project,
    importAsset,
    importStateToAsset,
    replaceCurrentFramePixels,
    importProjectJson,
    getActiveAsset,
  } = useProjectStore();

  const { closeModal, pendingImportFile, setPendingImportFile } = useEditorStore();
  const { showToast } = useToast();

  const activeAsset = getActiveAsset();

  const [activeTab, setActiveTab] = useState<'sheet' | 'json' | 'samples'>('sheet');

  // Loaded Image state
  const [imageFile, setImageFile] = useState<File | null>(pendingImportFile);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);

  // Slicing config
  const [sliceMode, setSliceMode] = useState<'grid' | 'dimensions'>('grid');
  const [columns, setColumns] = useState<number>(6);
  const [rows, setRows] = useState<number>(1);
  const [frameWidth, setFrameWidth] = useState<number>(48);
  const [frameHeight, setFrameHeight] = useState<number>(48);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [autoCrop, setAutoCrop] = useState<boolean>(false);

  // Slice Results & Preview
  const [sliceResult, setSliceResult] = useState<ExtractedSliceResult | null>(null);
  const [sliceError, setSliceError] = useState<string | null>(null);

  // Animation Preview inside Modal
  const [previewFps, setPreviewFps] = useState<number>(8);
  const [previewFrameIdx, setPreviewFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Destination Config
  const [destType, setDestType] = useState<'new-asset' | 'new-state' | 'replace-frame'>('new-asset');
  const [assetName, setAssetName] = useState<string>('Imported Sprite');
  const [category, setCategory] = useState<string>('Characters');
  const [stateName, setStateName] = useState<string>('Attack');
  const [targetAssetId, setTargetAssetId] = useState<string>(activeAsset?.id || project.assets[0]?.id || '');

  // Project JSON Tab State
  const [jsonProjectPreview, setJsonProjectPreview] = useState<{
    name: string;
    assetsCount: number;
    rawJson: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image if pending file was passed from drag-and-drop
  useEffect(() => {
    if (pendingImportFile) {
      handleFileSelected(pendingImportFile);
      setPendingImportFile(null);
    }
  }, [pendingImportFile]);

  // Load HTMLImageElement when imageFile changes
  const handleFileSelected = async (file: File) => {
    if (file.name.endsWith('.json')) {
      setActiveTab('json');
      handleJsonFileSelected(file);
      return;
    }

    try {
      setImageFile(file);
      const img = await loadImageFromFile(file);
      setLoadedImage(img);
      setImageDimensions({ w: img.width, h: img.height });

      // Suggest initial slice config based on image aspect ratio
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setAssetName(cleanName);

      // Guess columns
      if (img.width % img.height === 0 && img.width > img.height) {
        const guessedCols = img.width / img.height;
        setColumns(Math.min(16, Math.max(1, guessedCols)));
        setRows(1);
        setFrameWidth(img.height);
        setFrameHeight(img.height);
      } else if (img.width === 600 && img.height === 100) {
        setColumns(6);
        setRows(1);
        setFrameWidth(48);
        setFrameHeight(48);
        setOffsetX(26);
        setOffsetY(18);
      } else {
        const defaultW = Math.min(img.width, 32);
        const defaultH = Math.min(img.height, 32);
        setFrameWidth(defaultW);
        setFrameHeight(defaultH);
        setColumns(Math.max(1, Math.floor(img.width / defaultW)));
        setRows(Math.max(1, Math.floor(img.height / defaultH)));
      }
    } catch (err) {
      showToast('Could not load image: ' + (err instanceof Error ? err.message : 'Invalid image'), 'error');
    }
  };

  // Re-run slicing whenever image or slicing options change
  useEffect(() => {
    if (!loadedImage) return;

    try {
      setSliceError(null);
      let calculatedW = frameWidth;
      let calculatedH = frameHeight;

      if (sliceMode === 'grid') {
        calculatedW = Math.floor((loadedImage.width - offsetX) / Math.max(1, columns));
        calculatedH = Math.floor((loadedImage.height - offsetY) / Math.max(1, rows));
      }

      const options: SliceOptions = {
        columns: sliceMode === 'grid' ? columns : Math.floor((loadedImage.width - offsetX) / calculatedW),
        rows: sliceMode === 'grid' ? rows : Math.floor((loadedImage.height - offsetY) / calculatedH),
        frameWidth: calculatedW,
        frameHeight: calculatedH,
        offsetX,
        offsetY,
        autoCropTransparent: autoCrop,
      };

      const result = sliceImageElement(loadedImage, options);
      setSliceResult(result);
    } catch (err) {
      setSliceResult(null);
      setSliceError(err instanceof Error ? err.message : 'Slicing error');
    }
  }, [loadedImage, sliceMode, columns, rows, frameWidth, frameHeight, offsetX, offsetY, autoCrop]);

  // Render sheet preview with slicing grid lines
  useEffect(() => {
    if (!sheetCanvasRef.current || !loadedImage) return;
    const canvas = sheetCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = loadedImage.width;
    canvas.height = loadedImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(loadedImage, 0, 0);

    // Draw slice grid overlay
    if (sliceResult) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      const cols = sliceMode === 'grid' ? columns : Math.floor((loadedImage.width - offsetX) / frameWidth);
      const rws = sliceMode === 'grid' ? rows : Math.floor((loadedImage.height - offsetY) / frameHeight);
      const w = sliceMode === 'grid' ? Math.floor((loadedImage.width - offsetX) / Math.max(1, columns)) : frameWidth;
      const h = sliceMode === 'grid' ? Math.floor((loadedImage.height - offsetY) / Math.max(1, rows)) : frameHeight;

      for (let r = 0; r < rws; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * w;
          const y = offsetY + r * h;
          ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        }
      }
    }
  }, [loadedImage, sliceResult, sliceMode, columns, rows, frameWidth, frameHeight, offsetX, offsetY]);

  // Animation Preview Playback loop
  useEffect(() => {
    if (!isPlaying || !sliceResult || sliceResult.frames.length <= 1) return;

    const interval = setInterval(() => {
      setPreviewFrameIdx((prev) => (prev + 1) % sliceResult.frames.length);
    }, 1000 / previewFps);

    return () => clearInterval(interval);
  }, [isPlaying, sliceResult, previewFps]);

  // Draw the current animated preview frame to canvas
  useEffect(() => {
    if (!previewCanvasRef.current || !sliceResult || sliceResult.frames.length === 0) return;
    const frame = sliceResult.frames[previewFrameIdx % sliceResult.frames.length];
    if (!frame) return;

    const canvas = previewCanvasRef.current;
    const scale = Math.max(1, Math.min(8, Math.floor(160 / Math.max(sliceResult.width, sliceResult.height))));
    canvas.width = sliceResult.width * scale;
    canvas.height = sliceResult.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const offscreen = renderFrameToCanvas(frame, sliceResult.width, sliceResult.height, scale);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreen, 0, 0);
  }, [sliceResult, previewFrameIdx]);

  // Handle final import execution
  const handleExecuteImport = () => {
    if (!sliceResult || sliceResult.frames.length === 0) {
      showToast('No frames to import', 'error');
      return;
    }

    try {
      if (destType === 'new-asset') {
        const newAsset = buildAssetFromSlice(sliceResult, {
          type: 'new-asset',
          assetName,
          category,
          stateName,
          fps: previewFps,
        });

        importAsset(newAsset);
        showToast(`Imported new asset "${newAsset.name}" (${newAsset.width}×${newAsset.height}, ${newAsset.states[0].frames.length} frames)`, 'success');
        trackMilestone('ASSET_IMPORTED', { assetName: newAsset.name, frames: newAsset.states[0].frames.length });
      } else if (destType === 'new-state') {
        const targetAsset = project.assets.find((a) => a.id === targetAssetId);
        if (!targetAsset) throw new Error('Target asset not found');

        const newState = {
          id: `state_${Date.now()}`,
          name: stateName.trim() || 'Imported State',
          fps: previewFps,
          loop: true,
          frames: sliceResult.frames.map((f) => ({
            id: f.id,
            pixels: f.pixels,
          })),
        };

        importStateToAsset(targetAsset.id, newState, sliceResult.palette);
        showToast(`Added state "${newState.name}" to asset "${targetAsset.name}"`, 'success');
      } else if (destType === 'replace-frame') {
        const frame0 = sliceResult.frames[0];
        if (!frame0) throw new Error('No frame data available');
        replaceCurrentFramePixels(frame0.pixels);
        showToast('Replaced active frame pixels', 'success');
      }

      closeModal();
    } catch (err) {
      showToast(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  // JSON File Reading
  const handleJsonFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawJson = e.target?.result as string;
        const parsed = JSON.parse(rawJson);
        if (!parsed.assets || !Array.isArray(parsed.assets)) {
          throw new Error('JSON missing valid "assets" array');
        }
        setJsonProjectPreview({
          name: parsed.name || 'Untitled Project',
          assetsCount: parsed.assets.length,
          rawJson,
        });
      } catch (err) {
        showToast('Invalid Project JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteJsonRestore = () => {
    if (!jsonProjectPreview) return;
    if (window.confirm(`Restore project "${jsonProjectPreview.name}" with ${jsonProjectPreview.assetsCount} assets? Current unsaved work will be replaced.`)) {
      importProjectJson(jsonProjectPreview.rawJson);
      showToast(`Restored project "${jsonProjectPreview.name}"`, 'success');
      closeModal();
    }
  };

  // Quick import sample Knight Slash
  const handleImportSampleKnight = () => {
    const sample = getSampleKnightSlashAsset();
    importAsset(sample);
    showToast(`Loaded sample "${sample.name}" (6 frames, 48×48)`, 'success');
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80">
      <div className="bg-studio-900 border border-studio-750 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-studio-800 bg-studio-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-500">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Import Sprite / Project</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Import sprite sheets, single images, or project backups</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-studio-800 px-4 sm:px-6 bg-studio-950/40">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sheet'
                ? 'border-accent-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-accent-500" />
            <span>Image / Sprite Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'json'
                ? 'border-accent-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4 text-accent-cyan" />
            <span>Project JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'samples'
                ? 'border-accent-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-accent-amber" />
            <span>Sample Sprites</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[75vh]">
          {/* TAB 1: Sprite Sheet / Image */}
          {activeTab === 'sheet' && (
            <div className="space-y-4">
              {/* File Upload / Dropzone */}
              {!loadedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileSelected(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-studio-700 hover:border-accent-500/80 bg-studio-950/60 hover:bg-studio-950 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif, .json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="p-3 rounded-xl bg-accent-500/10 text-accent-500">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">
                      Click to upload or drag and drop an image
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      PNG, JPG, WebP sprite sheets or single frames
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Meta and Change Button */}
                  <div className="flex items-center justify-between p-2.5 bg-studio-950 rounded-lg border border-studio-800">
                    <div className="flex items-center gap-2 text-xs">
                      <ImageIcon className="w-4 h-4 text-accent-500" />
                      <span className="font-semibold text-slate-200">{imageFile?.name || 'Image'}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        ({imageDimensions?.w} × {imageDimensions?.h} px)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLoadedImage(null);
                        setImageFile(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-studio-850 hover:bg-studio-800 border border-studio-700 rounded transition-colors"
                    >
                      Change Image
                    </button>
                  </div>

                  {/* Slicing Controls & Live Preview Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Slice Settings */}
                    <div className="space-y-3 p-3.5 bg-studio-950/70 border border-studio-800 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-accent-500" />
                          Slice Configuration
                        </span>
                        <div className="flex gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSliceMode('grid')}
                            className={`px-2 py-0.5 rounded transition-colors ${
                              sliceMode === 'grid'
                                ? 'bg-accent-500/20 text-accent-cyan border border-accent-500/30'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Grid
                          </button>
                          <button
                            type="button"
                            onClick={() => setSliceMode('dimensions')}
                            className={`px-2 py-0.5 rounded transition-colors ${
                              sliceMode === 'dimensions'
                                ? 'bg-accent-500/20 text-accent-cyan border border-accent-500/30'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Pixel Size
                          </button>
                        </div>
                      </div>

                      {sliceMode === 'grid' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Columns</label>
                            <input
                              type="number"
                              min="1"
                              max="32"
                              value={columns}
                              onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-2.5 py-1 text-xs bg-studio-900 border border-studio-700 rounded text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Rows</label>
                            <input
                              type="number"
                              min="1"
                              max="32"
                              value={rows}
                              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-2.5 py-1 text-xs bg-studio-900 border border-studio-700 rounded text-white font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Frame Width</label>
                            <input
                              type="number"
                              min="8"
                              max="128"
                              value={frameWidth}
                              onChange={(e) => setFrameWidth(Math.max(8, parseInt(e.target.value) || 8))}
                              className="w-full px-2.5 py-1 text-xs bg-studio-900 border border-studio-700 rounded text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Frame Height</label>
                            <input
                              type="number"
                              min="8"
                              max="128"
                              value={frameHeight}
                              onChange={(e) => setFrameHeight(Math.max(8, parseInt(e.target.value) || 8))}
                              className="w-full px-2.5 py-1 text-xs bg-studio-900 border border-studio-700 rounded text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Offsets */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Offset X</label>
                          <input
                            type="number"
                            min="0"
                            value={offsetX}
                            onChange={(e) => setOffsetX(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-2.5 py-1 text-xs bg-studio-900 border border-studio-700 rounded text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Offset Y</label>
                          <input
                            type="number"
                            min="0"
                            value={offsetY}
                            onChange={(e) => setOffsetY(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-2.5 py-1 text-xs bg-studio-900 border border-studio-700 rounded text-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Auto Crop Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-300 select-none">
                        <input
                          type="checkbox"
                          checked={autoCrop}
                          onChange={(e) => setAutoCrop(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-studio-600 text-accent-600 bg-studio-900"
                        />
                        <span>Auto-crop transparent padding</span>
                      </label>

                      {/* Sheet Slice Grid Canvas */}
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] text-slate-400 font-medium">Sheet Preview with Slice Overlay</div>
                        <div className="max-h-28 overflow-auto border border-studio-800 rounded-lg p-1 bg-studio-950 flex items-center justify-center">
                          <canvas ref={sheetCanvasRef} className="pixelated max-w-full" style={{ imageRendering: 'pixelated' }} />
                        </div>
                      </div>
                    </div>

                    {/* Right: Animation Preview & Palette */}
                    <div className="space-y-3 p-3.5 bg-studio-950/70 border border-studio-800 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-200">Animation Preview</span>
                          <span className="text-[11px] font-mono text-accent-500">
                            {sliceResult ? `${sliceResult.totalFrames} frames (${sliceResult.width}×${sliceResult.height})` : '0 frames'}
                          </span>
                        </div>

                        {/* Animated Canvas */}
                        <div className="h-28 bg-studio-900/90 border border-studio-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                          {sliceResult && sliceResult.frames.length > 0 ? (
                            <canvas ref={previewCanvasRef} className="pixelated shadow-md" style={{ imageRendering: 'pixelated' }} />
                          ) : (
                            <span className="text-xs text-rose-400">{sliceError || 'No valid frames'}</span>
                          )}
                        </div>

                        {/* Playback Controls & FPS */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-slate-200 transition-colors"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] text-slate-400 font-mono w-10">{previewFps} FPS</span>
                            <input
                              type="range"
                              min="1"
                              max="30"
                              value={previewFps}
                              onChange={(e) => setPreviewFps(parseInt(e.target.value) || 8)}
                              className="flex-1 accent-accent-500 h-1.5 bg-studio-800 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Extracted Palette */}
                      {sliceResult && sliceResult.palette.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-studio-800">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Extracted Colors ({sliceResult.palette.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto p-1 bg-studio-900 rounded-md border border-studio-800">
                            {sliceResult.palette.map((c, i) => (
                              <span
                                key={i}
                                className="w-3 h-3 rounded-sm border border-black/30"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destination Selection */}
                  <div className="p-3.5 bg-studio-950/70 border border-studio-800 rounded-xl space-y-3">
                    <label className="text-xs font-semibold text-slate-200 block">Import Destination</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDestType('new-asset')}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          destType === 'new-asset'
                            ? 'bg-accent-500/20 border-accent-500 text-white'
                            : 'bg-studio-850/60 border-studio-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold">New Asset</div>
                        <div className="text-[10px] text-slate-500">Add to workspace</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDestType('new-state')}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          destType === 'new-state'
                            ? 'bg-accent-500/20 border-accent-500 text-white'
                            : 'bg-studio-850/60 border-studio-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold">New State</div>
                        <div className="text-[10px] text-slate-500">Append to asset</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDestType('replace-frame')}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          destType === 'replace-frame'
                            ? 'bg-accent-500/20 border-accent-500 text-white'
                            : 'bg-studio-850/60 border-studio-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold">Replace Frame</div>
                        <div className="text-[10px] text-slate-500">Apply to active</div>
                      </button>
                    </div>

                    {/* Dynamic Fields based on destination */}
                    {destType === 'new-asset' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Asset Name</label>
                          <input
                            type="text"
                            value={assetName}
                            onChange={(e) => setAssetName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-studio-900 border border-studio-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-studio-900 border border-studio-700 rounded-lg text-white"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {destType === 'new-state' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Target Asset</label>
                          <select
                            value={targetAssetId}
                            onChange={(e) => setTargetAssetId(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-studio-900 border border-studio-700 rounded-lg text-white"
                          >
                            {project.assets.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.width}×{a.height})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">State Name</label>
                          <input
                            type="text"
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-studio-900 border border-studio-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Project JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div
                onClick={() => jsonFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleJsonFileSelected(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-studio-700 hover:border-accent-500/80 bg-studio-950/60 hover:bg-studio-950 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json, application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleJsonFileSelected(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-3 rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <FileCode className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Upload a Project Backup JSON
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Restore previously exported *_project.json files
                  </div>
                </div>
              </div>

              {jsonProjectPreview && (
                <div className="p-4 bg-studio-950 border border-studio-750 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{jsonProjectPreview.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Contains {jsonProjectPreview.assetsCount} sprite assets with full animation data
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExecuteJsonRestore}
                      className="px-4 py-2 text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 rounded-lg shadow-glow-sm transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restore Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Sample Sprites */}
          {activeTab === 'samples' && (
            <div className="space-y-4">
              <div className="p-4 bg-studio-950 border border-studio-800 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Knight Sword Slash (6 Frames)</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-accent-500/20 text-accent-cyan rounded">
                      48 × 48 px
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Complete 6-frame heroic knight sword slash with dynamic slash trail and custom armor palette.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleImportSampleKnight}
                  className="px-4 py-2 text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 rounded-lg shadow-glow-sm transition-all flex items-center gap-2 shrink-0"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Import Asset</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 sm:pt-4 border-t border-studio-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-studio-800 hover:bg-studio-700 rounded-lg transition-colors"
            >
              Cancel
            </button>

            {activeTab === 'sheet' && loadedImage && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!sliceResult || sliceResult.frames.length === 0}
                className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 rounded-lg shadow-glow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Import {sliceResult?.totalFrames ? `(${sliceResult.totalFrames} Frames)` : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
