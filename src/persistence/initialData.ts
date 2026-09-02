import { ProjectData, SpriteAsset, FrameData } from '../types/asset';
import { generateId } from '../utils/idGenerator';
import { getSampleKnightSlashAsset } from './sampleImportData';

// Helper to convert ascii matrix or coordinates to flat pixel array
function createFrameFromAscii(
  width: number,
  height: number,
  asciiArt: string[],
  colorMap: Record<string, string>
): FrameData {
  const pixels: string[] = new Array(width * height).fill('');
  for (let y = 0; y < height; y++) {
    const row = asciiArt[y] || '';
    for (let x = 0; x < width; x++) {
      const char = row[x] || ' ';
      if (char !== ' ' && char !== '.' && colorMap[char]) {
        pixels[y * width + x] = colorMap[char];
      }
    }
  }
  return {
    id: generateId('frame'),
    pixels,
  };
}

// -------------------------------------------------------------
// 1. KNIGHT PIXEL ART (24x24)
// -------------------------------------------------------------
const K_PALETTE = {
  k: '#1d2b53', // dark slate armor shadow
  g: '#5f574f', // mid slate armor
  s: '#c2c3c7', // silver/steel highlight
  w: '#fff1e8', // bright steel / skin tone / white highlight
  e: '#ff004d', // red plume / scarf / eye
  r: '#ab5236', // dark red / leather / cape shadow
  b: '#29adff', // glowing cyan sword / rune
  c: '#75fbfd', // bright cyan energy trail / rune highlight
  y: '#ffec27', // gold hilt / trim
  o: '#ffa300', // gold shadow
  d: '#000000', // pure black outline
};

const knightIdleF1 = [
  "........................",
  ".......eeee.............",
  ".....eeeeeeee...........",
  "....eeddddddee..........",
  "...eedssssssddee........",
  "....dswwwwwssd.....dd...",
  "...dswwssssssd....dcwd..",
  "...dskkkkkkked...dcbwd..",
  "...dskkbbkkked...dcbwd..",
  "...dssssssssed...dcbwd..",
  "..ddrrreeerrrdd..dcbwd..",
  ".deerrssssrreed..dcbwd..",
  ".derrssgsssrred.dyyyyyd.",
  ".derrssssssrred..doyod..",
  "..dssskkksdddd...doyod..",
  "..dsssrrrsd.......dyd...",
  "...dssssssd.......ddd...",
  "...dssggssd.............",
  "...dggkkgd..............",
  "...dkk..kkd.............",
  "...dsk..ksd.............",
  "..ddss..ssdd............",
  "..dddd..dddd............",
  "........................",
];

const knightIdleF2 = [
  "........................",
  "........eeee............",
  "......eeeeeeee..........",
  ".....eeddddddee.........",
  "....eedssssssddee.......",
  ".....dswwwwwssd....dd...",
  "....dswwssssssd...dcwd..",
  "....dskkkkkkked..dcbwd..",
  "....dskkbbkkked..dcbwd..",
  "....dssssssssed..dcbwd..",
  "...ddrrreeerrrdd.dcbwd..",
  "..deerrssssrreed.dcbwd..",
  "..derrssgsssrreddyyyyyd.",
  "..derrssssssrred.doyod..",
  "...dssskkksdddd..doyod..",
  "...dsssrrrsd......dyd...",
  "....dssssssd......ddd...",
  "....dssggssd............",
  "....dggkkgd.............",
  "....dkk..kkd............",
  "....dsk..ksd............",
  "...ddss..ssdd...........",
  "...dddd..dddd...........",
  "........................",
];

