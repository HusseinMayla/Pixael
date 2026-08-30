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
