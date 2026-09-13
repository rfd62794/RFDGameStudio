# RFDGameStudio — Phase 2g Directive: Component Sweep + Slither Rogue Port

*June 2026 | Read fully before executing anything.*
*Two parts. Complete Part A first. Verify floors. Then Part B.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 32 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 17 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## Part A — Horse Racing Base Component Sweep

**Goal:** Replace all inline button, panel, card, stat bar, and tab bar equivalents
in horse_racing components with imports from `ts/src/ui/components/`.

**Files to modify:**
- `ts/src/games/horse_racing/App.tsx`
- `ts/src/games/horse_racing/components/StableTab.tsx`
- `ts/src/games/horse_racing/components/BettingTab.tsx`
- `ts/src/games/horse_racing/components/BreederTab.tsx`

**Scope rule (from ADR-008):**
Replace instances where the base component covers the use case without extra props.
Do NOT replace if the button/panel has inline style overrides that don't fit cleanly.
Complex game-specific layouts (race track SVG, betting table) stay as custom JSX.

### A.1 Button replacements

Current inline pattern:
```tsx
<button className="btn-primary" onClick={handler}>Label</button>
<button className="btn-secondary" disabled={cond} onClick={handler}>Label</button>
<button className="btn-neutral" onClick={handler}>Label</button>
<button className="btn-danger" onClick={handler}>Label</button>
```

Replacement:
```tsx
import { Button } from '../../../ui/components';
<Button label="Label" onClick={handler} variant="primary" />
<Button label="Label" onClick={handler} variant="secondary" disabled={cond} />
<Button label="Label" onClick={handler} variant="neutral" />
<Button label="Label" onClick={handler} variant="danger" />
```

Apply to: all simple buttons in App.tsx, StableTab, BettingTab, BreederTab.
**Skip** buttons that have children other than a plain string label (icon buttons,
buttons with `style={}` props, buttons inside SVG context).

### A.2 Panel replacements

Current:
```tsx
<div className="race-info"> ... </div>
<div className="bet-panel"> ... </div>
<div className="race-result-banner"> ... </div>
```

Replacement:
```tsx
import { Panel } from '../../../ui/components';
<Panel> ... </Panel>
<Panel className="bet-panel"> ... </Panel>
```

Game-specific class names can still be passed as `className` prop to `Panel` for
additional CSS overrides.

### A.3 Card replacements

Current:
```tsx
<div className="horse-card"> ... </div>
<div className="history-card"> ... </div>
```

Replacement:
```tsx
import { Card } from '../../../ui/components';
<Card> ... </Card>
<Card className="history-card"> ... </Card>
```

### A.4 StatBar replacements

Current in StableTab:
```tsx
<div className="stat-row">
  <span>{label}</span>
  <span>{val}</span>
  <div className="stat-bar-wrap">
    <div className="stat-bar-bg">
      <div className="stat-bar-fill" style={{ width: `${val}%` }} />
    </div>
  </div>
</div>
```

Replacement:
```tsx
import { StatBar } from '../../../ui/components';
<StatBar label={String(key)} value={val} />
```

### A.5 TabBar replacement

Current in App.tsx:
```tsx
<div className="header-tabs">
  {tabs.map(t => (
    <button className={`header-tab-btn${active ? ' active' : ''}`}
      onClick={() => setActiveTab(t['id'])}>
      {t['label']}
    </button>
  ))}
</div>
```

Replacement:
```tsx
import { TabBar } from '../../../ui/components';
<TabBar
  tabs={tabs.map(t => ({ id: t['id'] as string, label: t['label'] as string }))}
  active={activeTab}
  onSelect={setActiveTab}
/>
```

### A.6 Verify Part A floors

```bash
uv run pytest -v         # must be 32/0/0
cd ts && npx vitest run  # must be 17/0/0
cd ts && npx vite build  # must exit 0
```

Open browser. Game must look and function identically to pre-sweep.

> ⛔ STOP after Part A. Do not start Part B until all three pass.

---

## Part B — Slither Rogue Port

### B.0 Architecture Decision: What Goes Where

**Architectural constraint:** Slither Rogue's physics loop runs at 60fps via
`requestAnimationFrame`. Calling Lua functions at 60fps through the bridge would
be a performance catastrophe. The physics loop, collision detection, and rendering
**stay in TypeScript.**

