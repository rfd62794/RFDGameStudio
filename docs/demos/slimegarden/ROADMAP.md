# Slimegarden roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/slimegarden/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): CUT `examples/slimeworld/` (verified duplicate; the deploy no lo…"
    exits:
      - file: docs/demos/slimegarden/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): CUT `examples/slimeworld/` (verified duplicate; the deploy no longer reads it) and keep `intake/` as the only raw archive. ADD nothing. Verify: `diff -rq examples/slimegarden/src examples/slimeworld/src` is empty before deletion (it is today); `python -m pytest tests/test_deploy_arcade_copy_order.py` and `cd ts && npx vitest run test_registry_export.ts` stay green."
  - id: M2
    name: "Phase 2 (S): Tier A. CUT the GEMINI README text. ADD a 390 px fix (test the d…"
    exits:
      - file: docs/demos/slimegarden/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (S): Tier A. CUT the GEMINI README text. ADD a 390 px fix (test the decorative `w-[500px]` blob at App.tsx:652 first), a \"Play the successor: SlimeWorld\" link in the header, a cover. Verify: Playwright 390x844 scrollWidth <= viewport; screenshot yes/no."
```
