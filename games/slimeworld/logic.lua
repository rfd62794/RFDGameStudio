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

function find_shape_target(shape_targets, target_id)
  if shape_targets == nil or target_id == nil then return nil end
  for _, target in ipairs(shape_targets) do
    if target.id == target_id then return target end
  end
  return nil
end

function breed_shape(parent_a, parent_b, shape_targets, active_shape_target)
  local vertex_a = parent_a.vertex_count or 4
  local vertex_b = parent_b.vertex_count or 4
  local irregularity_a = parent_a.irregularity or 10
  local irregularity_b = parent_b.irregularity or 10
  local offspring_vertex = (vertex_a + vertex_b) / 2
  local normalized_distance = math.abs(vertex_a - vertex_b) / 19
  local average_irregularity = (irregularity_a + irregularity_b) / 2
  local spiked_irregularity = clamp(average_irregularity + normalized_distance * 0.5 * 100, 0, 100)
  local final_vertex = offspring_vertex
  local final_irregularity = spiked_irregularity
  local target = find_shape_target(shape_targets, active_shape_target)
  if target ~= nil then
    final_vertex = offspring_vertex + (target.vertex_count - offspring_vertex) * 0.6
    local target_irregularity_midpoint = ((target.irregularity_min or 0) + target.irregularity_max) / 2
    final_irregularity = clamp(spiked_irregularity + (target_irregularity_midpoint - spiked_irregularity) * 0.6, 0, 100)
  end
  return { vertex_count = final_vertex, irregularity = final_irregularity }
end

function find_accent_type(accent_targets, diffusion_ratio)
  for _, target in ipairs(accent_targets or {}) do
    if target.id ~= "accent_metallic" and target.diffusion_min ~= nil and diffusion_ratio >= target.diffusion_min and diffusion_ratio <= target.diffusion_max then
      return target
    end
  end
  return nil
end

function find_accent_intensity(accent_targets, amplitude)
  for _, target in ipairs(accent_targets or {}) do
    if target.id ~= "accent_metallic" and target.amplitude_min ~= nil and amplitude >= target.amplitude_min and amplitude <= target.amplitude_max then
      return target
    end
  end
  return nil
end

function find_metallic_accent(accent_targets, diffusion_ratio, amplitude)
  for _, target in ipairs(accent_targets or {}) do
    if target.id == "accent_metallic" and diffusion_ratio >= target.diffusion_min and diffusion_ratio <= target.diffusion_max and amplitude >= target.amplitude_min and amplitude <= target.amplitude_max then
      return target
    end
  end
  return nil
end

function breed_accent(parent_a, parent_b, offspring_vertex_count, offspring_irregularity, offspring_hue)
  local diffusion_a = parent_a.diffusion_ratio or 20
  local diffusion_b = parent_b.diffusion_ratio or 20
  local amplitude_a = parent_a.amplitude or 40
  local amplitude_b = parent_b.amplitude or 40
  local offspring_diffusion = (diffusion_a + diffusion_b) / 2
  local offspring_amplitude = (amplitude_a + amplitude_b) / 2
  local shape_complexity = ((offspring_vertex_count - 3) / 19) * 0.5 + (offspring_irregularity / 100) * 0.5
  offspring_diffusion = clamp(offspring_diffusion + (shape_complexity * 100 - offspring_diffusion) * 0.3, 0, 100)
  local diffusion_distance = math.abs(diffusion_a - diffusion_b) / 100
  offspring_amplitude = clamp(offspring_amplitude - diffusion_distance * 0.4 * 100, 0, 100)
  local accent_hue = (offspring_hue + 180 * (offspring_amplitude / 100)) % 360
  return { diffusion_ratio = offspring_diffusion, amplitude = offspring_amplitude, accent_hue = accent_hue }
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

function initiate_breeding(state, parent_a_id, parent_b_id, same_pair_streak, color_targets, active_target_regent, shape_targets, active_shape_target)
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

function is_slime_in_matching_culture_environment(slime, nodes)
  for _, node in ipairs(nodes or {}) do
    if node.owner_color == slime.color then return true end
  end
  return false