**What Lua owns:**
- Evolution card definitions (data.yaml)
- Evolution effect calculations (discrete, called on card selection)
- NPC AI decisions (called every 400-800ms, not every frame)
- Fruit spawn parameters (called on game init and respawn)
- NPC spawn parameters (called on game init)
- Score grading (called once at game end)
- Evolution trigger check (called on each fruit eaten)

**What TypeScript owns:**
- `updatePhysics()` — continuous snake movement, segment following, regen ticks
- `checkCollisions()` — fruit eating, segment stealing, venom application
- `drawGame()` — canvas rendering, camera, all visual effects
- `requestAnimationFrame` game loop
- localStorage persistence (high scores)

This means Lua is consulted for **discrete events** (init, respawn, evolve, grade)
but never for per-frame updates. Same pattern as horse_racing: Lua resolves,
TypeScript renders.

---

### B.1 Source Reference

```
examples/slither-rogue_-evolution/src/
  App.tsx                    — game state, evolution logic, screen routing
  types.ts                   — Point, Segment, Snake, Fruit, EvolutionCard, HighScore
  components/
    GameCanvas.tsx            — physics loop, collision, canvas rendering (~700 lines)
    GameHUD.tsx               — in-game stats display
    EvolutionModal.tsx        — card selection overlay
    GameOverModal.tsx         — end screen with grade + high score
    MainMenu.tsx              — start screen with config
  index.css                  — Tailwind CSS (not relevant, we use base components)
```

---

### B.2 Extraction Matrix

| Source | Content | Destination |
|---|---|---|
| `types.ts: EvolutionCard` | Card schema | `data.yaml: entity schemas + evolution_cards[]` |
| `types.ts: HighScore` | Score schema | `data.yaml: entity schemas` |
| `types.ts: Snake, Fruit, Segment, Point` | Entity schemas | `data.yaml: entity schemas` |
| `App.tsx: ALL_CARDS[]` | 8 evolution card definitions | `data.yaml: evolution_cards[]` |
| `GameCanvas.tsx: MAP_WIDTH/HEIGHT` | Arena dimensions | `data.yaml: arena` |
| `GameCanvas.tsx: NUM_FRUITS, NUM_NPCS` | Spawn counts | `data.yaml: arena` |
| `GameCanvas.tsx: npcColors[]` | NPC color profiles | `data.yaml: npc_profiles[]` |
| `GameCanvas.tsx: fruit color array, golden chance` | Fruit config | `data.yaml: fruit` |
| `MainMenu.tsx: COLOR_PRESETS[]` | Player color presets | `data.yaml: player_presets[]` |
| `MainMenu.tsx: gameDuration options` | Run duration options | `data.yaml: run_durations[]` |
| `App.tsx: speedMultiplier = 1 + speed * 0.15` etc. | Evolution effect formulas | `logic.lua: calculate_evolution_effects()` |
| `App.tsx: fruitsEatenSinceEvolution >= 3` | Evolution trigger | `logic.lua: check_evolution_trigger()` |
| `App.tsx: shuffle + slice 3 cards` | Card pool selection | `logic.lua: select_evolution_pool()` |
| `GameCanvas.tsx: spawnFruit()` | Fruit spawn logic | `logic.lua: spawn_fruit()` |
| `GameCanvas.tsx: NPC init (pos, angle, size, len)` | NPC generation | `logic.lua: generate_npc()` |
| `GameCanvas.tsx: NPC AI (fruit hunt, wall avoid, wander)` | NPC AI decisions | `logic.lua: decide_npc_action()` |
| `GameOverModal.tsx: getGrade()` | Score grading | `logic.lua: calculate_grade()` |
| `GameCanvas.tsx: updatePhysics()` | Physics (60fps) | TypeScript ONLY |
| `GameCanvas.tsx: checkCollisions()` | Collision (60fps) | TypeScript ONLY |
| `GameCanvas.tsx: drawGame()` | Canvas rendering | TypeScript ONLY |
| `GameOverModal.tsx: localStorage` | High score persistence | TypeScript ONLY |

---

### B.3 Create games/slither_rogue/data.yaml

