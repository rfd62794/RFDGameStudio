# ADR-013: Retire the Lua Cross-Runtime-Portability Carve-Out

**Status:** Accepted
**Date:** August 2026
**Related:** ADR-005 (component systems are named patterns, not shared
binaries), ADR-010 (TS-native origin permitted, Lua reserved for genuine
cross-language portability), ADR-012 (port-then-conversion pipeline,
Stage 3 surfaces the TS-native-vs-Lua question).

## Context

ADR-010 permitted TS-native origin as the default for new games, but
kept Lua *mandatory* for one named category: games requiring genuine
cross-runtime portability, with exactly two real, live cases cited —
VoidDrift's Rust core and TurboShells' Rust/Python core, both described
as "real, both mid-port" at the time.

Both cases have since lapsed. Confirmed directly, August 2026: VoidDrift
and TurboShells' Rust ports have not progressed and are not an active
priority — the practical reason being TS's development speed,
demonstrated repeatedly through Google AI Studio's TS-native pipeline
throughout this session (Dissonance, Planet of Greed, Shoal, the artGen
extraction). Python remains real and valuable elsewhere in Robert's work
(ConvosoMCP, PlaidMCP, WhisperMCP, Brownbook, RFD_CLIPr, RFD_YT_Engine)
but was never actually a game-logic consideration for this studio —
that conflation was cleared up in the same conversation that produced
this ADR.

Separately, this session's deep Lua investigation (Part C, cross-game
duplication audit) found only 2 of 11 functions flagged as potentially
shared across Lua games were genuine promotion candidates — both
trivial math utilities. The premise that Lua enables meaningful code
reuse across this studio's games was never strongly true in practice,
even among games that were already Lua-native. Meanwhile, the artGen
extraction (Dissonance → shared `engine/artGen/` module → Shoal as a
verified second consumer, zero regression) demonstrates the real
mechanism that actually works: promote genuinely shared logic to a
common TS module once a second real consumer needs it. No second
language required to get there.

**The stated reason for ever requiring Lua — genuine multi-runtime
portability — no longer has a case pointing at it.**

## Decision

**Lua is no longer mandatory for any game, for any reason, including
claimed future portability needs.** ADR-010's carve-out clause is
retired. TS-native is now the studio's unqualified default for all new
games, full stop — not "unless portability might matter later."

**Existing Lua-ported games are unaffected.** The ten games currently
on the three-file Lua contract stay exactly as they are. This ADR does
not authorize reverting, migrating, or deprioritizing any shipped Lua
game — that would trade one unexamined default (defaulting to Lua) for
another (defaulting to un-porting working things), which is the same
mistake pointed the other direction. ADR-005's engine-primitive layer
for Lua games also stays as-is.

**Going forward, code reuse across TS-native games follows the artGen
pattern, not a shared-language pattern:** build a game's logic
TS-native and self-contained first. When a second real game genuinely
needs the same logic — not a hypothetical future one — extract the
shared piece into a common TS module (matching the `ts/src/engine/`
convention already established), with the same zero-regression
discipline already proven on the artGen extraction. Reuse is earned by
a second real consumer, never architected in advance of one.

**Real next step, not yet done, worth its own investigation directive:**
a TS-native duplication audit, mirroring the method that just worked for
Lua (this session's Part C) — read every TS-native game's real source,
find genuinely duplicated logic (not just similarly-named functions),
and report real promotion candidates. Given artGen's own extraction
already found real shared value between two very different games
(a card-based roguelike and a Wa-Tor reef sim), there's real reason to
expect more exists across the rest of the TS-native catalog — but this
should be confirmed by reading, not assumed from this ADR alone.

## Consequences

- ADR-010's TS-native-vs-Lua flag in Stage 3 of the port-then-conversion
  pipeline (ADR-012) simplifies: there is no longer a real decision to
  surface, since Lua is no longer ever the correct default. Stage 3's
  scaffolding tool should stop presenting this as an open choice.
- VoidDrift and TurboShells' own future completion path is a real, open
  question this ADR does not resolve: whether their eventual build-out
  continues toward a Rust core at all, or whether they too move toward
  TS-native given the same speed argument driving this decision
  everywhere else. Worth a direct decision, not an inferred one, before
  either project's next real phase.
- Ten existing Lua games remain exactly as shipped — no migration
  debt created by this decision.
- The real payoff of this ADR isn't removing Lua from anything — it's
  removing "maybe we'll need portability later" as a reason to reach for
  it on the next new game. That reasoning already cost real interpreter
  overhead on at least one shipped game (Shoal) for a portability need
  that was never real.

*Robert Floyd Dugger's direct decision, August 2026 — the carve-out's
only two real cases lapsed, and the thing it was protecting against
(unnecessary reimplementation) is already better solved by promoting
real, second-consumer-proven TS modules instead.*
