# GrainWorks roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/grainworks/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): Tier A. CUT: `window.confirm` reset (blocks in iframes). ADD: Ti…"
    exits:
      - file: docs/demos/grainworks/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): Tier A. CUT: `window.confirm` reset (blocks in iframes). ADD: TitleScreen with a one-line pitch, an in-game Restart button, `build:grainworks`. Verify: build exits 0; audit A3/A4."
  - id: M2
    name: "Phase 2 (M): first 60 seconds. CUT: all but Tier 1 tools until the first goal…"
    exits:
      - file: docs/demos/grainworks/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (M): first 60 seconds. CUT: all but Tier 1 tools until the first goal is met (the rest of the panel is noise on a first visit). ADD: a \"drop material, catch it\" first-goal card, a 390 px touch pan/zoom check, autosave of grid plus buildings. Verify: Playwright phone screenshot; save round-trip test."
```
