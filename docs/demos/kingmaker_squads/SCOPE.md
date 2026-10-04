# kingmaker_squads scope analysis (2026-10-03, Sonnet scope agent, registry status: external, Origin of planetofgreed)
Direction: preserved origin of Planet of Greed's wheel/culture design, shown as history, not a competing game (ts/src/games/kingmaker_squads/config.ts:3-7, supersededBy at :12). A finished tactical-squad campaign: New Game screen, shop/forces/territory phases, victory and game-over screens (examples/kingmaker-squads/src/App.tsx:314-319, screens/NewGameScreen.tsx:60).
Working:
- Live: loads, 0 console errors; in-frame "Start New Campaign" (docs/state/demo-audit-batch1-2026-10-03.md:41).
- Restart exists in play (components/HeaderBar.tsx:213-215 "Restart Campaign"); save/continue via localStorage (App.tsx:34,81).
- Real tests: utils/gameLogic.test.ts (2089 lines) and cityGeneration.test.ts; docs/state/current.md claims 149 passed (a claim, not re-run here).
Rough:
- No Restart at the start screen (audit batch1:41, A3 fail).
- Stale note: ts/src/games/kingmaker_squads/README.md:1-4 says "Retired ... Not in the live game registry" but registry.ts:35,89 registers it as an Origin entry.
- Blurb leaks a repo path "(ts/src/games/planetofgreed/)" (config.ts:13; audit batch1 finding 8).
Class: refine - Origin entry, Tier A only (polish standard rule 1); the game itself is complete.
Top 3 changes, in order: 1. Blurb: drop the repo path, keep the "superseded by Planet of Greed" sentence. 2. Make the existing restart reachable from the start screen (or record that New Campaign counts for A3). 3. Fix or delete the stale README.md.
Out of scope: new mechanics, balance, art, any Planet of Greed changes, TS-native rewrite, Gemini features (README.md in the example only has the generic AI Studio key setup).
Dependencies / risks: source dir examples/kingmaker-squads is gitignored (.gitignore:193, 0 tracked files) and exists only in the live checkout, so a Devin worktree cannot see it unless it is force-added; intake/kingmaker-squads/MANIFEST.md:11 warns vite.config lacks `base`.
Effort: S
Open question for Robert: none
