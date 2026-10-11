# GrainWorks roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/grainworks/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 (S): Tier A. CUT: `window.confirm` reset (blocks in iframes). ADD: TitleScreen with a one-line pitch, an in-game Restart button, `bu'
  status: pending
  exit:
  - file: docs/demos/grainworks/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 (S): Tier A. CUT: `window.confirm` reset (blocks in iframes). ADD: TitleScreen with a one-line pitch, an in-game Restart button, `bu'
    kind: feature
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 (S): Tier A. CUT: `window.confirm` reset (blocks in iframes). ADD: TitleScreen with a one-line pitch, an in-game Restart button, `build:grainworks`. Verify: build exits 0; audit A3/A4.'
- id: M2
  title: 'Phase 2 (M): first 60 seconds. CUT: all but Tier 1 tools until the first goal is met (the rest of the panel is noise on a first visit). ADD:'
  status: pending
  exit:
  - file: docs/demos/grainworks/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 (M): first 60 seconds. CUT: all but Tier 1 tools until the first goal is met (the rest of the panel is noise on a first visit). ADD:'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Phase 2 (M): first 60 seconds. CUT: all but Tier 1 tools until the first goal is met (the rest of the panel is noise on a first visit). ADD: a "drop material, catch it" first-goal card, a 390 px touch pan/zoom check, autosave of grid plus buildings. Verify: Playwright phone screenshot; save round-trip test.'
```
