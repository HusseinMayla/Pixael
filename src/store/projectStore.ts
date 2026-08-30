import { create } from 'zustand';
import { ProjectData, SpriteAsset, AnimationState, FrameData } from '../types/asset';
import { getInitialProjectData } from '../persistence/initialData';
import { saveProjectToStorage, loadProjectFromStorage } from '../persistence/indexedDbStorage';
import * as domain from '../domain';

interface ProjectStoreState {
  project: ProjectData;
  history: ProjectData[];
  future: ProjectData[];
  isLoaded: boolean;
  isSaving: boolean;
  lastSaved: number;

  // Lifecycle
  initializeProject: () => Promise<void>;
  resetToDefault: () => Promise<void>;
  setProjectName: (name: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;

  // Selectors
  getActiveAsset: () => SpriteAsset | null;
  getActiveState: () => AnimationState | null;
  getActiveFrame: () => FrameData | null;

  // Asset Domain Operations
  createAsset: (options: domain.CreateAssetOptions) => SpriteAsset;
  selectAsset: (assetId: string) => void;
  updateAsset: (assetId: string, updates: Partial<Pick<SpriteAsset, 'name' | 'category'>>) => void;
  deleteAsset: (assetId: string) => void;
  duplicateAsset: (assetId: string) => SpriteAsset | null;
  resizeSprite: (assetId: string, width: number, height: number, anchor?: 'top-left' | 'center') => void;

  // Animation State Domain Operations
  createAnimationState: (assetId: string, options: { name: string; fps?: number; loop?: boolean; frameCount?: number }) => AnimationState | null;
  renameAnimationState: (assetId: string, stateId: string, name: string) => void;
  updateAnimationState: (assetId: string, stateId: string, updates: { fps?: number; loop?: boolean }) => void;
  deleteAnimationState: (assetId: string, stateId: string) => void;
  duplicateAnimationState: (assetId: string, stateId: string) => AnimationState | null;
  selectAnimationState: (assetId: string, stateId: string) => void;

  // Frame Domain Operations
  addFrame: (assetId: string, stateId: string, insertIndex?: number, copyPrevious?: boolean) => void;
  duplicateFrame: (assetId: string, stateId: string, frameIndex: number) => void;
  deleteFrame: (assetId: string, stateId: string, frameIndex: number) => void;
  reorderFrames: (assetId: string, stateId: string, fromIndex: number, toIndex: number) => void;
  selectFrame: (frameIndex: number) => void;

  // Canvas / Pixel Domain Operations
  setPixel: (x: number, y: number, color: string, brushSize?: number) => void;
  setPixelsBatch: (updates: Array<{ x: number; y: number; color: string }>) => void;
  floodFill: (x: number, y: number, fillColor: string) => void;
  clearCurrentFrame: () => void;
  flipCurrentFrame: (direction: 'horizontal' | 'vertical') => void;
  rotateCurrentFrame: (clockwise?: boolean) => void;
  shiftCurrentFrame: (dx: number, dy: number) => void;
  updateTargetFramePixels: (
    assetId: string,
    stateId: string,
    frameIdentifier: { frameId?: string; frameIndex?: number },
    updater: (currentPixels: string[], asset: SpriteAsset) => string[]
  ) => { frame: FrameData; asset: SpriteAsset; state: AnimationState };

  // Palette Domain Operations
  setPalette: (assetId: string, colors: string[]) => void;
  addPaletteColor: (assetId: string, color: string) => void;
  removePaletteColor: (assetId: string, color: string) => void;
  setPaletteColorAtIndex: (assetId: string, index: number, color: string) => void;

  // Project Import/Export
  importProjectJson: (jsonString: string) => void;
}

const MAX_HISTORY = 30;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function debounceSave(project: ProjectData, setSaving: (saving: boolean, time: number) => void) {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    try {
      setSaving(true, Date.now());
      await saveProjectToStorage(project);
      setSaving(false, Date.now());
    } catch (err) {
      console.error('Failed to save project to IndexedDB:', err);
      setSaving(false, Date.now());
    }
  }, 400);
}

