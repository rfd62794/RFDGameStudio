# SlimeBreeder → SlimeWorld Absorption Audit

*September 2026 | Audit only — no code changed. Companion to
`docs/directives/SlimeBreeder_Absorption_Audit_Directive.md` and the
ADR-023 origin-project registration
(`docs/adr/ADR-023-legacy-origin-projects-type.md`,
`ts/src/games/slimebreeder/config.ts`).*

Question answered: **what does the archived SlimeBreeder still contain
that the live SlimeWorld lacks?** This document is the evidence base for
writing a step-2 port directive; it changes nothing itself.

Source files actually read for this audit:

- Archive (shipped code): `archive/slimebreeder/src/App.tsx`,
  `archive/slimebreeder/src/config.ts`,
  `archive/slimebreeder/src/store/gameStore.ts`,
  `archive/slimebreeder/src/db/db.ts`,
  `archive/slimebreeder/src/data/traitDefs.ts`,
  `archive/slimebreeder/src/utils/{breedSlimes,discovery,economics,requestGenerator,slimeGenerator}.ts`,
  all of `archive/slimebreeder/src/components/`,
  all of `archive/slimebreeder/src/__tests__/`
- Archive docs: `archive/slimebreeder/docs/specs/economy_and_progression.md`,
  `archive/slimebreeder/docs/superpowers/specs/2026-04-11-breeding-design.md`,
  `archive/slimebreeder/docs/superpowers/plans/` (design-intent only —
  see §2 note on shipped-vs-specced divergence)
- SlimeWorld Lua: `games/slimeworld/{breeding,codex,economy,logic,territory,regionlock}.lua`,
  `games/slimeworld/data.yaml`
- SlimeWorld TS: `ts/src/games/slimeworld/App.tsx`,
  `ts/src/games/slimeworld/gameLogic.ts`,
  `ts/src/games/slimeworld/types.ts`,
  `ts/src/games/slimeworld/components/{EconomyTab,RosterTab,SlimeDexTab,SlimeVisual,SpecimenPicker,SpecimenListItem}.tsx`
- Meta: `docs/adr/ADR-023-legacy-origin-projects-type.md`,
  `docs/gdd/SlimeWorld_Design_Rev3.md`, `AGENTS.md`,
  `tests/test_slimeworld_tier_economics.py`,
  `tests/test_slimeworld_shape_naming.py`

Classification key — *SlimeWorld status*: `yes` (functionally present),
`partial` (concept present, materially different), `no` (absent).
*Recommendation*: `already absorbed` | `port` | `port as data only` |
`drop`.

---

## §1 Feature table — every SlimeBreeder mechanic and screen

