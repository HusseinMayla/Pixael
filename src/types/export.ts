export type SpriteSheetLayout = 'horizontal' | 'vertical' | 'grid';

export interface ExportOptions {
  format: 'png' | 'spritesheet' | 'project-json';
  scale: number; // 1x, 2x, 4x, 8x, 16x
  layout?: SpriteSheetLayout;
  columns?: number; // for grid layout
  padding?: number; // padding in pixels between frames
  includeMetadata?: boolean; // include JSON metadata with frame bounds and FPS
  includeAllStates?: boolean; // export all animation states into one unified sheet or just current state
}

export interface FrameMetadata {
  index: number;
  state: string;
  x: number;
  y: number;
  width: number;
  height: number;
  durationMs: number;
}

export interface SpriteSheetMetadata {
  meta: {
    appName: string;
    version: string;
    assetName: string;
    image: string;
    size: { w: number; h: number };
    scale: number;
    fps: number;
    totalFrames: number;
  };
  frames: Record<string, {
    frame: { x: number; y: number; w: number; h: number };
    duration: number;
    state: string;
  }>;
  animations: Record<string, string[]>;
}
