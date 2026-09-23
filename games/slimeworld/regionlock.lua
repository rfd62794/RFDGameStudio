-- regionlock.lua — Region Lock-Down resolution
-- Checks a bred slime's genetics against region_locks data.
-- On match, marks the region permanently unlocked in state.region_unlocks.
-- Reuses match_color_target, match_shape_target, find_accent_type,
-- find_accent_intensity, find_metallic_accent from breeding.lua.

-- Check if a region is already unlocked (permanence: once unlocked, never re-locked).
function is_region_unlocked(state, node_id)
  if state.region_unlocks == nil then return false end
  return state.region_unlocks[node_id] == true
end

-- Check if a node is a free Capitol (always accessible, no lock needed).
function is_capitol_node(node)
  return node ~= nil and node.is_capitol == true
end

-- Check if a target node is accessible: either unlocked, a capitol, or has no lock.
function is_node_accessible(state, node_id, region_locks)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil then return false, "Node not found" end
  if is_capitol_node(node) then return true, nil end
  if is_region_unlocked(state, node_id) then return true, nil end
  -- Check if this node even has a region lock
  if region_locks ~= nil then
    for _, lock in ipairs(region_locks) do
      if lock.node_id == node_id then return false, "Region is locked" end
    end
  end
  -- No lock entry means no restriction
  return true, nil
end

-- Check if a slime's accent matches any of the required accent target IDs.
-- For diffusion-type locks: check find_accent_type (excludes Metallic).
-- For amplitude-type locks: check find_accent_intensity (excludes Metallic).
-- For metallic-type locks: check find_metallic_accent (dual-axis).
function check_accent_match(slime, lock, accent_targets)
  if accent_targets == nil then return false end
  local diffusion = slime.diffusion_ratio or 0
  local amplitude = slime.amplitude or 0
  if lock.accent_type == "metallic" then
    local match = find_metallic_accent(accent_targets, diffusion, amplitude)
    return match ~= nil
  end
  for _, target_id in ipairs(lock.accent_target_ids or {}) do
    for _, target in ipairs(accent_targets) do
      if target.id == target_id then
        if lock.accent_type == "diffusion" then
          if target.diffusion_min ~= nil and diffusion >= target.diffusion_min and diffusion <= target.diffusion_max then
            return true
          end
        elseif lock.accent_type == "amplitude" then
          if target.amplitude_min ~= nil and amplitude >= target.amplitude_min and amplitude <= target.amplitude_max then
            return true
          end
        end
      end
    end
  end
  return false
end

-- Check if a slime's shape matches a given shape tier.
function check_shape_tier_match(slime, shape_tier, shape_targets)
  if shape_tier == nil then return true end -- No shape requirement
  if shape_targets == nil then return false end
  local matched_id = match_shape_target(slime.vertex_count or 4, slime.irregularity or 10, shape_targets)
  if matched_id == nil then return false end
  for _, target in ipairs(shape_targets) do
    if target.id == matched_id and target.tier == shape_tier then
      return true
    end
  end
  return false
end

-- Check Convergence prerequisites: all 17 other non-capitol regions must be unlocked.
function check_convergence_prerequisites(state, lock)
  if lock.prerequisites == nil then return true end
  for _, prereq_node_id in ipairs(lock.prerequisites) do
    if not is_region_unlocked(state, prereq_node_id) then
      return false
    end
  end
  return true
end

-- Check a single bred slime against a single region lock.
-- Returns true if the slime matches all components of the lock.
function check_slime_against_lock(slime, lock, color_targets, shape_targets, accent_targets, state)
  -- Convergence: no color/shape requirement, but needs prerequisites + Metallic accent
  if lock.accent_type == "metallic" then
    if not check_convergence_prerequisites(state, lock) then return false end
    return check_accent_match(slime, lock, accent_targets)
  end
  -- Standard lock: color target + shape tier + accent band
  local color_match = false
  if lock.color_target_id ~= nil and color_targets ~= nil then
    local matched_id = match_color_target(slime.hue or 0, slime.saturation or 0, color_targets)
    color_match = (matched_id == lock.color_target_id)
  end
  local shape_match = check_shape_tier_match(slime, lock.shape_tier, shape_targets)
  local accent_match = check_accent_match(slime, lock, accent_targets)
  return color_match and shape_match and accent_match
end

-- Check a newly bred slime against all region locks.
-- If any match, mark those regions as permanently unlocked.
-- Returns the list of newly unlocked node_ids.
function check_region_unlocks(state, slime, region_locks, color_targets, shape_targets, accent_targets)
  if region_locks == nil then return {} end
  if state.region_unlocks == nil then state.region_unlocks = {} end
  local newly_unlocked = {}
  for _, lock in ipairs(region_locks) do
    -- Skip already-unlocked regions (permanence: no re-locking, no duplicate work)
    if not is_region_unlocked(state, lock.node_id) then
      if check_slime_against_lock(slime, lock, color_targets, shape_targets, accent_targets, state) then
        state.region_unlocks[lock.node_id] = true
        table.insert(newly_unlocked, lock.node_id)
      end
    end
  end
  return newly_unlocked
end