end

function calculate_worker_income(slime, has_auto_feeder, nodes)
  local income = 5
  if has_auto_feeder then income = income * 2 end
  if is_slime_in_matching_culture_environment(slime, nodes) then income = income * 2 end
  return income
end

function is_capitol_hardened(node, nodes)
  if not node.is_capitol or node.owner_color == nil then return false end
  for _, neighbor_id in ipairs(node.neighbors or {}) do
    local neighbor = find_by_id(nodes, neighbor_id)
    if neighbor == nil or neighbor.owner_color ~= node.owner_color then return false end
  end
  return true
end

function has_secure_capitol_garrison(state, node)
  if not node.is_capitol or node.owner_color == nil or node.strength < 1 then return false end
  for color, pressure in pairs(node.pressure or {}) do
    if color ~= node.owner_color and pressure > 0 then return false end
  end
  for _, slime in ipairs(state.slimes or {}) do
    if slime.locked_role == "garrison" and slime.garrisoned_at == node.id then return true end
  end
  return false
end

local CONTRACT_FLAVORS = {
  "Requesting high-density organic insulation cores. Do not ask for details regarding the thermal payload.",
  "Specimen requested to act as immediate chemical neutralizer in standard waste tanks.",
  "Urgent laboratory trial requirement for sub-cellular membrane shearing. Specimen will be disassembled.",
  "Corporate compliance requires bio-mass buffer reserves to meet annual asteroid operations quotas.",
  "Requested specimen matches target criteria for experimental neuro-network mapping. Energy discharge expected.",
  "A private investor demands a specimen of pristine coloration to decorate their terminal reservoir.",
  "Sub-orbital testing requires low-gravity biological payloads. High probability of orbital separation.",
}

local ASTRONAUT_THOUGHTS = {
  "LOG: Day 312. I watched the black hole devour a communication node today. The static lasted three minutes. Standard corporate response received immediately after: \"Keep breeding.\"",
  "LOG: Day 445. The slimes are the only warm things on this rock. They hum when I rest my hand on the glass. I wonder if they know we are both just debris.",
  "LOG: Day 519. The Corporation paid my monthly credits, but there is nothing to buy here except nutrient pellets and gene splicing regulators. They are literally paying me to feed their food.",
  "LOG: Day 608. One of the slimes was looking at the star charts today. Or maybe it was just reacting to the screen flicker. I choose to believe it wanted to see Earth.",
  "LOG: Day 722. It is quiet. So quiet that I can hear the refrigeration unit on the containment cells clicking. Cycle after cycle. We make slimes, we send them to the dark, and we repeat.",
  "LOG: Day 803. I called the corporate hotline. The automated voice informed me that my soul was a valuable regional asset. Then it played elevator music for three hours.",
}

