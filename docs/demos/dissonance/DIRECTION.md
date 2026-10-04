# dissonance direction (2026-10-04)
## What it tried to be
"Dissonance Depths": a turn-based deckbuilding roguelike where cards combine by element relation (ember/ash/spark/cinder x sever/mend/guard/unmake, 56 named combinations) over a 5-floor descent through a fracturing station AI (config.ts:7; games/dissonance/data.yaml, 50569c27). It started as the AI Studio core-loop prototype (examples/dissonance-prototype), was rebuilt as YAML+Lua logic with a TS UI on 2026-07-22 (6aaabbd2, 52ca6a55; a placeholder App.tsx was removed in 2be99cf6 to show an honest "No Renderer"), then absorbed Brewfield's chemistry (residues, 4x4 matrix) on 2026-09-20 (games/dissonance/CHANGELOG.md). Drift: depth grew twice (build archetypes, then chemistry) while the player-facing frame stayed a wizard of 12 one-screen phases.
## Where it is now
- Playable loop: yes. Title with Continue/New Run, opening pack reveal, floor choice, deck build, map, combat, reward, rest, treasure, store, anomaly, run end (ts/src/games/dissonance/App.tsx:229-278).
- Tier A closed on 10-04: run-end New Run and two-click Abandon (17b68b14, PR #86, test_dissonance_run_controls.ts); the SCOPE.md "return to title only" finding is stale.
- Persistence is the best in this group: run save + unlocked cards (App.tsx:21,45), cleared on victory/game over.
- Size: 2,274 TS lines (12 phase files, 40-180 lines each); logic is 2,638 Lua lines (run_state.lua 1,494, combat.lua 573); 106 generated SVG cards; 5 test files plus the new run-controls test.
- Missing: no sound or mute (grep of App.tsx and phases/ finds none); no headless bot run, so softlock or negative-gold regressions are untested.
- Jargon reaches the UI ("ECHO Core Initialization - First Pack Reveal", phases/OpeningPhase.tsx): dev-speak risk under the redesign's banned-word test.
## Player experience today vs the target
First 60 s: the title has a pitch and a hook line ("Please piece me back together, every floor costs us something.", TitlePhase.tsx), then a first-pack reveal, then floor choice. The combination rule must be learned from card text; no tutorial hook found. Feedback is per turn; progress is floors plus unlocked cards; way back is Abandon run and the arcade link.
Best moment: the first pack flip with named cards, then a combination landing a status residue on the enemy.
Biggest turn-off: silence and no first-fight guidance; the combine rule is the whole game and nothing teaches it.
## Verdict
POLISH (Tier C showcase, settled pick).
1. Loop, saves and Tier A are complete; what is missing is teaching and feel, not content.
2. The biggest risk is untested Lua balance, not missing features.
3. Adding cards or floors before a bot test and a tutorial would deepen the hardest-to-read part.
## Replan
1. Bot test (S): ADD headless Lua-session run, N floors, no softlock or negative HP/gold, win and loss reachable. CUT nothing. Verify: `cd ts && npx vitest run tests/test_dissonance_bot_run.ts` (zero_regression must stay green).
2. First-fight teaching (M): ADD a one-hint overlay on the first combat ("pick cards; their relation sets the result") using the shared OnboardingGate. CUT the "ECHO Core Initialization" caption (jargon; fails the banned-words test). Verify: cold-load Playwright reaches a first played card within 60 s.
3. Sound (S): ADD mute + SFX via engine/shared/sfx (as succession does) for play, hit, reward. Verify: mute persisted across reload (B5).
4. Trim (S, only if the 60 s check still fails after phase 2): CUT opening/floorChoice/deckBuild screens into fewer steps; one reason: each extra screen before the first card is a drop-off.
Do not do: new cards/cultures/floors; moving logic out of Lua (the settled hedge is YAML data).
## First three directives
1. Dissonance headless bot run test - S - none.
2. Dissonance first-combat hint and remove dev captions - M - none.
3. Dissonance mute + SFX - S - shared SFX module (Polish_Shared_Sfx).
## Open question for Robert
None.
