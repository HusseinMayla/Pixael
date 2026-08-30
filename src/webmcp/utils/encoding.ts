import { FramePixelsPayload } from '../types';

/**
 * Compact Run-Length Encoded (RLE) Pixel Data Utilities
 * 
 * Format:
 * - palette[0] is always "" (transparent)
 * - palette[1..N] are hex colors
 * - pixelsRle is flat array: [colorIndex, runLength, colorIndex, runLength, ...]
 * - row-major order: top-left to bottom-right
 */

/**
 * Encodes a flat pixel array into a compact FramePixelsPayload with RLE.
 */
export function encodeFrameToRle(
  pixels: string[],
  width: number,
  height: number,
  basePalette: string[] = []
): FramePixelsPayload {
  const totalPixels = width * height;
  if (!pixels || pixels.length < totalPixels) {
    // Pad to full buffer if undersized
    const padded = new Array(totalPixels).fill('');
    if (pixels) {
      for (let i = 0; i < Math.min(pixels.length, totalPixels); i++) {
        padded[i] = pixels[i] || '';
      }
    }
    pixels = padded;
  }

  // 1. Build standardized palette where index 0 is always "" (transparent)
  const palette: string[] = [''];
  const colorToIndex = new Map<string, number>();
  colorToIndex.set('', 0);
  colorToIndex.set('transparent', 0);

  // Add base palette colors (skip empty/transparent)
  for (const c of basePalette) {
    const norm = (c || '').trim().toLowerCase();
    if (norm && norm !== 'transparent' && !colorToIndex.has(norm)) {
      colorToIndex.set(norm, palette.length);
      palette.push(norm);
    }
  }

  // Add any extra colors present in the pixel buffer
  for (let i = 0; i < totalPixels; i++) {
    const c = (pixels[i] || '').trim().toLowerCase();
    if (c && c !== 'transparent' && !colorToIndex.has(c)) {
      colorToIndex.set(c, palette.length);
      palette.push(c);
    }
  }

  // 2. Encode pixels into RLE pairs [colorIndex, runLength, ...]
  const pixelsRle: number[] = [];
  if (totalPixels === 0) {
    return { width, height, palette, pixelsRle };
  }

  let currentColorIndex = colorToIndex.get((pixels[0] || '').trim().toLowerCase()) ?? 0;
  let currentRunLength = 1;

  for (let i = 1; i < totalPixels; i++) {
    const colorIdx = colorToIndex.get((pixels[i] || '').trim().toLowerCase()) ?? 0;
    if (colorIdx === currentColorIndex) {
      currentRunLength++;
    } else {
      pixelsRle.push(currentColorIndex, currentRunLength);
      currentColorIndex = colorIdx;
      currentRunLength = 1;
    }
  }

  // Push final run
  pixelsRle.push(currentColorIndex, currentRunLength);

  return {
    width,
    height,
    palette,
    pixelsRle,
  };
}

/**
 * Decodes a FramePixelsPayload back into a flat array of hex colors of length width * height.
 */
export function decodeRleToPixels(payload: FramePixelsPayload): string[] {
  const { width, height, palette, pixelsRle } = payload;
  const totalPixels = width * height;

  if (totalPixels <= 0) {
    return [];
  }

  if (!Array.isArray(pixelsRle) || pixelsRle.length % 2 !== 0) {
    throw new Error(`Invalid pixelsRle array: length must be even (got ${pixelsRle?.length})`);
  }

  const pixels: string[] = new Array(totalPixels).fill('');
  let pixelIndex = 0;

  for (let i = 0; i < pixelsRle.length; i += 2) {
    const colorIndex = pixelsRle[i];
    const runLength = pixelsRle[i + 1];

    if (runLength < 0) {
      throw new Error(`Invalid negative run length: ${runLength} at index ${i + 1}`);
    }

    const hexColor = (colorIndex > 0 && colorIndex < palette.length) ? (palette[colorIndex] || '') : '';

    for (let r = 0; r < runLength; r++) {
      if (pixelIndex >= totalPixels) {
        throw new Error(`RLE stream exceeds total pixel count (${totalPixels})`);
      }
      pixels[pixelIndex++] = hexColor;
    }
  }

  if (pixelIndex < totalPixels) {
    throw new Error(`RLE stream incomplete: decoded ${pixelIndex} pixels, expected ${totalPixels}`);
  }

  return pixels;
}

/**
 * Validates whether an incoming payload conforms to the FramePixelsPayload schema.
 */
export function validateRlePayload(payload: any): FramePixelsPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object');
  }
  const { width, height, palette, pixelsRle } = payload;
  if (typeof width !== 'number' || width <= 0) {
    throw new Error(`Invalid width in payload: ${width}`);
  }
  if (typeof height !== 'number' || height <= 0) {
    throw new Error(`Invalid height in payload: ${height}`);
  }
  if (!Array.isArray(palette)) {
    throw new Error('Palette must be an array of color strings');
  }
  if (!Array.isArray(pixelsRle)) {
    throw new Error('pixelsRle must be an array of number pairs [colorIndex, runLength]');
  }
  return { width, height, palette, pixelsRle };
}
