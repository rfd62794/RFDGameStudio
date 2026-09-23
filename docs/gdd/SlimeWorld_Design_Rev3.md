# SlimeWorld — Design.md, Revision 3

*August 2 2026 | Builds on Revision 2 (August 1 2026). Revision 2 gave the
game a thesis but no real access structure — the Conquest/Fealty tension
it locked turned out to have a real flaw (named and corrected in this
revision), and Robert's own real redirect this session moved the game's
actual center of gravity from a moral choice between two paths to a
single, cyclical mastery loop: breed toward understanding, and
understanding is what lets you in. This revision names that loop for the
first time, locks the map and content structure underneath it, and is
honest about what's still open rather than presenting a false sense of
completeness.*

---

## The One Sentence Everything Gets Tested Against (Revised — confirm before treating as locked)

**Proposed, synthesized from this session's real design conversation, not
yet Robert-confirmed the way Rev 2's sentence was:**

**You prove you belong somewhere by becoming, however briefly, something
that place would recognize — and once you have, it never asks again.**

This replaces Rev 2's Conquest-vs-Fealty framing outright, not
alongside it. The reason is real and specific, not a style preference:
Rev 2's own thesis required Conquest to be a genuine, standing temptation
— a path a player might reasonably keep choosing — while simultaneously
being mechanically described as strictly worse in every dimension except
speed (permanently vulnerable, "never actually finishes," versus Fealty's
permanent, final resolution). A choice where one option is secretly
correct isn't uncertainty, it's a lesson learned once. Rev 2's own
"real, unresolved tension" note admitted this and never resolved it. This
revision doesn't try to fix that tension — it moves to a different
thesis that doesn't require it.

---

## Correction to Revision 2 — Culture Favors' real mechanics

Rev 2 described Culture Favors as "fulfilled via Dispatch (reduce
pressure) or Disposal." Confirmed false against real source this
session: `launch_dispatch` operates on `zone_id`/`state.zones`, a system
disconnected from territory nodes entirely, and touches neither
`node.pressure` nor `culture_relationships`. The resolver that actually
touches territory nodes, Mediation, only ever modified `node.strength`.
Disposal didn't exist in source at all. **This has since been built for
real** — Culture Favors & Fealty is now genuinely implemented (see
Systems, Already Real, below) — but the correction is recorded here so
no future session inherits Rev 2's original, incorrect description of
how it works.

Rev 1's Legacy Slime correction (one Legacy slot per Color, +2% passive
stat bonus, unlocked via Elder retirement — not "carries forward to
offspring on death") remains correct and unchanged.

---

## The Core Loop — Unification of Beliefs

Not conquest. Not a binary moral choice. A single, cyclical
transformation chain, named explicitly this session as the thing Rev 2's
design was reaching for without naming:

**Breed toward a region's real combination → the region unlocks,
permanently → its missions become accessible → missions occasionally
return new units, useful toward the next combination → breed further.**

This is a real cyclical chain per this studio's own systems-thinking
framework — output feeding back into input — and it's the first design
in SlimeWorld's history to actually commit to that chain archetype rather
than gesture at it. Every stage of it reuses real, already-tested code:
`breed_slimes`/`breed_shape`/`breed_accent` for the genetics, the
SlimeDex-style permanence pattern for "once unlocked, never re-locked,"
and the real (if currently untargeted) stray-spawn precedent in
`logic.lua` for missions returning new units.

**A region is "locked" to a Culture, or a Combo of Cultures** — not
narrative flavor, a real, checkable requirement on three genetic axes at
once (Color, Shape, Pattern — see below). Reaching a region unlocks it
forever. Missions at that region can carry their own additional
requirements beyond the initial unlock.

---

## The Three Axes — all genuinely bred, none decorative

Confirmed via direct source read this session, not assumed: Color, Shape,
and Pattern are not three separate systems bolted together — they're
cross-linked in the real breeding math. `breed_accent()` derives offspring
diffusion partly from shape complexity, and `accent_hue` directly from
offspring hue. A slime's whole genetic profile moves together.

- **Color** — hue/saturation, blended as the real circular midpoint of two
  parents, checked against 17 real named targets (6 Guild, 3 Rival, 6 Arc,
  2 Skip) already authored in `data.yaml`.
- **Shape** — vertex count/irregularity, 5 real tiers, from Triangle
  (Tier 1) to Prismatic (Tier 5).
- **Pattern** — diffusion (5 real bands, Solid through Ringed) and
  amplitude (2 real bands, Glow/Obsidian), plus one real outlier —
  Metallic, requiring a narrow window on both axes simultaneously, the
  single hardest target in the whole real dataset.

---

## The Map — 24 real nodes, 19 locked regions

Reuses the existing map almost entirely. Confirmed via direct read of
`planetRegion.ts`: 6 real Capitol nodes (free, home territory), 6 real
Frontier nodes, 8 real Midpoint nodes — 20 nodes total, with only 4 net
new required.

