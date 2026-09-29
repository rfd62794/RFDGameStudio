# Horse Racing polish: tutorial, visual pass, sound hooks

## 1. Why this exists

Horse Racing is Shipped/Mature on the arcade (Lua-backed logic, TS surface at
`ts/src/games/horse_racing/` â€” `App.tsx`, `components/`, `config.ts`), but
Tutorial=N, Visual=N, Sound=N on the StatusBoard. Polish only.

## 2. Scope

`ts/src/games/horse_racing/` only. Shared components in
`ts/src/ui/components/` (`OnboardingGate`, `EndStateScreen`, `StatBar`,
`Panel`, `MoreGamesByMe`). The race/breeding sim logic is Lua
(`games/horse_racing/`) â€” do not rebalance it.

## 3. The work

1. **First-run tutorial**: 3-5 lines â€” what the player does (enter races,
   read odds/stats, breed between seasons â€” whatever the game actually has;
   read it first), gated to first launch.
2. **Visual pass**: the race view and any stable/breeding screens get
   readable contrast, a real HUD (season, purse/funds, horse condition as
   surfaced by the sim), consistent spacing. The existing `pygame_gui` label
   warnings in the Python test suite are NOT in scope â€” this is the ts
   surface only.
3. **Sound**: `engine/shared/sfx/` if present, else minimal local Web Audio
   per `gladiator_arena` â€” race start gun, finish, win.
4. `EndStateScreen` for season end / bankruptcy if terminal states exist.

## 4. What NOT to do

- No sim/balance changes (odds, breeding math, season structure).
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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
<!-- queue:end -->
