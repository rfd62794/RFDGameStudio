# kingmaker_squads direction (2026-10-04)

## What it tried to be
A tactical squad campaign on an 8x8 grid: pick a faction, buy and field squads in a shop phase, move with chess-style rules, fight a deterministic combat engine, take territory, hold the crown, manage loyalty (examples/kingmaker-squads/src: utils/chessMovement.ts, combatEngine.ts, crownLogic.ts, loyaltyLogic.ts; screens New Game, Shop, Forces, Territory, Victory, Game Over). AI Studio export, intake v0.1.0R1 (cb5e5366, 2026-08-04). It was never meant to be a precursor: its wheel/culture identity became Planet of Greed's six-culture wheel (docs/analysis/planetofgreed_merge_audit.md, ADR-023), and Planet of Greed's design explicitly leaves Kingmaker's "individually-tracked-unit combat and tactical placement layer" deferred and "non-portable" (PlanetOfGreed_Design_v0.2.md:175-176). So the tactical game exists in only one place. Registered as Origin 2026-08-23 (d53a0d15); source force-added 2026-10-04 (fa3f359c) after being gitignored.

## Where it is now
- Complete loop: New Game, shop, forces, territory, victory and game-over screens (App.tsx:314-319); save/continue via localStorage (App.tsx:34,81).
- 12,232 ts/tsx lines (App.tsx 334), 70 tracked files; tests: utils/gameLogic.test.ts (2,089 lines) and cityGeneration.test.ts, the largest real suite of the eight except 7 Days to Fry.
- Loads clean, "Start New Campaign" in frame (audit batch1:41). Config blurb no longer leaks a repo path.
- Restart: directive Kingmaker_Squads_Restart_Directive.md is in Review (two-step confirm; today's header Restart is an icon that does not reset, per the directive text).
- Stale docs: ts/src/games/kingmaker_squads/README.md still says the example is untracked and `vite.config.ts` lacks `base`; both are fixed (fa3f359c; vite.config.ts:8 sets `/arcade/kingmaker_squads/`).
- Genre is `combat-arena`, a poor fit for a turn-based squad campaign (config.ts); not verified against the taxonomy list.

## Player experience today vs the target
First 60 s: New Game screen then an opening sequence and a shop; clear start, unknown learning curve (no tutorial text found by file names). Best moment: the shop-then-deploy-then-resolve loop, where you pick squads and watch the deterministic combat play out; it is a recognizable, finished loop. Biggest turn-off: the "Origin" label tells players it is superseded history, so they skip a game that is more complete than the thing that replaced it, and an icon-only Restart that does nothing visible.

## Verdict
KEEP-AS-IS (after the restart directive merges). 1) It is finished and tested; rule 1 of the polish standard caps Origin entries at Tier A. 2) The remaining work is already specified and in Review. 3) Cutting or redesigning a 12k-line tested game would cost more than anything it could return.

## Replan
1. Land restart. Goal: A3 passes in frame. CUT: nothing. ADD: merge the Review directive. Size S. Verify: its own vitest plus a screenshot of the start screen.
2. Honest docs. CUT: stale README paragraphs. ADD: current source location and base path. Size S. Verify: `grep gitignored ts/src/games/kingmaker_squads/README.md` is empty.
3. Optional, Robert's call: relabel. If promoted, it is its own game (tag `tactical-squad`, genre review) and gets a Tier B pass (first-minute hint, balance test, win/loss next action). Size M. Verify: B4 headless campaign test.

## First three directives
1. Review and merge Kingmaker_Squads_Restart_Directive (controller). S. depends-on: none.
2. Fix kingmaker_squads and corpworld READMEs (shared directive with corpworld). S. depends-on: none.
3. Kingmaker headless campaign balance test (B4: no softlock, win/loss reachable). S. depends-on: 1.

## Open question for Robert
Is "Origin of Planet of Greed" the right label? The redesign's default hides Origin embeds, which would bury the only tactical game in the studio. Recommended default: keep the Origin label but do NOT hide it; surface it from Planet of Greed's title screen (this overrides nothing settled, but narrows the hide-origin default).