| Ring | Nodes | Real lock |
|---|---|---|
| Capitol (free) | 6 existing | None — home territory |
| Ring 1, Guild | 6 existing Frontier | 6 real Guild targets, one per adjacent-culture pair (Thornward, Amberglow, Frostwind, Mossy Crystal, Tidereign, Abyssal Ember), Shape Tier 1, Pattern diffusion 0–30 |
| Ring 2, Rival | 3 NEW nodes | 3 real Rival targets (Fault Line, Eclipse Void, Stormsurge), Shape Tier 2, Pattern diffusion 45–85 |
| Ring 3, Arc | 6 existing Midpoint | 6 real Arc-triad targets, Shape Tier 3, Pattern: Ringed |
| Ring 4, Skip | 2 existing Midpoint | 2 real Skip-triad targets, Shape Tier 4/5, Pattern split — one Glow, one Obsidian |
| Convergence (capstone) | 1 NEW node | All 6 Ring-4 prerequisites, plus the Metallic accent |

Every real Color/Shape/Pattern target in the game's existing content is
used exactly once. Nothing invented beyond the 4 net-new nodes needed to
represent content types (opposite-pair mixes, dual-axis convergence) that
the original map geography had no room for.

---

## Systems, Already Real (built and independently verified this session)

**Culture Favors & Fealty.** Confirmed via direct grep and a live pytest
run: `favors.lua` real, `generate_favors`/`resolve_disposal`/
`check_fealty_transition` all present. `fealty_locked` nodes are
genuinely exempted from pressure, revolt, and cascade-collapse logic in
`codex.lua`. 563 Python / 257 TypeScript passing at last independent
check.

**Real, open architectural question this revision surfaces rather than
silently resolves:** Culture Favors/Fealty operates on the same map
nodes as Region Lock-Down, but as a different axis — ongoing territorial
pressure/ownership, versus Region Lock-Down's permanent mission-access
gate. The two systems don't currently conflict (Fealty affects
`owner_color`/`pressure`; Region Lock-Down affects a separate
`region_unlocks` state), but their relationship has never been explicitly
decided: is territorial Conquest/Fealty a secondary depth layer available
under the main breeding loop, or does it need to be more tightly wired
together later? Left open on purpose — confirm before either directive's
follow-on work assumes an answer.

---

## Systems Specified This Revision (directives written, not yet executed)

**Region Lock-Down** (`docs/gdd/SlimeWorld_RegionLockDown_Directive.md`).
Authors all 19 real region locks, adds the 4 new nodes, builds the
breeding-match unlock resolution and the mission-eligibility gate.

**Demo Scope & Onboarding** (`docs/gdd/SlimeWorld_DemoScope_Onboarding_Directive.md`).
Narrows the demo to a real, concrete critical path — Ember capitol, its
two Guild neighbors (Thornward, Abyssal Ember) — without reducing the
full 19-region structure underneath. Onboarding reuses three real,
already-tested RFD conventions rather than inventing new UX structure:
KingMaker's New Game/Continue split, Dissonance's teaching-deferred-and-
optional discipline, VoidDrift's trigger-based tutorial with its New Game
Guard.

---

## Explicit Cuts / Deferred, Updated

**Resolved, not just deferred — Lab Level.** Rev 2 scoped Lab Level as a
system gating which tier of breeding target is attemptable. That job is
now literally embodied by the Region Lock-Down ring structure (Guild →
Rival → Arc → Skip → Convergence is a real difficulty ladder). Lab Level
as a separate system is superseded, not merely postponed.

**Still genuinely deferred, unrelated to the core loop:** Loyalty,
Season/Culture rotation, Squad Leaders, Training-as-a-separate-system, a
second real-time clock. None of these serve the current thesis; revisit
only after the core loop is proven to land with a player.

---

## Real Open Questions, Consolidated (do not silently resolve any of these)

1. What "region rewards remain tethered" concretely means — Robert's own
   phrase, deliberately undefined. Until answered, unlocking a region
   grants mission access only, nothing else.
2. Mission-reward unit bias — toward a specific authored next-region, or
   nearest/closest-match. Recommended default: nearest-match.
3. Relationship/progress display — raw internal value, or a stepped
   player-facing number (Cassette Beasts' own 1–5 bond level is real
   precedent for the latter).
4. Whether Dispatch's zone system needs an equivalent access gate to
   territory nodes, or is legitimately a separate system.
5. Culture Favors/Fealty's long-term relationship to Region Lock-Down —
   secondary depth layer, or needs tighter integration later.

---

## MVP / Demo Scope

Ember capitol as sole starting point. Two required unlocks — Thornward
and Abyssal Ember. Demo-complete: both unlocked from an Ember start, not
either alone. Everything else in the 19-region structure stays real and
reachable, just not required or surfaced first — reusing Cassette Beasts'
own real precedent (only 1 of 6 traversal abilities sits on that game's
critical path; the rest gate optional depth).

---

## Recommended Build Order — Status

1. **Stage, made real** — COMPLETE, certified (Rev 2).
2. **Culture Favors & Fealty** — COMPLETE, independently verified this
   session (563/257).
3. **Region Lock-Down** — directive written, not yet executed.
4. **Demo Scope & Onboarding** — directive written, depends on #3, not
   yet executed.

---

*SlimeWorld Design.md, Revision 3 | RFD IT Services Ltd. | August 2 2026*
*One thesis replaced, honestly, for a real structural reason rather than
polish. One correction carried forward. Two real systems built and
verified. Two more fully specified. Five real questions left open on
purpose, not buried.*
