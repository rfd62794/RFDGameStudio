-- games/wire_rust/logic.lua
-- Core game loop and synergy resolution for Wire & Rust.
-- Utilizes the shared inventory.lua system and resolution.lua primitives.

local function copy_table(t)
  if type(t) ~= "table" then return t end
  local c = {}
  for k, v in pairs(t) do
    if type(v) == "table" then
      c[k] = copy_table(v)
    else
      c[k] = v
    end
  end
  return c
end

-- Initialize starting game state
function init_game(data)
  local hp = data.constants.base_hp or 50
  local scrap = data.constants.base_scrap or 10
  
  local player = {
    hp = hp,
    scrap = scrap,
    current_room_id = data.constants.start_room or "junk_heap",
    inventory = { items = {} }, -- handled by systems/inventory.lua
    hand = {},
    discard = {},
    deck = {
      { id = "copper_rod", quantity = 3 },
      { id = "zinc_plate", quantity = 3 },
      { id = "iron_block", quantity = 2 },
      { id = "lead_solder", quantity = 2 }
    }
  }
  
  -- Shuffle/draw initial hand
  player = draw_hand(player)
  return player
end

-- Helper to draw 3-5 cards
function draw_hand(player)
  local next_player = copy_table(player)
  
  -- Gather all cards in deck
  local deck_cards = {}
  for _, it in ipairs(collect(next_player.deck or {})) do
    for i = 1, (it.quantity or 1) do
      table.insert(deck_cards, it.id)
    end
  end
  
  -- Shuffle helper
  local n = #deck_cards
  for i = n, 2, -1 do
    local j = math.random(i)
    deck_cards[i], deck_cards[j] = deck_cards[j], deck_cards[i]
  end
  
  -- Draw 4 cards
  local hand = {}
  local drawn_count = math.min(4, #deck_cards)
  for i = 1, drawn_count do
    table.insert(hand, deck_cards[i])
  end
  
  next_player.hand = hand
  return next_player
end

-- Get chemistry synergies from hand
function get_synergies(hand)
  local elements = {}
  for _, card_id in ipairs(collect(hand)) do
    if card_id == "copper_rod" then elements["copper"] = true end
    if card_id == "zinc_plate" then elements["zinc"] = true end
    if card_id == "iron_block" then elements["iron"] = true end
    if card_id == "lead_solder" then elements["lead"] = true end
  end
  
  local synergies = {}
  local bonus = 0
  if elements["copper"] and elements["zinc"] then
    table.insert(synergies, "Brass")
    bonus = bonus + 3
  end
  if elements["lead"] and elements["copper"] then
    table.insert(synergies, "Bronze")
    bonus = bonus + 2
  end
  if elements["iron"] and elements["zinc"] then
    table.insert(synergies, "Steel")
    bonus = bonus + 4
  end
  
  return { synergies = synergies, bonus = bonus }
end

-- Move to another room
function move_room(data, player, target_room_id)
  local current_room = data.rooms[player.current_room_id]
  if not current_room then return player end
  
  local can_move = false
  for _, conn in ipairs(collect(current_room.connections)) do
    if conn == target_room_id then
      can_move = true
      break
    end
  end
  
  if not can_move then return player end
  
  local next_player = copy_table(player)
  next_player.current_room_id = target_room_id
  next_player = draw_hand(next_player)
  return next_player
end

-- Resolve encounter using selected card and roll
function resolve_encounter(data, player, card_id, roll)
  local current_room = data.rooms[player.current_room_id]
  if not current_room then return { player = player, won = false } end
  
  -- 1. Calculate stats and modifier
  local card = data.cards[card_id]
  local combat_mod = card and card.combat_mod or 0
  
  -- Calculate hand chemistry bonus
  local res = get_synergies(player.hand)
  local synergies = res.synergies
  local chem_bonus = res.bonus or 0
  
  local total_score = roll + combat_mod + chem_bonus
  local target_difficulty = current_room.difficulty or 10
  
  -- D20 combat check using resolve_check primitive
  local won = resolve_check(roll + combat_mod + chem_bonus, target_difficulty, 1) -- override variance=1 to act as exact check
  local next_player = copy_table(player)
  
  if won then
    -- Gain scrap
    local scrap_gained = math.random(3) + 2
    next_player.scrap = next_player.scrap + scrap_gained
    -- Use inventory primitive to add item
    next_player.inventory = add_item(next_player.inventory, card_id)
  else
    -- Lose HP
    local hp_lost = math.random(5) + 5
    next_player.hp = math.max(0, next_player.hp - hp_lost)
  end
  
  -- Discard/cycle card used from hand
  local next_hand = {}
  for _, c in ipairs(collect(player.hand)) do
    if c ~= card_id then
      table.insert(next_hand, c)
    end
  end
  next_player.hand = next_hand
  
  return {
    player = next_player,
    won = won,
    total_score = total_score,
    difficulty = target_difficulty,
    roll = roll,
    synergies = synergies,
    bonus = chem_bonus
  }
end
