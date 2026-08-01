# SlimeWorld — Design.md, Revision 2
*August 1 2026 | Builds on Revision 1 (July 17 2026). Converges a real design
thesis after several sessions of adding systems without one — corrects one
real error against Rev 1's own locked spec, reconciles Fealty/Culture Favors
(designed in later July conversations, never folded into this document until
now), and narrows scope on purpose rather than by accident.*

---

## The One Sentence Everything Gets Tested Against

**You are tending something small and uncertain in the wake of a catastrophe,
never sure if care matters more than conquest — until, much later and
without fanfare, you find out it did.**

Rev 1 named the Feel ("uncertain whether any of this matters") and the Loop
(doors resolving into doors) but never named a destination the uncertainty
resolves toward. This revision's real work is giving the Feel an actual
mechanical answer, not just a mood.

---

## CORRECTION to Rev 1 — Legacy Slime

A hypothesis was floated this session, grounded in Sunless Sea's real
"pass resources to the next generation on death" mechanic, guessing Legacy
might work that way. **It does not — Rev 1 already locked the real spec:**
one Legacy slot per Color, a flat passive +2% stat bonus to that whole
Color, unlocked by retiring an Elder-stage slime into it. Simpler than the
guess, and already numbered. The Sunless Sea research still mattered — it's
what surfaced *why* Elder/retirement should feed something permanent at
all — but the specific mechanism was already real and locked before tonight,
not invented tonight. Corrected here so no future session inherits the wrong
version.

**Worth naming directly:** Rev 1's own Elder spec ("carries a breeding tax
0.85x, only stage that can retire into Legacy") independently reached the
same structural shape — aging as a real clock feeding a terminal, permanent
payoff — that tonight's Monster Rancher / Sunless Sea research converged on
from a completely different direction. That's real convergent validation,
not a coincidence to shrug past.

---

## The Two Paths — Now Named as the Actual Throughline

Not new systems. Both already exist in the codebase or Rev 1's own spec —
what's new is naming the relationship between them as the point of the game.

**Conquest (Force/Bribe/Convert) — fast, loud, impermanent.** The moment a
player makes their first real claim, the whole map re-fogs permanently —
already locked design ("the price of ambition"). Claimed nodes stay in the
pressure simulation forever, vulnerable to flipping back. Conquest never
actually finishes.

**Fealty — slow, quiet, permanent.** Designed in a prior session (July
2026), never folded into this Design.md until now — a real gap, corrected
here. At 100% relationship with a culture, that culture's future territory
becomes the player's automatically, forever, and its existing nodes exit the
pressure simulation entirely. The only system in the whole design that
produces something that *stays* true once it's true.

**Culture Favors** is the on-ramp to Fealty — also designed previously, also
missing from this doc until now. Procedurally generated from real, already-
tracked node state (`pressure`, `is_supplied`), fulfilled via Dispatch
(reduce pressure) or Disposal (permanently surrender a slime, stronger
effect). Raises `culture_relationships` — a field already read by
`resolve_convert_claim` but, as of last check, never actually written
anywhere. That dead mechanic is what Favors exists to fix.

---

## New Systems, Locked Tonight

**Loyalty.** Built from a slime's actual history of use, not transferable,
not re-rollable. Real precedent (Monster Rancher, verified): loyal creatures
reliably follow commands; disloyal ones can refuse outright. Heavy Conquest
use should build Loyalty faster but at real cost; patient Garden/Favor work
should build it slower but cleaner. Ties Conquest-vs-Fealty into something
the player *feels* on a specific slime, not just reads as lore.

**Stage, made real.** Confirmed via direct source read this session:
`stage` (`Hatchling → Juvenile → Young → Prime → Veteran → Elder`) exists in
`data.yaml` and `types.ts`, wired both directions through the Lua bridge —
and is never computed anywhere. Fully dead field, same shape as
`culture_relationships`. Real fix: Stage advances from elapsed cycles in
service, independent of Level — the tension only exists if aging runs on
its own clock. Level should be *bounded* by Stage, not open-ended, so no
amount of grinding ever out-values good breeding.

**Lab Level.** Player-wide mastery, distinct from any individual slime's
own Level — naming deliberately kept apart to avoid confusion with the
already-real per-slime `level`/`xp` fields. Gates which *tier* of Color/
Shape/Accent target is attemptable at all (Guild tier first, then Rival,
then Arc/Skip Triads) — real precedent, verified: Pocket Frogs gates rarity
tier by player level, not raw RNG. Replaces the previously-unscoped
"SlimeDex Unlock Path Screen" concept almost entirely — that was heading
toward a full wheel-visualization UI; this reduces the actual gate to a
number and a rotation.

**Season/Culture rotation.** Merges what were two separate ideas (a Calendar
system, and Seasons affecting Cultures) into one. Uses the Genesis Ore
mapping already locked elsewhere (Metal→Tundra+Marsh, Gas→Gale+Kindling,
Crystal→Crystal+Tide) — no new worldbuilding required. Whichever Culture is
in-season has its breeding targets featured/more achievable that
cycle-block — real precedent, verified: Monster Rancher EVO's weekly
ringleader planning cadence, and Pocket Frogs' Weekly Sets (a curated,
time-boxed discovery target with a real payoff). Everything stays
technically reachable outside its season, just not the featured push.

