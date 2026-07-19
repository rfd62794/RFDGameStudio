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

function resolve_convert_claim(node, party, culture_relationship, is_discovered, roll)
  if #party == 0 then return { success = false, updated_node = node } end
  culture_relationship = culture_relationship or 50
  local charm = 0
  for _, slime in ipairs(party) do charm = charm + slime.stats.chm end
  local adjusted_charm = math.floor(charm * (1 + (culture_relationship - 50) / 100) + 0.5)
  local strength = is_discovered and node.strength or 0.8
  local chance = claim_success_chance(adjusted_charm, 40 + math.floor(strength * 80 + 0.5))
  roll = roll or math.random()
  if roll > chance then return { success = false, updated_node = node, chance = chance } end
  local pressure = copy_pressure(node.pressure)
  local grudge = claim_grudge_color(node, dominant_color(party))
  if grudge ~= nil then pressure[grudge] = 5 end
  return { success = true, chance = chance, updated_node = { id = node.id, name = node.name, owner_color = "Gray", strength = 0.6, pressure = pressure, discovered = true } }
end

function initiate_breeding(state, parent_a_id, parent_b_id, same_pair_streak, color_targets, active_target_regent, shape_targets, active_shape_target, color_specs)
  if parent_a_id == parent_b_id then return nil, "Parents must differ" end
  if #(state.slimes or {}) >= state.roster_cap then return nil, "Roster capacity reached" end
  local parent_a = find_by_id(state.slimes, parent_a_id)
  local parent_b = find_by_id(state.slimes, parent_b_id)
  if parent_a == nil or parent_b == nil then return nil, "Parent not found" end
  local generation = math.max(parent_a.generation or 0, parent_b.generation or 0) + 1
  local child = breed_slimes(parent_a, parent_b, generation, same_pair_streak, color_targets, active_target_regent)
  local shape = breed_shape(parent_a, parent_b, shape_targets, active_shape_target)
  child.vertex_count = shape.vertex_count
  child.irregularity = shape.irregularity
  local accent = breed_accent(parent_a, parent_b, child.vertex_count, child.irregularity, child.hue)
  child.diffusion_ratio = accent.diffusion_ratio
  child.amplitude = accent.amplitude
  child.accent_hue = accent.accent_hue
  child.matched_target_id = match_color_target(child.hue, child.saturation, color_targets)
  child.matched_shape_target_id = match_shape_target(child.vertex_count, child.irregularity, shape_targets)
  child.stats = calculate_stats(child.color, child.level or 1, child.hue, child.saturation, child.vertex_count, child.irregularity, color_specs)
  table.insert(state.slimes, child)
  for index, slime in ipairs(state.slimes) do
    if slime.id == parent_b_id then
      table.remove(state.slimes, index)
      break
    end
  end
  child.consumed_slime_id = parent_b_id
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

function convert_target_color(node)
  if node.owner_color ~= nil then return node.owner_color end
  local target_color = "Gray"
  local maximum_pressure = -1
  for color, pressure in pairs(node.pressure or {}) do
    if pressure > maximum_pressure then
      target_color = color
      maximum_pressure = pressure
    end
  end
  return target_color
end

function convert_claim_action(state, node_id, slime_ids, culture_relationship, roll)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil then return nil, "Node not found" end
  if culture_relationship == nil then
    local relationships = state.culture_relationships or {}
    culture_relationship = relationships[convert_target_color(node)] or 50
  end
  local result = resolve_convert_claim(node, select_slimes(state.slimes, slime_ids), culture_relationship, node.discovered, roll)
  if result.success then
    for index, current in ipairs(state.planet_region.nodes) do
      if current.id == node_id then state.planet_region.nodes[index] = result.updated_node end
    end
  end
  return result, nil
end