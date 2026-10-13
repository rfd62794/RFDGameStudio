# Systemic Extract roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/systemic_extract/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Close Tier A (S). ADD: favicon (clears the console warning), card label "embed", cover screenshot, a one-line honest blurb note that salvage'
  status: pending
  exit:
  - file: docs/demos/systemic_extract/DIRECTION.md
  steps:
  - id: s1
    title: 'Close Tier A (S). ADD: favicon (clears the console warning), card label "embed", cover screenshot, a one-line honest blurb note that salvage'
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: 'Close Tier A (S). ADD: favicon (clears the console warning), card label "embed", cover screenshot, a one-line honest blurb note that salvage is not yet spendable. CUT: nothing. Verify: A1 zero console errors; manifest references the screenshot.'
- id: M2
  title: Decision gate (no build). If Robert picks "hideout as a modal from sanctuary buildings", the hideout loop is M; if he picks "no hideout", CU
  status: pending
  exit:
  - file: docs/demos/systemic_extract/DIRECTION.md
  steps:
  - id: s2
    title: Decision gate (no build). If Robert picks "hideout as a modal from sanctuary buildings", the hideout loop is M; if he picks "no hideout", CU
    kind: feature
    size: M
    status: pending
    directive: ''
    detail: 'Decision gate (no build). If Robert picks "hideout as a modal from sanctuary buildings", the hideout loop is M; if he picks "no hideout", CUT `HideoutView`, `useHideoutState` and the four stations (S, reason: dead code behind a stale design). Verify: `grep -rn HideoutView examples/systemic-extract/src` empty after the cut.'
```
