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

local WANDERER_REQUEST_MAX = 3
local WANDERER_PREMIUM_MULTI = 3.0

function create_wanderer_petition(cycle, active_petitions)
  if #(active_petitions or {}) >= WANDERER_REQUEST_MAX then return nil, "Wanderer petition capacity reached" end
  local colors = { "Red", "Blue", "Yellow", "Purple", "Orange", "Green", "Gray" }
  local shapes = { "Triangle", "Square", "Circle", "Star", "Diamond", "Teardrop", "Pentagon", "Crescent", "Hexa", "Crown" }
  local require_color = math.random() > 0.3
  local require_shape = math.random() > 0.3
  local has_color = require_color or not require_shape
  local has_shape = require_shape or not require_color
  local target_color = has_color and colors[math.random(#colors)] or nil
  local target_shape = has_shape and shapes[math.random(#shapes)] or nil
  local color_tier = target_color and get_color_tier(target_color) or 1.5
  local shape_tier = target_shape and get_shape_tier(target_shape) or 1.5
  local reward = math.floor(color_tier * shape_tier * 10 * WANDERER_PREMIUM_MULTI)
  local total_cycles = math.random(5, 8)
  return {
    id = "petition_wanderer_" .. os.time() .. "_" .. math.random(1000),
    source = "wanderer",
    requested_color = target_color,
    requested_shape = target_shape,
    payout_multiplier = WANDERER_PREMIUM_MULTI,
    reward = reward,
    expires_cycle = cycle + total_cycles,
  }, nil
end

function fulfill_petition(state, petition_id, slime_id)
  local petition = find_by_id(state.petitions, petition_id)
  local slime = find_by_id(state.slimes, slime_id)
  if petition == nil or slime == nil then return nil, "Petition or slime not found" end
  if (state.cycle or 0) > petition.expires_cycle then return nil, "Petition expired" end
  if petition.requested_color ~= nil and slime.color ~= petition.requested_color then return nil, "Slime does not match petition color" end
  if petition.requested_shape ~= nil and snap_to_shape_name(slime.vertex_count or 4, slime.irregularity or 10) ~= petition.requested_shape then return nil, "Slime does not match petition shape" end
  local payout = petition.reward or math.floor(100 * petition.payout_multiplier)
  state.credits = (state.credits or 0) + payout
  for index, current in ipairs(state.petitions) do
    if current.id == petition_id then
      table.remove(state.petitions, index)
      break
    end
  end
  return { payout = payout, fulfilled_slime_id = slime_id }, nil
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

function create_seed_slime(color, pattern, color_specs)
  color = color or "Red"
  pattern = pattern or "Solid"
  local hue = HUE_MAP[color] or 0
  local saturation = color == "Gray" and 0 or 100
  local seed_shape = SEED_SHAPE_DEFAULTS[color] or { vertex_count = 4, irregularity = 10 }
  local stats
  if color_specs ~= nil then
    stats = calculate_stats(color, 1, hue, saturation, seed_shape.vertex_count, seed_shape.irregularity, color_specs)
  else
    stats = { hp = 100, atk = 10, def = 10, agi = 10, int = 10, chm = 10 }
  end
  return {
    id = "slime_" .. os.time() .. "_" .. math.random(1000),
    name = generate_slime_name(),
    color = color,
    pattern = pattern,
    level = 1,
    xp = 0,
    stats = stats,
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