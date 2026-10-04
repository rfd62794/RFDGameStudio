# slimeworld direction (2026-10-04)
## What it tried to be
The merge of two origins: SlimeGarden's breeding/dispatch/territory loop (AI Studio export, 2026-07) and SlimeBreeder's discovery codex and market, rebuilt TS-native on a Lua rules layer. `games/slimeworld` starts 2026-07-14 (`4182ccc1`, "extracted from SlimeGarden types.ts/gameLogic.ts"); 142 commits since. Design docs: docs/gdd/SlimeWorld_Design_Rev3.md (core loop "Unification of Beliefs"), the Aug 2/5 onboarding/economy directives (Ember start, first-breed 2-Stray reward `de66ddaf`), and the SlimeBreeder ports (`44522310`, `b5e457d0`, `ab3a95ad`, `0d7753a2`). Drift: the loop grew from "breed and dispatch" into a belief/culture/fealty/favors/petitions system, and the registry now calls it `stable`, while the polish standard says only shoal is. bible/games/slimeworld/gdd.md still describes a Metroidvania ("defeat the final boss") and is wrong.
## Where it is now
- Real loop: breed (color/shape/accent genetics), dispatch to planet regions, unlock regions by composite locks, Missions/Economy tabs gated until the first unlock (App.tsx:578; tutorial.ts:3-22).
- Size: 10,465 lines TS/TSX/CSS in ts/src/games/slimeworld plus 4,158 Lua + 843 YAML in games/slimeworld; 679-line App; MissionsTab 2,117, SlimeDexTab 953, EconomyTab 782 lines.
- Tests: 25 test_slimeworld_* files in ts/tests plus 19 Python test_slimeworld*; `build:slimeworld` exists (package.json:12). Persisted save with Hard Reset, but only inside Options (OptionsMenu.tsx).
- The deploy bug (live /arcade/slimeworld/ serving the SlimeGarden build) was fixed by `d9f45518` (config `source` dropped, copy order fixed, test added); live result not re-checked here.
- Phone layout of the TS source is unmeasured (the 476-vs-368 overflow was the origin build).
- Dead weight: tracked `examples/slimeworld/` duplicate (see slimegarden DIRECTION); Lua `logic_original.lua` kept "in sync" by hand (`b5e457d0`).
## Player experience today vs the target
First 60 s: an Opening beat (you start at Ember), then 3 tutorial beats, then a Lab with a few starter slimes; first meaningful action (breed or advance cycle) is guided. Best moment: the first breed, which pays 2 Strays, then the first region unlock opening new tabs. Biggest turn-off: vocabulary and density (Regent, fealty, strain, favors, petitions, Biomass) arriving before the player has felt the loop, and a 2,117-line Missions surface behind it. Way back: shell back control; progress persists; reset is buried in Options.
## Verdict
POLISH.
1. It is the studio's one real creature game and absorbs both origins; direction is settled, delivery is the gap.
2. The faults are measurable and small: unverified phone layout, buried Reset, `stable` label unearned, stale GDD.
3. Cutting is limited to jargon in the first session; features stay frozen (Regents, Legacy Slimes, roster caps are not solo-scale now).
## Replan
- Phase 1 (S): honesty. CUT the `stable` badge (no Tier B evidence yet; set `beta`; Robert's call, see Open question) and bible/games/slimeworld/gdd.md Metroidvania text (wrong). ADD a visible New Campaign entry on the title/menu, not only Options. Verify: `cd ts && npx vitest run test_registry_export.ts test_slimeworld_options_menu_hard_reset.tsx`; screenshot of the menu.
- Phase 2 (M): phone + first minute. CUT nothing in code; hide Missions/Economy jargon until unlocked (already gated), rename shown terms in the first 3 cycles to plain words. ADD a 390x844 Playwright pass (A4) and fix overflow; ADD a first-session hint chain check (B1). Verify: Playwright scrollWidth <= viewport, screenshot pair.
- Phase 3 (M): safety net. ADD a headless balance/softlock vitest (B4: N cycles with a baseline strategy; no negative Biomass, a region unlock reachable). Split MissionsTab into 3-4 files by tab concern (SRP hard rule 2026-10-03), no behaviour change. Verify: full slime test set green, line counts under 700.
## First three directives
1. Slimeworld_Phone_Audit_And_Fit - 390 px audit of the TS build, fix overflow/clipped controls; S; none.
2. Slimeworld_New_Campaign_Menu_And_Status - menu-level New Campaign, status to `beta`, fix stale GDD; S; none (status needs Robert's OK).
3. Slimeworld_Headless_Balance_Test - 200-cycle baseline run asserting no softlock/negative Biomass, unlock reachable; M; none.
## Open question for Robert
Set slimeworld to `beta` until Tier B evidence exists? Recommended default: yes (the badge is public and the standard says only shoal is stable); flip back after directive 3 and a phone pass.