```yaml
game:
  id: slither_rogue
  name: Snake Roguelike
  version: "1.0"
  studio: RFDGameStudio

arena:
  map_width: 2600
  map_height: 2600
  num_fruits: 45
  num_npcs: 12
  grid_size: 100         # visual grid line spacing
  wall_buffer: 120       # NPC wall avoidance distance

fruit:
  golden_chance: 0.08    # 8% chance to spawn golden fruit
  golden_points: 3
  standard_points: 1
  colors:
    - "#ef4444"
    - "#10b981"
    - "#3b82f6"
    - "#ec4899"
    - "#f43f5e"
  golden_color: "#fbbf24"

evolution:
  fruits_per_level: 3    # fruits eaten before evolution choice triggers
  cards_offered: 3       # number of cards shown per evolution

npc_profiles:
  - name: Gorgon
    color: "#ef4444"
    head_color: "#f87171"
  - name: Naga
    color: "#f97316"
    head_color: "#fb923c"
  - name: Adder
    color: "#eab308"
    head_color: "#facc15"
  - name: Sidewinder
    color: "#a855f7"
    head_color: "#c084fc"
  - name: Basilisk
    color: "#ec4899"
    head_color: "#f472b6"
  - name: Python
    color: "#3b82f6"
    head_color: "#60a5fa"
  - name: Anaconda
    color: "#06b6d4"
    head_color: "#22d3ee"

npc_stats:
  min_radius: 10
  max_radius: 13
  min_speed: 110
  max_speed: 140
  min_initial_length: 4
  max_initial_length: 9

player_stats:
  initial_radius: 11
  initial_speed: 160
  initial_length: 5
  turn_speed: 5.2        # radians/sec

player_presets:
  - name: Electric Teal
    color: "#14b8a6"
    head_color: "#06b6d4"
  - name: Toxic Lime
    color: "#84cc16"
    head_color: "#a3e635"
  - name: Cyber Purple
    color: "#a855f7"
    head_color: "#c084fc"
  - name: Amber Fury
    color: "#f59e0b"
    head_color: "#fbbf24"
  - name: Rose Phantom
    color: "#f43f5e"
    head_color: "#f472b6"

run_durations:
  - label: "2 Mins"
    seconds: 120
    sub: Quickie
  - label: "5 Mins"
    seconds: 300
    sub: Standard
  - label: Endless
    seconds: 999999
    sub: Chill / Practice

evolution_cards:
  - id: speed
    title: Nitrous Slither
    description: "Permanent +15% boost to snake base speed."
    icon: speed
    rarity: common
    effect_key: speed_multiplier
    effect_per_level: 0.15

  - id: magnet
    title: Magnetic Glide
    description: "Nearby fruits pulled towards your head (+60px pull radius)."
    icon: magnet
    rarity: common
    effect_key: magnetism_radius
    effect_per_level: 60

  - id: shield
    title: Reinforced Joints
    description: "Grants +1 Node Armor shield charge to block a segment theft."
    icon: shield
    rarity: rare
    effect_key: shield_charges
    effect_per_level: 1

  - id: wide
    title: Thick Scales
    description: "Increases segment radius by +3px."
    icon: wide
    rarity: common
    effect_key: wide_body_add
    effect_per_level: 3

  - id: sense
    title: Fruity Radar
    description: "Draws indicators pointing to off-screen fruits (+200px range)."
    icon: sense
    rarity: common
    effect_key: fruit_sense_range
    effect_per_level: 200

  - id: ghost
    title: Spectral End
    description: "Protects last +1 segment from being stolen."
    icon: ghost
    rarity: epic
    effect_key: ghost_tail_count
    effect_per_level: 1

  - id: regen
    title: Chrono Growth
    description: "Automatically spawns a new tail segment every few seconds."
    icon: regen
    rarity: rare
    effect_key: tail_growth_level
    effect_per_level: 1

  - id: venom
    title: Acidic Sprayer
    description: "Emits slow-inducing acid drops from tail."
    icon: venom
    rarity: epic
    effect_key: venom_trail_level
    effect_per_level: 1

grade_thresholds:
  - min_score: 100
    title: Apex Leviathan
    description: "A creature of legend. The entire world trembled in your slither."
  - min_score: 60
    title: Ancient Serpent
    description: "Highly evolved. Your DNA holds wisdom of a hundred mutations."
  - min_score: 30
    title: Venomous Viper
    description: "A formidable hunter. Quick, clever, and genetically advanced."
  - min_score: 15
    title: Nimble Adder
    description: "Decent adaptability. You managed to hold your ground."
  - min_score: 0
    title: Newborn Hatchling
    description: "Survival is tough. Gather more mutations next time to grow strong!"
```