const knightIdleF3 = [
  "........................",
  ".......eeeeee...........",
  ".....eeeeeeeeee.........",
  "....eeddddddeeee........",
  "...eedssssssddeee.......",
  "....dswwwwwssd.....dd...",
  "...dswwssssssd....dcwd..",
  "...dskkkkkkked...dcbwd..",
  "...dskkbbkkked...dcbwd..",
  "...dssssssssed...dcbwd..",
  "..ddrrreeerrrdd..dcbwd..",
  ".deerrssssrreed..dcbwd..",
  ".derrssgsssrred.dyyyyyd.",
  ".derrssssssrred..doyod..",
  "..dssskkksdddd...doyod..",
  "..dsssrrrsd.......dyd...",
  "...dssssssd.......ddd...",
  "...dssggssd.............",
  "...dggkkgd..............",
  "...dkk..kkd.............",
  "...dsk..ksd.............",
  "..ddss..ssdd............",
  "..dddd..dddd............",
  "........................",
];

const knightIdleF4 = [
  "........................",
  ".......eeee.............",
  ".....eeeeeeee...........",
  "....eeddddddee..........",
  "...eedssssssddee........",
  "....dswwwwwssd.....dd...",
  "...dswwssssssd....dcwd..",
  "...dskkkkkkked...dcbwd..",
  "...dskkbbkkked...dcbwd..",
  "...dssssssssed...dcbwd..",
  "..ddrrreeerrrdd..dcbwd..",
  ".deerrssssrreed..dcbwd..",
  ".derrssgsssrred.dyyyyyd.",
  ".derrssssssrred..doyod..",
  "..dssskkksdddd...doyod..",
  "..dsssrrrsd.......dyd...",
  "...dssssssd.......ddd...",
  "...dssggssd.............",
  "...dggkkgd..............",
  "...dkk..kkd.............",
  "...dsk..ksd.............",
  "..ddss..ssdd............",
  "..dddd..dddd............",
  "........................",
];

// Knight Walk
const knightWalkF1 = [
  "........................",
  "......eeeee.............",
  "....eeeeeeee............",
  "...eeddddddee...........",
  "..eedssssssddee.........",
  "...dswwwwwssd......dd...",
  "..dswwssssssd.....dcwd..",
  "..dskkkkkkked....dcbwd..",
  "..dskkbbkkked....dcbwd..",
  "..dssssssssed....dcbwd..",
  ".ddrrreeerrrdd...dcbwd..",
  "deerrssssrreed..dyyyyyd.",
  "derrssgsssrred...doyod..",
  "derrssssssrred...doyod..",
  ".dssskkksdddd.....dyd...",
  ".dsssrrrsd........ddd...",
  "..dssssssd..............",
  "..dssggssd..............",
  "..dgg..kkgd.............",
  ".dkk....kkd.............",
  ".dsk....ksd.............",
  "ddss....ssdd............",
  "dddd....dddd............",
  "........................",
];

const knightWalkF2 = [
  "........................",
  ".......eeee.............",
  ".....eeeeeeee...........",
  "....eeddddddee..........",
  "...eedssssssddee........",
  "....dswwwwwssd.....dd...",
  "...dswwssssssd....dcwd..",
  "...dskkkkkkked...dcbwd..",
  "...dskkbbkkked...dcbwd..",
  "...dssssssssed...dcbwd..",
  "..ddrrreeerrrdd.dyyyyyd.",
  ".deerrssssrreed..doyod..",
  ".derrssgsssrred..doyod..",
  ".derrssssssrred...dyd...",
  "..dssskkksdddd....ddd...",
  "..dsssrrrsd.............",
  "...dssssssd.............",
  "...dssggssd.............",
  "...dggkkgd..............",
  "...dkk.kkd..............",
  "...dsk.ksd..............",
  "..ddss.ssdd.............",
  "..dddd.dddd.............",
  "........................",
];

