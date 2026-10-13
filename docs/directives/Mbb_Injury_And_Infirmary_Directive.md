# Mutant Battle Ball: injury and Infirmary

**Depends on:** `Mbb_Squad_Selection_Directive.md` (and transitively `Mbb_Post_Match_Salvage_Recruit_Directive.md`).

**Read first:** `docs/demos/mutant_battle_ball/DIRECTION.md`, `docs/demos/mutant_battle_ball/ROADMAP.md`, `ts/src/games/mutant_battle_ball/types.ts`, `ts/src/games/mutant_battle_ball/tabs.ts`, `ts/src/games/mutant_battle_ball/components/InfirmaryTab.tsx`, `ts/src/games/mutant_battle_ball/components/RosterTab.tsx`, `ts/src/games/mutant_battle_ball/simulation/mbbCombat.ts`, `ts/src/games/mutant_battle_ball/simulation/mbbSimulation.ts`, `ts/src/games/mutant_battle_ball/persist.ts`, and the future squad-selection tests.

## 1. Why this exists

Injury should make match outcomes matter, but it may not strand a mutant or leave a visible stub. Injury transitions and a real recovery path must land in the same change, after squad selection exists.

## 2. Scope

- Typed roster-level injury/recovery transitions in a small pure module.
- Mapping completed-match consequences to roster status without changing combat balance.
- Squad eligibility excluding unavailable mutants.
- A functional `ts/src/games/mutant_battle_ball/components/InfirmaryTab.tsx`, restored to `ts/src/games/mutant_battle_ball/tabs.ts` only when recovery choices work.
- Save compatibility and behavior-first tests in `<!-- new: ts/tests/test_mbb_infirmary.ts -->` plus squad/persistence coverage.

## 3. The work

1. Write failing behavior tests first for injury assignment, healthy/unavailable eligibility, recovery countdown, completed-match decrement, recovery completion, save round-trip, and avoiding a no-eligible-squad dead end.
2. Add pure typed transitions from match consequences to roster status and from completed matches/recovery choices to health. Keep policy separate from simulation and UI.
3. Exclude injured/infirmary/dead mutants from squad selection according to the existing `Mutant.status` model. Define a safe outcome when fewer than two healthy mutants remain.
4. Implement the real Infirmary recovery choices and restore the tab/navigation entry in the same commit that activates injury.
5. Persist injury state and recovery counters through the existing versioned save path.

## 4. What NOT to do

- Never land injury without working recovery and a usable Infirmary in the same commit.
- Do not change tackle odds, damage amounts, speed, health scale, opponent data, scoring, or other production balance.
- Do not add brands, OEM tiers, Gravekeeper systems, permadeath expansion, or unrelated collection depth.
- Do not change `calculateStats` summing/modifier semantics or the Lua source.

## 5. Forbidden Actions

No partial injury-only commit, deploys, installs, generated registry/manifest/metadata edits, force pushes, merges, protected-repo work, Lua edits, or production balance tuning.

## 6. Required from User

none.

## 7. Verification

Run exactly:

```text
cd ts && npx vitest run tests/test_mbb_infirmary.ts tests/test_mbb_squad_selection.ts
cd ts && npx vitest run tests/test_mbb_persistence.ts tests/test_mbb_infirmary.ts tests/test_mbb_squad_selection.ts
cd ts && npx vitest run tests/test_mbb_*
```

Behavior proof must show injury creates an unavailable roster member, that member cannot be selected, completed-match recovery progresses, and the member becomes selectable again through the real Infirmary path.

## 8. Rules for this run

- Start only after squad selection is present in branch history.
- Injury and recovery land together; do not push an intermediate injury-only state.
- Tests first; transitions/policy are pure and UI remains presentation.
- Non-interactive; do not install, fetch, deploy, merge, or bypass hooks.
- Preserve raw `calculateStats` semantics and all Lua source.

## 9. Completion criteria

- [ ] Squad-selection dependency is present.
- [ ] Behavior-first tests cover injury, eligibility, recovery progression/completion, persistence, and dead-end prevention. <!-- test: ts/tests/test_mbb_infirmary.ts -->
- [ ] Injury and recovery are enabled in the same commit.
- [ ] Infirmary navigation returns only when the tab provides working recovery choices.
- [ ] Injured mutants cannot enter a squad and recovered mutants can.
- [ ] All verification commands pass with real counts recorded.

## 10. Report

Report dependency commit, files changed, failing-before and passing-after tests, injury/recovery state rules, dead-end handling, tab restoration, persistence proof, full MBB counts, and baseline failures.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Model | swe-2-high |
| Branch | directive/rfdgamestudio-mbb-injury-and-infirmary |
| Base branch | - |
| Base commit | ea365a24 |

**Status log**
- 2026-10-11 · robert-claude-laptop · none → Draft — Drafted from approved M3 roadmap; depends on squad selection and is not queued.
<!-- queue:end -->
