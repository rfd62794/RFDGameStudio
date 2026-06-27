# RFDGameStudio — Phase 2f Directive: Architecture Migration

*June 2026 | Read fully before executing anything.*
*This is a migration phase — no new features. Floors must hold after every sub-phase.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 32 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 17 passed, 0 failed, 0 skipped.
> Report both outputs before proceeding. Do not proceed if either differs.

---

## §0 Context

**What this phase does:**
Executes ADR-007 (Primitive Registry) and ADR-008 (UI Component Vocabulary).
The architecture is locked in the ADRs. This phase moves files to match.

**What this phase does NOT do:**
- No new game logic
- No new features
- No changes to what the game does — only where things live
- No new Python tests beyond updating paths
- No changes to game behavior visible in the browser

**Five sub-phases. Stop and verify floors after each one before continuing.**

---

## §1 Sub-Phase 2f.1 — Engine Lua Structure

**Goal:** Create `engine/` directory. Extract shared Lua functions.
Update Python runtime to load engine files before game files.
Python floor must hold after this sub-phase: 32/0/0.

### Step 1: Create directory structure

```
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
    market.lua
```

### Step 2: Populate primitive files

**engine/primitives/action.lua**
Extract from `games/horse_racing/logic.lua`:
- `clamp(val, min_val, max_val)` — move verbatim
- `rand_int(min_val, max_val)` — move verbatim
- `rand_item(arr)` — move verbatim

**engine/primitives/entity.lua**
New functions (not extracted, newly written per ADR-007):
```lua
function generate_id(prefix)
  return (prefix or "entity") .. "_" .. tostring(math.random(100000, 999999))
end

function copy_entity(entity)
  local copy = {}
  for k, v in pairs(entity) do copy[k] = v end
  return copy
end

function validate_entity(entity, required_fields)
  for _, field in ipairs(required_fields) do
    if entity[field] == nil then
      return false, "Missing field: " .. tostring(field)
    end
  end
  return true, nil
end
```

**engine/primitives/resolution.lua**
```lua
function scores_to_odds(scores, overround)
  overround = overround or 1.12
  local total = 0
  for _, s in ipairs(scores) do total = total + s end
  local odds = {}
  for _, s in ipairs(scores) do
    local prob = (s / total) * overround
    local decimal = math.floor((1 / math.max(0.01, prob)) * 10 + 0.5) / 10
    table.insert(odds, math.max(1.1, decimal))
  end
  return odds
end
```

**engine/primitives/movement.lua**
```lua
function advance_position(position, speed, delta_time)
  return position + speed * delta_time
end

function move_grid(pos, direction)
  return { x = pos.x + direction.dx, y = pos.y + direction.dy }
end

function in_bounds(pos, width, height)
  return pos.x >= 0 and pos.x < width and pos.y >= 0 and pos.y < height
end
```

**engine/primitives/physics.lua**
```lua
function grid_collision(pos_a, pos_b)
  return pos_a.x == pos_b.x and pos_a.y == pos_b.y
end

function self_collision(head, body)
  for _, segment in ipairs(body) do
    if grid_collision(head, segment) then return true end
  end
  return false
end
```

**engine/primitives/consequence.lua**
```lua
-- Placeholder — consequence patterns are game-specific for now.
-- Will be populated when a shared consequence emerges across 2+ games.
-- Convention: apply_{outcome}(entity, result) → updated_entity
```

**engine/primitives/lifecycle.lua**
```lua
LIFECYCLE_CREATE    = "create"
LIFECYCLE_STEP      = "step"
LIFECYCLE_DRAW      = "draw"
LIFECYCLE_COLLISION = "collision"
LIFECYCLE_DESTROY   = "destroy"
```

### Step 3: Populate system files

**engine/systems/genetics.lua**
Extract from `games/horse_racing/logic.lua`:
- `generate_horse_name(prefixes, suffixes)` — move verbatim
- `generate_color_profile(coat_colors)` — move verbatim
- `generate_horse(options, coat_colors, silk_colors, prefixes, suffixes)` — move verbatim
- `breed_stat(stat_a, stat_b)` — move verbatim
- `breed_horses(sire, dam, coat_colors, silk_colors, prefixes, suffixes)` — move verbatim

