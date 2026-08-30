# 🎨 Game Asset Studio — 2D Pixel-Art Sprite Studio

> Built for the **OpenAI WebMCP Challenge (Hackathon MVP)**.  
> A frictionless 2D pixel-art sprite workspace architected from the ground up for seamless human + AI collaborative game development.

[![Tests](https://img.shields.io/badge/Tests-242%20Passing-brightgreen)](file:///c:/Users/Abbas/dev/SpritesCanvas/src/tests/runTests.ts)
[![WebMCP](https://img.shields.io/badge/WebMCP-36%20Native%20Tools-blue)](file:///c:/Users/Abbas/dev/SpritesCanvas/WEBMCP_TOOL_REFERENCE.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](file:///c:/Users/Abbas/dev/SpritesCanvas/LICENSE)

### 📚 Hackathon Documentation & Evaluation Links
- 🏆 [**Devpost Submission Narrative**](file:///c:/Users/Abbas/dev/SpritesCanvas/SUBMISSION_NARRATIVE.md): Answers to the 4 mandatory hackathon prompts.
- 🎬 [**Demo & Evaluation Walkthrough**](file:///c:/Users/Abbas/dev/SpritesCanvas/DEMO_WALKTHROUGH.md): Copy-pasteable WebMCP test scenarios and video script.
- 🛠️ [**WebMCP Tool Reference**](file:///c:/Users/Abbas/dev/SpritesCanvas/WEBMCP_TOOL_REFERENCE.md): Full schema & contract for all 36 tools.
- 📖 [**Technical Architecture & Project Docs**](file:///c:/Users/Abbas/dev/SpritesCanvas/DOCUMENTATION.md): Deep-dive system documentation.

---

## 🌟 Highlights & Capabilities

- **🖌️ Pixel-Perfect Canvas:** Crisp nearest-neighbor rendering, drag drawing with Bresenham line interpolation, flood fill (bucket), color picker (eyedropper), shapes (lines, rectangles), brush sizes (1-4px), grid toggle, and onion skinning ghost overlays.
- **🎬 Multi-State Animation Engine:** Organize sprites into unlimited states (*Idle, Walk, Run, Attack, Jump, Hurt, Death*) with multiple frames per state.
- **⚡ Real-Time Playback Preview:** Isolated 60 FPS preview player, dynamic FPS speed slider (1–24+ FPS), loop toggle, and frame stepping controls.
- **📦 Multi-Asset Project Management:** Manage characters, enemies, props, items, and environment assets in one project with category organization, duplication, renaming, and deletion.
- **📐 Canvas Resizing:** Resize sprite canvas (16×16, 24×24, 32×32, 48×48, 64×64, custom) with symmetrical Center or Top-Left anchor placement and aspect-ratio preservation.
- **🎨 Color Palette Management:** Built-in authentic pixel art palettes (*Pixel Hero, Fantasy RPG, Cyberpunk Neon, Retro 4-Bit, Monochrome*) + custom color picker and swatch replacement.
- **💾 Local Persistence:** Automatic transparent saving with IndexedDB and graceful in-memory fallback.
- **📤 Export Suite:**
  - Export active frame as standalone high-res PNG (1x, 2x, 4x, 8x, 16x).
  - Export animation states as packed Sprite Sheet PNGs (Horizontal, Vertical, or Grid layout).
  - Export engine-ready JSON metadata with frame bounds and FPS timing.
  - Export/Import full project JSON backups.

---

## 🏗️ Architecture: Clean Separation for WebMCP

The application enforces a strict unidirectional domain architecture so all operations can be invoked programmatically without simulating UI clicks:

```
┌────────────────────────────────────────────────────────┐
│                   Future WebMCP Layer                  │
│       (document.modelContext.registerTool bindings)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              UI Components & Controls                  │
│  (Canvas, Toolbar, Timeline, Palette, Preview, Modals) │
└───────────────────────────┬────────────────────────────┘
                            │ Calls pure domain actions
┌───────────────────────────▼────────────────────────────┐
│             Domain Operations (domain/*)               │
│ • assetOperations    • animationOperations             │
│ • frameOperations    • pixelOperations                 │
│ • paletteOperations  • exportOperations                │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              Authoritative State Stores                │
│    • useProjectStore (ProjectData + Undo/Redo)         │
│    • usePlaybackStore (Isolated 60fps preview)         │
│    • useEditorStore (Viewport, tools, modals)          │
└───────────────────────────┬────────────────────────────┘
                            │ Debounced autosave
┌───────────────────────────▼────────────────────────────┐
│            IndexedDB Storage & Persistence             │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Main Domain Operations

All operations are pure, deterministic TypeScript functions exported from `src/domain`:

| Domain Area | Operations |
|---|---|
| **Asset** | `createAsset`, `cloneAsset`, `resizeAsset`, `deleteAsset`, `selectAsset` |
| **Animation** | `createAnimationState`, `cloneAnimationState`, `addStateToAsset`, `removeStateFromAsset`, `renameAnimationState`, `updateAnimationState` |
| **Frames** | `createFrame`, `cloneFrame`, `addFrameToState`, `duplicateFrameInState`, `removeFrameFromState`, `reorderFramesInState` |
| **Pixels / Drawing** | `setPixelInPixels`, `setPixelsBatchInPixels`, `floodFillInPixels`, `flipPixels`, `rotatePixels`, `shiftPixels`, `resizePixels` |
| **Palette** | `addPaletteColorToAsset`, `removePaletteColorFromAsset`, `setPaletteColorAtIndex` |
| **Export / Storage** | `renderFrameToPngBlob`, `generateSpriteSheet`, `exportProjectToJson`, `importProjectFromJson` |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `V` | Hand / Pan Tool (Move & Zoom) |
| `B` | Pencil Tool |
| `E` | Eraser Tool |
| `G` | Paint Bucket Fill Tool |
| `I` | Eyedropper / Color Picker |
| `L` | Line Tool |
| `R` | Rectangle Tool |
| `X` | Swap Primary & Secondary Colors |
| `[` / `]` | Decrease / Increase Brush Size |
| `Space` | Play / Pause Animation Preview |
| `,` / `.` | Step to Previous / Next Frame |
| `Space + Drag` | Pan Viewport Canvas |
| `+` / `-` | Zoom In / Zoom Out |
| `0` | Reset Canvas View & Center |
| `H` | Toggle Pixel Grid |
| `O` | Toggle Onion Skinning |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + E` | Open Export Modal |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 2. Installation
```bash
# Install dependencies
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🤖 Phase 2: WebMCP Integration

Game Asset Studio provides a native **WebMCP (Web Model Context Protocol)** interface via Chrome's `document.modelContext` API. AI agents running in a WebMCP-capable browser context can create, inspect, and mutate pixel-art sprites directly on the live page without screen-scraping or simulated clicks.

### 🌐 Tool Inventory

#### 1. Query & Inspection Tools (`readOnlyHint: true`)
- **`list_assets`**: Lists all assets with IDs, names, dimensions, categories, and state names.
- **`get_asset_details`**: Full asset inspection including dimensions, palette, and all states/frames.
- **`get_current_selection`**: Inspects currently active asset, state, and frame in the live UI.
- **`get_frame_pixels`**: Returns compact Run-Length Encoded (RLE) pixel stream and palette.
- **`get_animation_state`**: Returns FPS, loop toggle, and ordered frame IDs for an animation state.

#### 2. Asset Management Tools
- **`create_asset`**: Creates a new sprite asset with custom dimensions and starter states.
- **`duplicate_asset`**: Clones an asset with all states and frames.
- **`delete_asset`**: Deletes an asset (`destructiveHint: true`).
- **`resize_sprite`**: Resizes canvas dimensions with Center or Top-Left anchoring.

#### 3. Animation State Tools
- **`create_animation_state`**: Adds a new animation state with frames.
- **`rename_animation_state`**: Renames an animation state.
- **`delete_animation_state`**: Deletes an animation state (`destructiveHint: true`).
- **`duplicate_animation_state`**: Duplicates an animation state.
- **`set_animation_speed`**: Sets FPS playback speed (1–60).
- **`set_animation_loop`**: Configures continuous looping or play-once.
- **`play_animation`** / **`pause_animation`**: Controls live animation preview.

#### 4. Frame Tools
- **`add_frame`**: Inserts a blank frame or duplicates the previous frame.
- **`duplicate_frame`**: Duplicates a specific frame.
- **`delete_frame`**: Deletes a frame (`destructiveHint: true`).
- **`reorder_frames`**: Reorders frames by explicit ID list or from/to index.

#### 5. Pixel Editing Tools (3 Tiers)
- **Tier 1 (Full Rewrite)**:
  - **`set_frame_pixels`**: Replaces entire frame buffer from compact RLE payload.
- **Tier 2 (Targeted Patch)**:
  - **`set_pixels`**: Sets specific `(x, y)` pixel coordinates to palette colorIndex or hexColor.
- **Tier 3 (Shapes, Lines & Transforms)**:
  - **`flood_fill`**: Contiguous flood fill at `(x, y)`.
  - **`draw_line`**: 1px Bresenham line between `(x0, y0)` and `(x1, y1)`.
  - **`draw_rectangle`**: Solid filled or 1px outline rectangle at `(x, y, w, h)`.
  - **`flip_frame`**: Horizontal or vertical flip.
  - **`rotate_frame`**: 90°, 180°, or 270° clockwise rotation.
  - **`shift_frame`**: Pixel offset shift by `dx` and `dy`.
  - **`clear_frame`**: Clears frame to transparent (`destructiveHint: true`).

#### 6. Palette Tools
- **`set_palette_preset`**: Applies studio presets (*Pixel Hero, Fantasy RPG, Cyberpunk Neon, Retro 4-Bit, Dungeon 16, Studio Gray Scale*).
- **`add_palette_color`**: Adds a hex color swatch.
- **`remove_palette_color`**: Removes a color swatch.
- **`set_palette_color`**: Replaces a swatch at an index.

#### 7. Export Tools
- **`export_frame_png`**: Renders frame and triggers high-res PNG download.
- **`export_sprite_sheet`**: Generates packed sprite sheet PNG with JSON metadata.

---

### 📦 Compact RLE Pixel Encoding Format

Read and write tools use index-aligned Run-Length Encoding (RLE) to minimize token consumption:

```typescript
interface FramePixelsPayload {
  width: number;
  height: number;
  palette: string[];    // index 0 is always "" (transparent)
  pixelsRle: number[];  // [colorIndex, runLength, colorIndex, runLength, ...]
}
```

The AI agent will be able to converse and collaborate in real-time, executing tasks like:
- *"Create a 24x24 Mage character with Idle and Spellcast animations."*
- *"Fill the robe with royal purple and add golden rune highlights."*
- *"Adjust the Attack speed to 12 FPS and export the sprite sheet."*

---

## 📄 License

MIT © 2026 Game Asset Studio Contributors
