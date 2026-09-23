-- Dissonance Depths — Discovery / Codex tracking
-- Tracks which cards, boons, relics, enemies, and room types have been seen.

local DISCOVERY_KEYS = {
  card = "discoveredCards",
  cards = "discoveredCards",
  boon = "discoveredBoons",
  boons = "discoveredBoons",
  relic = "discoveredRelics",
  relics = "discoveredRelics",
  enemy = "discoveredEnemies",
  enemies = "discoveredEnemies",
  room_type = "discoveredRoomTypes",
  room_types = "discoveredRoomTypes",
  roomType = "discoveredRoomTypes",
  room = "discoveredRoomTypes",
}

local function key_for(category)
  return DISCOVERY_KEYS[category] or category
end

local function shallow_copy(t)
  local c = {}
  if type(t) == "table" then
    for k, v in pairs(t) do c[k] = v end
  end
  return c
end

function is_discovered(discovery_state, category, id)
  local state = discovery_state or {}
  local key = key_for(category)
  local bucket = state[key]
  if type(bucket) ~= "table" then return false end
  return bucket[id] == true
end

function record_discovery(discovery_state, category, id)
  local state = shallow_copy(discovery_state or {})
  local key = key_for(category)
  if not state[key] then state[key] = {} end
  local bucket = shallow_copy(state[key])
  bucket[id] = true
  state[key] = bucket
  return state
end

function record_card_discovery(discovery_state, card_id)
  return record_discovery(discovery_state, "cards", card_id)
end

function record_boon_discovery(discovery_state, boon_id)
  return record_discovery(discovery_state, "boons", boon_id)
end

function record_relic_discovery(discovery_state, relic_id)
  return record_discovery(discovery_state, "relics", relic_id)
end

function record_enemy_discovery(discovery_state, enemy_id)
  return record_discovery(discovery_state, "enemies", enemy_id)
end

function record_room_type_discovery(discovery_state, room_type)
  return record_discovery(discovery_state, "room_types", room_type)
end

function get_discovery_summary(discovery_state)
  local state = discovery_state or {}
  local counts = {}
  for _, key in ipairs({"discoveredCards", "discoveredBoons", "discoveredRelics", "discoveredEnemies", "discoveredRoomTypes"}) do
    local bucket = state[key]
    local n = 0
    if type(bucket) == "table" then
      for _ in pairs(bucket) do n = n + 1 end
    end
    counts[key] = n
  end
  return counts
end
