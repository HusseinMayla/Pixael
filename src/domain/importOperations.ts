import { FrameData, AnimationState, SpriteAsset } from '../types/asset';
import { SliceOptions, ExtractedSliceResult, ImportDestination } from '../types/import';
import { generateId } from '../utils/idGenerator';

/**
 * Converts R, G, B numbers to #rrggbb hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Extracts unique colors from pixel list, ordered by frequency
 */
export function extractPaletteFromPixels(pixels: string[]): string[] {
  const countMap = new Map<string, number>();
  for (const p of pixels) {
    if (p && p.trim()) {
      const normalized = p.toLowerCase();
      countMap.set(normalized, (countMap.get(normalized) || 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);
}

/**
 * Loads a File or Blob into an HTMLImageElement
 */
export function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error('Failed to load image file: ' + String(err)));
      img.src = reader.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Slices an image or canvas into individual frames with pixel data
 */
export function sliceImageElement(
  img: HTMLImageElement | HTMLCanvasElement,
  options: SliceOptions
): ExtractedSliceResult {
  const {
    columns = 1,
    rows = 1,
    frameWidth,
    frameHeight,
    offsetX = 0,
    offsetY = 0,
    spacingX = 0,
    spacingY = 0,
    alphaThreshold = 10,
    autoCropTransparent = false,
  } = options;

  // Create an offscreen canvas to sample pixel data from image
  const offscreen = document.createElement('canvas');
  offscreen.width = img.width;
  offscreen.height = img.height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context for image slicing');

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);

  const rawFrames: Array<{ rawPixels: string[]; width: number; height: number }> = [];
  const allUsedColors: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const startX = offsetX + c * (frameWidth + spacingX);
      const startY = offsetY + r * (frameHeight + spacingY);

      if (startX + frameWidth > img.width || startY + frameHeight > img.height) {
        // Skip cells out of image bounds
        continue;
      }

      const imgData = ctx.getImageData(startX, startY, frameWidth, frameHeight);
      const data = imgData.data;
      const framePixels: string[] = new Array(frameWidth * frameHeight).fill('');

      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          const idx = (y * frameWidth + x) * 4;
          const a = data[idx + 3];
          if (a >= alphaThreshold) {
            const hex = rgbToHex(data[idx], data[idx + 1], data[idx + 2]);
            framePixels[y * frameWidth + x] = hex;
            allUsedColors.push(hex);
          }
        }
      }

      rawFrames.push({
        rawPixels: framePixels,
        width: frameWidth,
        height: frameHeight,
      });
    }
  }

  if (rawFrames.length === 0) {
    throw new Error('No valid frames could be sliced with the specified grid settings');
  }

  let finalWidth = frameWidth;
  let finalHeight = frameHeight;
  let finalFramesPixels: string[][] = rawFrames.map((f) => f.rawPixels);

  // Optional: Auto-crop transparent boundaries while preserving unified alignment across all frames
  if (autoCropTransparent) {
    let minX = frameWidth;
    let maxX = -1;
    let minY = frameHeight;
    let maxY = -1;

    for (const frame of rawFrames) {
      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          const pixel = frame.rawPixels[y * frameWidth + x];
          if (pixel) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
    }

    if (maxX >= minX && maxY >= minY) {
      finalWidth = maxX - minX + 1;
      finalHeight = maxY - minY + 1;

      finalFramesPixels = rawFrames.map((frame) => {
        const cropped: string[] = new Array(finalWidth * finalHeight).fill('');
        for (let y = 0; y < finalHeight; y++) {
          for (let x = 0; x < finalWidth; x++) {
            const srcIdx = (minY + y) * frameWidth + (minX + x);
            cropped[y * finalWidth + x] = frame.rawPixels[srcIdx] || '';
          }
        }
        return cropped;
      });
    }
  }

  const frames: FrameData[] = finalFramesPixels.map((pixels) => ({
    id: generateId('frame'),
    pixels,
  }));

  const palette = extractPaletteFromPixels(allUsedColors);

  return {
    frames: frames.map((f) => ({
      id: f.id,
      pixels: f.pixels,
      width: finalWidth,
      height: finalHeight,
    })),
    width: finalWidth,
    height: finalHeight,
    palette,
    totalFrames: frames.length,
  };
}

/**
 * Creates a complete SpriteAsset from sliced frame result
 */
export function buildAssetFromSlice(
  sliceResult: ExtractedSliceResult,
  destination: ImportDestination
): SpriteAsset {
  const assetName = destination.assetName?.trim() || 'Imported Sprite';
  const category = destination.category || 'Characters';
  const stateName = destination.stateName?.trim() || 'Animation';
  const fps = destination.fps || 8;
  const loop = destination.loop !== undefined ? destination.loop : true;

  const animationState: AnimationState = {
    id: generateId('state'),
    name: stateName,
    fps,
    loop,
    frames: sliceResult.frames.map((f) => ({
      id: f.id,
      pixels: f.pixels,
    })),
  };

  return {
    id: generateId('asset'),
    name: assetName,
    category,
    width: sliceResult.width,
    height: sliceResult.height,
    palette: sliceResult.palette.length > 0 ? sliceResult.palette : ['#000000', '#ffffff'],
    states: [animationState],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
