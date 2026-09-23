# SlimeWorld — Directive: Region Lock-Down (Map Data + Breeding-Gated Access)

*August 2 2026 | Read `docs/gdd/SlimeWorld_Design_Rev2.md` AND this session's real, already-landed Fealty & Culture Favors work before touching anything. This directive builds directly on top of `favors.lua`, `culture_relationships`, and `fealty_locked` — all confirmed real and live on disk as of this directive's kickoff, spot-checked via direct grep + a live pytest run, not assumed from a report.*

---

> ⛔ **STOP:** Run the full suite before touching anything.
> Python: must report **563 passing, 0 failing, 0 skipped** — confirmed
> live at this directive's kickoff (167s run).
> TypeScript: must report **257 passing, 0 failing, 0 skipped**
> (251 pre-Favors + 6 real Favor/Disposal/Fealty bridge tests added this
> session) — re-confirm live, do not trust the prior session's number
> without re-running; that prior session's own first TS run showed 8
> flaky failures before stabilizing, so run it twice if the first pass
> shows anything but a clean 257.
>
> ⚠️ RULE (project-standing): Real TS→Lua→TS bridge tests only, never
> Lua-only.

---

## §0 Context

Across this design conversation, the demo direction converged on a single
real mechanic, superseding the earlier Conquest/adjacency-gating idea
floated mid-session: **a Region on the map becomes permanently accessible
the moment the player breeds a slime matching that Region's locked
Color/Shape/Pattern combo.** Not conquest, not adjacency to owned
territory — breeding achievement is the gate. This reuses real, existing
genetics math (`breed_slimes`, `breed_shape`, `breed_accent` in
`breeding.lua`) and the real, existing SlimeDex permanence pattern
(`colorTargetCodex` — once decoded, decoded forever) rather than inventing
a new achievement-tracking system from scratch.

**Real content inventory this directive locks into the map, all confirmed
via direct read of `games/slimeworld/data.yaml`:**

- 6 real Color capitols (Ember/Red, Marsh/Orange, Gale/Yellow,
  Tundra/Green, Crystal/Purple, Tide/Blue) — free, unlocked from game start,
  unchanged.
- 6 real Guild-tier color targets (`guild_ember_marsh` "Thornward" through
  `guild_tide_ember` "Abyssal Ember") — one per adjacent culture pair.
- 3 real Rival-tier targets (`rival_ember_tundra` "The Fault Line",
  `rival_marsh_crystal` "Eclipse Void", `rival_gale_tide` "Stormsurge") —
  opposite-pair mixes, no existing map node represents this contest type.
- 6 real Arc-triad targets, 2 real Skip-triad targets.
- Real Shape tiers 1–5 (`data.yaml:242-264`), real Accent diffusion bands
  (Solid/Polka/Stripe/Nebula/Ringed) and amplitude bands (Glow/Obsidian),
  plus the one real dual-axis outlier, Metallic (`diffusion 43-47` AND
  `amplitude 68-72` simultaneously — the single narrowest target in the
  whole real dataset).

**Real map topology this directive extends, confirmed via direct read of
`ts/src/games/slimeworld/planetRegion.ts:273-298`:** 6 Capitol nodes, 6
Frontier nodes (each already a real neighbor of exactly 2 capitols — reuse
these for the 6 Guild locks unchanged), 8 Midpoint nodes (reuse 6 for Arc,
2 for Skip). **4 net-new nodes required, added to the real `nodeDefs`
array in the same file:** 3 Rival nodes (no existing node represents an
opposite-pair contest) and 1 capstone node, **The Convergence**, gated
behind full completion of the Skip tier, locked to the Metallic accent.

**Full region-lock table this directive must author as real data** (do not
invent IDs beyond what's below — every color/shape/pattern reference must
resolve to something that already exists in `data.yaml`):

