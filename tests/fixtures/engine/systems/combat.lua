-- engine/systems/combat.lua
-- Combat resolution system for part-based arena fighters.
-- Used by: BattleBots (Phase 3+)
-- Not used by: horse_racing, slither_rogue
--
-- Function contracts follow ADR-007 naming conventions:
--   resolve_* → contested outcome determination
--   apply_*   → post-resolution state change
--   detect_*  → collision / contact detection

-- ============================================================
-- DAMAGE CALCULATION
-- ============================================================

-- Calculate raw damage from an attack.
-- attacker: { attack_power, weapon_type, reach }
-- defender: { armor, defense_rating }
-- Returns: { raw_damage, blocked, penetrated }
function calculate_damage(attacker, defender)
  -- Stub — implement when BattleBots is ported
  error("calculate_damage: not implemented for this game")
end

-- Apply damage to a bot part.
-- part: { id, name, health, max_health, armor, is_destroyed }
-- damage: number
-- Returns: updated_part (pure — does not mutate input)
function apply_damage(part, damage)
  -- Stub — implement when BattleBots is ported
  error("apply_damage: not implemented for this game")
end

-- ============================================================
-- HIT RESOLUTION
-- ============================================================

-- Determine if an attack connects, given speed and accuracy.
-- attacker: { accuracy, speed }
-- defender: { agility, speed }
-- seed: RNG seed (from runtime)
-- Returns: { hit=bool, glancing=bool }
function resolve_hit(attacker, defender, seed)
  -- Stub — implement when BattleBots is ported
  error("resolve_hit: not implemented for this game")
end

-- ============================================================
-- FIGHT SIMULATION
-- ============================================================

-- Simulate a complete fight between two bots.
-- bot_a, bot_b: full bot tables with parts and stats
-- config: fight config (arena type, time limit)
-- Returns: { winner_id, rounds, damage_log[], bot_a_final, bot_b_final }
-- This is the BattleBots equivalent of simulate_race.
-- TypeScript renders the damage_log as a cinematic sequence.
function simulate_fight(bot_a, bot_b, config)
  -- Stub — implement when BattleBots is ported
  error("simulate_fight: not implemented for this game")
end

-- ============================================================
-- PART DURABILITY
-- ============================================================

-- Check if a part is destroyed (health at or below zero).
-- part: { health }
-- Returns: bool
function is_part_destroyed(part)
  return (part.health or 0) <= 0
end

-- Calculate overall bot effectiveness from part states.
-- Parts that are destroyed reduce effectiveness proportionally.
-- bot: { parts: [] }
-- Returns: float 0.0 to 1.0
function calculate_bot_effectiveness(bot)
  if not bot.parts or #bot.parts == 0 then return 0.0 end
  local total, alive = 0, 0
  for _, part in ipairs(bot.parts) do
    total = total + 1
    if not is_part_destroyed(part) then alive = alive + 1 end
  end
  return alive / total
end
