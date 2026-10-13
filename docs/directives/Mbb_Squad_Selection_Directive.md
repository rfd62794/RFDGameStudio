# Mutant Battle Ball: squad selection

**Depends on:** `Mbb_Post_Match_Salvage_Recruit_Directive.md`.

**Read first:** `docs/demos/mutant_battle_ball/DIRECTION.md`, `docs/demos/mutant_battle_ball/ROADMAP.md`, `ts/src/games/mutant_battle_ball/App.tsx`, `ts/src/games/mutant_battle_ball/types.ts`, `ts/src/games/mutant_battle_ball/components/RosterTab.tsx`, `ts/src/games/mutant_battle_ball/persist.ts`, and `ts/src/games/mutant_battle_ball/simulation/mbbSimulation.ts`.

## 1. Why this exists

After salvage recruitment makes the roster larger than two, the player must choose exactly two valid healthy mutants rather than always fielding the first two roster entries.

## 2. Scope

- A pure squad-selection module under `ts/src/games/mutant_battle_ball/`.
- Selection presentation in `ts/src/games/mutant_battle_ball/components/RosterTab.tsx` with thin wiring in `ts/src/games/mutant_battle_ball/App.tsx`.
- Match initialization consuming selected mutant ids.
- New behavior-first tests in `ts/tests/test_mbb_squad_selection.ts` and necessary persistence coverage.

## 3. The work

1. Write failing behavior tests first for selecting exactly two unique roster ids, rejecting missing/duplicate/unavailable ids, replacing a selected member, and preserving a valid selection across save/restore.
2. Implement selection invariants as pure functions. Do not bury eligibility or cardinality rules in React event handlers.
3. Add clear Roster UI for choosing two members once three or more exist. The current valid pair remains selected unless the player changes it.
4. Make match initialization resolve the selected ids to roster members and fail safely to a valid healthy pair if persisted ids are stale.
5. Keep full MBB behavior and persistence tests green.

## 4. What NOT to do

- Do not implement injury or the Infirmary in this directive; that follows squad selection.
- Do not add recruitment mechanics beyond consuming the already-landed roster growth.
- Do not alter combat, scoring, speed, health, `calculateStats`, or part/modifier semantics.
- Do not modify the preserved Lua source.

## 5. Forbidden Actions

No deploys, installs, generated registry/manifest/metadata edits, force pushes, merges, protected-repo work, Lua edits, production balance changes, or unrelated UI redesign.

## 6. Required from User

none.

## 7. Verification

Run exactly:

```text
cd ts && npx vitest run tests/test_mbb_squad_selection.ts
cd ts && npx vitest run tests/test_mbb_persistence.ts tests/test_mbb_squad_selection.ts
cd ts && npx vitest run tests/test_mbb_*
```

Behavior proof must select a pair other than the original first two and show match initialization consumes those selected ids.

## 8. Rules for this run

- Start only after the recruit directive is present in the branch history.
- Non-interactive; do not install, fetch, deploy, or merge.
- Tests first; selection policy belongs in pure functions and React remains presentation/wiring.
- Preserve `calculateStats` summing/modifier semantics and the Lua source.
- Commit and push normally on the directive branch; never bypass hooks.

## 9. Completion criteria

- [ ] Recruit dependency is present and the roster can exceed two.
- [ ] Behavior-first tests cover exactly-two, uniqueness, eligibility, stale ids, and replacement. <!-- test: ts/tests/test_mbb_squad_selection.ts -->
- [ ] The Roster UI lets the player choose exactly two valid healthy members.
- [ ] Match initialization uses the selected ids.
- [ ] Valid selection persists; stale selection recovers safely.
- [ ] All verification commands pass with real counts recorded.

## 10. Report

Report dependency commit, files changed, failing-before and passing-after tests, selection invariants, selected-id match proof, persistence behavior, full MBB counts, and unrelated baseline failures.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Model | swe-2-high |
| Branch | directive/rfdgamestudio-mbb-squad-selection |
| Base branch | - |
| Base commit | ea365a24 |

**Status log**
- 2026-10-11 · robert-claude-laptop · none → Draft — Drafted from approved M2 roadmap; depends on salvage recruitment and is not queued.
<!-- queue:end -->
