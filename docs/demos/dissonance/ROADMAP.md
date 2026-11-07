# Dissonance Depths roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/dissonance/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Bot test (S): ADD headless Lua-session run, N floors, no softlock or negative HP/gold, win and loss reachable. CUT nothing. Verify: `cd ts &'
  status: pending
  exit:
  - file: docs/demos/dissonance/DIRECTION.md
  steps:
  - id: s1
    title: 'Bot test (S): ADD headless Lua-session run, N floors, no softlock or negative HP/gold, win and loss reachable. CUT nothing. Verify: `cd ts &'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Bot test (S): ADD headless Lua-session run, N floors, no softlock or negative HP/gold, win and loss reachable. CUT nothing. Verify: `cd ts && npx vitest run tests/test_dissonance_bot_run.ts` (zero_regression must stay green).'
- id: M2
  title: 'First-fight teaching (M): ADD a one-hint overlay on the first combat ("pick cards; their relation sets the result") using the shared Onboard'
  status: pending
  exit:
  - file: docs/demos/dissonance/DIRECTION.md
  steps:
  - id: s2
    title: 'First-fight teaching (M): ADD a one-hint overlay on the first combat ("pick cards; their relation sets the result") using the shared Onboard'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'First-fight teaching (M): ADD a one-hint overlay on the first combat ("pick cards; their relation sets the result") using the shared OnboardingGate. CUT the "ECHO Core Initialization" caption (jargon; fails the banned-words test). Verify: cold-load Playwright reaches a first played card within 60 s.'
```
