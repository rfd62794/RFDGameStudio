# PlanetOfGreed — CorpWorld + Kingmaker Merge Audit

*August 2026 | Audit only. No code changed. No renames. Kingmaker Squads
untouched. WorldOfGreed/PlanetOfGreed naming not locked.*

Source files actually read in full for this audit:
- `examples/corpworld/src/App.tsx` (all ~56KB, 1324 lines)
- `examples/corpworld/src/utils/mapGenerator.ts` (228 lines)
- `examples/corpworld/src/utils/combat.ts` (254 lines)
- `examples/corpworld/src/types.ts` (117 lines)
- `examples/kingmaker-squads/src/utils/aiOpponent.ts` (157 lines)
- `examples/kingmaker-squads/src/data/factions.ts` (34 lines)
- `examples/kingmaker-squads/src/utils/territoryAdjacency.ts` (66 lines)
- `examples/kingmaker-squads/src/utils/crownLogic.ts` (156 lines)
- `examples/kingmaker-squads/src/utils/loyaltyLogic.ts` (140 lines)
- `examples/kingmaker-squads/src/hooks/useTurnPhaseActions.ts` (236 lines)
- `examples/kingmaker-squads/src/data/archetypes.ts` (wheelPosition block, lines 1–73)
- `examples/kingmaker-squads/src/types.ts` (FactionId/HouseId block, lines 68–107)

**Note on file location:** the directive describes CorpWorld's `App.tsx` as
"buried" with no separated logic file. That's confirmed correct for the AI
decision logic specifically (see §1) — but map generation and combat
resolution are, in fact, already extracted into `utils/mapGenerator.ts` and
`utils/combat.ts` respectively, and were confirmed byte-identical across the
whole 0.1.0R1→R5 intake history (`intake/corpworld/MANIFEST.md`). Only the
AI turn logic itself has never been separated or read.

---

## §1 CorpWorld's real AI decision logic — read in full

The function is `generateAIWeeklyOrders`, `App.tsx:467–538`, called once per
week from `handleEndPlanningPhase` (`App.tsx:450`). Full decision body,
quoted:

```ts
// App.tsx:467-538
const generateAIWeeklyOrders = (cells: MapCell[], corps: Corporation[], transits: UnitTransit[]) => {
  // Each AI corp reviews its controlled cells and makes a choice
  for (const corp of corps) {
    if (corp.id === PLAYER_CORP_ID) continue; // Skip player

    const ownedCells = cells.filter(c => c.ownerId === corp.id);
    if (ownedCells.length === 0) continue; // Wiped out

    for (const cell of ownedCells) {
      const totalUnits = cell.units.circle + cell.units.square + cell.units.triangle;

      // Random AI choice weights:
      // 40% chance Expand (if they have units)
      // 20% chance Reinforce (if treasury >= $30k)
      // 20% chance Fortify (if treasury >= $20k and fortification < 3)
      // 20% chance Idle/Hold
      const roll = Math.random();

      if (roll < 0.40 && totalUnits >= 2) {
        // AI Expand
        // Pick a random neighboring cell (prefer neutral or enemy)
        const targetNeighId = cell.neighbors[Math.floor(Math.random() * cell.neighbors.length)];
        ...
      } else if (roll < 0.60 && corp.treasury >= 30000) {
        // AI Reinforce
      } else if (roll < 0.80 && corp.treasury >= 20000 && cell.fortification < 3) {
        // AI Fortify
      } else {
        // AI Idle
      }
    }
  }
};
```

**What it actually does, concretely:**

- It is a flat `Math.random()` roll against four fixed probability bands
  (40/20/20/20), evaluated **per owned cell**, independently, every week.
- The only "target selection" that exists is `cell.neighbors[Math.floor(Math.random() * cell.neighbors.length)]`
  — a **uniformly random pick among that cell's map neighbors**, with a
  comment claiming a preference ("prefer neutral or enemy") that the code
  does not implement — there is no filter on the neighbor's `ownerId` at all.