const knightWalkF3 = [
  "........................",
  "......eeeee.............",
  "....eeeeeeee............",
  "...eeddddddee...........",
  "..eedssssssddee.........",
  "...dswwwwwssd......dd...",
  "..dswwssssssd.....dcwd..",
  "..dskkkkkkked....dcbwd..",
  "..dskkbbkkked....dcbwd..",
  "..dssssssssed....dcbwd..",
  ".ddrrreeerrrdd...dcbwd..",
  "deerrssssrreed..dyyyyyd.",
  "derrssgsssrred...doyod..",
  "derrssssssrred...doyod..",
  ".dssskkksdddd.....dyd...",
  ".dsssrrrsd........ddd...",
  "..dssssssd..............",
  "..dssggssd..............",
  "..dgk...gkd.............",
  "..dkk...kkd.............",
  "..dsk...ksd.............",
  ".ddss...ssdd............",
  ".dddd...dddd............",
  "........................",
];

const knightWalkF4 = [
  "........................",
  ".......eeee.............",
  ".....eeeeeeee...........",
  "....eeddddddee..........",
  "...eedssssssddee........",
  "....dswwwwwssd.....dd...",
  "...dswwssssssd....dcwd..",
  "...dskkkkkkked...dcbwd..",
  "...dskkbbkkked...dcbwd..",
  "...dssssssssed...dcbwd..",
  "..ddrrreeerrrdd.dyyyyyd.",
  ".deerrssssrreed..doyod..",
  ".derrssgsssrred..doyod..",
  ".derrssssssrred...dyd...",
  "..dssskkksdddd....ddd...",
  "..dsssrrrsd.............",
  "...dssssssd.............",
  "...dssggssd.............",
  "...dggkkgd..............",
  "...dkk.kkd..............",
  "...dsk.ksd..............",
  "..ddss.ssdd.............",
  "..dddd.dddd.............",
  "........................",
];

// Knight Attack
const knightAttackF1 = [
  "....dd..................",
  "...dcwd....eeee.........",
  "..dcbwd..eeeeeeee.......",
  "..dcbwd.eeddddddee......",
  "..dcbwdeedssssssddee....",
  "..dcbwddswwwwwssd.......",
  ".dyyyyddswwssssssd......",
  "..doyoddskkkkkkked......",
  "..doyoddskkbbkkked......",
  "...dyd.dssssssssed......",
  "...ddd.ddrrreeerrrdd....",
  "......deerrssssrreed....",
  "......derrssgsssrred....",
  "......derrssssssrred....",
  ".......dssskkksdddd.....",
  ".......dsssrrrsd........",
  "........dssssssd........",
  "........dssggssd........",
  "........dgg..kkgd.......",
  ".......dkk....kkd.......",
  ".......dsk....ksd.......",
  "......ddss....ssdd......",
  "......dddd....dddd......",
  "........................",
];

const knightAttackF2 = [
  "..................dd....",
  ".......eeee......dcwd...",
  ".....eeeeeeee...dcbwd...",
  "....eeddddddee..dcbwd...",
  "...eedssssssddeadcbwdd..",
  "....dswwwwwssddccwwccdd.",
  "...dswwssssssdcwwb..bwd.",
  "...dskkkkkkcedcwbd..dcd.",
  "...dskkbbkkeyyyyyd...dd.",
  "...dssssssssdoyod.......",
  "..ddrrreeerrdoyod.......",
  ".deerrssssrredyd........",
  ".derrssgsssrred.........",
  ".derrssssssrrdddd.......",
  "..dssskkksddddsssd......",
  "..dsssrrrsd...dssd......",
  "...dssssssd...dssd......",
  "...dssggssd...dggd......",
  "...dgg..kkd...dkkd......",
  "...dkk...kkd..dskd......",
  "...dsk...ksd.ddssdd.....",
  "..ddss...ssdddddddd.....",
  "..dddd...dddd...........",
  "........................",
];