**engine/systems/odds.lua**
Extract from `games/horse_racing/logic.lua`:
- `calculate_odds(participants, distance, overround)` — move verbatim
- `calculate_place_odds(win_odds, config)` — move verbatim
- `calculate_show_odds(win_odds, config)` — move verbatim

**engine/systems/market.lua**
Extract from `games/horse_racing/logic.lua`:
- `calculate_payouts(results, prize_pool, prize_split)` — move verbatim (deprecated comment retained)
- `calculate_horse_price(horse)` — move verbatim
- `sell_horse(horse, current_funds)` — move verbatim
- `settle_bets(bets, standings, prize_pool, prize_splits)` — move verbatim

### Step 4: Update games/horse_racing/logic.lua

After extraction, `logic.lua` retains ONLY game-specific functions:
- `tick_race` — game-specific physics
- `simulate_race` — game-specific race resolution
- `update_horse_after_race` — game-specific career update
- `create_race` — game-specific race generation
- `can_unlock_slot` — game-specific stable management

Remove extracted functions. Add comment at top:
```lua
-- Horse Racing — Game-Specific Logic
-- Engine primitives loaded by runtime:
--   engine/primitives/action.lua (clamp, rand_int, rand_item)
--   engine/primitives/entity.lua (generate_id, copy_entity)
--   engine/systems/genetics.lua  (generate_horse, breed_horses, ...)
--   engine/systems/odds.lua      (calculate_odds, ...)
--   engine/systems/market.lua    (settle_bets, ...)
```

### Step 5: Update studio/loader.py

> ⚠️ NOTE: studio/loader.py was previously frozen. This sub-phase authorizes
> the minimal change needed to load engine files. No other changes to studio/.

Extend `load_game_files` to accept a `STUDIO_ROOT` path and load engine files
before game logic. The engine files are concatenated into a single Lua source
string that the executor sees:

```python
# In studio/loader.py — extend load_game_files or add a new function:

ENGINE_DIR = Path(__file__).parent.parent / "engine"

PRIMITIVE_LOAD_ORDER = [
    "primitives/action.lua",
    "primitives/entity.lua",
    "primitives/resolution.lua",
    "primitives/consequence.lua",
    "primitives/movement.lua",
    "primitives/physics.lua",
    "primitives/lifecycle.lua",
]

def load_engine_source(systems: list[str]) -> str:
    """
    Load engine primitives + declared systems into one Lua source string.
    Loaded before game logic.lua so game code can call engine functions.
    """
    parts = []
    for rel_path in PRIMITIVE_LOAD_ORDER:
        path = ENGINE_DIR / rel_path
        if path.exists():
            parts.append(path.read_text(encoding="utf-8"))
    for system_id in systems:
        sys_path = ENGINE_DIR / "systems" / f"{system_id}.lua"
        if sys_path.exists():
            parts.append(sys_path.read_text(encoding="utf-8"))
    return "\n\n".join(parts)
```

Modify `GameFiles` to include `engine_source: str`.
Modify `Executor` to receive engine_source + game logic concatenated:
```python
# In executor.py:
full_source = engine_source + "\n\n" + game_logic_source
```

> ⚠️ RULE: `load_engine_source` reads systems from `systems.yaml`
> (already parsed in GameFiles). Only systems declared in systems.yaml are loaded.

### Step 6: Update systems.yaml

Add `engine_systems` key listing which engine/systems/ files to load:
```yaml
engine_systems:
  - genetics
  - odds
  - market
```

### Step 7: Update tests/fixtures/

- Sync `tests/fixtures/horse_racing/logic.lua` (game-specific only, no extracted functions)
- Create `tests/fixtures/engine/` mirroring `engine/` structure
- Tests that call engine functions (genetics, odds, market) now load via the updated executor

### Step 8: Run floors

```bash
uv run pytest -v        # must be 32/0/0
cd ts && npx vitest run  # must be 17/0/0 (TypeScript unchanged)
cd ts && npx vite build  # must exit 0
```

> ⛔ STOP after 2f.1. Do not start 2f.2 until all three pass.

---

## §2 Sub-Phase 2f.2 — CSS Split

**Goal:** Split `ts/src/index.css` into three files per ADR-008.
No style changes — same visual result, different file structure.
Build must be clean after this sub-phase.

### Files to create

**ts/src/ui/tokens.css** — CSS custom properties only
Extract all `:root { --* }` declarations from `index.css`. Nothing else.

