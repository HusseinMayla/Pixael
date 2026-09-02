import { create } from 'zustand';
import { ToolType } from '../types/editor';

interface EditorStoreState {
  currentTool: ToolType;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number;
  showGrid: boolean;
  showCheckerboard: boolean;
  zoom: number;
  panX: number;
  panY: number;
  onionSkinning: boolean;
  onionSkinFrames: number;

  // Responsive sidebar drawers
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;

  // Active modal
  activeModal: 'export' | 'new-asset' | 'resize' | 'shortcuts' | 'import' | null;
  pendingImportFile: File | null;

  // Actions
  setTool: (tool: ToolType) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  swapColors: () => void;
  setBrushSize: (size: number) => void;
  toggleGrid: () => void;
  toggleCheckerboard: () => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (panX: number, panY: number) => void;
  resetView: () => void;
  toggleOnionSkinning: () => void;
  setOnionSkinFrames: (frames: number) => void;
  toggleLeftSidebar: (open?: boolean) => void;
  toggleRightSidebar: (open?: boolean) => void;
  openModal: (modal: 'export' | 'new-asset' | 'resize' | 'shortcuts' | 'import') => void;
  setPendingImportFile: (file: File | null) => void;
  closeModal: () => void;
}

export const useEditorStore = create<EditorStoreState>((set) => ({
  currentTool: 'pencil',
  primaryColor: '#c2c3c7',
  secondaryColor: '#1d2b53',
  brushSize: 1,
  showGrid: true,
  showCheckerboard: true,
  zoom: 24,
  panX: 0,
  panY: 0,
  onionSkinning: false,
  onionSkinFrames: 1,
  isLeftSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  isRightSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1280 : true,
  activeModal: null,
  pendingImportFile: null,

  setTool: (tool) => set({ currentTool: tool }),
  setPrimaryColor: (color) => set({ primaryColor: color }),
  setSecondaryColor: (color) => set({ secondaryColor: color }),
  swapColors: () => set((state) => ({ primaryColor: state.secondaryColor, secondaryColor: state.primaryColor })),
  setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(8, size)) }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleCheckerboard: () => set((state) => ({ showCheckerboard: !state.showCheckerboard })),
  setZoom: (zoomOrFn) =>
    set((state) => {
      const val = typeof zoomOrFn === 'function' ? zoomOrFn(state.zoom) : zoomOrFn;
      return { zoom: Math.max(4, Math.min(64, Math.round(val))) };
    }),
  setPan: (panX, panY) => set({ panX, panY }),
  resetView: () => set({ zoom: 24, panX: 0, panY: 0 }),
  toggleOnionSkinning: () => set((state) => ({ onionSkinning: !state.onionSkinning })),
  setOnionSkinFrames: (frames) => set({ onionSkinFrames: Math.max(1, Math.min(3, frames)) }),
  toggleLeftSidebar: (open) =>
    set((state) => ({
      isLeftSidebarOpen: open !== undefined ? open : !state.isLeftSidebarOpen,
    })),
  toggleRightSidebar: (open) =>
    set((state) => ({
      isRightSidebarOpen: open !== undefined ? open : !state.isRightSidebarOpen,
    })),
  openModal: (modal) => set({ activeModal: modal }),
  setPendingImportFile: (file) => set({ pendingImportFile: file }),
  closeModal: () => set({ activeModal: null, pendingImportFile: null }),
}));
