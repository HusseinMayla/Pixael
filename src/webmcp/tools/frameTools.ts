import { WebMcpTool } from '../types';
import { useProjectStore } from '../../store/projectStore';
import { resolveAsset, resolveState, resolveFrame } from '../utils/storeLookup';

export const frameTools: WebMcpTool[] = [
  {
    name: 'add_frame',
    description: 'Adds a new blank frame or a copy of the previous frame to an animation state.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        stateId: {
          type: 'string',
          description: 'The animation state ID',
        },
        insertAtIndex: {
          type: 'number',
          description: 'Optional 0-based index to insert the new frame at (defaults to end)',
        },
        copyPrevious: {
          type: 'boolean',
          description: 'If true, duplicates pixel content from the previous frame; if false, creates a blank frame',
        },
      },
      required: ['assetId', 'stateId'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      insertAtIndex?: number;
      copyPrevious?: boolean;
    }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);

        const store = useProjectStore.getState();
        store.addFrame(asset.id, state.id, input.insertAtIndex, input.copyPrevious);

        // Fetch fresh state to get updated frame index and count
        const freshProject = useProjectStore.getState().project;
        const updatedAsset = freshProject.assets.find((a) => a.id === asset.id);
        const updatedState = updatedAsset?.states.find((s) => s.id === state.id);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          newFrameIndex: freshProject.activeFrameIndex,
          totalFrames: updatedState?.frames.length || 0,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'duplicate_frame',
    description: 'Duplicates an existing frame in an animation state.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        stateId: {
          type: 'string',
          description: 'The animation state ID',
        },
        frameId: {
          type: 'string',
          description: 'ID of the frame to duplicate',
        },
        frameIndex: {
          type: 'number',
          description: '0-based frame index to duplicate (alternative to frameId)',
        },
      },
      required: ['assetId', 'stateId'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
    }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);
        const { frameIndex } = resolveFrame(state, input.frameId, input.frameIndex);

        const store = useProjectStore.getState();
        store.duplicateFrame(asset.id, state.id, frameIndex);

        const freshProject = useProjectStore.getState().project;
        const updatedAsset = freshProject.assets.find((a) => a.id === asset.id);
        const updatedState = updatedAsset?.states.find((s) => s.id === state.id);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          duplicatedFrameIndex: frameIndex,
          newFrameIndex: frameIndex + 1,
          totalFrames: updatedState?.frames.length || 0,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'delete_frame',
    description: 'Deletes a frame from an animation state. If deleting the last frame, it is automatically replaced with a blank frame.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        stateId: {
          type: 'string',
          description: 'The animation state ID',
        },
        frameId: {
          type: 'string',
          description: 'ID of the frame to delete',
        },
        frameIndex: {
          type: 'number',
          description: '0-based frame index to delete (alternative to frameId)',
        },
      },
      required: ['assetId', 'stateId'],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
    }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);
        const { frame, frameIndex } = resolveFrame(state, input.frameId, input.frameIndex);

        const store = useProjectStore.getState();
        store.deleteFrame(asset.id, state.id, frameIndex);

        const freshProject = useProjectStore.getState().project;
        const updatedAsset = freshProject.assets.find((a) => a.id === asset.id);
        const updatedState = updatedAsset?.states.find((s) => s.id === state.id);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          deletedFrameId: frame.id,
          deletedFrameIndex: frameIndex,
          totalFrames: updatedState?.frames.length || 0,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'reorder_frames',
    description: 'Reorders frames in an animation state by specifying an ordered array of frame IDs or fromIndex/toIndex.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        stateId: {
          type: 'string',
          description: 'The animation state ID',
        },
        orderedFrameIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of all frame IDs in the desired order',
        },
        fromIndex: {
          type: 'number',
          description: 'Source 0-based index if shifting single frame',
        },
        toIndex: {
          type: 'number',
          description: 'Target 0-based index if shifting single frame',
        },
      },
      required: ['assetId', 'stateId'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      orderedFrameIds?: string[];
      fromIndex?: number;
      toIndex?: number;
    }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);
        const store = useProjectStore.getState();

        if (Array.isArray(input.orderedFrameIds) && input.orderedFrameIds.length > 0) {
          if (input.orderedFrameIds.length !== state.frames.length) {
            return JSON.stringify({
              status: 'error',
              message: `orderedFrameIds length (${input.orderedFrameIds.length}) does not match state frame count (${state.frames.length})`,
            });
          }

          // Build reordered frames
          const frameMap = new Map(state.frames.map((f) => [f.id, f]));
          const reorderedFrames = [];
          for (const id of input.orderedFrameIds) {
            const found = frameMap.get(id);
            if (!found) {
              return JSON.stringify({ status: 'error', message: `Frame ID "${id}" not found in state "${state.name}"` });
            }
            reorderedFrames.push(found);
          }

          // Apply reordered frames via store
          store.pushHistory();
          const updatedState = { ...state, frames: reorderedFrames };
          const updatedAssets = store.project.assets.map((a) => {
            if (a.id !== asset.id) return a;
            return {
              ...a,
              states: a.states.map((s) => (s.id === state.id ? updatedState : s)),
              updatedAt: Date.now(),
            };
          });
          const updatedProject = { ...store.project, assets: updatedAssets, savedAt: Date.now() };
          useProjectStore.setState({ project: updatedProject });

          return JSON.stringify({
            status: 'success',
            assetId: asset.id,
            stateId: state.id,
            frameOrder: reorderedFrames.map((f) => f.id),
          });
        }

        if (input.fromIndex !== undefined && input.toIndex !== undefined) {
          store.reorderFrames(asset.id, state.id, input.fromIndex, input.toIndex);
          const updatedAsset = store.project.assets.find((a) => a.id === asset.id);
          const updatedState = updatedAsset?.states.find((s) => s.id === state.id);

          return JSON.stringify({
            status: 'success',
            assetId: asset.id,
            stateId: state.id,
            frameOrder: updatedState?.frames.map((f) => f.id) || [],
          });
        }

        return JSON.stringify({
          status: 'error',
          message: 'Must provide either orderedFrameIds array or both fromIndex and toIndex',
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },
];
