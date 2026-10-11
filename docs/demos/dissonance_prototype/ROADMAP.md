# Dissonance Loop Prototype roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/dissonance_prototype/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Publish exhibit (S): build examples/dissonance-prototype and publish at /arcade/dissonance_prototype/. CUT the repo path and "(Gemini API)" '
  status: pending
  exit:
  - file: docs/demos/dissonance_prototype/DIRECTION.md
  steps:
  - id: s1
    title: 'Publish exhibit (S): build examples/dissonance-prototype and publish at /arcade/dissonance_prototype/. CUT the repo path and "(Gemini API)" '
    kind: feature
    size: S
    status: pending
    directive: ''
    detail: 'Publish exhibit (S): build examples/dissonance-prototype and publish at /arcade/dissonance_prototype/. CUT the repo path and "(Gemini API)" from the description (A5: players need neither). Verify: `curl -I` returns 200 and a Playwright load shows zero console errors.'
- id: M2
  title: 'Fold the entry (S): ADD a "Where Dissonance began" link on Dissonance''s title or credits to the embed; keep the registry entry (external, su'
  status: pending
  exit:
  - file: docs/demos/dissonance_prototype/DIRECTION.md
  steps:
  - id: s2
    title: 'Fold the entry (S): ADD a "Where Dissonance began" link on Dissonance''s title or credits to the embed; keep the registry entry (external, su'
    kind: feature
    size: S
    status: pending
    directive: ''
    detail: 'Fold the entry (S): ADD a "Where Dissonance began" link on Dissonance''s title or credits to the embed; keep the registry entry (external, supersededBy) but exclude it from "Start here" and the card grid. CUT the stale tmp/dissonance-src comments (config.ts:5, ADR-023:18; they point to a path that no longer exists). Verify: grep for "tmp/dissonance-src" is empty; no card in the home grid.'
```
