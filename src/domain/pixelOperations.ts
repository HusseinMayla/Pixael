export function createEmptyPixels(width: number, height: number): string[] {
  return new Array(width * height).fill('');
}

export function getPixelIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

export function setPixelInPixels(
  pixels: string[],
  width: number,
  height: number,
  x: number,
  y: number,
  color: string,
  brushSize = 1
): string[] {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return pixels;
  }

  const newPixels = [...pixels];
  const halfBrush = Math.floor(brushSize / 2);

  for (let dy = -halfBrush; dy < brushSize - halfBrush; dy++) {
    for (let dx = -halfBrush; dx < brushSize - halfBrush; dx++) {
      const targetX = x + dx;
      const targetY = y + dy;
      if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
        const idx = targetY * width + targetX;
        newPixels[idx] = color;
      }
    }
  }

  return newPixels;
}

export function setPixelsBatchInPixels(
  pixels: string[],
  width: number,
  height: number,
  updates: Array<{ x: number; y: number; color: string }>
): string[] {
  const newPixels = [...pixels];
  for (const { x, y, color } of updates) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      newPixels[y * width + x] = color;
    }
  }
  return newPixels;
}

export function floodFillInPixels(
  pixels: string[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColor: string
): string[] {
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return pixels;
  }

  const targetColor = pixels[startY * width + startX] || '';
  if (targetColor === fillColor) {
    return pixels;
  }

  const newPixels = [...pixels];
  const queue: Array<[number, number]> = [[startX, startY]];
  const visited = new Uint8Array(width * height);

  while (queue.length > 0) {
    const [cx, cy] = queue.pop()!;
    const idx = cy * width + cx;

    if (visited[idx]) continue;
    visited[idx] = 1;

    const currentColor = newPixels[idx] || '';
    if (currentColor !== targetColor) continue;

    newPixels[idx] = fillColor;

    if (cx > 0) queue.push([cx - 1, cy]);
    if (cx < width - 1) queue.push([cx + 1, cy]);
    if (cy > 0) queue.push([cx, cy - 1]);
    if (cy < height - 1) queue.push([cx, cy + 1]);
  }

  return newPixels;
}

export function flipPixels(
  pixels: string[],
  width: number,
  height: number,
  direction: 'horizontal' | 'vertical'
): string[] {
  const newPixels = new Array(width * height).fill('');

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = y * width + x;
      const targetX = direction === 'horizontal' ? width - 1 - x : x;
      const targetY = direction === 'vertical' ? height - 1 - y : y;
      const targetIdx = targetY * width + targetX;
      newPixels[targetIdx] = pixels[srcIdx] || '';
    }
  }

  return newPixels;
}

export function rotatePixels(
  pixels: string[],
  width: number,
  height: number,
  clockwise = true
): string[] {
  // Supports square and non-square transformations (if square, in-place; if not, maps to current dimensions)
  const newPixels = new Array(width * height).fill('');

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = y * width + x;
      let targetX = 0;
      let targetY = 0;

      if (clockwise) {
        targetX = height - 1 - y;
        targetY = x;
      } else {
        targetX = y;
        targetY = width - 1 - x;
      }

      // Clamp if width != height
      if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
        newPixels[targetY * width + targetX] = pixels[srcIdx] || '';
      }
    }
  }

  return newPixels;
}

export function shiftPixels(
  pixels: string[],
  width: number,
  height: number,
  dx: number,
  dy: number,
  wrap = false
): string[] {
  const newPixels = new Array(width * height).fill('');

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = y * width + x;
      let targetX = x + dx;
      let targetY = y + dy;

      if (wrap) {
        targetX = (targetX % width + width) % width;
        targetY = (targetY % height + height) % height;
      }

      if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
        newPixels[targetY * width + targetX] = pixels[srcIdx] || '';
      }
    }
  }

  return newPixels;
}

export function resizePixels(
  pixels: string[],
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  anchor: 'top-left' | 'center' = 'center'
): string[] {
  const newPixels = new Array(newWidth * newHeight).fill('');

  let offsetX = 0;
  let offsetY = 0;

  if (anchor === 'center') {
    offsetX = Math.floor((newWidth - oldWidth) / 2);
    offsetY = Math.floor((newHeight - oldHeight) / 2);
  }

  for (let y = 0; y < oldHeight; y++) {
    for (let x = 0; x < oldWidth; x++) {
      const targetX = x + offsetX;
      const targetY = y + offsetY;

      if (targetX >= 0 && targetX < newWidth && targetY >= 0 && targetY < newHeight) {
        const srcIdx = y * oldWidth + x;
        const targetIdx = targetY * newWidth + targetX;
        newPixels[targetIdx] = pixels[srcIdx] || '';
      }
    }
  }

  return newPixels;
}

export function drawLineInPixels(
  pixels: string[],
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string
): { newPixels: string[]; pointsDrawn: number } {
  const newPixels = [...pixels];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let currX = x0;
  let currY = y0;
  let pointsDrawn = 0;

  while (true) {
    if (currX >= 0 && currX < width && currY >= 0 && currY < height) {
      newPixels[currY * width + currX] = color;
      pointsDrawn++;
    }
    if (currX === x1 && currY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currY += sy;
    }
  }

  return { newPixels, pointsDrawn };
}

export function drawRectangleInPixels(
  pixels: string[],
  width: number,
  height: number,
  x: number,
  y: number,
  rectW: number,
  rectH: number,
  color: string,
  filled = false
): { newPixels: string[]; pointsDrawn: number } {
  const newPixels = [...pixels];
  let pointsDrawn = 0;

  const minX = Math.min(x, x + rectW - 1);
  const maxX = Math.max(x, x + rectW - 1);
  const minY = Math.min(y, y + rectH - 1);
  const maxY = Math.max(y, y + rectH - 1);

  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        const isBorder = cx === minX || cx === maxX || cy === minY || cy === maxY;
        if (filled || isBorder) {
          newPixels[cy * width + cx] = color;
          pointsDrawn++;
        }
      }
    }
  }

  return { newPixels, pointsDrawn };
}

export function rotatePixelsByDegrees(
  pixels: string[],
  width: number,
  height: number,
  degrees: number
): string[] {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized === 0) return [...pixels];
  if (normalized === 90) return rotatePixels(pixels, width, height, true);
  if (normalized === 180) {
    const once = rotatePixels(pixels, width, height, true);
    return rotatePixels(once, width, height, true);
  }
  if (normalized === 270) return rotatePixels(pixels, width, height, false);
  throw new Error(`Unsupported rotation degrees: ${degrees}. Supported: 90, 180, 270`);
}
