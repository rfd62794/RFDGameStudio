# Derby Sim roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/horse_racing/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 (S): honesty and reset. CUT the `stable` badge to `beta` (public label, no Tier B evidence; Robert''s call) and the New Game that doe'
  status: pending
  exit:
  - file: docs/demos/horse_racing/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 (S): honesty and reset. CUT the `stable` badge to `beta` (public label, no Tier B evidence; Robert''s call) and the New Game that doe'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 (S): honesty and reset. CUT the `stable` badge to `beta` (public label, no Tier B evidence; Robert''s call) and the New Game that does nothing. ADD Continue vs New Game (confirmed wipe of the `derby_sim_state_v1` save) and `build:horse_racing`. Verify: `cd ts && npm run build:horse_racing` exits 0; vitest for New Game clearing the save.'
- id: M2
  title: 'Phase 2 (S): proof. CUT source-text assertions that duplicate behaviour tests. ADD a headless balance test: 200 races with a flat-bet strate'
  status: pending
  exit:
  - file: docs/demos/horse_racing/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 (S): proof. CUT source-text assertions that duplicate behaviour tests. ADD a headless balance test: 200 races with a flat-bet strate'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 2 (S): proof. CUT source-text assertions that duplicate behaviour tests. ADD a headless balance test: 200 races with a flat-bet strategy, assert no negative funds, bankruptcy reachable, odds sum sane (overround 1.12). Verify: the named numbers in the vitest output.'
```
