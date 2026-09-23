# PlanetOfGreed — Design.md
*August 2026 | New project, own repo/example directory. Built fresh, using CorpWorld's proven mechanical shell as a one-time starting scaffold (not a live dependency — ADR-005 applies: this becomes its own independently-evolving codebase from day one, not shared code with CorpWorld). Chapter 1 of the five-chapter demo canon.*

*Working title. "PlanetOfGreed" / "WorldOfGreed" both live in prior conversation — not locked.*

---

## Vision

You already know how this ends — the corporations you're about to run
are the reason the planet dies. You're not the villain finding that
out halfway through. You're the villain who already knows, playing
anyway, because the game hasn't given you a way to stop and the
credits are real.

You pick a House. The moment you do, your hardest rival is already
placed as far from you as the map allows — not randomly, by design,
the same rivalry every playthrough. You start ranked last. Climbing
means either outgrowing everyone, or walking straight at the House
above you and taking their rank by force. Either way, every choice —
what you fortify, what you strip-mine, who you crush versus who you
starve slowly — is quietly writing the reason a distant descendant,
generations later, will wake up and not know why their world ended.

---

## Core Loop

**Weekly Planning Phase** (real decision point — issue Hold / Expand /
Reinforce / Fortify / Scan / Civic orders per owned cell, exactly as
CorpWorld's proven system already does) → **Daily simulation ticks**
(transits arrive over 4 days, Boardroom Events fire at ~12% daily
chance with real multi-choice consequences) → **Monthly combat**
(contested cells resolve via RPS with fortification, greedy
best-counter AI targeting) → **Annual Report** (Rank recomputed from
Territory + Population Balance, not territory alone) → repeat across a
3-year campaign → **Final Rank locks in**, feeding forward narratively
into what The Corporation becomes by Chapter 5.

**The one new layer this design adds on top of CorpWorld's proven
loop:** Rank isn't a leaderboard stat, it's a status you can take by
force. Defeating the House specifically ranked above you — not just
outgrowing the field generally — is a real, distinct path to climbing,
alongside simple territorial growth.

---

## Design Pillars

- **Proven Shell, New Stakes** — CorpWorld's weekly-order economy,
  RPS-with-fortification combat, and Boardroom Event system stay
  mechanically intact, cited and reused deliberately, not reinvented.
  What's new is what all of it now means.
- **The Wheel Is Fate, Not Randomness** — capital placement is
  deterministic by culture choice, using the real, already-locked
  six-culture wheel (Ember→Marsh→Gale→Tundra→Crystal→Tide). You know
  your rival before you make a single move, every playthrough.
- **Rank Is Not Territory Alone** — Population Balance, adapted from
  Kingmaker's real, tested Loyalty/`publicOpinion` formula, counts
  toward standing as much as land does. The human cost of your
  strategy is a real number, not flavor text.
- **Climb By Conquest, Not Just Growth** — Menzoberranzan-derived:
  defeating the House ranked directly above you is a real, targeted
  win-path, distinct from generally outgrowing the field.
- **Greed Writes Its Own Ending** — this is Chapter 1 of a longer
  story. The campaign's 3-year end state isn't just a final score —
  it's the reason the next chapter's world is already dying.

---

## World

**One noun: the Planet.** Unnamed, generic-scale, deliberately
consistent with CorpWorld's existing framing ("Planetary Land Grab") —
36 Voronoi-generated sectors, six Houses carving it apart from six
capital points.

**Player relationship:** director, not embodiment — the player issues
weekly orders across their controlled territory, exactly as CorpWorld
already models it. No single avatar exists at this scale; that's
Chapter 2's register (Facility Escape), not this one's.

---

## Entities

### House (formerly "Corporation")
- **Role:** One of six culture-coded factions competing for the
  Planet. Five AI-controlled, one player-controlled — same "N AI + you"
  shape already proven in Kingmaker Squads.
- **Player relationship:** The player directs one House's weekly
  orders. AI Houses currently run CorpWorld's real, confirmed logic:
  a flat `Math.random()` roll across four fixed probability bands
  (40% Expand / 20% Reinforce / 20% Fortify / 20% Idle), with **zero
  rival-identity awareness** — target selection is uniformly random
  among a cell's map-neighbors, no ownership filter. This is
  deliberately named here as a real, confirmed limitation, not a
  design choice — see MVP Scope for whether it's upgraded.
- **Visual signature:** Culture-coded per the six-wheel identities
  (Ember/Marsh/Gale/Tundra/Crystal/Tide) — naming and color only at
  this phase, no mechanical stat asymmetry (see Resource Economy).
- **Progression:** Rank (1st–6th), computed from Territory + Population
  Balance, changeable via growth or targeted displacement.

### Cell (Sector)
- **Role:** The territorial unit — one of 36 Voronoi-generated regions,
  each with a garrison (pooled Circle/Square/Triangle unit counts,
  never individually tracked — confirmed structural difference from
  Kingmaker's per-unit model, and deliberately not changed here), a
  fortification level (0–3), and an owner (or neutral).
- **Player relationship:** Directed via weekly orders, never directly
  controlled in real time.

---

## Resource Economy

**Treasury** — Source: $10,000/week per controlled cell (CorpWorld's
real, unchanged rate). Sink: Reinforce ($30k), Fortify ($20k), Scan
($5k), Civic-Defense-focus ($10k) — all real, existing costs, reused
directly.

**Units (Circle/Square/Triangle)** — Source: passive production (1 per
2 weeks per cell, doubled by Civic-Production-focus) and Reinforce
orders. Sink: combat losses, Expand deployments. RPS relationship:
Circle beats Square, Square beats Triangle, Triangle beats Circle —
unchanged from CorpWorld.

**Fortification** — Source: Fortify orders and Civic-Defense-focus.
Sink: combat losses. Caps at level 3, unchanged.

**Territory** — Source: successful conquest or uncontested neutral
claim. Feeds Rank directly, alongside Population Balance.

**Population Balance** *(new this design, adapted not invented)* —
Source/Sink: modeled on Kingmaker's real, tested allegiance-modulated
erosion formula (`newLoyalty = currentLoyalty - erosionRate ×
allegianceModifier`, where the modifier scales 0.5×–1.5× based on how
neutral-to-hostile the population's standing is). Real, unresolved
design question carried forward: what specific player actions raise
or lower it (aggressive Expand vs. Civic-Production focus is the
obvious candidate pairing, not yet locked).

**Rank** — Derived status, not directly spendable. Computed from
Territory + Population Balance jointly. Changeable through general
growth, or through targeted displacement of the House ranked
immediately above.

---

## Session Design

| Session Length | What the player produces |
|---|---|
| 2 minutes | Checks daily tick progress; resolves a Boardroom Event if one's active — a complete, self-contained micro-decision either way |
| 5 minutes | Completes a full Weekly Planning Phase — real orders issued across all owned cells |
| 15 minutes | Plays through several weeks, likely reaching a Monthly Combat resolution and a real, visible Rank change |

---

## UI Architecture

Base layout inherited directly from CorpWorld's proven 3-column
structure — Weekly Directives (left), Planet Map (center), Boardroom
Intel Feed (right) — because it already works and there's no reason to
redesign a UI that's shipped and functional.

**New element, this design's actual addition:** a Rank/Rivalry header
panel (slotting into `BoardroomHeader`'s existing position) showing
current Rank, the identity of both the House directly above (your next
target) and your wheel-locked rival, and current Population Balance.

---

## MVP Scope

### Included
- Six real culture-coded Houses (1 player-selectable, 5 AI), replacing
  CorpWorld's five generic corp identities
- Wheel-order capital placement (Ember→Marsh→Gale→Tundra→Crystal→Tide),
  replacing CorpWorld's greedy farthest-point placement
- Ember/Tundra hard-locked rivalry, guaranteed maximum map distance
- Symmetric starting conditions across all six Houses — treasury,
  garrison, combat strength identical, per explicit design decision
- Rank tracking: Territory + Population Balance, computed at each
  Annual Report
- Targeted displacement: defeating the House ranked directly above
  triggers a real rank swap
- CorpWorld's full existing mechanical shell, reused directly: weekly
  orders, RPS combat with fortification, Boardroom Events, Voronoi map,
  3-year campaign structure

### Explicitly Deferred
- **In-play stat modifiers tied to culture identity** (Ember=combat
  bonus, Tundra=fortification bonus, etc.) — real, unresolved design
  question, not built until decided
- **Upgrading AI decision logic beyond CorpWorld's current pure-random
  model** — a real, separate, larger design/build decision (does
  PlanetOfGreed's AI get genuine rival-awareness for the first time,
  or keep CorpWorld's current randomness at six Houses instead of
  four?) — not resolved by this document, flagged for a real decision
  before Phase 2 implementation
- **Kingmaker's individually-tracked-unit combat and tactical
  placement layer** — confirmed by the merge audit as non-portable;
  CorpWorld's pooled-count model stays as-is
- **Narrative/Signal content** (the Astronaut, Signal's selection,
  Genesis Ore's explicit naming in-game) — belongs to this chapter's
  framing device and later chapters, not this chapter's core simulation
  loop itself

---

## Platform Targets

React/Vite, matching the studio's existing standalone build pipeline.
New project home: `examples/planetofgreed/` (working directory name,
not locked), eventually registered in `ts/src/games/registry.ts` and
`studio_mcp/game_metadata.py`'s `GAME_PATHS` once real — learning
directly from tonight's earlier finding that Dissonance and SlimeWorld
shipped without ever being added to that registry.

---

## Technical Notes

**This is a new, independent codebase, not a live fork.** CorpWorld's
real source (`examples/corpworld/src/App.tsx`, `mapGenerator.ts`,
`combat.ts`, `types.ts`) is the correct starting scaffold — copied
once as a foundation, then diverged — because it's real, tested,
proven code that solves Voronoi map generation, RPS combat resolution,
and a working event system, none of which need re-solving from
scratch. Per ADR-005, this is a one-time fork into a new, independently
evolving project — not an ongoing shared dependency between CorpWorld
and PlanetOfGreed. CorpWorld itself stays completely untouched, still
live, still itself.

**Kingmaker's contribution is pattern, not code**, per the merge
audit's own findings: the six-entity wheel shape and the general
concept of a locked relational topology transfer as design intent.
Kingmaker's actual implementation — `DefenseForce`, `crownLogic.ts`'s
coronation system, individually-tracked `UnitState` — does not port
and isn't attempted here. The Population Balance formula specifically
is the one piece of Kingmaker's real code confirmed portable as
arithmetic (`loyaltyLogic.ts:74-81`) — reused as a formula, rewired
into CorpWorld-native data (`MapCell`, not `DefenseForce`).

**No existing test suite in the CorpWorld scaffold** — confirmed
during Phase 1 investigation, only `tsc --noEmit` via lint. Whatever
verification approach a real implementation phase adopts needs to
account for this rather than assume a floor exists to check against.

---

*PlanetOfGreed | Design.md v0.1 | RFDGameStudio | August 2026*
*Two real games, honored in full — one as mechanical foundation, one as structural intent. Neither copied. Both alive.*
