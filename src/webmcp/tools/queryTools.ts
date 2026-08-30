import { WebMcpTool } from '../types';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { resolveContext, resolveAsset, resolveState } from '../utils/storeLookup';
import { encodeFrameToRle } from '../utils/encoding';

export const queryTools: WebMcpTool[] = [
  {
    name: 'list_assets',
    description: 'Lists all sprite assets in the project with their ID, name, category, dimensions (width, height), and animation state names.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async () => {
      try {
        const store = useProjectStore.getState();
        const assets = store.project.assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          category: asset.category,
          width: asset.width,
          height: asset.height,
          stateCount: asset.states.length,
          states: asset.states.map((s) => s.name),
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
        }));

        return JSON.stringify({
          status: 'success',
          projectName: store.project.name,
          activeAssetId: store.project.activeAssetId,
          totalAssets: assets.length,
          assets,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'get_asset_details',
    description: 'Returns full details for a sprite asset including dimensions, palette swatches, and all animation states with frame counts and FPS.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The unique ID of the asset to inspect',
        },
      },
      required: ['assetId'],
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async (input: { assetId: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        return JSON.stringify({
          status: 'success',
          asset: {
            id: asset.id,
            name: asset.name,
            category: asset.category,
            width: asset.width,
            height: asset.height,
            palette: asset.palette,
            states: asset.states.map((st) => ({
              id: st.id,
              name: st.name,
              fps: st.fps,
              loop: st.loop,
              frameCount: st.frames.length,
              frameIds: st.frames.map((f) => f.id),
            })),
            createdAt: asset.createdAt,
            updatedAt: asset.updatedAt,
          },
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'get_current_selection',
    description: 'Returns the active asset, active animation state, and active frame index/ID currently selected in the live editor UI.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async () => {
      try {
        const projectStore = useProjectStore.getState();
        const editorStore = useEditorStore.getState();

        const activeAsset = projectStore.getActiveAsset();
        const activeState = projectStore.getActiveState();
        const activeFrame = projectStore.getActiveFrame();

        return JSON.stringify({
          status: 'success',
          selection: {
            assetId: activeAsset?.id || null,
            assetName: activeAsset?.name || null,
            width: activeAsset?.width || 0,
            height: activeAsset?.height || 0,
            stateId: activeState?.id || null,
            stateName: activeState?.name || null,
            fps: activeState?.fps || 8,
            loop: activeState?.loop ?? true,
            frameIndex: projectStore.project.activeFrameIndex,
            frameId: activeFrame?.id || null,
            currentTool: editorStore.currentTool,
            primaryColor: editorStore.primaryColor,
            brushSize: editorStore.brushSize,
          },
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'get_frame_pixels',
    description: 'Returns compact run-length encoded (RLE) pixel data and palette for a frame. Index 0 is transparent; pairs are [colorIndex, runLength].',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID (optional if targeting currently active asset)',
        },
        stateId: {
          type: 'string',
          description: 'The animation state ID (optional if targeting active state)',
        },
        frameId: {
          type: 'string',
          description: 'Optional frame ID',
        },
        frameIndex: {
          type: 'number',
          description: 'Optional 0-based frame index',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async (input: { assetId?: string; stateId?: string; frameId?: string; frameIndex?: number }) => {
      try {
        const { asset, state, frame, frameIndex } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        const payload = encodeFrameToRle(frame.pixels, asset.width, asset.height, asset.palette);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          frameIndex,
          frameData: payload,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'get_animation_state',
    description: 'Returns fps, loop setting, frame count, and ordered frame IDs for an animation state.',
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
      },
      required: ['assetId', 'stateId'],
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async (input: { assetId: string; stateId: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = resolveState(asset, input?.stateId);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          state: {
            id: state.id,
            name: state.name,
            fps: state.fps,
            loop: state.loop,
            frameCount: state.frames.length,
            frames: state.frames.map((f, idx) => ({
              id: f.id,
              index: idx,
              hasPixels: f.pixels.some((c) => Boolean(c && c !== 'transparent')),
            })),
          },
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },
];
