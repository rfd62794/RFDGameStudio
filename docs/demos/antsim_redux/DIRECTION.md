# antsim_redux direction (2026-10-04)
## What it tried to be
An ant-colony simulation lab, not a game: pheromone trails, direct food sensing, queen/egg/larva lifecycle, multi-colony Lanchester combat, tunnel pathfinding. Imported as an AI Studio export (intake manifest `ae4d0f9b`, 2026-08-06; source tracked `e44bdc72`, 08-30). The sim grew in numbered phases to "Phase 4g Complete" (`examples/antsim-redux/docs/state/current.md:1`, "120 test anchors" per `docs/status.md:27`). The porting roadmap (`docs/RFDGameStudio_DemoPortingRoadmap.md:62,111`) calls a TS-native port "real, substantial future work"; that was settled 2026-10-04 as: honest embed, Tier A only. Intent never included a player goal: the player places food and watches (`App.tsx` per SCOPE.md).
## Where it is now
- Embed of `examples/antsim-redux` at `/arcade/antsim_redux/`; `config.ts` status `external`, `source.kind:'example'`.
- Sim is real and modular: examples src is 3,215 lines of ts/tsx (simulation, tunnel_network, combat, colony_lifecycle, pheromones); one test file, `tests/simulation.test.ts`.
- Tier A landed in `85559522` (responsive classes, Test Anchors tab relabelled "(sample list)", static, not run). The 394 px vs 374 px phone overflow (audit batch1) was not re-measured after the fix.
- Still player-visible dev-speak: header badge "Phase 2c" and subtitle "Trophallaxis, Queen Feeding & Egg Lifecycle" (`App.tsx:161,163`), and a Test Anchors tab that lists 21+ internal test names (`App.tsx:187,43-55`).
- Stale against its own docs: badge says Phase 2c, state doc says 4g.
- No win, loss, score or restart-for-a-reason: Reset exists, nothing to reset toward.
## Player experience today vs the target
First 60 s: click Start, ants stream out, trails form; Reset/Pause/1x-2x-5x are in the frame. Best moment: watching a pheromone trail self-reinforce after dropping food, with no instruction needed. Biggest turn-off: nothing asks the player to do anything, and the second tab is a list of test names. Progress: none. Way back: shell back control (A2 passed in audit).
## Verdict
**TRIM.**
1. The only gap between this and an honest "toy" is dev-speak (phase badge, test-name tab), and cutting beats rewriting.
2. A goal, scoring or TS-native port are all outside the settled "Tier A only" decision and would cost L for a sandbox.
3. Embed edits are overwritten by an AI Studio re-import, so every extra edit is rework risk; keep the diff tiny.
## Replan
1. TRIM (S). CUT: the Test Anchors tab from the player UI (it is not run; the real checks live in `tests/simulation.test.ts`), the "Phase 2c" badge and phase subtitle. ADD: one player line ("Drop food and watch the colony find it") and a state-doc pointer in the README. Verify: `grep -ci "phase\|anchor" examples/antsim-redux/src/App.tsx` shows no player-visible hits; 390x844 screenshot with no horizontal scroll.
2. Close Tier A (S). ADD: A5 screenshot referenced in the manifest, card label "embed" (A8). Verify: the polish standard's A1-A5, A8 smoke steps.
Stop there. Anything beyond is a separate decision (see Open question).
## First three directives
1. antsim_redux: remove dev-speak from the player UI - delete the anchors tab, phase badge and subtitle in `examples/antsim-redux/src/App.tsx`; add a player-facing one-liner. S. Depends: none.
2. antsim_redux: re-measure phone fit at 390x844 and fix any remaining overflow in the embed. S. Depends: 1.
3. antsim_redux: A5 screenshot + "embed" label check (test fails on banned words in config description and UI strings). S. Depends: 1.
## Open question for Robert
None. Settled decision (honest embed, Tier A only) stands; research found no contradiction.
