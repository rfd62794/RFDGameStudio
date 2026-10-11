# SlimeBreeder roadmap

```yaml roadmap
status: draft
milestones:
  - id: M0
    name: Keep-alive gate
    exits:
      - file: docs/demos/slimebreeder/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: Confirm the current shippable state against the direction note.
  - id: M1
    name: "Phase 1 (S): finish Tier A. CUT the repo path from the blurb (leaks dev detai…"
    exits:
      - file: docs/demos/slimebreeder/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 1 (S): finish Tier A. CUT the repo path from the blurb (leaks dev detail). ADD Reset/New Game with a 2-click confirm and an \"Origin of SlimeWorld, play it here\" link in the header. Verify: `cd ts && npx vitest run` blurb test, plus a Playwright click on Reset returns to the first screen."
  - id: M2
    name: "Phase 2 (S): freeze. CUT the sibling ROADMAP.md M1-M3 by marking the repo's D…"
    exits:
      - file: docs/demos/slimebreeder/DIRECTION.md
    steps:
      - kind: docs
        size: S
        text: "Phase 2 (S): freeze. CUT the sibling ROADMAP.md M1-M3 by marking the repo's DIRECTION/ROADMAP \"frozen exhibit; see RFDGameStudio docs/demos/slimebreeder/DIRECTION.md\" (stops Devin picking it up again, `8c008e9` already superseded one auto-directive). ADD a real README (3 lines). Verify: `git grep -n \"frozen exhibit\"` in SlimeBreeder."
```
