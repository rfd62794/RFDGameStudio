# Mutant Battle Ball roadmap

The next arc grows the roster before adding squad choice, then introduces injury and recovery together. Balance changes remain evidence-gated.

```yaml roadmap
status: approved
approved: 2026-10-11 robert
milestones:
- id: M0
  title: Current playable loop remains protected
  status: done
  exit:
  - test: cd ts && npx vitest run tests/test_mbb_*
  steps:
  - id: M0.1
    title: Persistence, built-tab navigation, and seeded symmetry are verified
    kind: tests
    size: S
    value: 5
    status: done
    directive: ''
    detail: The Infirmary stub is hidden, game progress persists, and seeded MBB tests are stable. Verified 2026-10-11 at 13 files and 210 tests.
    accept:
    - test: cd ts && npx vitest run tests/test_mbb_*
- id: M1
  title: Matches can grow the roster through salvage recruitment
  status: pending
  exit:
  - test: cd ts && npx vitest run tests/test_mbb_recruitment.ts tests/test_mbb_persistence.ts
  steps:
  - id: M1.1
    title: Award and accept a post-match salvage recruit
    kind: feature
    size: M
    value: 5
    status: pending
    directive: Mbb_Post_Match_Salvage_Recruit_Directive.md
    detail: Add a bounded post-match salvage result that can create or award one recruit with valid starter parts. Recruitment owns its own pure state transition; App.tsx only wires the result. A recruited roster survives the existing versioned save path.
    accept:
    - test: cd ts && npx vitest run tests/test_mbb_recruitment.ts tests/test_mbb_persistence.ts
- id: M2
  title: The player chooses which two healthy mutants play
  status: pending
  exit:
  - test: cd ts && npx vitest run tests/test_mbb_squad_selection.ts
  steps:
  - id: M2.1
    title: Select exactly two valid healthy roster members
    kind: feature
    size: M
    value: 5
    needs:
    - M1.1
    status: pending
    directive: Mbb_Squad_Selection_Directive.md
    detail: Add squad selection after the roster can exceed two. Keep selection invariants in pure functions and the Roster tab focused on presentation. Match initialization consumes the selected ids.
    accept:
    - test: cd ts && npx vitest run tests/test_mbb_squad_selection.ts
- id: M3
  title: Injury and recovery create consequences without dead ends
  status: pending
  exit:
  - test: cd ts && npx vitest run tests/test_mbb_infirmary.ts tests/test_mbb_squad_selection.ts
  steps:
  - id: M3.1
    title: Land injury transitions and the real Infirmary together
    kind: feature
    size: M
    value: 4
    needs:
    - M2.1
    status: pending
    directive: Mbb_Injury_And_Infirmary_Directive.md
    detail: Map match consequences to typed mutant status, exclude unavailable mutants from squad selection, decrement recovery by completed matches, and restore the Infirmary tab only when it provides recovery choices. No release may create injury without a recovery path.
    accept:
    - test: cd ts && npx vitest run tests/test_mbb_infirmary.ts tests/test_mbb_squad_selection.ts
- id: M4
  title: Balance policy follows measured seeded evidence
  status: pending
  exit:
  - test: cd ts && npx vitest run tests/test_mbb_balance_measurement.ts
  steps:
  - id: M4.1
    title: Measure equivalent-rated player and opponent outcomes before changing scales
    kind: tests
    size: S
    value: 5
    status: pending
    directive: Mbb_Balance_Measurement_Directive.md
    detail: Add aggregate seeded matches and report speed, health, scoring margin, and win distribution. Preserve calculateStats summing semantics. The follow-up chooses player normalization or opponent scaling from measured evidence.
    accept:
    - test: cd ts && npx vitest run tests/test_mbb_balance_measurement.ts
```
