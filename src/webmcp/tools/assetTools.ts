import { WebMcpTool } from '../types';
import { useProjectStore } from '../../store/projectStore';
import { resolveAsset } from '../utils/storeLookup';

export const assetTools: WebMcpTool[] = [
  {
    name: 'create_asset',
    description: 'Creates a new sprite asset in the project with custom dimensions, name, category, and initial animation states.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the sprite asset (e.g. "Knight", "Dragon", "Potion")',
        },
        width: {
          type: 'number',
          description: 'Width in pixels (e.g. 16, 24, 32, 64; default 16)',
        },
        height: {
          type: 'number',
          description: 'Height in pixels (e.g. 16, 24, 32, 64; default 16)',
        },
        category: {
          type: 'string',
          description: 'Category name (e.g. "Characters", "Enemies", "Environment", "Items")',
        },
        starterStates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional initial state names (e.g. ["Idle", "Walk", "Attack"])',
        },
      },
      required: ['name'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      name: string;
      width?: number;
      height?: number;
      category?: string;
      starterStates?: string[];
    }) => {
      try {
        if (!input?.name || typeof input.name !== 'string' || input.name.trim() === '') {
          return JSON.stringify({ status: 'error', message: 'Asset name is required' });
        }

        const width = input.width ? Math.max(4, Math.min(128, Math.round(input.width))) : 16;
        const height = input.height ? Math.max(4, Math.min(128, Math.round(input.height))) : 16;

        const store = useProjectStore.getState();
        const newAsset = store.createAsset({
          name: input.name.trim(),
          width,
          height,
          category: input.category || 'Characters',
          starterStates: input.starterStates && input.starterStates.length > 0 ? input.starterStates : ['Idle'],
        });

        return JSON.stringify({
          status: 'success',
          assetId: newAsset.id,
          name: newAsset.name,
          category: newAsset.category,
          width: newAsset.width,
          height: newAsset.height,
          states: newAsset.states.map((s) => ({ id: s.id, name: s.name })),
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'duplicate_asset',
    description: 'Duplicates an existing sprite asset along with all its animation states, frames, and palette.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'ID of the asset to duplicate',
        },
        newName: {
          type: 'string',
          description: 'Optional new name for the clone',
        },
      },
      required: ['assetId'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; newName?: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const store = useProjectStore.getState();
        const cloned = store.duplicateAsset(asset.id);

        if (!cloned) {
          return JSON.stringify({ status: 'error', message: `Failed to duplicate asset ${input.assetId}` });
        }

        if (input.newName && input.newName.trim()) {
          store.updateAsset(cloned.id, { name: input.newName.trim() });
          cloned.name = input.newName.trim();
        }

        return JSON.stringify({
          status: 'success',
          assetId: cloned.id,
          originalAssetId: asset.id,
          name: cloned.name,
          stateCount: cloned.states.length,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'delete_asset',
    description: 'Deletes a sprite asset from the project. Cannot delete the last remaining asset.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'ID of the asset to delete',
        },
      },
      required: ['assetId'],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    execute: async (input: { assetId: string }) => {
      try {
        const store = useProjectStore.getState();
        if (store.project.assets.length <= 1) {
          return JSON.stringify({
            status: 'error',
            message: 'Cannot delete the only asset in the project. Create a new asset before deleting this one.',
          });
        }

        const asset = resolveAsset(input?.assetId);
        store.deleteAsset(asset.id);

        const freshProject = useProjectStore.getState().project;

        return JSON.stringify({
          status: 'success',
          deletedAssetId: asset.id,
          deletedName: asset.name,
          remainingAssets: freshProject.assets.length,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'resize_sprite',
    description: 'Resizes sprite canvas dimensions (e.g. from 16x16 to 32x32) while preserving pixel art content according to the specified anchor.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID to resize',
        },
        width: {
          type: 'number',
          description: 'New width in pixels (minimum 4, maximum 128)',
        },
        height: {
          type: 'number',
          description: 'New height in pixels (minimum 4, maximum 128)',
        },
        anchor: {
          type: 'string',
          enum: ['center', 'top-left'],
          description: 'Placement anchor: "center" expands symmetrically; "top-left" anchors at (0,0)',
        },
      },
      required: ['assetId', 'width', 'height'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      width: number;
      height: number;
      anchor?: 'center' | 'top-left';
    }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        if (typeof input.width !== 'number' || input.width < 4 || input.width > 128) {
          return JSON.stringify({ status: 'error', message: `Invalid width: ${input.width}. Must be between 4 and 128.` });
        }
        if (typeof input.height !== 'number' || input.height < 4 || input.height > 128) {
          return JSON.stringify({ status: 'error', message: `Invalid height: ${input.height}. Must be between 4 and 128.` });
        }

        const anchor = input.anchor || 'center';
        const store = useProjectStore.getState();
        store.resizeSprite(asset.id, Math.round(input.width), Math.round(input.height), anchor);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          previousDimensions: { width: asset.width, height: asset.height },
          newDimensions: { width: Math.round(input.width), height: Math.round(input.height) },
          anchor,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },
];
