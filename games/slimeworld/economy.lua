function deliver_contract(state, contract_id, slime_id)
  local contract = find_by_id(state.contracts, contract_id)
  local slime = find_by_id(state.slimes, slime_id)
  if contract == nil or slime == nil then return nil, "Contract or slime not found" end
  state.credits = (state.credits or 0) + contract.credits_reward
  for index, current in ipairs(state.contracts) do if current.id == contract_id then table.remove(state.contracts, index) break end end
  for index, current in ipairs(state.slimes) do if current.id == slime_id then table.remove(state.slimes, index) break end end
  return contract.credits_reward, nil
end

-- Market sale pricing (SlimeBreeder absorption step 2.3).
-- price = tier value x level scaling x flood multiplier, where the tier value
-- is calculate_tier_value (breeding.lua) applied to the slime's snapped
-- color/shape names and a per-slime variance. Tuning numbers live in
-- data.yaml `market:`; the defaults below mirror it and apply when the
-- caller does not pass a market config table.
local MARKET_DEFAULTS = {
  level_value_step = 0.125,
  value_variance_range = 0.10,
  flood_decay_per_sale = 0.12,
  flood_multiplier_floor = 0.3,
  flood_window_cycles = 5,
}

-- Pure-arithmetic equivalent of hashStringToSeed
-- (ts/src/engine/shared/seededRandom.ts): h = h*31 + byte (mod 2^32).
-- Bitwise-free so it behaves identically under fengari and lupa.
function hash_string_to_seed(text)
  local hash = 0
  for i = 1, #text do
    hash = (hash * 31 + string.byte(text, i)) % 4294967296
  end
  return hash
end

-- Deterministic per-slime sale variance seeded from the slime id. Produces
-- the archive's 21 discrete outcomes spanning +/-range (0.01 steps at the
-- default 0.10 range, matching slimeGenerator.ts's toFixed(2) roll).
function slime_value_variance(slime_id, variance_range)
  variance_range = variance_range or MARKET_DEFAULTS.value_variance_range
  return (hash_string_to_seed(slime_id or "") % 21 - 10) * (variance_range / 10)
end

function recent_sales_count_for_color(state, color, window_cycles)
  local count = 0
  local min_cycle = (state.cycle or 0) - (window_cycles - 1)
  for _, sale in ipairs(state.recent_market_sales or {}) do
    if sale.color == color and (sale.cycle or 0) >= min_cycle then
      count = count + 1
    end
  end
  return count
end

-- calculate_tier_value x level scaling x the flood multiplier.
-- `market` is the optional data.yaml `market:` block; missing keys fall
-- back to MARKET_DEFAULTS.
function calculate_market_price(slime, recent_sales_for_color, market)
  local config = MARKET_DEFAULTS
  if type(market) == "table" then
    config = {
      level_value_step = market.level_value_step or MARKET_DEFAULTS.level_value_step,
      value_variance_range = market.value_variance_range or MARKET_DEFAULTS.value_variance_range,
      flood_decay_per_sale = market.flood_decay_per_sale or MARKET_DEFAULTS.flood_decay_per_sale,
      flood_multiplier_floor = market.flood_multiplier_floor or MARKET_DEFAULTS.flood_multiplier_floor,
      flood_window_cycles = market.flood_window_cycles or MARKET_DEFAULTS.flood_window_cycles,
    }
  end
  local shape_name = snap_to_shape_name(slime.vertex_count or 4, slime.irregularity or 10)
  local variance = slime.variance
  if variance == nil then variance = slime_value_variance(slime.id, config.value_variance_range) end
  local tier_value = calculate_tier_value(slime.color or "Gray", shape_name, variance)
  local level_scale = 1 + ((slime.level or 1) - 1) * config.level_value_step
  local flood_multiplier = math.max(config.flood_multiplier_floor, 1 - (recent_sales_for_color or 0) * config.flood_decay_per_sale)
  return math.floor(tier_value * level_scale * flood_multiplier)
end

function sell_on_market(state, slime_id, market)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return nil, "Slime not found" end
  if type(market) ~= "table" then market = nil end
  local window = MARKET_DEFAULTS.flood_window_cycles
  if market ~= nil and market.flood_window_cycles ~= nil then window = market.flood_window_cycles end
  local price = calculate_market_price(slime, recent_sales_count_for_color(state, slime.color, window), market)
  state.credits = (state.credits or 0) + price
  state.recent_market_sales = state.recent_market_sales or {}
  table.insert(state.recent_market_sales, { color = slime.color, cycle = state.cycle })
  for index, current in ipairs(state.slimes) do if current.id == slime_id then table.remove(state.slimes, index) break end end
  return price, nil
end

