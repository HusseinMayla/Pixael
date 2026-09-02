import {
  getAllWebMcpTools,
  registerWebMcpTools,
  encodeFrameToRle,
  decodeRleToPixels,
  queryTools,
  assetTools,
  animationTools,
  frameTools,
  pixelTools,
  paletteTools,
} from '../webmcp';
import { useProjectStore } from '../store/projectStore';
import { getInitialProjectData } from '../persistence/initialData';

export async function runWebMcpVerificationTests(): Promise<{ passed: number; failed: number; results: string[] }> {
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
      console.error(`WebMCP Test failed: ${testName}`);
    }
  }

  // Reset store to fresh initial data
  useProjectStore.setState({
    project: getInitialProjectData(),
    history: [],
    future: [],
    isLoaded: true,
  });

  const store = useProjectStore.getState();
  const knightAsset = store.project.assets[0];
  const knightIdleState = knightAsset.states[0];
  const knightFrame0 = knightIdleState.frames[0];

  // =========================================================================
  // 1. Pixel Data RLE Encoding / Decoding Round-Trip Tests
  // =========================================================================
  const testPixels = new Array(16 * 16).fill('');
  testPixels[0] = '#ff0000';
  testPixels[1] = '#ff0000';
  testPixels[2] = '#00ff00';
  testPixels[50] = '#0000ff';

  const encoded = encodeFrameToRle(testPixels, 16, 16, ['#ff0000', '#00ff00']);
  assert(encoded.width === 16 && encoded.height === 16, 'encodeFrameToRle retains dimensions');
  assert(encoded.palette[0] === '', 'encodeFrameToRle sets palette index 0 as transparent');
  assert(encoded.pixelsRle.length > 0 && encoded.pixelsRle.length % 2 === 0, 'encodeFrameToRle produces valid RLE pairs');

  const decoded = decodeRleToPixels(encoded);
  assert(decoded.length === 256, 'decodeRleToPixels produces full 256 pixel buffer');
  assert(decoded[0] === '#ff0000' && decoded[1] === '#ff0000', 'decodeRleToPixels restores multi-pixel run');
  assert(decoded[2] === '#00ff00', 'decodeRleToPixels restores single pixel');
  assert(decoded[3] === '' && decoded[49] === '', 'decodeRleToPixels restores transparent runs');
  assert(decoded[50] === '#0000ff', 'decodeRleToPixels restores non-base palette color');

  // Roundtrip knight sprite frame
  const knightRle = encodeFrameToRle(knightFrame0.pixels, knightAsset.width, knightAsset.height, knightAsset.palette);
  const restoredKnightPixels = decodeRleToPixels(knightRle);
  assert(restoredKnightPixels.length === knightFrame0.pixels.length, 'Knight frame round-trip preserves length');
  assert(JSON.stringify(restoredKnightPixels) === JSON.stringify(knightFrame0.pixels), 'Knight frame round-trip is 100% bit-exact');

  // =========================================================================
  // 2. Query / Read Tools Tests
  // =========================================================================
  const listTool = queryTools.find((t) => t.name === 'list_assets')!;
  const listRes = JSON.parse(await listTool.execute({}));
  assert(listRes.status === 'success', 'list_assets returns success status');
  assert(listRes.assets.length >= 3, 'list_assets returns pre-built assets');

  const detailsTool = queryTools.find((t) => t.name === 'get_asset_details')!;
  const detailsRes = JSON.parse(await detailsTool.execute({ assetId: knightAsset.id }));
  assert(detailsRes.status === 'success', 'get_asset_details returns success');
  assert(detailsRes.asset.id === knightAsset.id, 'get_asset_details returns matching asset ID');
  assert(detailsRes.asset.states.length === knightAsset.states.length, 'get_asset_details returns all states');

  const selectionTool = queryTools.find((t) => t.name === 'get_current_selection')!;
  const selRes = JSON.parse(await selectionTool.execute({}));
  assert(selRes.status === 'success', 'get_current_selection returns success');
  assert(selRes.selection.assetId !== null, 'get_current_selection returns active assetId');

  const framePixelsTool = queryTools.find((t) => t.name === 'get_frame_pixels')!;
  const framePixRes = JSON.parse(
    await framePixelsTool.execute({
      assetId: knightAsset.id,
      stateId: knightIdleState.id,
      frameIndex: 0,
    })
  );
  assert(framePixRes.status === 'success', 'get_frame_pixels returns success');
  assert(framePixRes.frameData.pixelsRle.length > 0, 'get_frame_pixels returns RLE stream');

  const animStateTool = queryTools.find((t) => t.name === 'get_animation_state')!;
  const animRes = JSON.parse(
    await animStateTool.execute({ assetId: knightAsset.id, stateId: knightIdleState.id })
  );
  assert(animRes.status === 'success', 'get_animation_state returns success');
  assert(animRes.state.frames.length === knightIdleState.frames.length, 'get_animation_state returns frames array');

  // =========================================================================
  // 3. Asset Management Tools Tests
  // =========================================================================
  const createAssetTool = assetTools.find((t) => t.name === 'create_asset')!;
  const createAssetRes = JSON.parse(
    await createAssetTool.execute({
      name: 'Wizard',
      width: 24,
      height: 24,
      category: 'Characters',
      starterStates: ['Idle', 'Cast'],
    })
  );
  assert(createAssetRes.status === 'success', 'create_asset creates new asset');
  assert(createAssetRes.width === 24 && createAssetRes.height === 24, 'create_asset sets dimensions');
  const wizardId = createAssetRes.assetId;

  const dupAssetTool = assetTools.find((t) => t.name === 'duplicate_asset')!;
  const dupAssetRes = JSON.parse(await dupAssetTool.execute({ assetId: wizardId, newName: 'Wizard Clone' }));
  assert(dupAssetRes.status === 'success', 'duplicate_asset duplicates asset');
  assert(dupAssetRes.name === 'Wizard Clone', 'duplicate_asset applies newName');
  const wizardCloneId = dupAssetRes.assetId;

  const resizeTool = assetTools.find((t) => t.name === 'resize_sprite')!;
  const resizeRes = JSON.parse(await resizeTool.execute({ assetId: wizardId, width: 32, height: 32, anchor: 'center' }));
  assert(resizeRes.status === 'success', 'resize_sprite resizes asset');
  assert(resizeRes.newDimensions.width === 32, 'resize_sprite updates width');

  const deleteAssetTool = assetTools.find((t) => t.name === 'delete_asset')!;
  const deleteAssetRes = JSON.parse(await deleteAssetTool.execute({ assetId: wizardCloneId }));
  assert(deleteAssetRes.status === 'success', 'delete_asset deletes asset');

  // Error handling: Negative dimension resize
  const badResize = JSON.parse(await resizeTool.execute({ assetId: wizardId, width: -10, height: 32 }));
  assert(badResize.status === 'error', 'resize_sprite catches negative width and returns error JSON');

  // =========================================================================
  // 4. Animation State Tools Tests
  // =========================================================================
  const createStateTool = animationTools.find((t) => t.name === 'create_animation_state')!;
  const createStateRes = JSON.parse(
    await createStateTool.execute({ assetId: wizardId, name: 'Teleport', fps: 12, loop: false, frameCount: 3 })
  );
  assert(createStateRes.status === 'success', 'create_animation_state creates state');
  assert(createStateRes.frameCount === 3, 'create_animation_state initializes frame count');
  const teleportStateId = createStateRes.stateId;

  const renameStateTool = animationTools.find((t) => t.name === 'rename_animation_state')!;
  const renameStateRes = JSON.parse(
    await renameStateTool.execute({ assetId: wizardId, stateId: teleportStateId, name: 'Blink' })
  );
  assert(renameStateRes.status === 'success', 'rename_animation_state renames state');
  assert(renameStateRes.newName === 'Blink', 'rename_animation_state returns new name');

  const speedTool = animationTools.find((t) => t.name === 'set_animation_speed')!;
  const speedRes = JSON.parse(await speedTool.execute({ assetId: wizardId, stateId: teleportStateId, fps: 16 }));
  assert(speedRes.status === 'success', 'set_animation_speed sets FPS');
  assert(speedRes.newFps === 16, 'set_animation_speed returns new FPS');

  const loopTool = animationTools.find((t) => t.name === 'set_animation_loop')!;
  const loopRes = JSON.parse(await loopTool.execute({ assetId: wizardId, stateId: teleportStateId, loop: true }));
  assert(loopRes.status === 'success', 'set_animation_loop sets loop boolean');

  const dupStateTool = animationTools.find((t) => t.name === 'duplicate_animation_state')!;
  const dupStateRes = JSON.parse(await dupStateTool.execute({ assetId: wizardId, stateId: teleportStateId }));
  assert(dupStateRes.status === 'success', 'duplicate_animation_state duplicates state');

  const reorderStateTool = animationTools.find((t) => t.name === 'reorder_animation_states')!;
  const reorderStateRes = JSON.parse(
    await reorderStateTool.execute({ assetId: wizardId, stateId: teleportStateId, toIndex: 0 })
  );
  assert(reorderStateRes.status === 'success', 'reorder_animation_states reorders states');

  const deleteStateTool = animationTools.find((t) => t.name === 'delete_animation_state')!;
  const deleteStateRes = JSON.parse(await deleteStateTool.execute({ assetId: wizardId, stateId: dupStateRes.stateId }));
  assert(deleteStateRes.status === 'success', 'delete_animation_state deletes state');

  // =========================================================================
  // 5. Frame Tools Tests
  // =========================================================================
  const addFrameTool = frameTools.find((t) => t.name === 'add_frame')!;
  const addFrameRes = JSON.parse(await addFrameTool.execute({ assetId: wizardId, stateId: teleportStateId, copyPrevious: true }));
  assert(addFrameRes.status === 'success', 'add_frame adds frame');
  assert(addFrameRes.totalFrames === 4, 'addFrame increments frame count to 4');

  const dupFrameTool = frameTools.find((t) => t.name === 'duplicate_frame')!;
  const dupFrameRes = JSON.parse(await dupFrameTool.execute({ assetId: wizardId, stateId: teleportStateId, frameIndex: 0 }));
  assert(dupFrameRes.status === 'success', 'duplicate_frame duplicates frame');
  assert(dupFrameRes.totalFrames === 5, 'duplicateFrame increments frame count to 5');

  const deleteFrameTool = frameTools.find((t) => t.name === 'delete_frame')!;
  const delFrameRes = JSON.parse(await deleteFrameTool.execute({ assetId: wizardId, stateId: teleportStateId, frameIndex: 0 }));
  assert(delFrameRes.status === 'success', 'delete_frame deletes frame');
  assert(delFrameRes.totalFrames === 4, 'deleteFrame decrements frame count to 4');

  const reorderTool = frameTools.find((t) => t.name === 'reorder_frames')!;
  const reorderRes = JSON.parse(await reorderTool.execute({ assetId: wizardId, stateId: teleportStateId, fromIndex: 0, toIndex: 2 }));
  assert(reorderRes.status === 'success', 'reorder_frames moves frame');

  // =========================================================================
  // 6. Pixel Editing Tools (Tier 1, 2, 3) Tests
  // =========================================================================
  const setFramePixTool = pixelTools.find((t) => t.name === 'set_frame_pixels')!;
  const blankRle = encodeFrameToRle(new Array(32 * 32).fill(''), 32, 32);
  const setRleRes = JSON.parse(
    await setFramePixTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      payload: blankRle,
    })
  );
  assert(setRleRes.status === 'success', 'set_frame_pixels (Tier 1) rewrites frame pixels from RLE');

  const setPixelsTool = pixelTools.find((t) => t.name === 'set_pixels')!;
  const setPixRes = JSON.parse(
    await setPixelsTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      pixels: [
        { x: 5, y: 5, hexColor: '#ff004d' },
        { x: 6, y: 5, hexColor: '#ff004d' },
      ],
    })
  );
  assert(setPixRes.status === 'success', 'set_pixels (Tier 2) applies targeted patch');
  assert(setPixRes.updatedPixelCount === 2, 'set_pixels reports updated count');

  const drawLineTool = pixelTools.find((t) => t.name === 'draw_line')!;
  const lineRes = JSON.parse(
    await drawLineTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      x0: 0,
      y0: 0,
      x1: 10,
      y1: 10,
      hexColor: '#00e436',
    })
  );
  assert(lineRes.status === 'success', 'draw_line (Tier 3) draws Bresenham line');
  assert(lineRes.pointsDrawn === 11, 'draw_line draws 11 diagonal points');

  const drawRectTool = pixelTools.find((t) => t.name === 'draw_rectangle')!;
  const rectRes = JSON.parse(
    await drawRectTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      x: 12,
      y: 12,
      width: 4,
      height: 4,
      hexColor: '#29adff',
      filled: true,
    })
  );
  assert(rectRes.status === 'success', 'draw_rectangle (Tier 3) draws filled rectangle');
  assert(rectRes.pointsDrawn === 16, 'draw_rectangle draws 16 points for 4x4 filled rect');

  const floodFillTool = pixelTools.find((t) => t.name === 'flood_fill')!;
  const floodRes = JSON.parse(
    await floodFillTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      x: 13,
      y: 13,
      hexColor: '#ffa300',
    })
  );
  assert(floodRes.status === 'success', 'flood_fill (Tier 3) fills contiguous region');

  const flipTool = pixelTools.find((t) => t.name === 'flip_frame')!;
  const flipRes = JSON.parse(
    await flipTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      axis: 'horizontal',
    })
  );
  assert(flipRes.status === 'success', 'flip_frame (Tier 3) flips horizontal');

  const rotateTool = pixelTools.find((t) => t.name === 'rotate_frame')!;
  const rotRes = JSON.parse(
    await rotateTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      degrees: 90,
    })
  );
  assert(rotRes.status === 'success', 'rotate_frame (Tier 3) rotates 90 degrees');

  const shiftTool = pixelTools.find((t) => t.name === 'shift_frame')!;
  const shiftRes = JSON.parse(
    await shiftTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
      dx: 2,
      dy: 2,
    })
  );
  assert(shiftRes.status === 'success', 'shift_frame (Tier 3) shifts pixels');

  const clearTool = pixelTools.find((t) => t.name === 'clear_frame')!;
  const clearRes = JSON.parse(
    await clearTool.execute({
      assetId: wizardId,
      stateId: teleportStateId,
      frameIndex: 0,
    })
  );
  assert(clearRes.status === 'success', 'clear_frame (Tier 3) clears frame');

  // =========================================================================
  // 7. Palette Tools Tests
  // =========================================================================
  const presetTool = paletteTools.find((t) => t.name === 'set_palette_preset')!;
  const presetRes = JSON.parse(
    await presetTool.execute({ assetId: wizardId, presetName: 'Cyberpunk Neon' })
  );
  assert(presetRes.status === 'success', 'set_palette_preset applies Cyberpunk Neon palette');
  assert(presetRes.colorCount === 16, 'set_palette_preset installs 16 colors');

  const addColTool = paletteTools.find((t) => t.name === 'add_palette_color')!;
  const addColRes = JSON.parse(
    await addColTool.execute({ assetId: wizardId, hexColor: '#123456' })
  );
  assert(addColRes.status === 'success', 'add_palette_color adds color');

  const removeColTool = paletteTools.find((t) => t.name === 'remove_palette_color')!;
  const remColRes = JSON.parse(
    await removeColTool.execute({ assetId: wizardId, hexColor: '#123456' })
  );
  assert(remColRes.status === 'success', 'remove_palette_color removes color');

  // =========================================================================
  // 8. Tool Registry & Lifecycle Registration Tests
  // =========================================================================
  const allTools = getAllWebMcpTools();
  assert(allTools.length >= 25, `Total WebMCP tools registered: ${allTools.length} tools`);

  // Verify schemas and annotations
  for (const t of allTools) {
    assert(typeof t.name === 'string' && t.name.length > 0, `Tool "${t.name}" has valid name`);
    assert(typeof t.description === 'string' && t.description.length > 0, `Tool "${t.name}" has description`);
    assert(t.inputSchema.type === 'object', `Tool "${t.name}" has object inputSchema`);
    assert(typeof t.annotations?.readOnlyHint === 'boolean', `Tool "${t.name}" has boolean readOnlyHint`);
  }

  // Lifecycle Mock Test for document.modelContext
  const registeredInMock: string[] = [];
  const signalState = { aborted: false };

  const mockModelContext = {
    registerTool: (tool: any, options?: { signal?: AbortSignal }) => {
      registeredInMock.push(tool.name);
      options?.signal?.addEventListener('abort', () => {
        signalState.aborted = true;
      });
    },
  };

  (globalThis as any).document = {
    modelContext: mockModelContext,
  };

  const cleanup = registerWebMcpTools();
  assert(cleanup !== null, 'registerWebMcpTools returns unregister function when modelContext is present');
  assert(registeredInMock.length === allTools.length, 'All tools registered into document.modelContext');

  cleanup?.();
  assert(signalState.aborted === true, 'Unregister cleanup triggers AbortSignal on AbortController');

  return { passed, failed, results };
}
