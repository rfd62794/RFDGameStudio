# Facility Escape roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/facility_escape/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'TRIM dev-speak (S). CUT: "MECHANICS PROTOTYPE", "PROTOTYPE" in button and win text (it tells players they are testing, not playing). ADD: pl'
  status: pending
  exit:
  - file: docs/demos/facility_escape/DIRECTION.md
  steps:
  - id: s1
    title: 'TRIM dev-speak (S). CUT: "MECHANICS PROTOTYPE", "PROTOTYPE" in button and win text (it tells players they are testing, not playing). ADD: pl'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'TRIM dev-speak (S). CUT: "MECHANICS PROTOTYPE", "PROTOTYPE" in button and win text (it tells players they are testing, not playing). ADD: plain labels (STEALTH, RETRY ROOM, ROOM CLEARED). Verify: `grep -ci prototype examples/facility-escape/src/App.tsx` = 0; screenshot of win card.'
- id: M2
  title: 'First minute (S-M). ADD: one-time 3-line hint on turn one ("guards show their next move; stay out of the cone"), a "Room 3 of 8" indicator, '
  status: pending
  exit:
  - file: docs/demos/facility_escape/DIRECTION.md
  steps:
  - id: s2
    title: 'First minute (S-M). ADD: one-time 3-line hint on turn one ("guards show their next move; stay out of the cone"), a "Room 3 of 8" indicator, '
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: 'First minute (S-M). ADD: one-time 3-line hint on turn one ("guards show their next move; stay out of the cone"), a "Room 3 of 8" indicator, a final 8/8 result card with turn count. CUT: nothing more; do not touch solver or generator. Verify: Playwright cold load reaches first move in 60 s; room counter visible in screenshot.'
```
