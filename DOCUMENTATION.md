# 🎨 Game Asset Studio (SpritesCanvas) — Comprehensive Project Documentation

> **Built for the OpenAI WebMCP Challenge (Hackathon MVP)**  
> *A high-performance, human-first 2D pixel-art sprite studio architected from the ground up for seamless AI agent collaboration via native browser WebMCP.*

---

## 📑 Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Phase 1: Sprite Editor & Core Capabilities](#3-phase-1-sprite-editor--core-capabilities)
   - 3.1 [Pixel Canvas & Drawing Engine](#31-pixel-canvas--drawing-engine)
   - 3.2 [Animation Engine & Isolated Playback](#32-animation-engine--isolated-playback)
   - 3.3 [Project & Asset Management](#33-project--asset-management)
   - 3.4 [Palette Management System](#34-palette-management-system)
   - 3.5 [Export & Serialization Suite](#35-export--serialization-suite)
   - 3.6 [Zero-Lag Keyboard Architecture](#36-zero-lag-keyboard-architecture)
4. [Phase 2: WebMCP Integration](#4-phase-2-webmcp-integration)
   - 4.1 [Browser Native WebMCP Platform](#41-browser-native-webmcp-platform)
   - 4.2 [Uniform Tool Result Contract](#42-uniform-tool-result-contract)
   - 4.3 [Compact RLE Pixel Encoding Format](#43-compact-rle-pixel-encoding-format)
   - 4.4 [Complete 36-Tool Inventory](#44-complete-36-tool-inventory)
5. [Codebase Directory Structure](#5-codebase-directory-structure)
6. [Automated Verification & Test Suite](#6-automated-verification--test-suite)
7. [Developer & AI Agent Usage Guide](#7-developer--ai-agent-usage-guide)

---

## 1. Executive Summary & Vision

**Game Asset Studio** is a browser-based application for creating, animating, and managing 2D pixel-art game sprites.

Unlike conventional sprite editors that rely solely on a graphical user interface, Game Asset Studio is architected with a **strict separation between pure domain operations and UI views**. Every action—such as drawing a pixel, flood-filling a region, flipping a frame, reordering animations, or packing a sprite sheet—is implemented as a pure, deterministic TypeScript function.

This design enables a dual-audience model:
1. **For Humans:** A responsive, hardware-accelerated creative studio with real-time animation preview, onion skinning, multiple brush sizes, custom palettes, and zero-latency keyboard shortcuts.
2. **For AI Agents:** An invisible, first-class **WebMCP (Web Model Context Protocol)** interface exposed via Chrome's native `document.modelContext`. Agents can inspect and edit live sprites in the user's active session without screen-scraping, coordinate guessing, or simulated mouse clicks.

---

## 2. High-Level System Architecture

The application enforces a unidirectional data flow across four decoupled layers:

```
┌────────────────────────────────────────────────────────┐
│                   WebMCP Agent Layer                   │
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

## 3. Phase 1: Sprite Editor & Core Capabilities

### 3.1 Pixel Canvas & Drawing Engine
- **Nearest-Neighbor Canvas:** Pixel-perfect rendering using offscreen buffers and `imageRendering: pixelated`.
- **Drawing Tools:**
  - **Pencil (`B`) & Eraser (`E`):** Continuous Bresenham line interpolation to prevent missed pixels during rapid mouse drags.
  - **Multi-Pixel Brush Sizes (1px, 2px, 3px, 4px):** Real-time bounding hover preview that highlights all blocks affected by the brush stroke.
  - **Paint Bucket / Flood Fill (`G`):** Queue-based 4-way flood fill with boundary detection.
  - **Eyedropper / Color Picker (`I`):** Direct pixel sampling from the canvas buffer.
  - **Shape Tools:** 1px Bresenham line (`L`) and outline/filled rectangle (`R`) with live overlay previews.
  - **Canvas Transforms:** Horizontal/Vertical flipping, 90°/180°/270° clockwise rotations, and coordinate shifts with wrap-around.
- **Viewport Navigation:**
  - **Hand / Move Tool (`V`):** Direct click-and-drag panning.
  - **Space + Drag:** Hold Space from any tool to pan.
  - **Mouse Wheel Zoom:** Natural scroll stepping (Scroll Down $\rightarrow$ Zoom In, Scroll Up $\rightarrow$ Zoom Out).
  - **Grid & Onion Skinning:** Toggleable pixel boundary grid (`H`) and multi-frame ghost overlays (`O`).

### 3.2 Animation Engine & Isolated Playback
- **Multi-State Sprites:** Sprites support unlimited distinct animation states (e.g. *Idle, Walk, Run, Attack, Jump, Hurt, Death*).
- **Independent Frame Rates:** Each state maintains its own FPS speed (1 to 60 FPS) and continuous loop setting.
- **Isolated Playback Store (`usePlaybackStore`):** The 60 FPS animation preview operates in an isolated Zustand store, ensuring continuous playback without triggering canvas re-renders.
- **Smart Auto-Rewind:** When looping is disabled and playback reaches the final frame, pressing Play or Space automatically restarts from Frame 1.

### 3.3 Project & Asset Management
- **Multi-Asset Workspace:** Work with multiple character, enemy, prop, and environment assets in one project.
- **Starter Templates:** Pre-configured Starter Assets (*Knight Hero*, *Forest Slime*, *Treasure Chest*) with fully illustrated multi-frame animation states.
- **Canvas Resizing:** Non-destructive sprite resizing (16×16, 24×24, 32×32, 48×48, 64×64, custom) with symmetrical *Center* or *Top-Left* anchor placement.
- **Undo / Redo System:** Full project deep-snapshot history (up to 30 states) supporting `Ctrl+Z` and `Ctrl+Y`.

### 3.4 Palette Management System
- **Pre-Configured Palettes:** Built-in authentic game palettes (*Pixel Hero, Fantasy RPG, Cyberpunk Neon, Retro Monochrome 4-Bit, Dungeon 16, Studio Gray Scale*).
- **Custom Swatch Editing:** Primary/Secondary color swapping (`X`), color adding, replacement, and removal.

### 3.5 Export & Serialization Suite
- **Single Frame PNG:** High-resolution nearest-neighbor scaling (1x, 2x, 4x, 8x, 16x).
- **Packed Sprite Sheets:** Horizontal strip, Vertical column, or Grid layouts with custom padding.
- **JSON Metadata:** Standardized engine-ready frame coordinates and animation timing for Unity, Godot, Phaser, and web game engines.
- **Project JSON:** Complete lossless backup and restore of all assets, states, frames, and palettes.

### 3.6 Zero-Lag Keyboard Architecture
- Global hotkey listener registered once on mount with 0 dependency re-attachment churn.
- Direct synchronous access to state via `.getState()`, providing 0ms input latency across all shortcuts.

---

## 4. Phase 2: WebMCP Integration

### 4.1 Browser Native WebMCP Platform
- **Target Specification:** Chrome's native `document.modelContext` API.
- **Feature Detection:** Automatic short-circuiting when `document.modelContext` is unavailable; no polyfill dependencies or network transports required.
- **Lifecycle Cleanup:** Uses standard `AbortController` signal passed to `document.modelContext.registerTool(tool, { signal })`, allowing clean unregistration during Hot Module Replacement (HMR).

### 4.2 Uniform Tool Result Contract
Every WebMCP tool returns a uniform, machine-parseable JSON string and catches all exceptions internally:

```typescript
type ToolResult =
  | { status: "success"; [key: string]: unknown }
  | { status: "error"; message: string };
```

### 4.3 Compact RLE Pixel Encoding Format
To minimize token consumption for LLM agents, pixel reads and writes use index-aligned **Run-Length Encoding (RLE)**:

```typescript
interface FramePixelsPayload {
  width: number;
  height: number;
  palette: string[];    // index 0 is always "" (transparent), index 1..N are hex colors
  pixelsRle: number[];  // flat array: [colorIndex, runLength, colorIndex, runLength, ...]
}
```
*A 32×32 frame is compressed from $\sim 600$ tokens to $\sim 150-250$ tokens with 100% bit-exact restoration.*

---

### 4.4 Complete 36-Tool Inventory

```
src/webmcp/tools/
  ├── queryTools.ts      (5 tools)
  ├── assetTools.ts      (4 tools)
  ├── animationTools.ts  (8 tools)
  ├── frameTools.ts      (4 tools)
  ├── pixelTools.ts      (9 tools across 3 tiers)
  ├── paletteTools.ts    (4 tools)
  └── exportTools.ts     (2 tools)
```

#### 🔍 1. Query Tools (`readOnlyHint: true`)
1. `list_assets`: Lists all sprite assets in the project with IDs, names, dimensions, categories, and state lists.
2. `get_asset_details`: Full asset detail including dimensions, palette swatches, and all animation states with frame counts.
3. `get_current_selection`: Inspects the active asset ID, state ID, frame index/ID, and active editor tools.
4. `get_frame_pixels`: Returns compact Run-Length Encoded (RLE) pixel payload and aligned palette.
5. `get_animation_state`: Returns FPS, loop toggle, frame count, and ordered frame IDs.

#### 📦 2. Asset Tools
6. `create_asset`: Creates a new sprite asset with custom dimensions and starter states.
7. `duplicate_asset`: Duplicates an existing asset with all states and frames.
8. `delete_asset` (`destructiveHint: true`): Deletes an asset from the project.
9. `resize_sprite`: Resizes canvas dimensions with Center or Top-Left anchoring.

#### 🎬 3. Animation State Tools
10. `create_animation_state`: Adds a new animation state with frames.
11. `rename_animation_state`: Renames an existing animation state.
12. `delete_animation_state` (`destructiveHint: true`): Deletes an animation state.
13. `duplicate_animation_state`: Duplicates an animation state.
14. `set_animation_speed`: Sets playback speed in FPS (1–60).
15. `set_animation_loop`: Configures continuous looping or play-once.
16. `play_animation`: Starts preview playback in the live application.
17. `pause_animation`: Pauses animation preview.

#### 🎞️ 4. Frame Tools
18. `add_frame`: Inserts a blank frame or duplicates the previous frame.
19. `duplicate_frame`: Duplicates a specific frame in an animation state.
20. `delete_frame` (`destructiveHint: true`): Deletes a frame.
21. `reorder_frames`: Reorders frames by explicit ID list or from/to index.

#### 🖌️ 5. Pixel Editing Tools (3 Tiers)
- **Tier 1 — Full Rewrite:**
  22. `set_frame_pixels`: Replaces the entire frame pixel buffer from an RLE payload.
- **Tier 2 — Targeted Patch:**
  23. `set_pixels`: Sets specific `(x, y)` pixel coordinates using palette `colorIndex` or `hexColor`.
- **Tier 3 — Shapes & Transforms (Token-Efficient):**
  24. `flood_fill`: Contiguous flood fill starting at `(x, y)`.
  25. `draw_line`: 1-pixel Bresenham line between `(x0, y0)` and `(x1, y1)`.
  26. `draw_rectangle`: Solid filled or 1px outline rectangle at `(x, y, w, h)`.
  27. `flip_frame`: Horizontal or vertical frame flip.
  28. `rotate_frame`: 90°, 180°, or 270° clockwise rotation.
  29. `shift_frame`: Pixel offset shift by `dx` and `dy` with wrap-around.
  30. `clear_frame` (`destructiveHint: true`): Clears frame to transparent.

#### 🎨 6. Palette Tools
31. `set_palette_preset`: Applies a studio preset (*Pixel Hero, Fantasy RPG, Cyberpunk Neon, Retro 4-Bit, Dungeon 16, Studio Gray Scale*).
32. `add_palette_color`: Adds a hex color swatch to the asset palette.
33. `remove_palette_color`: Removes a color swatch by index or hex.
34. `set_palette_color`: Replaces a palette swatch at a specific index.

#### 📤 7. Export Tools
35. `export_frame_png`: Renders frame, triggers PNG download, and returns metadata JSON.
36. `export_sprite_sheet`: Generates packed sprite sheet PNG, triggers download, and returns JSON metadata.

---

## 5. Codebase Directory Structure

```
c:\Users\Abbas\dev\SpritesCanvas\
├── src/
│   ├── components/
│   │   ├── canvas/          # PixelCanvas, CanvasToolbar, CanvasControls
│   │   ├── layout/          # Header, Sidebar, Statusbar
│   │   ├── modals/          # NewAssetModal, ResizeSpriteModal, ShortcutsModal
│   │   ├── palette/         # PalettePanel, ColorPicker
│   │   ├── preview/         # AnimationPreview, ExportModal
│   │   ├── timeline/        # AnimationTimeline, StateManager, FrameCard
│   │   └── ui/              # Toast, Tooltip
│   ├── constants/           # Palette presets and default dimensions
│   ├── domain/              # Pure domain operations (No React/UI dependencies)
│   │   ├── animationOperations.ts
│   │   ├── assetOperations.ts
│   │   ├── exportOperations.ts
│   │   ├── frameOperations.ts
│   │   ├── paletteOperations.ts
│   │   └── pixelOperations.ts
│   ├── persistence/         # IndexedDB storage and initial starter data
│   ├── store/               # Zustand authoritative state stores
│   │   ├── editorStore.ts
│   │   ├── playbackStore.ts
│   │   └── projectStore.ts
│   ├── tests/               # Automated test runner and verification suites
│   │   ├── domainOperations.test.ts
│   │   ├── runTests.ts
│   │   └── webmcpTools.test.ts
│   ├── types/               # TypeScript interfaces (asset, editor, export)
│   ├── utils/               # Canvas rendering, color math, ID generation
│   ├── webmcp/              # WebMCP Layer
│   │   ├── tools/           # 7 tool group modules (36 tools)
│   │   ├── utils/           # RLE encoding, store lookup helpers
│   │   ├── index.ts         # Root exports
│   │   ├── register.ts      # Native document.modelContext registration
│   │   └── types.ts         # WebMCP tool types & ambient declarations
│   ├── App.tsx              # Main studio workspace & lifecycle coordinator
│   ├── index.css            # Tailwind CSS directives & custom scrollbars
│   └── main.tsx             # React DOM root entry point
├── DOCUMENTATION.md         # Repository documentation
├── README.md                # Studio overview & quickstart
├── package.json             # Scripts & dependencies
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 6. Automated Verification & Test Suite

The project includes an automated test runner executing **242 tests** across domain and WebMCP layers:

```bash
npm test
```

### Verification Breakdown
- **Domain Operations Suite (33 Tests):**
  - Asset creation, cloning, resizing, and state additions.
  - Frame creation, duplication, deletion, and reordering.
  - Pixel updates, Bresenham line rendering, rectangle geometry, flood fill, flips, rotations, and shifts.
  - Lossless JSON project serialization.
- **WebMCP Integration Suite (209 Tests):**
  - Lossless RLE encoding and decoding round-trip on complex sprite buffers.
  - Execution of all 36 WebMCP tools verifying JSON success contracts.
  - JSON Schema verification and annotation validation (`readOnlyHint`, `destructiveHint`).
  - Error-handling verification ensuring non-throwing structured error responses.
  - Mock `document.modelContext` lifecycle registration and `AbortController` signal abort.

---

## 7. Developer & AI Agent Usage Guide

### Starting the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Inspecting WebMCP Tools in Chrome
1. Launch Chrome with `#enable-webmcp-testing` enabled via `chrome://flags`.
2. Open the **Model Context Tool Inspector** extension or DevTools console.
3. Call `document.modelContext.getTools()` to inspect all 36 live tools.
4. Execute tools directly:
   ```javascript
   await document.modelContext.executeTool('draw_rectangle', {
     assetId: 'asset-knight',
     stateId: 'state-idle',
     x: 2,
     y: 2,
     width: 12,
     height: 12,
     colorIndex: 8,
     filled: false
   });
   ```
   *The live canvas updates immediately.*
