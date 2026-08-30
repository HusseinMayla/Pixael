import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { renderPixelEditorCanvas } from '../../utils/canvasRenderer';
import { getLinePixels } from '../../utils/colorUtils';
import { CanvasPoint } from '../../types/editor';

export const PixelCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    getActiveAsset,
    getActiveState,
    getActiveFrame,
    setPixel,
    setPixelsBatch,
    floodFill,
    pushHistory,
  } = useProjectStore();

  const {
    currentTool,
    primaryColor,
    brushSize,
    showGrid,
    showCheckerboard,
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    onionSkinning,
    onionSkinFrames,
    setPrimaryColor,
  } = useEditorStore();

  const asset = getActiveAsset();
  const state = getActiveState();
  const frame = getActiveFrame();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [lastPoint, setLastPoint] = useState<CanvasPoint | null>(null);
  const [startShapePoint, setStartShapePoint] = useState<CanvasPoint | null>(null);
  const [hoverPixel, setHoverPixel] = useState<CanvasPoint | null>(null);
  const [shapePreview, setShapePreview] = useState<Array<{ x: number; y: number; color: string }> | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute onion skin ghost frames
  const ghostFrames = React.useMemo(() => {
    if (!onionSkinning || !state || state.frames.length <= 1) return [];
    const currIdx = state.frames.findIndex((f) => f.id === frame?.id);
    if (currIdx < 0) return [];

    const ghosts = [];
    for (let i = 1; i <= onionSkinFrames; i++) {
      const prev = state.frames[currIdx - i];
      if (prev) ghosts.push(prev);
    }
    return ghosts;
  }, [onionSkinning, state, frame?.id, onionSkinFrames]);

  // Space key detection for pan navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert client mouse coordinates to pixel grid coordinates
  const getCanvasPixelCoords = useCallback(
    (clientX: number, clientY: number): CanvasPoint | null => {
      if (!canvasRef.current || !asset) return null;
      const rect = canvasRef.current.getBoundingClientRect();

      const x = Math.floor((clientX - rect.left) / zoom);
      const y = Math.floor((clientY - rect.top) / zoom);

      if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
        return null;
      }
      return { x, y };
    },
    [asset, zoom]
  );

  // Render canvas on changes
  useEffect(() => {
    if (!canvasRef.current || !asset || !frame) return;

    renderPixelEditorCanvas({
      canvas: canvasRef.current,
      frame,
      width: asset.width,
      height: asset.height,
      zoom,
      showGrid,
      showCheckerboard,
      onionSkinFrames: ghostFrames,
      hoverPixel,
      hoverColor: currentTool === 'eraser' ? 'transparent' : primaryColor,
      brushSize,
      tool: currentTool,
      activeShapePreview: shapePreview,
    });
  }, [
    asset,
    frame,
    zoom,
    showGrid,
    showCheckerboard,
    ghostFrames,
    hoverPixel,
    primaryColor,
    brushSize,
    currentTool,
    shapePreview,
  ]);

  // Wheel zoom and pan handler (Zero latency)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY < 0 ? 2 : -2;
      setZoom((z) => Math.max(4, Math.min(64, z + delta)));
    } else if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
      // Standard mouse wheel steps zoom, trackpad 2-finger scrolls pan
      if (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) >= 40) {
        const delta = e.deltaY < 0 ? 2 : -2;
        setZoom((z) => Math.max(4, Math.min(64, z + delta)));
      } else {
        setPan(panX - e.deltaX, panY - e.deltaY);
      }
    }
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if middle click or Space + Click or Pan tool for Pan
    if (e.button === 1 || (e.button === 0 && (isSpacePressed || currentTool === 'pan'))) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    if (e.button !== 0 || !asset || !frame) return;

    const coords = getCanvasPixelCoords(e.clientX, e.clientY);
    if (!coords) return;

    const activeColor = currentTool === 'eraser' ? '' : primaryColor;

    if (currentTool === 'eyedropper') {
      const idx = coords.y * asset.width + coords.x;
      const picked = frame.pixels[idx];
      if (picked) {
        setPrimaryColor(picked);
      }
      return;
    }

    if (currentTool === 'bucket') {
      floodFill(coords.x, coords.y, activeColor);
      return;
    }

    if (currentTool === 'line' || currentTool === 'rectangle') {
      setIsDrawing(true);
      setStartShapePoint(coords);
      return;
    }

    // Pencil / Eraser
    pushHistory();
    setIsDrawing(true);
    setLastPoint(coords);
    setPixel(coords.x, coords.y, activeColor, brushSize);
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle Panning
    if (isPanning) {
      setPan(e.clientX - panStart.x, e.clientY - panStart.y);
      return;
    }

    const coords = getCanvasPixelCoords(e.clientX, e.clientY);
    setHoverPixel(coords);

    if (!isDrawing || !coords || !asset) return;

    const activeColor = currentTool === 'eraser' ? '' : primaryColor;

    // Line / Rectangle shape preview
    if (currentTool === 'line' && startShapePoint) {
      const linePoints = getLinePixels(startShapePoint.x, startShapePoint.y, coords.x, coords.y);
      setShapePreview(linePoints.map((pt) => ({ ...pt, color: activeColor })));
      return;
    }

    if (currentTool === 'rectangle' && startShapePoint) {
      const minX = Math.min(startShapePoint.x, coords.x);
      const maxX = Math.max(startShapePoint.x, coords.x);
      const minY = Math.min(startShapePoint.y, coords.y);
      const maxY = Math.max(startShapePoint.y, coords.y);

      const rectPoints: Array<{ x: number; y: number; color: string }> = [];
      for (let x = minX; x <= maxX; x++) {
        rectPoints.push({ x, y: minY, color: activeColor });
        rectPoints.push({ x, y: maxY, color: activeColor });
      }
      for (let y = minY; y <= maxY; y++) {
        rectPoints.push({ x: minX, y, color: activeColor });
        rectPoints.push({ x: maxX, y, color: activeColor });
      }
      setShapePreview(rectPoints);
      return;
    }

    // Continuous Bresenham drag drawing
    if ((currentTool === 'pencil' || currentTool === 'eraser') && lastPoint) {
      const strokePoints = getLinePixels(lastPoint.x, lastPoint.y, coords.x, coords.y);
      const batchUpdates: Array<{ x: number; y: number; color: string }> = [];

      const halfBrush = Math.floor(brushSize / 2);
      for (const pt of strokePoints) {
        for (let dy = -halfBrush; dy < brushSize - halfBrush; dy++) {
          for (let dx = -halfBrush; dx < brushSize - halfBrush; dx++) {
            batchUpdates.push({
              x: pt.x + dx,
              y: pt.y + dy,
              color: activeColor,
            });
          }
        }
      }

      setPixelsBatch(batchUpdates);
      setLastPoint(coords);
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isDrawing && shapePreview && shapePreview.length > 0) {
      pushHistory();
      setPixelsBatch(shapePreview);
      setShapePreview(null);
      setStartShapePoint(null);
    }

    setIsDrawing(false);
    setLastPoint(null);
    setStartShapePoint(null);
  };

  const handleMouseLeave = () => {
    setHoverPixel(null);
    if (!isDrawing) {
      setIsPanning(false);
    }
  };

  if (!asset || !frame) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        No active sprite selected.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`relative flex-1 h-full w-full flex items-center justify-center overflow-hidden bg-studio-950 select-none ${
        isSpacePressed || isPanning
          ? 'cursor-grab active:cursor-grabbing'
          : currentTool === 'pan'
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-crosshair'
      }`}
    >
      {/* Background dot grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2430_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Centered Canvas Container with Pan offset (Zero latency hardware accelerated) */}
      <div
        className="relative will-change-transform"
        style={{
          transform: `translate3d(${panX}px, ${panY}px, 0)`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="shadow-2xl border border-studio-700/60 rounded-sm pixelated"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
};
