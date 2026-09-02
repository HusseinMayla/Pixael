import { FrameData } from '../types/asset';
import { ToolType } from '../types/editor';
import { hexToRgba } from './colorUtils';

export interface RenderCanvasOptions {
  canvas: HTMLCanvasElement;
  frame: FrameData;
  width: number;
  height: number;
  zoom: number;
  showGrid?: boolean;
  showCheckerboard?: boolean;
  onionSkinFrames?: FrameData[]; // previous / next frames
  hoverPixel?: { x: number; y: number } | null;
  hoverColor?: string | null;
  brushSize?: number;
  tool?: ToolType;
  activeShapePreview?: Array<{ x: number; y: number; color: string }> | null;
}

export interface RenderOverlayOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  zoom: number;
  hoverPixel?: { x: number; y: number } | null;
  hoverColor?: string | null;
  brushSize?: number;
  tool?: ToolType;
  activeShapePreview?: Array<{ x: number; y: number; color: string }> | null;
}

// Cached 16x16 checkerboard pattern to avoid O(N^2) loop on huge zoom levels
let cachedPattern: CanvasPattern | null = null;
let cachedPatternCtx: CanvasRenderingContext2D | null = null;

function getCheckerboardPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (cachedPattern && cachedPatternCtx === ctx) {
    return cachedPattern;
  }

  const pCanvas = document.createElement('canvas');
  pCanvas.width = 16;
  pCanvas.height = 16;
  const pCtx = pCanvas.getContext('2d');
  if (!pCtx) return null;

  const light = '#1f2430';
  const dark = '#161922';

  pCtx.fillStyle = dark;
  pCtx.fillRect(0, 0, 16, 16);

  pCtx.fillStyle = light;
  pCtx.fillRect(0, 0, 8, 8);
  pCtx.fillRect(8, 8, 8, 8);

  cachedPattern = ctx.createPattern(pCanvas, 'repeat');
  cachedPatternCtx = ctx;
  return cachedPattern;
}

// Reusable offscreen buffer for 1:1 pixel blits
let sharedOffscreenCanvas: HTMLCanvasElement | null = null;
let sharedOffscreenCtx: CanvasRenderingContext2D | null = null;

function getOffscreen(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!sharedOffscreenCanvas) {
    sharedOffscreenCanvas = document.createElement('canvas');
    sharedOffscreenCtx = sharedOffscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  if (sharedOffscreenCanvas.width !== width || sharedOffscreenCanvas.height !== height) {
    sharedOffscreenCanvas.width = width;
    sharedOffscreenCanvas.height = height;
  }

  return { canvas: sharedOffscreenCanvas, ctx: sharedOffscreenCtx! };
}

// Fast Color Hex Cache: Map hex string -> [r, g, b]
const colorRgbCache = new Map<string, [number, number, number]>();

function fastHexToRgb(hex: string): [number, number, number] {
  const cached = colorRgbCache.get(hex);
  if (cached) return cached;

  if (hex.length >= 7 && hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const res: [number, number, number] = [r, g, b];
    colorRgbCache.set(hex, res);
    return res;
  }

  return [0, 0, 0];
}

export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number
) {
  const targetWidth = width * zoom;
  const targetHeight = height * zoom;

  const pattern = getCheckerboardPattern(ctx);
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.fillStyle = '#161922';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }
}

/**
 * High-performance hardware-accelerated Main Canvas renderer
 */
