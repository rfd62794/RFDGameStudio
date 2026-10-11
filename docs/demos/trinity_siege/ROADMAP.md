# Trinity Siege roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/trinity_siege/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Vouch for it (S). ADD: unit tests for `selectBestDefender` and battle resolution (matrix symmetry, race lean bounds, a winnable wave 5). CUT'
  status: pending
  exit:
  - file: docs/demos/trinity_siege/DIRECTION.md
  steps:
  - id: s1
    title: 'Vouch for it (S). ADD: unit tests for `selectBestDefender` and battle resolution (matrix symmetry, race lean bounds, a winnable wave 5). CUT'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Vouch for it (S). ADD: unit tests for `selectBestDefender` and battle resolution (matrix symmetry, race lean bounds, a winnable wave 5). CUT: the stale board row text, replace with the real status (board.data.ts, one line, reason: it describes a different, unbuilt game). Verify: `cd ts && npx vitest run tests/test_trinity_siege_*`.'
- id: M2
  title: 'Explain the result (S-M). ADD: after each resolve, one line saying why the counter won ("shape A countered shape B, x multiplier"); a 3-line'
  status: pending
  exit:
  - file: docs/demos/trinity_siege/DIRECTION.md
  steps:
  - id: s2
    title: 'Explain the result (S-M). ADD: after each resolve, one line saying why the counter won ("shape A countered shape B, x multiplier"); a 3-line'
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: 'Explain the result (S-M). ADD: after each resolve, one line saying why the counter won ("shape A countered shape B, x multiplier"); a 3-line first-wave hint. CUT: nothing else. Verify: screenshot of the resolve log; phone 390x844 no overflow.'
```
