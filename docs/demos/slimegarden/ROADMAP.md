# Slimegarden roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/slimegarden/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 (S): CUT `examples/slimeworld/` (verified duplicate; the deploy no longer reads it) and keep `intake/` as the only raw archive. ADD '
  status: pending
  exit:
  - file: docs/demos/slimegarden/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 (S): CUT `examples/slimeworld/` (verified duplicate; the deploy no longer reads it) and keep `intake/` as the only raw archive. ADD '
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 (S): CUT `examples/slimeworld/` (verified duplicate; the deploy no longer reads it) and keep `intake/` as the only raw archive. ADD nothing. Verify: `diff -rq examples/slimegarden/src examples/slimeworld/src` is empty before deletion (it is today); `python -m pytest tests/test_deploy_arcade_copy_order.py` and `cd ts && npx vitest run test_registry_export.ts` stay green.'
- id: M2
  title: 'Phase 2 (S): Tier A. CUT the GEMINI README text. ADD a 390 px fix (test the decorative `w-[500px]` blob at App.tsx:652 first), a "Play the s'
  status: pending
  exit:
  - file: docs/demos/slimegarden/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 (S): Tier A. CUT the GEMINI README text. ADD a 390 px fix (test the decorative `w-[500px]` blob at App.tsx:652 first), a "Play the s'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 2 (S): Tier A. CUT the GEMINI README text. ADD a 390 px fix (test the decorative `w-[500px]` blob at App.tsx:652 first), a "Play the successor: SlimeWorld" link in the header, a cover. Verify: Playwright 390x844 scrollWidth <= viewport; screenshot yes/no.'
```
