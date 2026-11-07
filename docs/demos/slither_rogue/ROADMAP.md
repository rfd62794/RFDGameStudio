# Snake Roguelike roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/slither_rogue/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'TRIM (S). CUT: `GameCanvas.phase2g.tsx` (dead, no importer); the icon-only Restart (replace with a text label). ADD: `build:slither_rogue` a'
  status: pending
  exit:
  - file: docs/demos/slither_rogue/DIRECTION.md
  steps:
  - id: s1
    title: 'TRIM (S). CUT: `GameCanvas.phase2g.tsx` (dead, no importer); the icon-only Restart (replace with a text label). ADD: `build:slither_rogue` a'
    kind: fix
    size: S
    status: pending
    directive: ''
    detail: 'TRIM (S). CUT: `GameCanvas.phase2g.tsx` (dead, no importer); the icon-only Restart (replace with a text label). ADD: `build:slither_rogue` and fix the TS errors it hits. Verify: `cd ts && npm run build:slither_rogue` exit 0; `grep -rn phase2g ts` empty.'
- id: M2
  title: 'Prove (S-M). ADD: headless run test (init, N ticks, evolution trigger fires, game_over on timeout; fixtures already exist under `tests/fixtu'
  status: pending
  exit:
  - file: docs/demos/slither_rogue/DIRECTION.md
  steps:
  - id: s2
    title: 'Prove (S-M). ADD: headless run test (init, N ticks, evolution trigger fires, game_over on timeout; fixtures already exist under `tests/fixtu'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Prove (S-M). ADD: headless run test (init, N ticks, evolution trigger fires, game_over on timeout; fixtures already exist under `tests/fixtures/slither_rogue`). CUT: nothing. Verify: `cd ts && npx vitest run tests/test_slither_rogue_*`.'
```