---

## Explicit Cuts — Named, Not Just Deprioritized

- **Squad Leaders** — real idea, raised and cut in the same session. Pure
  flavor on top of what Loyalty and breeding already deliver; doesn't serve
  the one sentence, just decorates it.
- **Training as a separate progression system** — competes directly with
  breeding for the core verb. Level stays exactly as scoped above (bounded
  by Stage), nothing further gets built here.
- **A second, real-time maturation clock** (Pocket Frogs precedent,
  deliberately not copied) — the game already has cycle-based pacing;
  adding a parallel real-world timer would fight it, not support it.
- **The full SlimeDex Unlock Path Screen** as originally scoped — mostly
  replaced by Lab Level + Season rotation, per above.

**Real, unresolved tension, not decided tonight:** Conquest already has
deep, real systems (pressure, supply cascades, territory claims) that took
genuine design effort. Narrowing the game's *feeling* toward Fealty may
mean narrowing Conquest's own depth too, not just adding restraint around
it — a rich fast path can pull attention regardless of what the thesis says
on paper. Named here so it doesn't get silently resolved by default later.

---

## Updated MVP Scope

### Included (adds to Rev 1's list)
- Fealty + Culture Favors — now correctly part of MVP scope, not a later
  system; without them the whole thesis has no mechanical payoff
- Loyalty
- Stage made real (currently dead code — this is corrective work, not new
  scope)
- Lab Level + Season/Culture rotation (replaces the unscoped Unlock Path
  Screen)

### Still Deferred (unchanged from Rev 1)
Asteroids as territory, full Color Tree/9-culture/Galactic Layer, Synthesis,
full Requisitions/Petitions board beyond Wanderer type, the Regent-system
question.

### Newly Cut (see Explicit Cuts above)
Squad Leaders, Training-as-system, a second real-time clock, the full
wheel-visualization Unlock Path Screen.

---

## Recommended Build Order — Smallest Real Slice First

Everything above depends, directly or indirectly, on Stage actually
functioning — Loyalty's usage-based aging idea, Elder's already-locked
breeding tax, Legacy's retirement eligibility, all of it currently hooks
into a field that has never been computed once. **Making Stage real is the
correct first directive** — it's corrective work on existing dead code, not
new system design, and it's the one piece every other new system in this
revision needs before it can mean anything.

Fealty + Culture Favors is the second, larger piece — genuinely new systems,
not a fix — and should follow only once Stage is confirmed real and live.

### Status: Stage-Made-Real — COMPLETE (August 2026)

Implemented in `games/slimeworld/logic.lua` (`compute_stage` +
`STAGE_THRESHOLDS`, called per-slime from `advance_cycle`) and
`games/slimeworld/territory.lua` (`initiate_breeding`, Elder tax + fixed
`created_at` assignment on offspring). All anchors verified through the
real `stateToLua()` → executor → `luaSlimeToTs()` bridge, not Lua-only
mocks (`ts/tests/test_slime_stage.tsx`).

**Six cycle thresholds — FIRST-PASS PLACEHOLDER, pending Robert's review,
not locked:**

| Stage | min_cycles |
|---|---|
| Hatchling | 0 |
| Juvenile | 5 |
| Young | 15 |
| Prime | 30 |
| Veteran | 60 |
| Elder | 100 |

**Elder breeding tax — locked `0.85x` (Rev 1), target value chosen this
session:** applied to the offspring's computed stat block (`child.stats`,
each of hp/atk/def/agi/int/chm floored at `value * 0.85`) when either
parent's `stage == "Elder"`. Rev 1 named a "breeding tax" without
specifying its target; offspring stat quality was chosen as the most
direct reading of a tax on breeding with worn-out genetics.

**Related bug fixed as a required prerequisite, same files:** offspring
never had `created_at` set (defaulted to 0 in Lua, `Date.now()` on the TS
side) — this alone would have made Stage compute as permanently wrong for
every bred slime (unit mismatch between a millisecond epoch and the
cycle counter). `initiate_breeding` now sets `child.created_at =
state.cycle`.

**Known remaining gap, explicitly out of this directive's file scope:**
`App.tsx`'s `initialState()` still sets `createdAt: lua.createdAt ||
Date.now()` for starter slimes at game start — since `create_seed_slime`
never sets `created_at` either, starters still get a millisecond epoch
timestamp instead of a cycle number, so their live Stage will be wrong
until that's fixed. Not touched here because `App.tsx` isn't in this
directive's §1 scope table (only `logic.lua`/`territory.lua`/test files
were authorized) — flagged for the next session rather than silently
fixed or silently ignored.

---

*SlimeWorld Design.md, Revision 2 | RFD IT Services Ltd. | August 1 2026*
*One correction made honestly against Rev 1's own real spec. One real
convergence named. Two prior systems reconciled into this document for the
first time. Four things cut on purpose. Smallest real next step named, not
left as a menu.*
