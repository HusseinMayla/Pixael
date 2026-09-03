# 🏆 Devpost Submission Narrative — Game Asset Studio (SpritesCanvas)

> **Track:** OpenAI WebMCP Challenge (Hackathon MVP)  
> **Project Name:** Game Asset Studio (SpritesCanvas)  
> **Live Deployment:** [https://pixael.vercel.app/](https://pixael.vercel.app/)  
> **Demo Video (YouTube):** [https://youtu.be/KbLT0nzdLaI](https://youtu.be/KbLT0nzdLaI) *(< 3 min)*  
> **Repository:** [https://github.com/HusseinMayla/SpritesCanvas](https://github.com/HusseinMayla/SpritesCanvas)  
> **License:** MIT License  

---

## 1. Use Case Fit: Why WebMCP?

### The Problem with Traditional Pixel-Art & Game Asset Tools
Creating 2D animated game sprites has traditionally been a painfully manual, repetitive process. Game developers and artists spend hours clicking individual pixels, re-coloring swatches, duplicating animation frames, adjusting hitboxes, and manually formatting sprite sheets.

Existing AI image generators (like standard diffusion models) produce static, high-resolution raster images with anti-aliasing, color bleeding, inconsistent pixel grids, and no animation state awareness. Furthermore, traditional web apps rely on server-side APIs or clunky headless backend workers that lack access to the user's active client session, leading to synchronization friction, high latency, and screen-scraping fragility.

### Why WebMCP is Essential
**Game Asset Studio** bridges this divide by turning the browser's live client session into a first-class collaborative workspace for both humans and AI agents.

Using Chrome's native **WebMCP (`document.modelContext`)** API:
1. **Direct In-Session Manipulation:** The agent interacts directly with the live React/Zustand application running in the user's browser tab.
2. **Deterministic Domain Execution:** Instead of simulating messy mouse clicks or guessing coordinate bounding boxes, the agent calls clean, pure domain operations (`draw_rectangle`, `flood_fill`, `set_frame_pixels`, `create_animation_state`, `export_sprite_sheet`).
3. **Real-Time Visual Feedback:** As the agent executes tools, the human user watches the live canvas and animation player update at 60 FPS in real time.
4. **Zero Backend / Zero Paywall Overhead:** Everything executes purely client-side in the browser, providing instant sub-millisecond execution without hosting expensive GPU compute clusters.

---

## 2. User Experience: Human + Agent Co-Piloting

Game Asset Studio is designed for **collaborative co-creation**, not passive automation:

- **Dual-Control Interaction:**
  - The human artist can sketch the outline of a knight with the mouse, and ask the AI agent: *"Fill in armor shading using the Fantasy RPG palette and generate a 4-frame running animation."*
  - The AI agent calls `get_current_selection`, reads the frame via `get_frame_pixels`, computes motion frames, and writes them back via `set_frame_pixels` and `add_frame`.
- **Live Undo/Redo & Human Oversight:**
  - Every agent tool call is captured by the authoritative snapshot history store. If an agent mutation isn't what the user intended, a single press of `Ctrl+Z` in the editor immediately reverts the canvas state.
- **Natural Language + Direct Precision:**
  - Humans provide high-level artistic direction and fine-tuned pixel touch-ups.
  - Agents handle tedious mechanical operations: generating animation frame variations, scaling canvas dimensions, swapping color palettes, and packing sprite sheets with engine-ready JSON metadata.

---

## 3. Capabilities Unlocked

| Capability | Manual UI Workflow | With WebMCP Agent Integration |
|---|---|---|
| **Multi-State Animation Generation** | Drawing 4–8 frames per state manually (hours) | Agent generates coherent multi-frame walk, run, and attack cycles in seconds |
| **Palette Swapping & Theming** | Hand-replacing dozens of color swatches across every frame | Agent invokes `set_palette_preset` or batch recoloring via `set_pixels` instantaneously |
| **Shape & Geometry Construction** | Pixel-by-pixel alignment and manual measuring | Agent calls `draw_rectangle`, `draw_line`, or `flood_fill` with exact coordinates |
| **Sprite Sheet Packing & Metadata** | Manual alignment in Photoshop or external CLI tools | Agent triggers `export_sprite_sheet` producing aligned PNG sheets + JSON metadata ready for Unity/Godot |
| **Context-Aware Asset Inspection** | Tedious inspection of frame dimensions and timing | Agent uses `get_asset_details` and `get_animation_state` to understand asset structure instantly |

---

## 4. Technical Implementation & Architecture

### A. Four-Layer Unidirectional Architecture
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

### B. 36 Native WebMCP Tools across 7 Modules
1. **`queryTools.ts` (5 tools):** `list_assets`, `get_asset_details`, `get_current_selection`, `get_frame_pixels`, `get_animation_state` (`readOnlyHint: true`).
2. **`assetTools.ts` (4 tools):** `create_asset`, `duplicate_asset`, `delete_asset` (`destructiveHint: true`), `resize_sprite`.
3. **`animationTools.ts` (8 tools):** `create_animation_state`, `rename_animation_state`, `delete_animation_state`, `duplicate_animation_state`, `set_animation_speed`, `set_animation_loop`, `play_animation`, `pause_animation`.
4. **`frameTools.ts` (4 tools):** `add_frame`, `duplicate_frame`, `delete_frame`, `reorder_frames`.
5. **`pixelTools.ts` (9 tools):** `set_frame_pixels` (Tier 1 RLE rewrite), `set_pixels` (Tier 2 coordinate patch), `flood_fill`, `draw_line`, `draw_rectangle`, `flip_frame`, `rotate_frame`, `shift_frame`, `clear_frame` (Tier 3 shape/transform ops).
6. **`paletteTools.ts` (4 tools):** `set_palette_preset`, `add_palette_color`, `remove_palette_color`, `set_palette_color`.
7. **`exportTools.ts` (2 tools):** `export_frame_png`, `export_sprite_sheet`.

### C. Compact Run-Length Encoded (RLE) Pixel Data
To eliminate LLM context bloat, pixel read and write paths utilize an index-aligned RLE format (`pixelsRle: [colorIndex, runLength, ...]`), reducing token overhead by $\sim 65\%$ while guaranteeing 100% bit-exact restoration.

### D. Quality & Verification
- **242 Automated Tests (`242/242` passing):** Unit tests for all pure domain operations, WebMCP tool execution, RLE encoding round-trips, schema validation, error boundaries, and mock lifecycle registration.
- **Production Build:** Clean TypeScript compilation (`tsc && vite build`) with zero errors and zero warnings.
