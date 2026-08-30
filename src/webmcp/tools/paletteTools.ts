import { WebMcpTool } from '../types';
import { useProjectStore } from '../../store/projectStore';
import { PRESET_PALETTES } from '../../constants/palettes';
import { resolveAsset } from '../utils/storeLookup';

export const paletteTools: WebMcpTool[] = [
  {
    name: 'set_palette_preset',
    description: 'Replaces an asset palette with one of the studio presets: "Pixel Hero", "Fantasy RPG", "Cyberpunk Neon", "Retro Monochrome 4-Bit", "Dungeon 16", "Studio Gray Scale".',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        presetName: {
          type: 'string',
          enum: [
            'Pixel Hero',
            'Fantasy RPG',
            'Cyberpunk Neon',
            'Retro Monochrome 4-Bit',
            'Dungeon 16',
            'Studio Gray Scale',
          ],
          description: 'Name of the studio preset palette to apply',
        },
      },
      required: ['assetId', 'presetName'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; presetName: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        const preset = PRESET_PALETTES.find(
          (p) => p.name.toLowerCase() === (input?.presetName || '').toLowerCase()
        );

        if (!preset) {
          const available = PRESET_PALETTES.map((p) => `"${p.name}"`).join(', ');
          return JSON.stringify({
            status: 'error',
            message: `Palette preset "${input.presetName}" not found. Available presets: ${available}`,
          });
        }

        const store = useProjectStore.getState();
        store.setPalette(asset.id, preset.colors);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          presetName: preset.name,
          colorCount: preset.colors.length,
          colors: preset.colors,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'add_palette_color',
    description: 'Adds a new hex color code to the asset palette.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        hexColor: {
          type: 'string',
          description: 'Hex color string (e.g. "#ff004d", "#00e436")',
        },
      },
      required: ['assetId', 'hexColor'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; hexColor: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        if (!input?.hexColor || typeof input.hexColor !== 'string' || !input.hexColor.startsWith('#')) {
          return JSON.stringify({ status: 'error', message: 'hexColor must be a valid hex string starting with #' });
        }

        const clean = input.hexColor.trim().toLowerCase();
        const store = useProjectStore.getState();
        store.addPaletteColor(asset.id, clean);

        const freshProject = useProjectStore.getState().project;
        const updatedAsset = freshProject.assets.find((a) => a.id === asset.id);
        const newIndex = updatedAsset?.palette.indexOf(clean) ?? -1;

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          hexColor: clean,
          colorIndex: newIndex >= 0 ? newIndex + 1 : updatedAsset?.palette.length || 0,
          paletteSize: updatedAsset?.palette.length || 0,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'remove_palette_color',
    description: 'Removes a color from an asset palette by colorIndex or hex string.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        colorIndex: {
          type: 'number',
          description: '1-based or 0-based index in the palette to remove',
        },
        hexColor: {
          type: 'string',
          description: 'Optional hex color string to remove (alternative to colorIndex)',
        },
      },
      required: ['assetId'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; colorIndex?: number; hexColor?: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        let colorToRemove = '';

        if (input.hexColor) {
          colorToRemove = input.hexColor.trim().toLowerCase();
        } else if (input.colorIndex !== undefined) {
          // If 1-based RLE index
          if (input.colorIndex > 0 && input.colorIndex <= asset.palette.length) {
            colorToRemove = asset.palette[input.colorIndex - 1];
          } else if (input.colorIndex >= 0 && input.colorIndex < asset.palette.length) {
            colorToRemove = asset.palette[input.colorIndex];
          }
        }

        if (!colorToRemove) {
          return JSON.stringify({ status: 'error', message: 'Could not resolve color to remove. Specify valid colorIndex or hexColor.' });
        }

        const store = useProjectStore.getState();
        store.removePaletteColor(asset.id, colorToRemove);

        const freshProject = useProjectStore.getState().project;
        const updatedAsset = freshProject.assets.find((a) => a.id === asset.id);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          removedColor: colorToRemove,
          remainingColors: updatedAsset?.palette.length || 0,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },

  {
    name: 'set_palette_color',
    description: 'Replaces a specific palette color swatch at a given index with a new hex color.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The asset ID',
        },
        colorIndex: {
          type: 'number',
          description: '0-based index in the palette to replace',
        },
        hexColor: {
          type: 'string',
          description: 'The new hex color (e.g. "#3b82f6")',
        },
      },
      required: ['assetId', 'colorIndex', 'hexColor'],
    },
    annotations: {
      readOnlyHint: false,
    },
    execute: async (input: { assetId: string; colorIndex: number; hexColor: string }) => {
      try {
        const asset = resolveAsset(input?.assetId);
        if (typeof input.colorIndex !== 'number' || input.colorIndex < 0 || input.colorIndex >= asset.palette.length) {
          return JSON.stringify({
            status: 'error',
            message: `Invalid colorIndex ${input.colorIndex}. Palette has ${asset.palette.length} colors (index 0 to ${asset.palette.length - 1}).`,
          });
        }
        if (!input.hexColor || !input.hexColor.startsWith('#')) {
          return JSON.stringify({ status: 'error', message: 'hexColor must be a valid hex string starting with #' });
        }

        const clean = input.hexColor.trim().toLowerCase();
        const store = useProjectStore.getState();
        store.setPaletteColorAtIndex(asset.id, input.colorIndex, clean);

        return JSON.stringify({
          status: 'success',
          assetId: asset.id,
          colorIndex: input.colorIndex,
          newHexColor: clean,
        });
      } catch (err) {
        return JSON.stringify({ status: 'error', message: (err as Error).message });
      }
    },
  },
];
