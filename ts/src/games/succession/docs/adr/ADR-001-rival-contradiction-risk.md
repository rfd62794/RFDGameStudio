# ADR-001: Rival Contradiction Risk

**Date:** August 20, 2026
**Status:** Accepted
**Supersedes:** ADR-001 from AI-Studio zip artifacts (player-only contradiction scope, never migrated to this repo)

## Context

This is honestly the first ADR to exist on-disk for the Succession project
in this repository. The original ADR-001 — which scoped contradiction risk
to the player only as an MVP decision — lived in the AI-Studio zip
artifacts this project started from. It never made it into this repo when
the code migrated over. That gap is flagged separately, not fixed here.
This ADR formally supersedes that original decision's substance with a
real, on-repo record.

The third structural asymmetry identified by the balance simulation
harness: rival Whisper moves have never carried contradiction risk. The
player can be caught contradicting themselves and lose all favor at a
figure. Rivals could whisper freely with zero risk — they gained favor
unconditionally via `applyFavorGain`, never routed through the
contradiction-checking `applyPlayerWhisper` path. This was a deliberate
"player-only for MVP" scope decision from the engine's original
inception.

## Decision

Rival Whisper moves now route through the same contradiction-checking
path as player Whispers. The generalized `applyWhisper` function
replaces the hardcoded `applyPlayerWhisper`, accepting any `ClaimantId`.
Rivals select themes via `chooseRivalWhisperTheme`, which prefers
repeating a prior claim at the same figure (never self-contradicting)
and falls back to a fresh theme only when no prior claim exists at that
figure.

The `Claim` interface now carries a required `claimantId: ClaimantId`
field. Every existing call site that constructs a `Claim` was updated to
pass `claimantId` explicitly — no silent defaults.

`resolveVerdict` was not modified. It was already claimant-agnostic:
`exposedAgainst` filtering (line 17) works for any claimant. This is
proven by a test, not assumed.

## Consequences

### Known Limitation: Shared `mostRecentClaim`

`figure.mostRecentClaim` is a single field shared across all claimants
at a figure. This means only the *most recent* claim from *any* claimant
at a figure is checked — if the player whispers, then a rival whispers,
the rival's contradiction check is against the player's claim, not the
rival's own prior claim. Properly scoping per-claimant memory (each
claimant remembering only their own claims) is a bigger change than
this directive's size warrants. It is named here explicitly rather than
silently fixed or hidden.

### Known Risk: "Always Repeat" May Be Mechanically Inert

`CLAIM_THEMES` gives each figure exactly two flat-value, equally-good
themes. A rational rival that repeats its own prior claim at a figure
can *never* contradict itself, and gains nothing from switching —
meaning "always repeat" is strictly dominant and risk-free. This could
make the entire contradiction-risk fix mechanically inert in practice.

This phase ships the honest, simple version anyway: rivals prefer
repeating a safe theme, falling back to a fresh one only when they've
never claimed at that figure before. The balance harness already tracks
exposure counts. If rival exposures come back at or near zero after this
lands, that's real confirmation the dead-mechanic risk is live, and it
becomes a real follow-up (e.g., diminishing returns on repeating the
same theme) — not something to guess-fix on paper now.

### What Changed

- `engine/types.ts`: `Claim` interface gains required `claimantId` field
- `engine/favor.ts`: `applyPlayerWhisper` → `applyWhisper` (generalized, no dead wrapper)
- `engine/rivalAI.ts`: New `chooseRivalWhisperTheme` export
- `utils/gameOrchestration.ts`: `resolveRivalMoves` routes rival whispers through `applyWhisper`
- `engine/verdict.ts`: **No changes** — already claimant-agnostic

### What Did NOT Change

- `verdict.ts` — byte-identical, proven by test not assumption
- `rivalAI.ts` `chooseRivalMoves` logic — only added a new function, existing behavior preserved
- All existing test assertions — only signatures and Claim constructions updated, behavior unchanged for the player path
