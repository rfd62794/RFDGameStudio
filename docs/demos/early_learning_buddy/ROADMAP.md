# Early Learning Buddy roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/early_learning_buddy/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Record it (S). ADD: a "tier N/A, parked" line in its SCOPE row and fix the board row to say parked (reason: board `active` contradicts `conf'
  status: pending
  exit:
  - file: docs/demos/early_learning_buddy/DIRECTION.md
  steps:
  - id: s1
    title: 'Record it (S). ADD: a "tier N/A, parked" line in its SCOPE row and fix the board row to say parked (reason: board `active` contradicts `conf'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Record it (S). ADD: a "tier N/A, parked" line in its SCOPE row and fix the board row to say parked (reason: board `active` contradicts `config.ts`). CUT: nothing. Verify: `grep -n early_learning ts/src/status/board.data.ts` shows `parked`; registry test still passes.'
- id: M2
  title: 'Only if Robert wants it published (L, not scheduled): move it to its own repo with its own server decision and a privacy review first; do no'
  status: pending
  exit:
  - file: docs/demos/early_learning_buddy/DIRECTION.md
  steps:
  - id: s2
    title: 'Only if Robert wants it published (L, not scheduled): move it to its own repo with its own server decision and a privacy review first; do no'
    kind: feature
    size: M
    status: pending
    directive: ''
    detail: 'Only if Robert wants it published (L, not scheduled): move it to its own repo with its own server decision and a privacy review first; do not add it to the arcade. CUT from the arcade repo after the move (reason: one home per product). Verify: out of scope until asked.'
```