function buy_upgrade(state, upgrade_type)
  local costs = { capacity = 150, stabilizer = 200, autofeeder = 250 }
  local cost = costs[upgrade_type]
  if cost == nil or (state.credits or 0) < cost then return false end
  if upgrade_type == "autofeeder" and state.has_auto_feeder then return false end
  state.credits = state.credits - cost
  if upgrade_type == "capacity" then state.roster_cap = state.roster_cap + 5 end
  if upgrade_type == "stabilizer" then state.breeding_success_rate_modifier = (state.breeding_success_rate_modifier or 0) + 0.1 end
  if upgrade_type == "autofeeder" then state.has_auto_feeder = true end
  return true
end

function toggle_worker_role(state, slime_id)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return false end
  if slime.locked_role == "worker" then
    slime.locked_role = nil
  elseif slime.locked_role == nil then
    slime.locked_role = "worker"
  else
    return false
  end
  return true
end

function recycle_slime(state, slime_id)
  if #(state.slimes or {}) <= 1 then return nil, "Cannot recycle final slime" end
  for index, slime in ipairs(state.slimes or {}) do
    if slime.id == slime_id then
      table.remove(state.slimes, index)
      state.credits = (state.credits or 0) + 15
      return 15, nil
    end
  end
  return nil, "Slime not found"
end

function rename_slime(state, slime_id, new_name)
  if new_name == nil then return nil, "Name required" end
  local trimmed_name = string.match(new_name, "^%s*(.-)%s*$")
  if trimmed_name == "" then return nil, "Name required" end
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return nil, "Slime not found" end
  slime.name = trimmed_name
  return slime, nil
end

-- PLACEHOLDER — pending Robert's confirmation. Number of cycles that must pass
-- between seed purchases. Currently 3 cycles; treated as provisional until
-- Robert sets the final value.
local SEED_PURCHASE_COOLDOWN_CYCLES = 3

-- Canonical faction anchor hues (matches color_genetics.faction_anchors in data.yaml).
local FACTION_ANCHORS = {
  { color = "Red",    hue = 0   },
  { color = "Orange", hue = 60  },
  { color = "Yellow", hue = 120 },
  { color = "Green",  hue = 180 },
  { color = "Purple", hue = 240 },
  { color = "Blue",   hue = 300 },
}

function find_color_target_by_id(color_targets, target_id)
  if color_targets == nil or target_id == nil then return nil end
  for _, target in ipairs(color_targets) do
    if target.id == target_id then return target end
  end
  return nil
end

-- Derive the set of seed-purchasable colors from the player's currently
-- unlocked regions. For each unlocked region, look up its color_target and
-- include every faction-anchor color within 60 degrees of any of the target's
-- center hues. Re-derived every call; never cached.
function derive_purchasable_colors(state, region_locks, color_targets)
  local colors = {}
  local seen = {}
  local region_unlocks = state.region_unlocks or {}

  for _, lock in ipairs(region_locks or {}) do
    if region_unlocks[lock.node_id] == true then
      local target = find_color_target_by_id(color_targets, lock.color_target_id)
      if target and target.center_hues then
        for _, center in ipairs(target.center_hues) do
          for _, anchor in ipairs(FACTION_ANCHORS) do
            local distance = circular_distance(center, anchor.hue)
            if distance <= 60 then
              if not seen[anchor.color] then
                seen[anchor.color] = true
                table.insert(colors, anchor.color)
              end
            end
          end
        end
      end
    end
  end

  return colors
end

function purchase_seed_slime(state, color, color_specs, region_locks, color_targets)
  local cost = 50
  if (state.credits or 0) < cost then return nil, "Insufficient credits" end
  if #(state.slimes or {}) >= (state.roster_cap or 8) then return nil, "Roster capacity reached" end

  -- Color eligibility gate: only colors reachable from currently unlocked regions.
  local purchasable = derive_purchasable_colors(state, region_locks, color_targets)
  local color_allowed = false
  for _, allowed in ipairs(purchasable) do
    if allowed == color then color_allowed = true break end
  end
  if not color_allowed then
    return nil, "Color not available from unlocked regions"
  end

  -- Cooldown gate: independent of color eligibility.
  local cycle = state.cycle or 0
  local last_cycle = state.last_seed_purchase_cycle or -SEED_PURCHASE_COOLDOWN_CYCLES
  if cycle - last_cycle < SEED_PURCHASE_COOLDOWN_CYCLES then
    return nil, "Seed purchase on cooldown"
  end

  local seed = create_seed_slime(color, "Solid", color_specs)
  table.insert(state.slimes, seed)
  state.credits = (state.credits or 0) - cost
  state.last_seed_purchase_cycle = cycle
  -- Bridge the cooldown timestamp back to TypeScript on the returned slime
  -- so the UI can persist it without a separate return-shape change.
  seed.last_seed_purchase_cycle = cycle
  return seed, nil
end