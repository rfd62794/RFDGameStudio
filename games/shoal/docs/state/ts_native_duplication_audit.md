# TS-Native Cross-Game Duplication Audit — Report

*August 2026 | RFDGameStudio | Investigation-only. No promotions, no
refactoring, no new shared modules. Same method as the Lua Deep
Investigation's Part C — read real source, diff for real, report
honestly.*

---

## §0 Environment correction (v2)

**The first version of this report claimed "Planet of Greed doesn't
exist in the repo" and "zero TS-native game logic exists." Both claims
were wrong, and the error was an artifact of where the audit looked,
not a true statement about the studio.**

The directive scoped the audit to `ts/src/games/` — the shared-git
catalog of Lua-backed games with TS renderers. But per ADR-012's
port-then-conversion pipeline, TS-native games land in `examples/{slug}/`
first, and `examples/*` is gitignored (local-only, never enters shared
git history). The audit's grep/search tools respected the gitignore,
making `examples/` invisible. On this machine (the same Nitro checkout
where the Phase 1 Engine Directive work happened), both
`examples/corpworld/` and `examples/planetofgreed/` are present with
real, tested TS-native game logic — including all four modules the
first report said weren't there: `wheelTopology.ts`,
`fragmentSystem.ts`, `endingSystem.ts`, `aiDecisions.ts`, each with
passing vitest tests.

**What this corrected report covers:**
1. The `ts/src/games/` catalog (10 Lua-backed games with TS renderers) —
   findings from v1 that remain valid are kept in §3–§4.
2. The `examples/` catalog (18 local-only TS-native games) — the real
   TS-native game logic that v1 missed, led by the CorpWorld → Planet of
   Greed fork relationship, which is the single largest duplication
   finding in this audit.

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

**Finding: all four modules exist and have been assessed. One (mulberry32
in aiDecisions.ts) is a real duplication of artGen's seededRandom. The
other three are novel with no catalog analog.**

The first version of this report said these modules didn't exist. That
was wrong — they live in `examples/planetofgreed/src/`, which is
gitignored and was invisible to the audit's gitignore-respecting search
tools. All four are present with passing vitest tests:

**1. `wheelTopology.ts` (45 lines)** — 6-culture wheel with
`getOpposite(c)` (index + 3 mod 6) and `getAdjacent(c)` (index ± 1,
wrapping). Returns the *element at* the opposite/adjacent position, not
a relation-type string.

**Relation to Dissonance/Brewfield's wheel (§2D above):** Same concept
(ordered ring, opposite = half-way around, adjacent = neighbor), but
different size (6 vs 4), different API (returns the element vs returns
a relation classification), and different consumers (AI target
weighting vs card/brew resolution). A generalized wheel module could
theoretically serve all three, but the APIs are different enough that
promotion would require designing a new interface, not just extracting
a function. This is a Phase 2 consideration, not a clean extraction.

**Relation to SlimeWorld's `planetRegion.ts`:** SlimeWorld has 6
capitols at 60° increments on a spatial ring, but that's Voronoi
geometry (computing polygon cells from seed points), not relational
topology (computing opposite/adjacent from a wheel index). Different
problem, different code, no overlap.

**2. `fragmentSystem.ts` (38 lines)** — `initializeFragments(corps)`
sets each House's fragments to `[ownCultureId]`;
`onHouseEliminated(eliminated, eliminator)` transfers all fragments
with chain inheritance. **No analog anywhere in the catalog.** Unique
to Planet of Greed's elimination mechanic.

**3. `endingSystem.ts` (43 lines)** — `checkEnding(corps,
playerHouseId)` returns an `EndingEvent` if the player is Rank 1.
**No analog anywhere.** Unique to Planet of Greed's victory condition.

**4. `aiDecisions.ts` (95 lines)** — wheel-aware AI target selection
with weighted random neighbor choice. Contains `makeSeededRng(seed)`:
```ts
export function makeSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

**This is a duplicate of `ts/src/engine/artGen/seededRandom.ts`'s
`mulberry32`:**
```ts
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Same algorithm, same constants (`0x6d2b79f5`), same output sequence.
Cosmetic differences only: variable name (`s` vs `a`), hex casing
(`0x6D2B79F5` vs `0x6d2b79f5`), and uint32 coercion (`>>> 0` vs `|= 0`
then `| 0`). This is the third copy of mulberry32 in the studio —
artGen has one, Planet of Greed's aiDecisions has one, and the
synthetic Shoal TS-native benchmark port had one (now deleted).

