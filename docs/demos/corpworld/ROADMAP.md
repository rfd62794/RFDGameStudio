# CorpWorld roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/corpworld/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Keep the URL, drop the card. Goal: /arcade/corpworld/ and /games/corpworld/ still load; the arcade grid shows one colony-4x card. CUT: the s'
  status: pending
  exit:
  - file: docs/demos/corpworld/DIRECTION.md
  steps:
  - id: s1
    title: 'Keep the URL, drop the card. Goal: /arcade/corpworld/ and /games/corpworld/ still load; the arcade grid shows one colony-4x card. CUT: the s'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Keep the URL, drop the card. Goal: /arcade/corpworld/ and /games/corpworld/ still load; the arcade grid shows one colony-4x card. CUT: the standalone grid card (reason: duplicate of Planet of Greed). ADD: an "Origins" line on Planet of Greed''s title screen linking to it, and an `origin`/hidden flag honoured by the redesign''s home. Size S. Verify: `cd ts && npx vitest run tests/test_arcade_registry_directive.ts` still green; curl of both URLs unchanged after deploy.'
- id: M2
  title: 'Fix provenance. CUT: stale README paragraphs. ADD: one line "source: examples/corpworld, tracked 0c416b4f; deployed build = R5 (verified by '
  status: pending
  exit:
  - file: docs/demos/corpworld/DIRECTION.md
  steps:
  - id: s2
    title: 'Fix provenance. CUT: stale README paragraphs. ADD: one line "source: examples/corpworld, tracked 0c416b4f; deployed build = R5 (verified by '
    kind: fix
    size: S
    status: pending
    directive: ''
    detail: 'Fix provenance. CUT: stale README paragraphs. ADD: one line "source: examples/corpworld, tracked 0c416b4f; deployed build = R5 (verified by build hash compare)". Size S. Verify: grep README for "gitignored" is empty.'
```
