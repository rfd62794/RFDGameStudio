# ADR-014: Shared Engine Modules Are the Default, Not the Exception

**Status:** Accepted
**Date:** August 15, 2026
**Supersedes:** Narrows ADR-009's scope limit ("does not authorize sharing
game-specific rules by default"). Does not touch ADR-011 (internal
logic-layer splitting) — extends its "future trigger" framing into a
concrete standing practice instead of a case-by-case judgment call.
**Related:** ADR-005 (already superseded by ADR-009), ADR-007 (Primitive
Registry — this ADR reaffirms its model as correct, not superseded),
ADR-009, ADR-010, ADR-011, ADR-013.

---

## Context

ADR-005 said no shared binary. ADR-009 (July 17, 2026) already
superseded that for generic utilities — `collect`, `copy_table`,
`atan2` — but explicitly stopped short of game-system patterns
(genetics, market, odds, combat), reserving that for "a separate
decision." ADR-011 (July 2026) established that shared-engine
promotion happens when "a second game ever needs" a pattern already
split out by SRP — framed as a future possibility, not a standing
practice teams actively pursue.

Robert's direct clarification, August 15, 2026: **shared engine modules
were always the goal.** The demand-gated, audit-triggered pattern of
the last month wasn't a rejection of ADR-007's shared-engine vision —
it was that vision, applied inconsistently and never named as the
default. This ADR names it.

**Correction made during drafting, worth recording rather than quietly
fixing:** this ADR originally described Shoal's consumption of the
`artGen` module as an open gap needing a follow-up directive. Direct
file verification (not conversation-history research) showed that was
wrong — `ts/src/games/shoal/App.tsx` already imports and actively uses
`canvasTeardropFinPath`, `canvasRadialBurstPath`, and
`canvasIrregularFragmentPath`, with a full `art/shoal.config.ts`
(hunger-aware spec builders) and a path-caching/profiling layer on top.
`SlimeWorld`'s `SlimeVisual.tsx` also already consumes `artGen`
(`mulberry32`, `hashStringToSeed`, `renderPolygonPoints`), verified
byte-identical by its own tests. Both were done before this ADR was
written. See §"Proof case" below for what this actually means.

---

## Decision

**Every new demo, in either runtime, checks the shared engine layer
first and contributes back to it as a matter of course — not as an
exception requiring separate justification each time.**

### "Feeds forward and backwards," concretely

**Forward:** Before writing new game logic, check `engine/primitives/`
and `engine/systems/` (Lua) or `ts/src/engine/shared/` (TypeScript) for
an existing pattern. Use it. Don't reimplement what's already there
because checking felt like extra ceremony.

**Backward:** When a demo needs a genuinely general capability —
recognized during development, not required to be foreseen from day
one — and a real second use is already known or clearly likely (not
pure speculation), build it directly into the shared layer instead of
locally-then-extract-later. ADR-011's SRP-split-first discipline still
applies for organizing a single game's own logic; this ADR changes
what happens *after* a pattern is recognized as general, from "wait for
someone to notice the duplication later" to "put it in the shared
layer now, since the trigger already arrived."

### Scope extension beyond ADR-009

ADR-009 authorized generic utilities only. **This ADR extends the same
authorization to genuine game-system patterns** — genetics, breeding,
odds/market, combat resolution, movement/physics — matching ADR-007's
original `engine/systems/` vision in full, not just its utility-level
carve-out. `engine/systems/genetics.lua`'s existing `breed_horses`/
`generate_horse` functions, previously sitting in a gray zone between
"generic utility" (ADR-009) and "game-specific rule" (not yet
authorized), are retroactively and fully authorized under this ADR —
no migration needed, the code was already correctly placed.

### Parity for the TypeScript track

`ts/src/engine/shared/` and `ts/src/engine/artGen/` get the same
first-class status as Lua's `engine/`, organized under the same
primitive taxonomy documented in the old SDD v0.2 §8 (Entity, Action,
Resolution, Consequence, Movement, Physics, Lifecycle) — one shared
naming discipline across both runtimes, even though no code crosses the
language boundary. This matters because TS-native is now the studio's
actual default (ADR-010/ADR-013) — a shared-engine philosophy that only
applies to the shrinking Lua-backed catalog isn't the studio's real
default, it's a legacy-track policy. This ADR makes it the default for
the track that actually is the default.

### Proof case — already real, not pending

ADR-007 named Snake as its validation case; Snake was never built. This
ADR doesn't need a new invented proof case — **the `artGen` module,
generalized from Dissonance's real generator and now genuinely consumed
by both Shoal (canvas-path rendering, hunger-aware specs, its own
caching layer) and SlimeWorld (seeded-random + polygon generation,
verified byte-identical by real tests) — already is the proof.** Two
real consumers, real tests, real production code, built before this ADR
formalized the philosophy behind it. This ADR is a description of
something already working, more than a mandate for something new — that
makes it a safer bet than ADR-007's was, which is worth noting plainly.

**No companion directive follows this ADR.** The work that would have
been in it is already done.

---

## Consequences

**Positive:**
- Removes the "is this justified enough to share" friction that made
  every extraction feel like a special case requiring its own audit
  trail before it could happen.
- `genetics.lua`, `odds.lua`, `market.lua` — already built, already
  working, previously resting on ADR-009's narrower authorization by a
  stretch — now sit on solid ground.
- Gives the TS-native track (the actual majority of current work) the
  same engine discipline the Lua track has had since June — a
  discipline `artGen`'s two real consumers already demonstrate works.

**Negative / real constraint, not waived by this ADR:**
- "A real second use already known or clearly likely" is still the
  bar — this ADR does not authorize building shared infrastructure for
  a single current consumer on pure speculation that others might
  someday want it. That discipline (ADR-005's original, legitimate
  concern) survives; only the *default posture* changes, from
  reluctant-exception to expected-practice once the real trigger is
  present.
- Existing single-consumer game-specific logic (most of any given
  game's actual `logic.lua`/`App.tsx`) is not retroactively expected to
  migrate to the shared layer without a real second consumer. This ADR
  changes what happens at the moment of recognizing generality, not a
  mandate to go hunting for more to extract.

---

*Robert Floyd Dugger's direct decision, August 15, 2026.*
*The shared engine was always the goal. Every demo checks it on the way in, and leaves something behind on the way out.*
