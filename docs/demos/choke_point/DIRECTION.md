# choke_point direction (2026-10-04)
## What it tried to be
A compact turn-based tactical defense puzzle: place barricades and autocannons on a 6x5 grid, see enemy moves and attacks previewed, commit the turn. Born overnight as one of two scaffolds, "feat(overnight): complete choke_point prototype and register both games" (`e0f1e44a`, 2026-09-03; paired with wire_rust), verified in `24ead23b` (TS build fix, arcade wiring). `docs/status.md:31` calls it a "Lua-backed tower-defense prototype". Its pitch, "Preview enemy movement ... deploy perfect blockers" (`config.ts`), has not drifted; it just never got content past a first slice.
## Where it is now
- Playable loop: place tower, commit, waves advance, win card, core-breach loss (`games/choke_point/logic.lua`, 257 lines; `App.tsx` 279 lines).
- Tier A landed in `f73a8c76` (in-play Restart, victory screen, `build:choke_point`, phone fit); tests `test_choke_point_ui.ts`, `test_choke_point_restart.ts`.
- Content is tiny: 2 waves (crawlers; wave 2 adds a blaster), 2 towers (Barricade cost 3, Autocannon cost 5), start energy 10, +5 per turn (`games/choke_point/data.yaml:11-59`).
- Logic lives in Lua via `useLuaCall`; ADR-013 retired Lua as a portability carve-out, so this is legacy that we keep stable, not extend.
- No cover on the site (listed among the 8 missing covers); no persistence; no best score.
- Hosted inside the RFDGameStudio shell (`/arcade/rfdgamestudio/?game=choke_point`), not as its own embed (audit batch1).
## Player experience today vs the target
First 60 s: title, "Establish Connection", place a tower, commit, watch two crawlers die. Best moment: the enemy-intent preview that lets you plan a block. Biggest turn-off: it ends in two waves, about a minute, then there is nothing to chase. Progress and feedback: win card exists; no score, no "wave 3 of 3", no replay incentive.
## Verdict
**POLISH.**
1. The loop and the preview mechanic work; what is missing is length, which is data (waves in YAML), not code.
2. Cheapest path to a "second visit": more waves and one enemy type, with a test proving the win is reachable.
3. Not a candidate for REDESIGN: it is a puzzle, and a puzzle's value is a handful of good levels.
## Replan
1. Prove it (S). ADD: headless test over all waves (no softlock, a winning placement exists, loss reachable). CUT: nothing. Verify: `cd ts && npx vitest run tests/test_choke_point_*`.
2. Content (M). ADD in `data.yaml` only: waves 3-6, one new enemy using an existing behavior, per-wave star rating (core HP left). CUT: any wish for new tower classes, since those need new Lua mechanics (reason: ADR-013, no new Lua surface). Verify: the phase 1 test extended to 6 waves; screenshot of the wave counter.
3. Frame it (S). ADD: wave counter ("Wave 2 of 6"), a result card with stars and a "Play again" action; cover image. Verify: Playwright cold load plus one full win run.
## First three directives
1. choke_point: headless all-waves solvability test (win reachable, no softlock). S. Depends: none.
2. choke_point: waves 3-6 and one enemy in `data.yaml`, extend the test to match. M. Depends: 1.
3. choke_point: wave counter, star result card, cover screenshot. S. Depends: 2.
## Open question for Robert
None. Default: leave the Lua logic as is; if a mechanic ever needs new logic, convert that logic to TS first (ADR-012 pipeline) rather than extend Lua.
