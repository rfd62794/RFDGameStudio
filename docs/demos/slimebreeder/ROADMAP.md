# SlimeBreeder roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/slimebreeder/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Phase 1 (S): finish Tier A. CUT the repo path from the blurb (leaks dev detail). ADD Reset/New Game with a 2-click confirm and an "Origin of'
  status: pending
  exit:
  - file: docs/demos/slimebreeder/DIRECTION.md
  steps:
  - id: s1
    title: 'Phase 1 (S): finish Tier A. CUT the repo path from the blurb (leaks dev detail). ADD Reset/New Game with a 2-click confirm and an "Origin of'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Phase 1 (S): finish Tier A. CUT the repo path from the blurb (leaks dev detail). ADD Reset/New Game with a 2-click confirm and an "Origin of SlimeWorld, play it here" link in the header. Verify: `cd ts && npx vitest run` blurb test, plus a Playwright click on Reset returns to the first screen.'
- id: M2
  title: 'Phase 2 (S): freeze. CUT the sibling ROADMAP.md M1-M3 by marking the repo''s DIRECTION/ROADMAP "frozen exhibit; see RFDGameStudio docs/demos/'
  status: pending
  exit:
  - file: docs/demos/slimebreeder/DIRECTION.md
  steps:
  - id: s2
    title: 'Phase 2 (S): freeze. CUT the sibling ROADMAP.md M1-M3 by marking the repo''s DIRECTION/ROADMAP "frozen exhibit; see RFDGameStudio docs/demos/'
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: 'Phase 2 (S): freeze. CUT the sibling ROADMAP.md M1-M3 by marking the repo''s DIRECTION/ROADMAP "frozen exhibit; see RFDGameStudio docs/demos/slimebreeder/DIRECTION.md" (stops Devin picking it up again, `8c008e9` already superseded one auto-directive). ADD a real README (3 lines). Verify: `git grep -n "frozen exhibit"` in SlimeBreeder.'
```
