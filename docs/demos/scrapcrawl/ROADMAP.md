# ScrapCrawl roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/scrapcrawl/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Prove and tune (S-M). ADD: simulated-run test over `data.yaml` with fixed rolls: a winning path exists, losing is reachable, win odds per ro'
  status: pending
  exit:
  - file: docs/demos/scrapcrawl/DIRECTION.md
  steps:
  - id: s1
    title: 'Prove and tune (S-M). ADD: simulated-run test over `data.yaml` with fixed rolls: a winning path exists, losing is reachable, win odds per ro'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Prove and tune (S-M). ADD: simulated-run test over `data.yaml` with fixed rolls: a winning path exists, losing is reachable, win odds per room are sensible at 10 HP; set real numbers replacing the placeholders. CUT: nothing. Verify: `cd ts && npx vitest run tests/test_scrapcrawl_*`.'
- id: M2
  title: 'Replay hook (M). ADD: show proficiency as the visible carry-over ("Sword 3/5"), keep it across runs via the shared persistence, add best-run'
  status: pending
  exit:
  - file: docs/demos/scrapcrawl/DIRECTION.md
  steps:
  - id: s2
    title: 'Replay hook (M). ADD: show proficiency as the visible carry-over ("Sword 3/5"), keep it across runs via the shared persistence, add best-run'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Replay hook (M). ADD: show proficiency as the visible carry-over ("Sword 3/5"), keep it across runs via the shared persistence, add best-run (fewest rooms or HP left). CUT: `examples/scrapcrawl` stays untouched and unwired (reason: it is the preserved origin, and its Gemini layer needs a server). Verify: restart keeps proficiency; test with a mocked store.'
```
