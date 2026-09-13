# Project Specification: Session 013 - Auto-Battle Scene

## Directive Summary
Initialize Session 013 — Auto-Battle Scene. Build `src/apps/slime_clan/auto_battle.py` as a new standalone module to handle 3v3 auto-battles between slime squads.

## Technical Requirements
1. **Data Model**:
   - Define `SlimeUnit` dataclass with fields: `name`, `shape` (enum: `CIRCLE`, `SQUARE`, `TRIANGLE`), `hat` (enum: `SWORD`, `SHIELD`, `STAFF`), `hp`, `max_hp`, `attack`, `defense`, `speed`.
   - `Shape` modifies base stats at creation — `SQUARE` gets `+defense -speed`, `TRIANGLE` gets `+speed -defense`, `CIRCLE` is balanced.
   - `Hat` defines role — `SWORD` is attacker, `SHIELD` is defender, `STAFF` is utility/healer.
2. **Squads**: Two squads: player squad (Blue, left side) and enemy squad (Red, right side). 3 units each to start (hard-coded test squads for this session).
3. **Visual Layout**: Simple side-view at 640x480. Blue squad on the left third, Red squad on the right third, middle third is the action zone. Reuse `draw_slime` from `territorial_grid.py`. Show HP bars beneath each slime.
4. **Auto-Battle Loop**:
   - Each tick, the fastest unit acts first in sequence.
   - `SWORD` units attack lowest-HP enemy. Include basic damage formula `max(1, attack - defense)`.
   - `SHIELD` units taunt (increase their own defense temporarily).
   - `STAFF` units heal lowest-HP ally.
   - Units that reach 0 HP fade out visually or are removed.
5. **Pacing**: Battle runs automatically at a readable pace — one action every 800ms. Player watches, cannot intervene.
6. **Victory state**: Winner banner when one squad is eliminated. ESC returns out of the loop.
7. **Launcher**: New launcher `run_auto_battle.py` at repo root for isolated testing.
8. **Testing**: All 79+ existing tests must still pass. Add tests for `SlimeUnit` stat generation, speed-based turn order, and battle resolution logic.

## Constraints
- Do not modify `territorial_grid.py` except to expose `draw_slime` if needed.
- `subprocess.run` limitation from Session 012 continues; tests will run isolated via `run_auto_battle.py`.