| # | Mechanic / screen | Archive behavior | Archive source | SlimeWorld status | SlimeWorld source | Recommendation | Rationale |
|---|---|---|---|---|---|---|---|
| 1 | Breeding (host/donor pair, donor consumed) | `startBreed` removes donor from pen immediately, snapshots both parents into a tank; `resolveBreed` adds offspring, host survives | `archive/slimebreeder/src/store/gameStore.ts:156-239` | yes | `games/slimeworld/territory.lua:106-182` (`initiate_breeding` removes `parent_b`, sets `consumed_slime_id`), `ts/src/games/slimeworld/App.tsx:272-308` | already absorbed | Identical consume-the-donor semantics inside a richer pipeline (generation cost, Elder tax, region-unlock check, first-breed strays). |
| 2 | Discrete color recipes (RYB mixing, 15 named colors in 4 tiers) | 11 authored pair→result recipes; 40% discovery chance, else 60/40 host/donor inheritance | `archive/slimebreeder/src/utils/discovery.ts:16-89`, `archive/slimebreeder/src/config.ts:10-16` | no | `games/slimeworld/breeding.lua:7-36` (continuous hue midpoint + faction snap), `games/slimeworld/data.yaml:47,85-99` (7 colors only) | drop | Superseded by continuous hue/saturation genetics — a deliberate design commitment (`docs/gdd/SlimeWorld_Design_Rev3.md:85-102`). The 9 T3/T4 color names (Amber, Crimson, Gold, Lime, Indigo, Teal, Rust, Olive, Slate) have no faction slot and would collide with the 17 authored color targets in `games/slimeworld/data.yaml:198-215`. |
| 3 | Discrete shape recipes (geometric morphology, 11 shapes) | 8 authored pair→result recipes, same 40%/60-40 logic as colors | `archive/slimebreeder/src/utils/discovery.ts:35-47,95-115` | no | `games/slimeworld/breeding.lua:38-66` (10 of the same shape names kept as snap anchors — `Crystal` dropped — no recipes), `games/slimeworld/data.yaml:241-264` (23 named shape targets) | drop | Continuous vertex/irregularity genetics plus a far larger authored shape taxonomy (incl. star polygons) supersede the pair table. `snap_to_shape_name` preserves the archive's shape *vocabulary* without its recipes. |
| 4 | Same-trait passthrough (identical parents always breed true) | Same color/shape parents → offspring inherits that trait | `archive/slimebreeder/src/utils/discovery.ts:73-75,101-103` | yes | `games/slimeworld/breeding.lua` (midpoint blending of identical inputs yields the same value; faction snap confirms it) | already absorbed | Emergent property of continuous blending; no discrete special-case needed. |
| 5 | Host weighting (60/40 host vs donor) | `BREED_HOST_WEIGHT = 0.60` biases inheritance to the surviving parent | `archive/slimebreeder/src/config.ts:10`, `archive/slimebreeder/src/utils/breedSlimes.ts:30-42` | no | `games/slimeworld/breeding.lua:12-15` (`circular_hue_midpoint` is symmetric) | drop | Midpoint genetics treat parents symmetrically by design; re-adding asymmetry would need a design decision, not a port. |
| 6 | Incubation (30 s real-time hatch/breed timer, progress bar, on-load auto-resolve) | `HATCH_DURATION_MS = 30_000`; tanks tick in real time; expired tanks auto-resolve on `loadGame` | `archive/slimebreeder/src/config.ts:1`, `archive/slimebreeder/src/components/IncubationProgress.tsx`, `archive/slimebreeder/src/store/gameStore.ts:370-385` | no | `games/slimeworld/territory.lua:150` (offspring inserted instantly), `games/slimeworld/logic.lua:14-35` (cycle-based lifecycle stages instead of real-time) | drop | SlimeWorld is turn/cycle-based — a real-time clock is explicitly deferred in `docs/gdd/SlimeWorld_Design_Rev3.md:176-179` ("a second real-time clock"). |
| 7 | Incubation tanks (parallel timed slots, +1 per 50 G) | `tankCount` starts at 1; `buyTankUpgrade` adds a slot | `archive/slimebreeder/src/store/gameStore.ts:258-269`, `archive/slimebreeder/src/components/{MutatePage,TankCard}.tsx` | no | none — no timed breeding exists to parallelize | drop | Depends on #6. Rate-limiting role is already covered by `calculate_breeding_cost` generation tax (`games/slimeworld/breeding.lua:87-90`) and the seed-purchase cooldown (`games/slimeworld/economy.lua:71,138-142`). |
| 8 | Hatch (free random slime drawn from discovered pool only) | `generateSlime` picks uniformly from `discoveredColors`/`discoveredShapes`; blocked when pen full | `archive/slimebreeder/src/utils/slimeGenerator.ts:14-33`, `archive/slimebreeder/src/components/HatchButton.tsx`, `archive/slimebreeder/src/store/gameStore.ts:107-154` | partial | `games/slimeworld/economy.lua:95-152` (`purchase_seed_slime`: chosen color, 50 Cr, region-gated via `derive_purchasable_colors`, 3-cycle cooldown), `games/slimeworld/logic.lua:118-132` (refugee strays) | already absorbed | `derive_purchasable_colors` is the direct descendant of "you can only hatch what you've unlocked": the discovery pool became region-unlock gating. Free random hatch specifically is gone — replaced by paid seed purchase and stray spawns; that's a design upgrade, not a gap. |
| 9 | Regent locks at hatch (spend Regents to force a trait) | `REGENT_LOCK_COST` {T1:2, T2:5, T3:12, T4:25} deducted in `startHatch`; locks force color/shape in `generateSlime` | `archive/slimebreeder/src/config.ts:27-32`, `archive/slimebreeder/src/store/gameStore.ts:113-124` | partial | `ts/src/games/slimeworld/components/SlimeDexTab.tsx` (typed regents — pattern/color/target — applied as breeding nudges), `games/slimeworld/data.yaml:99,105,121` (`target_nudge_strength`) | port | The "spend a Regent to steer genetics" concept is present in stronger form (targeted nudges on three axes). Missing half: no acquisition loop — SlimeWorld regents are only *purchased* with credits (`SlimeDexTab.tsx:502,691,930`); the archive's earn-on-discovery half is absent (see #10). |
| 10 | Regents economy (earn on first discovery by tier) | `DISCOVERY_REGENT_REWARDS` {T2:5, T3:15, T4:40} credited when a recipe produces a never-before-seen trait | `archive/slimebreeder/src/config.ts:21-25`, `archive/slimebreeder/src/store/gameStore.ts:212-226` | partial | `ts/src/games/slimeworld/types.ts:112`, `ts/src/games/slimeworld/App.tsx:171` (three typed regent inventories exist; start with 1 target regent; no earn path) | port | The inventories and spend side exist; the earn side is the gap. First-match moments already fire (codex/target matching, region unlocks) — natural award hooks. |
| 11 | Discovery log / codex screen | Tiered grid of all colors/shapes, discovered vs `???`, Regent balance shown | `archive/slimebreeder/src/components/DiscoveryPage.tsx` | yes | `ts/src/games/slimeworld/components/SlimeDexTab.tsx`, `ts/src/games/slimeworld/types.ts:107-112` (`colorCodex`, `patternCodex`, shape targets) | already absorbed | SlimeDex is a strict superset: per-target detail, discovery flags, and regent actions on the same surface. |
| 12 | Recipe hints on undiscovered traits ("Red + Blue → ?") | `getColorRecipeHint`/`getShapeRecipeHint` look up the parent pair for an undiscovered trait | `archive/slimebreeder/src/utils/discovery.ts:120-138`, `archive/slimebreeder/src/components/DiscoveryPage.tsx:186-197` | partial | `ts/src/games/slimeworld/components/SlimeDexTab.tsx` shows each target's name and requirements directly | drop | Pair-recipe hints don't map to continuous axes; the SlimeDex already tells the player what to aim for. |
| 13 | Inventory / containment list | Slime cards with sell action | `archive/slimebreeder/src/components/{InventoryList,SlimeCard}.tsx` | yes | `ts/src/games/slimeworld/components/RosterTab.tsx` | already absorbed | Roster is richer (roles, levels, stage, stats, rename, recycle). |
| 14 | Sell slime at computed tier value | `sellSlime` credits `slime.actualValue` (tier value × per-slime variance) | `archive/slimebreeder/src/store/gameStore.ts:241-248`, `archive/slimebreeder/src/utils/economics.ts:14-23` | partial | `games/slimeworld/economy.lua:11-19` + `ts/src/games/slimeworld/gameLogic.ts:12` (`calculateMarketPrice` = `40 + (level-1)*5` × flood multiplier; `calculate_tier_value` exists in `games/slimeworld/breeding.lua:77-82` but only feeds petition payout at `games/slimeworld/codex.lua:92-94`) | port | The exact archive valuation formula already runs inside SlimeWorld — for wanderer payouts only. Sale price ignores trait rarity entirely (a Prismatic sells like a Triangle of equal level). Whether tier-scaled sale pricing is *wanted* is a balance call, but the plumbing is already there. |
| 15 | Market — wanderer requests | Max 3 requests, optional color/shape requirements (70%/30% rolls, ≥1 required), reward = colorTier × shapeTier × 10 × 3.0 premium, targets drawn from *discovered* pool only | `archive/slimebreeder/src/utils/requestGenerator.ts`, `archive/slimebreeder/src/config.ts:36-40`, `archive/slimebreeder/src/store/gameStore.ts:395-440`, `archive/slimebreeder/src/components/MarketPage.tsx` | yes | `games/slimeworld/codex.lua:79-123` (same `WANDERER_REQUEST_MAX = 3`, `WANDERER_PREMIUM_MULTI = 3.0`, same 0.3 rolls, same tier×tier×10 reward formula), `games/slimeworld/logic.lua:62-73` (spawn/expire on cycle advance), `ts/src/games/slimeworld/components/EconomyTab.tsx` | already absorbed | Literal port — the formula is byte-equivalent. Two deliberate diffs: petitions expire after 5–8 cycles, and targets are drawn from *all* colors/shapes rather than the discovered pool (arguably better — gives the player aspiration targets). Dismissal regressed; see #16. |
| 16 | Request dismiss / reroll | `dismissRequest` removes a request and immediately regenerates to max | `archive/slimebreeder/src/store/gameStore.ts:442-456`, `archive/slimebreeder/src/components/MarketPage.tsx` | no | none found in `games/slimeworld/codex.lua`, `games/slimeworld/logic.lua`, or `EconomyTab.tsx` | port | Small UX gap: a stuck petition only clears by expiry. Cheap to restore as a Decline action. |
| 17 | Display rooms (2 fixed slots, passive income 0.5 G/s × colorTier × shapeTier, accrues while offline) | Assign slime → removed from pen, earns real-time gold credited per tick and as a lump sum on load | `archive/slimebreeder/src/store/gameStore.ts:271-312,330-349`, `archive/slimebreeder/src/components/DisplayRooms.tsx`, `archive/slimebreeder/src/config.ts:3-4` | partial | `games/slimeworld/codex.lua:8-13` (`calculate_worker_income`: flat 5 Cr/cycle, ×2 autofeeder, ×2 culture match), `games/slimeworld/logic.lua:87-93`, `ts/src/games/slimeworld/components/RosterTab.tsx:316-385` | port | The "park a slime for passive income" niche is filled by the Worker role, but the yield is flat — the archive's tier-scaled payout (valuable specimens earn more, creating the sell-vs-showcase tension from `archive/slimebreeder/docs/specs/economy_and_progression.md:36-47`) is the missing ingredient. Offline accrual is N/A in a cycle-based game. |
| 18 | Facility expansion — pen capacity (+1 per 20 G flat, no cap) | `buyPenUpgrade` | `archive/slimebreeder/src/store/gameStore.ts:250-256`, `archive/slimebreeder/src/components/ExpandFacility.tsx`, `archive/slimebreeder/src/config.ts:2` | yes | `games/slimeworld/economy.lua:21-31` (`buy_upgrade('capacity')`: +5 roster cap for 150 Cr), `ts/src/games/slimeworld/components/LabTab.tsx` | already absorbed | Same mechanic, different numbers. |
| 19 | Stats bar (gold / containment / regents at a glance) | `StatsBar` shows `{gold}G`, `{slimes}/{penCapacity}`, `{regents}R` | `archive/slimebreeder/src/components/StatsBar.tsx` | yes | Credits and roster cap surfaced across `ts/src/games/slimeworld/components/` chrome; regent counts live in `SlimeDexTab.tsx:498-502,687-688,926-930` | already absorbed | Equivalent info density, split across the tab structure. |
| 20 | SlimeVisual (deterministic SVG per color×shape: gradients, paths, faces) | `COLOR_DEFS`/`SHAPE_DEFS` carry per-trait art (gradients, SVG paths, face layouts, extras); `SlimeVisual` renders it | `archive/slimebreeder/src/data/traitDefs.ts`, `archive/slimebreeder/src/components/SlimeVisual.tsx` | yes | `ts/src/games/slimeworld/components/SlimeVisual.tsx` renders procedurally from continuous genetics via shared `ts/src/engine/artGen` (consumption verified per `AGENTS.md`) | already absorbed | Different render model, deliberately — the archive's per-trait hand-authored art can't express continuous hue/vertex space. |
| 21 | SlimePicker (modal specimen picker, exclude-list) | Generalized picker reused by display slots and breeding panel | `archive/slimebreeder/src/components/SlimePicker.tsx` | yes | `ts/src/games/slimeworld/components/{SpecimenPicker,SpecimenListItem}.tsx` | already absorbed | Same component role in the current UI. |
| 22 | Persistence (Dexie/IndexedDB: single-row `gameState` + `discovery` row, schema v1–v5 with trait-rename migrations, on-load reconciliation) | `PersistedGameState`/`PersistedDiscovery`; migrations add display slots, tanks, discovery table (with `Blob→Circle` etc. renames), wanderer requests | `archive/slimebreeder/src/db/db.ts`, `archive/slimebreeder/src/store/gameStore.ts:314-393` | no | SlimeWorld serializes a single state object through `stateToLua` (`ts/src/games/slimeworld/types.ts:201`) — no IndexedDB layer | drop | Not portable across runtimes. Worth keeping only as a *pattern reference*: versioned save migrations and on-load reconciliation (credit offline income, auto-resolve expired timers) are good habits if SlimeWorld's save shape ever needs versioning. |
| 23 | Unshipped progression spec (hard caps: pen 30 / tanks 4 / display 4; escalating pen costs ~1.2×; hatch gold costs 5/15/50/150 per trait tier; pattern & accessory trait slots; diminishing discovery rates 40/25/5%; curated T3/T4 combos e.g. Scarlet=Crimson+Gold, Void=Scarlet+Burgundy; Regent 1:1 earn:spend equilibrium) | Design doc only — shipped code implements none of the caps, hatch costs, patterns/accessories, or curated combos (it uses flat costs and a flat 40% chance) | `archive/slimebreeder/docs/specs/economy_and_progression.md` | no | Partially realized in different form: hard progression gates = `games/slimeworld/data.yaml:296-319` region locks; escalating breed cost = `games/slimeworld/breeding.lua:87-90`; curated "hardest combo" = Metallic accent / Convergence node | port as data only | The *tension model* (income must trail acquisition costs; rarity gates must be authored, not procedural) is the spec's real content and maps cleanly onto SlimeWorld balance tuning. The specific tables are reference data, not code to port. Also note: the shipped game diverged from its own spec — shipped `REGENT_LOCK_COST` {2,5,12,25} does not match the spec's 1:1 equilibrium {5,15,40} — so treat spec numbers as intent, not gospel. |

