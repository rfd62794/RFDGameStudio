# RFDGameStudio — System Design Document v0.2

*June 2026 | RFD IT Services Ltd. | Amendment to SDD v0.1.*
*Sections 1–7 unchanged. Sections 8–10 are new. ADRs 007–008 accompany this document.*

---

## 8. The Seven Primitives

Every game ever built — regardless of language, engine, or genre — is composed of
the same seven foundational concepts. These are not design patterns or framework
abstractions. They are the irreducible units of game logic.

Game Maker Studio's object model organizes five lifecycle events (Create, Step, Draw,
Collision, Destroy) that every object responds to. This section translates that
principle into language-agnostic terms that any runtime can implement.

The seven primitives are:

### 8.1 Entity

**Definition:** Something that exists and has properties.

A horse. A bet. A snake segment. A bot part. An entity is the noun — the thing the
game reasons about. Every entity has an ID and a set of typed fields. Entities are
defined in `data.yaml` under `schemas`. They are never defined in logic or renderers.

**Lua contract:**
```lua
-- Every entity type can be created from a table of properties
-- and validated against its schema.
-- Entity creation functions follow this naming convention:
--   generate_{entity_type}(options, ...) → entity_table
-- Example: generate_horse(options, coat_colors, silk_colors, prefixes, suffixes)
```

**Rule:** An entity that cannot be described entirely by its `data.yaml` schema
entry is not correctly modeled.

---

### 8.2 Action

**Definition:** Something that changes state.

Placing a bet. Breeding horses. Attacking a bot part. An action takes the current
state and returns a new state. Actions are pure functions in `logic.lua`. They never
mutate their inputs.

**Lua contract:**
```lua
-- Action functions follow this naming convention:
--   {verb}_{entity_type}(entity, params, ...) → new_entity | {result}
-- Example: update_horse_after_race(horse, rank, prize_earnings) → updated_horse
-- Example: breed_horses(sire, dam, coat_colors, ...) → offspring, error
```

**Rule:** Actions return new state. They never modify the input table. TypeScript
applies the returned values to React state.

---

### 8.3 Resolution

**Definition:** How contested outcomes get decided.

Who wins the race. Which attack lands. Which bet pays. Resolution takes two or more
entities, their relevant stats, and a chaos parameter (seeded RNG), and returns
an outcome. The d20 in D&D, the power/toughness comparison in Magic: The Gathering,
the finish time calculation in horse racing — all resolutions.

**Lua contract:**
```lua
-- Resolution functions follow this naming convention:
--   resolve_{contest}(participants, config) → {results}
-- Example: simulate_race(participants, config) → [{rank, horse_id, finish_time}]
-- Example: resolve_fight(bots, config) → [{rank, bot_id, damage_taken}]
```

**Rule:** The chaos parameter (RNG seed) is always set by the runtime before
resolution runs. Resolution functions never call `math.randomseed()` internally.
TypeScript never resolves a contest — it renders Lua-determined results only.

---

### 8.4 Consequence

**Definition:** What the new state looks like after resolution.

Career stats updated. Funds changed. Parts damaged. Consequence applies resolution
results to entities, producing new state for all affected entities.

**Lua contract:**
```lua
-- Consequence functions follow this naming convention:
--   apply_{outcome}(entity, result, config) → updated_entity
-- Example: update_horse_after_race(horse, rank, prize_earnings) → updated_horse
-- Example: apply_damage_to_part(part, damage) → updated_part
```

**Rule:** Consequence functions are pure. They return new entities. They do not
touch time (`Date.now()`), which belongs to TypeScript. They do not write to
any external state.

---

### 8.5 Movement

**Definition:** Position changing over time.

A horse advancing across a track. A snake segment moving to the next cell. A bot
advancing on an opponent. Movement is the spatial expression of an entity's state.