- Reinforce/Fortify branches only check the acting corp's own treasury and
  its own cell's fortification level. Idle is a pure fallthrough.

### The symmetric-vs-general question, answered directly

The directive frames this as a binary: does the AI key off **rival
identity** (breaks under a locked topology) or **general state evaluation**
(nearest threat, highest-value target — ports cleanly)? The real answer is
**neither**. `generateAIWeeklyOrders` contains:

- **No reference to any other corporation's identity, anywhere.** It never
  reads `otherCorp.id`, never compares treasuries, never checks who owns a
  neighboring cell before choosing it as an expansion target.
- **No state evaluation either.** There is no threat scoring, no
  value-of-target comparison, no "nearest" or "weakest" logic. The target
  neighbor is picked with `Math.random()` over the full neighbor list, full
  stop.

This is a materially different (and simpler) finding than either option the
directive posed. It means:
- A locked relational topology (Ember/Tundra-style fixed hostility) has
  **nothing to violate**, because the current AI never distinguishes one
  rival corporation from another in the first place.
- It also means there is **no existing general-evaluation logic to port** —
  Kingmaker's scoring approach (see §2) would be new code layered on top of
  CorpWorld's structure, not an adaptation of anything CorpWorld already has.

### Corporation count: real, adjustable parameter — confirmed in three places

- `App.tsx:467`, `generateAIWeeklyOrders`: `for (const corp of corps)` —
  iterates whatever length `corps` actually is.
- `mapGenerator.ts:185–225`, capital placement: `for (let c = 0; c < sortedCorps.length; c++)`,
  using greedy farthest-point seed selection over the real corps array —
  not hardcoded to 5.
- `combat.ts:70`, `resolveCellCombat`: `getActiveCorps = () => Object.keys(finalUnits).filter(...)`
  and the main loop condition `while (getActiveCorps().length > 1 && round <= 15)`
  — genuinely N-way combat with greedy best-counter targeting over
  `enemyCorps` (`combat.ts:108–149`), not limited to any fixed count.

The only hardcoded `4` in the whole file is `INITIAL_CORPORATIONS` itself
(`App.tsx:25–81`, 1 player + 4 AI entries) and an unrelated simulation-speed
constant (`App.tsx:312`, `simulationSpeed === 4`). Corp count is a real
parameter everywhere it's consumed; it is only literally "4" in the seed
data.

### Symmetric-treatment assumptions that a locked topology would violate

None found. `Corporation` (`types.ts:8–18`) has no relational field at all —
no rival ID, no alliance flag, no hostility weight, nothing. Nothing in
`App.tsx`, `mapGenerator.ts`, or `combat.ts` special-cases one AI corp
against another. There is nothing to break, because there is no symmetric
*or* asymmetric relational model present — the code is currently
relationship-blind.

---

## §2.2 Player-corporation gap vs. Kingmaker's real control layer

**What Kingmaker's player does each cycle that CorpWorld's player doesn't:**

CorpWorld's player issues per-cell `WeeklyOrder`s (`hold`/`expand`/`reinforce`/`fortify`/`scan`/`civic`)
against pooled integer unit counts (`UnitGroup { circle, square, triangle }`,
`types.ts:20–24`) once per week, then watches an abstracted RPS combat
resolve automatically (`combat.ts`). There is no player-controlled army with
individually tracked units.

Kingmaker's player, via `useTurnPhaseActions.ts`:
- `handleDeclareAction` (line 35): assembles a squad from `gameState.units`
  filtered by `squadSlot`, and declares an `attack`/`reinforce` intent
  against a specific target cell.
- `handleRespondAction` (line 111): spends gold to respond within a single
  Response Window when targeted.
- `handleConfirmPlacementAndStartCombat` (line 207): places individually
  tracked units (`UnitState`, with `archetype`, HP, `isKing`) on a tactical
  grid (`PlacementView.tsx`) before `simulateCombat` runs.

**Is this generic enough to adapt, or built specifically around Kingmaker's
own systems?** Built specifically around Kingmaker's own systems, and not
in a way that transfers directly:

