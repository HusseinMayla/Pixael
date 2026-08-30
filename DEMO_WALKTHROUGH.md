# 🎬 Demo & Judge Evaluation Walkthrough — Game Asset Studio

> **Project:** Game Asset Studio (SpritesCanvas)  
> **Evaluation Guide for Hackathon Judges & Reviewers**

---

## ⚡ Quick Testing Instructions for Evaluators

You can test Game Asset Studio and its 36 native WebMCP tools in two ways:

### Option A: Local Evaluation (Recommended)
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (242 tests)
npm test

# 3. Start development studio
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome.

### Option B: Enabling WebMCP in Chrome
1. Open Google Chrome.
2. Navigate to `chrome://flags/#enable-webmcp-testing`.
3. Set the flag to **Enabled** and click **Relaunch**.
4. Open the studio web page.
5. In Chrome DevTools (`F12` $\rightarrow$ Console) or using the **Model Context Tool Inspector** extension, all 36 tools are registered under `document.modelContext`.

---

## 🧪 Live Tool Execution Scenarios (Copy-Pasteable for Judges)

Execute these snippets directly in Chrome DevTools console to watch the live application respond in real time:

### Scenario 1: Inspecting Project State & Assets
```javascript
// List all assets in project
const listResult = await document.modelContext.executeTool('list_assets', {});
console.log('Assets:', JSON.parse(listResult));

// Inspect active selection
const selectionResult = await document.modelContext.executeTool('get_current_selection', {});
console.log('Current Selection:', JSON.parse(selectionResult));
```

---

### Scenario 2: Creating a New Asset & Drawing a Shield
```javascript
// 1. Create a 24x24 asset named "Guardian Shield"
const createResult = await document.modelContext.executeTool('create_asset', {
  name: 'Guardian Shield',
  width: 24,
  height: 24,
  category: 'Items',
  starterStates: ['Idle', 'Glow']
});
const { assetId } = JSON.parse(createResult);

// 2. Apply Cyberpunk Neon palette
await document.modelContext.executeTool('set_palette_preset', {
  assetId: assetId,
  presetName: 'Cyberpunk Neon'
});

// 3. Draw a gold/cyan outer boundary rectangle
await document.modelContext.executeTool('draw_rectangle', {
  assetId: assetId,
  x: 4,
  y: 4,
  width: 16,
  height: 16,
  hexColor: '#00f0ff',
  filled: false
});

// 4. Fill the interior
await document.modelContext.executeTool('flood_fill', {
  assetId: assetId,
  x: 8,
  y: 8,
  hexColor: '#7000ff'
});
```
*Observe the live canvas instantly rendering the Guardian Shield.*

---

### Scenario 3: Reading Compact RLE Pixels & Round-Tripping to a New Frame
```javascript
// 1. Read compact RLE data of Frame 1
const frameDataRes = await document.modelContext.executeTool('get_frame_pixels', {
  assetId: assetId
});
const { frameData } = JSON.parse(frameDataRes);
console.log('Compact RLE Payload:', frameData);

// 2. Add a new frame to the animation state
const addFrameRes = await document.modelContext.executeTool('add_frame', {
  assetId: assetId,
  stateId: frameDataRes.stateId,
  copyPrevious: false
});
const { newFrameIndex } = JSON.parse(addFrameRes);

// 3. Write modified RLE pixels to the new frame
await document.modelContext.executeTool('set_frame_pixels', {
  assetId: assetId,
  frameIndex: newFrameIndex,
  payload: frameData
});

// 4. Rotate new frame 90 degrees
await document.modelContext.executeTool('rotate_frame', {
  assetId: assetId,
  frameIndex: newFrameIndex,
  degrees: 90
});
```

---

### Scenario 4: Exporting Sprite Sheet & Metadata
```javascript
// Export sprite sheet and download engine-ready PNG + JSON metadata
const exportRes = await document.modelContext.executeTool('export_sprite_sheet', {
  assetId: assetId,
  layout: 'horizontal',
  scale: 4
});
console.log('Export Metadata:', JSON.parse(exportRes));
```

---

### Scenario 5: Error Boundary & Recovery Verification
```javascript
// Deliberate invalid parameter (negative width)
const errorRes = await document.modelContext.executeTool('resize_sprite', {
  assetId: assetId,
  width: -16,
  height: 24
});
// Confirms structured error response without crashing
console.log('Safe Error Response:', JSON.parse(errorRes));
```

---

## 📹 Video Demo Script & Storyboard (< 3 Minutes)

| Time | Visual Scene | Audio Commentary |
|---|---|---|
| **0:00 – 0:30** | **Studio Introduction & UI Overview**<br>Pan around Pixel Canvas, Animation Timeline, 60 FPS Preview Player, and Palette Panel. | *"Welcome to Game Asset Studio, a browser-based 2D pixel-art sprite workspace built for the OpenAI WebMCP Challenge. It combines a human-first creative studio with native WebMCP tool-calling for AI agents."* |
| **0:30 – 1:15** | **Live Human Pixel Art Creation**<br>Draw knight sprite with multi-pixel hover brush, toggle onion skinning, switch animation states (Idle, Walk, Attack), adjust FPS speed. | *"Artists get instant feedback with continuous drag-drawing, multi-pixel brush previews, onion skinning, and isolated 60 FPS playback that never stutters during edits."* |
| **1:15 – 2:00** | **WebMCP Agent Tool Discovery & Execution**<br>Open Model Context Tool Inspector / DevTools. Show all 36 tools registered via `document.modelContext`. | *"Behind the scenes, the studio exposes 36 deterministic WebMCP tools via Chrome's native `document.modelContext`. Agents can inspect assets, read compact RLE pixel data, draw shapes, and generate animation frames directly on the live page."* |
| **2:00 – 2:35** | **Agent-Driven Transformation & Animation**<br>Agent generates new character state, swaps palette to Cyberpunk Neon, draws weapon effects, and auto-rewinds animation playback. | *"Here, the agent creates a new Attack animation, applies a Cyberpunk Neon palette preset, and rasterizes visual effects. Notice how every tool call updates the canvas in real time and is fully captured by the editor's Undo/Redo history."* |
| **2:35 – 3:00** | **Export Suite & Architecture Summary**<br>Trigger sprite sheet export, show generated PNG and engine-ready JSON metadata. | *"Finally, the agent triggers sprite sheet packing, producing high-resolution PNGs and JSON frame metadata ready for Unity or Godot. 242 automated tests, 100% pure domain architecture, and native WebMCP integration. Thank you!"* |