**Lua contract:**
```lua
-- Movement functions follow this naming convention:
--   tick_{entity_type}(entity, delta_time, config) → updated_entity
-- Example: tick_race(participants, distance, delta_time) → updated_participants, all_finished
-- Example: tick_snake(snake, direction, grid_size) → updated_snake, collision_event
```

**Rule:** Movement that affects visual position during animation may be mirrored
in TypeScript for rendering purposes (prefixed `anim_`). The canonical position
that determines game outcomes always comes from Lua.

---

### 8.6 Physics

**Definition:** Collision detection and response.

A snake hitting a wall. A bot weapon contacting armor. A horse running out of
stamina. Physics is what happens when entities interact with space or each other.

**Lua contract:**
```lua
-- Physics functions follow this naming convention:
--   detect_{collision_type}(entity, world, config) → collision_event | nil
--   resolve_{collision_type}(entity, collision_event, config) → updated_entity
-- Example: detect_wall_collision(snake, grid_size) → {type="wall"} | nil
-- Example: resolve_part_impact(part, hit_energy) → updated_part
```

**Rule:** Collision detection that drives gameplay outcomes lives in Lua.
Visual-only collision effects (flash, shake) live in TypeScript.

---

### 8.7 Lifecycle

**Definition:** Create → Step → Draw → Collision → Destroy.

This is the Game Maker Studio principle translated into language-agnostic form.
Every game object passes through these five phases. The engine calls them. The
game defines what runs inside them.

| Phase | What it is | Where it lives |
|---|---|---|
| **Create** | Entity spawns. Initial state assigned. | Lua — `generate_{entity}` |
| **Step** | State updates per tick. Movement, physics, consequences. | Lua — `tick_{entity}` |
| **Draw** | Render current state. No logic. | TypeScript — components |
| **Collision** | Detect and resolve entity interactions. | Lua — `detect_*` / `resolve_*` |
| **Destroy** | Entity removed. Final consequences applied. | Lua — `destroy_{entity}` |

**Rule:** The lifecycle contract is enforced by naming convention. Any function
that does not fit cleanly into one of these five phases is a candidate for
decomposition.

---

## 9. Reusability Contract

### 9.1 Three Layers

Reusability in RFDGameStudio operates at three layers:

```
Layer 1 — Engine Primitives (shared across all games)
  engine/primitives/   — one file per primitive (entity.lua, action.lua, ...)
  engine/systems/      — shared system implementations (genetics.lua, odds.lua, ...)

Layer 2 — Game Logic (game-specific, may import from Layer 1)
  games/{game_id}/logic.lua   — game-specific functions
  games/{game_id}/data.yaml   — game-specific schemas and constants
  games/{game_id}/ui.yaml     — game-specific layout intent
  games/{game_id}/systems.yaml — game-specific system manifest

Layer 3 — Renderer (runtime-specific, may import from Layer 1 UI)
  ts/src/ui/             — shared TypeScript UI components (all games)
  ts/src/games/{game}/   — game-specific renderer
```

### 9.2 The Dependency Rule

Dependencies flow downward only:

```
Layer 3 (Renderer) can import from Layer 2 and Layer 1.
Layer 2 (Game Logic) can import from Layer 1.
Layer 1 (Engine) imports nothing above itself.
```

A game's `logic.lua` may call functions defined in `engine/systems/genetics.lua`.
`engine/systems/genetics.lua` may call functions in `engine/primitives/entity.lua`.
Neither may call anything in a game's own `logic.lua`.

### 9.3 Engine Primitives Directory

```
engine/
  primitives/
    entity.lua      — Entity contracts: ID generation, schema validation
    action.lua      — Action contracts: pure state transformation patterns
    resolution.lua  — Resolution contracts: RNG-seeded outcome determination
    consequence.lua — Consequence contracts: post-resolution state application
    movement.lua    — Movement contracts: position update patterns
    physics.lua     — Physics contracts: collision detection/response patterns
    lifecycle.lua   — Lifecycle contracts: create/step/draw/collision/destroy
  systems/
    genetics.lua    — Genome generation, inheritance, mutation (from TurboShells)
    odds.lua        — Probability weighting, payout calculation (from horse_racing)
    combat.lua      — Attack resolution, damage calculation (for BattleBots)
    market.lua      — Bet placement, settlement, valuation (from horse_racing)
    movement.lua    — Grid movement, pathfinding (for Snake)
```

