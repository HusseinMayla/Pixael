import { FrameData, AnimationState, SpriteAsset, ProjectData } from '../types/asset';
import { ExportOptions, SpriteSheetMetadata } from '../types/export';

export function renderFrameToCanvas(
  frame: FrameData,
  width: number,
  height: number,
  scale = 1
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const color = frame.pixels[idx];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  return canvas;
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
