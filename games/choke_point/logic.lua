-- games/choke_point/logic.lua
-- Core game loop and path-preview calculations for Choke Point.
-- Follows pure state transformation principles.

local function copy_table(t)
  if type(t) ~= "table" then return t end
  local c = {}
  for k, v in pairs(t) do
    if type(v) == "table" then
      c[k] = copy_table(v)
    else
      c[k] = v
    end
  end
  return c
end

local function get_tower_at(towers, x, y)
  for _, t in ipairs(collect(towers)) do
    if t.x == x and t.y == y then
      return t
    end
  end
  return nil
end

-- Re-calculate next-turn previews for all active enemies
local function calculate_previews(data, state)
  local next_state = copy_table(state)
  local enemies = collect(next_state.enemies or {})
  local towers = collect(next_state.towers or {})
  
  local core_x = data.constants.core_x or 1
  local core_y = data.constants.core_y or 3
  
  for _, enemy in ipairs(enemies) do
    local tx = enemy.x - 1
    local ty = enemy.y
    
    if tx == core_x and ty == core_y then
      -- Preview attack on Core
      enemy.preview_x = enemy.x
      enemy.preview_y = enemy.y
      enemy.preview_attack_target = "core"
    else
      local b_tower = get_tower_at(towers, tx, ty)
      if b_tower ~= nil then
        -- Preview attack on Tower
        enemy.preview_x = enemy.x
        enemy.preview_y = enemy.y
        enemy.preview_attack_target = { x = tx, y = ty }
      else
        -- Preview movement forward
        enemy.preview_x = tx
        enemy.preview_y = ty
        enemy.preview_attack_target = nil
      end
    end
  end
  
  next_state.enemies = enemies
  return next_state
end

