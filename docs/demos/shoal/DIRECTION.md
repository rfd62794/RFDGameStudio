# shoal direction (2026-10-04)
## What it tried to be
A watch-and-seed reef: fish graze, sharks hunt, algae rises and sinks with grazing pressure, no win state (ts/src/games/shoal/config.ts:7-14). It began as an external static embed (e40954be, 2026-07-10), was rebuilt as "Shoal 2.0" continuous steering in TS+Lua (b592356c, db31a159, 07-11), then the Lua executor was replaced by a TS-native sim for a measured 151.7x speedup (games/shoal/ROADMAP.md, CHANGELOG "Production TS-Native Migration", 2026-08-14). Drift: the intent stayed "ecosystem toy", but 80% of the effort since went into performance and renderer profiling, not into giving a player a reason to return.
## Where it is now
- Playable loop: yes. 4 tools (fish/shark/algae/cull, App.tsx:102), scenario picker on the title, first-run primer, mute, extinction screen "Seed a New Reef" (App.tsx:317).
- Tier A closed on 10-04: in-play New Reef + pointer input (13c01455, ts/tests/test_shoal_new_reef_control.ts); the 10-03 SCOPE.md "no restart" finding is stale.
- Still true: reef state is not saved (only the tutorial flag, App.tsx:206) and nothing says "session-only".
- Size: 2,820 TS lines (App.tsx 716) + 2,024 Lua lines kept as reference; 7 test_shoal_* files; builds for arcade, itch (butler) and Y8 (build:shoal:y8).
- Weak spot: test_shoal_chrome_polish.ts asserts App.tsx source text, not behaviour; no headless "N ticks, no NaN, both outcomes reachable" test (B4).
- Dead weight: games/shoal/*.lua is no longer executed (ROADMAP: fengari replaced); it is reference/exhibit only.
## Player experience today vs the target
First 60 s: pick a scenario, press Start Reef, drop fish; the primer explains four tools. Feedback is continuous (schooling, hunger colour, lineage hue). Progress: none; there is nothing to aim at. Way back: GameShell back plus "Title".
Best moment: dropping a shark into a thriving school and watching it split and the algae rebound.
Biggest turn-off: no goal or score, so a 30-second visit has no "I did something" receipt, and a reload silently loses the reef.
## Verdict
POLISH (Tier C showcase, settled pick).
1. The sim and chrome are the strongest in the arcade (only `stable` entry); work is gap-closing, not rework.
2. The missing piece is a receipt for the player (reef report), not new mechanics.
3. Same source ships to arcade, itch and Y8, so cheap, additive changes win.
## Replan
1. Honest state (S): CUT nothing; ADD "session-only" line on title, or persist scenario+seed+tick with a Reset control via engine/shared/persistence. Recommend the label first (cheaper). Verify: Playwright act-reload step, or the text present.
2. Behaviour tests (S): CUT the source-text assertions in test_shoal_chrome_polish.ts (they pass while behaviour breaks); ADD headless 2,000-tick run per scenario, no NaN/negative counts, extinction and survival both reachable. Verify: `cd ts && npx vitest run tests/test_shoal_headless.ts`.
3. Reef report (M): ADD a one-screen summary on Mechanics/extinction (ticks survived, peak population, lineages, algae balance) and one "try this" nudge, no new entities. Verify: screenshot at 1280 and 390.
4. Phone layout (S): apply `rotate-hint` (redesign spec c3, line 62; Shoal named there). Verify: 390x844 screenshot.
Do not do: orca/whale, new habitats, typed arrays, layered canvas (ROADMAP backlog; each costs more than the player sees).
## First three directives
1. Shoal headless balance test and replace source-text polish asserts - S - none.
2. Shoal session-only label + reef report screen - M - D1 not required; touches App.tsx.
3. Shoal phone layout via rotate-hint - S - redesign D2 phone-layout field.
## Open question for Robert
None.
