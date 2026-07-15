function clamp(value, minimum, maximum)
  if value < minimum then return minimum end
  if value > maximum then return maximum end
  return value
end

function circular_distance(hue_a, hue_b)
  local difference = math.abs(hue_a - hue_b) % 360
  return math.min(difference, 360 - difference)
end

function circular_hue_midpoint(hue_a, hue_b)
  local difference = ((hue_b - hue_a + 540) % 360) - 180
  return (hue_a + difference / 2 + 360) % 360
end

function snap_to_faction(hue)
  local anchors = {
    { color = "Red", value = 0 },
    { color = "Orange", value = 60 },
    { color = "Yellow", value = 120 },
    { color = "Green", value = 180 },
    { color = "Purple", value = 240 },
    { color = "Blue", value = 300 },
  }
  local closest = anchors[1].color
  local minimum_distance = 360
  for _, anchor in ipairs(anchors) do
    local distance = circular_distance(hue, anchor.value)
    if distance < minimum_distance then
      closest = anchor.color
      minimum_distance = distance
    end
  end
  return closest
end

function find_color_target(color_targets, target_id)
  if color_targets == nil or target_id == nil then return nil end
  for _, target in ipairs(color_targets) do
    if target.id == target_id then return target end
  end
  return nil
end

function breed_slimes(parent_a, parent_b, generation, same_pair_streak, color_targets, active_target_regent)
  local hue_a = parent_a.hue or 0
  local hue_b = parent_b.hue or 0
  local saturation_a = parent_a.saturation
  local saturation_b = parent_b.saturation
  if saturation_a == nil then saturation_a = parent_a.color == "Gray" and 0 or 100 end
  if saturation_b == nil then saturation_b = parent_b.color == "Gray" and 0 or 100 end
  same_pair_streak = same_pair_streak or 0

  local offspring_hue = circular_hue_midpoint(hue_a, hue_b)
  local normalized_distance = circular_distance(hue_a, hue_b) / 180
  local repetition_penalty = math.max(0.15, 1 - same_pair_streak * 0.12)
  local effective_k = 0.12 * repetition_penalty
  local average_saturation = (saturation_a + saturation_b) / 2
  local offspring_saturation = clamp(average_saturation * (1 - effective_k * normalized_distance), 0, 100)
  local final_hue = offspring_hue
  local final_saturation = offspring_saturation

  local target = find_color_target(color_targets, active_target_regent)
  if target ~= nil then
    local closest_center = target.center_hues[1]
    local minimum_distance = 360
    for _, center in ipairs(target.center_hues) do
      local distance = circular_distance(offspring_hue, center)
      if distance < minimum_distance then
        closest_center = center
        minimum_distance = distance
      end
    end
    local difference = ((closest_center - offspring_hue + 540) % 360) - 180
    final_hue = (offspring_hue + difference * 0.6 + 360) % 360
    local target_saturation_midpoint = (target.saturation_min + target.saturation_max) / 2
    final_saturation = clamp(offspring_saturation + (target_saturation_midpoint - offspring_saturation) * 0.6, 0, 100)
  end

  local color = final_saturation < 15 and "Gray" or snap_to_faction(final_hue)
  return {
    id = "slime_offspring",
    color = color,
    hue = final_hue,
    saturation = final_saturation,
    color_saturation = final_saturation,
    pattern = parent_a.pattern,
    level = 1,
    xp = 0,
    generation = generation,
    role = "idle",
    parent_a = parent_a.id,
    parent_b = parent_b.id,
  }
end

function find_by_id(items, id)
  for _, item in ipairs(items or {}) do
    if item.id == id then return item end
  end
  return nil
end

function select_slimes(slimes, slime_ids)
  local selected = {}
  local wanted = {}
  for _, id in ipairs(slime_ids or {}) do wanted[id] = true end
  for _, slime in ipairs(slimes or {}) do
    if wanted[slime.id] then table.insert(selected, slime) end
  end
  return selected
end

function dominant_color(party)
  local counts = {}
  local highest_count = 0
  local result = party[1] and party[1].color or "Gray"
  for _, slime in ipairs(party or {}) do
    counts[slime.color] = (counts[slime.color] or 0) + 1
    if counts[slime.color] > highest_count then
      highest_count = counts[slime.color]
      result = slime.color
    end
  end
  return result
end

function claim_success_chance(power, target_power)
  local chance = power / target_power
  if chance > 1 then
    chance = 0.85 + (chance - 1) * 0.1
  else
    chance = 0.2 + chance * 0.6
  end
  return clamp(chance, 0.15, 0.98)
end

function claim_grudge_color(node, excluded_color)
  if node.owner_color ~= nil and node.owner_color ~= "Gray" then return node.owner_color end
  local result = nil
  local maximum_pressure = -1
  for color, value in pairs(node.pressure or {}) do
    if color ~= "Gray" and color ~= excluded_color and value > maximum_pressure then
      result = color
      maximum_pressure = value
    end
  end
  return result
end

function copy_pressure(pressure)
  local copied = {}
  for color, value in pairs(pressure or {}) do copied[color] = value end
  return copied
end

function resolve_force_claim(node, party, is_discovered, roll)
  if #party == 0 then return { success = false, updated_node = node } end
  local force = 0
  for _, slime in ipairs(party) do
    force = force + slime.level * 10 + slime.stats.atk + slime.stats.def
  end
  local strength = is_discovered and node.strength or 0.8
  local chance = claim_success_chance(force, 50 + math.floor(strength * 100 + 0.5))
  roll = roll or math.random()
  if roll > chance then return { success = false, updated_node = node, chance = chance } end
  local pressure = copy_pressure(node.pressure)
  local grudge = claim_grudge_color(node, dominant_color(party))
  if grudge ~= nil then pressure[grudge] = 85 end
  return { success = true, chance = chance, updated_node = { id = node.id, name = node.name, owner_color = "Gray", strength = 0.4, pressure = pressure, discovered = true } }
