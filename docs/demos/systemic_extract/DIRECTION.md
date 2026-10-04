# systemic_extract direction (2026-10-04)
## What it tried to be
A top-down extraction roguelite plus base-builder on one 200x200 megamap: deploy from a sanctuary into four dungeon sectors, survive spreading hazards and escalating hives on a headless ECS simulation, extract salvage, spend it on the base. Imported from AI Studio as intake 0.1.0R1 (`75277c70`, 2026-09-18), registered the same day (`2e85920a`), given its own node_modules and vitest (`0b1878fe`), and documented with an architecture map and audit backlog (`81727dde`). The intent is two loops (raid and hideout); the code shipped one: the megamap rewrite ("ADR 011") left the hideout meta loop orphaned, and the README backlog item 1 says players collect scrap "with nowhere to spend it".
## Where it is now
- Same-origin embed of `examples/systemic-extract` at `/arcade/systemic_extract/`; status `external`.
- Size: 13,610 lines of ts/tsx in src; one test file for the simulation plus restart and wiring tests (`test_systemic_extract_restart.ts`).
- NEW RUN control landed: `738eb80f` (PR #119, RaidView remount on `runId`), plus a RaidHUD narrow-width fix `20eb21b8`. Tier A is mostly closed.
- Orphan code: `HideoutView.tsx` and `hooks/useHideoutState.ts` are imported only by each other (grep, src); Deconstructor, Research Bench, Fabricator, Deployment Bay are unreachable.
- Known debt in README backlog: 26 `Math.random`, 19 `any`, ADRs 002-011 missing, favicon 404; saves in IndexedDB.
- Card tag in the audit read "Prototype", not "embed" (batch2); no cover screenshot in the manifest.
## Player experience today vs the target
First 60 s: Start, the sanctuary, press DEPLOY, a canvas raid loads (audit: loads clean on desktop and phone). Best moment: the extraction gamble, leaving a hive-infested sector with salvage. Biggest turn-off: salvage has no use, so a successful run ends in nothing, which is the opposite of "encouraging". Progress: none visible. Way back: shell control plus NEW RUN.
## Verdict
**PARK.**
1. The settled decision already parks the hideout loop until Robert picks the megamap design; guessing a design now would be wasted work in a 13.6k-line app.
2. The raid loop plays and now restarts, so it can sit live as an honest embed with no further spend.
3. Every edit risks being overwritten by an AI Studio re-promotion (README "Improvement workflow"), which argues against polishing before the design is chosen.
## Replan
1. Close Tier A (S). ADD: favicon (clears the console warning), card label "embed", cover screenshot, a one-line honest blurb note that salvage is not yet spendable. CUT: nothing. Verify: A1 zero console errors; manifest references the screenshot.
2. Decision gate (no build). If Robert picks "hideout as a modal from sanctuary buildings", the hideout loop is M; if he picks "no hideout", CUT `HideoutView`, `useHideoutState` and the four stations (S, reason: dead code behind a stale design). Verify: `grep -rn HideoutView examples/systemic-extract/src` empty after the cut.
No phase 3 until phase 2 is answered.
## First three directives
1. systemic_extract: favicon, "embed" label, cover screenshot. S. Depends: none.
2. systemic_extract: write the two-option hideout decision page (wire-in vs cut, with file lists). S. Depends: none.
3. systemic_extract: apply the chosen option. M (wire) or S (cut). Depends: Robert's answer.
## Open question for Robert
How should salvage be spent, given a parked hideout? Recommended default: keep parked, and if you want it shipped as a game, choose the smallest option (one "Stash and upgrade" modal from the sanctuary reusing `HideoutView`), not the megamap's corner buildings. No contradiction with the settled PARK.
