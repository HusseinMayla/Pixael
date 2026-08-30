import { create } from 'zustand';

interface PlaybackStoreState {
  isPlaying: boolean;
  currentPreviewFrame: number;
  customFps: number | null;
  loop: boolean;
  previewZoom: number;

  play: (totalFrames?: number) => void;
  pause: () => void;
  togglePlay: (totalFrames?: number) => void;
  setPreviewFrame: (index: number) => void;
  stepFrame: (delta: number, totalFrames: number) => void;
  setCustomFps: (fps: number | null) => void;
  setLoop: (loop: boolean) => void;
  setPreviewZoom: (zoom: number) => void;
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  isPlaying: true,
  currentPreviewFrame: 0,
  customFps: null,
  loop: true,
  previewZoom: 6,

  play: (totalFrames?: number) =>
    set((state) => {
      if (totalFrames !== undefined && totalFrames > 0 && state.currentPreviewFrame >= totalFrames - 1) {
        return { isPlaying: true, currentPreviewFrame: 0 };
      }
      return { isPlaying: true };
    }),
  pause: () => set({ isPlaying: false }),
  togglePlay: (totalFrames?: number) =>
    set((state) => {
      if (!state.isPlaying) {
        if (totalFrames !== undefined && totalFrames > 0 && state.currentPreviewFrame >= totalFrames - 1) {
          return { isPlaying: true, currentPreviewFrame: 0 };
        }
        return { isPlaying: true };
      }
      return { isPlaying: false };
    }),
  setPreviewFrame: (index) => set({ currentPreviewFrame: Math.max(0, index) }),
  stepFrame: (delta, totalFrames) => {
    if (totalFrames <= 0) return;
    set((state) => {
      let next = state.currentPreviewFrame + delta;
      if (next < 0) next = totalFrames - 1;
      if (next >= totalFrames) next = 0;
      return { currentPreviewFrame: next, isPlaying: false };
    });
  },
  setCustomFps: (fps) => set({ customFps: fps }),
  setLoop: (loop) => set({ loop }),
  setPreviewZoom: (previewZoom) => set({ previewZoom: Math.max(1, Math.min(16, previewZoom)) }),
}));
