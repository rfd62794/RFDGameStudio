-- Dissonance Depths — Run State, Map Generation, and Deck/Hand Management
-- Ported from tmp/dissonance-src/src/logic/mapGraph.ts, logic/deck.ts,
-- state/runState.ts.
--
-- This module did NOT exist after the initial port directive — only pure
-- combat/build/reward/discovery calculations were ported. Map generation,
-- run-state phase transitions, and deck/hand management are real game logic
-- that the renderer directive requires to exist in Lua (not TypeScript).
-- Added here, anchor-tested against the TS baseline in
-- tests/test_dissonance_run_state.py, per the same discipline as the
-- original port.

local function ensure_collect(t)
  if type(t) ~= "table" then return {} end
  if collect then return collect(t) end
  local out = {}
  for _, v in ipairs(t) do table.insert(out, v) end
  return out
end

local function shallow_copy(t)
  local out = {}
  for k, v in pairs(t) do out[k] = v end
  return out
end

-- === Card pool ===
-- data.named_cards already carries {id, name, el1, el2, relationType, cost,
-- culture}; component is derived from the trailing segment of id
-- (e.g. "ash_ash_guard" -> "guard"), matching buildEmberCardPool()'s output shape.

function build_card_pool(data)
  local pool = {}
  for _, c in ipairs(ensure_collect(data.named_cards)) do
    local parts = {}
    for part in string.gmatch(c.id, "[^_]+") do table.insert(parts, part) end
    local component = parts[#parts]
    table.insert(pool, {
      id = c.id,
      name = c.name,
      el1 = c.el1,
      el2 = c.el2,
      component = component,
      relationType = c.relationType,
    })
  end
  return pool
end

-- === Deck / hand management ===

function shuffle_deck(list)
  local copy = {}
  for i, v in ipairs(ensure_collect(list)) do copy[i] = v end
  for i = #copy, 2, -1 do
    local j = math.random(i)
    copy[i], copy[j] = copy[j], copy[i]
  end
  return copy
end

function draw_card(deck_state)
  local draw_pile = ensure_collect(deck_state.drawPile)
  local hand = ensure_collect(deck_state.hand)
  local discard = ensure_collect(deck_state.discard)

  if #draw_pile == 0 then
    draw_pile = shuffle_deck(discard)
    discard = {}
  end

  if #draw_pile > 0 then
    local card = draw_pile[1]
    local rest = {}
    for i = 2, #draw_pile do table.insert(rest, draw_pile[i]) end
    local new_hand = {}
    for _, h in ipairs(hand) do table.insert(new_hand, h) end
    table.insert(new_hand, card)
    return { drawPile = rest, hand = new_hand, discard = discard }
  end

  return { drawPile = draw_pile, hand = hand, discard = discard }
end

function draw_hand(deck_state, hand_size)
  hand_size = hand_size or 5
  local current = {
    drawPile = ensure_collect(deck_state.drawPile),
    hand = ensure_collect(deck_state.hand),
    discard = ensure_collect(deck_state.discard),
  }
  while #current.hand < hand_size and (#current.drawPile > 0 or #current.discard > 0) do
    current = draw_card(current)
  end
  return current
end

-- === Map generation ===

local RUNG_ELIGIBILITY = {
  early = { enemyTiers = { "basic" }, roomTypes = { "fight", "restCraft" } },
  mid   = { enemyTiers = { "basic", "advanced", "elite" }, roomTypes = { "fight", "restCraft", "treasure", "store", "anomaly" } },
}

local function lane_moves(lane)
  local moves = { lane }
  if lane - 1 >= 0 then table.insert(moves, lane - 1) end
  if lane + 1 <= 2 then table.insert(moves, lane + 1) end
  return moves
end

local function get_enemy_for_tier(data, tier)
  local candidates = enemy_pool_for_tier(data, tier)
  if #candidates == 0 then
    return { name = "Corrupted Ashling", hp = 14 }
  end
  return candidates[math.random(#candidates)]
end

function generate_branching_map(seed, num_layers, current_floor, data)
  math.randomseed(seed)
  build_enemy_pool(data)
  num_layers = math.max(3, num_layers or 5)
  current_floor = current_floor or 1

  local layers = {}
  for l = 1, num_layers do layers[l] = {} end

  local start_enemy = get_enemy_for_tier(data, "basic")
  local start_node = {
    id = "node_0_0", rung = "early", type = "fight",
    enemyTier = "basic", enemyName = start_enemy.name, enemyHp = start_enemy.hp,
    connectsTo = {}, lane = 1, x = 10, y = 50,
  }
  table.insert(layers[1], start_node)

  for l = 2, num_layers - 1 do
    local is_early = (l - 1) < math.ceil((num_layers - 1) * 0.4)
    local rung = is_early and "early" or "mid"
    local elig = RUNG_ELIGIBILITY[rung]

    for _, lane in ipairs({ 0, 1, 2 }) do
      local room_type
      if l == num_layers - 1 then
        room_type = "restCraft"
      else
        room_type = elig.roomTypes[math.random(#elig.roomTypes)]
      end

      local node = {
        id = string.format("node_%d_%d", l - 1, lane),
        lane = lane, rung = rung, type = room_type, connectsTo = {},
        x = 10 + ((l - 1) / (num_layers - 1)) * 80,
        y = 20 + lane * 30,
      }

      if room_type == "fight" then
        local enemy_tier = elig.enemyTiers[math.random(#elig.enemyTiers)]
        node.enemyTier = enemy_tier
        local enemy = get_enemy_for_tier(data, enemy_tier)
        node.enemyName = enemy.name
        node.enemyHp = enemy.hp
      end

      table.insert(layers[l], node)
    end
  end

  local is_floor1 = current_floor == 1
  local boss_tier = is_floor1 and "advanced" or "master"
  local boss_enemy
  if is_floor1 then
    boss_enemy = find_enemy_def("molten_ashling") or { name = "Molten Ashling", hp = 20 }
  else
    boss_enemy = get_enemy_for_tier(data, "master")
  end

  local boss_node = {
    id = "boss", rung = "final", type = "boss",
    enemyTier = boss_tier, enemyName = boss_enemy.name, enemyHp = boss_enemy.hp,
    connectsTo = {}, lane = 1, x = 90, y = 50,
  }
  table.insert(layers[num_layers], boss_node)

  for l = 1, num_layers - 1 do
    local next_layer = layers[l + 1]
    for _, node in ipairs(layers[l]) do
      if #next_layer == 1 then
        node.connectsTo = { next_layer[1].id }
      else
        local connects = {}
        for _, lane in ipairs(lane_moves(node.lane or 1)) do
          for _, n in ipairs(next_layer) do
            if n.lane == lane then table.insert(connects, n.id) end
          end
        end
        node.connectsTo = connects
      end
    end
  end

  local flat = {}
  for l = 1, num_layers do
    for _, node in ipairs(layers[l]) do table.insert(flat, node) end
  end
  return flat
end

local ENEMY_HP_TABLE = {
  basic = { 14, 10, 8, 12 },
  advanced = { 20, 24, 16, 18 },
  elite = { 30, 40, 28, 32 },
  master = { 50, 60 },
}
local DMG_PER_TURN = { basic = 2.5, advanced = 3.5, elite = 4, master = 3.5 }

local function avg_hp(tier)
  local arr = ENEMY_HP_TABLE[tier] or ENEMY_HP_TABLE.basic
  local sum = 0
  for _, v in ipairs(arr) do sum = sum + v end
  return sum / #arr
end

local function ttk(tier)
  return avg_hp(tier) / 7.5
end

function evaluate_map_balance(nodes, current_max_hp)
  local node_map = {}
  local start_node = nil
  for _, n in ipairs(ensure_collect(nodes)) do
    node_map[n.id] = n
    if n.id == "node_0_0" then start_node = n end
  end
  start_node = start_node or ensure_collect(nodes)[1]

  local function best_reachable_net(node, dmg_so_far, heal_so_far, visited)
    local connects = ensure_collect(node.connectsTo)
    if #connects == 0 or node.type == "boss" then
      local final_dmg = dmg_so_far
      if node.type == "boss" then
        final_dmg = dmg_so_far + DMG_PER_TURN.master * ttk("master")
      end
      return final_dmg - heal_so_far
    end

    local best = math.huge
    for _, next_id in ipairs(connects) do
      local nxt = node_map[next_id]
      if nxt and not visited[nxt.id] then
        local d, h = dmg_so_far, heal_so_far
        if nxt.type == "fight" then
          local tier = nxt.enemyTier or "basic"
          d = d + DMG_PER_TURN[tier] * ttk(tier)
        elseif nxt.type == "restCraft" then
          h = h + math.floor(current_max_hp * 0.4 + 0.5)
        end
        local visited_copy = shallow_copy(visited)
        visited_copy[nxt.id] = true
        local result = best_reachable_net(nxt, d, h, visited_copy)
        if result < best then best = result end
      end
    end

    if best == math.huge then
      return dmg_so_far - heal_so_far
    end
    return best
  end

  local net_damage = best_reachable_net(start_node, 0, 0, { ["node_0_0"] = true })
  net_damage = math.floor(net_damage * 10 + 0.5) / 10

  local band = {
    math.floor(0.25 * current_max_hp * 10 + 0.5) / 10,
    math.floor(0.85 * current_max_hp * 10 + 0.5) / 10,
  }
  local in_band = net_damage >= band[1] and net_damage <= band[2]

  return { netDamage = net_damage, inBand = in_band, band = band }
end

MAX_MAP_ATTEMPTS = 20

function generate_balanced_map(base_seed, num_layers, current_max_hp, current_floor, data)
  local attempt = 0
  local best_nodes = nil
  local best_delta = math.huge
  local best_eval = nil

  local function try_attempts(max_attempts)
    while attempt < max_attempts do
      local seed = base_seed + attempt
      local nodes = generate_branching_map(seed, num_layers, current_floor, data)
      local eval_res = evaluate_map_balance(nodes, current_max_hp)

      if eval_res.inBand then
        return {
          nodes = nodes,
          balance = { netDamage = eval_res.netDamage, inBand = eval_res.inBand, band = eval_res.band, attempts = attempt + 1 },
        }
      end

      local midpoint = (eval_res.band[1] + eval_res.band[2]) / 2
      local delta = math.abs(eval_res.netDamage - midpoint)
      if delta < best_delta then
        best_delta = delta
        best_nodes = nodes
        best_eval = eval_res
      end
      attempt = attempt + 1
    end
    return nil
  end

  local result = try_attempts(MAX_MAP_ATTEMPTS)
  if result then return result end

  if best_eval and best_eval.netDamage > current_max_hp and attempt < 40 then
    result = try_attempts(40)
    if result then return result end
  end

  local nodes = best_nodes or generate_branching_map(base_seed, num_layers, current_floor, data)
  return {
    nodes = nodes,
    balance = {
      netDamage = best_eval and best_eval.netDamage or 0,
      inBand = false,
      band = best_eval and best_eval.band or { 0.25 * current_max_hp, 0.85 * current_max_hp },
      attempts = attempt,
    },
  }
end

-- === Run-state FSM ===

function create_run(deck_card_ids, seed, current_floor, starting_essence_bonus, data)
  current_floor = current_floor or 1
  starting_essence_bonus = starting_essence_bonus or 0
  local floor_cfg = (data.floor_config and data.floor_config[tostring(current_floor)]) or { numLayers = 7 }
  local player_max_hp = (data.run and data.run.player_max_hp) or 25

  local result = generate_balanced_map(seed, floor_cfg.numLayers, player_max_hp, current_floor, data)
  local nodes = result.nodes
  local balance = result.balance

  local logs = {
    string.format("Floor %d Run Initiated with a %d-card deck.", current_floor, #ensure_collect(deck_card_ids)),
    string.format("Map generation validated: %s HP net damage (band [%s-%s] HP, %d attempt(s)).",
      tostring(balance.netDamage), tostring(balance.band[1]), tostring(balance.band[2]), balance.attempts),
  }
  if starting_essence_bonus > 0 then
    table.insert(logs, string.format("Consumed Banked Essence (+%d ESS). Available status consumed for this fresh start.", starting_essence_bonus))
  end

  return {
    currentNodeId = nodes[1].id,
    currentFloor = current_floor,
    playerHp = player_max_hp,
    playerMaxHp = player_max_hp,
    playerShield = 0,
    essence = starting_essence_bonus,
    status = "not_started",
    enemy = nil,
    turnCount = 1,
    logs = logs,
    combinationCounts = {},
    stabilizedCores = {},
    seed = seed,
    deckState = { drawPile = {}, hand = {}, discard = {} },
    deckCardIds = deck_card_ids,
    culture = "ember",
    nodes = nodes,
    boons = {},
    relics = {},
    usedRelicIds = {},
    visitedNodeIds = {},
    startingBankedBonus = starting_essence_bonus,
    giftSkippedCount = 0,
    lastMapBalance = balance,
  }
end

function enter_active_node(run_state, deck_card_ids, data)
  local current_node = nil
  for _, n in ipairs(ensure_collect(run_state.nodes)) do
    if n.id == run_state.currentNodeId then current_node = n; break end
  end
  if not current_node then return run_state end

  local logs = {}
  for _, l in ipairs(ensure_collect(run_state.logs)) do table.insert(logs, l) end

  if current_node.type == "fight" or current_node.type == "boss" then
    local enemy_name = current_node.enemyName or "Unknown Threat"
    local enemy_hp = current_node.enemyHp or 15
    local enemy_tier = current_node.enemyTier or (current_node.type == "boss" and "master" or "basic")

    local cards_pool = build_card_pool(data)
    local by_id = {}
    for _, c in ipairs(cards_pool) do by_id[c.id] = c end

    local cards = {}
    local ids = ensure_collect(deck_card_ids)
    for i, card_id in ipairs(ids) do
      local info = by_id[card_id]
      if info then
        table.insert(cards, {
          id = string.format("card_%d_%d", i, math.random(1000000)),
          cardId = info.id,
          name = info.name,
          el1 = info.el1,
          el2 = info.el2,
          component = info.component,
          relationType = info.relationType,
        })
      end
    end

    local shuffled = shuffle_deck(cards)
    local initial_deck_state = draw_hand({ drawPile = shuffled, hand = {}, discard = {} }, 5)

    build_enemy_pool(data)
    local enemy_def = find_enemy_def(enemy_name)
    local intent = get_enemy_intent(enemy_name, 1)

    table.insert(logs, "----------------------------------------")
    table.insert(logs, string.format("Entering Node %s: Fight against %s. Fresh %d-card deck shuffled.", run_state.currentNodeId, enemy_name, #cards))
    table.insert(logs, string.format("The enemy prepares: %s.", intent.description))

    local next_state = shallow_copy(run_state)
    next_state.status = "combat"
    next_state.playerShield = 0
    next_state.enemy = {
      name = enemy_name, hp = enemy_hp, maxHp = enemy_hp, dot = nil,
      intent = intent, tier = enemy_tier,
      secondaryType = enemy_def and enemy_def.secondaryType or nil,
      vulnerable = enemy_def and enemy_def.vulnerable or nil,
      resistant = enemy_def and enemy_def.resistant or nil,
      behaviorPattern = enemy_def and enemy_def.behaviorPattern or nil,
      behaviorTypeIds = enemy_def and enemy_def.behaviorTypeIds or nil,
    }
    next_state.turnCount = 1
    next_state.deckState = initial_deck_state
    next_state.logs = logs
    return next_state
  end

  local status_map = { restCraft = "rest_craft", treasure = "treasure", store = "store", anomaly = "anomaly" }
  local status = status_map[current_node.type]
  if status then
    table.insert(logs, "----------------------------------------")
    table.insert(logs, string.format("Entering Node %s: %s.", run_state.currentNodeId, current_node.type))
    local next_state = shallow_copy(run_state)
    next_state.status = status
    next_state.enemy = nil
    next_state.logs = logs
    return next_state
  end

  return run_state
end

function advance_node(run_state)
  local current_node = nil
  for _, n in ipairs(ensure_collect(run_state.nodes)) do
    if n.id == run_state.currentNodeId then current_node = n; break end
  end

  local visited = {}
  for _, v in ipairs(ensure_collect(run_state.visitedNodeIds)) do table.insert(visited, v) end
  local already = false
  for _, v in ipairs(visited) do
    if v == run_state.currentNodeId then already = true end
  end
  if not already then table.insert(visited, run_state.currentNodeId) end

  local logs = {}
  for _, l in ipairs(ensure_collect(run_state.logs)) do table.insert(logs, l) end

  local next_state = shallow_copy(run_state)
  next_state.visitedNodeIds = visited

  if current_node and current_node.type == "boss" then
    table.insert(logs, "STABILITY ACHIEVED! You completed all nodes of the Dissonance sequence.")
    next_state.status = "victory"
    next_state.logs = logs
    return next_state
  end

  table.insert(logs, string.format("Completed Node %s. Standing on navigation hub to select next branch.", run_state.currentNodeId))
  next_state.status = "not_started"
  next_state.enemy = nil
  next_state.logs = logs
  return next_state
end

-- === Reward application ===
-- generate_fixed_reward (rooms.lua) produces slot descriptors only; applying
-- a claimed slot to the run's actual HP/boons/relics was never ported either.

function apply_reward_slot(run_state, slot, data)
  local logs = {}
  for _, l in ipairs(ensure_collect(run_state.logs)) do table.insert(logs, l) end
  local next_state = shallow_copy(run_state)

  if slot.kind == "heal" then
    local new_hp = math.min(run_state.playerMaxHp, (run_state.playerHp or 0) + slot.amount)
    table.insert(logs, string.format("Claimed reward: healed %d HP.", new_hp - (run_state.playerHp or 0)))
    next_state.playerHp = new_hp
  elseif slot.kind == "benefit" then
    local boon = nil
    for _, b in ipairs(ensure_collect(data.boons)) do
      if b.id == slot.boonId then boon = b; break end
    end
    if boon then
      local boons = {}
      for _, b in ipairs(ensure_collect(run_state.boons)) do table.insert(boons, b) end
      table.insert(boons, boon)
      next_state.boons = boons
      table.insert(logs, string.format("Claimed reward: acquired Boon \"%s\".", boon.id))

      local gate = check_build_gate(boon.id, run_state.activeBuild)
      next_state.activeBuild = gate.build
      if gate.newlyCommitted then
        local details = BUILD_DETAILS[gate.build.buildId]
        table.insert(logs, string.format("%s Build Committed: %s (%s) unlocked!", details.icon, details.name, details.mechanicName))
      end
    end
  elseif slot.kind == "relic" then
    local relics = {}
    for _, r in ipairs(ensure_collect(run_state.relics)) do table.insert(relics, r) end
    table.insert(relics, slot.relicId)
    next_state.relics = relics
    table.insert(logs, string.format("Claimed reward: acquired Relic \"%s\".", slot.relicId))

    local gate = check_build_gate(slot.relicId, run_state.activeBuild)
    next_state.activeBuild = gate.build
    if gate.newlyCommitted then
      local details = BUILD_DETAILS[gate.build.buildId]
      table.insert(logs, string.format("%s Build Committed: %s (%s) unlocked!", details.icon, details.name, details.mechanicName))
    end
  elseif slot.kind == "card" then
    table.insert(logs, string.format("Claimed reward: unlocked Card \"%s\".", slot.cardId))
  end

  next_state.logs = logs
  return next_state
end

-- === Rest & Craft ===
-- Heal path: flat +40% of playerMaxHp, matching the same formula rooms.lua
-- uses for the reward "heal" slot (generate_fixed_reward).

function apply_rest(run_state)
  local logs = {}
  for _, l in ipairs(ensure_collect(run_state.logs)) do table.insert(logs, l) end

  if run_state.restCraftResolvedNodeId == run_state.currentNodeId then
    table.insert(logs, "Rest & Craft already resolved for this stop — choice locked.")
    local locked_state = shallow_copy(run_state)
    locked_state.logs = logs
    return locked_state
  end

  local heal_amount = math.floor((run_state.playerMaxHp or 25) * 0.4 + 0.5)
  local new_hp = math.min(run_state.playerMaxHp or 25, (run_state.playerHp or 0) + heal_amount)
  table.insert(logs, string.format("Rested. Recovered %d HP (%d -> %d).", new_hp - (run_state.playerHp or 0), run_state.playerHp or 0, new_hp))

  local next_state = shallow_copy(run_state)
  next_state.playerHp = new_hp
  next_state.restCraftResolvedNodeId = run_state.currentNodeId
  next_state.logs = logs
  return next_state
end

-- Attachment path: resolves the weighted peek/gift/treasure roll via the
-- existing rooms.lua resolve_rest_or_attachment helper and logs the outcome.
-- Full Gift/Treasure reward granting is Treasure/Store-phase content,
-- deferred to a later pass per the directive's own time-boxing allowance.

function apply_attachment(run_state, data, is_pre_boss)
  local logs = {}
  for _, l in ipairs(ensure_collect(run_state.logs)) do table.insert(logs, l) end

  if run_state.restCraftResolvedNodeId == run_state.currentNodeId then
    table.insert(logs, "Rest & Craft already resolved for this stop — choice locked.")
    local locked_state = shallow_copy(run_state)
    locked_state.logs = logs
    return locked_state
  end

  local outcome = resolve_rest_or_attachment(
    run_state.seed, run_state.currentNodeId, run_state.currentFloor,
    false, is_pre_boss or false, data
  )
  table.insert(logs, string.format("Attachment resolved: %s.", outcome))

  local next_state = shallow_copy(run_state)
  next_state.logs = logs
  next_state.lastAttachmentOutcome = outcome
  next_state.restCraftResolvedNodeId = run_state.currentNodeId
  return next_state
end

-- === Combat turn resolution ===
-- play_card (logic.lua) only resolves a played card's own combination effect;
-- it does not apply that effect to enemy/player HP, execute the enemy's
-- telegraphed intent, tick DoT, or check win/loss. Ported from
-- tmp/dissonance-src/src/logic/combatResolution.ts (executeTurnResolution).
--
-- Explicitly deferred (real, separate, out of core-loop scope): boon/relic
-- modifiers (no_fizzle, cracked_mirror, same_amplify, guard_reflect,
-- anchor_of_ash, steadfast_ember) and per-boss-name signature effects
-- (Fracture Warden opposed suppression, Rootbound Guardian self-heal,
-- Cinderlord Sentinel shield stacking). Generic, data-driven boss phase
-- secondary-type shifts (HP% thresholds) ARE ported since they apply to any
-- boss, not a named one.

local function lcg_advance(seed)
  return (seed * 1103515245 + 12345) % 2147483648
end

function resolve_combat_turn(run_state, played_card, data)
  local enemy = run_state.enemy
  if not enemy then return run_state end

  local seed = run_state.seed
  local result = resolve_combination(played_card.el1, played_card.el2, played_card.component, seed)
  local synergy = apply_synergy_mechanic(run_state.activeBuild, played_card, result, run_state, false)
  result = synergy.result

  local logs = {}
  for _, l in ipairs(ensure_collect(run_state.logs)) do table.insert(logs, l) end
  table.insert(logs, string.format("[Player Turn] Played Card: \"%s\" (%s%s + %s)",
    played_card.name or played_card.component, string.upper(played_card.el1 or ""),
    played_card.el2 and (" + " .. string.upper(played_card.el2)) or "", string.upper(played_card.component)))
  table.insert(logs, "-> " .. result.message)
  for _, msg in ipairs(ensure_collect(synergy.logMessages)) do
    table.insert(logs, "-> " .. msg)
  end

  local next_player_hp = run_state.playerHp
  local next_player_shield = (run_state.playerShield or 0) + (synergy.extraPlayerShield or 0)
  local next_enemy_hp = enemy.hp
  local next_enemy_dot = enemy.dot

  local combo_key = getComboKey and getComboKey(played_card.el1, played_card.el2, played_card.component)
    or string.format("%s_%s_%s", played_card.el1, played_card.el2 or "none", played_card.component)
  local combo_counts = {}
  for k, v in pairs(run_state.combinationCounts or {}) do combo_counts[k] = v end
  combo_counts[combo_key] = (combo_counts[combo_key] or 0) + 1

  local final_value = result.modifiedValue

  local card_sec_type = get_secondary_type(played_card.relationType)
  local type_mult = get_type_multiplier(card_sec_type, { vulnerable = enemy.vulnerable, resistant = enemy.resistant })
  if type_mult ~= 1.0 then
    final_value = math.floor(final_value * type_mult + 0.5)
    if type_mult > 1.0 then
      table.insert(logs, string.format("TYPE ADVANTAGE! %s vs Vulnerable target: x%.1f applied -> %d.", string.upper(card_sec_type or ""), type_mult, final_value))
    else
      table.insert(logs, string.format("TYPE RESISTANCE! %s vs Resistant target: x%.1f applied -> %d.", string.upper(card_sec_type or ""), type_mult, final_value))
    end
  end

  local component = played_card.component
  if component == "sever" then
    next_enemy_hp = math.max(0, next_enemy_hp - final_value)
    table.insert(logs, string.format("Dealt %d damage to %s.", final_value, enemy.name))
  elseif component == "mend" then
    next_player_hp = math.min(run_state.playerMaxHp, next_player_hp + final_value)
    table.insert(logs, string.format("Healed player for %d HP (Current: %d/%d).", final_value, next_player_hp, run_state.playerMaxHp))
  elseif component == "guard" then
    next_player_shield = next_player_shield + final_value
    table.insert(logs, string.format("Shielded player for +%d (Total Shield: %d).", final_value, next_player_shield))
  elseif component == "unmake" then
    next_enemy_dot = { duration = 3, damage = final_value }
    table.insert(logs, string.format("Afflicted %s with Void Rot DoT (%d damage/turn for 3 turns).", enemy.name, final_value))
  end

  if result.bonusEffect then
    local bonus = result.bonusEffect
    if bonus.type == "damage" then
      next_enemy_hp = math.max(0, next_enemy_hp - bonus.value)
      table.insert(logs, string.format("-> Adjacent Bonus: Dealt +%d extra damage.", bonus.value))
    elseif bonus.type == "shield" then
      next_player_shield = next_player_shield + bonus.value
      table.insert(logs, string.format("-> Adjacent Bonus: Gained +%d extra Shield.", bonus.value))
    elseif bonus.type == "heal" then
      next_player_hp = math.min(run_state.playerMaxHp, next_player_hp + bonus.value)
      table.insert(logs, string.format("-> Adjacent Bonus: Healed +%d extra HP.", bonus.value))
    end
  end

  local next_essence = (run_state.essence or 0) + 1 + (synergy.extraEssence or 0)
  table.insert(logs, "Earned +1 Run Essence (secured immediately).")

  local hand = ensure_collect(run_state.deckState.hand)
  local next_hand = {}
  for _, c in ipairs(hand) do
    if c.id ~= played_card.id then table.insert(next_hand, c) end
  end
  local next_discard = ensure_collect(run_state.deckState.discard)
  table.insert(next_discard, played_card)
  local next_deck_state = { drawPile = ensure_collect(run_state.deckState.drawPile), hand = next_hand, discard = next_discard }

  local current_node = nil
  for _, n in ipairs(ensure_collect(run_state.nodes)) do
    if n.id == run_state.currentNodeId then current_node = n; break end
  end
  local is_boss_node = current_node and current_node.type == "boss"

  local next_state = shallow_copy(run_state)
  next_state.combinationCounts = combo_counts

  -- Enemy defeated by the played card itself
  if next_enemy_hp <= 0 then
    local victory_bonus = is_boss_node and 30 or 15
    table.insert(logs, string.format("Enemy Defeated! Granting +%d flat victory Essence.", victory_bonus))
    next_deck_state = draw_hand(next_deck_state, 5)

    next_state.playerHp = next_player_hp
    next_state.playerShield = next_player_shield
    next_state.essence = next_essence + victory_bonus
    next_state.deckState = next_deck_state
    next_state.enemy = { name = enemy.name, hp = 0, maxHp = enemy.maxHp, dot = nil, intent = enemy.intent, tier = enemy.tier }
    next_state.status = "reward"
    next_state.logs = logs
    return { nextState = next_state, fightWon = true, isBoss = is_boss_node }
  end

  -- Generic boss phase secondary-type shift (HP% thresholds, not name-gated)
  local next_secondary_type, next_vulnerable, next_resistant = enemy.secondaryType, enemy.vulnerable, enemy.resistant
  if is_boss_node then
    local thresh66 = math.floor(enemy.maxHp * 0.66 + 0.5)
    local thresh33 = math.floor(enemy.maxHp * 0.33 + 0.5)
    if next_enemy_hp <= thresh33 then
      next_secondary_type, next_vulnerable, next_resistant = "burst", "hybrid", "volatile"
    elseif next_enemy_hp <= thresh66 then
      next_secondary_type, next_vulnerable, next_resistant = "volatile", "burst", "hybrid"
    else
      next_secondary_type, next_vulnerable, next_resistant = "hybrid", "burst", "volatile"
    end
  end

  -- Enemy turn: DoT tick, then telegraphed intent
  table.insert(logs, string.format("[Enemy Turn] %s acts.", enemy.name))

  if next_enemy_dot and next_enemy_dot.duration > 0 then
    local dot_dmg = next_enemy_dot.damage
    next_enemy_hp = math.max(0, next_enemy_hp - dot_dmg)
    local remaining = next_enemy_dot.duration - 1
    table.insert(logs, string.format("Void Rot burns %s for %d damage. (%d turns remaining)", enemy.name, dot_dmg, remaining))
    next_enemy_dot = remaining > 0 and { duration = remaining, damage = dot_dmg } or nil

    if next_enemy_hp <= 0 then
      local victory_bonus = is_boss_node and 30 or 15
      table.insert(logs, string.format("Enemy collapsed under Void Rot DoT! Granting +%d victory Essence.", victory_bonus))
      next_deck_state = draw_hand(next_deck_state, 5)

      next_state.playerHp = next_player_hp
      next_state.playerShield = next_player_shield
      next_state.essence = next_essence + victory_bonus
      next_state.deckState = next_deck_state
      next_state.enemy = { name = enemy.name, hp = 0, maxHp = enemy.maxHp, dot = nil, intent = enemy.intent, tier = enemy.tier }
      next_state.status = "reward"
      next_state.logs = logs
      return { nextState = next_state, fightWon = true, isBoss = is_boss_node }
    end
  end

  local intent = enemy.intent
  if intent.type == "attack" or intent.type == "heavy_attack" then
    local dmg = intent.value
    local blocked = math.min(next_player_shield, dmg)
    local final_dmg = dmg - blocked
    next_player_shield = next_player_shield - blocked
    next_player_hp = math.max(0, next_player_hp - final_dmg)
    table.insert(logs, string.format("Enemy used %s (%d dmg). Blocked %d shield. Took %d damage!", intent.description, dmg, blocked, final_dmg))
  elseif intent.type == "shield" then
    table.insert(logs, string.format("Enemy used %s, gaining %d Shield.", intent.description, intent.value))
  elseif intent.type == "dot_attack" then
    local dmg = intent.value
    next_player_hp = math.max(0, next_player_hp - dmg)
    table.insert(logs, string.format("Enemy used %s. Player took %d damage!", intent.description, dmg))
  end

  -- Player defeated
  if next_player_hp <= 0 then
    table.insert(logs, "CRITICAL ERROR: Your physical frequency collapsed. Run Failed!")
    next_state.playerHp = 0
    next_state.playerShield = 0
    next_state.essence = 0
    next_state.status = "game_over"
    next_state.logs = logs
    return { nextState = next_state, fightWon = false, isBoss = is_boss_node }
  end

  next_player_shield = 0
  next_deck_state = draw_hand(next_deck_state, 5)
  local next_turn_count = (run_state.turnCount or 1) + 1
  local next_intent = get_enemy_intent(enemy.name, next_turn_count)

  if is_boss_node then
    local thresh66 = math.floor(enemy.maxHp * 0.66 + 0.5)
    local thresh33 = math.floor(enemy.maxHp * 0.33 + 0.5)
    if next_enemy_hp <= thresh33 then
      next_intent = { type = "heavy_attack", value = 16, description = "Shattered Scream!!! (16 Dmg)" }
    elseif next_enemy_hp <= thresh66 then
      next_intent = { type = "shield", value = 12, description = "Stabilized Ward (12 Shield)" }
    end
  end

  table.insert(logs, "-------------------------")
  table.insert(logs, string.format("[Turn %d] The enemy prepares: %s.", next_turn_count, next_intent.description))

  next_state.playerHp = next_player_hp
  next_state.playerShield = next_player_shield
  next_state.essence = next_essence
  next_state.seed = lcg_advance(seed)
  next_state.turnCount = next_turn_count
  next_state.deckState = next_deck_state
  next_state.enemy = {
    name = enemy.name, hp = next_enemy_hp, maxHp = enemy.maxHp, dot = next_enemy_dot,
    intent = next_intent, tier = enemy.tier,
    secondaryType = next_secondary_type, vulnerable = next_vulnerable, resistant = next_resistant,
    behaviorPattern = enemy.behaviorPattern, behaviorTypeIds = enemy.behaviorTypeIds,
  }
  next_state.logs = logs

  return { nextState = next_state, fightWon = nil, isBoss = is_boss_node }
end

function select_branch(run_state, target_node_id)
  local logs = {}
  for _, l in ipairs(ensure_collect(run_state.logs)) do table.insert(logs, l) end
  table.insert(logs, string.format("Traveled to connected node %s.", target_node_id))

  local next_state = shallow_copy(run_state)
  next_state.currentNodeId = target_node_id
  next_state.status = "not_started"
  next_state.logs = logs
  return next_state
end
