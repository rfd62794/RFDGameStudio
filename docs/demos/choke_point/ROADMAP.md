# Choke Point roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/choke_point/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Prove it (S). ADD: headless test over all waves (no softlock, a winning placement exists, loss reachable). CUT: nothing. Verify: `cd ts && n'
  status: pending
  exit:
  - file: docs/demos/choke_point/DIRECTION.md
  steps:
  - id: s1
    title: 'Prove it (S). ADD: headless test over all waves (no softlock, a winning placement exists, loss reachable). CUT: nothing. Verify: `cd ts && n'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Prove it (S). ADD: headless test over all waves (no softlock, a winning placement exists, loss reachable). CUT: nothing. Verify: `cd ts && npx vitest run tests/test_choke_point_*`.'
- id: M2
  title: 'Content (M). ADD in `data.yaml` only: waves 3-6, one new enemy using an existing behavior, per-wave star rating (core HP left). CUT: any wis'
  status: pending
  exit:
  - file: docs/demos/choke_point/DIRECTION.md
  steps:
  - id: s2
    title: 'Content (M). ADD in `data.yaml` only: waves 3-6, one new enemy using an existing behavior, per-wave star rating (core HP left). CUT: any wis'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Content (M). ADD in `data.yaml` only: waves 3-6, one new enemy using an existing behavior, per-wave star rating (core HP left). CUT: any wish for new tower classes, since those need new Lua mechanics (reason: ADR-013, no new Lua surface). Verify: the phase 1 test extended to 6 waves; screenshot of the wave counter.'
```