---

### B.4 Create games/slither_rogue/logic.lua

```lua
-- Slither Rogue — Game-Specific Logic
-- Engine systems loaded by runtime: (none — physics is TypeScript for this game)
-- All functions here are discrete-event logic, not frame-by-frame physics.

-- ============================================================
-- EVOLUTION SYSTEM
-- ============================================================

-- Calculate all active evolution effect values from an activeEvolutions table.
-- activeEvolutions: { speed=N, magnet=N, shield=N, wide=N, sense=N, ghost=N, regen=N, venom=N }
-- Returns: { speed_multiplier, magnetism_radius, shield_charges, wide_body_add,
--            fruit_sense_range, ghost_tail_count, tail_growth_level, venom_trail_level }
function calculate_evolution_effects(active, cards_config)
  local effects = {
    speed_multiplier = 1.0,
    magnetism_radius = 0,
    shield_charges   = 0,
    wide_body_add    = 0,
    fruit_sense_range = 0,
    ghost_tail_count = 0,
    tail_growth_level = 0,
    venom_trail_level = 0,
  }

  for _, card in ipairs(cards_config) do
    local level = active[card.id] or 0
    if level > 0 then
      local key = card.effect_key
      local per_level = card.effect_per_level
      if key == "speed_multiplier" then
        effects.speed_multiplier = effects.speed_multiplier + (level * per_level)
      elseif key == "magnetism_radius" then
        effects.magnetism_radius = level * per_level
      elseif key == "shield_charges" then
        effects.shield_charges = level * per_level
      elseif key == "wide_body_add" then
        effects.wide_body_add = level * per_level
      elseif key == "fruit_sense_range" then
        effects.fruit_sense_range = level * per_level
      elseif key == "ghost_tail_count" then
        effects.ghost_tail_count = level * per_level
      elseif key == "tail_growth_level" then
        effects.tail_growth_level = level * per_level
      elseif key == "venom_trail_level" then
        effects.venom_trail_level = level * per_level
      end
    end
  end

  return effects
end

-- Check whether eating a fruit triggers an evolution choice.
-- fruits_eaten_since_evolution: running counter since last evolution
-- threshold: from data.yaml evolution.fruits_per_level
-- Returns: true if evolution should trigger, false otherwise
function check_evolution_trigger(fruits_eaten_since_evolution, threshold)
  return fruits_eaten_since_evolution + 1 >= threshold
end

-- Select N random evolution cards from the full card pool.
-- all_cards: array of card tables from data.yaml evolution_cards
-- count: number of cards to select (typically 3)
-- Returns: array of selected card tables (shuffled slice)
function select_evolution_pool(all_cards, count)
  local pool = {}
  for _, card in ipairs(all_cards) do
    table.insert(pool, card)
  end
  -- Fisher-Yates shuffle
  for i = #pool, 2, -1 do
    local j = math.random(1, i)
    pool[i], pool[j] = pool[j], pool[i]
  end
  local selected = {}
  for i = 1, math.min(count, #pool) do
    table.insert(selected, pool[i])
  end
  return selected
end

-- ============================================================
-- SPAWN SYSTEM
-- ============================================================

-- Generate a fruit spawn configuration.
-- fruit_config: from data.yaml fruit block
-- arena: from data.yaml arena block
-- Returns: { x, y, color, points, is_golden }
function spawn_fruit(fruit_config, arena)
  local is_golden = math.random() < (fruit_config.golden_chance or 0.08)
  local color
  if is_golden then
    color = fruit_config.golden_color or "#fbbf24"
  else
    local colors = fruit_config.colors
    color = colors[math.random(#colors)]
  end
  return {
    x         = math.random() * (arena.map_width - 120) + 60,
    y         = math.random() * (arena.map_height - 120) + 60,
    color     = color,
    points    = is_golden and (fruit_config.golden_points or 3) or (fruit_config.standard_points or 1),
    is_golden = is_golden,
  }
end

-- Generate an NPC snake configuration.
-- npc_profiles: array from data.yaml npc_profiles
-- npc_stats: from data.yaml npc_stats
-- arena: from data.yaml arena
-- index: NPC index (0-based, for profile cycling)
-- Returns: NPC init table { name, color, head_color, x, y, angle, speed, radius, initial_length }
function generate_npc(npc_profiles, npc_stats, arena, index)
  local profile = npc_profiles[(index % #npc_profiles) + 1]
  local radius  = npc_stats.min_radius + math.random() * (npc_stats.max_radius - npc_stats.min_radius)
  local speed   = npc_stats.min_speed  + math.random() * (npc_stats.max_speed  - npc_stats.min_speed)
  local length  = npc_stats.min_initial_length +
                  math.floor(math.random() * (npc_stats.max_initial_length - npc_stats.min_initial_length))
  return {
    name           = profile.name .. " " .. tostring(index + 1),
    color          = profile.color,
    head_color     = profile.head_color,
    x              = math.random() * (arena.map_width  - 200) + 100,
    y              = math.random() * (arena.map_height - 200) + 100,
    angle          = math.random() * math.pi * 2,
    speed          = speed,
    radius         = radius,
    initial_length = length,
  }
end

-- ============================================================
-- NPC AI
-- ============================================================

-- Decide an NPC's next target angle based on nearby fruits and wall proximity.
-- npc_head: { x, y }
-- npc_angle: current angle in radians
-- nearby_fruits: array of { x, y } within sight range (filtered by TypeScript)
-- arena: data.yaml arena block
-- Returns: target_angle (radians), wander_delta (if no fruit found)
function decide_npc_action(npc_head, npc_angle, nearby_fruits, arena)
  local wall_buffer = arena.wall_buffer or 120

  -- Wall avoidance takes priority
  if npc_head.x < wall_buffer then
    return 0  -- steer right
  elseif npc_head.x > arena.map_width - wall_buffer then
    return math.pi  -- steer left
  elseif npc_head.y < wall_buffer then
    return math.pi / 2  -- steer down
  elseif npc_head.y > arena.map_height - wall_buffer then
    return -math.pi / 2  -- steer up
  end

  -- Hunt nearest fruit
  if nearby_fruits and #nearby_fruits > 0 then
    local nearest = nearby_fruits[1]
    local min_dist = math.huge
    for _, fruit in ipairs(nearby_fruits) do
      local dx = fruit.x - npc_head.x
      local dy = fruit.y - npc_head.y
      local d = math.sqrt(dx * dx + dy * dy)
      if d < min_dist then
        min_dist = d
        nearest = fruit
      end
    end
    return math.atan2(nearest.y - npc_head.y, nearest.x - npc_head.x)
  end

  -- Wander
  return npc_angle + (math.random() * 1.2 - 0.6)
end

-- ============================================================
-- SCORING
-- ============================================================

-- Calculate a performance grade from the player's final score.
-- score: fruits eaten total
-- grade_thresholds: from data.yaml grade_thresholds (sorted desc by min_score)
-- Returns: { title, description }
function calculate_grade(score, grade_thresholds)
  for _, threshold in ipairs(grade_thresholds) do
    if score >= threshold.min_score then
      return { title = threshold.title, description = threshold.description }
    end
  end
  -- Fallback
  local last = grade_thresholds[#grade_thresholds]
  return { title = last.title, description = last.description }
end
```

