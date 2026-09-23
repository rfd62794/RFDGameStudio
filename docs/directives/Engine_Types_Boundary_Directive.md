# Engine boundary: move horse_racing domain types out of `engine/types.ts`

**Read first:** `ts/src/engine/types.ts` (the whole file — contract types AND
racing types are interleaved), `ts/src/games/horse_racing/types.ts` (it
re-exports the racing types back from engine/types — that direction flips),
`ts/src/games/horse_racing/App.tsx` and its `components/` importers.

## 1. Why this exists

`ts/src/engine/types.ts` is the engine's contract file — `GameFiles`,
`GameSession`, `GameRendererProps`, `GameConfig`, `GameStatus`,
`ArcadeSection`, `LeaderboardDef`, `PrimaryGenre`, the error classes. It also
carries horse_racing's domain model: `Horse`, `RaceParticipant`, `Bet`,
`RaceResult`, `CurrentRace`, `RaceHistoryEntry`, `GameState` (the
funds/horses/current_race shape). Every game importing `GameConfig` drags in
racing types, and `engine/types.ts` imports nothing from games — the leak is
one-directional and mechanical to fix.

## 2. The work

1. Move `Horse`, `RaceParticipant`, `Bet`, `RaceResult`, `CurrentRace`,
   `RaceHistoryEntry`, `GameState` (verify each is genuinely racing-shaped —
   `GameState` here is the racing state, not an engine concept) into
   `ts/src/games/horse_racing/types.ts`, replacing its re-export block with
   the real definitions. Keep the `HorseRacingState` alias.
2. Update importers: `horse_racing/components/BettingTab.tsx`,
   `BreederTab.tsx`, `RaceTrack.tsx`, `StableTab.tsx` (and any others grep
   finds — `grep -rn "from.*engine/types" ts/src/games`) take racing types
   from `../types` / the local types file; engine-contract types
   (`GameSession`, `RuntimeError`, `GameRendererProps`, …) keep importing
   from `engine/types`.
3. `grep -rn "engine/types" ts/src` afterwards: no racing type may be
   imported from `engine/types` anywhere.

## 3. What NOT to do

- Pure move — no field changes, no renames, no new abstractions.
- Do not touch `logic.lua`, `data.yaml`, `systems.yaml`, or any test's
  assertions beyond import-path fixes.

## 4. Completion criteria

- [ ] `cd ts && npx vitest run` — no new failures. Baseline recorded
      2026-09-23 on `main`: 3 failures, all in
      `tests/test_dual_target_deploy.ts` (ENOENT on stale `dist-shoal` asset
      hashes) — pre-existing, not yours to fix.
- [ ] `cd ts && npm run build` — tsc clean.
- [ ] `grep -n "interface Horse\|interface Bet\|interface RaceResult"
      ts/src/engine/types.ts` returns nothing.

## Sandbox needs

- Exec(npm run build)
- Exec(npx vitest)
- Exec(npm test)

## 5. Rules for this run

- NON-INTERACTIVE: confirmation-requiring tool calls end the run. No
  installs, downloads, fetches, or reads outside the worktree.
- **Never use `git -C` / `git -c` / `git --git-dir` / `git --work-tree` —
  flag forms are denied by dispatch policy and a denial ends the run.** Run
  git with the worktree as your working directory.
- Branch `directive/rfdgs-engine-types-boundary-directive` from `main`.
  Never commit to `main`, never push.
- If a tool call is genuinely blocked, stop and write why in the Status row.
