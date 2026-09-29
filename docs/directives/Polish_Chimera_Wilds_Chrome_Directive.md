# Chimera Wilds polish: tutorial, visual pass, sound hooks

## 1. Why this exists

Chimera Wilds is Shipped/Mature and already uses shared menu chrome â€” but its
StatusBoard row reads Tutorial=N, Visual=N, Sound=N. Polish only; the game is
done mechanically.

## 2. Scope

`ts/src/games/chimera_wilds/` only. Shared components live in
`ts/src/ui/components/` (`OnboardingGate`, `EndStateScreen`, `MoreGamesByMe`,
`StatBar`, `Panel`).

## 3. The work

1. **First-run tutorial**: 3-5 lines teaching the game's core verb
   (breeding/collection loop â€” read `config.ts` and the game logic first and
   describe what the game actually teaches), gated to first launch.
2. **Visual pass**: readable HUD for whatever the game tracks (collection
   count, day/season, resources), consistent with arcade siblings. Modest.
3. **Sound**: `engine/shared/sfx/` if present, else minimal local Web Audio
   per the `gladiator_arena` pattern â€” pick 2-5 natural events (capture,
   breed, discovery).
4. `EndStateScreen` for win/lose if the game has terminal states and no
   end screen today.

## 4. What NOT to do

- No logic or balance changes (`games/chimera_wilds/` Lua and ts logic stay).
- No art redesign.
- No audio files; procedural only, muted until first gesture.
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
- Report names what was added: tutorial / visual / sound / end screen.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-chimera-wilds-chrome-directive |
| Base branch | - |
| Base commit | 96f04a7bb9c580200d6aa05f17ac7b1cb3da9d9d |
| Head commit | 2bb35702c676c0a85e5f970d1c7b8dac2718d69f |

**Status log**
- 2026-09-28 21:56 · devin-overseer (delegated) · Queued → Approved
- 2026-09-28 23:27 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-chimera-wilds-chrome-directive; copied ts/src/games/game-metadata.json; lane=default; model=swe-2-high; persona=steady-builder
- 2026-09-29 00:10 · devin-overseer (delegated) · In progress → Review — Added: (1) first-run tutorial — OnboardingGate boolean mode + persisted 'chimera_wilds_tutorial_seen' flag via shared loadSave/writeSave; 4-line 'How to Play' Modal on first New Game entry, describing the real loop (random 6-part chimera, PWR+END+D20 vs chimera total, history log). (2) Visual pass — HUD chips in statusArea (PWR, END, W–L record) + shared StatBar for chimera Power/Endurance + score chip. (3) Sound — no engine/shared/sfx exists, so minimal local Web Audio engine per gladiator_arena pattern (utils/sound.ts): playRoll on encounter click, playWin/playLoss on result, lazy AudioContext (silent until gesture), Volume2/VolumeX mute toggle in HUD. (4) EndStateScreen NOT added — game has no terminal states (endless encounter loop). No shared extraction made: nothing produced has a real known second consumer; a shared sfx module is exactly what the Polish_Shared_Sfx directive covers, which this directive says not to depend on. Also committed: 3 pre-existing tsc errors in slimeworld test fixtures (unused import + two partial-Record fixtures; fixed with the file's own `as Record<Slime['color'], ...>` cast pattern, runtime-identical) needed for 'npm run build' clean, and a regenerated registry-export.json snapshot (pre-push metadata step rewrites the tracked file in fresh worktrees, dirtying the tree mid-hook). Verified: npm test 1962 pass / 0 fail; npm run build clean; pre-push hook green, branch pushed. [origin] spent: devin 0 min est. n/a
- 2026-09-29 02:27 · devin-overseer (delegated) · Review → Done
<!-- queue:end -->
