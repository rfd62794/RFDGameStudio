# filipino_bpo_simulator direction (2026-10-04)

## What it tried to be
"Call Center Tycoon": you are the remote dialer operator, tuning list purity/freshness and dialer pace against a daily quota while the floor is watched, not commanded (intake/filipino-bpo-simulator/Design.md:6-27 pillars "Limited Control, Full Responsibility", "Agents Are Weather"). It began as an AI Studio cubicle tycoon (87f351f0, 2026-09-03) full of agent management; the same day Design.md (ddd0cd3c) cut agents as an entity and Phase 1 built List/Dialer/Quota (1e23c9bc, 22 tests), Phase 2 added tabbed Dashboard/Floor/AfterHours (30b17dd4), Phase 2b replaced tabs with a permanent isometric floor plus popups, RollerCoaster Tycoon style (9d584a8b, Phase2b_PermanentFloor_Directive.md). The whole history is one day (2026-09-03); nothing since.

## Where it is now
- Systems are real and tested: listSystem, dialerSystem, quotaSystem, 22 passing per docs/state/current.md (claim, not re-run).
- The tracked `examples/filipino-bpo-simulator` (0c416b4f, 2026-10-04, INTAKE_VERSION 0.1.0R2) is the OLD Phase 2 tabbed build: it has DashboardView/FloorView and `activeScreen` (App.tsx, 4 hits). The correct Phase 2b build is only in `intake/filipino-bpo-simulator/extracted` (0 `activeScreen`, has DialerControlModal). So the tracked source contradicts Design.md.
- App.tsx imports 16 views/modals incl. Recruiting, Wage, HR, Staff, Training, ITSupport, Agent, which Design.md:65 says are not player-commanded menus (they run as background systems).
- NOT PUBLISHED: 404 at /games/filipino-bpo-simulator/ and /arcade/... (audit batch1:37); config has `embedUrl` but no `source`, so deploy skips it (same cause as planetforge, 3ccc415c).
- Persistence is only `bpo_grid` and `bpo_agents` in localStorage (App.tsx:72-80,137); money/quota/day are not saved.
- Size: 5,906 ts/tsx lines in examples; 1,039-line App.tsx; IsometricOfficeCanvas 686.

## Player experience today vs the target
First 60 s (Phase 2b intent): a permanent office floor, a bottom stat bar, a Dialer button; set pace, watch calls land, end the shift, spend after hours. Best moment: the after-hours verdict (quota met or missed, buy a dialer upgrade, pick tomorrow's list), a clean daily loop. Biggest turn-off: today there is no page at all, and the code that exists is the superseded tabbed build behind 14 agent-management menus that the design says should not exist.

## Verdict
TRIM, then POLISH. 1) The tracked build is the wrong phase; the right one is sitting in intake. 2) Half the UI is cut-by-design agent management. 3) The core (list + dialer + quota) is small, tested and well specified, so cutting is cheap and the game gets clearer.

## Replan
1. Right source. Goal: examples/ holds Phase 2b. CUT: DashboardView, FloorView, tab toggle (reason: superseded by 2b). ADD: copy extracted/ over examples/, bump INTAKE_VERSION, `source: {kind:'example', slug:'filipino-bpo-simulator'}` in config.ts, update SOURCES in ts/tests/test_registry_export.ts. Size S. Verify: `cd ts && npx vitest run tests/test_registry_export.ts`; in the example `npm test` shows 22 passed (controller runs if install is blocked).
2. Trim to the design. CUT: Recruiting, Wage, HR, Staff, Training, ITSupport, Agent modals (reason: Design.md:65 forbids player-opened agent menus; keep any background effect on morale/capacity). Keep Script as tentative. ADD: nothing. Size M. Verify: tsc 0 errors, 22 tests still pass, grep of App.tsx imports shows <= 8 modals.
3. Save the run. ADD: persist day, money, list pool, dialer tier; "New game" control with confirm (B2, A3). Size S. Verify: pure-helper vitest round-trip.
4. Publish after the gate in Open question; first-minute hint on the dialer pace slider (B1). Size S.

## First three directives
1. Re-promote Phase 2b into examples/filipino-bpo-simulator and add `source`. S. depends-on: none.
2. Remove agent-management menus per Design.md:65. M. depends-on: 1.
3. Persist day/money/lists and add New Game. S. depends-on: 2.

## Open question for Robert
This is the contact-center dialer domain of your day job (fictional names ACBS, LedgerRate, DialSmart). Run the nca-compliance check before publishing? Recommended default: yes, controller runs it before directive 1 deploys; building stays worktree-only until it clears.

## Decision update 2026-10-04 (Robert; overrides the Open question above)
- The NCA compliance check is NOT a blocker (Robert: "actually safe"). It is dropped as a precondition for building or publishing.
- The demo becomes "BPO Sim": country-agnostic, not Filipino-specific. The player picks a BPO-heavy country from a data list (Philippines, India, Malaysia, Vietnam, Poland, Romania, Egypt, South Africa, Kenya, Colombia, Mexico, Costa Rica). Countries differ ONLY by neutral business attributes (labor cost, time-zone overlap with the client, talent-pool size, connectivity risk, attrition, regulatory overhead). No accent or language jokes, no caricature, no national stereotyping in copy, characters or events; the cast is diverse and neutral.
- Directives: BPO_Sim_Country_Data_Directive, BPO_Sim_Repromote_And_Rename_Directive, BPO_Sim_Country_Selector_Directive, BPO_Sim_Neutral_Copy_Check_Directive (docs/directives/).
- Publishing is not part of those directives: Robert approves the deploy after the local safe check.
