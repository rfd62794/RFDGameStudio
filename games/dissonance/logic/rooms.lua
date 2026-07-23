-- Dissonance Depths — Room, Reward, and Map helpers
-- Ported from src/logic/rewards.ts / src/logic/rooms.ts

local function ensure_collect(t)
  if type(t) ~= "table" then return {} end
  if collect then return collect(t) end
  local out = {}
  for _, v in ipairs(t) do table.insert(out, v) end
  return out
end

local RELATION_BY_TIER = {
  basic = "single",
  advanced = "same",
  elite = "adjacent",
  master = "opposed",
}

local function card_pool_from_data(data)
  local pool = {}
  local map = data.card_name_map or {}
  for key, name in pairs(map) do
    local parts = {}
    for part in string.gmatch(key, "[^_]+") do table.insert(parts, part) end
    if #parts == 3 then
      local el1 = parts[1]
      local el2_raw = parts[2]
      local component = parts[3]
      local el2 = (el2_raw == "none") and nil or el2_raw
      local canonical = canonicalize_elements(el1, el2)
      local c_el1, c_el2 = canonical[1], canonical[2]
      local relation_type = "single"
      if c_el2 then
        if c_el1 == c_el2 then
          relation_type = "same"
        else
          local idx1, idx2 = nil, nil
          for i, e in ipairs({"ember", "ash", "spark", "cinder"}) do
            if e == c_el1 then idx1 = i end
            if e == c_el2 then idx2 = i end
          end
          local diff = math.abs((idx1 or 1) - (idx2 or 1))
          if diff == 1 or diff == 3 then
            relation_type = "adjacent"
          else
            relation_type = "opposed"
          end
        end
      end
      table.insert(pool, {
        id = key,
        name = name,
        el1 = c_el1,
        el2 = c_el2,
        component = component,
        relationType = relation_type,
      })
    end
  end
  return pool
end

local function filter_pool(pool, predicate)
  local out = {}
  for _, item in ipairs(pool) do
    if predicate(item) then table.insert(out, item) end
  end
  return out
end

local function has_id(list, id)
  for _, v in ipairs(list) do
    if v == id or (type(v) == "table" and v.id == id) then return true end
  end
  return false
end

function generate_fixed_reward(max_hp, owned_card_ids, held_boon_ids, held_relic_ids, enemy_tier, data)
  owned_card_ids = ensure_collect(owned_card_ids)
  held_boon_ids = ensure_collect(held_boon_ids)
  held_relic_ids = ensure_collect(held_relic_ids)

  local target_relation = RELATION_BY_TIER[enemy_tier] or "single"
  local all_cards = card_pool_from_data(data)
  local card_pool = filter_pool(all_cards, function(c)
    return c.relationType == target_relation and not has_id(owned_card_ids, c.id)
  end)

  local all_boons = ensure_collect(data.boons)
  local boon_pool = filter_pool(all_boons, function(b)
    if b.tier ~= enemy_tier then return false end
    if has_id(held_boon_ids, b.id) then return false end
    if b.requiresBoonId and not has_id(held_boon_ids, b.requiresBoonId) then return false end
    return true
  end)

  local heal_amount = math.floor(max_hp * 0.4 + 0.5)
  local slots = {}
  table.insert(slots, { kind = "heal", amount = heal_amount })

  if #card_pool > 0 then
    local c = card_pool[math.random(#card_pool)]
    table.insert(slots, { kind = "card", cardId = c.id })
  else
    table.insert(slots, { kind = "heal", amount = heal_amount })
  end

  if #boon_pool > 0 then
    local b = boon_pool[math.random(#boon_pool)]
    table.insert(slots, { kind = "benefit", boonId = b.id })
  else
    table.insert(slots, { kind = "heal", amount = heal_amount })
  end

  local relic_upgrade_chance = 0.10
  local all_relics = ensure_collect(data.relics)
  local eligible_relics = filter_pool(all_relics, function(r)
    return not has_id(held_relic_ids, r.id)
  end)
  if math.random() < relic_upgrade_chance and #eligible_relics > 0 then
    local slot_idx = math.random(#slots)
    local r = eligible_relics[math.random(#eligible_relics)]
    slots[slot_idx] = { kind = "relic", relicId = r.id }
  end

  return slots
end

function _diagnostic_card_pool(data)
  return card_pool_from_data(data)
end

function _diagnostic_filtered_pool(current_unlocked, enemy_tier, data)
  current_unlocked = ensure_collect(current_unlocked)
  local target_relation = RELATION_BY_TIER[enemy_tier] or "single"
  local all_cards = card_pool_from_data(data)
  local pool = filter_pool(all_cards, function(c)
    return c.relationType == target_relation and not has_id(current_unlocked, c.id)
  end)
  return { total = #all_cards, filtered = #pool, relation = target_relation }
end

function generate_reward(current_unlocked, enemy_tier, data)
  current_unlocked = ensure_collect(current_unlocked)
  local target_relation = RELATION_BY_TIER[enemy_tier] or "single"
  local all_cards = card_pool_from_data(data)
  local pool = filter_pool(all_cards, function(c)
    return c.relationType == target_relation and not has_id(current_unlocked, c.id)
  end)

  -- Fisher-Yates shuffle
  for i = #pool, 2, -1 do
    local j = math.random(i)
    pool[i], pool[j] = pool[j], pool[i]
  end

  local slots = {}
  for i = 1, math.min(3, #pool) do
    table.insert(slots, pool[i].id)
  end
  return { slots = slots }
end

function generate_opening_pack(data)
  local actions = { "sever", "guard", "mend", "unmake" }
  local elements = { "ember", "ash", "spark", "cinder" }
  for i = #elements, 2, -1 do
    local j = math.random(i)
    elements[i], elements[j] = elements[j], elements[i]
  end

  local pack = {}
  local map = data.card_name_map or {}
  for i, action in ipairs(actions) do
    local element = elements[i]
    local card_id = element .. "_none_" .. action
    table.insert(pack, {
      action = action,
      element = element,
      cardId = card_id,
      name = map[card_id] or card_id,
    })
  end
  return pack
end

-- Deterministic LCG helper used elsewhere in the prototype.
local function lcg(seed)
  local s = seed
  return function()
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  end
end

function resolve_rest_or_attachment(seed, current_node_id, current_floor, has_loaded_ledger, is_pre_boss, data)
  local rand = lcg(seed)
  local key = tostring(current_node_id) .. "_rest_or_roll"
  for i = 1, #key do
    rand()
  end

  current_floor = current_floor or 1
  has_loaded_ledger = has_loaded_ledger or false
  is_pre_boss = is_pre_boss or false

  local weights = (data and data.rest_or_weights and data.rest_or_weights[current_floor]) or { peek = 0.7, gift = 0.15, treasure = 0.15 }

  if is_pre_boss then
    if has_loaded_ledger then
      return weights.gift >= weights.treasure and "gift" or "treasure"
    end
    return rand() < 0.5 and "gift" or "treasure"
  end

  if has_loaded_ledger then
    if weights.gift > weights.peek and weights.gift >= weights.treasure then return "gift" end
    if weights.treasure > weights.peek and weights.treasure >= weights.gift then return "treasure" end
    return "peek"
  end

  local r = rand()
  if r < weights.peek then return "peek" end
  if r < weights.peek + weights.gift then return "gift" end
  return "treasure"
end
