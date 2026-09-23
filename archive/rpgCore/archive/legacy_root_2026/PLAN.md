# Implementation Plan: Session 015 - Balance and Tier Integration

## Technical Approach

### 1. Three-Tier War System Architecture
The game loop consists of three interconnected simulation tiers:
1. **Strategic Tier (`overworld.py`)**: A static node map where the player plots their macro-campaign. Each node (Region) is contested, red, or blue. Clicking a node initiates an invasion. Features global win/loss tracking.
2. **Operational Tier (`battle_field.py`)**: A mid-level skirmish map. Players maneuver a single Squad Token (representing Rex, Brom, and Pip) across a grid towards the enemy base, while the enemy Token hunts them or defends. Terrain obstacles block movement. When tokens collide, tactical combat ensues.
3. **Tactical Tier (`auto_battle.py`)**: The final 3v3 auto-battler resolving the conflict using specific player squad characters against a specialized red squad. Winner eliminates the loser's token from the operational tier.

### 2. Session 015 Objectives

**A. Battle Balance (`auto_battle.py`)**
- **Player Bias**: The core trio (`Rex`, `Brom`, `Pip`) receives a permanent +25% base stat multiplier (HP, Attack, Defense, Speed).
- **SHIELD Taunt Redirection**: `SWORD` logic must prioritize enemies with `taunt_active=True`.
- **STAFF Heal Scaling**: Change standard heal amount to scale with the target's missing HP percentage.

**B. Difficulty Scaling (`overworld.py`)**
- Implement an Easy/Normal/Hard scaling configuration.
- Pass `--difficulty` from the overworld down through `battle_field.py` to `auto_battle.py`.
- Enemy squads scale -20% / 0% / +20% based on difficulty.

**C. Tier Integration (`battle_field.py`)**
- Create `src/apps/slime_clan/battle_field.py` using `territorial_grid.py` rendering as a base (640x480, dark theme, obstacles).
- Implement Squad Tokens (slime sprite with squad count '3').
- Blue spawns top-left, Red spawns bottom-right.
- Goal: Reach the opposing starting corner.
- Movement: Turn-based. Player uses arrow keys to set direction, Red uses pathfinding.
- Collision: Adjacent tokens pause movement and trigger `auto_battle.py` as a subprocess.
- Return exit codes to `overworld.py` to finalize node state.

### 3. Tests
- Update `tests/unit/slime_clan_autobattle_test.py` to cover taunt and scaled healing.
- Add `tests/unit/battle_field_test.py` to cover grid movement and collision rules.
- Maintain the 7 existing tests in the `slime_clan_*.py` suite.

## Verification Plan
1. Run `uv run pytest` to ensure all 8+ unit tests pass.
2. Run `python run_overworld.py`.
3. Verify clicking a node opens `battle_field.py`.
4. Verify moving tokens adjacent triggers `auto_battle.py`.
5. Verify auto-battle result enforces token removal and field win/loss correctly updates Overworld.
