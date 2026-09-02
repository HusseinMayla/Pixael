import { SpriteAsset } from '../types/asset';
import { generateId } from '../utils/idGenerator';
import knightJson from './importedKnightData.json';

export function getSampleKnightSlashAsset(): SpriteAsset {
  return {
    id: generateId('asset_knight_slash'),
    name: knightJson.name,
    category: knightJson.category,
    width: knightJson.width,
    height: knightJson.height,
    palette: knightJson.palette,
    states: [
      {
        id: generateId('state_slash'),
        name: 'Sword Slash',
        fps: knightJson.fps,
        loop: true,
        frames: knightJson.frames.map((pixels: string[]) => ({
          id: generateId('frame'),
          pixels: [...pixels],
        })),
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