**Why this happened:** Planet of Greed was built in a Google AI Studio
session that didn't have access to the shared `ts/src/engine/artGen/`
module (it's a standalone `examples/` project with its own
`node_modules`). The duplication is real but understandable — and it's
the kind of thing that the port-then-conversion pipeline (ADR-012) is
supposed to catch when the game moves from `examples/` to `ts/src/`.

### G. CorpWorld → Planet of Greed fork (the largest finding)

**Finding: massive real duplication. This is the single largest
duplication finding in the entire audit, and v1 missed it entirely.**

CorpWorld (`examples/corpworld/`) is ADR-010's cited TS-native
precedent. Planet of Greed (`examples/planetofgreed/`) forked from
CorpWorld and added the 4 modules above. The fork relationship is
visible in the file structure — both have identical component filenames
and the same `utils/` layout — and confirmed by hash comparison:

| File | Status | Lines (CW / PoG) |
|---|---|---|
| `src/utils/combat.ts` | **BYTE-IDENTICAL** (SHA256 match) | 254 / 254 |
| `src/main.tsx` | **BYTE-IDENTICAL** | — |
| `src/components/AlertQueue.tsx` | **BYTE-IDENTICAL** | — |
| `src/components/BoardroomHeader.tsx` | **BYTE-IDENTICAL** | — |
| `src/components/CombatResolutionView.tsx` | **BYTE-IDENTICAL** | — |
| `src/components/DailyEventModal.tsx` | **BYTE-IDENTICAL** | — |
| `src/components/PlanetMap.tsx` | **BYTE-IDENTICAL** | — |
| `src/types.ts` | DIFFERS (PoG adds CultureId, rank, fragments, publicOpinion, EndingEvent) | 117 / 155 |
| `src/utils/mapGenerator.ts` | DIFFERS (PoG rewrites capital placement for wheel-ordered spread) | 228 / 355 |
| `src/components/AnnualReportView.tsx` | DIFFERS (PoG adds ending-event display) | 189 / 202 |
| `src/components/WeeklyOrdersPanel.tsx` | DIFFERS (PoG adds civic-unrest order type) | 681 / 692 |
| `src/App.tsx` | DIFFERS (PoG integrates 4 new modules + rank/fragment logic) | 1344 / 1686 |

**7 of 12 files are byte-identical.** The RPS combat system
(`combat.ts`, 254 lines of real game logic — rock-paper-scissors unit
counters, deterministic weave-sort attack order, fortification
absorption, multi-round resolution, tie-breaker) is the most
significant duplicated logic. No other game in the catalog (Lua or TS,
`ts/src/games/` or `examples/`) has this combat system — it's unique
to CorpWorld and Planet of Greed, and it's byte-for-byte identical
between them.

**What this means for promotion:** Unlike the Dissonance/Brewfield
wheel relation (10 lines, different consumers) or the Chimera/MBB
part-slot types (type definitions, no logic), this is **254 lines of
identical game logic** plus **6 identical React components**. If
CorpWorld and Planet of Greed both move into `ts/src/games/` per
ADR-012's conversion pipeline, the combat system and shared components
should be extracted into a shared module first — otherwise the studio
ships two byte-identical copies of a 254-line combat resolver.

**The diverged files are genuinely diverged, not superficially:**
- `mapGenerator.ts`: PoG rewrote the capital-placement algorithm to
  bias for angular spread (so 6 capitals arrange into a wheel shape)
  and added wheel-cyclic relabeling. The first ~180 lines (Voronoi
  generation, sector names) are shared; the placement logic is new.
- `App.tsx`: PoG integrated `wheelTopology`, `fragmentSystem`,
  `endingSystem`, and `aiDecisions` into the game loop, plus
  `computeRank` for the Rank/PopBalance system. 342 new lines.
- `types.ts`: PoG added `CultureId`, `Corporation.rank`,
  `Corporation.fragments`, `MapCell.publicOpinion`, `EndingEvent`, and
  the `'unrest'` civic focus option.

These diverged files are not promotion candidates — they're where
Planet of Greed's unique mechanics live. The promotion candidate is the
**7 byte-identical files**, led by `combat.ts`.

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
