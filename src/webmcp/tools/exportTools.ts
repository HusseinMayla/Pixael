import { WebMcpTool } from '../types';
import { resolveContext, resolveAsset, resolveState } from '../utils/storeLookup';
import {
  renderFrameToPngBlob,
  generateSpriteSheet,
  downloadBlob,
} from '../../domain/exportOperations';

export const exportTools: WebMcpTool[] = [
  {
    name: 'export_frame_png',
    description: 'Renders and triggers download of a single frame as a PNG image at a specified pixel scale (1x, 2x, 4x, 8x, 16x).',
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
          description: 'Optional frame ID',
        },
        frameIndex: {
          type: 'number',
          description: 'Optional 0-based frame index',
        },
        scale: {
          type: 'number',
          enum: [1, 2, 4, 8, 16],
          description: 'Pixel scaling factor (default 4)',
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
      scale?: number;
    }) => {
      try {
        const { asset, state, frame, frameIndex } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        const scale = input.scale && [1, 2, 4, 8, 16].includes(input.scale) ? input.scale : 4;
        const filename = `${asset.name.toLowerCase().replace(/\s+/g, '_')}_${state.name.toLowerCase()}_f${frameIndex + 1}_${scale}x.png`;

        if (typeof document !== 'undefined') {
          const blob = await renderFrameToPngBlob(frame, asset.width, asset.height, scale);
          downloadBlob(blob, filename);
        }

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          frameIndex,
          scale,
          width: asset.width * scale,
          height: asset.height * scale,
          filename,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'export_sprite_sheet',
    description: 'Generates and downloads a packed PNG sprite sheet for an animation state or entire asset with metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        stateId: {
          type: 'string',
          description: 'The animation state ID (optional: if omitted, exports all states)',
        },
        layout: {
          type: 'string',
          enum: ['horizontal', 'vertical', 'grid'],
          description: 'Sprite sheet layout arrangement (default "horizontal")',
        },
        scale: {
          type: 'number',
          enum: [1, 2, 4, 8, 16],
          description: 'Pixel scale factor (default 1)',
        },
        columns: {
          type: 'number',
          description: 'Number of columns when layout is "grid"',
        },
      },
      required: ['assetId'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId?: string;
      layout?: 'horizontal' | 'vertical' | 'grid';
      scale?: number;
      columns?: number;
    }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const state = input.stateId ? resolveState(asset, input.stateId) : asset.states[0];

        const layout = input.layout || 'horizontal';
        const scale = input.scale && [1, 2, 4, 8, 16].includes(input.scale) ? input.scale : 1;
        const columns = input.columns && input.columns > 0 ? input.columns : undefined;

        let metaResult = {
          width: asset.width * scale * state.frames.length,
          height: asset.height * scale,
          frameCount: state.frames.length,
          fps: state.fps,
        };

        const filename = `${asset.name.toLowerCase().replace(/\s+/g, '_')}_sheet.png`;

        if (typeof document !== 'undefined') {
          const { blob, metadata } = await generateSpriteSheet(asset, state.id, {
            layout,
            scale,
            columns,
            includeAllStates: !input.stateId,
          });

          downloadBlob(blob, filename);
          metaResult = {
            width: metadata.meta.size.w,
            height: metadata.meta.size.h,
            frameCount: metadata.meta.totalFrames,
            fps: metadata.meta.fps,
          };
        }

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          filename,
          layout,
          scale,
          metadata: metaResult,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },
];
