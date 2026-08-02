-- favors.lua — Culture Favors: procedural requests generated from real
-- per-node pressure state. The on-ramp to Fealty.
--
-- Design (per SlimeWorld_Design_Rev2.md):
--   Favors are generated after each cycle's supply/pressure simulation,
--   reflecting the real, just-updated state of the map. A Favor targets
--   a single node where a culture is under foreign pressure. Fulfilling
--   it via Mediation (extend existing resolver) or Disposal (sacrifice a
--   slime) increments culture_relationships toward 100%.
--
-- Increment values (proposed, pending Robert's review — same discipline
-- as Stage-Make-Real's Elder breeding tax):
--   Mediation fulfillment: +5  (slow, quiet path)
--   Disposal fulfillment:  +15 (stronger, costs a real slime)
--   Fealty triggers at:     100
--
-- §2c design choice: Extend Mediation (option a). Mediation already
-- targets a single node with a party of slimes — a Favor maps 1:1 to a
-- node. On successful Mediation of a node with an active Favor, also
-- reduce pressure and increment culture_relationships. This reuses
-- tested code with a minimal extension rather than building a parallel
-- resolution system.

local FAVOR_CAP = 4
local FAVOR_PRESSURE_THRESHOLD = 20
local MEDIATION_FAVOR_INCREMENT = 5
local DISPOSAL_FAVOR_INCREMENT = 15
local FEALTY_THRESHOLD = 100

function generate_favors(nodes, existing_favors)
  if #existing_favors >= FAVOR_CAP then return existing_favors end
  local favors = {}
  for _, f in ipairs(existing_favors) do table.insert(favors, f) end
  for _, node in ipairs(nodes or {}) do
    if #favors >= FAVOR_CAP then break end
    if not node.fealty_locked and node.owner_color and node.owner_color ~= "Gray" then
      for pressure_color, amount in pairs(node.pressure or {}) do
        if pressure_color ~= node.owner_color and amount >= FAVOR_PRESSURE_THRESHOLD then
          local exists = false
          for _, f in ipairs(favors) do
            if f.node_id == node.id then exists = true break end
          end
          if not exists then
            table.insert(favors, {
              id = "favor_" .. os.time() .. "_" .. math.random(1000),
              culture = node.owner_color,
              node_id = node.id,
              node_name = node.name or node.id,
              pressure_color = pressure_color,
              pressure_amount = amount,
            })
          end
          break
        end
      end
    end
  end
  return favors
end

function find_favor_for_node(favors, node_id)
  for _, f in ipairs(favors or {}) do
    if f.node_id == node_id then return f end
  end
  return nil
end

function fulfill_favor_via_mediation(state, node, favor)
  local culture = favor.culture
  local pressure_color = favor.pressure_color
  if node.pressure and node.pressure[pressure_color] then
    node.pressure[pressure_color] = math.max(0, node.pressure[pressure_color] - 30)
  end
  if not state.culture_relationships then state.culture_relationships = {} end
  local current = state.culture_relationships[culture] or 0
  if current < FEALTY_THRESHOLD then
    state.culture_relationships[culture] = math.min(FEALTY_THRESHOLD, current + MEDIATION_FAVOR_INCREMENT)
  end
  for i, f in ipairs(state.favors or {}) do
    if f.id == favor.id then
      table.remove(state.favors, i)
      break
    end
  end
  return true
end

function resolve_disposal(state, slime_id, favor_id)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return false, "Slime not found" end
  local favor = nil
  for _, f in ipairs(state.favors or {}) do
    if f.id == favor_id then favor = f break end
  end
  if favor == nil then return false, "Favor not found" end
  for i, s in ipairs(state.slimes) do
    if s.id == slime_id then
      table.remove(state.slimes, i)
      break
    end
  end
  local node = find_by_id(state.planet_region and state.planet_region.nodes, favor.node_id)
  if node and node.pressure then
    for color, _ in pairs(node.pressure) do
      if color ~= node.owner_color then
        node.pressure[color] = 0
      end
    end
  end
  if not state.culture_relationships then state.culture_relationships = {} end
  local current = state.culture_relationships[favor.culture] or 0
  if current < FEALTY_THRESHOLD then
    state.culture_relationships[favor.culture] = math.min(FEALTY_THRESHOLD, current + DISPOSAL_FAVOR_INCREMENT)
  end
  for i, f in ipairs(state.favors or {}) do
    if f.id == favor_id then
      table.remove(state.favors, i)
      break
    end
  end
  return true, nil
end

function check_fealty_transition(state)
  local transitions = {}
  if not state.culture_relationships then return transitions end
  for color, rel in pairs(state.culture_relationships) do
    if rel >= FEALTY_THRESHOLD then
      local nodes = state.planet_region and state.planet_region.nodes or {}
      for _, node in ipairs(nodes) do
        if node.owner_color == color and not node.fealty_locked then
          node.fealty_locked = true
          node.owner_color = "Gray"
          node.strength = 1.0
          node.pressure = {}
          table.insert(transitions, {
            color = color,
            node_id = node.id,
            node_name = node.name or node.id,
          })
        end
      end
    end
  end
  return transitions
end
