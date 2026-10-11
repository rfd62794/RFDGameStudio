# VoidDrift roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/voiddrift/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 (S): classify the cross-origin error as non-failing. CUT: the false A1 FAIL (cannot be fixed from the iframe, GameLoader.tsx:92-97).'
  status: pending
  exit:
  - file: docs/demos/voiddrift/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 (S): classify the cross-origin error as non-failing. CUT: the false A1 FAIL (cannot be fixed from the iframe, GameLoader.tsx:92-97).'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 (S): classify the cross-origin error as non-failing. CUT: the false A1 FAIL (cannot be fixed from the iframe, GameLoader.tsx:92-97). ADD: an origin filter in the smoke plus one scorecard note. Verify: `cd ts && npm run test` green and the audit row reads PASS.'
- id: M2
  title: 'Phase 2 (S): identity. CUT: the three spellings. ADD: one display name, a cover from `npm run covers` (spec c4), and a card line "Full game '
  status: pending
  exit:
  - file: docs/demos/voiddrift/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 (S): identity. CUT: the three spellings. ADD: one display name, a cover from `npm run covers` (spec c4), and a card line "Full game '
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 2 (S): identity. CUT: the three spellings. ADD: one display name, a cover from `npm run covers` (spec c4), and a card line "Full game on itch.io". Verify: the hermetic cover-exists test passes; card shows "embed".'
```