const initialData = getInitialProjectData();

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: initialData,
  history: [],
  future: [],
  isLoaded: false,
  isSaving: false,
  lastSaved: Date.now(),

  initializeProject: async () => {
    try {
      const stored = await loadProjectFromStorage();
      if (stored && stored.assets && stored.assets.length > 0) {
        // Validate active pointers
        let activeAssetId = stored.activeAssetId;
        if (!stored.assets.some(a => a.id === activeAssetId)) {
          activeAssetId = stored.assets[0].id;
        }

        const activeAsset = stored.assets.find(a => a.id === activeAssetId) || stored.assets[0];
        let activeStateId = stored.activeStateId;
        if (!activeAsset.states.some(s => s.id === activeStateId)) {
          activeStateId = activeAsset.states[0]?.id || null;
        }

        set({
          project: {
            ...stored,
            activeAssetId,
            activeStateId,
            activeFrameIndex: Math.min(
              stored.activeFrameIndex || 0,
              (activeAsset.states.find(s => s.id === activeStateId)?.frames.length || 1) - 1
            ),
          },
          isLoaded: true,
          history: [],
          future: [],
        });
      } else {
        const fresh = getInitialProjectData();
        set({
          project: fresh,
          isLoaded: true,
          history: [],
          future: [],
        });
        await saveProjectToStorage(fresh);
      }
    } catch (err) {
      console.error('Error initializing project storage:', err);
      set({ project: getInitialProjectData(), isLoaded: true });
    }
  },

  resetToDefault: async () => {
    const fresh = getInitialProjectData();
    set({
      project: fresh,
      history: [],
      future: [],
      lastSaved: Date.now(),
    });
    await saveProjectToStorage(fresh);
  },

  setProjectName: (name: string) => {
    const { project, pushHistory } = get();
    pushHistory();
    const updated = { ...project, name: name.trim() || 'Untitled Project', savedAt: Date.now() };
    set({ project: updated });
    debounceSave(updated, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  // History (Undo / Redo)
  pushHistory: () => {
    const { project, history } = get();
    // Deep clone project for reliable snapshot
    const snapshot = JSON.parse(JSON.stringify(project));
    const updatedHistory = [...history, snapshot].slice(-MAX_HISTORY);
    set({ history: updatedHistory, future: [] });
  },

  undo: () => {
    const { history, project, future } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const newFuture = [JSON.parse(JSON.stringify(project)), ...future];

    set({
      project: previous,
      history: newHistory,
      future: newFuture,
    });
    debounceSave(previous, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  redo: () => {
    const { future, project, history } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const newHistory = [...history, JSON.parse(JSON.stringify(project))];

    set({
      project: next,
      history: newHistory,
      future: newFuture,
    });
    debounceSave(next, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  // Selectors
  getActiveAsset: () => {
    const { project } = get();
    if (!project.activeAssetId) return project.assets[0] || null;
    return project.assets.find(a => a.id === project.activeAssetId) || project.assets[0] || null;
  },

  getActiveState: () => {
    const asset = get().getActiveAsset();
    if (!asset || asset.states.length === 0) return null;
    const { project } = get();
    if (!project.activeStateId) return asset.states[0];
    return asset.states.find(s => s.id === project.activeStateId) || asset.states[0];
  },

  getActiveFrame: () => {
    const state = get().getActiveState();
    if (!state || state.frames.length === 0) return null;
    const { project } = get();
    const idx = Math.max(0, Math.min(project.activeFrameIndex, state.frames.length - 1));
    return state.frames[idx] || null;
  },

  // -------------------------------------------------------------
  // Asset Operations
  // -------------------------------------------------------------
  createAsset: (options) => {
    const { project, pushHistory } = get();
    pushHistory();

    const newAsset = domain.createAsset(options);
    const updatedProject: ProjectData = {
      ...project,
      assets: [...project.assets, newAsset],
      activeAssetId: newAsset.id,
      activeStateId: newAsset.states[0].id,
      activeFrameIndex: 0,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
    return newAsset;
  },

  selectAsset: (assetId) => {
    const { project } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;

    set({
      project: {
        ...project,
        activeAssetId: asset.id,
        activeStateId: asset.states[0]?.id || null,
        activeFrameIndex: 0,
      },
    });
  },

  updateAsset: (assetId, updates) => {
    const { project, pushHistory } = get();
    pushHistory();

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        ...updates,
        updatedAt: Date.now(),
      };
    });

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  deleteAsset: (assetId) => {
    const { project, pushHistory } = get();
    if (project.assets.length <= 1) {
      alert('Cannot delete the last asset in project.');
      return;
    }

    pushHistory();
    const updatedAssets = project.assets.filter(a => a.id !== assetId);
    const newActiveAsset = updatedAssets[0];

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeAssetId: newActiveAsset.id,
      activeStateId: newActiveAsset.states[0]?.id || null,
      activeFrameIndex: 0,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  duplicateAsset: (assetId) => {
    const { project, pushHistory } = get();
    const target = project.assets.find(a => a.id === assetId);
    if (!target) return null;

    pushHistory();
    const cloned = domain.cloneAsset(target);
    const updatedAssets = [...project.assets, cloned];

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeAssetId: cloned.id,
      activeStateId: cloned.states[0].id,
      activeFrameIndex: 0,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
    return cloned;
  },

  resizeSprite: (assetId, width, height, anchor = 'center') => {
    const { project, pushHistory } = get();
    const target = project.assets.find(a => a.id === assetId);
    if (!target) return;

    pushHistory();
    const resized = domain.resizeAsset(target, width, height, anchor);
    const updatedAssets = project.assets.map(a => (a.id === assetId ? resized : a));

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  // -------------------------------------------------------------
  // Animation State Operations
  // -------------------------------------------------------------
  createAnimationState: (assetId, options) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return null;

    pushHistory();
    const newState = domain.createAnimationState(
      options.name,
      asset.width,
      asset.height,
      options.fps || 8,
      options.loop !== undefined ? options.loop : true,
      options.frameCount || 1
    );

    const { updatedAsset } = domain.addStateToAsset(asset, newState);
    const updatedAssets = project.assets.map(a => (a.id === assetId ? updatedAsset : a));

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeStateId: newState.id,
      activeFrameIndex: 0,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
    return newState;
  },

  renameAnimationState: (assetId, stateId, name) => {
    const { project, pushHistory } = get();
    pushHistory();

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        states: a.states.map(s => (s.id === stateId ? { ...s, name: name.trim() || 'State' } : s)),
        updatedAt: Date.now(),
      };
    });

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  updateAnimationState: (assetId, stateId, updates) => {
    const { project, pushHistory } = get();
    pushHistory();

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        states: a.states.map(s => (s.id === stateId ? { ...s, ...updates } : s)),
        updatedAt: Date.now(),
      };
    });

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  deleteAnimationState: (assetId, stateId) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;

    pushHistory();
    const { updatedAsset, selectedStateId } = domain.removeStateFromAsset(asset, stateId);
    const updatedAssets = project.assets.map(a => (a.id === assetId ? updatedAsset : a));

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeStateId: selectedStateId,
      activeFrameIndex: 0,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  duplicateAnimationState: (assetId, stateId) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return null;

    const targetState = asset.states.find(s => s.id === stateId);
    if (!targetState) return null;

    pushHistory();
    const clonedState = domain.cloneAnimationState(targetState);
    const { updatedAsset } = domain.addStateToAsset(asset, clonedState);
    const updatedAssets = project.assets.map(a => (a.id === assetId ? updatedAsset : a));

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeStateId: clonedState.id,
      activeFrameIndex: 0,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
    return clonedState;
  },

  selectAnimationState: (assetId, stateId) => {
    const { project } = get();
    set({
      project: {
        ...project,
        activeAssetId: assetId,
        activeStateId: stateId,
        activeFrameIndex: 0,
      },
    });
  },

  // -------------------------------------------------------------
  // Frame Operations
  // -------------------------------------------------------------
  addFrame: (assetId, stateId, insertIndex, copyPrevious = false) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;
    const state = asset.states.find(s => s.id === stateId);
    if (!state) return;

    pushHistory();
    const { updatedState, newFrameIndex } = domain.addFrameToState(
      state,
      asset.width,
      asset.height,
      insertIndex,
      copyPrevious
    );

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        states: a.states.map(s => (s.id === stateId ? updatedState : s)),
        updatedAt: Date.now(),
      };
    });

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeFrameIndex: newFrameIndex,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  duplicateFrame: (assetId, stateId, frameIndex) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;
    const state = asset.states.find(s => s.id === stateId);
    if (!state) return;

    pushHistory();
    const { updatedState, newFrameIndex } = domain.duplicateFrameInState(state, frameIndex);

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        states: a.states.map(s => (s.id === stateId ? updatedState : s)),
        updatedAt: Date.now(),
      };
    });

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeFrameIndex: newFrameIndex,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  deleteFrame: (assetId, stateId, frameIndex) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;
    const state = asset.states.find(s => s.id === stateId);
    if (!state) return;

    pushHistory();
    const { updatedState, newFrameIndex } = domain.removeFrameFromState(
      state,
      frameIndex,
      asset.width,
      asset.height
    );

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        states: a.states.map(s => (s.id === stateId ? updatedState : s)),
        updatedAt: Date.now(),
      };
    });

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeFrameIndex: newFrameIndex,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  reorderFrames: (assetId, stateId, fromIndex, toIndex) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;
    const state = asset.states.find(s => s.id === stateId);
    if (!state) return;

    pushHistory();
    const { updatedState, newFrameIndex } = domain.reorderFramesInState(state, fromIndex, toIndex);

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        states: a.states.map(s => (s.id === stateId ? updatedState : s)),
        updatedAt: Date.now(),
      };
    });

    const updatedProject: ProjectData = {
      ...project,
      assets: updatedAssets,
      activeFrameIndex: newFrameIndex,
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  selectFrame: (frameIndex) => {
    const { project } = get();
    set({
      project: {
        ...project,
        activeFrameIndex: Math.max(0, frameIndex),
      },
    });
  },

  // -------------------------------------------------------------
  // Canvas / Drawing Operations
  // -------------------------------------------------------------
  setPixel: (x, y, color, brushSize = 1) => {
    const asset = get().getActiveAsset();
    const state = get().getActiveState();
    const frame = get().getActiveFrame();
    if (!asset || !state || !frame) return;

    const newPixels = domain.setPixelInPixels(
      frame.pixels,
      asset.width,
      asset.height,
      x,
      y,
      color,
      brushSize
    );

    const updatedFrame: FrameData = { ...frame, pixels: newPixels };
    const frameIndex = get().project.activeFrameIndex;

    const updatedFrames = state.frames.map((f, i) => (i === frameIndex ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === state.id ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...get().project,
      assets: get().project.assets.map(a => (a.id === asset.id ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  setPixelsBatch: (updates) => {
    const asset = get().getActiveAsset();
    const state = get().getActiveState();
    const frame = get().getActiveFrame();
    if (!asset || !state || !frame) return;

    const newPixels = domain.setPixelsBatchInPixels(
      frame.pixels,
      asset.width,
      asset.height,
      updates
    );

    const updatedFrame: FrameData = { ...frame, pixels: newPixels };
    const frameIndex = get().project.activeFrameIndex;

    const updatedFrames = state.frames.map((f, i) => (i === frameIndex ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === state.id ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...get().project,
      assets: get().project.assets.map(a => (a.id === asset.id ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  floodFill: (x, y, fillColor) => {
    const asset = get().getActiveAsset();
    const state = get().getActiveState();
    const frame = get().getActiveFrame();
    if (!asset || !state || !frame) return;

    get().pushHistory();

    const newPixels = domain.floodFillInPixels(
      frame.pixels,
      asset.width,
      asset.height,
      x,
      y,
      fillColor
    );

    const updatedFrame: FrameData = { ...frame, pixels: newPixels };
    const frameIndex = get().project.activeFrameIndex;

    const updatedFrames = state.frames.map((f, i) => (i === frameIndex ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === state.id ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...get().project,
      assets: get().project.assets.map(a => (a.id === asset.id ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  clearCurrentFrame: () => {
    const asset = get().getActiveAsset();
    const state = get().getActiveState();
    const frame = get().getActiveFrame();
    if (!asset || !state || !frame) return;

    get().pushHistory();

    const empty = domain.createEmptyPixels(asset.width, asset.height);
    const updatedFrame: FrameData = { ...frame, pixels: empty };
    const frameIndex = get().project.activeFrameIndex;

    const updatedFrames = state.frames.map((f, i) => (i === frameIndex ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === state.id ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...get().project,
      assets: get().project.assets.map(a => (a.id === asset.id ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  flipCurrentFrame: (direction) => {
    const asset = get().getActiveAsset();
    const state = get().getActiveState();
    const frame = get().getActiveFrame();
    if (!asset || !state || !frame) return;

    get().pushHistory();

    const flipped = domain.flipPixels(frame.pixels, asset.width, asset.height, direction);
    const updatedFrame: FrameData = { ...frame, pixels: flipped };
    const frameIndex = get().project.activeFrameIndex;

    const updatedFrames = state.frames.map((f, i) => (i === frameIndex ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === state.id ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...get().project,
      assets: get().project.assets.map(a => (a.id === asset.id ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  rotateCurrentFrame: (clockwise = true) => {
    const asset = get().getActiveAsset();
    const state = get().getActiveState();
    const frame = get().getActiveFrame();
    if (!asset || !state || !frame) return;

    get().pushHistory();

    const rotated = domain.rotatePixels(frame.pixels, asset.width, asset.height, clockwise);
    const updatedFrame: FrameData = { ...frame, pixels: rotated };
    const frameIndex = get().project.activeFrameIndex;

    const updatedFrames = state.frames.map((f, i) => (i === frameIndex ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === state.id ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...get().project,
      assets: get().project.assets.map(a => (a.id === asset.id ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  shiftCurrentFrame: (dx, dy) => {
    const asset = get().getActiveAsset();
    const state = get().getActiveState();
    const frame = get().getActiveFrame();
    if (!asset || !state || !frame) return;

    get().pushHistory();

    const shifted = domain.shiftPixels(frame.pixels, asset.width, asset.height, dx, dy, true);
    const updatedFrame: FrameData = { ...frame, pixels: shifted };
    const frameIndex = get().project.activeFrameIndex;

    const updatedFrames = state.frames.map((f, i) => (i === frameIndex ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === state.id ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...get().project,
      assets: get().project.assets.map(a => (a.id === asset.id ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  updateTargetFramePixels: (assetId, stateId, frameIdentifier, updater) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);

    const state = asset.states.find(s => s.id === stateId);
    if (!state) throw new Error(`State not found: ${stateId} in asset ${asset.name}`);

    let frameIdx = 0;
    if (frameIdentifier.frameId) {
      const idx = state.frames.findIndex(f => f.id === frameIdentifier.frameId);
      if (idx < 0) throw new Error(`Frame ID not found: ${frameIdentifier.frameId}`);
      frameIdx = idx;
    } else if (frameIdentifier.frameIndex !== undefined) {
      if (frameIdentifier.frameIndex < 0 || frameIdentifier.frameIndex >= state.frames.length) {
        throw new Error(`Frame index ${frameIdentifier.frameIndex} out of bounds (0-${state.frames.length - 1})`);
      }
      frameIdx = frameIdentifier.frameIndex;
    }

    const currentFrame = state.frames[frameIdx];
    if (!currentFrame) throw new Error('Target frame not found');

    pushHistory();

    const newPixels = updater(currentFrame.pixels, asset);
    if (!Array.isArray(newPixels) || newPixels.length !== asset.width * asset.height) {
      throw new Error(`Invalid pixel buffer returned by updater: expected length ${asset.width * asset.height}, got ${newPixels?.length}`);
    }

    const updatedFrame: FrameData = { ...currentFrame, pixels: newPixels };
    const updatedFrames = state.frames.map((f, i) => (i === frameIdx ? updatedFrame : f));
    const updatedState = { ...state, frames: updatedFrames };
    const updatedAsset = {
      ...asset,
      states: asset.states.map(s => (s.id === stateId ? updatedState : s)),
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...project,
      assets: project.assets.map(a => (a.id === assetId ? updatedAsset : a)),
      savedAt: Date.now(),
    };

    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));

    return { frame: updatedFrame, asset: updatedAsset, state: updatedState };
  },

  // -------------------------------------------------------------
  // Palette Operations
  // -------------------------------------------------------------
  setPalette: (assetId, colors) => {
    const { project, pushHistory } = get();
    pushHistory();

    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        palette: [...colors],
        updatedAt: Date.now(),
      };
    });

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  addPaletteColor: (assetId, color) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;

    pushHistory();
    const updatedPalette = domain.addPaletteColorToAsset(asset.palette, color);
    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        palette: updatedPalette,
        updatedAt: Date.now(),
      };
    });

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  removePaletteColor: (assetId, color) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;

    pushHistory();
    const updatedPalette = domain.removePaletteColorFromAsset(asset.palette, color);
    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        palette: updatedPalette,
        updatedAt: Date.now(),
      };
    });

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  setPaletteColorAtIndex: (assetId, index, color) => {
    const { project, pushHistory } = get();
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;

    pushHistory();
    const updatedPalette = domain.setPaletteColorAtIndex(asset.palette, index, color);
    const updatedAssets = project.assets.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        palette: updatedPalette,
        updatedAt: Date.now(),
      };
    });

    const updatedProject = { ...project, assets: updatedAssets, savedAt: Date.now() };
    set({ project: updatedProject });
    debounceSave(updatedProject, (isSaving, lastSaved) => set({ isSaving, lastSaved }));
  },

  // -------------------------------------------------------------
  // Project Import/Export
  // -------------------------------------------------------------
  importProjectJson: (jsonString) => {
    try {
      const parsed = domain.importProjectFromJson(jsonString);
      get().pushHistory();
      set({
        project: parsed,
        lastSaved: Date.now(),
      });
      saveProjectToStorage(parsed);
    } catch (err) {
      alert(`Invalid project JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },
}));
