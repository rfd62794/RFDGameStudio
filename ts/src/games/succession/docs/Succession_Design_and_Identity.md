# Succession — Design & Identity

*v0.3 — supersedes v0.2 (same day) | August 22 2026 | Living design reference. Companion to the ADR sequence (`docs/adr/`).*

*Change from v0.2: two real design principles locked in response to direct instruction — a player safeguard against the dead-strategy risk flagged in v0.2's open questions, and a real complexity ceiling for the murder-inquiry puzzle.*

---

## Why this document exists

Four directives (ADR-001 through ADR-004) fixed real, confirmed
mechanical problems. This document answers the more fundamental
question underneath them: what is this game actually trying to be, and
does everything in it serve that.

---

## The Core Loop, Locked

**Succession is a persuasion game about convincing three figures to
back your claim to the throne.** Everything else exists to serve this
loop, not compete with it for the player's attention.

---

## Persuasion Methods — Locked to Each Figure

Each of the three figures values one persuasion method uniquely.
*(Unchanged from v0.2 — see that version's reasoning.)*

**New in v0.3, directly closing the real risk v0.2 flagged: "locked"
means most effective, never the only option that works.** This is the
same principle Time Served's own design already proved out and locked
as a pillar: *"No Mathematical Dead End — the player is never locked
into an unwinnable spiral with no move available... there's always a
worse option on the table, and taking it is supposed to feel bad, not
be impossible."* Applied here directly: a figure's non-locked methods
still function, at real, meaningfully reduced value — never zero,
never disabled. A player whose origin bonus doesn't match a figure's
locked method has a genuinely worse path, not a wall. This is the real
safeguard against the exact dead-strategy shape ADR-002 and ADR-003
already spent two directives fixing elsewhere in this same game —
worth entering this system with the lesson already applied, not
rediscovering it the hard way a third time.

**Real, testable consequence of this lock:** once implemented, no
origin × figure-method-lock combination should be able to produce a
structurally hopeless lane — this needs real harness verification
before it ships, the same discipline as every prior ADR, not assumed
safe because the principle sounds right on paper.

---

## The Murder — An Inquiry Puzzle, Deliberately Not Too Complex

*(Core locked decisions unchanged from v0.1/v0.2 — suspect pool is the
existing 5-person cast, hints are ambient, correct accusations remove
a rival or disqualify a figure.)*

**New in v0.3: a real, explicit complexity ceiling, directly
instructed.** The existing Suspect / Method / Motive triad system
already in the codebase (`deduction.ts` — `SUSPECTS`, `METHODS`,
`MOTIVES`, `getDiscoveredCluesFromEvidence`,
`getDiscoveredTriadOptions`) is the right *shape* for this — a classic,
legible three-part deduction, not a system to expand further. "Not too
complex" locks a real design ceiling: the total number of distinct
hint fragments a player needs across a full playthrough should stay
small enough that a player doing ordinary political play (Whisper,
Appeal, Evidence-scouting for entirely political reasons) naturally
encounters enough of them without needing to grind or backtrack
specifically hunting for clues. This is an inquiry puzzle a player
solves *while* playing the real game, not a second game requiring
dedicated attention — the same principle that already justified making
hints ambient in the first place, now applied to volume as well as
delivery method.

**What this rules out, explicitly:** a large, sprawling clue web, red
herrings requiring cross-referencing multiple sources, or any
requirement to revisit past actions/logs to reconstruct what happened.
If the real implementation of ambient hints (still open, see below)
can't deliver "enough to solve it" within a small, real number of
ordinary political actions, that's a sign the hint density needs
tuning down, not the puzzle needing more systems to compensate.

---

## Open Questions — Real, Deliberately Unresolved

- **The exact real hint count and delivery cadence** — "small enough" is locked as a principle; the actual number (3? 5?) and which specific existing actions surface which specific clue types is real design work, not decided here.
- **Which method locks to which figure** — tied to the upcoming cast-building pass, not decided in isolation.
- **What happens on a wrong accusation** under this redesign — the existing `deliverIndictmentTo` penalty predates this reframing.
- **Does "removing a figure's value" change `verdict.ts`'s real win condition math**, or just remove them as an eligible target — needs the real function read directly.
- **Does the murderer's identity need to be seeded/deterministic** for the balance harness to remain meaningful — almost certainly yes, real mechanism not designed yet.

---

## What This Unlocks, Once Picked Back Up

The cast work — real names, personalities, each figure's locked
persuasion method, all decided together rather than separately — is
the natural next phase, now with two real, load-bearing safeguards
already locked before any code gets written: no dead lanes, and a real
ceiling on inquiry complexity.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial. Core loop locked. Murder system locked in direction. Five open questions recorded. |
| v0.2 | Figure-locked persuasion methods confirmed as real, locked design. Natural 3-method/3-figure mapping identified, assignment left open. Dead-strategy risk flagged as a new open question. |
| v0.3 | Two real safeguards locked, both directly instructed: (1) non-locked methods remain functional at reduced value, never disabled — reusing Time Served's proven "No Mathematical Dead End" pillar directly rather than rediscovering the lesson; (2) the murder-inquiry puzzle gets a real complexity ceiling — small, ambient hint volume, no clue-web sprawl, solvable through ordinary political play rather than dedicated investigation. |

---

*Succession | August 22 2026 | RFD IT Services Ltd.*
*A locked method should feel like a strength to have, not a wall to hit.*