- The entire player-control surface is keyed on **individually identified
  units** (`UnitState.archetype`, `.isKing`, `.rank`, `.squadSlot`) —
  CorpWorld has no equivalent; its `MapCell.units` is a plain integer count
  per shape type (`types.ts:20–24`), with no per-unit identity to select,
  place, or promote.
- `handleConfirmPlacementAndStartCombat` depends on `PlacementView`'s
  tactical grid and `simulateCombat`'s per-unit combat engine
  (`combatEngine.ts`), a wholesale different resolution model from
  CorpWorld's `resolveCellCombat`'s pooled-count, round-based RPS math
  (`combat.ts:51–254`).
- The King/coronation system (`crownLogic.ts:23–60`, `enforceCoronation`)
  and Defense Force lifecycle (`crownLogic.ts:62–156`) that the player's
  actions interact with have no CorpWorld analog at all — CorpWorld has no
  concept of a "King unit" or a "Force" distinct from a cell's raw garrison.

**Conclusion:** Kingmaker's control layer is not portable as a layer.
Building a sixth, player-controlled corporation for CorpWorld is a real,
separate design/build task — it would need to be built against CorpWorld's
own pooled-unit-count model (extending `WeeklyOrder`/`MapCell`), not
imported from Kingmaker's individual-unit model.

---

## §2.3 Loyalty / Population Unrest opportunity

CorpWorld's own type definitions already reserve, and explicitly forbid
building, an unrest civic focus:

```ts
// types.ts:63
| { type: 'civic'; focus: 'production' | 'defense' /* | 'unrest' — future phase, do not implement */ };
```

This confirms the directive's premise: CorpWorld has a real, named gap for
an unrest-style mechanic, deliberately stubbed out.

Kingmaker's real formula, `loyaltyLogic.ts:74–81`:

```ts
const allegiance = cell?.publicOpinion ?? 50; // 50 = neutral default
const allegianceModifier = 1 + (50 - allegiance) / 100; // 0.5x at 100 allegiance to 1.5x at 0 allegiance
const erosionThisTurn = Math.round(LOYALTY_EROSION_PER_UNREINFORCED_THREATENED_TURN * allegianceModifier);
newLoyalty = Math.max(0, currentLoyalty - erosionThisTurn);
```

**Does this plug into CorpWorld's Civic Directive system directly, or does
it depend on Kingmaker-specific structures that don't exist in CorpWorld?**
Split answer:

- The **formula itself** — a 0–100 `publicOpinion`/allegiance value linearly
  scaling an erosion rate — is generic arithmetic with no Kingmaker-specific
  dependency. It reads a single number off a cell and produces a multiplier;
  nothing about it requires `DefenseForce`, `FactionId`, or the King system.
