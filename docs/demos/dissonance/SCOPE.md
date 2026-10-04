# dissonance scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: turn-based deckbuilding roguelike, 5-floor descent through a station AI, Culture combinations and Build Archetype synergies (ts/src/games/dissonance/config.ts:7). Successor of the AI Studio prototype (dissonance_prototype/config.ts:3-7). Points at a complete short run with card unlocks.
Working:
- Full phase flow: title, opening, floor choice, map, combat, rewards, store, rest, treasure, anomaly, run end (ts/src/games/dissonance/phases/*.tsx; App.tsx:237-286).
- Win/lose end screen with stats (phases/RunEndPhase.tsx:12-30); saved run cleared on end (App.tsx:48-53); unlocked cards persisted (App.tsx:44-46).
- Live: 0 console errors, "New Run" present (docs/state/demo-audit-batch1-2026-10-03.md:33); build:dissonance exists (ts/package.json:9); tests cover shared UI, zero-regression, recovery manifest, art equivalence (ts/tests/test_dissonance_*).
Rough:
- Rules run in Lua through useLuaCall (App.tsx:3,34); the studio is TS-native, so new rules either land in Lua or force a migration decision.
- Run end only returns to title, no direct "New Run" there (RunEndPhase.tsx:28-29).
- Manifest screenshot (A5) not verified for any demo (audit batch1 caveats).
Class: refine - audit passes A1/A3/A4/A5 (batch1:33); remaining work is polish and depth checks, not new direction.
Top 3 changes, in order: 1. Verify the A5 manifest screenshot and phone fit of the map and combat phases. 2. Add "New Run" on the end screen. 3. Add a run smoke test (title, one combat turn, run end).
Out of scope: new cards/cultures/floors, balance, art generator changes, Lua-to-TS rewrite, the prototype Origin entry.
Dependencies / risks: shared artGen and UI components (ts/src/ui/components); the Lua rules files were not read in this pass.
Effort: S
Open question for Robert: none