export function renderPixelEditorCanvas(options: RenderCanvasOptions) {
  const {
    canvas,
    frame,
    width,
    height,
    zoom,
    showGrid = true,
    showCheckerboard = true,
    onionSkinFrames = [],
    hoverPixel = null,
    hoverColor = null,
    brushSize = 1,
    tool = 'pencil',
    activeShapePreview = null,
  } = options;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const targetWidth = width * zoom;
  const targetHeight = height * zoom;

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.imageSmoothingEnabled = false;

  // 1. Hardware-accelerated Checkerboard (1 single pattern fill)
  if (showCheckerboard) {
    drawCheckerboard(ctx, width, height, zoom);
  } else {
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Onion skinning (ghost overlay of adjacent frames)
  if (onionSkinFrames && onionSkinFrames.length > 0) {
    onionSkinFrames.forEach((ghostFrame, idx) => {
      const opacity = Math.max(0.08, 0.25 - idx * 0.08);
      const { canvas: gCanvas, ctx: gCtx } = getOffscreen(width, height);
      gCtx.clearRect(0, 0, width, height);
      const gImgData = gCtx.createImageData(width, height);
      const gData = gImgData.data;

      for (let i = 0; i < ghostFrame.pixels.length; i++) {
        const color = ghostFrame.pixels[i];
        if (color) {
          const [r, g, b] = fastHexToRgb(color);
          const pIdx = i * 4;
          gData[pIdx] = r;
          gData[pIdx + 1] = g;
          gData[pIdx + 2] = b;
          gData[pIdx + 3] = Math.round(opacity * 255);
        }
      }
      gCtx.putImageData(gImgData, 0, 0);

      ctx.save();
      ctx.drawImage(gCanvas, 0, 0, targetWidth, targetHeight);
      ctx.restore();
    });
  }

  // 3. Fast Blit of Current Active Frame Pixels via ImageData
  const { canvas: offCanvas, ctx: offCtx } = getOffscreen(width, height);
  offCtx.clearRect(0, 0, width, height);
  const imgData = offCtx.createImageData(width, height);
  const data = imgData.data;

  const pixels = frame.pixels;
  const len = pixels.length;

  for (let i = 0; i < len; i++) {
    const color = pixels[i];
    if (color) {
      const [r, g, b] = fastHexToRgb(color);
      const pIdx = i * 4;
      data[pIdx] = r;
      data[pIdx + 1] = g;
      data[pIdx + 2] = b;
      data[pIdx + 3] = 255;
    }
  }

  offCtx.putImageData(imgData, 0, 0);

  // Single GPU blit to scale from (width x height) to (targetWidth x targetHeight)
  ctx.drawImage(offCanvas, 0, 0, targetWidth, targetHeight);

  // 4. Active shape/line preview during mouse drag (if not using overlay)
  if (activeShapePreview && activeShapePreview.length > 0) {
    for (const pt of activeShapePreview) {
      if (pt.x >= 0 && pt.x < width && pt.y >= 0 && pt.y < height) {
        ctx.fillStyle = pt.color || '#ffffff';
        ctx.fillRect(pt.x * zoom, pt.y * zoom, zoom, zoom);
      }
    }
  }

  // 5. Hover cursor outline (fallback if overlay canvas not used)
  if (hoverPixel && tool !== 'pan' && hoverPixel.x >= 0 && hoverPixel.x < width && hoverPixel.y >= 0 && hoverPixel.y < height) {
    const size = (tool === 'pencil' || tool === 'eraser') ? brushSize : 1;
    const halfBrush = Math.floor(size / 2);

    const startX = Math.max(0, hoverPixel.x - halfBrush);
    const endX = Math.min(width - 1, hoverPixel.x + (size - 1 - halfBrush));
    const startY = Math.max(0, hoverPixel.y - halfBrush);
    const endY = Math.min(height - 1, hoverPixel.y + (size - 1 - halfBrush));

    const clusterW = (endX - startX + 1) * zoom;
    const clusterH = (endY - startY + 1) * zoom;
    const px = startX * zoom;
    const py = startY * zoom;

    if (tool === 'eraser') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
      ctx.fillRect(px, py, clusterW, clusterH);
    } else if (hoverColor) {
      const { r, g, b } = hexToRgba(hoverColor);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
      ctx.fillRect(px, py, clusterW, clusterH);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 0.5, py + 0.5, clusterW - 1, clusterH - 1);
  }

  // 6. Fast pixel grid lines
  if (showGrid && zoom >= 6) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= width; x++) {
      const px = x * zoom + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, targetHeight);
    }

    for (let y = 0; y <= height; y++) {
      const py = y * zoom + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(targetWidth, py);
    }

    ctx.stroke();
  }
}

/**
 * Ultra-fast dedicated overlay canvas renderer (Cursor, Shape Drag Previews)
 * Renders in < 0.01ms without redrawing background pixels!
 */
export function renderOverlayCanvas(options: RenderOverlayOptions) {
  const {
    canvas,
    width,
    height,
    zoom,
    hoverPixel = null,
    hoverColor = null,
    brushSize = 1,
    tool = 'pencil',
    activeShapePreview = null,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const targetWidth = width * zoom;
  const targetHeight = height * zoom;

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = false;

  // 1. Draw live shape preview (lines / rectangles during drag)
  if (activeShapePreview && activeShapePreview.length > 0) {
    for (const pt of activeShapePreview) {
      if (pt.x >= 0 && pt.x < width && pt.y >= 0 && pt.y < height) {
        ctx.fillStyle = pt.color || '#ffffff';
        ctx.fillRect(pt.x * zoom, pt.y * zoom, zoom, zoom);
      }
    }
  }

  // 2. Draw hover cursor outline
  if (hoverPixel && tool !== 'pan' && hoverPixel.x >= 0 && hoverPixel.x < width && hoverPixel.y >= 0 && hoverPixel.y < height) {
    const size = (tool === 'pencil' || tool === 'eraser') ? brushSize : 1;
    const halfBrush = Math.floor(size / 2);

    const startX = Math.max(0, hoverPixel.x - halfBrush);
    const endX = Math.min(width - 1, hoverPixel.x + (size - 1 - halfBrush));
    const startY = Math.max(0, hoverPixel.y - halfBrush);
    const endY = Math.min(height - 1, hoverPixel.y + (size - 1 - halfBrush));

    const clusterW = (endX - startX + 1) * zoom;
    const clusterH = (endY - startY + 1) * zoom;
    const px = startX * zoom;
    const py = startY * zoom;

    if (tool === 'eraser') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
      ctx.fillRect(px, py, clusterW, clusterH);
    } else if (hoverColor) {
      const { r, g, b } = hexToRgba(hoverColor);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.45)`;
      ctx.fillRect(px, py, clusterW, clusterH);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 0.5, py + 0.5, clusterW - 1, clusterH - 1);
  }
}
