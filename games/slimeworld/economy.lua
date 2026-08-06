function deliver_contract(state, contract_id, slime_id)
  local contract = find_by_id(state.contracts, contract_id)
  local slime = find_by_id(state.slimes, slime_id)
  if contract == nil or slime == nil then return nil, "Contract or slime not found" end
  state.credits = (state.credits or 0) + contract.credits_reward
  for index, current in ipairs(state.contracts) do if current.id == contract_id then table.remove(state.contracts, index) break end end
  for index, current in ipairs(state.slimes) do if current.id == slime_id then table.remove(state.slimes, index) break end end
  return contract.credits_reward, nil
end

function sell_on_market(state, slime_id, price)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return nil, "Slime not found" end
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
  return seed, nil
end