# Wire & Rust roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/wire_rust/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 (S): complete the loop. CUT: nothing. ADD: in-play Restart, a win at the Control Room, a result screen, `build:wire_rust`, seeded RN'
  status: pending
  exit:
  - file: docs/demos/wire_rust/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 (S): complete the loop. CUT: nothing. ADD: in-play Restart, a win at the Control Room, a result screen, `build:wire_rust`, seeded RN'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 (S): complete the loop. CUT: nothing. ADD: in-play Restart, a win at the Control Room, a result screen, `build:wire_rust`, seeded RNG via a seed in game state. Verify: build exits 0; a headless test of N seeded runs reaches both a win and a loss.'
- id: M2
  title: 'Phase 2 (M): the missing pillar. CUT: the endless redraw of the same four cards (no stakes). ADD: scrap spent in salvage rooms to add a card'
  status: pending
  exit:
  - file: docs/demos/wire_rust/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 (M): the missing pillar. CUT: the endless redraw of the same four cards (no stakes). ADD: scrap spent in salvage rooms to add a card'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Phase 2 (M): the missing pillar. CUT: the endless redraw of the same four cards (no stakes). ADD: scrap spent in salvage rooms to add a card; a failed check destroys the played card. Verify: unit test that deck size changes on salvage and on fail; headless runs still terminate.'
```