**Tally — SlimeWorld status:** 9 yes / 6 partial / 8 no.
**Tally — recommendation:** 10 already absorbed / 4 port / 1 port as data only / 8 drop.

### What the table nets out to

Genuinely missing (all `port` candidates):

1. **Regent earn loop** — discovery/target-match should award Regents
   (#9, #10). Spend side exists; earn side absent.
2. **Petition dismiss** (#16).
3. **Tier-scaled slime valuation at sale time** (#14) — formula already
   in-engine, unused for pricing.
4. **Tier-scaled passive income** (#17) — the display-room descendant.

Everything else SlimeBreeder shipped is either already inside SlimeWorld
in equal-or-better form, or deliberately replaced by the continuous
genetics model that `docs/gdd/SlimeWorld_Design_Rev3.md` commits to.

---

## §2 Logic worth keeping (non-screen)

### Already inside SlimeWorld — do not re-port

- **Tier economics.** `TIER_VALUE` {1:5, 2:22, 3:95, 4:300} and
  `computeBaseValue = max(1, round((colorVal + shapeVal) × (1 + variance)))`
  — `archive/slimebreeder/src/utils/economics.ts:8-23` — are ported
  verbatim in `games/slimeworld/breeding.lua:65-82`, including the
  archive's exact tier tables (`COLOR_TIERS`, `SHAPE_TIERS` minus
  `Crystal`, plus `Gray` added at T1). Pinned by
  `tests/test_slimeworld_tier_economics.py` against the TS formula.
- **Wanderer request generator.** Constants, requirement rolls, and the
  `color_tier × shape_tier × 10 × premium` reward are identical:
  `archive/slimebreeder/src/utils/requestGenerator.ts` ⇔
  `games/slimeworld/codex.lua:79-105`.
- **Donor-consumption breed semantics.** Archive
  `gameStore.ts:156-181` ⇔ `games/slimeworld/territory.lua:150-157`
  (`consumed_slime_id` even preserves the lineage record).
- **Discovery-gated acquisition.** Archive "hatch only from discovered
  pool" (`slimeGenerator.ts:20-21`) ⇔ `derive_purchasable_colors`
  (`games/slimeworld/economy.lua:95-120`).

### Present in the archive, absent in SlimeWorld — candidates for step 2

- **Regent reward table** — `DISCOVERY_REGENT_REWARDS` {T2:5, T3:15,
  T4:40} (`archive/slimebreeder/src/config.ts:21-25`) and award sites
  (`archive/slimebreeder/src/store/gameStore.ts:212-226`). SlimeWorld has
  the inventories and the first-match moments but no award hook.
- **Regent lock cost curve** — `REGENT_LOCK_COST` {T1:2, T2:5, T3:12,
  T4:25} (`archive/slimebreeder/src/config.ts:27-32`). SlimeWorld's
  regent *purchase* prices are computed in
  `ts/src/games/slimeworld/gameLogic.ts` (`getColorRegentCost`,
  `getTargetRegentCost`) — different curve, different role (purchase vs
  lock). If the earn loop is ported, reconcile which curve governs
  earned-vs-bought balance.
- **Per-slime value variance** — fresh ±0.10 roll per slime
  (`archive/slimebreeder/src/utils/slimeGenerator.ts:22`,
  `archive/slimebreeder/src/utils/breedSlimes.ts:44`) feeding
  `actualValue`. SlimeWorld's `calculate_tier_value` accepts a `variance`
  parameter (`games/slimeworld/breeding.lua:77-82`) but no per-slime
  variance is stored, so every same-tier slime is worth the same.
- **Tier-scaled passive yield** — `DISPLAY_BASE_RATE × colorTier ×
  shapeTier` (`archive/slimebreeder/src/config.ts:4`,
  `archive/slimebreeder/src/store/gameStore.ts:299-312`) vs SlimeWorld's
  flat 5 Cr (`games/slimeworld/codex.lua:8-13`).

### Reference data (port as data only, or simply cite in step-2 directives)

- **Spec balance tables** — `archive/slimebreeder/docs/specs/economy_and_progression.md`:
  hatch cost per tier {5,15,50,150}, display yield formula and hourly
  pacing table, pen cap 30 with ~1.2× curve, tank/display unlock gates
  tied to T3/T4 discovery, diminishing discovery rates {40,25,5}%, and
  curated legendary combos. *None of this shipped in the archive itself* —
  it is design intent. Useful as the balance vocabulary for tuning
  SlimeWorld's `calculate_breeding_cost`
  (`games/slimeworld/breeding.lua:87-90`, self-described placeholder) and
  worker-income scaling.
- **Earlier genetics iteration** —
  `archive/slimebreeder/docs/superpowers/specs/2026-04-11-breeding-design.md`
  documents the pre-recipe model (15% mutation, tier increment capped at
  T3). Shipped code replaced it; historical interest only.
- **Persistence discipline** — `archive/slimebreeder/src/db/db.ts` shows
  the archive's real habit worth emulating: sequential schema versions
  with explicit upgrade handlers, including trait-name remaps
  (`Blob→Circle`, `Spiked→Triangle`, `Elongated→Teardrop`) applied to
  slimes, display snapshots, *and* tank snapshots. Not portable code; a
  pattern to copy if SlimeWorld's serialized state
  (`ts/src/games/slimeworld/types.ts:184-201`) ever needs versioning.

---

## §3 Archived tests vs SlimeWorld coverage

| Archive test | Covers | SlimeWorld equivalent | Verdict for step 2 |
|---|---|---|---|
| `archive/slimebreeder/src/__tests__/economics.test.ts` | Tier-value formula at 0 variance (10/44/190/600) and variance clamp | `tests/test_slimeworld_tier_economics.py` asserts the same values against `games/slimeworld/breeding.lua` | Already covered — no port needed. |
| `archive/slimebreeder/src/__tests__/breedSlimes.test.ts` | Same-trait passthrough, recipe fire, already-discovered flag, 60/40 fallback, offspring structure/unique IDs | SlimeWorld genetics are continuous (`games/slimeworld/breeding.lua`); recipe semantics don't exist | Do not port as-is. Relevant only if step 2 ever reintroduces discrete recipes (this audit recommends against). |
| `archive/slimebreeder/src/__tests__/slimeGenerator.test.ts` | Discovered-pool sampling, regent lock forcing | Pool-gating is covered by `tests/test_slimeworld_seed_purchase_restrictions.py` (region-gated colors); lock-forcing has no analog | Port the *lock* cases only if the regent earn/spend loop lands — then they map to "regent nudge produces target genetics." |
| `archive/slimebreeder/src/__tests__/gameStore.test.ts` | 20 cases: hatch start/resolve, pen-full guard, tank upgrade, sell, display assign/unassign (variance preserved), breed donor consumption + tank occupation, discovery load | Donor consumption exercised via `initiate_breeding` tests (`tests/test_slimeworld_*`); capacity guard and petition flow have Lua/pytest coverage | Portable cases are the display-slot semantics (remove-from-roster, restore-with-value-intact) and request dismissal — port those specific cases only if the matching features land. |
| `archive/slimebreeder/src/__tests__/SlimeVisual.test.tsx` | Render smoke per trait def | `tests/test_slimeworld_polygon_relocated.ts` + `ts/tests/test_slimeworld_*` cover the procedural renderer | Drop — different art model. |
| `archive/slimebreeder/src/__tests__/setup.ts` | Test environment setup | N/A | Drop. |

---

## §4 Proposed step-2 scope (ordered, directive-sized)

Ordered by independence and risk — each item is small enough for its own
directive. **VR** = player-visible change requiring visual review before
publishing.

1. **Discovery → Regent award loop** *(no new UI; counters change — low
   visual impact, no VR gate, but log/toast copy should be reviewed
   once).* Award typed regents when a bred slime first matches a
   color/shape/accent target (and optionally on region unlock), scaling
   by target tier along the `DISCOVERY_REGENT_REWARDS` curve
   (`archive/slimebreeder/src/config.ts:21-25`). Hook points already
   exist: `match_color_target`/`match_shape_target` results are recorded
   on the child (`games/slimeworld/territory.lua:131-132`) and region
   unlocks return a list (`games/slimeworld/regionlock.lua:111-125`).
   Decide in-directive whether earned regents use the existing typed
   inventories (`types.ts:112`, `App.tsx:171`) — recommended yes.
2. **Petition Decline action** *(VR — new button in `EconomyTab`).*
   Restore `dismissRequest` semantics: remove a wanderer petition;
   regeneration happens on next `advance_cycle` (archive regenerated
   immediately — pick one, immediate is closer to archive behavior).
   Lua: extend `codex.lua` petition functions; UI: Decline button on the
   petition card in `ts/src/games/slimeworld/components/EconomyTab.tsx`.
3. **Tier-scaled market valuation** *(VR — sale prices change;
   balance sign-off from Robert required).* Route the already-present
   `calculate_tier_value` (`games/slimeworld/breeding.lua:77-82`) into
   sale pricing — e.g. tier value × level scaling × the existing flood
   multiplier in `calculateMarketPrice`
   (`ts/src/games/slimeworld/gameLogic.ts:12`). Optionally reintroduce
   per-slime variance (±0.10, `slimeGenerator.ts:22`) so same-tier
   specimens differ in worth.
4. **Tier-scaled worker income (display-room descendant)** *(VR — income
   numbers and any label copy change).* Scale `calculate_worker_income`
   (`games/slimeworld/codex.lua:8-13`) by the slime's snapped tier
   (`snap_to_faction`/`snap_to_shape_name` + `TIER_VALUE`) instead of
   flat 5, preserving autofeeder/culture multipliers. This restores the
   archive's sell-vs-showcase tension without adding a display-room
   screen.
5. **Decision directive — two open questions for Robert** *(no code).*
   (a) Is a literal display/gallery surface wanted on top of the Worker
   role? This audit recommends *no* — #4 covers the mechanic without a
   new screen. (b) Should petition targets prefer codex-discovered
   traits (archive behavior, `requestGenerator.ts:6-8`) or stay global
   (current `codex.lua:84-85`)? Current behavior gives aspiration
   targets; archive behavior was better tutorialization. Both are
   product calls, not engineering calls.

**Explicitly out of scope for step 2** (recommend `drop`, do not write
directives): real-time incubation and tanks (§1 #6–7), discrete recipe
genetics and the T3/T4 color names (#2–3, #5), the Dexie persistence
layer (#22), and archive UI components — SlimeWorld's visual model and
shared `artGen`/`ui` layers supersede them.

---

## §5 Verdict

The merge is substantially complete on mechanics: breeding, codex,
market petitions (a literal formula port), capacity expansion, roster,
and picker/visual surfaces are all absorbed. The continuous genetics
model plus the 19-lock region map (`games/slimeworld/data.yaml:296-319`)
is a deliberate superset of SlimeBreeder's discrete trait tree — the
archive's real remaining value is its *economy glue*: the
discovery→regent reward loop, tier-scaled valuation at sale time,
tier-scaled passive income, and petition dismissal. Those four port
candidates, plus the spec's balance tables as reference data, are the
whole of the step-2 scope this audit recommends.
