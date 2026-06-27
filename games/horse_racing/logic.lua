-- Horse Racing — Game-Specific Logic
-- Runs identically in TypeScript (fengari), Python (lupa), Rust (mlua)
-- Pure logic. No rendering. No I/O. Just math and rules.
--
-- Engine primitives loaded by runtime before this file:
--   engine/primitives/action.lua     (clamp, rand_int, rand_item)
--   engine/primitives/entity.lua     (generate_id, copy_entity, validate_entity)
--   engine/systems/genetics.lua      (generate_horse, breed_horses, ...)
--   engine/systems/odds.lua          (calculate_odds, calculate_place_odds, ...)
--   engine/systems/market.lua        (settle_bets, calculate_horse_price, ...)

-- ============================================================
-- RACE CREATION
-- ============================================================

-- Create a complete race from player horse + full data table.
-- Selects eligible race class, generates NPC field within class stat range,
-- picks distance and venue name, calculates odds for the full field.
--
-- player_horse: Horse table
-- data: full data.yaml parsed table
--
-- Returns: race_obj, nil       on success
-- Returns: nil, error_string   if horse is ineligible for all classes
function create_race(player_horse, data)
  local race_classes = data.race_classes
  local distances    = data.race_distances
  local venues       = data.race_venues
  local types        = data.race_types
  local coat_colors  = data.coat_colors
  local silk_colors  = data.silk_colors
  local prefixes     = data.name_prefixes
  local suffixes     = data.name_suffixes
  local field_size   = (data.race and data.race.field_size) or 6

  local avg_stat = (player_horse.speed + player_horse.stamina +
                    player_horse.acceleration + player_horse.temperament) / 4

  local eligible = {}
  for _, rc in ipairs(race_classes) do
    local min_s = rc.stat_min or 0
    local max_s = rc.stat_max or 100
    if avg_stat >= min_s and avg_stat <= max_s then
      table.insert(eligible, rc)
    end
  end

  if #eligible == 0 then
    return nil, "Horse avg stat " .. string.format("%.1f", avg_stat) ..
                " is not eligible for any race class"
  end

  local race_class = eligible[math.random(#eligible)]
  local dist_entry = distances[math.random(#distances)]
  local distance   = dist_entry.meters
  local venue      = venues[math.random(#venues)]
  local race_type  = types[math.random(#types)]
  local race_name  = venue .. " " .. race_type

  local participants = {}
  table.insert(participants, {
    horse            = player_horse,
    gate             = 1,
    odds             = 0,
    progress         = 0,
    current_distance = 0,
    current_speed    = 0,
    energy           = 100,
    is_finished      = false,
  })

  local npc_min  = race_class.stat_min or 10
  local npc_max  = race_class.stat_max or 100
  local npc_opts = { min_stat = npc_min, max_stat = npc_max,
                     generation = 1, player_owned = false }

  while #participants < field_size do
    local npc = generate_horse(npc_opts, coat_colors, silk_colors, prefixes, suffixes)
    table.insert(participants, {
      horse            = npc,
      gate             = #participants + 1,
      odds             = 0,
      progress         = 0,
      current_distance = 0,
      current_speed    = 0,
      energy           = 100,
      is_finished      = false,
    })
  end

  local horse_stats = {}
  for _, p in ipairs(participants) do
    table.insert(horse_stats, {
      speed        = p.horse.speed,
      stamina      = p.horse.stamina,
      acceleration = p.horse.acceleration,
      temperament  = p.horse.temperament,
    })
  end
  local odds_arr = calculate_odds(horse_stats, distance)
  for i, p in ipairs(participants) do
    p.odds = odds_arr[i] or 4.0
  end

  local prize_split = race_class.prize_split or {0.60, 0.25, 0.15}

  return {
    id           = "race_" .. tostring(math.random(100000, 999999)),
    name         = race_name,
    description  = (race_class.name or "Race") .. " \xc2\xb7 " .. tostring(distance) ..
                   "m \xc2\xb7 Prize $" .. tostring(race_class.prize_pool or 0),
    distance     = distance,
    race_class   = race_class.name or "Unknown",
    prize_pool   = race_class.prize_pool or 0,
    prize_split  = prize_split,
    entry_fee    = race_class.fee or 0,
    participants = participants,
    status       = "scheduled",
  }, nil
end

-- Validate whether the player can unlock a stable slot.
-- Returns: true, nil             if unlockable
-- Returns: false, reason_string  if not
function can_unlock_slot(current_slots, max_slots, funds, unlock_cost)
  if current_slots >= max_slots then
    return false, "Stable is already at maximum capacity"
  end
  if funds < unlock_cost then
    return false, "Insufficient funds (need $" .. tostring(unlock_cost) .. ")"
  end
  return true, nil
end

-- ============================================================
-- AI-ONLY RACE CREATION
-- ============================================================

-- Create a race with no player horse — full AI field.
-- Used when the player's horse is resting or ineligible.
-- Player can still bet on any participant.
-- Returns same format as create_race, with ai_only = true.
--
-- race_class: one entry from data.race_classes
-- data: full data.yaml parsed table
function create_ai_race(race_class, data)
  local distances  = data.race_distances
  local venues     = data.race_venues
  local types      = data.race_types
  local coat_colors = data.coat_colors
  local silk_colors = data.silk_colors
  local prefixes   = data.name_prefixes
  local suffixes   = data.name_suffixes
  local field_size = (data.race and data.race.field_size) or 6

  local dist_entry = distances[math.random(#distances)]
  local venue      = venues[math.random(#venues)]
  local race_type  = types[math.random(#types)]
  local race_name  = venue .. " " .. race_type

  local npc_min  = race_class.stat_min or 10
  local npc_max  = race_class.stat_max or 100
  local npc_opts = { min_stat=npc_min, max_stat=npc_max,
                     generation=1, player_owned=false }

  local participants = {}
  for i = 1, field_size do
    local npc = generate_horse(npc_opts, coat_colors, silk_colors,
                               prefixes, suffixes)
    table.insert(participants, {
      horse            = npc,
      gate             = i,
      odds             = 0,
      progress         = 0,
      current_distance = 0,
      current_speed    = 0,
      energy           = 100,
      is_finished      = false,
    })
  end

  -- Calculate odds for the full AI field
  local horse_stats = {}
  for _, p in ipairs(participants) do
    table.insert(horse_stats, {
      speed        = p.horse.speed,
      stamina      = p.horse.stamina,
      acceleration = p.horse.acceleration,
      temperament  = p.horse.temperament,
    })
  end
  local odds_arr = calculate_odds(horse_stats, dist_entry.meters)
  for i, p in ipairs(participants) do
    p.odds = odds_arr[i] or 4.0
  end

  local prize_split = race_class.prize_split or {0.60, 0.25, 0.15}

  return {
    id          = "race_" .. tostring(math.random(100000, 999999)),
    name        = race_name,
    description = (race_class.name or "Race") .. " \xc2\xb7 " ..
                  tostring(dist_entry.meters) .. "m \xc2\xb7 Prize $" ..
                  tostring(race_class.prize_pool or 0),
    distance    = dist_entry.meters,
    race_class  = race_class.name or "Unknown",
    prize_pool  = race_class.prize_pool or 0,
    prize_split = prize_split,
    entry_fee   = race_class.fee or 0,
    participants = participants,
    status      = "scheduled",
    ai_only     = true,
  }, nil
end

-- ============================================================
-- RACE SIMULATION (single tick)
-- ============================================================

-- Advance race simulation by one tick
-- Returns updated participants and whether the race is complete
function tick_race(participants, distance, delta_time)
  local all_finished = true

  for _, p in ipairs(participants) do
    if not p.is_finished then
      local h = p.horse

      -- Energy drain: stamina slows drain rate
      -- Base drain: 8% per second; high stamina reduces to ~3%
      local energy_drain = (8 - (h.stamina / 100) * 5) * delta_time
      p.energy = math.max(0, p.energy - energy_drain)

      -- Speed calculation: base from speed stat, modified by energy and temperament
      -- Temperament adds volatility: low temperament = wider random swings
      local volatility = (100 - h.temperament) / 100
      local random_factor = 1 + (math.random() - 0.5) * volatility * 0.3

      local base_speed = (h.speed / 100) * 12  -- max ~12 m/s
      local energy_factor = 0.4 + (p.energy / 100) * 0.6  -- never drops below 40%

      -- Acceleration curve: horses start slower and build up
      local accel_factor = 1.0
      if p.current_distance < 200 then
        accel_factor = 0.4 + (h.acceleration / 100) * 0.6 *
                       (p.current_distance / 200)
      end

      p.current_speed = base_speed * energy_factor * accel_factor * random_factor
      p.current_distance = p.current_distance + p.current_speed * delta_time
      p.progress = math.min(100, (p.current_distance / distance) * 100)

      if p.current_distance >= distance then
        p.is_finished = true
        p.finish_time = p.finish_time or (p.current_distance / p.current_speed)
      else
        all_finished = false
      end
    end
  end

  return participants, all_finished
end

-- ============================================================
-- FULL RACE SIMULATION (headless, returns ranked results)
-- ============================================================

-- Run the complete race in one call. No per-tick round-trips.
-- participants: array of { horse: {id, speed, stamina, acceleration, temperament},
--                          energy: 100, current_distance: 0, current_speed: 0,
--                          is_finished: false, progress: 0 }
-- config: { distance: number, delta_time: number (optional, default 0.2) }
-- Returns: array of { rank, horse_id, horse_name, finish_time }
--          ordered 1st to last
function simulate_race(participants, config)
  local distance   = config.distance or 1200
  local delta_time = config.delta_time or 0.2
  local MAX_TICKS  = 10000  -- safety ceiling (~33 minutes at 0.2s ticks)

  -- Deep-copy participants so we don't mutate the caller's table.
  -- Use pcall when reading finish_time because lupa-proxied Python dicts
  -- raise KeyError (not nil) for absent keys.
  local field = {}
  for i, p in ipairs(participants) do
    local h = p.horse or p
    local ok, ft = pcall(function() return p.finish_time end)
    field[i] = {
      horse            = h,
      energy           = p.energy           or 100,
      current_distance = p.current_distance or 0,
      current_speed    = p.current_speed    or 0,
      is_finished      = p.is_finished      or false,
      progress         = p.progress         or 0,
      finish_time      = (ok and ft) or nil,
    }
  end

  local ticks = 0
  local all_finished = false
  while not all_finished and ticks < MAX_TICKS do
    field, all_finished = tick_race(field, distance, delta_time)
    ticks = ticks + 1
  end

  -- Sort by finish_time ascending (finished horses first, then by distance desc as tiebreak)
  table.sort(field, function(a, b)
    if a.finish_time and b.finish_time then
      return a.finish_time < b.finish_time
    elseif a.finish_time then
      return true
    elseif b.finish_time then
      return false
    else
      return (a.current_distance or 0) > (b.current_distance or 0)
    end
  end)

  local results = {}
  for rank, p in ipairs(field) do
    results[rank] = {
      rank        = rank,
      horse_id    = p.horse.id,
      horse_name  = p.horse.name or ("Horse " .. tostring(rank)),
      finish_time = p.finish_time or 0,
    }
  end

  return results
end

-- ============================================================
-- HORSE CAREER UPDATE
-- ============================================================

-- Apply race result to a horse's career stats.
-- Does NOT mutate the input horse — returns a new table.
-- rank: 1 = win, 2 = place, 3 = show, >3 = unplaced
-- prize_earnings: integer amount this horse earned from the prize pool
function update_horse_after_race(horse, rank, prize_earnings)
  prize_earnings = prize_earnings or 0
  local updated = {}
  for k, v in pairs(horse) do updated[k] = v end
  updated.runs     = (horse.runs or 0) + 1
  updated.earnings = (horse.earnings or 0) + prize_earnings
  if rank == 1 then
    updated.wins   = (horse.wins or 0) + 1
  elseif rank == 2 then
    updated.places = (horse.places or 0) + 1
  elseif rank == 3 then
    updated.thirds = (horse.thirds or 0) + 1
  end
  return updated
end

-- ============================================================
-- BALANCE TEST HELPER (called by studio_balance_report MCP tool)
-- ============================================================

-- Run one race simulation using only scalar horse stats.
-- Builds all Lua-native data internally — no Python table conversion needed.
-- speed, stamina, acceleration, temperament: player horse stats (0-100)
-- Returns: player rank (1-6), or nil on failure
function run_balance_test(speed, stamina, acceleration, temperament)
  local player_horse = {
    id           = "balance_player",
    name         = "Test Horse",
    speed        = speed,
    stamina      = stamina,
    acceleration = acceleration,
    temperament  = temperament,
  }

  local field_size  = 6
  local player_avg  = (speed + stamina + acceleration + temperament) / 4

  local participants = {{
    horse            = player_horse,
    gate             = 1,
    energy           = 100,
    current_distance = 0,
    current_speed    = 0,
    is_finished      = false,
    progress         = 0,
  }}

  for i = 2, field_size do
    local base = player_avg + (math.random() - 0.5) * 20
    base = math.max(10, math.min(100, base))
    local npc = {
      id           = "npc_" .. i,
      name         = "NPC " .. i,
      speed        = math.max(10, math.min(100, base + (math.random()-0.5)*10)),
      stamina      = math.max(10, math.min(100, base + (math.random()-0.5)*10)),
      acceleration = math.max(10, math.min(100, base + (math.random()-0.5)*10)),
      temperament  = math.max(10, math.min(100, 60 + math.random()*20)),
    }
    table.insert(participants, {
      horse            = npc,
      gate             = i,
      energy           = 100,
      current_distance = 0,
      current_speed    = 0,
      is_finished      = false,
      progress         = 0,
    })
  end

  local config = { distance = 1200, delta_time = 0.2 }
  local results = simulate_race(participants, config)
  if not results then return nil end

  for _, r in ipairs(results) do
    if r.horse_id == "balance_player" then
      return r.rank
    end
  end
  return nil
end

