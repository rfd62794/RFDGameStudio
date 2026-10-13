# VoidDrift: Core Loop roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/voiddrift_redux/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 (S): Tier A. CUT: the icon-only reset (unclear to players). ADD: a text "Restart" returning to the title screen, and `build:voiddrif'
  status: pending
  exit:
  - file: docs/demos/voiddrift_redux/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 (S): Tier A. CUT: the icon-only reset (unclear to players). ADD: a text "Restart" returning to the title screen, and `build:voiddrif'
    kind: feature
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 (S): Tier A. CUT: the icon-only reset (unclear to players). ADD: a text "Restart" returning to the title screen, and `build:voiddrift_redux`. Verify: the audit A3 row passes; `cd ts && npm run build:voiddrift_redux` exits 0.'
- id: M2
  title: 'Phase 2 (M): keep your base. CUT: FSMInspector and the diagnostics modal from the default view (dev tooling; move behind a "Details" toggle)'
  status: pending
  exit:
  - file: docs/demos/voiddrift_redux/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 (M): keep your base. CUT: FSMInspector and the diagnostics modal from the default view (dev tooling; move behind a "Details" toggle)'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Phase 2 (M): keep your base. CUT: FSMInspector and the diagnostics modal from the default view (dev tooling; move behind a "Details" toggle). ADD: versioned localStorage save/restore with 5 s autosave (the one thing the web slice has, `VD:web/src/save.ts:9,33`) and an optional seeded RNG. Verify: a new engine test round-trips a save; a reload keeps drones.'
```
