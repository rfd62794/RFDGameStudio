# VoidDrift roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/voiddrift/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): classify the cross-origin error as non-failing. CUT: the false A…"
    exits:
      - file: docs/demos/voiddrift/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): classify the cross-origin error as non-failing. CUT: the false A1 FAIL (cannot be fixed from the iframe, GameLoader.tsx:92-97). ADD: an origin filter in the smoke plus one scorecard note. Verify: `cd ts && npm run test` green and the audit row reads PASS."
  - id: M2
    name: "Phase 2 (S): identity. CUT: the three spellings. ADD: one display name, a cov…"
    exits:
      - file: docs/demos/voiddrift/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (S): identity. CUT: the three spellings. ADD: one display name, a cover from `npm run covers` (spec c4), and a card line \"Full game on itch.io\". Verify: the hermetic cover-exists test passes; card shows \"embed\"."
```
