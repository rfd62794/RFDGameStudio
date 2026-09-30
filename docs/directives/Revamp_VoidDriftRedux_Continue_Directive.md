# VoidDrift Redux: continue the active build

## 1. Why this exists

VoidDrift Redux (the web sim, separate from the native Rust VoidDrift) is
Active: fragment-drift correction and the auto-dispatch FSM with manual
toggle already landed. It is mid-build — this directive continues it, it
does not redirect it.

## 2. Scope

`ts/src/games/voiddrift_redux/` only. **Do not touch the native Rust
VoidDrift** — that is a separate, unconfirmed project (see
Audit_Unconfirmed_Games_Directive). The game's own notes and tests are the
spec of record for what "done" looks like next.

## 3. The work

1. Read the game's current state (CHANGELOG/notes/tests if present) and
   report what the build's documented next steps are before choosing one.
2. Ship one coherent increment of the documented next steps — the same
   discipline as the MBB continuation: done beats broad.
3. Chrome, if missing: menu via shared `TitleScreen`, first-run tutorial via
   `OnboardingGate`, sound via `engine/shared/sfx/` if it exists (local Web
   Audio otherwise). The board shows Menu=N, Tutorial=N, Sound=N.
4. **Shared-component duty (ADR-014):** orbital canvas zoom/pan, drift FSM,
   and fragment-drift mechanics are strong shared candidates — anything with
   a real second consumer goes to `engine/shared/` or `ui/components/`,
   named in the report.

## 4. What NOT to do

- Do not touch `voiddrift/` (the other game dir) or any Rust/Bevy path.
- Do not redesign the sim's goals — continuation, not new direction.
- No paid services; no external assets.

## 5. Verification

- `cd ts && npm test` green; `npm run build` clean.
- Report: documented next steps found, the increment shipped, extractions
  made.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-revamp-voiddriftredux-continue-directive |
| Base branch | - |
| Base commit | 4ea7ae1285d39a6f7901000dd0c1cf9b6a19b603 |
| Head commit | 99bd76a2df95ffa6ee9d2793ea6e2cc2de6521c8 |

**Status log**
- 2026-09-28 21:57 · devin-overseer (delegated) · Queued → Approved
- 2026-09-29 20:12 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-revamp-voiddriftredux-continue-directive; copied ts/src/games/game-metadata.json; lane=default; model=swe-2-high; persona=steady-builder
- 2026-09-29 20:31 · devin · In progress → Review — Next steps found: StatusBoard §2 row flags Menu=N/Tutorial=N/Sound=N; directive §3.3 names the chrome path (TitleScreen, OnboardingGate, engine/shared/sfx); DirectiveTracker shows last increment was fragment-drift. Increment shipped: full chrome pass — shared TitleScreen menu gate (Initialize Simulation + How to Play, Menu button back), new DriftPrimer first-run tutorial via shared OnboardingGate + persisted voiddrift_redux_tutorial_seen flag (loadSave/writeSave), sound confirmed already on shared sfx (autoUnlock+plays) and completed with a visible mute toggle. Extractions: none — orbital zoom/pan, drift FSM, fragment-drift remain the named ADR-014 candidates but have no real second consumer in ts/ today (verified by grep). Verified: vitest 2061 green incl. new test_voiddrift_redux_chrome.ts (10 tests), npm run build clean, pre-push hook green (pytest 967). [origin] spent: devin 18 min est. n/a
<!-- queue:end -->
