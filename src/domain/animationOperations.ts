import { AnimationState, SpriteAsset } from '../types/asset';
import { generateId } from '../utils/idGenerator';
import { createFrame, cloneFrame } from './frameOperations';

export function createAnimationState(
  name: string,
  width: number,
  height: number,
  fps = 8,
  loop = true,
  frameCount = 1
): AnimationState {
  const frames = Array.from({ length: Math.max(1, frameCount) }, () =>
    createFrame(width, height)
  );

  return {
    id: generateId('state'),
    name: name.trim() || 'New State',
    fps: Math.max(1, Math.min(60, fps)),
    loop,
    frames,
  };
}

export function cloneAnimationState(state: AnimationState): AnimationState {
  return {
    id: generateId('state'),
    name: `${state.name} (Copy)`,
    fps: state.fps,
    loop: state.loop,
    frames: state.frames.map(cloneFrame),
  };
}

export function addStateToAsset(
  asset: SpriteAsset,
  newState: AnimationState
): { updatedAsset: SpriteAsset; selectedStateId: string } {
  return {
    updatedAsset: {
      ...asset,
      states: [...asset.states, newState],
      updatedAt: Date.now(),
    },
    selectedStateId: newState.id,
  };
}

export function removeStateFromAsset(
  asset: SpriteAsset,
  stateId: string
): { updatedAsset: SpriteAsset; selectedStateId: string } {
  if (asset.states.length <= 1) {
    // Cannot delete the only remaining state; replace with a clean Idle state
    const defaultState = createAnimationState('Idle', asset.width, asset.height, 8, true, 1);
    return {
      updatedAsset: {
        ...asset,
        states: [defaultState],
        updatedAt: Date.now(),
      },
      selectedStateId: defaultState.id,
    };
  }

  const deletedIndex = asset.states.findIndex(s => s.id === stateId);
  const updatedStates = asset.states.filter(s => s.id !== stateId);
  const nextActiveIndex = Math.max(0, Math.min(deletedIndex >= 0 ? deletedIndex : 0, updatedStates.length - 1));

  return {
    updatedAsset: {
      ...asset,
      states: updatedStates,
      updatedAt: Date.now(),
    },
    selectedStateId: updatedStates[nextActiveIndex].id,
  };
}

export function reorderStatesInAsset(
  asset: SpriteAsset,
  fromIndex: number,
  toIndex: number
): SpriteAsset {
  if (
    fromIndex < 0 ||
    fromIndex >= asset.states.length ||
    toIndex < 0 ||
    toIndex >= asset.states.length ||
    fromIndex === toIndex
  ) {
    return asset;
  }

  const updatedStates = [...asset.states];
  const [movedState] = updatedStates.splice(fromIndex, 1);
  updatedStates.splice(toIndex, 0, movedState);

  return {
    ...asset,
    states: updatedStates,
    updatedAt: Date.now(),
  };
}
