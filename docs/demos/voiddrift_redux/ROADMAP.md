# VoidDrift: Core Loop roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/voiddrift_redux/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): Tier A. CUT: the icon-only reset (unclear to players). ADD: a te…"
    exits:
      - file: docs/demos/voiddrift_redux/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): Tier A. CUT: the icon-only reset (unclear to players). ADD: a text \"Restart\" returning to the title screen, and `build:voiddrift_redux`. Verify: the audit A3 row passes; `cd ts && npm run build:voiddrift_redux` exits 0."
  - id: M2
    name: "Phase 2 (M): keep your base. CUT: FSMInspector and the diagnostics modal from…"
    exits:
      - file: docs/demos/voiddrift_redux/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (M): keep your base. CUT: FSMInspector and the diagnostics modal from the default view (dev tooling; move behind a \"Details\" toggle). ADD: versioned localStorage save/restore with 5 s autosave (the one thing the web slice has, `VD:web/src/save.ts:9,33`) and an optional seeded RNG. Verify: a new engine test round-trips a save; a reload keeps drones."
```
