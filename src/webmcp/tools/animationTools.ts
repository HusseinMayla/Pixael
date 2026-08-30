import { WebMcpTool } from '../types';
import { useProjectStore } from '../../store/projectStore';
import { usePlaybackStore } from '../../store/playbackStore';
import { resolveAsset, resolveState } from '../utils/storeLookup';

export const animationTools: WebMcpTool[] = [
  {
    name: 'create_animation_state',
    description: 'Adds a new animation state (e.g. "Walk", "Attack", "Jump") with blank frames to a sprite asset.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        name: {
          type: 'string',
          description: 'State name (e.g. "Walk", "Attack")',
        },
        fps: {
          type: 'number',
          description: 'Playback speed in FPS (1-60, default 8)',
        },
        loop: {
          type: 'boolean',
          description: 'Whether the animation loops (default true)',
        },
        frameCount: {
          type: 'number',
          description: 'Number of initial frames to create (default 1)',
        },
      },
      required: ['assetId', 'name'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      name: string;
      fps?: number;
      loop?: boolean;
      frameCount?: number;
    }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        if (!input?.name || typeof input.name !== 'string' || input.name.trim() === '') {
          return JSON.stringify({ status: 'error', message: 'Animation state name is required' });
        }

        const fps = input.fps ? Math.max(1, Math.min(60, Math.round(input.fps))) : 8;
        const loop = input.loop !== undefined ? input.loop : true;
        const frameCount = input.frameCount ? Math.max(1, Math.min(64, Math.round(input.frameCount))) : 1;

        const store = useProjectStore.getState();
        const newState = store.createAnimationState(asset.id, {
          name: input.name.trim(),
          fps,
          loop,
          frameCount,
        });

        if (!newState) {
          return JSON.stringify({ status: 'error', message: `Failed to create animation state in asset ${asset.id}` });
        }

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: newState.id,
          name: newState.name,
          fps: newState.fps,
          loop: newState.loop,
          frameCount: newState.frames.length,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'rename_animation_state',
    description: 'Renames an existing animation state in a sprite asset.',
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
        name: {
          type: 'string',
          description: 'The new name for the state',
        },
      },
      required: ['assetId', 'stateId', 'name'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; stateId: string; name: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);

        if (!input?.name || typeof input.name !== 'string' || input.name.trim() === '') {
          return JSON.stringify({ status: 'error', message: 'State name cannot be empty' });
        }

        const store = useProjectStore.getState();
        store.renameAnimationState(asset.id, state.id, input.name.trim());

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          oldName: state.name,
          newName: input.name.trim(),
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'delete_animation_state',
    description: 'Deletes an animation state from an asset. Cannot delete the last state of an asset.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        stateId: {
          type: 'string',
          description: 'The state ID to delete',
        },
      },
      required: ['assetId', 'stateId'],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    execute: async (input: { assetId: string; stateId: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        if (asset.states.length <= 1) {
          return JSON.stringify({
            status: 'error',
            message: `Cannot delete the only animation state in asset "${asset.name}". Create another state first.`,
          });
        }

        const state = resolveState(asset, input?.stateId);
        const store = useProjectStore.getState();
        store.deleteAnimationState(asset.id, state.id);

        const freshProject = useProjectStore.getState().project;
        const updatedAsset = freshProject.assets.find((a) => a.id === asset.id);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          deletedStateId: state.id,
          deletedStateName: state.name,
          remainingStates: updatedAsset?.states.length || 0,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'duplicate_animation_state',
    description: 'Duplicates an animation state along with all its frames.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        stateId: {
          type: 'string',
          description: 'The state ID to duplicate',
        },
      },
      required: ['assetId', 'stateId'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; stateId: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);

        const store = useProjectStore.getState();
        const cloned = store.duplicateAnimationState(asset.id, state.id);

        if (!cloned) {
          return JSON.stringify({ status: 'error', message: `Failed to duplicate state ${state.id}` });
        }

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: cloned.id,
          name: cloned.name,
          frameCount: cloned.frames.length,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'set_animation_speed',
    description: 'Sets the playback speed (FPS) for an animation state.',
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
        fps: {
          type: 'number',
          description: 'Frames per second (1 to 60)',
        },
      },
      required: ['assetId', 'stateId', 'fps'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; stateId: string; fps: number }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);

        if (typeof input.fps !== 'number' || input.fps < 1 || input.fps > 60) {
          return JSON.stringify({ status: 'error', message: `Invalid FPS: ${input.fps}. Must be between 1 and 60.` });
        }

        const validFps = Math.round(input.fps);
        const store = useProjectStore.getState();
        store.updateAnimationState(asset.id, state.id, { fps: validFps });

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          previousFps: state.fps,
          newFps: validFps,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'set_animation_loop',
    description: 'Enables or disables continuous looping for an animation state.',
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
        loop: {
          type: 'boolean',
          description: 'True to loop continuously, false to play once',
        },
      },
      required: ['assetId', 'stateId', 'loop'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; stateId: string; loop: boolean }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);

        const store = useProjectStore.getState();
        store.updateAnimationState(asset.id, state.id, { loop: Boolean(input.loop) });

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          loop: Boolean(input.loop),
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'play_animation',
    description: 'Starts live animation preview in the application viewport.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'Optional asset ID to select for preview',
        },
        stateId: {
          type: 'string',
          description: 'Optional state ID to select for preview',
        },
      },
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId?: string; stateId?: string }) => {
      try {
        const projectStore = useProjectStore.getState();
        if (input?.assetId) {
          projectStore.selectAsset(input.assetId);
        }
        if (input?.assetId && input?.stateId) {
          projectStore.selectAnimationState(input.assetId, input.stateId);
        }

        const state = projectStore.getActiveState();
        usePlaybackStore.getState().play(state?.frames.length || 0);

        return JSON.stringify({
          status: 'success',
          isPlaying: true,
          activeState: state?.name || null,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'pause_animation',
    description: 'Pauses live animation preview in the application viewport.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async () => {
      try {
        usePlaybackStore.getState().pause();
        return JSON.stringify({
          status: 'success',
          isPlaying: false,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },
];
