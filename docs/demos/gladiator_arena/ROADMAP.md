# Gladiator Arena roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/gladiator_arena/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 TRIM (S): CUT the Balance tab from the player nav (reason: dev tooling; keep the files, the career test uses the harness) behind `?d'
  status: pending
  exit:
  - file: docs/demos/gladiator_arena/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 TRIM (S): CUT the Balance tab from the player nav (reason: dev tooling; keep the files, the career test uses the harness) behind `?d'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 TRIM (S): CUT the Balance tab from the player nav (reason: dev tooling; keep the files, the career test uses the harness) behind `?dev=1`, and the jargon in the blurb. ADD a plain blurb of 60 words or fewer. Verify: Playwright tab list has 4 tabs without the flag, 5 with it; `git grep -n "Balance Lab\|Blood Bowl" ts/src/games/gladiator_arena/config.ts` is empty.'
- id: M2
  title: 'Phase 2 POLISH (M): CUT nothing. ADD a win/loss result card in ArenaCombatView with one next action (B3, B6), a re-measure at 390x844 after '
  status: pending
  exit:
  - file: docs/demos/gladiator_arena/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 POLISH (M): CUT nothing. ADD a win/loss result card in ArenaCombatView with one next action (B3, B6), a re-measure at 390x844 after '
    kind: fix
    size: M
    status: pending
    directive: ''
    detail: 'Phase 2 POLISH (M): CUT nothing. ADD a win/loss result card in ArenaCombatView with one next action (B3, B6), a re-measure at 390x844 after the tab-bar fix (A4), and a cover. Verify: screenshot pair of result cards; scrollWidth <= viewport; cover in manifest.'
```
