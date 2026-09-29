# Slither Rogue polish: menu, tutorial, visual pass, sound hooks

## 1. Why this exists

Slither Rogue is the barest game on the arcade â€” StatusBoard row reads
Menu=N, Tutorial=N, Visual=N, Sound=N. It is live via the Lua-backed path and
has a TS surface at `ts/src/games/slither_rogue/` (`App.tsx`, `components/`,
`config.ts`). This is a polish pass on the TS surface, not a redesign and not
a logic change.

## 2. Scope

`ts/src/games/slither_rogue/` only. Shared chrome already exists in
`ts/src/ui/components/` (`TitleScreen`, `OnboardingGate`, `EndStateScreen`,
`MoreGamesByMe`) â€” use it. Lua-side `games/slither_rogue/` is logic; do not
rebalance it.

## 3. The work

1. **Menu** via shared `TitleScreen` (or the pattern a sibling game uses if
   `TitleScreen` doesn't fit the wrapper structure â€” say which in the report).
2. **First-run tutorial**: 3-5 lines on movement/growth/death basics, gated
   to first launch (`OnboardingGate` or equivalent persistence the game
   already uses â€” check `engine/shared/persistence.ts`).
3. **Visual pass**: the board's `Visual=N` â€” give the play surface readable
   contrast, a HUD (length, alive/dead, depth/level if the game has one), and
   consistent spacing with the arcade's other games. Modest, not a re-skin.
4. **Sound**: wire `engine/shared/sfx/` if it exists (Polish_Shared_Sfx);
   otherwise minimal local Web Audio following `gladiator_arena`, noted for
   later migration.

## 4. What NOT to do

- Do not change `logic.lua` / `systems.yaml` / game balance.
- Do not restyle beyond readability â€” no new art direction.
- No audio asset files; procedural only, muted until first gesture.
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

- `cd ts && npm test` green; `npm run build` clean.
- The game still loads in the arcade (`test_arcade_*` / loader tests pass).
- Report names what was added per column: menu / tutorial / visual / sound.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-slither-rogue-chrome-directive |
| Base branch | - |
| Base commit | ebf4e7c01cddd2552641447e38c0f3105b46c1af |

**Status log**
- 2026-09-28 21:55 · devin-overseer (delegated) · Queued → Approved
- 2026-09-29 04:50 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-slither-rogue-chrome-directive; copied ts/src/games/game-metadata.json; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
