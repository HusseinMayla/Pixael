import { FrameData, AnimationState } from '../types/asset';
import { generateId } from '../utils/idGenerator';
import { createEmptyPixels } from './pixelOperations';

export function createFrame(width: number, height: number, initialPixels?: string[]): FrameData {
  return {
    id: generateId('frame'),
    pixels: initialPixels ? [...initialPixels] : createEmptyPixels(width, height),
  };
}

export function cloneFrame(frame: FrameData): FrameData {
  return {
    id: generateId('frame'),
    pixels: [...frame.pixels],
    durationMs: frame.durationMs,
  };
}

export function addFrameToState(
  state: AnimationState,
  width: number,
  height: number,
  insertIndex?: number,
  copyPrevious = false
): { updatedState: AnimationState; newFrameIndex: number } {
  const index = insertIndex !== undefined ? insertIndex : state.frames.length;
  let newFrame: FrameData;

  if (copyPrevious && state.frames.length > 0) {
    const prevFrame = state.frames[Math.max(0, Math.min(index - 1, state.frames.length - 1))];
    newFrame = cloneFrame(prevFrame);
  } else {
    newFrame = createFrame(width, height);
  }

  const updatedFrames = [...state.frames];
  updatedFrames.splice(index, 0, newFrame);

  return {
    updatedState: {
      ...state,
      frames: updatedFrames,
    },
    newFrameIndex: index,
  };
}

export function duplicateFrameInState(
  state: AnimationState,
  frameIndex: number
): { updatedState: AnimationState; newFrameIndex: number } {
  if (frameIndex < 0 || frameIndex >= state.frames.length) {
    return { updatedState: state, newFrameIndex: frameIndex };
  }

  const targetFrame = state.frames[frameIndex];
  const newFrame = cloneFrame(targetFrame);
  const updatedFrames = [...state.frames];
  const newIndex = frameIndex + 1;
  updatedFrames.splice(newIndex, 0, newFrame);

  return {
    updatedState: {
      ...state,
      frames: updatedFrames,
    },
    newFrameIndex: newIndex,
  };
}

export function removeFrameFromState(
  state: AnimationState,
  frameIndex: number,
  width: number,
  height: number
): { updatedState: AnimationState; newFrameIndex: number } {
  if (state.frames.length <= 1) {
    // If last frame is deleted, clear it to an empty frame rather than leaving 0 frames
    return {
      updatedState: {
        ...state,
        frames: [createFrame(width, height)],
      },
      newFrameIndex: 0,
    };
  }

  const updatedFrames = state.frames.filter((_, i) => i !== frameIndex);
  const newIndex = Math.min(frameIndex, updatedFrames.length - 1);

  return {
    updatedState: {
      ...state,
      frames: updatedFrames,
    },
    newFrameIndex: newIndex,
  };
}

export function reorderFramesInState(
  state: AnimationState,
  fromIndex: number,
  toIndex: number
): { updatedState: AnimationState; newFrameIndex: number } {
  if (
    fromIndex < 0 ||
    fromIndex >= state.frames.length ||
    toIndex < 0 ||
    toIndex >= state.frames.length ||
    fromIndex === toIndex
  ) {
    return { updatedState: state, newFrameIndex: fromIndex };
  }

  const updatedFrames = [...state.frames];
  const [movedFrame] = updatedFrames.splice(fromIndex, 1);
  updatedFrames.splice(toIndex, 0, movedFrame);

  return {
    updatedState: {
      ...state,
      frames: updatedFrames,
    },
    newFrameIndex: toIndex,
  };
}