### 9.4 What "Shared" Means in Lua

Lua does not have a module system by default. `dofile()` executes a file in the
current VM. The runtime bridge loads engine files before game files.

**Runtime load order:**
1. Load `engine/primitives/*.lua` — all seven primitives available
2. Load `engine/systems/*.lua` declared in `systems.yaml` — selected systems available
3. Load `games/{game_id}/logic.lua` — game-specific functions, can call engine functions

This means `horse_racing/logic.lua` can call `genetic_breed_stat()` from
`engine/systems/genetics.lua` without re-implementing it.

### 9.5 When NOT to Share

Not everything should be shared. The dependency rule exists to prevent over-abstraction.

A function belongs in the engine only when:
- It appears in 2+ games with the same contract
- It maps directly to one of the seven primitives
- It has no game-specific parameters

A function belongs in `game/logic.lua` when:
- It is specific to the game's domain (race class selection, snake growth)
- It uses game-specific constants from `data.yaml`
- It calls engine functions but applies game-specific rules

---

## 10. UI Component Vocabulary

### 10.1 Three Layers of UI

```
Layer 1 — Design Tokens (ts/src/ui/tokens.css)
  CSS custom properties. Colors, spacing, typography, radii.
  No selectors. No layout. Only variables.
  All games read from this file. None override it.

Layer 2 — Base Components (ts/src/ui/components/)
  Reusable TypeScript components. Stateless functions.
  No game-specific knowledge. No horse racing. No snake.
  Receive props, render, return. Nothing else.

Layer 3 — Game Components (ts/src/games/{game}/components/)
  Game-specific renderers built from Layer 2 components.
  Know about Horse, Snake, Bot entities.
  May not be imported by other games.
```

### 10.2 Layer 1 — Design Tokens

`ts/src/ui/tokens.css` defines:

```css
:root {
  /* Color */
  --color-bg:         #0f1117;
  --color-surface:    #1a1d27;
  --color-surface-2:  #22263a;
  --color-border:     #2e3350;
  --color-text:       #e8eaf0;
  --color-muted:      #8a8fa8;
  --color-accent:     #6c8ef7;
  --color-accent-dim: #3d4f99;
  --color-green:      #34d399;
  --color-red:        #f87171;
  --color-yellow:     #fbbf24;
  --color-amber:      #f59e0b;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Typography */
  --font-family: 'Segoe UI', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;

  /* Shape */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

**Rule:** `--color-*`, `--space-*`, `--font-*`, `--radius-*` are the four token
namespaces. No game adds tokens to this namespace. Games may define their own
`--horse-*` or `--snake-*` variables in their own `styles.css`.

### 10.3 Layer 2 — Base Components

Component registry (to be built incrementally as games are added):

| Component | Props | Renders |
|---|---|---|
| `<Button>` | label, onClick, variant, disabled | Styled button, reads `--color-accent` |
| `<Panel>` | children, className | Surface container, border |
| `<StatBar>` | label, value, max, color | Labeled progress bar |
| `<Badge>` | label, variant | Small colored tag |
| `<TabBar>` | tabs, active, onSelect | Tab navigation row |
| `<Modal>` | children, onClose, title | Overlay panel |
| `<Card>` | children, className | Surface card with border |
| `<EmptyState>` | message | Centered italic placeholder |
| `<ErrorBox>` | message | Red-bordered error display |

**Rule:** Base components read only from `tokens.css`. They do not import from
`games/`. They do not know about Horse, Snake, or Bot. They are pure render
functions: props in, JSX out.

### 10.4 Layer 3 — Game Components

Game components live in `ts/src/games/{game_id}/components/`. They may:
- Import base components from `ts/src/ui/components/`
- Import engine types from `ts/src/engine/types.ts`
- Import engine functions from `ts/src/engine/runtime.ts`
- Define game-specific styles in `ts/src/games/{game_id}/styles.css`

They may NOT:
- Import from another game's components directory
- Define base component styles (no overriding `--color-accent`)
- Implement game logic (no rules in render functions)

### 10.5 File Structure — Target State

```
ts/src/
  engine/                     — unchanged (loader, executor, runtime, types)
  ui/
    tokens.css                — design tokens (all games)
    base.css                  — reset + typography (no variables)
    components/
      Button.tsx
      Panel.tsx
      StatBar.tsx
      Badge.tsx
      TabBar.tsx
      Modal.tsx
      Card.tsx
      EmptyState.tsx
      ErrorBox.tsx
  games/
    horse_racing/
      App.tsx                 — horse racing app shell
      styles.css              — horse racing overrides only
      components/
        StableTab.tsx
        BettingTab.tsx
        BreederTab.tsx
        RaceTrack.tsx
        SVGRacer.tsx
    snake/
      App.tsx
      styles.css
      components/
        GameBoard.tsx
        ScorePanel.tsx
  main.tsx                    — game selector / router
  index.css                   → split into ui/tokens.css + ui/base.css
