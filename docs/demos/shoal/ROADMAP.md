# Shoal roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/shoal/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Honest state (S): CUT nothing; ADD "session-only" line on title, or persist scenario+seed+tick with a Reset control via engine/shared/persis'
  status: pending
  exit:
  - file: docs/demos/shoal/DIRECTION.md
  steps:
  - id: s1
    title: 'Honest state (S): CUT nothing; ADD "session-only" line on title, or persist scenario+seed+tick with a Reset control via engine/shared/persis'
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: 'Honest state (S): CUT nothing; ADD "session-only" line on title, or persist scenario+seed+tick with a Reset control via engine/shared/persistence. Recommend the label first (cheaper). Verify: Playwright act-reload step, or the text present.'
- id: M2
  title: 'Behaviour tests (S): CUT the source-text assertions in test_shoal_chrome_polish.ts (they pass while behaviour breaks); ADD headless 2,000-ti'
  status: pending
  exit:
  - file: docs/demos/shoal/DIRECTION.md
  steps:
  - id: s2
    title: 'Behaviour tests (S): CUT the source-text assertions in test_shoal_chrome_polish.ts (they pass while behaviour breaks); ADD headless 2,000-ti'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Behaviour tests (S): CUT the source-text assertions in test_shoal_chrome_polish.ts (they pass while behaviour breaks); ADD headless 2,000-tick run per scenario, no NaN/negative counts, extinction and survival both reachable. Verify: `cd ts && npx vitest run tests/test_shoal_headless.ts`.'
```
