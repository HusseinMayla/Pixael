export type ToolType = 'pan' | 'pencil' | 'eraser' | 'bucket' | 'eyedropper' | 'line' | 'rectangle';

export interface EditorToolState {
  currentTool: ToolType;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number; // 1, 2, 3, 4
  showGrid: boolean;
  showCheckerboard: boolean;
  zoom: number; // 1 to 32 (default ~16x for 16x16, 8x for 32x32)
  panX: number;
  panY: number;
  onionSkinning: boolean;
  onionSkinFrames: number; // 1 or 2 frames before/after
}

export interface CanvasPoint {
  x: number;
  y: number;
}