end

function resolve_bribe_claim(node, credits_spent, is_discovered, roll)
  local strength = is_discovered and node.strength or 0.8
  local target_power = 50 + math.floor(strength * 100 + 0.5)
  local chance = claim_success_chance(credits_spent, math.floor(target_power * 2 + 0.5))
  roll = roll or math.random()
  if roll > chance then return { success = false, updated_node = node, chance = chance } end
  local pressure = copy_pressure(node.pressure)
  local grudge = claim_grudge_color(node, nil)
  if grudge ~= nil then pressure[grudge] = 45 end
  return { success = true, chance = chance, updated_node = { id = node.id, name = node.name, owner_color = "Gray", strength = 0.5, pressure = pressure, discovered = true } }
end

function resolve_convert_claim(node, party, relationship, is_discovered, roll)
  if #party == 0 then return { success = false, updated_node = node } end
  local charm = 0
  for _, slime in ipairs(party) do charm = charm + slime.stats.chm end
  local adjusted_charm = math.floor(charm * (1 + (relationship - 50) / 100) + 0.5)
  local strength = is_discovered and node.strength or 0.8
  local chance = claim_success_chance(adjusted_charm, 40 + math.floor(strength * 80 + 0.5))
  roll = roll or math.random()
  if roll > chance then return { success = false, updated_node = node, chance = chance } end
  local pressure = copy_pressure(node.pressure)
  local grudge = claim_grudge_color(node, dominant_color(party))
  if grudge ~= nil then pressure[grudge] = 5 end
  return { success = true, chance = chance, updated_node = { id = node.id, name = node.name, owner_color = "Gray", strength = 0.6, pressure = pressure, discovered = true } }
end

function initiate_breeding(state, parent_a_id, parent_b_id, same_pair_streak, color_targets, active_target_regent)
  if parent_a_id == parent_b_id then return nil, "Parents must differ" end
  if #(state.slimes or {}) >= state.roster_cap then return nil, "Roster capacity reached" end
  local parent_a = find_by_id(state.slimes, parent_a_id)
  local parent_b = find_by_id(state.slimes, parent_b_id)
  if parent_a == nil or parent_b == nil then return nil, "Parent not found" end
  local generation = math.max(parent_a.generation or 0, parent_b.generation or 0) + 1
  local child = breed_slimes(parent_a, parent_b, generation, same_pair_streak, color_targets, active_target_regent)
  table.insert(state.slimes, child)
  state.credits = math.max(0, (state.credits or 0) - 10)
  return child, nil
end

function force_claim_action(state, node_id, slime_ids, roll)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil then return nil, "Node not found" end
  local result = resolve_force_claim(node, select_slimes(state.slimes, slime_ids), node.discovered, roll)
  if result.success then
    for index, current in ipairs(state.planet_region.nodes) do
      if current.id == node_id then state.planet_region.nodes[index] = result.updated_node end
    end
  end
  return result, nil
end

function bribe_claim_action(state, node_id, credits_spent, roll)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil or (state.credits or 0) < credits_spent then return nil, "Claim unavailable" end
  local result = resolve_bribe_claim(node, credits_spent, node.discovered, roll)
  state.credits = state.credits - credits_spent
  if result.success then
    for index, current in ipairs(state.planet_region.nodes) do
      if current.id == node_id then state.planet_region.nodes[index] = result.updated_node end
    end
  end
  return result, nil
end

function convert_claim_action(state, node_id, slime_ids, relationship, roll)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil then return nil, "Node not found" end
  local result = resolve_convert_claim(node, select_slimes(state.slimes, slime_ids), relationship, node.discovered, roll)
  if result.success then
    for index, current in ipairs(state.planet_region.nodes) do
      if current.id == node_id then state.planet_region.nodes[index] = result.updated_node end
    end
  end
  return result, nil
end

function launch_dispatch(state, zone_id, slime_ids)
  state.active_dispatch = { id = "dispatch", zone_id = zone_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_dispatch
end

function retrieve_completed_dispatch(state)
  local dispatch = state.active_dispatch
  if dispatch == nil or dispatch.status ~= "completed" then return nil, "No completed dispatch" end
  state.active_dispatch = nil
  return dispatch, nil
end

function launch_exploration(state, node_id, slime_ids)
  state.active_exploration = { id = "exploration", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_exploration
end

function launch_mediation(state, node_id, slime_ids)
  state.active_mediation = { id = "mediation", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_mediation
end

function assign_garrison(state, node_id, slime_id)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  local slime = find_by_id(state.slimes, slime_id)
  if node == nil or slime == nil or node.owner_color == nil then return nil, "Garrison unavailable" end
  node.garrison_slime_id = slime_id
  slime.locked_role = "garrison"
  slime.garrisoned_at = node_id
  return node, nil
end

function recall_garrison(state, slime_id)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil or slime.locked_role ~= "garrison" then return nil, "Slime is not garrisoned" end
  local node = find_by_id(state.planet_region and state.planet_region.nodes, slime.garrisoned_at)
  if node ~= nil then node.garrison_slime_id = nil end
  slime.locked_role = nil
  slime.garrisoned_at = nil
  return slime, nil
end

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

function advance_cycle(state)
  state.cycle = (state.cycle or 0) + 1
  for _, contract in ipairs(state.contracts or {}) do
    contract.cycles_remaining = contract.cycles_remaining - 1
  end
  for index = #(state.contracts or {}), 1, -1 do
    if state.contracts[index].cycles_remaining <= 0 then table.remove(state.contracts, index) end
  end
  return state.cycle
end