function generate_contract(cycle)
  local colors = { "Red", "Blue", "Yellow", "Purple", "Orange", "Green" }
  local patterns = { "Solid", "Stripe", "Polka", "Glow", "Crown", "Ringed" }
  local color = colors[math.random(#colors)]
  local pattern = patterns[math.random(#patterns)]
  local reward_multiplier = 1
  if color == "Purple" or color == "Orange" or color == "Green" then reward_multiplier = reward_multiplier + 0.5 end
  if pattern ~= "Solid" then reward_multiplier = reward_multiplier + 0.5 end
  if pattern == "Glow" or pattern == "Crown" or pattern == "Ringed" then reward_multiplier = reward_multiplier + 0.8 end
  local base_credits = 100
  local credits_reward = math.floor(base_credits * reward_multiplier + math.random() * 30)
  local total_cycles = math.random(5, 8)
  local title_code = "RQ-" .. math.random(1000, 8999)
  return {
    id = "contract_" .. os.time() .. "_" .. math.random(100),
    title = "CONTRACT " .. title_code,
    required_color = color,
    required_pattern = pattern,
    credits_reward = credits_reward,
    cycles_remaining = total_cycles,
    total_cycles = total_cycles,
    flavor_text = CONTRACT_FLAVORS[math.random(#CONTRACT_FLAVORS)],
  }
end

function get_random_melancholic_log(cycle)
  return {
    id = "log_mel_" .. os.time(),
    cycle = cycle,
    text = ASTRONAUT_THOUGHTS[math.random(#ASTRONAUT_THOUGHTS)],
    type = "melancholy",
  }
end

local SLIME_NAME_PREFIXES = {
  "Specimen", "Subject", "Orbital", "Cinder", "Dusty", "Rusty", "Void",
  "Gloop", "Solder", "Glitch", "Slick", "Vapor", "Anode", "Cathode",
  "Zero", "Ion", "Debris", "Vector", "Echo", "Drift"
}
local SLIME_NAME_SUFFIXES = {
  "A-01", "B-12", "X", "Beta", "Omega", "Prime", "Zero", "09", "402",
  "77", "Core", "V", "Dampener", "Isotope", "Sol", "Flux", "Drifter", "Echo"
}

function generate_slime_name()
  local p = SLIME_NAME_PREFIXES[math.random(#SLIME_NAME_PREFIXES)]
  local s = SLIME_NAME_SUFFIXES[math.random(#SLIME_NAME_SUFFIXES)]
  return p .. "-" .. s
end

local HUE_MAP = { Red = 0, Orange = 60, Yellow = 120, Green = 180, Purple = 240, Blue = 300, Gray = 0 }

function create_seed_slime(color, pattern)
  color = color or "Red"
  pattern = pattern or "Solid"
  local hue = HUE_MAP[color] or 0
  local saturation = color == "Gray" and 0 or 100
  return {
    id = "slime_" .. os.time() .. "_" .. math.random(1000),
    name = generate_slime_name(),
    color = color,
    pattern = pattern,
    level = 1,
    xp = 0,
    stats = { hp = 100, atk = 10, def = 10, agi = 10, int = 10, chm = 10 },
    role = "idle",
    generation = 0,
    hue = hue,
    saturation = saturation,
    color_saturation = saturation,
    locked_role = nil,
  }
end

local BASE_REVOLT_FACTOR = 0.002
local GARRISON_RISK_REDUCTION_MULTIPLIER = 0.5

function update_planet_supply_and_pressure(nodes)
  if nodes == nil then return {}, {} end
  local logs = {}

  -- 1. Accumulate pressure
  local pressure_changes = {}
  for _, node in ipairs(nodes) do
    if node.owner_color and node.is_supplied then
      local pressure_amount = math.floor(5 + (node.strength or 0) * 10)
      for _, neighbor_id in ipairs(node.neighbors or {}) do
        local neighbor = find_by_id(nodes, neighbor_id)
        if neighbor and neighbor.owner_color ~= node.owner_color then
          if pressure_changes[neighbor_id] == nil then pressure_changes[neighbor_id] = {} end
          local current = pressure_changes[neighbor_id][node.owner_color] or 0
          pressure_changes[neighbor_id][node.owner_color] = current + pressure_amount
        end
      end
    end
  end

  -- Apply pressure changes & decay
  for _, node in ipairs(nodes) do
    local deltas = pressure_changes[node.id]
    if deltas then
      for color, amount in pairs(deltas) do
        node.pressure = node.pressure or {}
        node.pressure[color] = (node.pressure[color] or 0) + amount
      end
    end
    if node.pressure then
      for color, val in pairs(node.pressure) do
        if val > 0 then node.pressure[color] = math.max(0, val - 2) end
      end
    end
  end

  -- 2. Check for ownership flips and revolts
  local threshold = 100
  for _, node in ipairs(nodes) do
    local highest_foreign_color = nil
    local highest_foreign_pressure = 0
    if node.pressure then
      for color, val in pairs(node.pressure) do
        if color ~= node.owner_color and val > highest_foreign_pressure then
          highest_foreign_pressure = val
          highest_foreign_color = color
        end
      end
    end
    local defense = node.owner_color and math.floor((node.strength or 0) * 100) or 0
    if highest_foreign_pressure >= threshold and highest_foreign_pressure > defense then
      local old_owner = node.owner_color or "Unclaimed"
      table.insert(logs, "TERRITORY FLIP: Node [" .. (node.name or node.id) .. "] has collapsed under external pressure. Control transferred from " .. old_owner .. " to " .. (highest_foreign_color or "?") .. ".")
      node.owner_color = highest_foreign_color
      node.strength = 0.3
      node.pressure = {}
      node.is_capitol = false
      node.garrison_slime_id = nil
    else
      -- Revolt risk
      if node.owner_color then
        local is_garrisoned = node.garrison_slime_id ~= nil
        local total_foreign_pressure = 0
        if node.pressure then
          for color, val in pairs(node.pressure) do
            if color ~= node.owner_color then total_foreign_pressure = total_foreign_pressure + val end
          end
        end
        if total_foreign_pressure > 0 then
          local base_revolt_prob = total_foreign_pressure * BASE_REVOLT_FACTOR
          local final_revolt_prob = is_garrisoned and base_revolt_prob * GARRISON_RISK_REDUCTION_MULTIPLIER or base_revolt_prob
          local capped_revolt_prob = math.min(0.9, final_revolt_prob)
          if math.random() < capped_revolt_prob then
            table.insert(logs, "REVOLT: Node [" .. (node.name or node.id) .. "] has revolted due to unmitigated cultural pressure! Control reverted to Unclaimed.")
            node.owner_color = nil
            node.strength = 0
            node.pressure = {}
            node.is_capitol = false
            node.garrison_slime_id = nil
          end
        end
      end
      -- Steady stabilization or decay
      if node.owner_color then
        if node.is_supplied then
          node.strength = math.min(1.0, (node.strength or 0) + 0.02)
        else
          node.strength = math.max(0.1, (node.strength or 0) - 0.08)
        end
        node.strength = math.floor(node.strength * 1000) / 1000
      end
    end
  end

  -- 3. BFS Supply Chain from Capitols
  for _, n in ipairs(nodes) do n.is_supplied = false end
  for _, capitol in ipairs(nodes) do
    if capitol.is_capitol and capitol.owner_color then
      capitol.is_supplied = true
      local color = capitol.owner_color
      local queue = { capitol }
      local visited = { [capitol.id] = true }
      while #queue > 0 do
        local current = table.remove(queue, 1)
        for _, neighbor_id in ipairs(current.neighbors or {}) do
          local neighbor = find_by_id(nodes, neighbor_id)
          if neighbor and neighbor.owner_color == color and not visited[neighbor.id] then
            neighbor.is_supplied = true
            visited[neighbor.id] = true
            table.insert(queue, neighbor)
          end
        end
      end
    end
  end

  -- 4. Cascade collapse: unsupplied owned non-capitol nodes revert to Unclaimed
  for _, node in ipairs(nodes) do
    if node.owner_color and not node.is_supplied and not node.is_capitol then
      table.insert(logs, "SUPPLY COLLAPSE: Node [" .. (node.name or node.id) .. "] lost same-color supply line connection to its Capitol. Node reverted to Unclaimed.")
      node.owner_color = nil
      node.strength = 0
      node.pressure = {}
    end
  end

  return nodes, logs
end

function check_wilds_unlock_condition(slimes)
  for _, slime in ipairs(slimes or {}) do
    if slime.color == "Purple" or slime.color == "Orange" or slime.color == "Green" then
      return true
    end
  end
  return false
end

function advance_cycle(state)
  state.cycle = (state.cycle or 0) + 1

  -- Expire contracts
  for _, contract in ipairs(state.contracts or {}) do
    contract.cycles_remaining = contract.cycles_remaining - 1
  end
  for index = #(state.contracts or {}), 1, -1 do
    if state.contracts[index].cycles_remaining <= 0 then table.remove(state.contracts, index) end
  end

  -- Spawn new contracts (65% chance, cap 4, minimum 2)
  local contracts = state.contracts or {}
  if #contracts < 4 and (math.random() < 0.65 or #contracts < 2) then
    table.insert(contracts, generate_contract(state.cycle))
  end
  state.contracts = contracts

  -- Dual logging: deterministic cycle log + 45% chance flavor log
  if state.logs == nil then state.logs = {} end
  table.insert(state.logs, {
    id = "log_cycle_" .. os.time(),
    cycle = state.cycle,
    text = "CYCLE ADVANCED: Lab cycle " .. state.cycle .. " initiated. All energy cells replenished.",
    type = "system",
  })
  if math.random() < 0.45 then
    table.insert(state.logs, get_random_melancholic_log(state.cycle))
  end

  -- Worker income
  local nodes = state.planet_region and state.planet_region.nodes or {}
  for _, slime in ipairs(state.slimes or {}) do
    if slime.locked_role == "worker" then
      state.credits = (state.credits or 0) + calculate_worker_income(slime, state.has_auto_feeder == true, nodes)
    end
  end

  -- Capitol hardening bonus
  for _, node in ipairs(nodes) do
    if has_secure_capitol_garrison(state, node) and is_capitol_hardened(node, nodes) then
      state.credits = (state.credits or 0) + 15
    end
  end

  -- Planet territory simulation: supply/pressure, flips, revolts, cascade collapse
  local region = state.planet_region
  if region and region.nodes and #region.nodes > 0 then
    local sim_nodes, sim_logs = update_planet_supply_and_pressure(region.nodes)
    region.nodes = sim_nodes
    for _, sim_log in ipairs(sim_logs) do
      table.insert(state.logs, {
        id = "log_sim_" .. os.time() .. "_" .. math.random(1000),
        cycle = state.cycle,
        text = sim_log,
        type = "system",
      })
    end

    -- Stray generation on node flips (detect owner_color change)
    -- We detect flips by checking if a node has strength 0.3 and no garrison (post-flip state)
    -- and generate a stray matching the new owner color
    local slimes = state.slimes or {}
    for _, node in ipairs(region.nodes) do
      -- Check for recently flipped nodes (strength == 0.3, owner_color set, pressure cleared)
      -- This is a heuristic since we don't have prior state to compare
      -- We use the sim_logs to detect flips instead
    end
    -- Parse sim_logs for TERRITORY FLIP entries to generate strays
    for _, sim_log in ipairs(sim_logs) do
      if string.find(sim_log, "TERRITORY FLIP:") then
        -- Extract the new owner color from the log
        local new_color = string.match(sim_log, "to (%a+)%.")
        if new_color and #slimes < (state.roster_cap or 8) then
          local stray = create_seed_slime(new_color, "Solid")
          stray.id = "stray_flip_" .. os.time() .. "_" .. math.random(1000)
          stray.locked_role = "dispatch"
          stray.name = "Refugee " .. stray.name
          table.insert(slimes, stray)
          table.insert(state.logs, {
            id = "log_stray_flip_" .. os.time() .. "_" .. math.random(1000),
            cycle = state.cycle,
            text = "STRAY DETECTION: A stray " .. new_color .. " refugee fled the conflict zone and arrived at containment. lockedRole assigned to COMBAT/DISPATCH.",
            type = "combat",
          })
        end
      end
    end
    state.slimes = slimes
  end

  -- Wilds unlock check
  if not state.wilds_unlocked and check_wilds_unlock_condition(state.slimes) then
    state.wilds_unlocked = true
    table.insert(state.logs, {
      id = "log_wilds_unlock_" .. os.time(),
      cycle = state.cycle,
      text = "PLANETARY TELEMETRY: Secondary color genetic signature detected in containment cells. Ring-2 [The Wilds] region orbital connection established!",
      type = "system",
    })
  end

  -- Prune recent_market_sales to 5-cycle window
  local kept_sales = {}
  for _, record in ipairs(state.recent_market_sales or {}) do
    if record.cycle >= state.cycle - 4 then table.insert(kept_sales, record) end
  end
  state.recent_market_sales = kept_sales

  return state
end