const knightAttackF3 = [
  "........................",
  ".......eeee.............",
  ".....eeeeeeee...........",
  "....eeddddddee..........",
  "...eedssssssddee........",
  "....dswwwwwssd..........",
  "...dswwssssssd...dd.....",
  "...dskkkkkkked..dcwd....",
  "...dskkbbkkked.dcbwd....",
  "...dsssssssseddcbwd.....",
  "..ddrrreeerrdyyyyyd.....",
  ".deerrssssrredoyod..cc..",
  ".derrssgsssrredoyod.wwd.",
  ".derrssssssrredyd..dbwd.",
  "..dssskkksddddddd.dcbwd.",
  "..dsssrrrsd......dcwdd..",
  "...dssssssd.......dd....",
  "...dssggssd.............",
  "...dgg..kkgd............",
  "...dkk....kkd...........",
  "...dsk....ksd...........",
  "..ddss....ssdd..........",
  "..dddd....dddd..........",
  "........................",
];

const knightAttackF4 = [
  "........................",
  ".......eeee.............",
  ".....eeeeeeee...........",
  "....eeddddddee..........",
  "...eedssssssddee........",
  "....dswwwwwssd.....dd...",
  "...dswwssssssd....dcwd..",
  "...dskkkkkkked...dcbwd..",
  "...dskkbbkkked...dcbwd..",
  "...dssssssssed...dcbwd..",
  "..ddrrreeerrrdd..dcbwd..",
  ".deerrssssrreed..dcbwd..",
  ".derrssgsssrred.dyyyyyd.",
  ".derrssssssrred..doyod..",
  "..dssskkksdddd...doyod..",
  "..dsssrrrsd.......dyd...",
  "...dssssssd.......ddd...",
  "...dssggssd.............",
  "...dggkkgd..............",
  "...dkk..kkd.............",
  "...dsk..ksd.............",
  "..ddss..ssdd............",
  "..dddd..dddd............",
  "........................",
];

// -------------------------------------------------------------
// 2. SLIME PIXEL ART (16x16)
// -------------------------------------------------------------
const S_PALETTE = {
  d: '#008751', // dark green outline
  g: '#00e436', // bright slime green
  l: '#ffec27', // lime yellow highlight
  w: '#ffffff', // shiny reflection / eye white
  k: '#1d2b53', // eye pupil
  s: '#000000', // shadow
};

const slimeIdleF1 = [
  "................",
  "................",
  "................",
  "................",
  "......dddd......",
  "....ddggggdd....",
  "...dggglgglgd...",
  "..dgggglgglggd..",
  "..dgwkgggwkggd..",
  "..dgwkgggwkggd..",
  "..dggggggggggd..",
  "..dggggggggggd..",
  "...dddddddddd...",
  "....ssssssss....",
  "................",
  "................",
];

const slimeIdleF2 = [
  "................",
  "................",
  "................",
  ".....dddddd.....",
  "...ddggggggdd...",
  "..dggglgglgggd..",
  "..dgggglgglggd..",
  "..dgwkgggwkggd..",
  "..dgwkgggwkggd..",
  "..dggggggggggd..",
  "..dggggggggggd..",
  "...dddddddddd...",
  "....ssssssss....",
  "................",
  "................",
  "................",
];

const slimeIdleF3 = [
  "................",
  "................",
  "................",
  "................",
  "......dddd......",
  "....ddggggdd....",
  "...dggglgglgd...",
  "..dgggglgglggd..",
  "..dgwkgggwkggd..",
  "..dgwkgggwkggd..",
  "..dggggggggggd..",
  "..dggggggggggd..",
  "...dddddddddd...",
  "....ssssssss....",
  "................",
  "................",
];

const slimeIdleF4 = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "....dddddddd....",
  "..ddggggggggdd..",
  ".dggglgggglgggd.",
  ".dgwkgggggwkggd.",
  ".dgwkgggggwkggd.",
  ".dggggggggggggd.",
  "..dddddddddddd..",
  "...ssssssssss...",
  "................",
  "................",
  "................",
];

const slimeJumpF1 = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "....dddddddd....",
  "..ddggggggggdd..",
  ".dgwkgggggwkggd.",
  ".dgwkgggggwkggd.",
  ".dggggggggggggd.",
  "..dddddddddddd..",
  "...ssssssssss...",
  "................",
  "................",
  "................",
];

