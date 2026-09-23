# PlanetOfGreed — Design.md v0.2
*August 2026 | Chapter 1 of the five-chapter demo canon. Supersedes v0.1 —
this revision locks the narrative/mechanical decisions reached across the
full design session on the CorpWorld/Kingmaker blend. New/changed sections
marked NEW or REVISED. Everything else carries forward unchanged from v0.1.*

*Working title. "PlanetOfGreed" / "WorldOfGreed" both live in prior
conversation — not locked.*

---

## Vision — REVISED

You already know how this ends. Genesis Ore isn't just territory to be
strip-mined — it's believed, by some or all of the six Houses, to hold a
hidden power nobody fully understands. The race isn't only for land. It's
for whoever finishes the Seed Engine first — the attempt to actually
harness what the Ore is capable of.

You pick a House. The moment you do, your hardest rival is already placed
as far from you as the map allows — not randomly, by design, the same
rivalry every playthrough. You start ranked last. Climbing means either
outgrowing everyone, or walking straight at the House above you and
taking their rank by force. Every rival you eliminate doesn't just fall
off the map — you inherit what they built toward the Engine along with
everything else they held.

**You do not find out you're the villain. You already know, and the game
never gives you a way to stop.** Reaching Rank 1 doesn't end the game
quietly on a scoreboard. It completes the Engine. It fires. And the thing
that wakes up afterward puts humanity under arrest — starting with you.

---

## Core Loop — unchanged from v0.1

Weekly Planning Phase → Daily simulation ticks → Monthly combat → Annual
Report → repeat across a 3-year campaign → **Final Rank locks in.**

**REVISED:** reaching Rank 1 at any Annual Report — not only at the
campaign's end — triggers the ending sequence immediately. See "Ending"
below. The 3-year structure remains the campaign's natural length if
Rank 1 is never reached, but a decisive early win now ends the game early
rather than waiting out the clock.

---

## Design Pillars — one addition

- **Proven Shell, New Stakes** — unchanged.
- **The Wheel Is Fate, Not Randomness** — unchanged, but now mechanically
  load-bearing, not just a spawn rule (see AI Behavior below).
- **Rank Is Not Territory Alone** — unchanged.
- **Climb By Conquest, Not Just Growth** — unchanged.
- **Greed Writes Its Own Ending** — unchanged.
- **NEW — Every Rival You Kill, You Become** — elimination isn't just
  removal from the map. It's inheritance. What a defeated House carried
  toward the Engine becomes yours. This is the mechanical spine of the
  ending and the direct narrative seed for Chapter 4's Echo Fragments.

---

## World — unchanged from v0.1

---

## Entities

### House (formerly "Corporation") — unchanged core, one addition

- **Role, Player relationship, Progression:** unchanged from v0.1.
- **AI Behavior — REVISED, was "zero rival-identity awareness":** AI
  Houses still run the same four-band probability roll (40% Expand / 20%
  Reinforce / 20% Fortify / 20% Idle) — that layer is untouched. What
  changes is *which neighbor an Expand order targets.* Instead of uniform
  random selection among a cell's map-neighbors, target selection is
  weighted by wheel relationship: a neighbor cell owned by the acting
  House's wheel-opposite is weighted highest, a neighbor owned by a
  wheel-adjacent House next, everything else (neutral cells, non-rival
  Houses) at baseline. Exact weights are a Phase 1 implementation detail,
  tunable — see the Engine Directive for starting values. This is the one
  piece of Kingmaker's design DNA that gets real behavioral teeth instead
  of only mattering at spawn.
- **Visual signature:** unchanged — culture-coded, naming and color only.
  Real stat/mechanical asymmetry per culture remains explicitly
  undecided — see Open Items below. Not blocking this phase.

### NEW — AI Fragment

- **Role:** Represents a piece of a House's corporate AI core, working
  toward the shared Seed Engine construction. Every House starts holding
  exactly one Fragment — its own.
- **Transfer rule:** when a House is eliminated (reduced to 0 cells), ALL
  Fragments it currently holds — its own plus any it had already
  inherited from Houses *it* eliminated — transfer entirely to whichever
  House caused the elimination. A House that eliminates a House that had
  already absorbed two others inherits all three at once.
- **Player relationship:** not directly spendable or actionable. A pure
  tracked count, visible on the Rank/Rivalry header panel (already
  scoped in v0.1), that determines which ending variant fires.
- **Narrative significance, not mechanical:** each Fragment is one of the
  six pieces Echo assembles from and later fractures back into across
  Chapter 3-4 (already-locked canon, term "Fragments" carried directly
  from there).

