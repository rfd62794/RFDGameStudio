# rpgCore Rendering Audit
**Date:** 2026-02-21 (Session 018)
**Scope:** Deep read-only invariant audit of all rendering, drawing, and visual output systems across the repository.

> **Update:** As of late Session 018, Rendering Consolidation is complete. Godot, Terminal, and PPU shims have been preserved in `archive/rendering_donors/`. Sovereign Surface pattern is extracted to `shared/rendering/sovereign_surface.py`. PyGameRenderer is upgraded with LayerCompositor, FontManager, and SpriteLoader.
---

## 1. Complete Rendering Inventory

### `src/shared/rendering/`
- **Files:** `render_adapter.py`, `pygame_renderer.py`
- **Approach:** Abstract Entity Adapter. The engine passes a list of entity dictionaries to the renderer, which loops through them and draws primitives based on `type`.
- **Renders:** Basic Pygame primitives (`circle`, `triangle` via polygon, `rect`).
- **Dependencies:** Consumed by nothing currently (just extracted).
- **Duplication:** Replaces the exact same logic found in `src/game_engine/engines/pygame_bridge.py`.

### `src/game_engine/`
- **Files:** `engines/pygame_bridge.py`, `engines/godot_bridge.py`, `engines/terminal_bridge.py`, `systems/graphics/godot_render_system.py`
- **Approach:** Multi-backend Entity Adapters. The game loop operates entirely headless, relying on Bridges to interpret entity states into pixels or text.
- **Renders:** Pygame shapes, text HUDs, Rich console grids, or IPC socket messages to Godot.
- **Dependencies:** The overarching `game_engine` architecture.
- **Duplication:** High. Pygame bridge is now in shared. Godot and Terminal bridges solve problems outside the Python/Pygame scope.

### `src/game_engine/godot/`
- **Files:** `Server/GameServer.cs`, `Rendering/GoddotRenderer.cs`, `scenes/Main.cs`
- **Approach:** C# IPC Server + CanvasLayer. 
- **Renders:** Godot primitives and node-based rendering controlled remotely by Python sockets.
- **Dependencies:** Godot Engine 4.x.
- **Duplication:** Solves rendering by sidestepping Python entirely.

### `src/dgt_engine/systems/`
- **Files:** `view/render_panel.py`, `body/ppu_adapter.py`, `body/terminal.py`, `dgt_core/compat/pygame_shim.py`
- **Approach:** Sovereign Surface Scaling + Proxies. Uses a PPU (Picture Processing Unit) concept where everything renders to a fixed-resolution `sovereign_surface`, which is then scaled up (`pygame.transform.scale`) to the display surface. Contains shims to convert raw `pygame.draw` calls into serializable "RenderPackets".
- **Renders:** Pixel-perfect grids, shapes, and terminal ASCII layouts via `rich.console`.
- **Dependencies:** `dgt_engine` SOA architecture.

### `src/apps/slime_clan/`
- **Files:** `auto_battle.py`, `territorial_grid.py`, `ui/battle_ui.py`, `ui/overworld_ui.py`, `scenes/`
- **Approach:** Procedural Inline Drawing. Game logic and ui logic directly invoke `pygame.draw` (rect, circle, line, arc, ellipse) and create/blit `pygame.Surface` overlays. Z-order is managed implicitly by the execution order of the code (background drawn first, UI drawn last).
- **Renders:** Tactical grids, health bars, selection highlights, UI panels, territory nodes, and arcs.
- **Dependencies:** Tight coupling between the `pygame` library and core game data structures.
- **Duplication:** Every view (overworld, battle) rolls its own bespoke drawing sequence. 

### `src/apps/space/`
- **Files:** `visual_asteroids.py`, `combatant_evolution.py`, `turbo_scout_demo.py`, `simple_visual_asteroids.py`, etc.
- **Approach:** Surface Blitting & Rotations. Heavy use of pre-rendered or generative `pygame.Surface` objects that are rotated (`pygame.transform.rotate`) and `.blit` onto a fixed-resolution `game_surface`, which is then scaled up.
- **Renders:** Ships, asteroids, statistical graphs, neural net visualizers, text overlays.
- **Dependencies:** Pygame.
- **Duplication:** High. Every iteration of the space demo copies the `scaled_surface = pygame.transform.scale(...)` boilerplate.

