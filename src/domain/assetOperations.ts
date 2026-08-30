import { SpriteAsset, AnimationState } from '../types/asset';
import { generateId } from '../utils/idGenerator';
import { DEFAULT_PALETTE } from '../constants/palettes';
import { createAnimationState } from './animationOperations';
import { resizePixels } from './pixelOperations';

export interface CreateAssetOptions {
  name: string;
  category?: string;
  width?: number;
  height?: number;
  palette?: string[];
  starterStates?: string[]; // e.g. ["Idle", "Walk", "Attack"]
}

export function createAsset(options: CreateAssetOptions): SpriteAsset {
  const width = options.width || 16;
  const height = options.height || 16;
  const stateNames = options.starterStates && options.starterStates.length > 0
    ? options.starterStates
    : ['Idle'];

  const states: AnimationState[] = stateNames.map((name) =>
    createAnimationState(name, width, height, 8, true, 2)
  );

  return {
    id: generateId('asset'),
    name: options.name.trim() || 'New Sprite',
    category: options.category || 'Characters',
    width,
    height,
    states,
    palette: options.palette ? [...options.palette] : [...DEFAULT_PALETTE],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function cloneAsset(asset: SpriteAsset): SpriteAsset {
  return {
    id: generateId('asset'),
    name: `${asset.name} (Copy)`,
    category: asset.category,
    width: asset.width,
    height: asset.height,
    palette: [...asset.palette],
    states: asset.states.map(state => ({
      id: generateId('state'),
      name: state.name,
      fps: state.fps,
      loop: state.loop,
      frames: state.frames.map(frame => ({
        id: generateId('frame'),
        pixels: [...frame.pixels],
        durationMs: frame.durationMs,
      })),
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function resizeAsset(
  asset: SpriteAsset,
  newWidth: number,
  newHeight: number,
  anchor: 'top-left' | 'center' = 'center'
): SpriteAsset {
  if (newWidth === asset.width && newHeight === asset.height) {
    return asset;
  }

  const updatedStates = asset.states.map(state => ({
    ...state,
    frames: state.frames.map(frame => ({
      ...frame,
      pixels: resizePixels(frame.pixels, asset.width, asset.height, newWidth, newHeight, anchor),
    })),
  }));

  return {
    ...asset,
    width: newWidth,
    height: newHeight,
    states: updatedStates,
    updatedAt: Date.now(),
  };
}