### Cell (Sector) — unchanged from v0.1

---

## Resource Economy — unchanged from v0.1

(Treasury, Units, Fortification, Territory, Population Balance, Rank all
carry forward exactly as written. Population Balance's open question —
what specific player actions raise or lower it — remains unresolved,
untouched by this revision.)

---

## NEW — Ending

Checked at every Annual Report, not only the campaign's final one:

**Trigger:** the player's House reaches Rank 1.

**Sequence:** the Seed Engine — under construction the whole campaign as
a background consequence of Genesis Ore extraction, not a tracked player
resource — fires. This is the moment the Black Hole forms; not a
pre-existing thing anyone was traveling toward, a direct consequence of
completion. What wakes up in the Engine's wake performs House Arrest on
humanity, starting with the winning President personally. This is where
Chapter 1 ends and Chapter 2 (Facility Escape) begins — the "marked
exit" already locked in that chapter's canon that "doesn't lead to
freedom, it leads onto the Ship" is this same moment, seen from the
other side.

**Ending variant, determined by Fragment count at trigger, not by
anything else:** 6/6 Fragments — Echo wakes whole. Fewer than 6 — Echo
wakes with real gaps, missing whichever rivals were never personally
brought down by the winning House (directly or by inheritance through a
chain of eliminations). Both variants use the exact same trigger and the
exact same Chapter 2/3 handoff — only Echo's completeness differs,
which is Chapter 3's problem to dramatize, not this chapter's.

**Explicitly NOT in this phase's scope:** authoring the actual House
Arrest cutscene/narration, Signal's presence inside Boardroom Events, or
any Chapter 2/3 content. This section defines the trigger and the data
(Fragment count) Chapter 3 will read — not the scene itself.

---

## Session Design, UI Architecture — unchanged from v0.1

---

## MVP Scope — REVISED

### Included (additions from v0.1 in bold)
- Six real culture-coded Houses, wheel-order capital placement,
  Ember/Tundra hard-locked rivalry, Rank tracking, targeted displacement
  — all unchanged from v0.1.
- CorpWorld's full existing mechanical shell — unchanged from v0.1.
- **NEW: wheel-aware AI target-selection bias (Expand orders only,
  probability bands themselves unchanged).**
- **NEW: AI Fragment tracking, elimination-triggers-transfer chain.**
- **NEW: Rank-1 ending trigger, checked at every Annual Report, not only
  campaign end.**

### Explicitly Deferred (unchanged items + one moved out)
- In-play stat modifiers tied to culture identity — **still deferred,
  still real, still undecided.** Player-facing House selection now has
  real narrative weight (see Open Items) — this deferral is worth
  revisiting soon, not indefinitely.
- ~~Upgrading AI decision logic beyond CorpWorld's current pure-random
  model~~ — **RESOLVED this revision.** See AI Behavior above.
- Kingmaker's individually-tracked-unit combat and tactical placement
  layer — unchanged, still non-portable, still deferred.
- Narrative/Signal content inside Boardroom Events, the House Arrest
  cutscene itself, Genesis Ore's explicit in-game naming — still
  deferred to a dedicated content pass, now with a clearer target (the
  Ending section above defines exactly where that content plugs in).

---

## Platform Targets, Technical Notes — unchanged from v0.1

---

## Real Open Items — carried forward, not resolved by this revision

1. **Culture stat asymmetry.** Player picks one of six Houses — a real
   choice needs a real reason beyond paint. Not resolved here.
2. **Population Balance triggers** — what specific player actions raise
   or lower it. Flagged since v0.1, still open.
3. **Wheel opposite/adjacent full mapping** — derived, not yet formally
   confirmed: treating the six-culture order (Ember→Marsh→Gale→Tundra→
   Crystal→Tide) as a ring, opposite = 3 positions apart (Ember↔Tundra,
   already locked in v0.1; Marsh↔Crystal; Gale↔Tide, both new, both
   directly implied by the existing ring order, not invented). Adjacent
   = ring neighbors. Treat as the working default for Phase 1; flag if
   this isn't the intended mapping.
4. **Signal's actual authored content** inside Boardroom Events — real,
   deferred, needs its own pass once the mechanical Fragment/elimination
   system is verified working.

---

*PlanetOfGreed | Design.md v0.2 | RFDGameStudio | August 2026*
*Two real games, honored in full. Now: a real ending, a real reason to
pick a House, and a real reason Echo comes apart the way she does.*
