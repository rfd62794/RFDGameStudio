# BPO Sim roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/bpo_sim/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Right source. Goal: examples/ holds Phase 2b. CUT: DashboardView, FloorView, tab toggle (reason: superseded by 2b). ADD: copy extracted/ ove'
  status: pending
  exit:
  - file: docs/demos/bpo_sim/DIRECTION.md
  steps:
  - id: s1
    title: 'Right source. Goal: examples/ holds Phase 2b. CUT: DashboardView, FloorView, tab toggle (reason: superseded by 2b). ADD: copy extracted/ ove'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Right source. Goal: examples/ holds Phase 2b. CUT: DashboardView, FloorView, tab toggle (reason: superseded by 2b). ADD: copy extracted/ over examples/, bump INTAKE_VERSION, `source: {kind:''example'', slug:''filipino-bpo-simulator''}` in config.ts, update SOURCES in ts/tests/test_registry_export.ts. Size S. Verify: `cd ts && npx vitest run tests/test_registry_export.ts`; in the example `npm test` shows 22 passed (controller runs if install is blocked).'
- id: M2
  title: 'Trim to the design. CUT: Recruiting, Wage, HR, Staff, Training, ITSupport, Agent modals (reason: Design.md:65 forbids player-opened agent me'
  status: pending
  exit:
  - file: docs/demos/bpo_sim/DIRECTION.md
  steps:
  - id: s2
    title: 'Trim to the design. CUT: Recruiting, Wage, HR, Staff, Training, ITSupport, Agent modals (reason: Design.md:65 forbids player-opened agent me'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Trim to the design. CUT: Recruiting, Wage, HR, Staff, Training, ITSupport, Agent modals (reason: Design.md:65 forbids player-opened agent menus; keep any background effect on morale/capacity). Keep Script as tentative. ADD: nothing. Size M. Verify: tsc 0 errors, 22 tests still pass, grep of App.tsx imports shows <= 8 modals.'
```
