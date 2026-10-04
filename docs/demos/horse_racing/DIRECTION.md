# horse_racing direction (2026-10-04)
## What it tried to be
"Derby Sim": breed horses, race them, bet Win/Place/Show, run a career (config.ts:6-11). It began 2026-06-23 as an AI Studio export (`examples/horse-racing-&-breeding`, first commit `e0578e7c`) turned into the studio's first Lua-backed game, then served as the proof case for the engine itself: GameRenderer interface (`407fe6c2`), UI interpreter (`de3d3b7d`), shared hooks (`7351e364`), Always-Live arcade (`fb00e101`, where it got the amber "stable" badge), AI-only races plus Calendar (`c553125f`). Drift: it was a framework demo that got promoted to a player-facing game; the last real feature work was 2026-06-27 and everything since is chrome (`8867b364` tutorial/HUD/SFX/bankruptcy, #49). A legacy pygame renderer (renderers/pygame/games/horse_racing) remains as an exhibit.
## Where it is now
- Four tabs (Stable, Breeder, Betting, Calendar), SVG racers and a full-screen track; 3,313 lines TS/CSS, 776-line App, 420 lines Lua, genetics/odds/market in shared engine Lua.
- Economy (data.yaml): 1,000 funds, 3 slots (max 12, 500 each), starter horse 400, 6-horse fields, overround 1.12, race cooldown 90 s, breed cooldown 180 s, bankruptcy grant.
- Persistence of funds/horses/history/slots works (App.tsx:173-197). "New Game" only dismisses the title (App.tsx:200-205, never clears the save); no real reset.
- Tests: test_horse_racing_polish.ts mostly asserts source text (lines 8-18); no headless race/economy test. No `build:horse_racing` script (package.json has none).
- Status `stable` is unearned (polish standard: only shoal) and no cover exists (arcade-and-site-status line 67-68).
- Stale note: root ROADMAP.md:247 lists "pre-existing TypeScript errors in horse_racing" while docs/ROADMAP.md:100 says it compiles; tsc not re-run here.
## Player experience today vs the target
First 60 s: title (Race, Breed, Bet), a first-run tutorial, a starter stable with a horse, one tap to a race with an animated track. Best moment: watching your own horse run after placing a bet, then the payout. Biggest turn-off: per-horse real-time rest timers (90 s after a race, 180 s breed cooldown) in a game you are trying to sample for five minutes, and no honest way to start over once a save is bad (bankrupt loop). Way back: shell control; progress persists.
## Verdict
POLISH.
1. The loop is complete and the best-presented creature game after SlimeWorld; nothing needs cutting for scope.
2. All three real faults are small and mechanical: label, reset, build script/test.
3. It is a framework relic (Lua + pygame + TS), so the cheap move is to freeze systems and stop adding features.
## Replan
- Phase 1 (S): honesty and reset. CUT the `stable` badge to `beta` (public label, no Tier B evidence; Robert's call) and the New Game that does nothing. ADD Continue vs New Game (confirmed wipe of the `derby_sim_state_v1` save) and `build:horse_racing`. Verify: `cd ts && npm run build:horse_racing` exits 0; vitest for New Game clearing the save.
- Phase 2 (S): proof. CUT source-text assertions that duplicate behaviour tests. ADD a headless balance test: 200 races with a flat-bet strategy, assert no negative funds, bankruptcy reachable, odds sum sane (overround 1.12). Verify: the named numbers in the vitest output.
- Phase 3 (S): inviting. ADD a "Quick race" first run (skip cooldown for the first 3 races, then explain it) and a cover/screenshot. CUT nothing else; no new genetics. Verify: Playwright cold load reaches a finished race in under 60 s; cover present in manifest.
## First three directives
1. Horse_Racing_New_Game_Reset_And_Build - Continue/New Game, build script; S; none.
2. Horse_Racing_Headless_Balance_Test - 200-race run asserting funds and bankruptcy; S; none.
3. Horse_Racing_Status_Cover_First_Race - status beta, cover, first-3-races cooldown skip; S; after 1 (status needs Robert's OK).
## Open question for Robert
Downgrade the public badge `stable` to `beta` for horse_racing (and slimeworld) until Tier B evidence lands? Recommended default: yes, one label pass for both.
