export interface SliceOptions {
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  offsetX?: number;
  offsetY?: number;
  spacingX?: number;
  spacingY?: number;
  alphaThreshold?: number; // 0-255, pixels with alpha below this become transparent ""
  autoCropTransparent?: boolean;
}

export interface ImportDestination {
  type: 'new-asset' | 'new-state' | 'replace-frame' | 'add-frames';
  assetName?: string;
  category?: string;
  stateName?: string;
  fps?: number;
  loop?: boolean;
  targetAssetId?: string;
  targetStateId?: string;
}

export interface ExtractedSliceResult {
  frames: Array<{
    id: string;
    pixels: string[];
    width: number;
    height: number;
  }>;
  width: number;
  height: number;
  palette: string[];
  totalFrames: number;
}
