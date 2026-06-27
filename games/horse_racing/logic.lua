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
-- RACE OUTCOME — prize distribution
-- ============================================================

-- DEPRECATED: Use settle_bets() instead.
-- settle_bets() returns horse_earnings alongside bet_payout in one call.
-- This function will be removed in Phase 4.
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

-- ============================================================
-- BETTING — PLACE ODDS
-- ============================================================

-- Calculate place bet odds from win odds.
-- config: { place_odds_multiplier, place_odds_min }
-- Returns: float — max(min, win_odds * multiplier)
function calculate_place_odds(win_odds, config)
  local multiplier = config and config.place_odds_multiplier or 0.38
  local min_odds   = config and config.place_odds_min        or 1.15
  local place = win_odds * multiplier
  if place < min_odds then place = min_odds end
  return math.floor(place * 100 + 0.5) / 100
end

-- Calculate show bet odds (1st, 2nd, or 3rd).
function calculate_show_odds(win_odds, config)
  local multiplier = config and config.show_odds_multiplier or 0.20
  local min_odds   = config and config.show_odds_min        or 1.05
  local show = win_odds * multiplier
  if show < min_odds then show = min_odds end
  return math.floor(show * 100 + 0.5) / 100
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
-- BET SETTLEMENT
-- ============================================================

-- Settle all bets for a completed race.
-- bets: array of { horse_id, amount, type, payout_odds }
--   type is "Win" (must finish 1st) or "Place" (must finish 1st/2nd/3rd)
-- standings: array of { horse_id, final_rank } sorted rank ascending (from simulate_race)
-- prize_pool: integer total purse
-- prize_splits: array of fractions e.g. {0.60, 0.25, 0.15}
--
-- Returns: {
--   bet_payout: integer (total won from bets, net — losing bets already deducted on placement),
--   horse_earnings: table { horse_id = prize_integer }
-- }
function settle_bets(bets, standings, prize_pool, prize_splits)
  -- Build rank lookup: horse_id -> rank
  local rank_of = {}
  for _, s in ipairs(standings) do
    rank_of[s.horse_id] = s.final_rank
  end

  -- Calculate bet winnings (only winning bets; losing bets were deducted on placement)
  local bet_payout = 0
  for _, bet in ipairs(bets) do
    local rank = rank_of[bet.horse_id]
    if rank then
      local is_winner = false
      if bet.type == "Win" and rank == 1 then
        is_winner = true
      elseif bet.type == "Place" and rank <= 2 then
        is_winner = true
      elseif bet.type == "Show" and rank <= 3 then
        is_winner = true
      end
      if is_winner then
        bet_payout = bet_payout + math.floor(bet.amount * bet.payout_odds)
      end
    end
  end

  -- Calculate prize pool earnings per horse
  local horse_earnings = {}
  for _, s in ipairs(standings) do
    local fraction = prize_splits[s.final_rank] or 0
    if fraction > 0 then
      horse_earnings[s.horse_id] = math.floor(prize_pool * fraction)
    else
      horse_earnings[s.horse_id] = 0
    end
  end

  return { bet_payout = bet_payout, horse_earnings = horse_earnings }
end
