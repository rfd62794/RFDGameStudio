# SCENE & UI INVENTORY

## Entry Point
**game.py** is the primary game launcher.
* **Initialization**: Loads the root `demos.json` into a `DemoManifest` and registers them via `DemoRegistry`.
* **First Scene Launched**: Dispatches directly into `run_slime_breeder.main()` via `CLILauncher` if no arguments are provided. Otherwise launches whatever is specified in `--run`.
* **Main Loop Structure**: Handled by `src.shared.engine.scene_manager.SceneManager.run()`. It wraps `pygame.event.get()`, forwarding to `handle_event()`, `tick()`, and `render()` respectively.
* **Clock/Tick Budget**: Target is 60 FPS, tied to `pygame.time.Clock.tick()`. It passes `delta_time` in seconds down to the active scene via `SystemClock`.

---

## Scene Inventory

### GardenScene
* **File:** `src/apps/slime_breeder/ui/scene_garden.py`
* **Inherits from:** `Scene` (from `src/shared/ui/scene_base.py` or `src/shared/engine/scene_manager.py`)
* **SceneContext/RenderPipeline/InputRouter:** no / no / no
* **Entry Method:** `on_enter()`
* **Exit Method:** None overridden.
* **Transitions to:** `teams`, `breeding`, `racing`, `sumo`, `dungeon`, `tower_defense`
* **Transitions from:** Initial Launch, or via returning from minigames.
* **Test coverage:** Missing specific UI tests, heavily reliant on integration tests.
* **Notes:** Primary hub scene for the `slime_breeder` app.

### TeamScene
* **File:** `src/apps/slime_breeder/scenes/team_scene.py`
* **Inherits from:** `Scene`
* **SceneContext/RenderPipeline/InputRouter:** no / no / no
* **Entry Method:** `on_enter()`
* **Transitions to:** `garden`, `inventory`
* **Transitions from:** `garden`

### BreedingScene
* **File:** `src/apps/slime_breeder/scenes/breeding_scene.py`
* **Inherits from:** `Scene`
* **SceneContext/RenderPipeline/InputRouter:** no / no / no
* **Entry Method:** `on_enter()`
* **Transitions to:** `garden`
* **Transitions from:** `garden`

### RaceScene
* **File:** `src/apps/slime_breeder/scenes/race_scene.py`
* **Inherits from:** `Scene`
* **Entry Method:** `on_enter()`
* **Transitions to:** `garden`
* **Transitions from:** `garden`

### SumoScene
* **File:** `src/apps/slime_breeder/scenes/scene_sumo.py`
* **Inherits from:** `Scene`
* **Entry Method:** `on_enter()`
* **Transitions to:** `garden`
* **Transitions from:** `garden`

### TowerDefenseScene
* **File:** `src/apps/slime_breeder/scenes/scene_tower_defense.py`
* **Inherits from:** `Scene`
* **Entry Method:** `on_enter()`
* **Transitions to:** `garden`
* **Transitions from:** `garden`

### TheRoomScene (Dungeon Hub)
* **File:** `src/apps/dungeon_crawler/ui/scene_the_room.py`
* **Inherits from:** `Scene`
* **Entry Method:** `on_enter()`
* **Transitions to:** `dungeon_path`, `garden`
* **Transitions from:** `garden`, `dungeon_path`

### DungeonPathScene
* **File:** `src/apps/slime_breeder/scenes/scene_dungeon_path.py` (and duplicated in dungeon_crawler folder)
* **Inherits from:** `Scene`
* **Transitions to:** `dungeon_room`, `dungeon_combat`, `dungeon` (TheRoom)
* **Transitions from:** `dungeon`, `dungeon_combat`

### DungeonCombatScene
* **File:** `src/apps/dungeon_crawler/ui/scene_dungeon_combat.py`
* **Inherits from:** `Scene`
* **Transitions to:** `dungeon_path` (Note: Uses `switch_to("dungeon_path")` usually, previously used `.pop()`)
* **Transitions from:** `dungeon_path`

### InventoryOverlay
* **File:** `src/apps/dungeon_crawler/ui/scene_inventory.py`
* **Inherits from:** `Scene`
* **Transitions to:** Usually popped.

*(Other unmigrated/standalone scenes exist in `space_trader`, `last_appointment`, and `slime_clan`, running their own legacy loops or `pygame.display` logic without utilizing the unified `SceneManager`)*

