# Audit the Status-Unconfirmed games: revive, polish, or retire

## 1. Why this exists

Four games carry **Status Unconfirmed** on the StatusBoard — real evidence
of real work, no recent confirmation of where they stand:

- **SlimeGarden** — substantial design work (SlimeDex, Life Stages, partial
  Color Tree) as of mid-July.
- **7 Days to Fry** — imported alongside KingMaker Squads (now retired); no
  status since. Has a `ts/src/games/7_days_to_fry/` dir but is not in
  `registry.ts`.
- **TurboShells** — named a genuine cross-language-origin Lua exception.
- **VoidDrift (native)** — Rust/Bevy/Android, Act 1 of the locked trilogy;
  a previously-flagged `OpeningCompleteEvent` blocking bug may still be open.

Someone has to look at each one directly before any polish or revamp effort
is spent on it. This is an audit, not a build.

## 2. Scope

Read-only inspection of the four games' directories (`ts/src/games/` and/or
`games/` and `examples/` as applicable) plus a written report. Deliverable:
`docs/state/unconfirmed-audit-2026-09.md` committed on the run's branch.

## 3. The work

For each of the four games, the report answers:

1. **What exists** — entry point, last-commit recency, does it build/boot
   (run the cheapest honest check: a targeted test or a build command if one
   exists; do not fix what you find).
2. **How far along** — mechanics present vs. stubbed, judged from the code
   and any in-tree docs, not from the board.
3. **What blocks it** — named concretely (e.g. VoidDrift's
   OpeningCompleteEvent bug: open or fixed?).
4. **Recommendation** — revive (with the single next step), polish-in-place,
   hold, or retire (with proposed successor per the retirement pattern).

Then update each game's StatusBoard row's `Last Updated` and `Status` in
`ts/src/status/board.data.ts` only where the audit findings justify it —
regenerate the board with `ts/tools/generate-status-board.ts` if it changed.

## 4. What NOT to do

- Do not fix bugs found during the audit — report them. Fixing is a separate
  directive once a game is classified.
- Do not retire anything — recommendations only; retirement is Robert's call.
- Do not register unregistered games into `registry.ts`.

## 5. Verification

- `docs/state/unconfirmed-audit-2026-09.md` exists with all four sections.
- `cd ts && npm test` green (board data is generated from a TS file — keep
  it compiling).
- Report summarizes the four verdicts in four lines.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-09-28 21:57 · devin-overseer (delegated) · Queued → Approved
<!-- queue:end -->