const slimeJumpF2 = [
  "......dddd......",
  "....ddggggdd....",
  "...dggggggggd...",
  "...dggglgglgd...",
  "...dgwkggwkggd..",
  "...dgwkggwkggd..",
  "...dggggggggd...",
  "...dggggggggd...",
  "....dggggggd....",
  ".....dddddd.....",
  "................",
  "................",
  "................",
  "......ssss......",
  "................",
  "................",
];

const slimeJumpF3 = [
  "................",
  "......dddd......",
  "....ddggggdd....",
  "...dggglgglgd...",
  "..dgggglgglggd..",
  "..dgwkgggwkggd..",
  "..dgwkgggwkggd..",
  "..dggggggggggd..",
  "..dggggggggggd..",
  "...dddddddddd...",
  "................",
  "................",
  ".....ssssss.....",
  "................",
  "................",
  "................",
];

const slimeJumpF4 = [
  "................",
  "................",
  "................",
  "................",
  "......dddd......",
  "....ddggggdd....",
  "...dggglgglgd...",
  "..dgggglgglggd..",
  "..dgwkgggwkggd..",
  "..dgwkgggwkggd..",
  "..dggggggggggd..",
  "..dggggggggggd..",
  "...dddddddddd...",
  "....ssssssss....",
  "................",
  "................",
];

// -------------------------------------------------------------
// 3. TREASURE CHEST PIXEL ART (16x16)
// -------------------------------------------------------------
const C_PALETTE = {
  d: '#000000', // outline
  b: '#5f574f', // dark iron
  s: '#c2c3c7', // iron highlight
  w: '#ab5236', // wood shadow
  l: '#d18b47', // wood light
  y: '#ffec27', // gold coin / lock
  o: '#ffa300', // gold shadow
  g: '#ffffff', // sparkle
  p: '#ff77a8', // ruby gem
};

const chestClosedF1 = [
  "................",
  "................",
  "................",
  "................",
  "....dddddddd....",
  "...dssssssssd...",
  "..dswwwllwwwsd..",
  "..dswwwllwwwsd..",
  "..dddddddddddd..",
  "..dslllyylllsd..",
  "..dswwlyyllwsd..",
  "..dswwwllwwwsd..",
  "..dssssssssssd..",
  "...dddddddddd...",
  "................",
  "................",
];

const chestOpenF1 = [
  "....dddddddd....",
  "...dssssssssd...",
  "..dswwwllwwwsd..",
  "..dswwwllwwwsd..",
  "..dddddddddddd..",
  "....dyyyyyyd....",
  "...dyyygyyyyd...",
  "..dsyyypyyyysd..",
  "..dslllyylllsd..",
  "..dswwlyyllwsd..",
  "..dswwwllwwwsd..",
  "..dssssssssssd..",
  "...dddddddddd...",
  "................",
  "................",
  "................",
];

const chestOpenF2 = [
  "....dddddddd....",
  "...dssssssssd...",
  "..dswwwllwwwsd..",
  "..dddddddddddd..",
  "....g..g...g....",
  "...gyyyyyyyyg...",
  "..dsyygypyyysd..",
  "..dsypyyyyyysd..",
  "..dslllyylllsd..",
  "..dswwlyyllwsd..",
  "..dswwwllwwwsd..",
  "..dssssssssssd..",
  "...dddddddddd...",
  "................",
  "................",
  "................",
];

