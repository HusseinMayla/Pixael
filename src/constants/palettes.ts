export interface PalettePreset {
  id: string;
  name: string;
  category: string;
  colors: string[];
}

export const PRESET_PALETTES: PalettePreset[] = [
  {
    id: 'pixel-game',
    name: 'Pixel Hero',
    category: 'Game Classics',
    colors: [
      '#000000', '#1d2b53', '#7e2553', '#008751',
      '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436',
      '#29adff', '#83769c', '#ff77a8', '#ffccaa'
    ]
  },
  {
    id: 'fantasy-rpg',
    name: 'Fantasy RPG',
    category: 'Thematic',
    colors: [
      '#141013', '#3b2137', '#693340', '#8f563b',
      '#4b692f', '#524b26', '#3b544d', '#405273',
      '#6b3f3b', '#a36340', '#d18b47', '#e8c170',
      '#638942', '#8cb85c', '#557685', '#8bb4b8',
      '#cbd9d4', '#ecd2b9', '#eeddbe', '#ffffff'
    ]
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    category: 'Stylized',
    colors: [
      '#080914', '#151b3b', '#241442', '#440f4c',
      '#741b63', '#a32b69', '#d13c6b', '#f5576c',
      '#f98b60', '#fad02c', '#00f0ff', '#00a8ff',
      '#7000ff', '#b000ff', '#ff007f', '#ffffff'
    ]
  },
  {
    id: 'gameboy',
    name: 'Retro Monochrome 4-Bit',
    category: 'Retro',
    colors: [
      '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
    ]
  },
  {
    id: 'dungeon-crawler',
    name: 'Dungeon 16',
    category: 'Thematic',
    colors: [
      '#1a1921', '#312d40', '#4a4361', '#665e80',
      '#8f86ab', '#c7c2d6', '#edeaf2', '#7a2830',
      '#ab4043', '#d96c57', '#e89e6d', '#ebc778',
      '#365440', '#568058', '#385b73', '#6696b0'
    ]
  },
  {
    id: 'monochrome',
    name: 'Studio Gray Scale',
    category: 'Essential',
    colors: [
      '#000000', '#18181b', '#27272a', '#3f3f46',
      '#52525b', '#71717a', '#a1a1aa', '#d4d4d8',
      '#e4e4e7', '#f4f4f5', '#fafafa', '#ffffff'
    ]
  }
];

export const DEFAULT_PALETTE = PRESET_PALETTES[0].colors;
