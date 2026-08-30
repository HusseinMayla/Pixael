import { useProjectStore } from '../../store/projectStore';
import { SpriteAsset, AnimationState, FrameData } from '../../types/asset';

export interface ResolvedFrameContext {
  asset: SpriteAsset;
  state: AnimationState;
  frame: FrameData;
  frameIndex: number;
}

/**
 * Resolves an asset by explicit assetId or defaults to the active selected asset.
 */
export function resolveAsset(assetId?: string): SpriteAsset {
  const store = useProjectStore.getState();
  const project = store.project;

  if (assetId) {
    const found = project.assets.find(a => a.id === assetId);
    if (!found) {
      throw new Error(`Asset not found with ID "${assetId}". Use list_assets to see available assets.`);
    }
    return found;
  }

  const active = store.getActiveAsset();
  if (!active) {
    throw new Error('No active asset selected in project. Create or select an asset first.');
  }
  return active;
}

/**
 * Resolves an animation state within an asset by explicit stateId or defaults to active state.
 */
export function resolveState(asset: SpriteAsset, stateId?: string): AnimationState {
  if (stateId) {
    const found = asset.states.find(s => s.id === stateId);
    if (!found) {
      const available = asset.states.map(s => `"${s.name}" (${s.id})`).join(', ');
      throw new Error(`State not found with ID "${stateId}" in asset "${asset.name}". Available states: ${available}`);
    }
    return found;
  }

  if (asset.states.length === 0) {
    throw new Error(`Asset "${asset.name}" has no animation states.`);
  }

  const store = useProjectStore.getState();
  const activeStateId = store.project.activeStateId;
  const activeState = asset.states.find(s => s.id === activeStateId) || asset.states[0];
  return activeState;
}

/**
 * Resolves a specific frame within an animation state by frameId, frameIndex, or active frame.
 */
export function resolveFrame(
  state: AnimationState,
  frameId?: string,
  frameIndex?: number
): { frame: FrameData; frameIndex: number } {
  if (state.frames.length === 0) {
    throw new Error(`State "${state.name}" has no frames.`);
  }

  if (frameId) {
    const idx = state.frames.findIndex(f => f.id === frameId);
    if (idx < 0) {
      throw new Error(`Frame not found with ID "${frameId}" in state "${state.name}".`);
    }
    return { frame: state.frames[idx], frameIndex: idx };
  }

  if (frameIndex !== undefined && frameIndex !== null) {
    if (frameIndex < 0 || frameIndex >= state.frames.length) {
      throw new Error(`Frame index ${frameIndex} out of bounds (0-${state.frames.length - 1}) in state "${state.name}".`);
    }
    return { frame: state.frames[frameIndex], frameIndex };
  }

  // Default to active frame in project
  const store = useProjectStore.getState();
  const activeIndex = Math.max(0, Math.min(store.project.activeFrameIndex, state.frames.length - 1));
  return { frame: state.frames[activeIndex], frameIndex: activeIndex };
}

/**
 * Resolves full context: Asset -> State -> Frame in one step.
 */
export function resolveContext(
  assetId?: string,
  stateId?: string,
  frameId?: string,
  frameIndex?: number
): ResolvedFrameContext {
  const asset = resolveAsset(assetId);
  const state = resolveState(asset, stateId);
  const { frame, frameIndex: resolvedIndex } = resolveFrame(state, frameId, frameIndex);

  return {
    asset,
    state,
    frame,
    frameIndex: resolvedIndex,
  };
}

/**
 * Resolves a color choice (colorIndex into asset palette or hexColor string) to a concrete hex string.
 * Index 0 is always transparent / empty ("").
 * Index 1..N maps to asset.palette[index - 1] (or 0-based asset.palette if index is within bounds).
 */
export function resolveColor(
  asset: SpriteAsset,
  colorIndex?: number,
  hexColor?: string
): string {
  if (hexColor !== undefined && hexColor !== null) {
    const clean = hexColor.trim();
    if (clean === '' || clean.toLowerCase() === 'transparent') {
      return '';
    }
    return clean;
  }

  if (colorIndex === undefined || colorIndex === null || colorIndex === 0) {
    return ''; // Transparent
  }

  // If colorIndex is 1-based (standard RLE format where 0 is transparent, 1 is first palette color)
  if (colorIndex > 0 && colorIndex <= asset.palette.length) {
    return asset.palette[colorIndex - 1] || '';
  }

  // If colorIndex was passed 0-based directly into palette
  if (colorIndex >= 0 && colorIndex < asset.palette.length) {
    return asset.palette[colorIndex] || '';
  }

  throw new Error(
    `Color index ${colorIndex} is out of bounds for asset palette (palette has ${asset.palette.length} colors).`
  );
}