---

## UI Component Inventory

### Components in `src/shared/ui/`
* **Component name:** `<various Base/Core elements: button, card, label, panel, progress_bar, scroll_list, tabbed_panel>`
* **File location:** `src/shared/ui/...`
* **Inherits from:** `UIBase` or raw pygame renderables.
* **Renders via:** Standard `pygame.draw.rect` and `self.surface.blit`.
* **Data it consumes:** Generic string text, tuples for positions and sizes, custom themes (`src.shared.ui.theme`).
* **Events it emits:** Click handlers via generic callbacks (`on_click=Callable`).
* **Used in scenes:** Standard standard UI layout forms dynamically in Hub and Roster screens.

### StatsPanel
* **File location:** `src/shared/ui/stats_panel.py`
* **Data it consumes:** `StatBlock` instance attached to a RosterSlime.
* **Used in scenes:** Team/Roster viewers.

### ProfileCard
* **File location:** `src/shared/ui/profile_card.py`
* **Data it consumes:** RosterSlime objects.

---

## Scene Routing Map
```text
game.py
  └── [ slime_breeder ]
        ├── GardenScene
        │     ├── TeamScene              [WIRED]
        │     ├── BreedingScene          [WIRED]
        │     ├── RaceScene              [WIRED]
        │     ├── SumoScene              [WIRED]
        │     ├── TowerDefenseScene      [WIRED]
        │     └── TheRoomScene (Dungeon) [WIRED]
        │           └── DungeonPathScene        [WIRED]
        │                 ├── DungeonRoomScene  [PARTIAL]
        │                 └── DungeonCombatScene[WIRED]
        │
        └── [ slime_clan ]           [UNKNOWN]
        └── [ last_appointment ]     [UNKNOWN]
        └── [ asteroids / space ]    [UNKNOWN]
```

---

## Inconsistency Flags
* `FLAG001` `src/tools/ui_reviewer/review_mode.py:16` Direct `pygame.display` call outside RenderPipeline/SceneManager.
* `FLAG002` `src/shared/rendering/pygame_renderer.py:26` Direct `pygame.display` call overriding primary render pipeline.
* `FLAG003` `src/game_engine/engines/pygame_bridge.py:42` Additional rogue `pygame.display` initialization.
* `FLAG004` `src/apps/space/*` 9 independent legacy pygame engines calling `pygame.display.set_mode()` repeatedly instead of utilizing unified Scene architecture. 
* `FLAG005` `src/apps/slime_clan/*` 4 independent legacy pygame screens calling `pygame.display.set_mode()` directly.
* `FLAG006` `src/shared/engine/scene_manager.py:218` SceneManager itself bypasses any overarching global `RenderPipeline`, embedding `pygame.display` directly into its `.run()` execution blocking.

---

## Demo Reachability
* **Slime Clan**: Launchable from game.py: yes / Standalone: yes (auto_battle.py) / Wired: no
* **Last Appointment**: Launchable from game.py: yes / Standalone: yes / Wired: no
* **Turbo Shells**: Launchable from game.py: yes / Standalone: yes / Wired: no
* **Asteroids**: Launchable from game.py: yes / Standalone: yes / Wired: no
* **Space Trader**: Launchable from game.py: yes / Standalone: yes / Wired: no
* **Dungeon Crawler**: Launchable from game.py: yes / Standalone: yes / Wired: no
* **Slime Breeder**: Launchable from game.py: yes / Standalone: yes / Wired: yes (Core loop Hub)

---

## Open Questions for Architect
1. Should `slime_breeder` continue functioning as the de-facto "Main Menu" or do we need a dedicated `MainMenuScene` that branches directly to the other applications?
2. `InputRouter` and `SceneContext` sit abandoned within `src/shared/engine/scene_manager.py` — they are fully optional and mostly bypassed. Should future refactors mandate their use?
3. Numerous demo files (like `space/` scripts) directly invoke `pygame.display.set_mode()`. If we unify them into the `SceneManager`, should we convert them into strict `Scene` subclasses, or wrap them in an adapter?
4. Are we removing the imperative `.push()` and `.pop()` routing in favor of declarative state machines globally, given recent shift to `.switch_to()` observed in Dungeon routing?