---

### B.5 Create games/slither_rogue/systems.yaml

```yaml
engine_version: "1.0"
engine_systems: []   # No shared engine systems — physics is TypeScript for this game

systems:
  - id: evolution
    description: "Card selection, effect calculation, trigger logic"
    components: [evolution_card, effect_key, effect_per_level, active_evolutions]
    functions:
      - calculate_evolution_effects
      - check_evolution_trigger
      - select_evolution_pool

  - id: spawn
    description: "Fruit and NPC initialization"
    components: [fruit, npc, position, color, speed, radius]
    functions:
      - spawn_fruit
      - generate_npc

  - id: npc_ai
    description: "NPC decision-making (called every 400-800ms, not per frame)"
    components: [position, angle, speed, target_angle]
    functions:
      - decide_npc_action

  - id: scoring
    description: "Grade calculation and score evaluation"
    components: [score, grade]
    functions:
      - calculate_grade

entities:
  snake:
    description: "Player or NPC snake with segments and evolution state"
    systems: [spawn, npc_ai]

  fruit:
    description: "Collectible item on the arena map"
    systems: [spawn]

  evolution_card:
    description: "Single evolution card definition with effect"
    systems: [evolution]
```

---

### B.6 Create games/slither_rogue/ui.yaml

```yaml
layout:
  tabs: []   # No tabs — Slither Rogue uses screen-based routing (menu/game/gameover)

screens:
  - id: menu
    title: Main Menu
    components:
      - type: panel
        id: config_panel
      - type: panel
        id: scores_panel
      - type: action_button
        id: start_btn
        label: Launch Run

  - id: game
    title: Arena
    components:
      - type: panel
        id: hud
      - type: canvas
        id: game_canvas    # custom type — TypeScript canvas renderer
      - type: modal
        id: evolution_modal
        trigger: on_evolution

  - id: gameover
    title: Game Over
    components:
      - type: modal
        id: gameover_modal
```

