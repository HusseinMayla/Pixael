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

export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  cellSize = 8
) {
  const lightColor = '#1f2430';
  const darkColor = '#161922';

  const pixelWidth = width * zoom;
  const pixelHeight = height * zoom;
  const size = Math.max(4, Math.min(16, cellSize));

  for (let y = 0; y < pixelHeight; y += size) {
    for (let x = 0; x < pixelWidth; x += size) {
      const isEven = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = isEven ? lightColor : darkColor;
      ctx.fillRect(x, y, Math.min(size, pixelWidth - x), Math.min(size, pixelHeight - y));
    }
  }
}

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

  // 1. Checkerboard background
  if (showCheckerboard) {
    drawCheckerboard(ctx, width, height, zoom);
  } else {
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Onion skinning (ghost overlay of adjacent frames)
  if (onionSkinFrames && onionSkinFrames.length > 0) {
    onionSkinFrames.forEach((ghostFrame, idx) => {
      const opacity = 0.25 - idx * 0.08;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = ghostFrame.pixels[y * width + x];
          if (color) {
            const { r, g, b } = hexToRgba(color);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
          }
        }
      }
    });
  }

  // 3. Current active frame pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = frame.pixels[y * width + x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
  }

  // 4. Active shape/line preview during mouse drag
  if (activeShapePreview && activeShapePreview.length > 0) {
    for (const pt of activeShapePreview) {
      if (pt.x >= 0 && pt.x < width && pt.y >= 0 && pt.y < height) {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x * zoom, pt.y * zoom, zoom, zoom);
      }
    }
  }

  // 5. Hover cursor outline & highlight across full brush area
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

  // 6. Pixel grid lines (only visible when zoomed in)
  if (showGrid && zoom >= 8) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= width; x++) {
      ctx.moveTo(x * zoom + 0.5, 0);
      ctx.lineTo(x * zoom + 0.5, targetHeight);
    }

    for (let y = 0; y <= height; y++) {
      ctx.moveTo(0, y * zoom + 0.5);
      ctx.lineTo(targetWidth, y * zoom + 0.5);
    }

    ctx.stroke();
  }
}
