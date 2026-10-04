# planetofgreed direction (2026-10-04)

## What it tried to be
The live, TS-native successor to CorpWorld and Kingmaker Squads: a territory 4X where you run one of six culture Houses on a wheel, fight with Circle/Square/Triangle combat, collect fragments, and reach Rank 1 to trigger an ending (docs/gdd/PlanetOfGreed_Design_v0.2.md:119-185). First code 2026-08-13 (5e7d12fc: 7 files promoted from CorpWorld to shared engine). The design is a chapter: Rank 1 forms the Seed Engine black hole and hands off to "Chapter 2 (Facility Escape)" (GDD:127-131), and Facility Escape is already an arcade demo. Intent has not drifted; the work since is systems (house stats, wheel-aware AI, style split 2026-09-26/29, CHANGELOG.md) while the ending content stayed a placeholder (endingSystem.ts:12-15).

## Where it is now
- Playable loop: title, New Campaign, opening sequence, culture pick, guided per-region weekly orders with pre-filled defaults (GuidedWalkthrough.tsx 503 lines), combat replay, Annual Report, Rank-1 ending check (App.tsx:1139-1156). Not played by me; audit batch2:18 says loads clean.
- 4,911 lines in `ts/src/games/planetofgreed`; 11 vitest files (`ls ts/tests | grep -c planetofgreed`) plus Playwright e2e (tests/e2e/test_planetofgreed_e2e.py, _v2).
- `App.tsx` is a 1,928-line monolith holding the whole turn engine (advanceDay around line 900-1180 and a second copy of the annual logic at ~1421). That conflicts with the SRP hard rule.
- Tier A already landed: d0c37314 (2026-10-04) fixed the CorpWorld dossier text, ROADMAP now says "No deferred items", and a guard test pins the `corpworld_state` save key.
- Ending is a payload `{fragmentCount, total}` and a minimal placeholder; no narration, no next action.
- Shared chrome (BoardroomHeader, FactionTheme) is used by other games; touch with care.

## Player experience today vs the target
First 60 s: New Campaign, opening sequence, then a House pick and one-click confirmed default orders per region. That default-first flow is the best player moment in this group: it turns a dense 4X into "confirm, confirm, authorize". Biggest turn-off: the win. You can reach Rank 1 and get a placeholder with no celebration, no summary and no way to continue or go back; a long campaign ends in a dead end. Unverified: how long a campaign takes (no year/turn cap found by grep).

## Verdict
POLISH. 1) Shipped, tested, honest, the strongest game of the eight. 2) The only real gap is the ending and a measured session length. 3) Structure debt (1,928-line App.tsx) is a risk to every later change and the SRP rule asks for it.

## Replan
1. Prove it ends. Goal: a headless AI-vs-AI campaign reaches a result without softlock (B4). CUT: nothing. ADD: vitest that plays N years and asserts no negative resource, ending reachable or campaign over, and prints the week count. Size S. Verify: `cd ts && npx vitest run tests/test_planetofgreed_*`.
2. A real ending screen. CUT: the placeholder text. ADD: one screen: your House, Rank, fragments x/6, "Play again" and "Continue to Facility Escape" (the GDD chapter link). Size S. Verify: new vitest on the pure ending-view-model plus a screenshot.
3. Split the monolith. CUT: duplicated annual logic (reason: two copies drift). ADD: `turnEngine.ts` (pure advance), `campaignState.ts`; App.tsx keeps rendering. Size M. Verify: same pass count in all planetofgreed tests, `npx tsc --noEmit`.
4. Phone pass: GuidedWalkthrough at 390x844, A4 (audit lists screenshot "n/v"). Size S, controller browser step.

## First three directives
1. Planet of Greed headless campaign soak test (softlock, resources, length). S. depends-on: none.
2. Planet of Greed ending screen with Play again and Facility Escape link. S. depends-on: none.
3. Extract turn engine from App.tsx (pure module, no behaviour change). M. depends-on: 1.

## Open question for Robert
None. Note: capping at Tier B matches the polish rule; Planet of Greed is not in the settled Tier C picks, and I did not propose adding it.