| Node (existing unless marked NEW) | Locks to real target |
|---|---|
| node_ember, node_marsh, node_gale, node_tundra, node_crystal, node_tide | Free, unlocked at start |
| node_frontier_a→f (Ring 1, Guild) | `guild_ember_marsh` … `guild_tide_ember` (all 6, one each), Shape Tier 1, Pattern: diffusion 0–30 (Solid/Polka) |
| **3 NEW nodes (Ring 2, Rival)** | `rival_ember_tundra`, `rival_marsh_crystal`, `rival_gale_tide`, Shape Tier 2, Pattern: diffusion 45–85 (Stripe/Nebula) |
| node_mid_a→f (Ring 3, Arc, 6 of 8 existing Midpoints) | 6 real `arc_*` targets, Shape Tier 3, Pattern: diffusion 85–100 (Ringed) |
| node_mid_g, node_mid_h (Ring 4, Skip, remaining 2 Midpoints) | `skip_ember_gale_crystal` / `skip_marsh_tundra_tide`, Shape Tier 4/5, Pattern: **split** — one requires amplitude 0–35 (Glow), the other 70–100 (Obsidian) |
| **1 NEW capstone node, The Convergence** | Requires: all 6 Ring-4-tier prerequisites already unlocked (real gate, see §2c) + Metallic accent (diffusion 43–47 AND amplitude 68–72) |

**Explicitly NOT this directive's job — a real, separate later pass:**
deciding which of these 19 locked regions the shipped demo actually
exposes to a player. This directive builds the full, real structure. The
"narrow player access" cut is deferred on purpose, per Robert's own
explicit instruction this session — do not pre-emptively hide or gate any
of the 19 regions behind a demo-scope flag as part of this work.

**Two real, unresolved judgment calls — do not invent silently, propose
and report:**

