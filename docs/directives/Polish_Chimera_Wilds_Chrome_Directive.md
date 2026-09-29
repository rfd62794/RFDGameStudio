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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
<!-- queue:end -->
