# PlanetForge roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/planetforge/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Trim. CUT: dead `gameLogic.ts` (both copies) and its test (reason: unused, Phase 2 left the decision to Robert); hide Test Runner behind `?d'
  status: pending
  exit:
  - file: docs/demos/planetforge/DIRECTION.md
  steps:
  - id: s1
    title: 'Trim. CUT: dead `gameLogic.ts` (both copies) and its test (reason: unused, Phase 2 left the decision to Robert); hide Test Runner behind `?d'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Trim. CUT: dead `gameLogic.ts` (both copies) and its test (reason: unused, Phase 2 left the decision to Robert); hide Test Runner behind `?debug=1`; close the Phase2b queue row as Superseded (controller). ADD: label on Reset. Size S. Verify: `cd ts && npx vitest run` and example `npx tsc --noEmit` pass.'
- id: M2
  title: 'A goal. CUT: nothing. ADD: win = Monument in all 8 sectors with none unstable, lose = N perturbation ticks with all tiles at tier 0, a resta'
  status: pending
  exit:
  - file: docs/demos/planetforge/DIRECTION.md
  steps:
  - id: s2
    title: 'A goal. CUT: nothing. ADD: win = Monument in all 8 sectors with none unstable, lose = N perturbation ticks with all tiles at tier 0, a resta'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'A goal. CUT: nothing. ADD: win = Monument in all 8 sectors with none unstable, lose = N perturbation ticks with all tiles at tier 0, a restart screen, autosave (B2, B6). Size M. Verify: pure-function vitest on `evaluate_goal(world)`.'
```
