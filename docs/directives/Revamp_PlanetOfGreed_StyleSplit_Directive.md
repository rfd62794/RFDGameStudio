# Planet of Greed: the deferred UI/UX style split

## 1. Why this exists

Planet of Greed is Active and balance-verified (60-game harness; House stats
wired into all mechanics), but the StatusBoard carries one deferred item:
**"UI/UX style split."** This directive picks that item up. The game's own
docs — `ts/src/games/planetofgreed/CHANGELOG.md` and any in-tree design
notes — define what the split means concretely; where they and this file
disagree on detail, the game's docs win.

## 2. Scope

`ts/src/games/planetofgreed/` presentation layer. Game logic, House stat
balance, and the `GuidedWalkthrough` are not in scope unless the split
requires touching their seams (say so in the report if it does).

## 3. The work

1. Read the game's CHANGELOG/docs and locate what "style split" was deferred
   on — report the finding before building (one short paragraph; the
   deferred item's original context may live in an ADR or note).
2. Implement the split: separate the presentation concerns the design calls
   for (per-House styling, theme tokens, layout variants — whatever the
   documented split actually is).
3. **Shared-component duty (ADR-014):** a style-split mechanism — theme
   tokens, per-faction palettes, styled-panel variants — is a textbook
   shared capability. If the implementation produces one another live game
   could consume (Dark-fantasy vs bright-casual theming is already a real
   axis across the catalog), put it in `ts/src/ui/components/` or
   `engine/shared/` and name the second consumer in the report.
4. Keep `GuidedWalkthrough` and `OnboardingGate` usage intact and working.

## 4. What NOT to do

- Do not touch balance constants, the 60-game harness, or House mechanics.
- Do not split for its own sake — implement the documented split, nothing
  grander.
- No new CSS framework or styling dependency.

## 5. Verification

- `cd ts && npm test` green (`test_planetofgreed_*` included).
- `cd ts && npm run build:planetofgreed` succeeds.
- Report: what the deferred split turned out to be, what was built, what
  (if anything) was extracted shared.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
<!-- queue:end -->
