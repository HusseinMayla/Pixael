import { WebMcpTool, FramePixelsPayload } from '../types';
import { useProjectStore } from '../../store/projectStore';
import { resolveContext, resolveColor } from '../utils/storeLookup';
import { decodeRleToPixels, validateRlePayload } from '../utils/encoding';
import {
  floodFillInPixels,
  drawLineInPixels,
  drawRectangleInPixels,
  flipPixels,
  rotatePixelsByDegrees,
  shiftPixels,
  createEmptyPixels,
} from '../../domain/pixelOperations';

export const pixelTools: WebMcpTool[] = [
  // -------------------------------------------------------------
  // Tier 1: Full Frame Rewrite (RLE format)
  // -------------------------------------------------------------
  {
    name: 'set_frame_pixels',
    description: 'Replaces the entire pixel buffer of a frame using a compact Run-Length Encoded (RLE) payload (matching get_frame_pixels output format).',
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
        payload: {
          type: 'object',
          properties: {
            width: { type: 'number' },
            height: { type: 'number' },
            palette: { type: 'array', items: { type: 'string' } },
            pixelsRle: { type: 'array', items: { type: 'number' } },
          },
          required: ['width', 'height', 'palette', 'pixelsRle'],
          description: 'Compact RLE frame payload',
        },
      },
      required: ['assetId', 'stateId', 'payload'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      payload: FramePixelsPayload;
    }) => {
      try {
        const validatedPayload = validateRlePayload(input?.payload);
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        if (validatedPayload.width !== asset.width || validatedPayload.height !== asset.height) {
          return JSON.stringify({
            status: 'error',
            message: `Payload dimensions (${validatedPayload.width}x${validatedPayload.height}) do not match asset dimensions (${asset.width}x${asset.height})`,
          });
        }

        const decodedPixels = decodeRleToPixels(validatedPayload);

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          () => decodedPixels
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          pixelCount: decodedPixels.length,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  // -------------------------------------------------------------
  // Tier 2: Targeted Patch
  // -------------------------------------------------------------
  {
    name: 'set_pixels',
    description: 'Sets specific pixel coordinates in a frame. Coordinates are 0-indexed with (0,0) at top-left. Pass colorIndex into palette (0 = transparent) or explicit hexColor.',
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
        pixels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', description: '0-based X coordinate' },
              y: { type: 'number', description: '0-based Y coordinate' },
              colorIndex: { type: 'number', description: '0 for transparent, 1+ for palette color' },
              hexColor: { type: 'string', description: 'Optional hex color string (e.g. "#ff004d")' },
            },
            required: ['x', 'y'],
          },
          description: 'Array of pixel modifications',
        },
      },
      required: ['assetId', 'stateId', 'pixels'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      pixels: Array<{ x: number; y: number; colorIndex?: number; hexColor?: string }>;
    }) => {
      try {
        if (!Array.isArray(input?.pixels) || input.pixels.length === 0) {
          return JSON.stringify({ status: 'error', message: 'pixels array is required and must not be empty' });
        }

        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        const updates: Array<{ x: number; y: number; color: string }> = [];
        for (const pt of input.pixels) {
          if (typeof pt.x !== 'number' || typeof pt.y !== 'number') {
            return JSON.stringify({ status: 'error', message: 'Each pixel must specify numeric x and y coordinates' });
          }
          if (pt.x >= 0 && pt.x < asset.width && pt.y >= 0 && pt.y < asset.height) {
            const color = resolveColor(asset, pt.colorIndex, pt.hexColor);
            updates.push({ x: pt.x, y: pt.y, color });
          }
        }

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          (currentPixels) => {
            const next = [...currentPixels];
            for (const { x, y, color } of updates) {
              next[y * asset.width + x] = color;
            }
            return next;
          }
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          updatedPixelCount: updates.length,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  // -------------------------------------------------------------
  // Tier 3: Shape & Region Operations
  // -------------------------------------------------------------
  {
    name: 'flood_fill',
    description: 'Fills a contiguous area of identical color starting at (x, y) with a color from the palette or hex string.',
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
        x: {
          type: 'number',
          description: 'X coordinate to begin fill (0 to width-1)',
        },
        y: {
          type: 'number',
          description: 'Y coordinate to begin fill (0 to height-1)',
        },
        colorIndex: {
          type: 'number',
          description: '0 for transparent, 1+ for palette color',
        },
        hexColor: {
          type: 'string',
          description: 'Optional explicit hex color string',
        },
      },
      required: ['assetId', 'stateId', 'x', 'y'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      x: number;
      y: number;
      colorIndex?: number;
      hexColor?: string;
    }) => {
      try {
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        if (typeof input.x !== 'number' || typeof input.y !== 'number') {
          return JSON.stringify({ status: 'error', message: 'x and y coordinates are required' });
        }
        if (input.x < 0 || input.x >= asset.width || input.y < 0 || input.y >= asset.height) {
          return JSON.stringify({
            status: 'error',
            message: `Coordinates (${input.x}, ${input.y}) are outside frame dimensions (${asset.width}x${asset.height})`,
          });
        }

        const fillColor = resolveColor(asset, input.colorIndex, input.hexColor);

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          (currentPixels) => floodFillInPixels(currentPixels, asset.width, asset.height, input.x, input.y, fillColor)
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          fillOrigin: { x: input.x, y: input.y },
          fillColor: fillColor || 'transparent',
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'draw_line',
    description: 'Draws a 1-pixel Bresenham line between (x0, y0) and (x1, y1) in a frame.',
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
        x0: { type: 'number', description: 'Start X coordinate' },
        y0: { type: 'number', description: 'Start Y coordinate' },
        x1: { type: 'number', description: 'End X coordinate' },
        y1: { type: 'number', description: 'End Y coordinate' },
        colorIndex: { type: 'number', description: '0 for transparent, 1+ for palette color' },
        hexColor: { type: 'string', description: 'Optional explicit hex color' },
      },
      required: ['assetId', 'stateId', 'x0', 'y0', 'x1', 'y1'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      colorIndex?: number;
      hexColor?: string;
    }) => {
      try {
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        const color = resolveColor(asset, input.colorIndex, input.hexColor);
        let pointsCount = 0;

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          (currentPixels) => {
            const { newPixels, pointsDrawn } = drawLineInPixels(
              currentPixels,
              asset.width,
              asset.height,
              input.x0,
              input.y0,
              input.x1,
              input.y1,
              color
            );
            pointsCount = pointsDrawn;
            return newPixels;
          }
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          from: { x: input.x0, y: input.y0 },
          to: { x: input.x1, y: input.y1 },
          pointsDrawn: pointsCount,
          color: color || 'transparent',
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'draw_rectangle',
    description: 'Draws a rectangle at (x, y) with specified width and height. Can be solid filled or 1-pixel outline.',
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
        x: { type: 'number', description: 'Top-left X coordinate' },
        y: { type: 'number', description: 'Top-left Y coordinate' },
        width: { type: 'number', description: 'Width in pixels' },
        height: { type: 'number', description: 'Height in pixels' },
        colorIndex: { type: 'number', description: '0 for transparent, 1+ for palette color' },
        hexColor: { type: 'string', description: 'Optional explicit hex color' },
        filled: { type: 'boolean', description: 'True for solid rectangle, false for 1px outline (default false)' },
      },
      required: ['assetId', 'stateId', 'x', 'y', 'width', 'height'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      x: number;
      y: number;
      width: number;
      height: number;
      colorIndex?: number;
      hexColor?: string;
      filled?: boolean;
    }) => {
      try {
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        if (typeof input.width !== 'number' || input.width <= 0 || typeof input.height !== 'number' || input.height <= 0) {
          return JSON.stringify({ status: 'error', message: 'Rectangle width and height must be positive numbers' });
        }

        const color = resolveColor(asset, input.colorIndex, input.hexColor);
        const filled = Boolean(input.filled);
        let pointsCount = 0;

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          (currentPixels) => {
            const { newPixels, pointsDrawn } = drawRectangleInPixels(
              currentPixels,
              asset.width,
              asset.height,
              input.x,
              input.y,
              input.width,
              input.height,
              color,
              filled
            );
            pointsCount = pointsDrawn;
            return newPixels;
          }
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          rectangle: { x: input.x, y: input.y, width: input.width, height: input.height, filled },
          pointsDrawn: pointsCount,
          color: color || 'transparent',
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'flip_frame',
    description: 'Flips all pixels in a frame horizontally (left-to-right) or vertically (top-to-bottom).',
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
        axis: {
          type: 'string',
          enum: ['horizontal', 'vertical'],
          description: 'Flip axis: "horizontal" or "vertical"',
        },
      },
      required: ['assetId', 'stateId', 'axis'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      axis: 'horizontal' | 'vertical';
    }) => {
      try {
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        if (input.axis !== 'horizontal' && input.axis !== 'vertical') {
          return JSON.stringify({ status: 'error', message: 'axis must be "horizontal" or "vertical"' });
        }

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          (currentPixels) => flipPixels(currentPixels, asset.width, asset.height, input.axis)
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          axis: input.axis,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'rotate_frame',
    description: 'Rotates all pixels in a frame clockwise by 90, 180, or 270 degrees.',
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
        degrees: {
          type: 'number',
          enum: [90, 180, 270],
          description: 'Clockwise rotation in degrees (90, 180, 270)',
        },
      },
      required: ['assetId', 'stateId', 'degrees'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      degrees: number;
    }) => {
      try {
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        if (![90, 180, 270].includes(input?.degrees)) {
          return JSON.stringify({ status: 'error', message: 'degrees must be 90, 180, or 270' });
        }

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          (currentPixels) => rotatePixelsByDegrees(currentPixels, asset.width, asset.height, input.degrees)
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          degrees: input.degrees,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'shift_frame',
    description: 'Shifts all pixels in a frame by dx (horizontal) and dy (vertical) pixels with wrap-around.',
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
        dx: {
          type: 'number',
          description: 'Horizontal pixel offset (positive = right, negative = left)',
        },
        dy: {
          type: 'number',
          description: 'Vertical pixel offset (positive = down, negative = up)',
        },
      },
      required: ['assetId', 'stateId', 'dx', 'dy'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: {
      assetId: string;
      stateId: string;
      frameId?: string;
      frameIndex?: number;
      dx: number;
      dy: number;
    }) => {
      try {
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        if (typeof input.dx !== 'number' || typeof input.dy !== 'number') {
          return JSON.stringify({ status: 'error', message: 'dx and dy must be numbers' });
        }

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          (currentPixels) => shiftPixels(currentPixels, asset.width, asset.height, input.dx, input.dy, true)
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          shift: { dx: input.dx, dy: input.dy },
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'clear_frame',
    description: 'Clears all pixels in a frame to transparent.',
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
        const { asset, state, frame } = resolveContext(
          input?.assetId,
          input?.stateId,
          input?.frameId,
          input?.frameIndex
        );

        const store = useProjectStore.getState();
        store.updateTargetFramePixels(
          asset.id,
          state.id,
          { frameId: frame.id },
          () => createEmptyPixels(asset.width, asset.height)
        );

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          stateId: state.id,
          frameId: frame.id,
          cleared: true,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },
];
