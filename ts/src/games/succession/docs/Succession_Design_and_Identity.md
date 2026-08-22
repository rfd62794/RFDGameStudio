# Succession — Design & Identity

*v0.2 — supersedes v0.1 (same day) | August 22 2026 | Living design reference — the "what is this game trying to be" document. Companion to the ADR sequence (`docs/adr/`), which tracks individual technical decisions; this tracks vision and identity.*

*Change from v0.1: figure-specific persuasion methods confirmed as real, locked design — moved out of Open Questions. Real refinement beyond the original framing: methods are locked uniquely to each figure, not just weighted differently.*

---

## Why this document exists

Four directives (ADR-001 through ADR-004) fixed real, confirmed
mechanical problems. None of them answered a more fundamental
question, first raised directly on Aug 20 and left open since: **what
is this game actually trying to be, and does everything in it serve
that.** This document exists to answer that before any further feature
work gets built on an unresolved foundation.

---

## The Core Loop, Locked

**Succession is a persuasion game about convincing three figures to
back your claim to the throne.** That is the central, load-bearing
loop — Whisper, Appeal, Evidence, Discredit, Favor, the eventual
verdict. Everything else exists to serve this loop, not compete with
it for the player's attention.

---

## Persuasion Methods — Locked to Each Figure

**Locked, new in v0.2:** each of the three figures values one
persuasion method uniquely — not just weighted higher, genuinely
**locked** to that figure specifically. This is the real mechanism
that makes "predictable personalities to consider and play against"
actually true at the system level, not just in flavor text: knowing
which figure you're courting should tell you which *method* is
actually going to work on them, the same way knowing an opponent's
deck archetype tells you what to play around.

**Why this matters for the "two games" fix specifically:** this is
what makes the three figures genuinely distinct strategic problems
instead of three identical Favor-meters with different names attached.
It also gives the existing Origin system (which already grants
per-origin bonuses to specific methods — e.g. Disgraced Knight's
Commander Appeal bonus) real, sharpened stakes: an origin's method
bonus now interacts directly with which figures it's actually strong
or weak against, rather than being a flat, context-free number.

**The natural three-way mapping this creates, not yet assigned:** the
game currently has three real persuasion-adjacent verbs — Whisper
(informal, personal), Appeal (formal, procedural), and Evidence/
Indictment (truth-based, demonstrated judgment). Three figures, three
methods — a clean structural fit. **Which figure locks to which method
is not yet decided** — this is real characterization work, tied
directly to who these people are, and shouldn't be assigned separately
from the cast-building pass that's already queued next.

---

## The Murder — Locked Decisions

*(unchanged from v0.1)*

**The premise:** the previous ruler was murdered — the actual reason
the throne is open, not a side puzzle bolted onto an unrelated
political game.

**The real problem this solves:** the mechanic already paid out
correctly (a validated Indictment grants real Favor and clears
exposure) — but *solving the mystery felt irrelevant to convincing
these people I'll be a better ruler.* The fix is structural: make the
mystery inseparable from the same cast and stakes.

**Locked: the suspect pool is the game's own existing cast.** Five
real suspects: the two rivals, and the three figures being courted. No
new characters, no separate mode.

**Locked: hints are ambient, delivered through normal play,** never a
separate investigation system. Real authoring mechanism still open
(see below).

**Locked: a correct accusation has real, direct consequences on the
core loop.** Accusing a rival correctly removes them as competition.
Accusing one of the three figures correctly disqualifies them as a
persuasion target — the remaining problem becomes courting 2 of 3, not
3.

---

## Open Questions — Real, Deliberately Unresolved

*Do not resolve any of the below inline in a future directive — they
need their own real design pass.*

- **Which method locks to which figure?** New in v0.2 — the mapping
  itself (Whisper/Appeal/Evidence-Indictment × Chancellor/Archbishop/
  Commander) is real, queued design work, naturally paired with the
  cast-building pass rather than decided in isolation from who these
  people are.
- **What happens on a wrong accusation, under this redesign?** The
  existing `deliverIndictmentTo` penalty predates this reframing —
  does it still fit given the new stakes?
- **How exactly do ambient hints get authored and delivered?** Tied to
  specific existing actions? Real design pass needed.
- **Does "removing a figure's value" change `verdict.ts`'s real win
  condition math**, or just remove them as an eligible target? Needs
  the real function read directly, not assumed.
- **Does the murderer's identity need to be seeded/deterministic** for
  the balance harness to remain meaningful? Almost certainly yes, real
  mechanism not designed yet.
- **Does locking a method to a figure create a real balance risk** —
  e.g., if an origin's bonus method happens to also be a figure's
  locked-weak method, does that create a new dead-strategy problem the
  same shape as the ones ADR-002/003 just spent real effort fixing?
  Worth checking directly against the real balance harness once this
  is implemented, not assumed safe.

---

## What This Unlocks, Once Picked Back Up

The cast work — real names, personalities, and now also **each
figure's locked persuasion method** as part of their actual
characterization, not assigned separately — is the natural next phase.
Building the cast and the method-locks together, rather than the
method-locks first in isolation, keeps a figure's persuasion
preference tied to who they actually are (matching how Time Served's
Steerage NPCs each got a distinct voice before any mechanical trait
was hung off them).

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial. Core loop locked. Murder system locked in direction (suspect pool = existing cast, ambient hints, structural accusation consequences). Five open questions recorded. |
| v0.2 | Figure-locked persuasion methods confirmed as real, locked design — not just "valued differently," genuinely locked per figure. Natural 3-method/3-figure mapping identified (Whisper/Appeal/Evidence-Indictment), specific assignment left open, tied to the upcoming cast-building pass rather than decided in isolation. New open question: whether method-locking creates a new dead-strategy risk interacting with existing origin bonuses, worth real harness verification once built. |

---

*Succession | August 22 2026 | RFD IT Services Ltd.*
*Know who you're talking to. Know what actually moves them.*
