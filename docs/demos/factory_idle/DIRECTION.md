# factory_idle direction (2026-10-04)

## What it tried to be
A Factorio-style tile factory (conveyors, splitters, tunnels, power grid, research) feeding a weapons storefront with impatient customers: "Armory: Storefront & Spindle" (docs/RFDGameStudio_DemoPortingRoadmap.md:65). Lineage is three AI Studio exports: `examples/armory-storefront-spindle` (763-line reducer), `-phase1` (4,498 ts/tsx lines), `-phase2` (4,831 lines, 1,205-line `engine/gameReducer.ts`). All were tracked as-is (04c9eb6e, f1ca2956 on 2026-08-30; 0c416b4f on 2026-10-04). Registered 2026-08-22 (907f2509) as `external`, genre `idle-incremental` (d17e85fa), but the thing is a logistics sandbox, not an idle game: it starts running with $350 (gameReducer.ts:92,147) and has no offline progress. The roadmap claim "phases 2-5 byte-identical" is wrong: only three dirs exist and they differ.

## Where it is now
- Playable loop in code: build belts/machines, produce weapons, shelf stock, customers with patience and bonus multiplier (types.ts:125-135), research unlocks (gameReducer.ts:574-594). Not played in a browser for this note.
- NOT PUBLISHED: /games/factory-idle/ and /arcade/factory_idle/ both 404 (audit batch1:36); `config.ts` still has no `source`; Tier A directive Polish_Factory_Idle_TierA is Approved, not Done.
- No persistence (no localStorage in src), no goal or win state, no tests, no tutorial or hint text.
- Reset is an icon titled "Clear Entire Factory Floor" (Header.tsx:277-281): destructive, unlabelled.
- Dead weight: two older lineage dirs (phase1, spindle) tracked but unreferenced.
- Size: 4.3k lines in phase2, `SvgWorkshopGrid.tsx` 812, `StorefrontPanel.tsx` 666.

## Player experience today vs the target
First 60 s: you land on a running factory with $350 and an empty grid, no hint what to place first. Feedback exists (log lines, RESEARCH UNLOCKED, sound via audio.ts) but progress is lost on reload and nothing says "you did well". Best moment: a customer walks up, you have the weapon on the shelf, cash jumps (the storefront closes the loop that most sandboxes leave open). Biggest turn-off: an empty grid with no first step, then losing it all on refresh.

## Verdict
POLISH (publish first, per settled decision). 1) The loop is real and sized right for one more pass. 2) The publish gap is the only thing between players and it. 3) Two cheap B-tier gaps (save, first step) fix the turn-offs; no redesign needed.

## Replan
1. Publish phase 2 as honest embed. Goal: page stops 404ing. CUT: nothing. ADD: `source` in config.ts, honest blurb (existing directive). Size S. Verify: `cd ts && npx vitest run tests/test_registry_export.ts`, then controller builds and loads /arcade/factory_idle/.
2. Keep your factory. CUT: nothing. ADD: autosave/restore of reducer state to localStorage, labelled "Reset factory" with two-step confirm (A3, B2). Size S. Verify: pure-helper vitest (pattern `ts/tests/test_ledger_utils.ts`) round-trips state.
3. First step. CUT: the Gemini-era README boilerplate. ADD: a one-line dismissible hint ("Place a spawner, belt it to an assembler") and a starter goal ("serve 5 customers"). Size S. Verify: screenshot at 1280x720 and 390x844.
4. TRIM (after 1): move phase1 and spindle to `archive/` (cold storage); reason: nobody can reach them and they confuse which build ships. Size S. Verify: `git ls-files examples | grep armory` shows only phase2.

## First three directives
1. Factory Idle Tier A publish (already written: docs/directives/Polish_Factory_Idle_TierA_Directive.md). S. depends-on: none.
2. Factory Idle autosave + labelled reset (examples/factory-idle-precision-armory-phase2). S. depends-on: 1.
3. Factory Idle first-step hint + starter goal. S. depends-on: 1.

## Open question for Robert
The storefront sells pistols, shotguns, rifles and SMGs (types.ts:209-215). Publish as is on a business-facing arcade, or reskin item names (tools, gadgets)? Recommended default: reskin the labels only (data in recipes.ts), same mechanics, so the card is safe next to client-facing pages.
Correction 2026-10-04: the player does not land on an empty grid. getInitialGameState() applies PRESET_FACTORIES[0] (a starter line: power, two spawners, conveyors, a fitter, a packer) and the factory runs from the first second with one customer waiting; the first-step hint therefore says "your line is running, serve customers" (docs/directives/Factory_Idle_Starter_Goal_Hint_Directive.md).
