# Mutant Battle Ball roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/mutant_battle_ball/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'TRIM (S). CUT: the Infirmary tab from navigation (stub, nothing behind it; restore when built); the Gravekeeper/OEM/new-brand wish list from'
  status: pending
  exit:
  - file: docs/demos/mutant_battle_ball/DIRECTION.md
  steps:
  - id: s1
    title: 'TRIM (S). CUT: the Infirmary tab from navigation (stub, nothing behind it; restore when built); the Gravekeeper/OEM/new-brand wish list from'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'TRIM (S). CUT: the Infirmary tab from navigation (stub, nothing behind it; restore when built); the Gravekeeper/OEM/new-brand wish list from near-term scope (reason: depth without a persisted loop). ADD: nothing. Verify: tab list in a screenshot; `npx vitest run tests/test_mbb_*` still green.'
- id: M2
  title: 'Fix numbers (M). ADD: stat normalization so parts sum to the flat-stat range; de-flake the two symmetry tests (seed them). CUT: nothing. Ver'
  status: pending
  exit:
  - file: docs/demos/mutant_battle_ball/DIRECTION.md
  steps:
  - id: s2
    title: 'Fix numbers (M). ADD: stat normalization so parts sum to the flat-stat range; de-flake the two symmetry tests (seed them). CUT: nothing. Ver'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Fix numbers (M). ADD: stat normalization so parts sum to the flat-stat range; de-flake the two symmetry tests (seed them). CUT: nothing. Verify: `cd ts && npx vitest run tests/test_mbb_*` three times green; balanced-speed match scores nonzero.'
```
