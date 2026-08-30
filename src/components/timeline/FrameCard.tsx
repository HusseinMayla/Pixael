import React, { useEffect, useRef } from 'react';
import { Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FrameData } from '../../types/asset';
import { renderFrameToCanvas } from '../../domain/exportOperations';
import { Tooltip } from '../ui/Tooltip';

interface FrameCardProps {
  frame: FrameData;
  index: number;
  totalFrames: number;
  isActive: boolean;
  width: number;
  height: number;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({
  frame,
  index,
  totalFrames,
  isActive,
  width,
  height,
  onSelect,
  onDuplicate,
  onDelete,
  onMoveLeft,
  onMoveRight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll active frame into view
  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    }
  }, [isActive]);

  // Render thumbnail
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const thumbScale = Math.max(1, Math.min(4, Math.floor(48 / Math.max(width, height))));

    const offscreen = renderFrameToCanvas(frame, width, height, thumbScale);
    canvas.width = width * thumbScale;
    canvas.height = height * thumbScale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0);
  }, [frame, width, height]);

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      className={`group relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all duration-150 cursor-pointer select-none min-w-[76px] ${
        isActive
          ? 'bg-accent-500/15 border-accent-500 ring-2 ring-accent-500/50 shadow-glow-sm scale-[1.02]'
          : 'bg-studio-900/90 border-studio-800 hover:border-studio-700 hover:bg-studio-850'
      }`}
    >
      {/* Top Header: Frame Index */}
      <div className="w-full flex items-center justify-between text-[11px] mb-1">
        <span
          className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] ${
            isActive
              ? 'bg-accent-500 text-white'
              : 'bg-studio-800 text-slate-400 group-hover:text-slate-200'
          }`}
        >
          #{index + 1}
        </span>

        {/* Hover Quick Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content="Duplicate Frame">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-1 hover:bg-studio-700 text-slate-400 hover:text-white rounded"
            >
              <Copy className="w-3 h-3" />
            </button>
          </Tooltip>

          {totalFrames > 1 && (
            <Tooltip content="Delete Frame">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Frame Thumbnail Canvas */}
      <div className="w-12 h-12 flex items-center justify-center bg-studio-950/80 border border-studio-800/80 rounded-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#2d3446_1px,transparent_1px)] [background-size:6px_6px] opacity-20" />
        <canvas
          ref={canvasRef}
          className="relative z-10 pixelated"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Bottom Reorder Controls */}
      <div className="w-full flex items-center justify-between mt-1 pt-1 border-t border-studio-800/60 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveLeft();
          }}
          disabled={index === 0}
          className="p-0.5 hover:bg-studio-700 text-slate-400 hover:text-white rounded disabled:opacity-20"
          title="Move Left"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        <span className="text-[8px] font-mono text-slate-600">•</span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveRight();
          }}
          disabled={index === totalFrames - 1}
          className="p-0.5 hover:bg-studio-700 text-slate-400 hover:text-white rounded disabled:opacity-20"
          title="Move Right"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
