# gladiator_arena scope analysis (2026-10-03, Sonnet scope agent, status `dev`)
Direction: manager-driven roster + forge + 5-tier ladder with auto-resolved turn-based bouts; points at a deeper management sim (ts/src/games/gladiator_arena/config.ts:7; title pitch "you never swing the sword, you decide what it's attached to" App.tsx:104; tabs Roster/Forge/Medbay/Ladder/Balance App.tsx:43).
Working:
- Persisted save plus in-game reset with 2-click confirm (context/GameContext.tsx:90,124; App.tsx:260-270).
- Title screen with first-run primer gated on no save (App.tsx:57,72,112-122).
- Real engines: combat 538 lines, ladder 361, forge economy 184, plus a Balance tab/harness (wc -l; App.tsx:222).
Rough:
- No Restart/New Game on the start screen; only a small icon reset button in-game (audit batch1 row gladiator_arena; App.tsx:260).
- One test file, and it asserts source text (`toContain('title="Gladiator Arena"')`), not combat logic (ts/tests/test_gladiator_shell_opening.ts:9-17,57).
- Phone: tab bar scrolls inside a 210 px frame (audit batch1 row). No `build:gladiator_arena` script (grep of ts/package.json: none).
Class: improve. Shell, economy and ladder exist and point one way; the gaps are verification and finish, not direction.
Top 3 changes, in order: 1. Tier A: Restart/New Game on title, `build:gladiator_arena`, phone tab-bar fit. 2. Headless vitest bout/ladder run (no softlock, no negative gold, tier 5 reachable) using the existing balanceHarness. 3. Clear feedback and win/loss next action in ArenaCombatView (B3, B6; not read in depth).
Out of scope: new parts/tiers, new combat rules, art overhaul, multiplayer, itch/devlog.
Dependencies / risks: shared engine/shared/anatomy and persistence modules (combatEngine.ts:11-18; GameContext.tsx:14); ArenaCombatView (851 lines) and BalanceReportView (744) not read in full.
Effort: M
Open question for Robert: none

## Update 2026-10-04
Stale above: the Tier A items (a New Game control with a 2-click confirm, the phone tab-bar fit, `build:gladiator_arena` and a seeded career-simulation test) landed in commit `75a90e01`. The current plan is `DIRECTION.md`.
