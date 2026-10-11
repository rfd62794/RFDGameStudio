# Mutant Battle Ball: post-match salvage recruit

**Depends on:** none.

**Read first:** `docs/demos/mutant_battle_ball/DIRECTION.md`, `docs/demos/mutant_battle_ball/ROADMAP.md`, `ts/src/games/mutant_battle_ball/App.tsx`, `ts/src/games/mutant_battle_ball/types.ts`, `ts/src/games/mutant_battle_ball/persist.ts`, `ts/src/games/mutant_battle_ball/simulation/mbbSimulation.ts`, `ts/tests/test_mbb_persistence.ts`, and `games/mutant_battle_ball/data.yaml`.

## 1. Why this exists

The settled arc must grow the roster beyond the two starters before squad selection has meaning. A completed match should offer one bounded salvage recruit built from valid existing starter-part data, and the recruit must survive the existing versioned save path.

## 2. Scope

- A small pure recruitment module under `ts/src/games/mutant_battle_ball/`.
- Post-match wiring in `App.tsx` and the existing result surface.
- The existing versioned persistence model in `persist.ts`.
- New behavior-first tests in `ts/tests/test_mbb_recruitment.ts`, plus persistence coverage.

## 3. The work

1. Write failing behavior tests first for deterministic recruit creation, accepting at most one recruit per completed match, unique stable ids, valid existing parts, and rejecting duplicate acceptance.
2. Add a pure recruitment state transition. Keep generation/acceptance out of `App.tsx`; the app only presents the result and applies the transition.
3. Offer the salvage recruit only after a completed match. Do not create an unbounded recruit loop or silently add recruits during initialization.
4. Extend the existing versioned save/restore path so the larger roster round-trips without discarding old valid saves.
5. Keep the full MBB suite green.

## 4. What NOT to do

- Do not add squad selection, injury, recovery, brands, OEM tiers, Gravekeeper systems, or unrelated collection depth.
- Do not change match balance, `calculateStats`, `statsMapper.ts`, or any simulation tuning.
- Do not rewrite persistence or put recruitment policy directly in `App.tsx`.
- Do not modify or remove the Lua source under `games/mutant_battle_ball/`.

## 5. Forbidden Actions

No deploys, dependency installs, generated registry/manifest/metadata edits, force pushes, merges, protected-repo work, Lua edits, or production balance changes.

## 6. Required from User

none.

## 7. Verification

Run exactly:

```text
cd ts && npx vitest run tests/test_mbb_recruitment.ts tests/test_mbb_persistence.ts
cd ts && npx vitest run tests/test_mbb_*
```

Behavior proof must show a completed match can offer and accept one valid recruit, the roster grows once, and the recruited roster survives save/restore.

## 8. Rules for this run

- Non-interactive; do not install, fetch, deploy, or merge.
- Tests first, then the smallest production implementation.
- Keep recruitment as a pure module/state transition; keep `App.tsx` wiring thin.
- Preserve `calculateStats` raw parts-summing/modifier semantics and preserve the Lua source.
- Commit only on the directive branch and push normally; never bypass hooks.

## 9. Completion criteria

- [ ] `test_mbb_recruitment.ts` fails before implementation and passes afterward. <!-- test: ts/tests/test_mbb_recruitment.ts -->
- [ ] Exactly one bounded post-match recruit can be accepted from valid existing parts.
- [ ] Duplicate acceptance and invalid recruit state are rejected.
- [ ] The recruited roster round-trips through the existing versioned persistence path.
- [ ] Both verification commands pass with real output recorded.
- [ ] Only scoped MBB code/tests and necessary directive status metadata changed.

## 10. Report

Report files changed; the failing-before and passing-after behavior tests; recruit id/part invariants; persistence compatibility; full MBB test counts; and any pre-existing failures separately.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Model | swe-2-high |
| Branch | directive/rfdgamestudio-mbb-post-match-salvage-recruit |
| Base branch | - |
| Base commit | ea365a24 |

**Status log**
- 2026-10-11 · robert-claude-laptop · none → Draft — Drafted from approved M1 roadmap; not queued.
<!-- queue:end -->
