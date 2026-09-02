# 🎨 Game Asset Studio — 2D Pixel-Art Sprite Studio

> Built for the **OpenAI WebMCP Challenge**. A pixel-art sprite workspace where a human and an AI agent can create, edit, and animate the same sprite on the same live page.

### 🔴 [Live Demo — pixael.vercel.app](https://pixael.vercel.app/)

Works as a normal editor in any browser. To test the WebMCP layer, open it in Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled, or in ChatGPT's in-app browser.

![Human and AI agent co-editing a sprite in ChatGPT's in-app browser using native WebMCP tools](./public/RMExample.png)

### 📚 More docs

- 🏆 [Devpost Submission Narrative](./SUBMISSION_NARRATIVE.md)
- 🎬 [Demo Video (YouTube Placeholder)](https://youtu.be/PLACEHOLDER_DEMO_VIDEO)
- 🛠️ [Full WebMCP Tool Reference](./WEBMCP_TOOL_REFERENCE.md)
- 📖 [Technical Architecture](./DOCUMENTATION.md)

---

## What it does

A full pixel-art sprite editor: draw with pencil/eraser/bucket/eyedropper/line/rectangle tools, organize sprites into animation states (Idle, Walk, Attack, etc.) with multiple frames each, preview playback at adjustable FPS with looping, and export PNGs or packed sprite sheets. Multiple assets per project, category-organized, all saved automatically to IndexedDB — no login, no backend, works the moment you open it.

On top of that, every meaningful action — creating an asset, editing pixels, adjusting animation speed, exporting a sheet — is also exposed as a **WebMCP tool**, so an AI agent can do the same things a human does, on the same live canvas, through Chrome's `document.modelContext` API.

---

## Architecture

```
WebMCP Layer  →  document.modelContext.registerTool bindings
     ↓
UI Components →  Canvas, Toolbar, Timeline, Palette, Preview, Modals
     ↓
Domain Layer  →  pure, deterministic operations (src/domain/*)
     ↓
State Stores  →  useProjectStore (undo/redo) · usePlaybackStore · useEditorStore
     ↓
IndexedDB     →  debounced autosave, in-memory fallback
```

Both the UI and the WebMCP layer call the same domain operations — nothing is duplicated, and nothing an agent does bypasses the app's normal state management, undo/redo included.

| Domain area | Key operations                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| Asset       | `createAsset`, `cloneAsset`, `resizeAsset`, `deleteAsset`                            |
| Animation   | `createAnimationState`, `cloneAnimationState`, `removeStateFromAsset`                |
| Frames      | `addFrameToState`, `duplicateFrameInState`, `reorderFramesInState`                   |
| Pixels      | `setPixelInPixels`, `floodFillInPixels`, `flipPixels`, `rotatePixels`, `shiftPixels` |
| Palette     | `addPaletteColorToAsset`, `setPaletteColorAtIndex`                                   |
| Export      | `renderFrameToPngBlob`, `generateSpriteSheet`                                        |

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Requires Node 18+.

---

## WebMCP integration

36 tools registered via `document.modelContext.registerTool`, grouped as:

- **Query** (`list_assets`, `get_asset_details`, `get_current_selection`, `get_frame_pixels`, `get_animation_state`) — read-only, marked `readOnlyHint: true`
- **Asset & animation management** — create/duplicate/delete/resize assets and states, set speed/loop, play/pause
- **Frames** — add, duplicate, delete, reorder
- **Pixel editing, three tiers** — full-frame rewrite, targeted `(x, y)` patches, and shape/transform ops (flood fill, line, rectangle, flip, rotate, shift)
- **Palette** — presets and per-swatch edits
- **Export** — PNG and packed sprite sheets

Full schemas and example calls: [WEBMCP_TOOL_REFERENCE.md](./WEBMCP_TOOL_REFERENCE.md).

Pixel reads/writes use a compact palette-index + run-length encoding rather than raw pixel arrays or images, to keep tool calls cheap:

```typescript
interface FramePixelsPayload {
  width: number;
  height: number;
  palette: string[]; // index 0 is always "" (transparent)
  pixelsRle: number[]; // [colorIndex, runLength, colorIndex, runLength, ...]
}
```

This has been tested working end-to-end with both the Model Context Tool Inspector extension and ChatGPT's in-app browser — an agent can, for example, create a new character, add a Walk animation with four frames, recolor a region, and export a sprite sheet, entirely through tool calls on the live page. It's also been tested successfully across different model sizes within ChatGPT, including smaller/cheaper models — a sign the tool schemas and descriptions carry enough signal on their own, without needing a large model to compensate for ambiguity.

---

## Keyboard shortcuts

`B` pencil · `E` eraser · `G` bucket · `I` eyedropper · `L` line · `R` rectangle · `X` swap colors · `[`/`]` brush size · `Space` play/pause · `,`/`.` step frame · `H` grid · `O` onion skin · `Ctrl+Z`/`Ctrl+Y` undo/redo · `Ctrl+E` export

---

## License

MIT © 2026 Game Asset Studio Contributors
