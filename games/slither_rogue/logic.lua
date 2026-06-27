-- Slither Rogue — Full Game Logic (Phase 2h)
-- Architecture: GAME_STATE global persists in Lua VM between tick_game calls.
-- TypeScript calls init_game once, then tick_game(dt, input) every frame.
-- TypeScript is a pure renderer — no game logic.

-- ============================================================
-- EVOLUTION SYSTEM
-- ============================================================

-- Calculate all active evolution effect values from an activeEvolutions table.
-- activeEvolutions: { speed=N, magnet=N, shield=N, wide=N, sense=N, ghost=N, regen=N, venom=N }
-- Returns: { speed_multiplier, magnetism_radius, shield_charges, wide_body_add,
--            fruit_sense_range, ghost_tail_count, tail_growth_level, venom_trail_level }
function calculate_evolution_effects(active, cards_config)
  local effects = {
    speed_multiplier  = 1.0,
    magnetism_radius  = 0,
    shield_charges    = 0,
    wide_body_add     = 0,
    fruit_sense_range = 0,
    ghost_tail_count  = 0,
    tail_growth_level = 0,
    venom_trail_level = 0,
  }

  for _, card in ipairs(cards_config) do
    local level = active[card.id] or 0
    if level > 0 then
      local key       = card.effect_key
      local per_level = card.effect_per_level
      if key == "speed_multiplier" then
        effects.speed_multiplier = effects.speed_multiplier + (level * per_level)
      elseif key == "magnetism_radius" then
        effects.magnetism_radius = level * per_level
      elseif key == "shield_charges" then
        effects.shield_charges = level * per_level
      elseif key == "wide_body_add" then
        effects.wide_body_add = level * per_level
      elseif key == "fruit_sense_range" then
        effects.fruit_sense_range = level * per_level
      elseif key == "ghost_tail_count" then
        effects.ghost_tail_count = level * per_level
      elseif key == "tail_growth_level" then
        effects.tail_growth_level = level * per_level
      elseif key == "venom_trail_level" then
        effects.venom_trail_level = level * per_level
      end
    end
  end

  return effects
end

-- Check whether eating a fruit triggers an evolution choice.
-- fruits_eaten_since_evolution: running counter since last evolution
-- threshold: from data.yaml evolution.fruits_per_level
-- Returns: true if evolution should trigger, false otherwise
function check_evolution_trigger(fruits_eaten_since_evolution, threshold)
  return fruits_eaten_since_evolution + 1 >= threshold
end

-- Select N random evolution cards from the full card pool.
-- all_cards: array of card tables from data.yaml evolution_cards
-- count: number of cards to select (typically 3)
-- Returns: array of selected card tables (shuffled slice)
function select_evolution_pool(all_cards, count)
  local pool = {}
  for _, card in ipairs(all_cards) do
    table.insert(pool, card)
  end
  -- Fisher-Yates shuffle
  for i = #pool, 2, -1 do
    local j = math.random(1, i)
    pool[i], pool[j] = pool[j], pool[i]
  end
  local selected = {}
  for i = 1, math.min(count, #pool) do
    table.insert(selected, pool[i])
  end
  return selected
end

-- ============================================================
-- SPAWN SYSTEM
-- ============================================================

-- Generate a fruit spawn configuration.
-- fruit_config: from data.yaml fruit block
-- arena: from data.yaml arena block
-- Returns: { x, y, color, points, is_golden }
function spawn_fruit(fruit_config, arena)
  local is_golden = math.random() < (fruit_config.golden_chance or 0.08)
  local color
  if is_golden then
    color = fruit_config.golden_color or "#fbbf24"
  else
    local colors = fruit_config.colors
    color = colors[math.random(#colors)]
  end
  return {
    x         = math.random() * (arena.map_width  - 120) + 60,
    y         = math.random() * (arena.map_height - 120) + 60,
    color     = color,
    points    = is_golden and (fruit_config.golden_points or 3) or (fruit_config.standard_points or 1),
    is_golden = is_golden,
  }
end

-- Generate an NPC snake configuration.
-- npc_profiles: array from data.yaml npc_profiles
-- npc_stats: from data.yaml npc_stats
-- arena: from data.yaml arena
-- index: NPC index (0-based, for profile cycling)
-- Returns: NPC init table { name, color, head_color, x, y, angle, speed, radius, initial_length }
function generate_npc(npc_profiles, npc_stats, arena, index)
  local profile = npc_profiles[(index % #npc_profiles) + 1]
  local radius  = npc_stats.min_radius + math.random() * (npc_stats.max_radius - npc_stats.min_radius)
  local speed   = npc_stats.min_speed  + math.random() * (npc_stats.max_speed  - npc_stats.min_speed)
  local length  = npc_stats.min_initial_length +
                  math.floor(math.random() * (npc_stats.max_initial_length - npc_stats.min_initial_length))
  return {
    name           = profile.name .. " " .. tostring(index + 1),
    color          = profile.color,
    head_color     = profile.head_color,
    x              = math.random() * (arena.map_width  - 200) + 100,
    y              = math.random() * (arena.map_height - 200) + 100,
    angle          = math.random() * math.pi * 2,
    speed          = speed,
    radius         = radius,
    initial_length = length,
  }
end

-- ============================================================
-- NPC AI
-- ============================================================

-- Decide an NPC's next target angle based on nearby fruits and wall proximity.
-- npc_head: { x, y }
-- npc_angle: current angle in radians
-- nearby_fruits: array of { x, y } within sight range (filtered by TypeScript)
-- arena: data.yaml arena block
-- Returns: target_angle (radians)
function decide_npc_action(npc_head, npc_angle, nearby_fruits, arena)
  local wall_buffer = arena.wall_buffer or 120

  -- Wall avoidance takes priority
  if npc_head.x < wall_buffer then
    return 0
  elseif npc_head.x > arena.map_width - wall_buffer then
    return math.pi
  elseif npc_head.y < wall_buffer then
    return math.pi / 2
  elseif npc_head.y > arena.map_height - wall_buffer then
    return -math.pi / 2
  end

  -- Hunt nearest fruit
  if nearby_fruits and #nearby_fruits > 0 then
    local nearest  = nearby_fruits[1]
    local min_dist = math.huge
    for _, fruit in ipairs(nearby_fruits) do
      local dx = fruit.x - npc_head.x
      local dy = fruit.y - npc_head.y
      local d  = math.sqrt(dx * dx + dy * dy)
      if d < min_dist then
        min_dist = d
        nearest  = fruit
      end
    end
    return math.atan2(nearest.y - npc_head.y, nearest.x - npc_head.x)
  end

  -- Wander
  return npc_angle + (math.random() * 1.2 - 0.6)
end

-- ============================================================
-- SCORING
-- ============================================================

-- Calculate a performance grade from the player's final score.
-- score: fruits eaten total
-- grade_thresholds: from data.yaml grade_thresholds (sorted desc by min_score)
-- Returns: { title, description }
function calculate_grade(score, grade_thresholds)
  for _, threshold in ipairs(grade_thresholds) do
    if score >= threshold.min_score then
      return { title = threshold.title, description = threshold.description }
    end
  end
  local last = grade_thresholds[#grade_thresholds]
  return { title = last.title, description = last.description }
end
