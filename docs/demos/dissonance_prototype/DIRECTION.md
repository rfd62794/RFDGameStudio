# dissonance_prototype direction (2026-10-04)
## What it tried to be
The AI Studio (Gemini-built) core-loop prototype that Dissonance Depths grew from: turn-based combat, relation-based combination, Locked/Hinted/Discovered stabilization (ts/src/games/dissonance_prototype/config.ts:13). It was tracked on 2026-08-30 (177f0640, "was untracked, same PlanetForge-class risk") and registered as an Origin project (docs/adr/ADR-023-legacy-origin-projects-type.md; DemoPortingRoadmap Legacy table). Drift: none; it was never meant to evolve. The registry comment still says the source is tmp/dissonance-src/ (config.ts:5) although it lives in examples/dissonance-prototype/.
## Where it is now
- Registry entry: status external, supersededBy dissonance, embedUrl /arcade/dissonance_prototype/ (config.ts:11-17).
- Not live: /games/dissonance-prototype/ returned 404 on 10-03 (audit batch1:34) and the redesign spec still lists it among 404 embeds (spec section b).
- Source: 9,009 lines (src/phases, logic/combatResolution.ts 505, 12 components), a `vite build` script, no Gemini call found in src (SCOPE.md), no tests, no cover.
- Description shows a repo path and "(Gemini API)" to players (config.ts:13; audit batch1 item 8).
- It duplicates the title of the game it became; two tiles for one game dilute the arcade.
- Policy: Origin entries get Tier A only (polish standard section 2); no code decisions are needed.
## Player experience today vs the target
First 60 s: a 404 page. If published, a player gets an older, rougher Dissonance with no path back to the real game except the shell.
Best moment: seeing the prototype beside Depths (history, not play).
Biggest turn-off: the card exists and is dead.
## Verdict
FOLD-INTO dissonance.
1. Slimebreeder (settled) is the precedent: an Origin is an exhibit tied to the game it became, not a competing tile; a dead tile breaks "no empty cards".
2. Its only value is provenance; that belongs as a link from Dissonance's credits.
3. Cost is S, nothing protected is touched, and /arcade/dissonance_prototype/ gets published so the URL is never a 404.
## Replan
1. Publish exhibit (S): build examples/dissonance-prototype and publish at /arcade/dissonance_prototype/. CUT the repo path and "(Gemini API)" from the description (A5: players need neither). Verify: `curl -I` returns 200 and a Playwright load shows zero console errors.
2. Fold the entry (S): ADD a "Where Dissonance began" link on Dissonance's title or credits to the embed; keep the registry entry (external, supersededBy) but exclude it from "Start here" and the card grid. CUT the stale tmp/dissonance-src comments (config.ts:5, ADR-023:18; they point to a path that no longer exists). Verify: grep for "tmp/dissonance-src" is empty; no card in the home grid.
No further phases: no gameplay edits, no Tier B.
## First three directives
1. Publish dissonance_prototype embed and clean its description - S - redesign D1/D2 build template (or a manual dist copy).
2. Dissonance credits link to the Origin and hide the prototype tile - S - directive 1.
3. Fix stale source-path comments (config.ts, ADR-023) - S - none.
## Open question for Robert
Hide the tile (recommended) or keep a labelled "(Origin)" card as the slimebreeder exhibit does? One rule for all Origins is simpler; default: follow whatever slimebreeder does.
