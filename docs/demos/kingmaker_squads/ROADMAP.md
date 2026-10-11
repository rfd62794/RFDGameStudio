# Kingmaker Squads roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/kingmaker_squads/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Land restart. Goal: A3 passes in frame. CUT: nothing. ADD: merge the Review directive. Size S. Verify: its own vitest plus a screenshot of t'
  status: pending
  exit:
  - file: docs/demos/kingmaker_squads/DIRECTION.md
  steps:
  - id: s1
    title: 'Land restart. Goal: A3 passes in frame. CUT: nothing. ADD: merge the Review directive. Size S. Verify: its own vitest plus a screenshot of t'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Land restart. Goal: A3 passes in frame. CUT: nothing. ADD: merge the Review directive. Size S. Verify: its own vitest plus a screenshot of the start screen.'
- id: M2
  title: 'Honest docs. CUT: stale README paragraphs. ADD: current source location and base path. Size S. Verify: `grep gitignored ts/src/games/kingmak'
  status: pending
  exit:
  - file: docs/demos/kingmaker_squads/DIRECTION.md
  steps:
  - id: s2
    title: 'Honest docs. CUT: stale README paragraphs. ADD: current source location and base path. Size S. Verify: `grep gitignored ts/src/games/kingmak'
    kind: docs
    size: M
    status: pending
    directive: ''
    detail: 'Honest docs. CUT: stale README paragraphs. ADD: current source location and base path. Size S. Verify: `grep gitignored ts/src/games/kingmaker_squads/README.md` is empty.'
```
