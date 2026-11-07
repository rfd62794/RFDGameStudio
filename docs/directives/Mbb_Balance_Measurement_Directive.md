# Mutant Battle Ball: seeded balance measurement

**Depends on:** none. This evidence-only directive is independent of the feature sequence.

**Read first:** `docs/demos/mutant_battle_ball/DIRECTION.md`, `docs/demos/mutant_battle_ball/ROADMAP.md`, `ts/src/games/mutant_battle_ball/simulation/mbbAgent.ts`, `ts/src/games/mutant_battle_ball/statsMapper.ts`, `ts/src/games/mutant_battle_ball/playerAdapter.ts`, `ts/src/games/mutant_battle_ball/simulation/mbbSimulation.ts`, `ts/src/games/mutant_battle_ball/simulation/mbbConfig.ts`, and existing `test_mbb_*` simulation/balance tests.

## 1. Why this exists

Player and opponent speed/health scaling may be mismatched, but policy must follow seeded evidence rather than intuition. This directive measures equivalent-rated outcomes only; a separate approved follow-up may choose player-side effective-stat normalization or opponent-data scaling.

## 2. Scope

- New deterministic aggregate measurement tests in `ts/tests/test_mbb_balance_measurement.ts`.
- Existing public simulation/test helpers only, or a test-only helper if required.
- A concise evidence table in the test output or directive report covering speed, health, scoring margin, and win distribution across fixed seeds.

## 3. The work

1. Write a deterministic test harness using explicit fixed seeds and equivalent-rated player/opponent fixtures.
2. Run enough completed matches to report sample count, player/opponent effective speed and starting health, average scores/scoring margin, wins/losses/ties, and termination rate.
3. Assert reproducibility and basic measurement integrity only: identical seeds produce identical aggregates; all runs terminate; values are finite; totals reconcile.
4. Record the measured evidence and recommend which question a later directive should test. Do not encode a preferred production balance policy in this change.
5. Keep the full MBB suite green.

## 4. What NOT to do

- Do not change production balance, constants, opponent data, player stats, speed, health, scoring, combat, steering, or matchup policy.
- Do not normalize or clamp `calculateStats`; preserve its raw six-part summing and modifier pipeline exactly.
- Do not change `statsMapper.ts` behavior merely to make measurements look balanced.
- Do not edit Lua source, add gameplay features, or make balance assertions dependent on random unseeded runs.

## 5. Forbidden Actions

Any production balance change; snapshotting a desired win rate as truth; unseeded evidence; deploys; installs; generated registry/manifest/metadata edits; force pushes; merges; protected-repo work; or Lua edits.

## 6. Required from User

none.

## 7. Verification

Run exactly:

```text
cd ts && npx vitest run tests/test_mbb_balance_measurement.ts
cd ts && npx vitest run tests/test_mbb_balance_measurement.ts
cd ts && npx vitest run tests/test_mbb_*
```

The first two measurement runs must report byte-equivalent aggregate values. The diff must contain no production balance changes.

## 8. Rules for this run

- This is independent, evidence-only work; do not wait for recruitment, squad, or Infirmary directives.
- Tests first and deterministic seeds only.
- Production files may be read but not changed for tuning; prefer test-only harness code.
- Preserve `calculateStats` parts-summing/modifier semantics, `statsMapper.ts` behavior, and Lua source.
- Non-interactive; no installs, fetches, deploys, merges, or hook bypasses.

## 9. Completion criteria

- [ ] The measurement test reports sample count, effective speed, starting health, score margin, win/loss/tie distribution, and termination rate. <!-- test: ts/tests/test_mbb_balance_measurement.ts -->
- [ ] Re-running it produces identical aggregates.
- [ ] Integrity assertions pass without asserting a desired winner or win percentage.
- [ ] No production balance or Lua file changed.
- [ ] Full MBB tests pass with real counts recorded.
- [ ] Report recommends evidence-informed follow-up without implementing it.

## 10. Report

Report files changed; seeds and sample count; the exact aggregate table; repeatability proof; full MBB counts; confirmation that production balance, `calculateStats`, and Lua source were untouched; and the recommended follow-up question, not a balance change.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Model | swe-2-high |
| Branch | directive/rfdgamestudio-mbb-balance-measurement |
| Base branch | - |
| Base commit | ea365a24 |

**Status log**
- 2026-10-11 · robert-claude-laptop · none → Draft — Drafted from approved M4 roadmap as independent evidence-only work; not queued.
<!-- queue:end -->
