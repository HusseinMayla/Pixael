import React from 'react';
import {
  Hand,
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Slash,
  Square,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  Trash2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { ToolType } from '../../types/editor';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '../ui/Toast';

export const CanvasToolbar: React.FC = () => {
  const { currentTool, setTool } = useEditorStore();
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearCurrentFrame,
    flipCurrentFrame,
    rotateCurrentFrame,
  } = useProjectStore();
  const { showToast } = useToast();

  const handleClear = () => {
    if (window.confirm('Clear all pixels in the current frame?')) {
      clearCurrentFrame();
      showToast('Frame cleared', 'info');
    }
  };

  const handleFlipH = () => {
    flipCurrentFrame('horizontal');
    showToast('Flipped horizontally', 'info');
  };

  const handleFlipV = () => {
    flipCurrentFrame('vertical');
    showToast('Flipped vertically', 'info');
  };

  const handleRotate = () => {
    rotateCurrentFrame(true);
    showToast('Rotated 90° clockwise', 'info');
  };

  const tools: Array<{ id: ToolType; label: string; icon: React.FC<{ className?: string }>; shortcut?: string }> = [
    { id: 'pan', label: 'Hand / Pan Tool (Move & Zoom)', icon: Hand, shortcut: 'V' },
    { id: 'pencil', label: 'Pencil Tool', icon: Pencil, shortcut: 'B' },
    { id: 'eraser', label: 'Eraser Tool', icon: Eraser, shortcut: 'E' },
    { id: 'bucket', label: 'Paint Bucket / Fill', icon: PaintBucket, shortcut: 'G' },
    { id: 'eyedropper', label: 'Color Picker', icon: Pipette, shortcut: 'I' },
    { id: 'line', label: 'Line Tool', icon: Slash, shortcut: 'L' },
    { id: 'rectangle', label: 'Rectangle Tool', icon: Square, shortcut: 'R' },
  ];

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-studio-900/90 border border-studio-800 rounded-xl shadow-xl backdrop-blur-md">
      {/* Drawing Tools */}
      <div className="flex flex-col gap-1">
        {tools.map((item) => {
          const Icon = item.icon;
          const isActive = currentTool === item.id;
          return (
            <Tooltip key={item.id} content={item.label} shortcut={item.shortcut} position="right">
              <button
                onClick={() => setTool(item.id)}
                className={`p-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-accent-500 text-white shadow-glow-sm scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-studio-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            </Tooltip>
          );
        })}
      </div>

      <div className="w-5 h-px bg-studio-800 my-1" />

      {/* Frame Transformations */}
      <div className="flex flex-col gap-1">
        <Tooltip content="Flip Horizontal" position="right">
          <button
            onClick={handleFlipH}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <FlipHorizontal2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Flip Vertical" position="right">
          <button
            onClick={handleFlipV}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <FlipVertical2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Rotate 90° Clockwise" position="right">
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Clear Frame" position="right">
          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="w-5 h-px bg-studio-800 my-1" />

      {/* Undo / Redo */}
      <div className="flex flex-col gap-1">
        <Tooltip content="Undo" shortcut="Ctrl+Z" position="right">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-20 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Redo" shortcut="Ctrl+Y" position="right">
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-20 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
