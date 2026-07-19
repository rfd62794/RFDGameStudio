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