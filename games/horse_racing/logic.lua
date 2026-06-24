-- RFDGameStudio — Horse Racing & Breeding
-- Logic Layer — extracted from utils.ts
-- Runs identically in TypeScript (fengari), Python (lupa), Rust (mlua)
-- Pure logic. No rendering. No I/O. Just math and rules.

-- ============================================================
-- UTILITY
-- ============================================================

-- Clamp a value between min and max
function clamp(val, min_val, max_val)
  return math.max(min_val, math.min(max_val, val))
end

-- Random integer in range [min, max]
function rand_int(min_val, max_val)
  return math.floor(min_val + math.random() * (max_val - min_val))
end

-- Random item from a table (array)
function rand_item(arr)
  return arr[math.random(#arr)]
end

-- Generate a horse name from prefix + suffix pools
function generate_horse_name(prefixes, suffixes)
  return rand_item(prefixes) .. " " .. rand_item(suffixes)
end

-- ============================================================
-- COLOR PROFILE
-- ============================================================

-- Pick a coat color based on probability weights
function generate_color_profile(coat_colors)
  local total_weight = 0
  for _, c in ipairs(coat_colors) do
    total_weight = total_weight + c.weight
  end
  
  local roll = math.random() * total_weight
  for _, profile in ipairs(coat_colors) do
    if roll < profile.weight then
      return {
        body = profile.body,
        mane = profile.mane,
        socks = profile.socks,
        color_name = profile.name
      }
    end
    roll = roll - profile.weight
  end
  
  -- Fallback: Bay
  return { body = "#91532B", mane = "#1C1917", socks = "#1C1917", color_name = "Bay" }
end

-- ============================================================
-- HORSE GENERATION
-- ============================================================

-- Generate a random horse with configurable stat ranges
function generate_horse(options, coat_colors, silk_colors, prefixes, suffixes)
  local min_stat = options.min_stat or 25
  local max_stat = options.max_stat or 65
  local generation = options.generation or 1
  local player_owned = options.player_owned or false
  local gender = options.gender or (math.random() > 0.5 and "Stallion" or "Mare")

  local speed        = rand_int(min_stat, max_stat)
  local stamina      = rand_int(min_stat, max_stat)
  local acceleration = rand_int(min_stat, max_stat)
  local temperament  = rand_int(min_stat, max_stat)

  local avg_stat = (speed + stamina + acceleration + temperament) / 4
  local price = math.floor(avg_stat * avg_stat * 0.35 + (generation * 100) + math.random() * 50)

  local colors = generate_color_profile(coat_colors)

  return {
    id             = "horse_" .. tostring(math.random(100000, 999999)),
    name           = generate_horse_name(prefixes, suffixes),
    gender         = gender,
    generation     = generation,
    speed          = speed,
    stamina        = stamina,
    acceleration   = acceleration,
    temperament    = temperament,
    color_body     = colors.body,
    color_mane     = colors.mane,
    color_socks    = colors.socks,
    color_silk     = rand_item(silk_colors),
    runs           = 0,
    wins           = 0,
    places         = 0,
    thirds         = 0,
    earnings       = 0,
    cooldown_until = 0,
    player_owned   = player_owned,
    price          = price,
    parents        = nil
  }
end

-- ============================================================
-- BREEDING
-- ============================================================

-- Breed a single stat from two parents with mutation and generational boost
function breed_stat(stat_a, stat_b)
  local parent_avg = (stat_a + stat_b) / 2
  -- Approximate normal distribution: sum of 3 uniform randoms centered on 0
  -- Range: approximately -15 to +15, centered on 0
  local mutation = (math.random() + math.random() + math.random() - 1.5) * 10
  -- Generational boost: +2.0 average
  local final_stat = math.round and math.round(parent_avg + mutation + 2.0)
    or math.floor(parent_avg + mutation + 2.0 + 0.5)
  return clamp(final_stat, 10, 100)
end

-- Breed two horses, inheriting stats and colors
-- sire must be Stallion, dam must be Mare
function breed_horses(sire, dam, coat_colors, silk_colors, prefixes, suffixes)
  if sire.gender ~= "Stallion" then
    return nil, "Sire must be a Stallion"
  end
  if dam.gender ~= "Mare" then
    return nil, "Dam must be a Mare"
  end

  local next_gen = math.max(sire.generation, dam.generation) + 1
  local gender   = math.random() > 0.5 and "Stallion" or "Mare"

  local speed        = breed_stat(sire.speed, dam.speed)
  local stamina      = breed_stat(sire.stamina, dam.stamina)
  local acceleration = breed_stat(sire.acceleration, dam.acceleration)
  local temperament  = breed_stat(sire.temperament, dam.temperament)

  -- Color inheritance: 45% sire, 45% dam, 10% random mutation
  local color_roll = math.random()
  local color_body, color_mane, color_socks

  if color_roll <= 0.45 then
    color_body  = sire.color_body
    color_mane  = sire.color_mane
    color_socks = sire.color_socks
  elseif color_roll <= 0.90 then
    color_body  = dam.color_body
    color_mane  = dam.color_mane
    color_socks = dam.color_socks
  else
    local profile = generate_color_profile(coat_colors)
    color_body  = profile.body
    color_mane  = profile.mane
    color_socks = profile.socks
  end

  -- Jockey silk: random from parents
  local color_silk = math.random() > 0.5 and sire.color_silk or dam.color_silk

  -- Child name: sire prefix + dam suffix
  local sire_parts = {}
  for part in sire.name:gmatch("%S+") do table.insert(sire_parts, part) end
  local dam_parts = {}
  for part in dam.name:gmatch("%S+") do table.insert(dam_parts, part) end

  local child_name = (sire_parts[1] or "Unknown") .. " " ..
                     (dam_parts[2] or rand_item(suffixes))

  return {
    id             = "horse_" .. tostring(math.random(100000, 999999)),
    name           = child_name,
    gender         = gender,
    generation     = next_gen,
    speed          = speed,
    stamina        = stamina,
    acceleration   = acceleration,
    temperament    = temperament,
    color_body     = color_body,
    color_mane     = color_mane,
    color_socks    = color_socks,
    color_silk     = color_silk,
    runs           = 0,
    wins           = 0,
    places         = 0,
    thirds         = 0,
    earnings       = 0,
    cooldown_until = 0,
    player_owned   = true,
    parents        = {
      sire_id   = sire.id,
      sire_name = sire.name,
      dam_id    = dam.id,
      dam_name  = dam.name
    }
  }, nil
end

-- ============================================================
-- ODDS CALCULATION
-- ============================================================

-- Calculate decimal betting odds for a field of horses at a given distance
-- Returns array of odds parallel to participants array
function calculate_odds(participants, distance, overround)
  overround = overround or 1.12

  -- Score each horse based on distance-weighted stats
  local scores = {}
  for _, p in ipairs(participants) do
    local h = p.horse or p  -- support both wrapped and unwrapped horse
    local score

    if distance <= 900 then
      -- Sprint: acceleration dominant
      score = h.acceleration * 0.45 + h.speed * 0.45 + h.stamina * 0.10
    elseif distance <= 1400 then
      -- Medium: speed dominant
      score = h.speed * 0.40 + h.stamina * 0.35 + h.acceleration * 0.25
    else
      -- Long: stamina dominant
      score = h.stamina * 0.55 + h.speed * 0.30 + h.acceleration * 0.15
    end

    -- Temperament bump: consistency of peak performance
    score = score + h.temperament * 0.05
    table.insert(scores, math.max(1, score))
  end

  local total_score = 0
  for _, s in ipairs(scores) do total_score = total_score + s end

  local odds = {}
  for _, s in ipairs(scores) do
    local prob = (s / total_score) * overround
    local decimal_odds = 1 / math.max(0.01, prob)
    -- Round to nearest tenth
    decimal_odds = math.floor(decimal_odds * 10 + 0.5) / 10
    table.insert(odds, math.max(1.1, decimal_odds))
  end

  return odds
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

  -- Deep-copy participants so we don't mutate the caller's table
  local field = {}
  for i, p in ipairs(participants) do
    local h = p.horse or p
    field[i] = {
      horse          = h,
      energy         = p.energy         or 100,
      current_distance = p.current_distance or 0,
      current_speed  = p.current_speed  or 0,
      is_finished    = p.is_finished    or false,
      progress       = p.progress       or 0,
      finish_time    = p.finish_time    or nil,
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
-- RACE OUTCOME — prize distribution
-- ============================================================

-- Calculate prize payouts from race results
-- prize_split: array of fractions e.g. {0.60, 0.25, 0.15}
function calculate_payouts(results, prize_pool, prize_split)
  local payouts = {}
  for i, result in ipairs(results) do
    local fraction = prize_split[i] or 0
    payouts[result.horse_id] = math.floor(prize_pool * fraction)
  end
  return payouts
end

-- ============================================================
-- HORSE PRICE (Turf Bid Value)
-- ============================================================

-- Recalculate a horse's market value based on current stats and career
function calculate_horse_price(horse)
  local avg_stat = (horse.speed + horse.stamina +
                    horse.acceleration + horse.temperament) / 4
  local base_price = math.floor(avg_stat * avg_stat * 0.35 +
                                (horse.generation * 100))
  -- Career premium: each win adds value
  local career_premium = horse.wins * 150 + horse.places * 60 + horse.thirds * 30
  return base_price + career_premium
end

-- ============================================================
-- SELL HORSE
-- ============================================================

-- Validate and execute a horse sale
-- Returns new_funds or nil + error
function sell_horse(horse, current_funds)
  if horse.runs == 0 then
    -- Unraced: sell at base price
    return current_funds + horse.price, nil
  end
  -- Raced: sell at current turf bid value
  local value = calculate_horse_price(horse)
  return current_funds + value, nil
end
