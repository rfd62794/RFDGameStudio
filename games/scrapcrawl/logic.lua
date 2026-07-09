-- scrapcrawl/logic.lua — Phase A core loop port
-- Faithful port of the certified ScrapCrawl TS implementation.
-- All randomness is caller-owned where determinism matters; otherwise math.random.

local function clamp(val, min, max)
  return math.max(min, math.min(max, val))
end

-- Cross-runtime helper: YAML numeric keys may arrive as integers (lupa), strings
-- (fengari object keys), or floats (fengari JS numbers). Try all reasonable forms.
local function lookup_tier(map, tier)
  if map == nil then return nil end
  local as_num = tonumber(tier)
  if as_num ~= nil then
    local as_int = math.floor(as_num + 0.5)
    return map[as_int] or map[tostring(as_int)] or map[tostring(as_num)]
  end
  return map[tier]
end

local function copy_table(t)
  if type(t) ~= "table" then return t end
  local c = {}
  for k, v in pairs(t) do
    c[k] = v
  end
  return c
end

local function shallow_copy_player(player)
  local next = copy_table(player)
  next.equipped = copy_table(player.equipped)
  next.proficiencyXp = copy_table(player.proficiencyXp)
  next.roster = copy_table(player.roster)
  next.sculptedCache = copy_table(player.sculptedCache)
  return next
end

-- ============================================================
-- ROOMS
-- ============================================================

function get_room(data, room_id)
  local room = data.rooms[room_id]
  if room == nil then
    error('Room with ID "' .. tostring(room_id) .. '" not found.')
  end
  return room
end

function can_move_to(data, from_room_id, to_room_id)
  local from_room = data.rooms[from_room_id]
  if from_room == nil then return false end
  for _, conn in ipairs(from_room.connections or {}) do
    if conn == to_room_id then return true end
  end
  return false
end

function move_player(data, player, to_room_id)
  if not can_move_to(data, player.currentRoomId, to_room_id) then
    return player
  end
  local next = shallow_copy_player(player)
  next.currentRoomId = to_room_id
  return next
end

-- ============================================================
-- PROFICIENCY / GROWTH
-- ============================================================

function growth_factor(data, xp)
  local ceiling = data.constants.proficiency_xp_ceiling
  local ratio = xp / ceiling
  return clamp(0.8 + ratio * 0.7, 0.8, 1.5)
end

-- ============================================================
-- CRAFTING
-- ============================================================

function can_craft(data, player, catalog_id, tier)
  local entry = data.catalog[catalog_id]
  if entry == nil then return false end

  -- Tool is a one-time gate, not equippable.
  if catalog_id == "tool" then
    if player.tier2Unlocked then return false end
    local cost = lookup_tier(entry.tierCost, 1)
    return player.scrap >= cost
  end

  local resolved_tier = tier or (player.tier2Unlocked and 2 or 1)
  if resolved_tier == 2 and not player.tier2Unlocked then
    return false
  end

  local cost = lookup_tier(entry.tierCost, resolved_tier)
  return player.scrap >= cost
end

function craft(data, player, catalog_id, tier)
  local entry = data.catalog[catalog_id]
  if entry == nil then
    error('Crafting rejected: Catalog entry for "' .. tostring(catalog_id) .. '" does not exist.')
  end

  if catalog_id == "tool" and player.tier2Unlocked then
    error('Crafting rejected: Tool already crafted and Tier 2 unlocked.')
  end

  local resolved_tier = catalog_id == "tool" and 1 or (tier or (player.tier2Unlocked and 2 or 1))

  if resolved_tier == 2 and not player.tier2Unlocked then
    error('Crafting rejected: Attempted Tier 2 craft for "' .. tostring(catalog_id) .. '" but Tier 2 is locked (Tool required).')
  end

  local cost = lookup_tier(entry.tierCost, resolved_tier)
  if player.scrap < cost then
    error('Crafting rejected: Insufficient scrap to craft "' .. tostring(catalog_id) .. '" (Tier ' .. tostring(resolved_tier) .. '). Cost: ' .. tostring(cost) .. ', available: ' .. tostring(player.scrap) .. '.')
  end

  local next = shallow_copy_player(player)
  next.scrap = player.scrap - cost

  if catalog_id == "tool" then
    next.tier2Unlocked = true
    return next
  end

  local slot = entry.slot
  local max_life = lookup_tier(entry.maxLife, resolved_tier)
  local new_equipment = {
    id = catalog_id .. "_" .. tostring(math.random(100000, 999999)),
    slot = slot,
    catalogId = catalog_id,
    tier = resolved_tier,
    life = max_life,
    maxLife = max_life,
  }

  next.equipped[slot] = new_equipment
  return next
end

-- ============================================================
-- COMBAT
-- ============================================================

local function room_has_interaction(room, interaction)
  local types = room.interaction_types or room.interactionTypes or {}
  for _, t in ipairs(types) do
    if t == interaction then return true end
  end
  return false
end

function resolve_fight(data, player, room, roll, scrap_reward)
  if not room_has_interaction(room, "fight") then
    error('Cannot fight in room "' .. tostring(room.id) .. '" — not a fight-capable room.')
  end

  local difficulty = room.difficulty or 0

  local weapon = player.equipped.weapon
  local has_active_weapon = weapon and weapon.life > 0
  local weapon_atk = data.constants.unarmed_baseline_atk
  if has_active_weapon then
    local base_stats = lookup_tier(data.catalog[weapon.catalogId].baseStats, weapon.tier)
    weapon_atk = (lookup_tier(base_stats, "atk") or 0)
  end

  local proficiency_xp = player.proficiencyXp.weapon or 0
  local contribution = weapon_atk * growth_factor(data, proficiency_xp)

  local used_roll = roll or math.random(1, 20)
  local score = used_roll + contribution
  local won = score >= difficulty

  local next = shallow_copy_player(player)

  -- Deplete weapon life on every fight, even if broken (stays at 0).
  if weapon then
    local updated_weapon = copy_table(weapon)
    updated_weapon.life = math.max(0, weapon.life - 1)
    next.equipped.weapon = updated_weapon
  end

  local scrap_gained = 0
  if won then
    scrap_gained = scrap_reward or math.random(data.constants.scrap_reward_min, data.constants.scrap_reward_max)
    next.scrap = next.scrap + scrap_gained

    next.proficiencyXp.weapon = (next.proficiencyXp.weapon or 0) + data.constants.proficiency_win_xp
  end

  return {
    won = won,
    scrap_gained = scrap_gained,
    roll = used_roll,
    score = score,
    difficulty = difficulty,
    player = next,
  }
end

-- ============================================================
-- LIFECYCLE
-- ============================================================

function init_player()
  return {
    currentRoomId = "home_base",
    scrap = 0,
    tier2Unlocked = false,
    equipped = {},
    proficiencyXp = {
      weapon = 0,
      shield = 0,
      armor = 0,
    },
    roster = {},
    activeCompanionId = nil,
    sculptedCache = {},
  }
end

function reset_position(player)
  local next = shallow_copy_player(player)
  next.currentRoomId = "home_base"
  return next
end
