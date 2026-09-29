# Shared procedural sound module, then wire it into the arcade

## 1. Why this exists

Of the 14 games in `ts/src/games/registry.ts`, exactly one â€” `gladiator_arena` â€”
has sound (procedural Web Audio API effects). The StatusBoard Sound column is
`N` for every other game. Sound is the single largest polish gap across the
arcade, and per-game bespoke implementations would be the exact duplication
ADR-014 tells us to avoid: a genuinely general capability with a known second
use (seven-plus games) already exists.

## 2. Scope

- New module: `ts/src/engine/shared/sfx/` â€” a small procedural SFX library.
- Reference implementation: whatever `ts/src/games/gladiator_arena/` uses today
  (Web Audio API, no asset files â€” procedural generation only, consistent with
  `test_no_third_party_assets_present` conventions elsewhere in the suite).
- Wire-in: add sound hooks to the arcade games whose board row says Sound=N â€”
  shoal, slimeworld, chimera_wilds, mutant_battle_ball, scrapcrawl, wire_rust,
  choke_point, filipino_bpo_simulator, slime_coin, planetofgreed,
  voiddrift_redux, succession â€” where the game exposes obvious hook points
  (actions, collisions, wins/losses, UI confirmations). Games whose loop makes
  sound meaningless may be skipped with a note in the report.

## 3. The work

1. Generalize the gladiator_arena sound code into `engine/shared/sfx/`: a tiny
   tone/noise/envelope API (think `play("hit")`, `play("coin")`, `play("lose")`),
   volume control, and a global mute that defaults ON for autoplay-policy safety
   (sound only after first user interaction).
2. Per game: find 2-5 natural events and wire them. Small diffs â€” this is
   polish, not redesign.
3. A11y/browser-safety: respect `AudioContext` resume-on-gesture; never crash a
   game if audio is unavailable.
4. Tests: `ts/tests/test_sfx.ts` covering the module's API (envelope math,
   event registry, mute behaviour). Per-game wiring can be covered by existing
   component tests where they exist.

## 4. What NOT to do

- No audio asset files (mp3/wav/ogg) â€” procedural only. No CDN imports.
- Do not redesign any game's mechanics to accommodate sound.
- Do not unmute by default or autoplay audio on page load.
- Do not touch retired games' sources (`corpworld`, `kingmaker_squads`,
  `brewfield`, `slimebreeder`) â€” read-only per the retirement pattern.

## Shared-component duty (ADR-014)

Shared modules are the studio's default posture. If this pass produces
something with a real, known second use — a HUD widget, a tutorial-step
pattern, a menu variant, an audio event type — extract it into
`ts/src/ui/components/` or `ts/src/engine/shared/` instead of leaving a
per-game copy, and name the extraction plus its second consumer in the
report. Do not extract speculatively; a real second use must already exist
or be clearly likely (a second live game wanting it now counts).

## 5. Verification

- `cd ts && npm test` green.
- `cd ts && npm run build` clean.
- `ts/tests/test_sfx.ts` exists and passes.
- Report lists each registry game: wired (with the events chosen) or skipped
  (with the reason).

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
<!-- queue:end -->