---

### B.7 TypeScript Renderer

Create `ts/src/games/slither_rogue/` with the following structure:

```
ts/src/games/slither_rogue/
  App.tsx               — screen router (menu/game/gameover), evolution state
  styles.css            — slither rogue specific styles (dark arena theme)
  components/
    GameCanvas.tsx      — requestAnimationFrame loop, physics, collision, canvas
    GameHUD.tsx         — in-game stats (use Badge, Panel from base components)
    EvolutionModal.tsx  — card selection (use Modal, Card from base components)
    GameOverModal.tsx   — end screen (use Modal, Card from base components)
    MainMenu.tsx        — start screen (use Panel, Button, Card from base components)
```

**Port strategy — copy example, then adapt:**

1. Copy all 5 component files from `examples/slither-rogue_-evolution/src/` verbatim
2. Update imports: `motion/react` → `framer-motion`, remove Tailwind classes
3. Replace Tailwind className patterns with base component imports + CSS classes
4. Update `App.tsx` to call Lua for discrete events (see §B.8 below)
5. Add `styles.css` with CSS equivalents for the key Tailwind patterns used

**Tailwind → base component mapping:**

| Tailwind pattern | Replacement |
|---|---|
| `<button className="...emerald...">` | `<Button variant="primary" />` |
| `<div className="...bg-slate-900 border border-slate-800 rounded-3xl...">` | `<Panel>` or `<Card>` |
| `<div className="...text-slate-500 italic...">` | `<EmptyState>` |
| Custom badge `<div className="...border...rounded-full...">` | `<Badge>` |

**Keep as custom JSX:**
- GameCanvas canvas element and all rendering code — no base component equivalent
- EvolutionModal card grid with hover animations (motion.button) — keep custom
- All inline styles that drive canvas dimensions or layout

---

### B.8 App.tsx — Lua Integration Points

The slither_rogue App.tsx calls Lua for discrete events only.

```typescript
// On game start — spawn all fruits and NPCs
const fruits = [];
const data = session.files.data as Record<string, unknown>;
for (let i = 0; i < numFruits; i++) {
  const f = call(session, 'spawn_fruit', data['fruit'], data['arena']) as Record<string, unknown>;
  fruits.push(f);
}

const npcs = [];
for (let i = 0; i < numNpcs; i++) {
  const npc = call(session, 'generate_npc',
    data['npc_profiles'], data['npc_stats'], data['arena'], i
  ) as Record<string, unknown>;
  npcs.push(npc);
}

// On fruit eaten — check evolution trigger
const shouldEvolve = call(session, 'check_evolution_trigger',
  fruitsEatenSinceEvolution, evolutionConfig.fruits_per_level
) as boolean;

// On evolution triggered — select card pool
const pool = call(session, 'select_evolution_pool',
  data['evolution_cards'], evolutionConfig.cards_offered
) as Array<Record<string, unknown>>;

// On card selected — recalculate effects
const effects = call(session, 'calculate_evolution_effects',
  activeEvolutions, data['evolution_cards']
) as Record<string, unknown>;

// On NPC AI tick (every 400-800ms, NOT every frame)
const targetAngle = call(session, 'decide_npc_action',
  npc.head, npc.angle, nearbyFruits, data['arena']
) as number;

// On game over — calculate grade
const grade = call(session, 'calculate_grade',
  finalScore, data['grade_thresholds']
) as Record<string, string>;
```

