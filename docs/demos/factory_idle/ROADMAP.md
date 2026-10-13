# Factory Idle: Precision Workshop roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/factory_idle/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Publish phase 2 as honest embed. Goal: page stops 404ing. CUT: nothing. ADD: `source` in config.ts, honest blurb (existing directive). Size '
  status: pending
  exit:
  - file: docs/demos/factory_idle/DIRECTION.md
  steps:
  - id: s1
    title: 'Publish phase 2 as honest embed. Goal: page stops 404ing. CUT: nothing. ADD: `source` in config.ts, honest blurb (existing directive). Size '
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Publish phase 2 as honest embed. Goal: page stops 404ing. CUT: nothing. ADD: `source` in config.ts, honest blurb (existing directive). Size S. Verify: `cd ts && npx vitest run tests/test_registry_export.ts`, then controller builds and loads /arcade/factory_idle/.'
- id: M2
  title: 'Keep your factory. CUT: nothing. ADD: autosave/restore of reducer state to localStorage, labelled "Reset factory" with two-step confirm (A3,'
  status: pending
  exit:
  - file: docs/demos/factory_idle/DIRECTION.md
  steps:
  - id: s2
    title: 'Keep your factory. CUT: nothing. ADD: autosave/restore of reducer state to localStorage, labelled "Reset factory" with two-step confirm (A3,'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Keep your factory. CUT: nothing. ADD: autosave/restore of reducer state to localStorage, labelled "Reset factory" with two-step confirm (A3, B2). Size S. Verify: pure-helper vitest (pattern `ts/tests/test_ledger_utils.ts`) round-trips state.'
```