**ts/src/ui/base.css** — Reset + typography
Extract: `*, *::before, *::after { box-sizing: border-box; }`, `body {}`,
`h1, h2, h3 {}`, `button {}`, `input[type="number"] {}`, `#root {}`.
These use `var(--*)` token references.

**ts/src/games/horse_racing/styles.css** — All remaining classes
Every class name currently in `index.css` that is not a token or base style.
`.app-header`, `.tab-bar`, `.horse-card`, `.race-panel`, `.bet-panel`,
`.race-track-fullscreen`, etc. — all move here.

### Update imports

In `ts/src/main.tsx` (or wherever `index.css` is imported):
```typescript
import './ui/tokens.css';
import './ui/base.css';
import './games/horse_racing/styles.css';  // temporary — moves in 2f.4
```

Keep `index.css` as a redirect file during transition:
```css
/* index.css — DO NOT ADD STYLES HERE
   This file will be deleted in Phase 2f.4.
   Import from ui/tokens.css, ui/base.css, or games/{id}/styles.css */
@import './ui/tokens.css';
@import './ui/base.css';
@import './games/horse_racing/styles.css';
```

### Verify

```bash
cd ts && npx vite build   # must exit 0
```

Open in browser. Visual appearance must be identical to pre-migration.
No style changes are permitted in this sub-phase.

> ⛔ STOP after 2f.2. Verify visually before continuing.

---

## §3 Sub-Phase 2f.3 — Base Component Library

**Goal:** Create `ts/src/ui/components/` with 9 base components from ADR-008.
Replace inline equivalents in horse_racing components with imports.
TS floor must hold: 17/0/0.

### Create components (in this order — each builds on the previous)

1. `ts/src/ui/components/Button.tsx` — variant-aware button
2. `ts/src/ui/components/Panel.tsx` — surface container
3. `ts/src/ui/components/Badge.tsx` — small colored tag
4. `ts/src/ui/components/StatBar.tsx` — labeled progress bar
5. `ts/src/ui/components/EmptyState.tsx` — placeholder text
6. `ts/src/ui/components/ErrorBox.tsx` — error display
7. `ts/src/ui/components/Card.tsx` — bordered surface card
8. `ts/src/ui/components/TabBar.tsx` — tab navigation
9. `ts/src/ui/components/Modal.tsx` — overlay panel

Use exact prop interfaces from ADR-008 §10.3.

Create `ts/src/ui/components/index.ts` re-exporting all nine:
```typescript
export { Button } from './Button';
export { Panel } from './Panel';
export { Badge } from './Badge';
export { StatBar } from './StatBar';
export { EmptyState } from './EmptyState';
export { ErrorBox } from './ErrorBox';
export { Card } from './Card';
export { TabBar } from './TabBar';
export { Modal } from './Modal';
```

### Replace inline equivalents

In horse_racing components, replace hand-rolled equivalents with base component
imports. Examples:
- `.btn-primary` buttons → `<Button variant="primary" />`
- `.empty-state` divs → `<EmptyState message="..." />`
- `.error-box` divs → `<ErrorBox message="..." />`
- `.badge-player` spans → `<Badge label="You" variant="accent" />`
- Stat bar renders → `<StatBar label="..." value={...} />`

> ⚠️ RULE: Do NOT replace every instance. Replace only instances where the
> base component covers the use case without adding props. Complex horse-racing-
> specific renders (SVGRacer inside a card) stay as custom JSX.

> ⚠️ RULE: Do NOT change any game logic or handler behavior. CSS class name
> changes are acceptable as long as visual output is identical.

### Verify

```bash
cd ts && npx vitest run   # must be 17/0/0 (update import paths in mocks if needed)
cd ts && npx vite build   # must exit 0
```

> ⛔ STOP after 2f.3. Verify.

---

## §4 Sub-Phase 2f.4 — Game Directory Move

**Goal:** Move horse_racing-specific files to `ts/src/games/horse_racing/`.
Update all import paths. TS floor must hold: 17/0/0.

### Files to move

```
ts/src/App.tsx                   → ts/src/games/horse_racing/App.tsx
ts/src/components/BettingTab.tsx → ts/src/games/horse_racing/components/BettingTab.tsx
ts/src/components/BreederTab.tsx → ts/src/games/horse_racing/components/BreederTab.tsx
ts/src/components/RaceTrack.tsx  → ts/src/games/horse_racing/components/RaceTrack.tsx
ts/src/components/StableTab.tsx  → ts/src/games/horse_racing/components/StableTab.tsx
ts/src/components/SVGRacer.tsx   → ts/src/games/horse_racing/components/SVGRacer.tsx
```

