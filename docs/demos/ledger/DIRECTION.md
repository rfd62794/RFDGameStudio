# ledger direction (2026-10-04)
## What it tried to be
A tight 10-day trading-and-appraisal run: inspect walk-ins, bid in Dutch auctions, resell into a volatile market, and clear a compounding loan by day 10, with soft lockout for missed payments (examples/ledger/metadata.json; ts/src/games/ledger/config.ts:7). It is an AI Studio export (examples/ledger/README.md), embedded as a same-origin demo on 2026-07-10 (e40954be), tracked 07-11 (6b7c2b09). Drift: none; it was always a finished short run, not a campaign, and the studio has treated it as an honest embed since.
## Where it is now
- Playable loop: yes. Day 10 with debt 0 wins, else loses; restart resets state (examples/ledger/src/App.tsx:350-358, 615).
- Tier A closed on 10-04 (70f772ad, be78ef89): two-step Restart in the header (components/RestartButton.tsx), safe-centered dialog overlay for the phone crop, logic test ts/tests/test_ledger_utils.ts. The 10-03 SCOPE.md "no restart, intro cropped" findings are therefore stale.
- Size: 2,990 lines in examples/ledger/src (App.tsx 774, utils.ts 507, 6 components); its own Vite build; live at /arcade/ledger/ and has a cover.
- Missing: no persistence (no localStorage in src), no sound, no `build:ledger` in ts/package.json (embed is built from the example, not the studio template).
- Honesty gap: metadata.json advertises MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API but no Gemini call exists in src (grep empty); it is harmless but untrue.
- Not re-verified by me: the live phone rendering after the 10-04 fix.
## Player experience today vs the target
First 60 s: Start game, then the intro guide, then "OPEN SHOP & TRADE": a clear first action. Feedback: prices, Dutch-auction countdown, end-of-day tally. Progress: days and debt. Way back: shell back plus Restart.
Best moment: waiting out a falling Dutch-auction price and snapping a lot that the market then resells above cost.
Biggest turn-off: a loss after ten days with no reason shown (which payment, which bad buy) and no run history.
## Verdict
KEEP-AS-IS.
1. Tier A is closed and the loop is complete; the demo is an embed of a finished AI Studio game, and the settled embed rule (antsim, factory_idle) is Tier A only.
2. More polish (persistence, sound, redesign) would cost more than a 10-day run returns for a solo studio.
3. The one open risk is live verification, not code.
## Replan
1. Verify (S): ADD a Playwright smoke at 1280x720 and 390x844: start, buy, end day, restart; screenshots yes/no. CUT nothing. Verify: smoke passes with zero console errors; intro readable.
2. Honest labels (S): CUT the "Gemini" capability claim from examples/ledger/metadata.json (unused, one reason: untrue metadata invites key questions). Keep the card text; confirm "embed" label (A8).
3. Optional (S): ADD a one-line loss reason on the Game Over dialog from existing state (debt remaining, last missed payment); no new systems. Verify: unit test on the dialog's input.
Stop there; promote nothing, port nothing.
## First three directives
1. Ledger Playwright smoke at 1280 and 390 - S - none.
2. Ledger metadata cleanup (drop unused Gemini capability) - S - none.
3. Ledger game-over reason line - S - none.
## Open question for Robert
None.
