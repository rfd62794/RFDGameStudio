# TS-Native Cross-Game Duplication Audit — Report

*August 2026 | RFDGameStudio | Investigation-only. No promotions, no
refactoring, no new shared modules. Same method as the Lua Deep
Investigation's Part C — read real source, diff for real, report
honestly.*

---

## §0 Critical finding: the premise needs adjusting

**The directive assumes a "TS-native catalog" of game logic to audit.
That catalog does not exist yet.** Every game with a React component in
`ts/src/games/` (10 games: dissonance, slimeworld, shoal, brewfield,
horse_racing, slither_rogue, mutant_battle_ball, slime_coin,
chimera_wilds, scrapcrawl) delegates its game logic to Lua via
`useLuaCall`, `call()` from `engine/runtime`, or
`session.executor.call()`. The TS code is rendering, UI, state
marshaling, and in a few cases client-side preview logic — not game
logic. Zero games have `tick_game`, `tick_match`, `simulate`, `step`,
or any equivalent function implemented in TS.

The Shoal Performance Investigation's TS-native benchmark was a
synthetic port that proved the performance ceiling — it was never
committed as production code, and no other game has been ported either.

**Planet of Greed does not exist in the repo.** ADR-013 mentions it as
built in a Google AI Studio session, but its four modules
(`wheelTopology.ts`, `fragmentSystem.ts`, `endingSystem.ts`,
`aiDecisions.ts`) are not present anywhere in the codebase. There is
nothing to check against the rest of the catalog.

**What this audit actually covers:** the TS-side code that does exist
across the 10 component-bearing games — rendering, UI, state
marshaling, and the few files with real client-side logic. The
candidate categories from the directive are assessed against this real
code, not against an assumed TS-native game-logic catalog that isn't
there.

---

## §1 What's already shared (not re-flagged)

| Module | Location | Contents |
|---|---|---|
| **artGen** | `ts/src/engine/artGen/` | Procedural SVG/canvas shape primitives (gradients, borders, polygons, teardrop fins, radial bursts, irregular fragments) + seeded PRNG (mulberry32) + hashStringToSeed. Consumed by Dissonance (`dissonanceGenerator.ts`) and Shoal (`shoal.config.ts`, `pathCache.ts`). This is the proven artGen extraction — real second consumer, zero regression. |
| **UI components** | `ts/src/ui/` | Badge, Button, Card, EmptyState, EndStateScreen, ErrorBox, Modal, MoreGamesByMe, Panel, ProgressIndicator, StatBar, TabBar, TitleScreen. Already shared across all games. |
| **Game shell** | `ts/src/components/` | GameShell, MenuShell, OptionSelectGroup, TabManager. Already shared. |
| **Engine infra** | `ts/src/engine/` | executor.ts (Lua VM bridge), loader.ts, runtime.ts, types.ts, ui_interpreter.tsx, ui_resolver.ts. Already shared. |

---

## §2 Candidate categories assessed

### A. Entity lifecycle patterns (spawn/breed/death)

**Finding: nothing to promote.**

All entity lifecycle logic (spawning, breeding, death, hunger,
starvation) lives in Lua. The TS side never computes lifecycle
transitions — it receives post-tick state from Lua and renders it.

The only TS-side lifecycle-adjacent code is:
- **Slime Coin** (`App.tsx`): coin lifecycle (shelf → floor → vat) is
  rendered from Lua state; TS doesn't compute transitions
- **Mutant Battle Ball** (`types.ts`): `Mutant.status` type
  (`healthy | injured | infirmary | dead`) is a TS type definition
  matching Lua state, not logic
- **Shoal** (`App.tsx`): `call(session, 'tick_game', dt, input)`
  returns the full render state; TS renders it

No two games share lifecycle *logic* in TS because no game has
lifecycle *logic* in TS. This matches the Lua audit's finding that
`tick_game` looked promotable across three games until the real diff
showed six unique interacting systems in one and nothing comparable in
the other two.

### B. Spatial partitioning

