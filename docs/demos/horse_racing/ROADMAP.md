# Derby Sim roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/horse_racing/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): honesty and reset. CUT the `stable` badge to `beta` (public labe…"
    exits:
      - file: docs/demos/horse_racing/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): honesty and reset. CUT the `stable` badge to `beta` (public label, no Tier B evidence; Robert's call) and the New Game that does nothing. ADD Continue vs New Game (confirmed wipe of the `derby_sim_state_v1` save) and `build:horse_racing`. Verify: `cd ts && npm run build:horse_racing` exits 0; vitest for New Game clearing the save."
  - id: M2
    name: "Phase 2 (S): proof. CUT source-text assertions that duplicate behaviour tests…"
    exits:
      - file: docs/demos/horse_racing/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (S): proof. CUT source-text assertions that duplicate behaviour tests. ADD a headless balance test: 200 races with a flat-bet strategy, assert no negative funds, bankruptcy reachable, odds sum sane (overround 1.12). Verify: the named numbers in the vitest output."
```
