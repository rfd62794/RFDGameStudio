# Wire & Rust roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/wire_rust/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): complete the loop. CUT: nothing. ADD: in-play Restart, a win at …"
    exits:
      - file: docs/demos/wire_rust/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): complete the loop. CUT: nothing. ADD: in-play Restart, a win at the Control Room, a result screen, `build:wire_rust`, seeded RNG via a seed in game state. Verify: build exits 0; a headless test of N seeded runs reaches both a win and a loss."
  - id: M2
    name: "Phase 2 (M): the missing pillar. CUT: the endless redraw of the same four car…"
    exits:
      - file: docs/demos/wire_rust/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (M): the missing pillar. CUT: the endless redraw of the same four cards (no stakes). ADD: scrap spent in salvage rooms to add a card; a failed check destroys the played card. Verify: unit test that deck size changes on salvage and on fail; headless runs still terminate."
```