> ⚠️ RULE: `decide_npc_action` is called on the NPC AI decision timer
> (every 400-800ms). It is NEVER called inside the requestAnimationFrame loop.
> TypeScript handles continuous NPC movement between Lua decisions.

---

### B.9 Wire to game router

Update `ts/src/main.tsx`:

```typescript
const GAMES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  horse_racing: React.lazy(() => import('./games/horse_racing/App')),
  slither_rogue: React.lazy(() => import('./games/slither_rogue/App')),
};
```

Browser: `http://localhost:5173/?game=slither_rogue` loads Slither Rogue.

---

### B.10 Python Tests

Add `tests/fixtures/slither_rogue/` mirroring `games/slither_rogue/`.
Add new tests to `tests/test_executor.py`:

Target: **32 → 38 passed**

| # | Test | Behavior |
|---|---|---|
| 33 | `test_slither_spawn_fruit_returns_position` | `spawn_fruit(fruit_cfg, arena)` returns dict with `x`, `y` |
| 34 | `test_slither_spawn_fruit_golden_chance` | 1000 calls, ~8% golden rate (within 3-13% tolerance) |
| 35 | `test_slither_generate_npc_returns_profile` | `generate_npc(profiles, stats, arena, 0)` returns dict with `name`, `color` |
| 36 | `test_slither_check_evolution_trigger` | `check_evolution_trigger(2, 3)` → false, `check_evolution_trigger(3, 3)` → true |
| 37 | `test_slither_select_evolution_pool` | `select_evolution_pool(cards, 3)` returns 3 distinct cards |
| 38 | `test_slither_calculate_grade` | Score 100 → "Apex Leviathan", Score 5 → "Newborn Hatchling" |

---

## §3 Final Completion Criteria

**Part A:**
- [ ] All simple buttons in horse_racing use `<Button>` base component
- [ ] Panels and cards use `<Panel>` and `<Card>` base components
- [ ] Stat bars in StableTab use `<StatBar>`
- [ ] Tab navigation uses `<TabBar>`
- [ ] Python 32/0/0 unchanged
- [ ] TypeScript 17/0/0 unchanged
- [ ] Build clean

**Part B:**
- [ ] `games/slither_rogue/` has all four files (data.yaml, logic.lua, ui.yaml, systems.yaml)
- [ ] `ts/src/games/slither_rogue/` has App.tsx + 5 components + styles.css
- [ ] `ts/src/main.tsx` routes `?game=slither_rogue` to Slither Rogue App
- [ ] Python `uv run pytest -v` → **38 passed, 0 failed, 0 skipped**
- [ ] TypeScript `npx vitest run` → **17 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `npx vite build` exits 0
- [ ] Browser `?game=horse_racing` — horse racing loads, plays correctly
- [ ] Browser `?game=slither_rogue` — snake game loads, plays correctly
- [ ] `docs/state/current.md` updated to Phase 2g certified

---

## §4 Quick Reference

| Item | Value |
|---|---|
| Python floor before | 32 / 0 / 0 |
| Python floor after | 38 / 0 / 0 |
| TypeScript floor | 17 / 0 / 0 (unchanged) |
| Snake game ID | `slither_rogue` |
| Snake URL | `?game=slither_rogue` |
| Physics in Lua | NO — 60fps physics stays TypeScript |
| Lua discrete events | spawn_fruit, generate_npc, decide_npc_action (timer), calculate_evolution_effects, calculate_grade |
| New fixture dir | `tests/fixtures/slither_rogue/` |
| Example source | `examples/slither-rogue_-evolution/src/` |

---

*RFDGameStudio Phase 2g | June 2026 | RFD IT Services Ltd.*
*Part A: Horse racing uses what it built. Part B: Snake proves the engine generalizes.*
*The physics loop stays TypeScript. Lua owns discrete decisions. Two different games, one studio.*
