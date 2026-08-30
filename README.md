# 🎨 Game Asset Studio — 2D Pixel-Art Sprite Studio

> Built for the **OpenAI WebMCP Challenge (Hackathon MVP)**.  
> A frictionless 2D pixel-art sprite workspace architected from the ground up for seamless human + AI collaborative game development.

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

### 4. Run Domain Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🔮 Next Phase: WebMCP Integration Roadmap

When WebMCP is connected in Phase 2, each domain operation will register directly using:

```typescript
if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
  // Register create_sprite_asset, add_animation_state, set_pixel, export_sheet, etc.
}
```

The AI agent will be able to converse and collaborate in real-time, executing tasks like:
- *"Create a 24x24 Mage character with Idle and Spellcast animations."*
- *"Fill the robe with royal purple and add golden rune highlights."*
- *"Adjust the Attack speed to 12 FPS and export the sprite sheet."*

---

## 📄 License

MIT © 2026 Game Asset Studio Contributors