**Do not delete the originals until all imports are updated and build passes.**

### Update import paths

In all moved files, update relative imports:
- `../../engine/` → `../../../engine/` (one level deeper)
- `../../ui/components` → `../../../ui/components`
- `./SVGRacer` → same directory, unchanged
- `./StableTab` → same directory, unchanged

In `ts/src/main.tsx`, update App import:
```typescript
import HorseRacingApp from './games/horse_racing/App';
```

Delete old `ts/src/components/` directory after all imports verified.
Delete old `ts/src/App.tsx` after new location confirmed working.

### Update test paths

TS tests in `ts/tests/` that import from `../src/engine/` are unaffected.
Tests that mock game components need updated paths if any exist.

### Verify

```bash
cd ts && npx vitest run   # must be 17/0/0
cd ts && npx vite build   # must exit 0
```

Open browser. Game must load and play identically to pre-migration.

> ⛔ STOP after 2f.4. Verify.

---

## §5 Sub-Phase 2f.5 — Game Router

**Goal:** `ts/src/main.tsx` becomes a game router stub.
For now, it routes directly to horse_racing (single game). Snake slot is
declared but unimplemented. Build must be clean.

```typescript
// ts/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './ui/tokens.css';
import './ui/base.css';

// Game registry — add new games here
const GAMES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  horse_racing: React.lazy(() => import('./games/horse_racing/App')),
  // snake: React.lazy(() => import('./games/snake/App')),  // Phase 4
};

const GAME_ID = (new URLSearchParams(window.location.search).get('game'))
  ?? 'horse_racing';

const GameApp = GAMES[GAME_ID] ?? GAMES['horse_racing'];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.Suspense fallback={<div style={{ padding: '2rem', color: '#888' }}>Loading…</div>}>
    <GameApp />
  </React.Suspense>
);
```

### Verify

```bash
cd ts && npx vitest run   # must be 17/0/0
cd ts && npx vite build   # must exit 0
```

Browser: `http://localhost:5173/` loads horse_racing (default).
Browser: `http://localhost:5173/?game=horse_racing` loads horse_racing explicitly.

---

## §6 Final Verification

After all five sub-phases complete:

```bash
uv run pytest -v         # 32/0/0 (Python)
cd ts && npx vitest run  # 17/0/0 (TypeScript)
cd ts && npx vite build  # exits 0
```

**Directory verification:**
```bash
ls engine/primitives/    # 7 .lua files
ls engine/systems/       # genetics.lua, odds.lua, market.lua
ls ts/src/ui/            # tokens.css, base.css, components/
ls ts/src/games/         # horse_racing/
ls ts/src/games/horse_racing/  # App.tsx, styles.css, components/
```

**Deleted files (must not exist):**
```bash
ls ts/src/App.tsx        # must not exist
ls ts/src/components/    # must not exist
ls ts/src/index.css      # may exist as redirect shim — NOT as original
```

Update `docs/state/current.md` to Phase 2f certified.

---

## §7 Quick Reference

| Sub-phase | Goal | Key verification |
|---|---|---|
| 2f.1 | Engine Lua + runtime update | Python 32/0/0 |
| 2f.2 | CSS split | Build clean, visual identical |
| 2f.3 | Base component library | TS 17/0/0 |
| 2f.4 | Game directory move | TS 17/0/0, game plays |
| 2f.5 | Router | Build clean, URL routing works |

| Item | Value |
|---|---|
| Python floor throughout | 32 / 0 / 0 |
| TypeScript floor throughout | 17 / 0 / 0 |
| New Lua functions | Only in `engine/primitives/entity.lua` (generate_id, copy_entity, validate_entity) |
| Modified Python files | `studio/loader.py` (authorized), `studio/executor.py` (minimal) |
| New systems.yaml key | `engine_systems: [genetics, odds, market]` |
| No new features | This phase is pure migration |
| Proof of completion | Directory listings above + both floor outputs |

---

*RFDGameStudio Phase 2f | June 2026 | RFD IT Services Ltd.*
*Docs were one phase ahead of code. This phase closes the gap.*
*After 2f: Snake builds on engine primitives. Nothing rebuilds from scratch.*