-- Spawn any scheduled wave enemies for the current round
local function spawn_wave_enemies(data, state)
  local next_state = copy_table(state)
  local wave_id = next_state.wave
  local round_id = next_state.round
  
  local wave_data = data.waves[wave_id] or data.waves[tostring(wave_id)]
  if not wave_data then return next_state end
  
  local grid_w = data.constants.grid_w or 6
  local enemies = collect(next_state.enemies or {})
  local enemy_list = collect(wave_data.enemies or {})
  
  for _, spec in ipairs(enemy_list) do
    if spec.spawn_turn == round_id then
      local next_id = "enemy_" .. tostring(#enemies + 1) .. "_" .. tostring(math.random(1000))
      table.insert(enemies, {
        id = next_id,
        type = spec.type,
        x = grid_w,
        y = spec.spawn_y,
        hp = spec.hp,
        max_hp = spec.hp,
        preview_x = grid_w,
        preview_y = spec.spawn_y
      })
    end
  end
  
  next_state.enemies = enemies
  return next_state
end

-- Initialize starting game state
function init_game(data)
  local state = {
    wave = 1,
    round = 1,
    energy = data.constants.start_energy or 10,
    core_hp = data.constants.start_core_hp or 10,
    towers = {},
    enemies = {},
    history = {}
  }
  
  -- Spawn turn 1 enemies and calculate previews
  state = spawn_wave_enemies(data, state)
  state = calculate_previews(data, state)
  return state
end

-- Place a player defensive unit
function place_tower(data, state, tower_type, x, y)
  local spec = data.towers[tower_type]
  if not spec then return state end
  if state.energy < spec.cost then return state end
  
  -- Check if slot is occupied
  if get_tower_at(state.towers, x, y) ~= nil then return state end
  if x == data.constants.core_x and y == data.constants.core_y then return state end
  
  local next_state = copy_table(state)
  table.insert(next_state.towers, {
    type = tower_type,
    name = spec.name,
    x = x,
    y = y,
    hp = spec.hp,
    max_hp = spec.hp,
    damage = spec.damage or 0
  })
  
  next_state.energy = next_state.energy - spec.cost
  
  -- Recalculate previews immediately based on new obstacles
  next_state = calculate_previews(data, next_state)
  return next_state
end

-- Commit turn: execute enemy previews and fire towers
function commit_turn(data, state)
  local next_state = copy_table(state)
  local log_entries = {}
  
  -- 1. Execute enemy previews (Move or Attack)
  local enemies = collect(next_state.enemies or {})
  local towers = collect(next_state.towers or {})
  
  for _, enemy in ipairs(enemies) do
    if enemy.preview_attack_target == "core" then
      -- Attack core
      next_state.core_hp = math.max(0, next_state.core_hp - 1)
      table.insert(log_entries, enemy.type .. " attacked the core!")
    elseif enemy.preview_attack_target ~= nil then
      -- Attack tower
      local target_x = enemy.preview_attack_target.x
      local target_y = enemy.preview_attack_target.y
      local t = get_tower_at(towers, target_x, target_y)
      if t ~= nil then
        t.hp = math.max(0, t.hp - 2)
        table.insert(log_entries, enemy.type .. " damaged tower at (" .. tostring(target_x) .. "," .. tostring(target_y) .. ")")
      end
    else
      -- Move
      enemy.x = enemy.preview_x
      enemy.y = enemy.preview_y
    end
  end
  
  -- 2. Fire Player Towers (Turrets attack nearest enemy in row)
  for _, t in ipairs(towers) do
    if t.type == "turret" and t.hp > 0 then
      -- Find nearest enemy with same Y and whose X >= t.x
      local nearest_enemy = nil
      local min_dist = 999
      for _, e in ipairs(enemies) do
        if e.y == t.y and e.x > t.x then
          local dist = e.x - t.x
          if dist < min_dist then
            min_dist = dist
            nearest_enemy = e
          end
        end
      end
      
      if nearest_enemy ~= nil then
        nearest_enemy.hp = math.max(0, nearest_enemy.hp - (t.damage or 3))
        table.insert(log_entries, "Autocannon fired and hit enemy!")
      end
    end
  end
  
  -- 3. Clean up dead entities
  local live_enemies = {}
  for _, e in ipairs(enemies) do
    if e.hp > 0 then
      table.insert(live_enemies, e)
    else
      table.insert(log_entries, "Enemy defeated!")
    end
  end
  next_state.enemies = live_enemies
  
  local live_towers = {}
  for _, t in ipairs(towers) do
    if t.hp > 0 then
      table.insert(live_towers, t)
    else
      table.insert(log_entries, t.name .. " was destroyed.")
    end
  end
  next_state.towers = live_towers
  
  -- 4. Check wave completion and spawn next wave
  local round_id = next_state.round
  local wave_id = next_state.wave
  local wave_data = data.waves[wave_id] or data.waves[tostring(wave_id)]
  
  local all_spawned = true
  if wave_data and wave_data.enemies then
    for _, spec in ipairs(collect(wave_data.enemies)) do
      if spec.spawn_turn > round_id then
        all_spawned = false
        break
      end
    end
  end
  
  if #live_enemies == 0 and all_spawned then
    -- Advance wave if there are more waves
    local next_wave = wave_id + 1
    local next_wave_data = data.waves[next_wave] or data.waves[tostring(next_wave)]
    if next_wave_data then
      next_state.wave = next_wave
      next_state.round = 1
      table.insert(log_entries, "Wave " .. tostring(wave_id) .. " cleared! Incoming Wave " .. tostring(next_wave) .. "!")
    else
      table.insert(log_entries, "Victory! All waves cleared!")
    end
  else
    next_state.round = round_id + 1
  end
  
  -- Grant round energy
  next_state.energy = next_state.energy + (data.constants.turn_energy_gain or 5)
  
  -- Spawn any new round enemies and compute new previews
  next_state = spawn_wave_enemies(data, next_state)
  next_state = calculate_previews(data, next_state)
  
  next_state.history = log_entries
  return next_state
end
