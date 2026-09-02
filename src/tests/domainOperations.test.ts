import {
  createAsset,
  cloneAsset,
  resizeAsset,
  createAnimationState,
  cloneAnimationState,
  addStateToAsset,
  removeStateFromAsset,
  reorderStatesInAsset,
  createFrame,
  addFrameToState,
  duplicateFrameInState,
  removeFrameFromState,
  reorderFramesInState,
  setPixelInPixels,
  floodFillInPixels,
  flipPixels,
  rotatePixels,
  shiftPixels,
  resizePixels,
  addPaletteColorToAsset,
  removePaletteColorFromAsset,
  exportProjectToJson,
  importProjectFromJson,
  rgbToHex,
  extractPaletteFromPixels,
  buildAssetFromSlice,
} from '../domain';
import { getInitialProjectData } from '../persistence/initialData';

export function runDomainVerificationTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✅ PASS: ${testName}`);
    } else {
      failed++;
      results.push(`❌ FAIL: ${testName}`);
      console.error(`Test failed: ${testName}`);
    }
  }

  // 1. Asset Creation & Cloning
  const asset = createAsset({ name: 'Archer', width: 24, height: 24, starterStates: ['Idle', 'Walk'] });
  assert(asset.name === 'Archer', 'createAsset creates correct asset name');
  assert(asset.width === 24 && asset.height === 24, 'createAsset sets dimensions');
  assert(asset.states.length === 2, 'createAsset creates specified starter states');

  const cloned = cloneAsset(asset);
  assert(cloned.name.includes('(Copy)'), 'cloneAsset duplicates name');
  assert(cloned.id !== asset.id, 'cloneAsset generates distinct ID');
  assert(cloned.states[0].id !== asset.states[0].id, 'cloneAsset generates distinct state IDs');

  // 2. Asset Resizing
  const resized = resizeAsset(asset, 32, 32, 'center');
  assert(resized.width === 32 && resized.height === 32, 'resizeAsset updates dimensions');
  assert(resized.states[0].frames[0].pixels.length === 32 * 32, 'resizeAsset resizes pixel buffers');

  // 3. Animation State Operations
  const newState = createAnimationState('Attack', 24, 24, 12, true, 3);
  assert(newState.name === 'Attack', 'createAnimationState sets name');
  assert(newState.fps === 12, 'createAnimationState sets FPS');
  assert(newState.frames.length === 3, 'createAnimationState creates frame count');

  const clonedState = cloneAnimationState(newState);
  assert(clonedState.name.includes('(Copy)'), 'cloneAnimationState duplicates state name');
  assert(clonedState.frames.length === newState.frames.length, 'cloneAnimationState duplicates frames');

  const { updatedAsset } = addStateToAsset(asset, newState);
  assert(updatedAsset.states.length === 3, 'addStateToAsset appends state');

  const reorderedAsset = reorderStatesInAsset(updatedAsset, 0, 2);
  assert(reorderedAsset.states[2].name === 'Idle', 'reorderStatesInAsset moves state from 0 to 2');
  assert(reorderedAsset.states[0].name === 'Walk', 'reorderStatesInAsset shifts preceding state left');

  const { updatedAsset: afterRemove } = removeStateFromAsset(reorderedAsset, newState.id);
  assert(afterRemove.states.length === 2, 'removeStateFromAsset removes state');

  // 4. Frame Operations
  const initialFrame = createFrame(16, 16);
  assert(initialFrame.pixels.length === 256, 'createFrame creates 16x16 pixel buffer');

  const dummyState = createAnimationState('Idle', 16, 16, 8, true, 2);
  const { updatedState: stateWithFrame, newFrameIndex } = addFrameToState(dummyState, 16, 16);
  assert(stateWithFrame.frames.length === 3, 'addFrameToState adds frame');
  assert(newFrameIndex === 2, 'addFrameToState returns new frame index');

  const { updatedState: dupState } = duplicateFrameInState(stateWithFrame, 0);
  assert(dupState.frames.length === 4, 'duplicateFrameInState duplicates frame');

  const { updatedState: reorderedState } = reorderFramesInState(dupState, 0, 2);
  assert(reorderedState.frames.length === 4, 'reorderFramesInState preserves frame count');

  const { updatedState: stateAfterDelete } = removeFrameFromState(reorderedState, 0, 16, 16);
  assert(stateAfterDelete.frames.length === 3, 'removeFrameFromState deletes frame');

  // 5. Pixel Manipulations
  let pixels = new Array(16 * 16).fill('');
  pixels = setPixelInPixels(pixels, 16, 16, 5, 5, '#ff0000', 1);
  assert(pixels[5 * 16 + 5] === '#ff0000', 'setPixelInPixels sets pixel color');

  // Flood fill
  const filled = floodFillInPixels(pixels, 16, 16, 0, 0, '#00ff00');
  assert(filled[0] === '#00ff00', 'floodFillInPixels fills empty space');
  assert(filled[5 * 16 + 5] === '#ff0000', 'floodFillInPixels stops at boundaries');

  // Flip & Rotate & Shift & Resize
  const flipped = flipPixels(pixels, 16, 16, 'horizontal');
  assert(flipped[5 * 16 + (16 - 1 - 5)] === '#ff0000', 'flipPixels flips horizontally');

  const rotated = rotatePixels(pixels, 16, 16, true);
  assert(rotated.length === 256, 'rotatePixels rotates square buffer');

  const shifted = shiftPixels(pixels, 16, 16, 2, 2);
  assert(shifted[7 * 16 + 7] === '#ff0000', 'shiftPixels shifts coordinates');

  const resizedBuf = resizePixels(pixels, 16, 16, 32, 32, 'center');
  assert(resizedBuf.length === 32 * 32, 'resizePixels resizes flat buffer');

  // 6. Palette Operations
  const palette = ['#000000', '#ffffff'];
  const withColor = addPaletteColorToAsset(palette, '#ff004d');
  assert(withColor.includes('#ff004d'), 'addPaletteColorToAsset adds color');
  const withoutColor = removePaletteColorFromAsset(withColor, '#ff004d');
  assert(!withoutColor.includes('#ff004d'), 'removePaletteColorFromAsset removes color');

  // 7. JSON Project Serialization & Import
  const project = getInitialProjectData();
  const jsonStr = exportProjectToJson(project);
  assert(jsonStr.length > 100, 'exportProjectToJson generates JSON string');

  const imported = importProjectFromJson(jsonStr);
  assert(imported.assets.length === project.assets.length, 'importProjectFromJson restores assets');
  assert(imported.name === project.name, 'importProjectFromJson restores project name');

  // 8. Import Domain Operations
  assert(rgbToHex(255, 0, 0) === '#ff0000', 'rgbToHex formats pure red');
  assert(rgbToHex(0, 128, 255) === '#0080ff', 'rgbToHex formats cyan-blue');

  const samplePixels = ['#ff0000', '#00ff00', '#ff0000', '', '#ff0000', '#00ff00'];
  const extractedPal = extractPaletteFromPixels(samplePixels);
  assert(extractedPal[0] === '#ff0000', 'extractPaletteFromPixels sorts by most frequent');
  assert(extractedPal.length === 2, 'extractPaletteFromPixels ignores empty transparent strings');

  const mockSlice = {
    frames: [
      { id: 'f1', pixels: new Array(16 * 16).fill('#ff0000'), width: 16, height: 16 },
      { id: 'f2', pixels: new Array(16 * 16).fill('#00ff00'), width: 16, height: 16 },
    ],
    width: 16,
    height: 16,
    palette: ['#ff0000', '#00ff00'],
    totalFrames: 2,
  };

  const builtAsset = buildAssetFromSlice(mockSlice, {
    type: 'new-asset',
    assetName: 'Hero Slash',
    category: 'Characters',
    stateName: 'Attack',
    fps: 10,
  });

  assert(builtAsset.name === 'Hero Slash', 'buildAssetFromSlice sets asset name');
  assert(builtAsset.states[0].name === 'Attack', 'buildAssetFromSlice sets state name');
  assert(builtAsset.states[0].frames.length === 2, 'buildAssetFromSlice converts frames');
  assert(builtAsset.width === 16 && builtAsset.height === 16, 'buildAssetFromSlice sets dimensions');

  return { passed, failed, results };
}
