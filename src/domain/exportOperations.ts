import { FrameData, AnimationState, SpriteAsset, ProjectData } from '../types/asset';
import { ExportOptions, SpriteSheetMetadata } from '../types/export';

const hexColorCache = new Map<string, [number, number, number, number]>();

function parseColorToRgba(color: string): [number, number, number, number] {
  const cached = hexColorCache.get(color);
  if (cached) return cached;

  if (color && color.charCodeAt(0) === 35) {
    if (color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16) || 0;
      const g = parseInt(color.slice(3, 5), 16) || 0;
      const b = parseInt(color.slice(5, 7), 16) || 0;
      const res: [number, number, number, number] = [r, g, b, 255];
      hexColorCache.set(color, res);
      return res;
    }
    if (color.length === 4) {
      const r = parseInt(color[1] + color[1], 16) || 0;
      const g = parseInt(color[2] + color[2], 16) || 0;
      const b = parseInt(color[3] + color[3], 16) || 0;
      const res: [number, number, number, number] = [r, g, b, 255];
      hexColorCache.set(color, res);
      return res;
    }
  }
  return [0, 0, 0, 0];
}

export function renderFrameToCanvas(
  frame: FrameData,
  width: number,
  height: number,
  scale = 1
): HTMLCanvasElement {
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = width;
  baseCanvas.height = height;

  const baseCtx = baseCanvas.getContext('2d');
  if (!baseCtx) return baseCanvas;

  const imgData = baseCtx.createImageData(width, height);
  const data = imgData.data;
  const pixels = frame.pixels;
  const len = pixels.length;

  for (let i = 0; i < len; i++) {
    const color = pixels[i];
    if (color) {
      const [r, g, b, a] = parseColorToRgba(color);
      if (a > 0) {
        const idx = i * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }
  }

  baseCtx.putImageData(imgData, 0, 0);

  if (scale === 1) {
    return baseCanvas;
  }

  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = width * scale;
  scaledCanvas.height = height * scale;

  const scaledCtx = scaledCanvas.getContext('2d');
  if (scaledCtx) {
    scaledCtx.imageSmoothingEnabled = false;
    scaledCtx.drawImage(baseCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  }

  return scaledCanvas;
}

export function renderFrameToPngBlob(
  frame: FrameData,
  width: number,
  height: number,
  scale = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = renderFrameToCanvas(frame, width, height, scale);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to render frame to blob'));
    }, 'image/png');
  });
}

export async function generateSpriteSheet(
  asset: SpriteAsset,
  selectedStateId?: string,
  options: Partial<ExportOptions> = {}
): Promise<{ blob: Blob; metadata: SpriteSheetMetadata }> {
  const scale = options.scale || 1;
  const padding = options.padding || 0;
  const layout = options.layout || 'horizontal';

  // Determine which states to include
  const statesToExport = options.includeAllStates
    ? asset.states
    : asset.states.filter(s => s.id === (selectedStateId || asset.states[0]?.id));

  // Flatten all frames to export
  const framesList: Array<{ state: AnimationState; frame: FrameData; frameIndex: number }> = [];
  for (const st of statesToExport) {
    st.frames.forEach((fr, idx) => {
      framesList.push({ state: st, frame: fr, frameIndex: idx });
    });
  }

  const totalFrames = framesList.length;
  if (totalFrames === 0) {
    throw new Error('No frames found to export in sprite sheet');
  }

  const frameW = asset.width * scale;
  const frameH = asset.height * scale;

  let cols = totalFrames;
  let rows = 1;

  if (layout === 'vertical') {
    cols = 1;
    rows = totalFrames;
  } else if (layout === 'grid') {
    cols = options.columns || Math.ceil(Math.sqrt(totalFrames));
    rows = Math.ceil(totalFrames / cols);
  }

  const sheetWidth = cols * frameW + (cols + 1) * padding;
  const sheetHeight = rows * frameH + (rows + 1) * padding;

  const canvas = document.createElement('canvas');
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = false;

  const metadata: SpriteSheetMetadata = {
    meta: {
      appName: 'Game Asset Studio',
      version: '1.0.0',
      assetName: asset.name,
      image: `${asset.name.toLowerCase().replace(/\s+/g, '_')}_sheet.png`,
      size: { w: sheetWidth, h: sheetHeight },
      scale,
      fps: statesToExport[0]?.fps || 8,
      totalFrames,
    },
    frames: {},
    animations: {},
  };

  for (let i = 0; i < totalFrames; i++) {
    const { state, frame, frameIndex } = framesList[i];
    const col = i % cols;
    const row = Math.floor(i / cols);

    const destX = padding + col * (frameW + padding);
    const destY = padding + row * (frameH + padding);

    // Draw frame pixels
    for (let py = 0; py < asset.height; py++) {
      for (let px = 0; px < asset.width; px++) {
        const color = frame.pixels[py * asset.width + px];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(destX + px * scale, destY + py * scale, scale, scale);
        }
      }
    }

    const frameKey = `${state.name}_${frameIndex}`;
    metadata.frames[frameKey] = {
      frame: { x: destX, y: destY, w: frameW, h: frameH },
      duration: Math.round(1000 / state.fps),
      state: state.name,
    };

    if (!metadata.animations[state.name]) {
      metadata.animations[state.name] = [];
    }
    metadata.animations[state.name].push(frameKey);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to generate sprite sheet blob'));
    }, 'image/png');
  });

  return { blob, metadata };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(data: object, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, filename);
}

export function exportProjectToJson(project: ProjectData): string {
  return JSON.stringify(project, null, 2);
}

export function importProjectFromJson(jsonStr: string): ProjectData {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.assets || !Array.isArray(parsed.assets)) {
    throw new Error('Invalid project file format: missing assets array');
  }
  return parsed as ProjectData;
}
