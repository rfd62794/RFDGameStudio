# AntSim Redux roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/antsim_redux/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'TRIM (S). CUT: the Test Anchors tab from the player UI (it is not run; the real checks live in `tests/simulation.test.ts`), the "Phase 2c" b'
  status: pending
  exit:
  - file: docs/demos/antsim_redux/DIRECTION.md
  steps:
  - id: s1
    title: 'TRIM (S). CUT: the Test Anchors tab from the player UI (it is not run; the real checks live in `tests/simulation.test.ts`), the "Phase 2c" b'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'TRIM (S). CUT: the Test Anchors tab from the player UI (it is not run; the real checks live in `tests/simulation.test.ts`), the "Phase 2c" badge and phase subtitle. ADD: one player line ("Drop food and watch the colony find it") and a state-doc pointer in the README. Verify: `grep -ci "phase\|anchor" examples/antsim-redux/src/App.tsx` shows no player-visible hits; 390x844 screenshot with no horizontal scroll.'
- id: M2
  title: 'Close Tier A (S). ADD: A5 screenshot referenced in the manifest, card label "embed" (A8). Verify: the polish standard''s A1-A5, A8 smoke step'
  status: pending
  exit:
  - file: docs/demos/antsim_redux/DIRECTION.md
  steps:
  - id: s2
    title: 'Close Tier A (S). ADD: A5 screenshot referenced in the manifest, card label "embed" (A8). Verify: the polish standard''s A1-A5, A8 smoke step'
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: 'Close Tier A (S). ADD: A5 screenshot referenced in the manifest, card label "embed" (A8). Verify: the polish standard''s A1-A5, A8 smoke steps.'
```