export function getInitialProjectData(): ProjectData {
  const knightAsset: SpriteAsset = {
    id: generateId('asset_knight'),
    name: 'Knight Hero',
    category: 'Characters',
    width: 24,
    height: 24,
    palette: Object.values(K_PALETTE),
    states: [
      {
        id: generateId('state_idle'),
        name: 'Idle',
        fps: 6,
        loop: true,
        frames: [
          createFrameFromAscii(24, 24, knightIdleF1, K_PALETTE),
          createFrameFromAscii(24, 24, knightIdleF2, K_PALETTE),
          createFrameFromAscii(24, 24, knightIdleF3, K_PALETTE),
          createFrameFromAscii(24, 24, knightIdleF4, K_PALETTE),
        ],
      },
      {
        id: generateId('state_walk'),
        name: 'Walk',
        fps: 8,
        loop: true,
        frames: [
          createFrameFromAscii(24, 24, knightWalkF1, K_PALETTE),
          createFrameFromAscii(24, 24, knightWalkF2, K_PALETTE),
          createFrameFromAscii(24, 24, knightWalkF3, K_PALETTE),
          createFrameFromAscii(24, 24, knightWalkF4, K_PALETTE),
        ],
      },
      {
        id: generateId('state_attack'),
        name: 'Attack',
        fps: 10,
        loop: true,
        frames: [
          createFrameFromAscii(24, 24, knightAttackF1, K_PALETTE),
          createFrameFromAscii(24, 24, knightAttackF2, K_PALETTE),
          createFrameFromAscii(24, 24, knightAttackF3, K_PALETTE),
          createFrameFromAscii(24, 24, knightAttackF4, K_PALETTE),
        ],
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const slimeAsset: SpriteAsset = {
    id: generateId('asset_slime'),
    name: 'Forest Slime',
    category: 'Enemies',
    width: 16,
    height: 16,
    palette: Object.values(S_PALETTE),
    states: [
      {
        id: generateId('state_slime_idle'),
        name: 'Idle',
        fps: 6,
        loop: true,
        frames: [
          createFrameFromAscii(16, 16, slimeIdleF1, S_PALETTE),
          createFrameFromAscii(16, 16, slimeIdleF2, S_PALETTE),
          createFrameFromAscii(16, 16, slimeIdleF3, S_PALETTE),
          createFrameFromAscii(16, 16, slimeIdleF4, S_PALETTE),
        ],
      },
      {
        id: generateId('state_slime_jump'),
        name: 'Jump',
        fps: 8,
        loop: true,
        frames: [
          createFrameFromAscii(16, 16, slimeJumpF1, S_PALETTE),
          createFrameFromAscii(16, 16, slimeJumpF2, S_PALETTE),
          createFrameFromAscii(16, 16, slimeJumpF3, S_PALETTE),
          createFrameFromAscii(16, 16, slimeJumpF4, S_PALETTE),
        ],
      },
    ],
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
  };

  const chestAsset: SpriteAsset = {
    id: generateId('asset_chest'),
    name: 'Treasure Chest',
    category: 'Props & Items',
    width: 16,
    height: 16,
    palette: Object.values(C_PALETTE),
    states: [
      {
        id: generateId('state_chest_closed'),
        name: 'Closed',
        fps: 4,
        loop: true,
        frames: [
          createFrameFromAscii(16, 16, chestClosedF1, C_PALETTE),
        ],
      },
      {
        id: generateId('state_chest_open'),
        name: 'Open Chest',
        fps: 6,
        loop: false,
        frames: [
          createFrameFromAscii(16, 16, chestClosedF1, C_PALETTE),
          createFrameFromAscii(16, 16, chestOpenF1, C_PALETTE),
          createFrameFromAscii(16, 16, chestOpenF2, C_PALETTE),
        ],
      },
    ],
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 20000,
  };

  const knightSlashAsset = getSampleKnightSlashAsset();

  return {
    id: generateId('project'),
    name: 'Dungeon Adventure Sprites',
    version: '1.0.0',
    assets: [knightSlashAsset, knightAsset, slimeAsset, chestAsset],
    activeAssetId: knightSlashAsset.id,
    activeStateId: knightSlashAsset.states[0].id,
    activeFrameIndex: 0,
    savedAt: Date.now(),
  };
}
