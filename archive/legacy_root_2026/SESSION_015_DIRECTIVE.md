# Session 015 Directive

**Initialize Session 015 — Balance and Tier Integration.**

1. **Battle Balance:** 
   * Increase player squad base stats by +25% across Rex, Brom, and Pip. 
   * SHIELD taunt must actively redirect SWORD targeting — if a SHIELD unit has taunted, enemy SWORD units must target it preferentially over lower-HP units. 
   * STAFF heal amount should scale with missing HP, not a flat value. 
   * Add a difficulty setting to the overworld: Easy/Normal/Hard adjusting enemy stats by -20%/0%/+20%.

2. **Operational Tier (Squad Collision):** 
   * Build `battle_field.py` — a new scene using the `territorial_grid.py` tile rendering as foundation. 640x480, same dark theme, same tile size.
   * Each side has one Squad Token — a single tile-sized slime sprite with a number '3' indicating squad size. Blue squad spawns top-left, Red squad spawns bottom-right.
   * Player controls Blue squad direction with arrow keys. Red squad uses simple pathfinding toward Blue. Squads move one tile per turn automatically.
   * Obstacles from `generate_obstacles()` block movement as before.
   * When Blue and Red tokens occupy adjacent tiles, pause movement and launch `auto_battle.py` as a sub-scene. Battle resolves, winner's token remains, loser's token is removed.
   * Blue reaches Red's starting corner = Blue wins the field. Red reaches Blue's starting corner = Red wins.
   * Field result returns to overworld and flips the node.
   * Keep `territorial_grid.py` untouched — it becomes a separate conquest mode accessible later.

3. **Maintenance:**
   * `run_overworld.py` remains single entry point: Overworld → Battle Field → Auto-Battle → back up the chain.
   * All 7 slime_clan tests must still pass. 
   * Add tests for squad movement logic and collision detection.
   * Update `PLAN.md` with the three-tier war system description.
