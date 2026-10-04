# slimebreeder direction (2026-10-04)
## What it tried to be
A standalone offline idle breeding PWA for a Moto G (React 19 + Zustand + Dexie), built 2026-04-10..11 in sibling repo SlimeBreeder (first commit `ec8738b`, scaffold; `5fc00b7` core loop; `7cd3b72` economy spec, 55 commits total). Four tabs: CHAMBER (30 s incubation, display rooms), MUTATE (breeding), CODEX (12 colors x 11 shapes), MARKET (wanderer contracts) (SlimeBreeder docs/DIRECTION.md:5-35). Intent drifted twice: its own repo kept planning a long economy roadmap (docs/ROADMAP.md M1 caps/gates, status draft, approved ""), while the studio decided it is an Origin of SlimeWorld (`supersededBy`, config.ts:3-8, ADR-023). Studio archived the source (`ee207f4b`, 2026-09-22), audited absorption (docs/analysis/slimebreeder-absorption.md: 10 absorbed / 4 port / 1 data / 8 drop) and ported the 4 items (`44522310` regents, `b5e457d0` decline, `ab3a95ad` tier pricing, `0d7753a2` worker income).
## Where it is now
- Playable 4-tab loop; Dexie schema v5; 5 vitest files (breedSlimes, economics, gameStore, slimeGenerator, SlimeVisual).
- Size: 3,059 lines TS/TSX in `archive/slimebreeder/src` (23 components); live copy is served from the sibling repo, not from this tree.
- Missing: any Reset/New Game (no match for reset/restart in src; audit batch2 row 22); README is the Vite template.
- Economy spec (caps, hatch costs, pattern/accessory slots) is unimplemented and, per the settled decision, stays so.
- Blurb leaks a repo path `(ts/src/games/slimeworld/)` (config.ts:12); Polish_Slimebreeder_TierA_Directive is already Approved (`f51be610`).
- No `build:slimebreeder` and none wanted (external demos are exempt from A6/A7 where the source lives elsewhere).
## Player experience today vs the target
First 60 s: the CHAMBER tab shows a hatch button and a 30 s timer, so a first action exists; feedback is the timer bar and gold counter. Best moment: the first CODEX discovery, which pays Regents and unlocks the next trait tier. Biggest turn-off: no way to start over and no hint it is a museum piece (the card says Origin, the game does not), so a player may sink an hour into a build that is frozen. Way back: shell back control only.
## Verdict
POLISH (Tier A only, then freeze).
1. Settled: frozen Origin exhibit merged into SlimeWorld; the features worth keeping already live there.
2. Only A3 (reset) and A5 (blurb) fail; both are small and already queued.
3. Every roadmap item past Tier A competes with SlimeWorld for the same player; none is solo-scale.
## Replan
- Phase 1 (S): finish Tier A. CUT the repo path from the blurb (leaks dev detail). ADD Reset/New Game with a 2-click confirm and an "Origin of SlimeWorld, play it here" link in the header. Verify: `cd ts && npx vitest run` blurb test, plus a Playwright click on Reset returns to the first screen.
- Phase 2 (S): freeze. CUT the sibling ROADMAP.md M1-M3 by marking the repo's DIRECTION/ROADMAP "frozen exhibit; see RFDGameStudio docs/demos/slimebreeder/DIRECTION.md" (stops Devin picking it up again, `8c008e9` already superseded one auto-directive). ADD a real README (3 lines). Verify: `git grep -n "frozen exhibit"` in SlimeBreeder.
## First three directives
1. Polish_Slimebreeder_TierA_Directive (exists, Approved) - blurb honesty + Reset control; S; none.
2. SlimeBreeder_Freeze_Docs - mark sibling DIRECTION/ROADMAP frozen, replace Vite README; S; after 1 (sibling repo, so Claude/Robert, not a worktree-only run).
3. Slimebreeder_Screenshot_Cover - one cover/screenshot in the arcade manifest (A5); S; after 1.
## Open question for Robert
None. (Contradiction noted: SlimeBreeder's own ROADMAP still says "active"; recommended default is to mark it frozen, per the settled decision.)
