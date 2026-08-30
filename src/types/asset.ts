export interface FrameData {
  id: string;
  pixels: string[]; // Flat array of length width * height, containing hex strings (e.g. "#3b82f6") or "" for transparent
  durationMs?: number; // Optional frame duration override in ms
}

export interface AnimationState {
  id: string;
  name: string; // e.g. "Idle", "Walk", "Run", "Attack", "Jump", "Hurt", "Death"
  fps: number; // e.g. 8, 12, 16
  loop: boolean;
  frames: FrameData[];
}

export interface SpriteAsset {
  id: string;
  name: string; // e.g. "Knight", "Slime", "Archer", "Chest"
  category: string; // e.g. "Characters", "Enemies", "Environment", "Items"
  width: number; // 8, 16, 24, 32, 48, 64, etc.
  height: number;
  states: AnimationState[];
  palette: string[]; // Active color swatches (hex strings)
  createdAt: number;
  updatedAt: number;
}

export interface ProjectData {
  id: string;
  name: string;
  version: string;
  assets: SpriteAsset[];
  activeAssetId: string | null;
  activeStateId: string | null;
  activeFrameIndex: number;
  savedAt: number;
}
