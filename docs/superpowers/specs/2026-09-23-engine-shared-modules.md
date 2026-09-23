# Spec — engine shared-module program (ADR-014 extractions)

2026-09-23 · Devin (interactive, laptop) · for Robert + Claude review

## Intent

Audit-backed list of what to extract into `ts/src/engine/shared/` and
`ts/src/hooks/`, per ADR-014's "real second use" rule. Every item below was
verified against the live files on 2026-09-23, not doc claims.

## Verified findings

### Extract now (multiple live consumers)

1. **`shared/math` — byte-identical duplication.** `clamp`, `dist2`,
   `distance`, `normalize`, `limitVector`, `lerp` are verbatim in
   `games/mutant_battle_ball/simulation/mbbMath.ts` and
   `games/shoal/simulation/shoalSimulation.ts`. Both also carry the same
   LCG PRNG (`makePrng`/`prngFloat`/`prngInt`, "matching Lua math.random
   semantics") — distinct from `shared/seededRandom`'s mulberry32 and worth
   sharing for Lua-port parity. 29 game files do distance/vector work.
2. **`shared/persistence` — 8 bespoke localStorage impls.** `dissonance`,
   `early_learning_buddy` (×3 keys), `gladiator_arena`, `horse_racing`,
   `planetofgreed`, `slimeworld`, `slither_rogue` (×2 files) each re-roll
   `try/catch JSON.parse` with hand-rolled keys, no versioning, no
   corrupt-save recovery. Module: `loadSave(key, opts)` /
   `writeSave(key, value)` with `rfd:<game>:` namespacing, JSON-safety, and
   a `version` + `migrate` hook.
3. **`shared/audio` — two parallel Web Audio engines.**
   `early_learning_buddy/utils/audio.ts` (250 LOC, `AudioEngine`) and
   `gladiator_arena/utils/soundEffects.ts` (145 LOC, `SoundEngine`) share the
   same skeleton: lazy `AudioContext` w/ webkit fallback, suspend/resume,
   mute flag, oscillator+gain recipes. Extract the engine core (context
   lifecycle, mute, tone/sweep/noise primitives); game recipes stay local.

### Fix the boundary

4. **`engine/types.ts` domain leak.** `Horse`, `RaceParticipant`, `Bet`,
   `RaceResult`, `CurrentRace`, `RaceHistoryEntry`, `GameState` are
   horse_racing types sitting in the engine contract file next to
   `GameConfig`/`GameSession`; `games/horse_racing/types.ts` re-exports them
   back. Move them down; flip the re-export.

### Adopt what exists

5. **`EndStateScreen` under-adoption.** Shared component exists
   (`ui/components/`), used by brewfield + dissonance only; bespoke
   game-over screens in `slither_rogue` (GameOverModal), `choke_point`,
   `wire_rust`. Migration, not new code.
6. **`useGameLoop` stragglers.** `slither_rogue/GameCanvas.phase2g.tsx` (a
   WIP duplicate file — itself a smell) and `voiddrift_redux/OrbitalCanvas.tsx`
   roll raw rAF.

### Decide, don't drift

7. **Lua `engine/systems` is nearly unwired.** `engine_systems: []` on ~10 of
   12 Lua games; only `horse_racing` (genetics/odds/market) and `wire_rust`
   (inventory) consume; `combat.lua` has zero; slimeworld reimplements
   genetics locally. TS-native is the default — so either audit-and-wire the
   Lua systems where they fit, or formally freeze them as Lua-legacy and
   point shared investment at TS. Needs Robert/Claude's call; the
   "self-contained port" comment habit is settling a decision nobody made.

## Below the bar (do NOT extract — no real second use yet)

- Keyboard input helpers (4 listeners, different shapes).
- High-score table (slither_rogue only).
- `wrap` variants in shoal (world-specific topology).

## Phasing

- **Phase A (directives written):** `shared/math` extraction + migration;
  `shared/persistence` extraction + migration; `engine/types.ts` boundary.
- **Phase B:** `shared/audio` extraction; `EndStateScreen`/useGameLoop
  adoption sweep; `GameCanvas.phase2g.tsx` cleanup.
- **Phase C:** Lua `engine/systems` audit → wire-or-freeze decision record.

Each phase is independent; every migration keeps behavior identical
(byte-identical math, same save keys via explicit `legacyKey` mapping).
