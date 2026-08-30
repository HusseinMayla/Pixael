export function addPaletteColorToAsset(palette: string[], newColor: string): string[] {
  const color = newColor.toLowerCase();
  if (palette.includes(color)) return palette;
  return [...palette, color];
}

export function removePaletteColorFromAsset(palette: string[], targetColor: string): string[] {
  const color = targetColor.toLowerCase();
  if (palette.length <= 1) return palette;
  return palette.filter(c => c.toLowerCase() !== color);
}

export function setPaletteColorAtIndex(palette: string[], index: number, newColor: string): string[] {
  if (index < 0 || index >= palette.length) return palette;
  const updated = [...palette];
  updated[index] = newColor.toLowerCase();
  return updated;
}