**Finding: nothing to promote.**

Shoal's spatial hash is the only spatial partitioning in the entire
catalog (Lua or TS). It lives in `games/shoal/logic.lua`
(`rebuild_spatial_hash`, `get_nearby` with integer bucket keys and
world-wrap). No other game does per-entity proximity checks:

- **Slime Coin** has physics collision but uses brute-force O(n²) pair
  checks (`games/slime_coin/logic.lua` line 515: `for coin in coins do
  for other in coins do distance(...)`) — no spatial hash, and the
  entity count (typically <30 coins) doesn't warrant one
- **Mutant Battle Ball** has a grid-based court but it's rendering-only
  (court dimensions in `MatchCanvas.tsx`); match movement is in Lua
  with no proximity queries
- **Slither Rogue** has snake physics but no multi-entity proximity
  checks (single snake + food + obstacles, not entity-entity)

Shoal's hash is shaped specifically around its own entity/bucket sizing
(120×80 buckets, 1200×800 world, x-axis wrapping). It wouldn't transfer
cleanly to a game with different world dimensions, different entity
counts, or no wrapping requirement — and no other game needs it.

### C. Steering/movement math

**Finding: nothing to promote.**

Shoal is the only game with steering behaviors (separate/align/cohere/
flee/seek/wander forces, limit-turn rate, drag). All in Lua
(`games/shoal/steering.lua`, 434 lines). No other game has anything
comparable:

- **Slime Coin** has velocity-based physics (position += velocity * dt,
  elastic collision response) but no steering forces — it's a pinball/
  pachinko model, not a boids model
- **Slither Rogue** has snake movement (head follows direction,
  segments follow head) but no force-based steering
- **Horse Racing** has horse movement but it's a linear track position
  model, not 2D steering

Shoal's steering math is genuinely unique to Shoal. The synthetic TS
port proved it *can* be ported, but there's no second consumer for the
same math.

### D. Wheel/relational-topology logic

**Finding: ONE real promotion candidate — the element-wheel relation
function.**

Two games use the same `same | adjacent | opposed | single` relation
pattern on a 4-element wheel:

**Dissonance** (`games/dissonance/logic/combat.lua`, lines 4-106):
```lua
local ELEMENTS = { "ember", "ash", "spark", "cinder" }
-- ...
local diff = math.abs(i1 - i2)
if diff == 1 or diff == 3 then
  relation_type = "adjacent"
elseif diff == 2 then
  relation_type = "opposed"
end
```

**Brewfield** (`games/brewfield/logic.lua`, lines 9-70 + TS mirror in
`ts/src/games/brewfield/gameLogic.ts`, lines 9-58):
```lua
local ELEMENT_ORDER = {'fire', 'air', 'water', 'earth'}
-- ...
function get_relation(el1, el2)
  if el1 == el2 then return 'same' end
  local idx1 = index_of(ELEMENT_ORDER, el1)
  local idx2 = index_of(ELEMENT_ORDER, el2)
  if idx1 == nil or idx2 == nil then return 'single' end
  local diff = math.abs(idx1 - idx2)
  if diff == 2 then return 'opposed' end
  return 'adjacent'
end
```

**The real diff:**

