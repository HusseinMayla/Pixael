# 🛠️ WebMCP Tool Reference — Game Asset Studio (SpritesCanvas)

> **Specification:** Chrome Native `document.modelContext` Protocol  
> **Total Registered Tools:** 37 Tools across 7 Functional Modules

---

## 📑 Module Index

1. [Query & State Inspection Tools (5)](#1-query--state-inspection-tools)
2. [Asset Management Tools (4)](#2-asset-management-tools)
3. [Animation State Tools (9)](#3-animation-state-tools)
4. [Frame Management Tools (4)](#4-frame-management-tools)
5. [Pixel Editing & Shape Tools (9)](#5-pixel-editing--shape-tools)
6. [Palette Management Tools (4)](#6-palette-management-tools)
7. [Export & Packaging Tools (2)](#7-export--packaging-tools)

---

## 1. Query & State Inspection Tools
*All query tools specify `annotations: { readOnlyHint: true }`.*

### `list_assets`
- **Description:** Lists all sprite assets in the project with their ID, name, category, dimensions (width, height), and animation state names.
- **Input Schema:** `{ type: "object", properties: {} }`
- **Return Example:**
  ```json
  {
    "status": "success",
    "projectName": "Untitled Project",
    "totalAssets": 3,
    "assets": [
      {
        "id": "asset_hero_123",
        "name": "Knight Hero",
        "category": "Characters",
        "width": 24,
        "height": 24,
        "stateCount": 3,
        "states": ["Idle", "Walk", "Attack"]
      }
    ]
  }
  ```

### `get_asset_details`
- **Description:** Returns full details for a sprite asset including dimensions, palette swatches, and all animation states with frame counts and FPS.
- **Input Schema:**
  - `assetId` *(string, required)*: The unique ID of the asset to inspect.
- **Return Example:**
  ```json
  {
    "status": "success",
    "asset": {
      "id": "asset_hero_123",
      "name": "Knight Hero",
      "category": "Characters",
      "width": 24,
      "height": 24,
      "palette": ["#000000", "#ffffff", "#ff004d"],
      "states": [
        { "id": "state_idle_456", "name": "Idle", "fps": 8, "loop": true, "frameCount": 4, "frameIds": ["f1", "f2", "f3", "f4"] }
      ]
    }
  }
  ```

### `get_current_selection`
- **Description:** Returns the active asset, active animation state, and active frame index/ID currently selected in the live editor UI.
- **Input Schema:** `{ type: "object", properties: {} }`
- **Return Example:**
  ```json
  {
    "status": "success",
    "selection": {
      "assetId": "asset_hero_123",
      "assetName": "Knight Hero",
      "stateId": "state_idle_456",
      "stateName": "Idle",
      "frameIndex": 0,
      "frameId": "f1",
      "currentTool": "pencil",
      "primaryColor": "#ff004d",
      "brushSize": 1
    }
  }
  ```

### `get_frame_pixels`
- **Description:** Returns compact run-length encoded (RLE) pixel data and palette for a frame. Index 0 is transparent; pairs are `[colorIndex, runLength]`.
- **Input Schema:**
  - `assetId` *(string, optional)*: Asset ID (defaults to active asset).
  - `stateId` *(string, optional)*: State ID (defaults to active state).
  - `frameId` *(string, optional)*: Specific frame ID.
  - `frameIndex` *(number, optional)*: 0-based frame index.
- **Return Example:**
  ```json
  {
    "status": "success",
    "assetId": "asset_hero_123",
    "stateId": "state_idle_456",
    "frameId": "f1",
    "frameIndex": 0,
    "frameData": {
      "width": 16,
      "height": 16,
      "palette": ["", "#ff004d", "#00e436"],
      "pixelsRle": [0, 10, 1, 4, 0, 12, 2, 8]
    }
  }
  ```

### `get_animation_state`
- **Description:** Returns FPS, loop setting, frame count, and ordered frame IDs for an animation state.
- **Input Schema:**
  - `assetId` *(string, required)*
  - `stateId` *(string, required)*
- **Return Example:**
  ```json
  {
    "status": "success",
    "assetId": "asset_hero_123",
    "state": {
      "id": "state_idle_456",
      "name": "Idle",
      "fps": 8,
      "loop": true,
      "frameCount": 4,
      "frames": [{ "id": "f1", "index": 0, "hasPixels": true }]
    }
  }
  ```

---

## 2. Asset Management Tools

### `create_asset`
- **Description:** Creates a new sprite asset with custom dimensions, name, and starter states.
- **Input Schema:**
  - `name` *(string, required)*: Asset name.
  - `width` *(number, optional)*: Pixel width (4–128, default 16).
  - `height` *(number, optional)*: Pixel height (4–128, default 16).
  - `category` *(string, optional)*: Category name (default "Characters").
  - `starterStates` *(string[], optional)*: List of initial states (e.g. `["Idle", "Walk", "Attack"]`).

### `duplicate_asset`
- **Description:** Duplicates an existing sprite asset with all states and frames.
- **Input Schema:**
  - `assetId` *(string, required)*: ID of asset to clone.
  - `newName` *(string, optional)*: Name for the duplicated clone.

### `delete_asset` *(destructive)*
- **Description:** Deletes a sprite asset from the project.
- **Input Schema:**
  - `assetId` *(string, required)*: ID of asset to delete.

### `resize_sprite`
- **Description:** Resizes sprite canvas dimensions preserving pixel art based on anchor placement.
- **Input Schema:**
  - `assetId` *(string, required)*
  - `width` *(number, required)*: 4–128 pixels.
  - `height` *(number, required)*: 4–128 pixels.
  - `anchor` *(string, enum: `["center", "top-left"]`)*: Anchor origin.

---

## 3. Animation State Tools

### `create_animation_state`
- **Description:** Adds a new animation state with frames to an asset.
- **Input Schema:** `assetId` *(required)*, `name` *(required)*, `fps` *(1–60)*, `loop` *(boolean)*, `frameCount` *(number)*.

### `rename_animation_state`
- **Description:** Renames an existing animation state.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `name` *(required)*.

### `delete_animation_state` *(destructive)*
- **Description:** Deletes an animation state from an asset.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*.

### `duplicate_animation_state`
- **Description:** Duplicates an animation state along with all its frames.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*.

### `reorder_animation_states`
- **Description:** Reorders animation states within an asset by shifting a state from one index to another.
- **Input Schema:** `assetId` *(required)*, `toIndex` *(required)*, `fromIndex` *(optional)*, `stateId` *(optional)*.

### `set_animation_speed`
- **Description:** Sets playback speed (FPS) for an animation state.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `fps` *(1–60, required)*.

### `set_animation_loop`
- **Description:** Sets continuous loop toggle for an animation state.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `loop` *(boolean, required)*.

### `play_animation` / `pause_animation`
- **Description:** Starts or pauses live animation preview playback in the application viewport.

---

## 4. Frame Management Tools

### `add_frame`
- **Description:** Inserts a blank frame or duplicates previous frame.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `insertAtIndex` *(optional)*, `copyPrevious` *(boolean, optional)*.

### `duplicate_frame`
- **Description:** Duplicates a specific frame in an animation state.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `frameId` / `frameIndex`.

### `delete_frame` *(destructive)*
- **Description:** Deletes a frame from an animation state.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `frameId` / `frameIndex`.

### `reorder_frames`
- **Description:** Reorders frames in an animation state.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `orderedFrameIds` *(string[], optional)*, `fromIndex` / `toIndex` *(numbers, optional)*.

---

## 5. Pixel Editing & Shape Tools

### `set_frame_pixels` (Tier 1 — Full RLE Rewrite)
- **Description:** Replaces entire frame pixel buffer from compact RLE payload.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `frameId` / `frameIndex`, `payload: { width, height, palette, pixelsRle }` *(required)*.

### `set_pixels` (Tier 2 — Targeted Patch)
- **Description:** Sets specific `(x, y)` pixel coordinates using `colorIndex` or `hexColor`.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `frameId` / `frameIndex`, `pixels: [{ x, y, colorIndex?, hexColor? }, ...]`.

### `flood_fill` (Tier 3)
- **Description:** Fills contiguous region of identical color starting at `(x, y)`.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `x` *(required)*, `y` *(required)*, `colorIndex` / `hexColor`.

### `draw_line` (Tier 3)
- **Description:** Draws 1px Bresenham line between `(x0, y0)` and `(x1, y1)`.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `x0`, `y0`, `x1`, `y1` *(all required)*, `colorIndex` / `hexColor`.

### `draw_rectangle` (Tier 3)
- **Description:** Draws outline or solid filled rectangle at `(x, y, width, height)`.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `x`, `y`, `width`, `height` *(all required)*, `filled` *(boolean)*, `colorIndex` / `hexColor`.

### `flip_frame` (Tier 3)
- **Description:** Flips frame horizontally or vertically.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `axis: "horizontal" | "vertical"` *(required)*.

### `rotate_frame` (Tier 3)
- **Description:** Rotates frame 90°, 180°, or 270° clockwise.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `degrees: 90 | 180 | 270` *(required)*.

### `shift_frame` (Tier 3)
- **Description:** Shifts pixels by `dx` (horizontal) and `dy` (vertical) with wrap-around.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `dx` *(required)*, `dy` *(required)*.

### `clear_frame` (Tier 3, destructive)
- **Description:** Clears all pixels in a frame to transparent.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `frameId` / `frameIndex`.

---

## 6. Palette Management Tools

### `set_palette_preset`
- **Description:** Applies studio preset (*"Pixel Hero", "Fantasy RPG", "Cyberpunk Neon", "Retro Monochrome 4-Bit", "Dungeon 16", "Studio Gray Scale"*).
- **Input Schema:** `assetId` *(required)*, `presetName` *(required enum)*.

### `add_palette_color`
- **Description:** Adds hex color swatch to asset palette.
- **Input Schema:** `assetId` *(required)*, `hexColor` *(required, e.g. "#ff004d")*.

### `remove_palette_color`
- **Description:** Removes color swatch by `colorIndex` or `hexColor`.
- **Input Schema:** `assetId` *(required)*, `colorIndex` / `hexColor`.

### `set_palette_color`
- **Description:** Replaces swatch color at specific index.
- **Input Schema:** `assetId` *(required)*, `colorIndex` *(required)*, `hexColor` *(required)*.

---

## 7. Export & Packaging Tools

### `export_frame_png`
- **Description:** Renders single frame, triggers PNG download, and returns metadata JSON.
- **Input Schema:** `assetId` *(required)*, `stateId` *(required)*, `scale: 1 | 2 | 4 | 8 | 16` *(default 4)*.

### `export_sprite_sheet`
- **Description:** Packs animation frames into high-resolution PNG sprite sheet with JSON timing metadata.
- **Input Schema:** `assetId` *(required)*, `stateId` *(optional)*, `layout: "horizontal" | "vertical" | "grid"`, `scale: 1 | 2 | 4 | 8 | 16`, `columns: number`.
