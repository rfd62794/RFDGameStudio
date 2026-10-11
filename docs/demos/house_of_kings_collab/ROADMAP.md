# House of Kings: Collab roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/house_of_kings_collab/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Park cleanly. CUT: the 12 MB generated bundle from git (reason: artifact; rebuild in the Dockerfile via a script) and the dev footer. ADD: `'
  status: pending
  exit:
  - file: docs/demos/house_of_kings_collab/DIRECTION.md
  steps:
  - id: s1
    title: 'Park cleanly. CUT: the 12 MB generated bundle from git (reason: artifact; rebuild in the Dockerfile via a script) and the dev footer. ADD: `'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Park cleanly. CUT: the 12 MB generated bundle from git (reason: artifact; rebuild in the Dockerfile via a script) and the dev footer. ADD: `.gitattributes` generated marker if the bundle stays. Size S. Verify: `git ls-files ts/src/games/house_of_kings_collab | grep bundle` empty, or the marker present; `cd ts && npx vitest run tests/test_house_of_kings_*` green.'
- id: M2
  title: 'Make the landing page the exhibit. ADD: a static "How it works" section on LandingPage rendering the visit-triggered evaluation diagram from'
  status: pending
  exit:
  - file: docs/demos/house_of_kings_collab/DIRECTION.md
  steps:
  - id: s2
    title: 'Make the landing page the exhibit. ADD: a static "How it works" section on LandingPage rendering the visit-triggered evaluation diagram from'
    kind: tests
    size: L
    status: pending
    directive: ''
    detail: 'Make the landing page the exhibit. ADD: a static "How it works" section on LandingPage rendering the visit-triggered evaluation diagram from ARCHITECTURE.md plus a link to the write-up; no backend needed. Size S. Verify: screenshot signed-out at 1280 and 390; blurb test passes.'
```
