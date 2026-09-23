> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Drift Code Pruning Report
==================================================

## Summary
- High severity (prune candidates): 2
- Medium severity: 3
- Low severity: 2

## HIGH SEVERITY - Immediate Prune Required

### C:\Github\rpgCore\run_game.py
**Status**: PRUNE CANDIDATE
**Reason**: Legacy terminal-only code

### C:\Github\rpgCore\src\game_loop.py
**Status**: PRUNE CANDIDATE
**Reason**: Legacy terminal-only code

## MEDIUM SEVERITY - Review Required

### C:\Github\rpgCore\DGT_Launcher.py
**Violations**: 10
- Line 307: dual_logic - `mode == "terminal`
- Line 361: dual_logic - `mode == "terminal`
- Line 178: dual_logic - `Terminal Mode`
- Line 199: dual_logic - `terminal_mode`
- Line 201: dual_logic - `terminal mode`
- Line 206: dual_logic - `terminal mode`
- Line 214: dual_logic - `Terminal mode`
- Line 217: dual_logic - `Terminal mode`
- Line 308: dual_logic - `terminal_mode`
- Line 362: dual_logic - `terminal_mode`

### C:\Github\rpgCore\run_unified_simulator.py
**Violations**: 11
- Line 6: terminal_rpg - `terminal_rpg.py`
- Line 6: terminal_rpg - `run_game.py and any terminal`
- Line 68: terminal_rpg - `Run terminal`
- Line 109: terminal_rpg - `run_unified_simulator.py                    # Terminal`
- Line 71: dual_logic - `mode == ViewMode.TERMINAL`
- Line 30: dual_logic - `view_mode: ViewMode = ViewMode.TERMINAL`
- Line 42: dual_logic - `view_mode in [ViewMode.TERMINAL`
- Line 71: dual_logic - `view_mode == ViewMode.TERMINAL`
- Line 42: dual_logic - `TERMINAL, ViewMode`
- Line 109: dual_logic - `Terminal mode`
- Line 159: dual_logic - `terminal": ViewMode`

### C:\Github\rpgCore\tools\prune_drift.py
**Violations**: 14
- Line 52: terminal_rpg - `terminal_rpg.py`
- Line 28: terminal_rpg - `class.*Terminal.*Game`
- Line 29: terminal_rpg - `def.*terminal.*game`
- Line 30: terminal_rpg - `run.*terminal`
- Line 33: dual_logic - `if.*terminal.*else.*gui`
- Line 34: dual_logic - `mode.*==.*terminal`
- Line 35: dual_logic - `view_mode.*terminal`
- Line 36: dual_logic - `terminal.*mode`
- Line 39: separate_state - `game_state.*terminal`
- Line 40: separate_state - `terminal.*state`
- Line 41: separate_state - `GameState.*terminal`
- Line 44: redundant_engines - `SemanticResolver.*terminal`
- Line 45: redundant_engines - `Arbiter.*terminal`
- Line 46: redundant_engines - `Chronicler.*terminal`

## LOW SEVERITY - Minor Issues

### C:\Github\rpgCore\generate_final_manifest.py
**Violations**: 1
- Line 191: dual_logic

### C:\Github\rpgCore\src\views\terminal_view.py
**Violations**: 1
- Line 165: terminal_rpg