- But the **scaffolding it's embedded in** is entirely Kingmaker-specific
  and absent from CorpWorld:
  - `DefenseForce` (a named unit-holding entity with `.loyalty`, `.cellId`,
    distinct from a cell's raw garrison) — CorpWorld has no equivalent;
    `MapCell.units` (`types.ts:38`) is the garrison directly, there's no
    intermediate "Force" object to hold a loyalty value.
  - `isForceUnderThreat` (`loyaltyLogic.ts:23–35`) keys off
    `cell.isExposed` (`crownLogic.ts:5–21`, computed from `neighborIds`
    ownership) and `declaredActions` — both Kingmaker's declare/response
    turn structure, which CorpWorld's day-tick/weekly-planning loop
    (`App.tsx:308–318`, `advanceDay`) does not have.
  - The break condition — a Force collapsing and its cell flipping
    ownership **without combat resolving** (`loyaltyLogic.ts:84–115`) — has
    no CorpWorld parallel; CorpWorld cells only change owner via
    `resolveCellCombat`'s explicit victor determination
    (`combat.ts:226–243`) or an uncontested-neutral-claim instant capture
    (`App.tsx:580–618`).

**Conclusion:** the *idea* (a per-cell public-opinion number modulating an
existing mechanic) and the *formula* transfer cleanly as a pattern. The
*code* does not — it is wired into Kingmaker's Force/threat/declaration
model start to finish. Building Population Unrest for CorpWorld means
adding a real `unrest`/`publicOpinion`-style field to `MapCell`, wiring it
into the existing weekly Civic Directive resolution (`App.tsx:438–445`) and
week-end production tick (`App.tsx:677–705`), and picking a CorpWorld-native
consequence (e.g. modulating weekly profit or event costs) — a new build
using Kingmaker's formula as a reference, not an import of Kingmaker's code.

---

## §2.4 Verdict Table

| Candidate | Verdict | Evidence |
|---|---|---|
| **Kingmaker's locked relational topology** (opposite/adjacent hostility, e.g. `tundra->player: 40` in `factions.ts:17-30`, `wheelPosition` categories in `archetypes.ts:15`) | **(c) Doesn't fit, as an import** — but also **nothing to break**, because CorpWorld's real AI (`App.tsx:467-538`) is pure `Math.random()` with zero rival-identity awareness and zero state evaluation (§1). There is no symmetric-rivalry assumption to violate, but also no general-evaluation scoring loop to graft hostility weights onto, the way Kingmaker's `aiOpponent.ts:50-55` adds `hostilityWeight()` on top of `threatLevel`/`troopCount` scoring. Adopting a topology for six CorpWorld corporations means building a scoring function in CorpWorld first (which does not exist today) and then adding hostility weights to it — two new pieces of work, not one import. |
| **Kingmaker's player-House control layer** (`useTurnPhaseActions.ts` declare/response/placement, individually tracked `UnitState`) | **(c) Doesn't fit** — built specifically around individually identified units with archetype/HP/`isKing`/squad placement (`useTurnPhaseActions.ts:35,111,207`; `crownLogic.ts:23-60`), while CorpWorld's entire unit model is pooled integer counts per shape type with no per-unit identity (`types.ts:20-24,38`). A player-controlled sixth corporation for CorpWorld is real, unbuilt scope: extending `WeeklyOrder`/`MapCell` in CorpWorld's own pooled-count idiom, not porting Kingmaker's tactical layer. |
| **Kingmaker's Loyalty / `publicOpinion` system** (`loyaltyLogic.ts:74-81`) | **(b) Worth adapting, real scope named, not built** — the allegiance-modulated erosion formula is generic arithmetic with no Kingmaker-specific dependency and can be reused as a *pattern*. The surrounding `DefenseForce`/`isExposed`/declare-response/break-without-combat scaffolding it's embedded in (`loyaltyLogic.ts:23-35`, `crownLogic.ts:5-21`) does not exist in CorpWorld and does not port. Real scope: add an `unrest`/`publicOpinion`-style field to `MapCell`, and wire a CorpWorld-native consequence into the existing Civic Directive resolution (`App.tsx:438-445`) and week-end tick (`App.tsx:677-705`) — CorpWorld's own stubbed-out `'unrest'` focus (`types.ts:63`) is exactly the intended landing spot. Not built in this pass. |

---

## Bottom line for the scale-vs-import decision

The directive's framing in §0 — "scale CorpWorld's existing symmetric
structure to six" vs. "import Kingmaker's proven topology wholesale" — turns
out not to be the real choice, because CorpWorld's existing AI structure
isn't symmetric-*rivalry*-based at all; it's identity-blind randomness.
Scaling CorpWorld to six corporations is mechanically trivial (§1 — corp
count is already a real parameter everywhere combat, map generation, and
order generation touch it). The real, larger, and still-unscoped question is
whether PlanetOfGreed's AI corporations should keep CorpWorld's current
random-roll behavior at six corps, or whether this merge is also the point
where CorpWorld's AI gets a real state-evaluation/rivalry layer for the
first time — modeled on Kingmaker's scoring pattern (§2.4), but built new
against CorpWorld's own data shapes, since none of Kingmaker's actual code
in this area transfers by import.