---

## 2. Rendering Approaches Inventory

The repository renders things in **5 distinct ways**:
1. **Procedural Inline Pygame (Slime Clan):** Micromanaging `pygame.draw` calls varied directly inside game scenes and logic. Painful to refactor, impossible to swap out. Layering is entirely implicit by order of execution.
2. **Abstract Entity Adapters (Shared / Game Engine):** Decoupling game logic from rendering by passing structured data (entities, components) to a backend-agnostic adapter class. 
3. **Sovereign Surface Scaling (Space / DGT Engine):** Rendering to a low-res fixed coordinate system (`game_surface`), then scaling it to whatever the window size happens to be. Excellent for retro aesthetics and resolution independence.
4. **Rich Terminal ASCII (DGT / Game Engine):** Using the `rich` library to draw grids and text to standard output.
5. **IPC Godot Engine:** Python simulating the world, sending sockets to Godot to do the heavy lifting.

---

## 3. What `shared/rendering` Already Has

The newly extracted `shared/rendering` layer contains:
- `RenderAdapter`: A clean, backend-agnostic protocol (`initialize`, `shutdown`, `clear`, `present`, `render_entities`).
- `PyGameRenderer`: A concrete implementation that loops over an entity list and draws basic primitives (circles, rects, triangles).

**Assessment:** It is a solid foundational pattern, but it is purely theoretical right now. It is far too simplistic to handle the actual needs of any of the active demos.

---

## 4. Gap Analysis

What capabilities do the demos need that the `shared` layer lacks?
- **Sprites, Images, and Blitting:** `PyGameRenderer` cannot draw an image or sprite. The Space demos rely heavily on `surface.blit`.
- **Text and Typography (HUDs):** There is no text rendering standard. Every demo instantiates `pygame.font.Font` differently and overlays it manually.
- **Z-Order and Explicit Layering:** The existing shared renderer loops a single list of entities. It has no concept of a "Background", "Midground", "Foreground", and "UI" layer. 
- **Cameras and Coordinate Transforms:** `Slime Clan` applies manual camera offsets (`GRID_OFFSET_X`), while `Space` uses Sovereign Scaling. The shared renderer assumes 1:1 screen mapping and has no camera concept.
- **Advanced Primitives:** Slime Clan needs `arcs`, `ellipses`, and `lines` for its tactical UI. The shared adapter only does rects/circles/triangles.

---

## 5. Consolidation Recommendation

- **ARCHIVE:** The Godot IPC integration, the Terminal/Rich console bridges, and the `pygame_shim` packet renderer. They are brilliant experiments but completely out of scope for the current pure-Python desktop vision of rpgCore.
- **HARVEST:** The Sovereign Surface Scaling pattern from `space/` and `dgt_engine`. Integrating a virtual resolution upscaler into the `PyGameRenderer` will solve scaling problems across all demos instantly.
- **EVOLVE:** Expand `src/shared/rendering/RenderAdapter` to support:
  1. Image/Sprite loading and blitting.
  2. Text rendering.
  3. Primitive shapes beyond circles/rects (lines, arcs).
  4. Layering buckets (e.g., passing dictionaries of layers instead of a flat list).
  5. Camera/Sovereign viewport management.
- **REFACTOR:** After the evolved renderer is complete, migrate `Slime Clan` away from procedural inline drawing into the abstract rendering pipeline.

---

## 6. The Honest Summary

Rendering in `rpgCore` is deeply fragmented, caught between the theoretical purity of abstract entity adapters and the messy reality of inline procedural drawing. While the experimental bridges (Godot, Terminal) prove the architecture is flexible, the actual Pygame implementations lack critical features like layer management, sprite rendering, and unified camera scaling. To make the architecture viable for `Slime Clan` and future demos, the `shared/rendering` layer must be explicitly upgraded to handle images, layers, and scaling, replacing the current chaos with a single, capable pipeline.
