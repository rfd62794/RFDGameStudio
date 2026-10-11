# Chimera Wilds roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/chimera_wilds/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): make it winnable. CUT the Lua-picks-first/TS-picks-random split …"
    exits:
      - file: docs/demos/chimera_wilds/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): make it winnable. CUT the Lua-picks-first/TS-picks-random split (make Lua accept the already-chosen parts, one contract; reason: two owners of selection invite a wrong test). ADD a balance change so win rate lands near 50% (arithmetic: baseline 170 gives about 41%, 180 about 58%; tune by test), a persisted record, and a visible Reset. Verify: new vitest runs 1,000 encounters and asserts win rate 35-65%; `uv run pytest tests/test_chimera_wilds.py`."
  - id: M2
    name: "Phase 2 (M): one decision. CUT random player stats (fixed baseline). ADD \"bui…"
    exits:
      - file: docs/demos/chimera_wilds/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (M): one decision. CUT random player stats (fixed baseline). ADD \"build your fighter\": pick one part per slot from a small starter set under a price budget (uses the existing price field), then fight; wins pay credits to unlock more parts. Verify: headless test that every budget-legal build is playable and the best build beats the median chimera."
```
