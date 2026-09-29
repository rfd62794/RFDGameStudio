# Gladiator Arena polish: menu and tutorial (sound already done)

## 1. Why this exists

Gladiator Arena is the arcade's sound pioneer â€” procedural Web Audio effects
landed â€” but it lacks the other chrome: Menu=N, Tutorial=N, Visual=N on the
StatusBoard (Sound=Y). Polish only.

## 2. Scope

`ts/src/games/gladiator_arena/` only. Shared components in
`ts/src/ui/components/` (`TitleScreen`, `OnboardingGate`, `EndStateScreen`,
`MoreGamesByMe`).

## 3. The work

1. **Menu** via shared `TitleScreen` â€” roster management games benefit most
   from a title screen that orients (your stable, your funds) before the first
   match.
2. **First-run tutorial**: 3-5 lines on the actual loop (recruit, equip,
   fight, anatomy damage consequences â€” read the game's existing copy/state
   first), gated to first launch.
3. **Visual pass**: HUD readability for match state (turn order, part
   integrity, wounds) â€” modest, consistent with arcade siblings.
4. **Sound**: already done; if `engine/shared/sfx/` landed (Polish_Shared_Sfx)
   first, migrate the local effects to it; otherwise leave sound alone and
   note it as the reference implementation.

## 4. What NOT to do

- Do not touch combat resolution, anatomy damage math, or the AI.
- Do not regress the existing sound work â€” migrate only if the shared module
  exists and covers the same events.
- No dependency on Polish_Shared_Sfx.

## Shared-component duty (ADR-014)

Shared modules are the studio's default posture. If this pass produces
something with a real, known second use — a HUD widget, a tutorial-step
pattern, a menu variant, an audio event type — extract it into
`ts/src/ui/components/` or `ts/src/engine/shared/` instead of leaving a
per-game copy, and name the extraction plus its second consumer in the
report. Do not extract speculatively; a real second use must already exist
or be clearly likely (a second live game wanting it now counts).

## 5. Verification

- `cd ts && npm test` green (`test_mbb_*`/`gladiator` related tests still
  pass); `npm run build` clean.
- Report names what was added: menu / tutorial / visual / sound-migration.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-gladiator-arena-chrome-directive |
| Base branch | - |
| Base commit | 9e1825d9222854cd43e7e25f54615680394d52fd |
| Head commit | 8f4a83b2a433df0bab21dbada3934e4aaa710a43 |

**Status log**
- 2026-09-28 21:56 · devin-overseer (delegated) · Queued → Approved
- 2026-09-29 01:44 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-gladiator-arena-chrome-directive; copied ts/src/games/game-metadata.json; lane=default; model=swe-2-high; persona=steady-builder
- 2026-09-29 02:19 · devin-overseer (delegated) · In progress → Review — run died mid-push-hook after full green (967 pytest + 1966 vitest + build clean, all committed); salvaged worktree commits and pushed via hook-verified push [origin] spent: devin 25 min est. n/a
- 2026-09-29 02:20 · devin-overseer (delegated) · Review → Done
<!-- queue:end -->