1. **Mission-reward unit bias.** There's a real existing precedent for a
   mission spawning a new unit (`logic.lua`'s stray-refugee spawn), but it's
   currently untargeted/random. Should a completed mission's returned unit
   be biased toward the *specific next authored region in a fixed chain*,
   or toward *whichever locked region is nearest/currently
   closest-to-match*? Recommended default: nearest/closest-to-match — no
   authored sequence needs to exist for this directive's real work to
   function, and it's the cheaper, more emergent option. Confirm this
   before implementing, report which was chosen.
2. **"Region rewards must remain tethered"** — Robert's own real
   instruction this session, deliberately left undefined pending further
   design. **Do not implement any reward beyond mission-access itself as
   part of this directive.** A region unlocking grants access to that
   region's missions — full stop. Do not add resource/credit/item rewards
   for unlocking a region; that's explicitly out of scope until a future
   session defines what "tethered" means.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/slimeworld/data.yaml` | Modify | Add a real `region_locks` list — one entry per non-capitol node, each referencing an existing `color_targets`/`shape_targets`/accent id by real ID, never inventing a new one |
| `ts/src/games/slimeworld/planetRegion.ts` | Modify | Add the 4 new node defs (3 Rival + Convergence) to the real `nodeDefs` array; recompute neighbors for the new nodes using the file's own existing neighbor-computation logic — do not hand-place neighbor lists |
| `games/slimeworld/regionlock.lua` (new file) | New | Region-unlock resolution: check a given bred slime's hue/saturation/vertex/irregularity/diffusion/amplitude against a region's real composite lock; on match, mark the region permanently unlocked in state (reuse the `colorTargetCodex` permanence pattern — once unlocked, never re-locked) |
| `games/slimeworld/missions.lua` | Modify | Real eligibility gate: `launch_exploration`/`launch_mediation` (and any real Dispatch-zone equivalent, confirm real applicability) must check the target node/region's real unlock state before allowing the mission to launch — currently these functions accept any `node_id` with zero eligibility check, confirmed via direct source read |
| `games/slimeworld/logic.lua` | Modify (narrow) | Wire `regionlock.lua`'s check into the real per-cycle resolution pass, alongside the existing Favor/Fealty checks already there |
| `ts/src/games/slimeworld/types.ts` | Modify | Bridge the new region-lock state (reuse/extend the `colorTargetCodex` bridging pattern already real for SlimeDex) |
| `ts/src/games/slimeworld/components/MissionsTab.tsx` | Modify (narrow) | Functional hookup only — locked regions show as real, visibly locked on the map/mission list; do not design a new screen. If a genuinely new UI surface seems required, stop and report rather than build one |
| `tests/*`, `ts/tests/*` | Modify | New anchors per §3 |

**Read-only — do not touch:** `favors.lua`'s real, already-tested Favor/
Disposal/Fealty logic (`generate_favors`, `resolve_disposal`,
`check_fealty_transition`) — this directive consumes that work, it does
not modify it. `colorTargetCodex`'s existing SlimeDex behavior — reuse the
pattern, don't alter the original system. `compute_stage`/`STAGE_THRESHOLDS`
(certified, unrelated). The 17 real color/shape/accent target definitions
themselves in `data.yaml` — reference them, never rename or renumber them.

---

## §2 Implementation

### §2a — `region_locks` data authoring

One real entry per non-capitol node (19 total), each a composite of a real
`color_target_id`, a real `shape_tier` (or specific `shape_target_id`),
and either a real `diffusion` band, `amplitude` band, or (Convergence
only) both plus a prerequisite list. Author this exactly per the table in
§0 — do not substitute or invent target IDs.

> ⚠️ RULE: Every ID referenced in `region_locks` must resolve to a real
> entry already present in `data.yaml`'s `color_targets`, `shape_targets`,
> or accent list. If any real ID from §0's table turns out not to exist
> exactly as named, stop and report — do not silently substitute a
> different real target to make the count work.

### §2b — Region-unlock resolution (`regionlock.lua`, new)

On a real, successful breeding event (hook into the same point in
`logic.lua`'s cycle where Favor/Fealty checks already run), check the
offspring's real hue/saturation against `match_color_target()` (already
real, reuse it), vertex/irregularity against `match_shape_target()`
(already real, reuse it), and diffusion/amplitude against the relevant
accent band (new matching logic, mirror the existing `find_accent_type`/
`find_accent_intensity`/`find_metallic_accent` pattern in `breeding.lua` —
reuse those functions directly rather than re-deriving the match logic).

If all three match a given region's real lock, mark that region
permanently unlocked in state — new field, e.g. `state.region_unlocks`,
bridged the same way `colorTargetCodex` already is.

> ⚠️ RULE: This is permanent, matching Robert's own explicit instruction
> ("reaching a region unlocks it forever"). No code path may re-lock a
> region once unlocked — this must be enforced the same way Fealty's
> 100%-relationship permanence is enforced (§2 of the Fealty directive):
> a real test guarding against regression, not just an assumption.

### §2c — Convergence capstone gate

The Convergence node's real lock requires BOTH the Metallic accent match
AND a real prerequisite check: all 6 real Ring-4/Skip-tier region locks
(`skip_ember_gale_crystal`, `skip_marsh_tundra_tide`, plus whichever nodes
were assigned them in §2a) must already be unlocked. This is the one real
place in this directive that needs an explicit multi-region prerequisite
check, not a single-region match — implement it as a real, testable
function, not inline logic buried in the resolution pass.

### §2d — Mission eligibility gate (`missions.lua`)

`launch_exploration`/`launch_mediation` currently accept any `node_id`
unconditionally — confirmed via direct source read, no eligibility check
exists today. Add a real check: the target node's region must be either
already-unlocked (per §2b) OR be one of the 6 free Capitol nodes. Fail
cleanly and report, do not silently no-op, if an ineligible node is
targeted.

> RULE: Confirm whether Dispatch (`launch_dispatch`, operates on
> `zone_id`/`state.zones`, a system separate from territory nodes) needs
> an equivalent gate. Per this session's own earlier finding, Dispatch
> doesn't touch territory nodes at all — it may be legitimately out of
> scope for this directive. Confirm and report rather than assume either
> way.

### §2e — Mission-reward unit bias

Per §0's flagged open judgment call — implement the recommended default
(bias toward nearest/closest-to-match undiscovered region) unless
confirmed otherwise before implementation begins. Extend the existing
stray-spawn precedent (`logic.lua:144`, `create_seed_slime`) rather than
building a second, parallel unit-spawn system.

---

## §3 Test Anchors

| Test name | Target | Behaviour |
|---|---|---|
| test_region_lock_data_references_real_targets | data.yaml / regionlock.lua | Every ID in `region_locks` resolves to a real, existing color/shape/accent entry |
| test_new_map_nodes_have_real_neighbors | planetRegion.ts | 4 new nodes get real, computed (not hand-placed) neighbor lists |
| test_region_unlocks_on_matching_breed | regionlock.lua | A bred slime matching a region's full composite lock → region marked unlocked, bridge-tested TS→Lua→TS |
| test_region_unlock_is_permanent | regionlock.lua | No code path re-locks an already-unlocked region |
| test_convergence_requires_all_skip_regions | regionlock.lua | Convergence stays locked until all 6 real Ring-4 prerequisites are met, even with a matching Metallic slime in hand |
| test_mission_blocked_on_locked_region | missions.lua | `launch_exploration`/`launch_mediation` cleanly refuse a target on a locked, non-capitol node |
| test_mission_allowed_on_unlocked_or_capitol | missions.lua | Real success case, both a Capitol target and a real newly-unlocked region |

Target: **X passing, 0 failing, 0 skipped**, X = 563 + 257 pre-flight floor
plus new anchors above.

---

## §4 Completion Criteria

- [ ] `region_locks` real data authored for all 19 non-capitol nodes,
      every ID confirmed to resolve to real existing content
- [ ] 4 new map nodes real, with real computed neighbors, not hand-placed
- [ ] Region-unlock resolution confirmed real and permanent via test, not
      code inspection alone
- [ ] Convergence's multi-region prerequisite gate confirmed real via test
- [ ] Mission eligibility gate confirmed real: locked nodes cleanly refuse,
      unlocked/Capitol nodes succeed
- [ ] §2e's mission-reward bias decision reported explicitly with reasoning
- [ ] No reward beyond mission-access implemented for unlocking a region —
      confirm via `git diff` that no credit/resource/item reward logic was
      added as part of this directive
- [ ] Full suite green: real floor reported, Python + TypeScript
- [ ] `docs/state/current.md` updated with the real new floor and phase name
- [ ] `git diff --stat` confirms only §1's files touched; `favors.lua`,
      `colorTargetCodex`'s original logic, and the 17 real target
      definitions in `data.yaml` confirmed untouched

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Real access mechanic | Breeding-match unlock, not conquest/adjacency — supersedes an earlier idea floated mid-session |
| Total regions locked by this directive | 19 non-capitol (6 Guild + 3 Rival + 6 Arc + 2 Skip + 1 Convergence), 6 Capitols free |
| Net-new map nodes required | 4 (3 Rival, 1 Convergence) |
| Real precedent reused for permanence | `colorTargetCodex` (SlimeDex) |
| Real precedent reused for mission-reward units | `logic.lua`'s stray-refugee spawn, currently untargeted |
| Explicitly deferred, not this directive | Which of the 19 regions the shipped demo actually exposes |
| Explicitly out of scope until defined | Any reward for unlocking a region beyond mission access itself ("tethered" — undefined) |
| Confirmed real, load-bearing dependency | `favors.lua` (`generate_favors`, `resolve_disposal`, `check_fealty_transition` all confirmed present via direct grep this session) |
