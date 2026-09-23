# ADR-016: Verification-Dated Staleness Claims

**Status:** Accepted
**Date:** August 15, 2026
**Supersedes:** None
**Related:** ADR-015 (Status Board — `lastUpdated` field is the
project-status-specific instance of the discipline this ADR generalizes),
ADR-014 (the `artGen` consumption claim that triggered this ADR was found
wrong during ADR-014's own drafting)

---

## Context

On August 15, 2026, the same failure mode — an unverified "not yet done"
claim getting cited forward as fact — hit **twice in one session, in two
different documents, before this ADR was even written.**

**Incident 1: SDD version pointer.** `AGENTS.md` (written by Devin earlier
this session) cited "SDD v0.3 current" as the authoritative System Design
Document. Wrong — v0.4 supersedes v0.3, same day, written specifically to
correct real gaps v0.3 had (missed ADR-009 and ADR-011). The claim was
sourced from a prior document's framing, not from checking which SDD file
was actually current at write time.

**Incident 2: `artGen` consumption claim.** `AGENTS.md` described
`ts/src/engine/artGen/` as "built but not yet consumed by Shoal or
SlimeWorld." Wrong, confirmed by direct file read: both games actively
consume it (`Shoal`'s `App.tsx` uses `canvasTeardropFinPath`/
`canvasRadialBurstPath`/`canvasIrregularFragmentPath` with its own
`art/shoal.config.ts`; `SlimeWorld`'s `SlimeVisual.tsx` uses
`mulberry32`/`hashStringToSeed`/`renderPolygonPoints`, verified
byte-identical by its own tests). This was the *second* time this exact
false claim appeared in a document this session — the first was in
`SDD v0.4` §5.3, caught and corrected during ADR-014's drafting hours
earlier. The same underlying gap (citing conversation-history inference
instead of checking the live repo) planted the same wrong claim in two
independent documents.

**Root cause, both times:** citing a prior document or
conversation-history inference instead of checking the live repo state at
write time. The claims felt reasonable — they matched what earlier docs
had said — but nobody verified them against the actual files before
propagating them forward.

---

## Decision

Any documentation claim of the form **"X is not yet built / consumed /
resolved"** or **"X is still open / unconfirmed"** must carry an explicit
verification marker:

- **The date it was checked** (ISO format).
- **The method** — one of:
  - `direct file read` — the actual repo files were read and the claim
    confirmed against their current contents.
  - `research/inference` — the claim is based on conversation history,
    prior documents, or logical inference, not a direct check of live
    files. This is not forbidden, but it must be labeled as such so a
    reader knows it hasn't been verified against the repo.
  - `narrated agent report` — an agent (Devin, Claude, etc.) reported the
    state verbally without a file read; the writer is relaying, not
    verifying.

A claim without this marker is to be treated by any reader, including
other agents, as **unverified** — not as false, but as not yet earning
the trust a bare assertion implies.

**Re-verification threshold:** if a marked claim's date is more than
**two weeks** old relative to when someone is about to rely on it,
re-verify before trusting it. Don't propagate an old "still open" claim
forward as if it were freshly checked. Two weeks is not a hard expiry —
the claim may still be correct — but it's the point where the date
stops being a recent confirmation and starts being a stale one.

**Relationship to ADR-015:** The Status Board
(`ts/src/status/board.data.ts`, ADR-015) already does exactly this for
project status specifically, via its mandatory `lastUpdated` field per
entry. **ADR-016 generalizes that same discipline to every other kind of
staleness-prone claim in the repo** — ADRs, AGENTS.md, per-game
`docs/state/current.md` files, SDD narrative sections — not just project
status entries. The Status Board is the first concrete instance; this
ADR is the project-wide rule.

---

## Consequences

**Positive:**
- Closes the specific, now-twice-repeated failure mode directly, with a
  rule cheap enough to actually follow: one date + one method tag per
  claim, not a process overhaul.
- Makes an old, uncorrected "still open" claim a visible gap (missing or
  stale marker) rather than an invisible one. A reader or agent can see
  "research/inference, July 2026" and know not to treat it as freshly
  verified.
- Aligns the entire repo's documentation discipline with the Status
  Board's own `lastUpdated` mechanism, rather than leaving that as a
  one-off convention that only applies to one data structure.

**Negative / honest cost:**
- Slightly more verbose ADRs and docs going forward — every
  unresolved-claim sentence needs a short tag. Worth it given the
  alternative just cost two real corrections in one session.
- The two-week threshold is a judgment call, not a mechanical rule. A
  fast-moving project might need shorter; a stable one might tolerate
  longer. Two weeks is the default, not a mandate — the point is to make
  the date visible so the judgment can happen, not to enforce a specific
  number.

---

*Robert Floyd Dugger's direct decision, August 15, 2026.*
*The same bug hit twice in one session. The rule exists so a third time is visible immediately, not discovered later.*
