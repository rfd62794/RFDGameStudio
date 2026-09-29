# Shoal polish: menu, first-run tutorial, sound hooks

## 1. Why this exists

Shoal is Shipped/Mature — TS-native migration done (151x tick speedup), artGen
fully consumed — but its StatusBoard row reads Menu=N, Tutorial=N, Sound=N.
The mechanics are done; the chrome is missing. This is a polish pass, not a
redesign.

## 2. Scope

`ts/src/games/shoal/` only, plus shared components in `ts/src/ui/components/`
which already exist: `TitleScreen.tsx`, `OnboardingGate.tsx` (the fire-once
gate Shoal itself originally contributed), `EndStateScreen.tsx`,
`MoreGamesByMe.tsx`.

## 3. The work

1. **Menu/title screen** using the shared `TitleScreen` component — game name,
   Start, and a "how to play" entry point. Match the pattern another registry
   game already uses rather than inventing a second menu style.
2. **First-run tutorial** via `OnboardingGate` (it exists precisely for this)
   or the game's own minimal equivalent: 3-5 lines teaching drop-food /
   shark-pressure basics on first launch only.
3. **Sound** — if `engine/shared/sfx/` exists (Polish_Shared_Sfx), wire
   feeding, predator strikes and day-boundary events to it. If it does not,
   add a minimal local Web Audio effect set following `gladiator_arena`'s
   pattern, and note in the report that it should migrate to the shared module.
4. Any missing `EndStateScreen` handling for win/lose states.

## 4. What NOT to do

- Do not change simulation logic (`sim.ts`, tick behaviour, balance constants).
- Do not restyle artGen output — the canvas look is intentional and tested.
- Do not add audio asset files; procedural Web Audio only, muted until first
  gesture.
- No dependency on Polish_Shared_Sfx — land the chrome either way.

## Shared-component duty (ADR-014)

Shared modules are the studio's default posture. If this pass produces
something with a real, known second use � a HUD widget, a tutorial-step
pattern, a menu variant, an audio event type � extract it into
`ts/src/ui/components/` or `ts/src/engine/shared/` instead of leaving a
per-game copy, and name the extraction plus its second consumer in the
report. Do not extract speculatively; a real second use must already exist
or be clearly likely (a second live game wanting it now counts).

## 5. Verification

- `cd ts && npm test` green (shoal tests: `test_shoal_*` files must still pass).
- `cd ts && npm run build:shoal` succeeds.
- New component coverage where the suite's conventions expect it.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
<!-- queue:end -->