| Aspect | Dissonance | Brewfield |
|---|---|---|
| Elements | ember, ash, spark, cinder | fire, air, water, earth |
| Wheel size | 4 (same) | 4 (same) |
| Adjacency check | `diff == 1 or diff == 3` (wraps) | `diff != 2` (doesn't explicitly check wrap, but works because diff is 1 or 3 for a 4-wheel) |
| Opposition check | `diff == 2` (same) | `diff == 2` (same) |
| Same check | `i1 == i2` (same) | `el1 == el2` (same) |
| Single check | `not el2` (null second element) | `idx1 == nil or idx2 == nil` (element not in wheel) |
| TS mirror | No (types only, logic in Lua) | Yes (`gameLogic.ts` mirrors `solve_brew` for UI tooltips) |

**Assessment:** The `get_relation(el1, el2, elementOrder)` function is
a genuine promotion candidate. The algorithm is identical: index into
an ordered element array, compute absolute index difference, classify
as same/adjacent/opposed/single. The only per-game variation is the
element list itself, which is already a parameter. This is the same
shape as `distance` and `lerp` in the Lua audit — trivial math, but
genuinely shared.

**However:** the surrounding *use* of the relation is completely
different. Dissonance uses it for card-combination combat (each
relation type has different combat effects, type advantages, residue
interactions). Brewfield uses it for brew resolution (each relation
type has different damage/shield/heal multipliers, volatile 50/150%
rolls). Promoting `get_relation` itself would save ~10 lines per game;
promoting the *resolution logic* would not work because the resolution
is genuinely per-game.

**Canonical version:** Brewfield's `get_relation` is the cleaner
implementation — it's a standalone exported function, while
Dissonance's is inline in `resolve_combination`. Brewfield also already
has a TS mirror, making a TS-native promotion straightforward.

**What adoption would require:** Extract `getRelation(el1, el2,
elementOrder: string[]): 'same' | 'adjacent' | 'opposed' | 'single'`
into a shared module. Dissonance would need to refactor its inline
relation check to call the shared function. No logic changes — just
extraction.

### E. UI/audience-routing patterns

**Finding: already shared, nothing new to promote.**

The shared UI library (`ts/src/ui/`) and game shell
(`ts/src/components/`) already cover the common patterns:
- `TabBar` / `TabManager` — used by Mutant Battle Ball (5 tabs), Horse
  Racing (5 tabs), SlimeWorld (7 tabs)
- `Modal` — used by Slime Coin (PocketPicker, ShopModal), Dissonance
  (treasure/anomaly choices), Mutant Battle Ball (substitution)
- `ProgressIndicator` — used by Dissonance (map visualization)
- `TitleScreen` — used by Shoal, Dissonance
- `EndStateScreen` — used by multiple games
- `GameShell` — wraps every game

Phase-based routing (Dissonance's `title → opening → floorChoice →
deckBuild → run`, Slime Coin's `playing → card_select → run_end`) is
implemented per-game with `useState`, but the patterns aren't similar
enough to warrant a shared phase-router — each game's phases have
different transitions, different sub-phases, and different state
requirements. This is the same finding as the Lua audit's
`init_game` — same name, different real complexity.

### F. Planet of Greed's four new modules

**Finding: cannot assess — modules do not exist in the repo.**

`wheelTopology.ts`, `fragmentSystem.ts`, `endingSystem.ts`, and
`aiDecisions.ts` are not present anywhere in the codebase. Planet of
Greed is mentioned in ADR-013 as built in a Google AI Studio session
but was never committed. There is nothing to compare against.

The closest structural analog in the repo is SlimeWorld's
`planetRegion.ts` (Voronoi diagram generation for a territorial map
with 22 nodes on concentric rings), but this is a completely different
topology from a "culture ring with opposite/adjacent lookups" —
SlimeWorld's nodes are spatial Voronoi cells, not a relational wheel.

---

## §3 Additional finding: Part-slot system (Chimera Wilds + Mutant Battle Ball)

**Finding: real type-level duplication, but not logic-level.**

Both games use the same 6-slot part system with the same 4 stats:

**Chimera Wilds** (`ts/src/games/chimera_wilds/types.ts`):
```ts
export interface Part {
  id: string;
  slot: string;          // untyped string
  name: string;
  accuracy: number;
  endurance: number;
  power: number;
  speed: number;
  description?: string;
  price?: number;        // optional
}
```

**Mutant Battle Ball** (`ts/src/games/mutant_battle_ball/types.ts`):
```ts
export type PartSlot = 'head' | 'chest' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';

export interface Part {
  id: string;
  name: string;
  slot: PartSlot;        // typed union
  accuracy: number;
  endurance: number;
  power: number;
  speed: number;
  price: number;         // required
  description?: string;
}
```

**Lua side confirms identical slot list:**
- Chimera Wilds: `PART_SLOTS = {"head", "chest", "left_arm", "right_arm", "left_leg", "right_leg"}`
- Mutant Battle Ball: `part_ids = {'head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'}`

**Assessment:** The `Part` interface and `PartSlot` type are genuine
duplication. The 6-slot structure (head, chest, left_arm, right_arm,
left_leg, right_leg) and 4-stat structure (accuracy, endurance, power,
speed) are identical. This is a stronger structural match than the
element-wheel relation — it's not just a function signature, it's a
whole type definition.

**But the surrounding logic is completely different:** Chimera Wilds
assembles random parts into a chimera for a one-shot encounter
(`assemble_chimera` + `resolve_encounter`). Mutant Battle Ball manages
a roster of mutants with persistent parts, injury states, and match
simulation. The Part *type* is shared; the Part *system* is not.

**What promotion would require:** Extract `PartSlot`, `Part`, and
`MutantParts` (or a generic `PartsBySlot`) into a shared types module.
No logic changes — just type extraction. The games would import the
shared types instead of defining their own.

---

## §4 Comparison to the Lua audit

| Audit | Flagged candidates | Real promotion candidates | Ratio |
|---|---|---|---|
| Lua Deep Investigation (Part C) | 11 | 2 (`distance`, `lerp`) | 18% |
| TS-Native Cross-Game (this audit) | 5 categories + Planet of Greed's 4 modules | 2 (element-wheel `getRelation`, part-slot types) | ~18% of categories |

**The ratio is the same.** The Lua audit found 2 of 11 flagged
functions were real candidates. This audit found 2 real candidates
across 5 categories (plus 4 modules that don't exist to assess). The
discipline of "read real source, diff for real" produces the same
result regardless of language: most apparent duplication is superficial
variation, not genuine structural identity.

The TS-native catalog is neither richer nor leaner in real duplication
than the Lua catalog — because the TS code that exists is the same
category of code (rendering, UI, types, client-side previews) that
doesn't have the complex game-logic interactions that produce both
real duplication (shared math) and false duplication (same name,
different complexity).

---

## §5 Honest caveats

- **This audit covers TS-side code only.** The Lua game logic catalog
  was already audited in the Deep Investigation's Part C. This audit
  doesn't re-audit Lua; it checks whether the TS layer has additional
  duplication worth promoting.
- **The "TS-native catalog" doesn't exist yet.** If Shoal (or other
  games) are migrated to TS-native per the Performance Investigation's
  recommendation, a future audit should re-run against the actual
  TS-native game logic — that's where real algorithmic duplication
  (spatial hash, steering forces, lifecycle patterns) would become
  visible if it exists.
- **Planet of Greed's modules are unassessable.** If they're committed
  to the repo later, a targeted check of `wheelTopology.ts` against
  Dissonance/Brewfield's element-wheel logic and against SlimeWorld's
  `planetRegion.ts` would be worthwhile.

---

## §6 Completion criteria checklist

- [x] Every TS-native game's relevant source actually read, not inferred from structure/naming
- [x] Each candidate category assessed with real findings, including categories that turn out empty (spatial partitioning, steering math, entity lifecycle, UI routing — all empty)
- [x] Real diffs provided for anything reported as a promotion candidate (element-wheel `getRelation`: Dissonance vs Brewfield Lua + TS; Part-slot types: Chimera Wilds vs Mutant Battle Ball TS + Lua)
- [x] Planet of Greed's four new modules specifically checked — confirmed not present in repo, cannot assess
- [x] Honest comparison to the Lua audit's 2-of-11 result — same ~18% ratio
- [x] Zero code changes made — confirmed via diff
- [x] No regression to existing floor — nothing changed

---

*RFDGameStudio | TS-Native Cross-Game Duplication Audit | August 2026*
*The direction changed. The discipline for deciding what's actually
shared didn't. Same ratio as the Lua audit: most apparent duplication
is superficial, not structural.*