```

---

## Directory Structure — Target State

```
RFDGameStudio/
  engine/
    primitives/
      entity.lua
      action.lua
      resolution.lua
      consequence.lua
      movement.lua
      physics.lua
      lifecycle.lua
    systems/
      genetics.lua
      odds.lua
      combat.lua
      market.lua
      grid_movement.lua
  games/
    horse_racing/
      data.yaml
      ui.yaml
      logic.lua
      systems.yaml
    snake/
      data.yaml
      ui.yaml
      logic.lua
      systems.yaml
  studio/               — unchanged
  studio_mcp/           — unchanged
  tests/
    fixtures/
      horse_racing/
      snake/            — added when Snake is built
  ts/
    src/
      engine/           — unchanged
      ui/
        tokens.css
        base.css
        components/     — shared base components
      games/
        horse_racing/
          App.tsx
          styles.css
          components/
        snake/
          App.tsx
          styles.css
          components/
      main.tsx
  docs/
    adr/               — ADR-001 through ADR-008
    directives/
    sdd/
      RFDGameStudio_SDD_v0_1.md
      RFDGameStudio_SDD_v0_2.md  ← this document
    state/
```

---

## Migration Notes

The current state has everything in the right concepts but the wrong locations:

| Current | Target | Action |
|---|---|---|
| `ts/src/components/*.tsx` | `ts/src/games/horse_racing/components/` | Move |
| `ts/src/App.tsx` | `ts/src/games/horse_racing/App.tsx` | Move + refactor |
| `ts/src/index.css` | `ts/src/ui/tokens.css` + `ts/src/ui/base.css` + `ts/src/games/horse_racing/styles.css` | Split |
| `games/horse_racing/logic.lua` (shared parts) | `engine/systems/genetics.lua`, `engine/systems/odds.lua`, `engine/systems/market.lua` | Extract |
| (nothing) | `ts/src/ui/components/` | New |
| (nothing) | `engine/primitives/` | New |
| (nothing) | `ts/src/main.tsx` (router) | New |

**Migration order:** Engine primitives first (Lua, no build step). TypeScript UI
split second (tokens.css is low risk). Game component move third. Router last.

Each step is independently testable. Floors must hold at each step.

---

*RFDGameStudio SDD v0.2 | June 2026 | RFD IT Services Ltd.*
*ADR-007 (Primitive Registry) and ADR-008 (UI Component Vocabulary) accompany this document.*
