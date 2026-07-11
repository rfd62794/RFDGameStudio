-- brewfield/logic.lua — Phase A core loop port
-- Faithful port of the certified Brewfield TS implementation.
--
-- Source files (read-only reference):
--   examples/brewfield/src/gameLogic.ts
--   examples/brewfield/src/App.tsx
--   examples/brewfield/src/types.ts

local ELEMENT_ORDER = {'fire', 'air', 'water', 'earth'}

local function clamp(val, min, max)
  return math.max(min, math.min(max, val))
end

local function index_of(tbl, val)
  for i, v in ipairs(tbl) do
    if v == val then return i end
  end
  return nil
end

local function copy_table(t)
  if type(t) ~= 'table' then return t end
  local c = {}
  for k, v in pairs(t) do
    c[k] = copy_table(v)
  end
  return c
end

local function shallow_copy_list(t)
  local c = {}
  for i, v in ipairs(t) do c[i] = v end
  return c
end

local function get_residue_tag(element)
  if element == 'fire' then return 'burning' end
  if element == 'water' then return 'soaked' end
  if element == 'earth' then return 'fortified' end
  if element == 'air' then return 'windswept' end
  return nil
end

local function get_opposed_element(element)
  if element == 'fire' then return 'water' end
  if element == 'water' then return 'fire' end
  if element == 'air' then return 'earth' end
  return 'air'
end

local function get_element_color(element)
  if element == 'fire' then return '#ef4444' end
  if element == 'water' then return '#38bdf8' end
  if element == 'earth' then return '#10b981' end
  return '#c084fc'
end

-- ============================================================
-- ELEMENT RELATIONSHIPS
-- ============================================================

function get_relation(el1, el2)
  if el1 == el2 then return 'same' end
  local idx1 = index_of(ELEMENT_ORDER, el1)
  local idx2 = index_of(ELEMENT_ORDER, el2)
  if idx1 == nil or idx2 == nil then return 'single' end
  local diff = math.abs(idx1 - idx2)
  if diff == 2 then return 'opposed' end
  return 'adjacent'
end

-- ============================================================
-- BREW RESOLUTION
-- ============================================================

function solve_brew(data, el1, el2, component, seed)
  local primary = el1 or el2 or 'water'
  local secondary = nil
  if el1 and el2 and el1 ~= el2 then
    secondary = el2
  end

  local combination = 'single'
  if el1 and el2 then
    combination = get_relation(el1, el2)
  end

  local baseDamage = 0
  local baseShield = 0
  local baseHeal = 0
  local baseDotDamage = 0
  local baseDotDuration = 0

  local slowStrength = 0
  local slowTurns = 0
  local dodgeGranted = 0
  local retaliateDamage = 0
  local decayingShield = 0
  local cauterize = false
  local detonateNextTurn = false
  local stripBuffs = false
  local weaknessStacks = 0
  local ticksActiveDoTs = false

  if component == 'strike' then
    baseDamage = 6
    if primary == 'fire' then
      baseDamage = 8
    elseif primary == 'water' then
      baseDamage = 4
      slowStrength = 3
      slowTurns = 1
    elseif primary == 'earth' then
      baseDamage = 6
      baseShield = 3
    elseif primary == 'air' then
      baseDamage = 3
    end
  elseif component == 'ward' then
    baseShield = 5
    if primary == 'fire' then
      retaliateDamage = 3
    elseif primary == 'water' then
      baseShield = 7
      baseHeal = 2
    elseif primary == 'earth' then
      baseShield = 9
      decayingShield = 4
    elseif primary == 'air' then
      baseShield = 3
      dodgeGranted = 1
    end
  elseif component == 'mend' then
    baseHeal = 5
    if primary == 'fire' then
      baseHeal = 3
      cauterize = true
    elseif primary == 'water' then
      baseHeal = 8
    elseif primary == 'earth' then
      baseHeal = 5
      baseShield = 2
    elseif primary == 'air' then
      baseHeal = 5
      cauterize = true
    end
  elseif component == 'blight' then
    baseDotDamage = 3
    baseDotDuration = 3
    if primary == 'fire' then
      baseDotDamage = 0
      baseDotDuration = 0
      detonateNextTurn = true
    elseif primary == 'water' then
      baseDotDamage = 1
      baseDotDuration = 3
      stripBuffs = true
    elseif primary == 'earth' then
      baseDotDamage = 3
      baseDotDuration = 3
      weaknessStacks = 2
    elseif primary == 'air' then
      baseDotDamage = 3
      baseDotDuration = 3
      ticksActiveDoTs = true
    end
  end

  local multiplier = 1.0
  local flavorText = ''
  local reactionTitle = ''

  if combination == 'same' then
    multiplier = 1.5
    reactionTitle = 'AMPLIFIED ' .. string.upper(primary) .. ' ' .. string.upper(component)
    flavorText = 'Combining two of the same element charges the brew to 150% potency!'
  elseif combination == 'adjacent' and secondary then
    reactionTitle = 'HYBRIDIZED ' .. string.upper(primary) .. '-' .. string.upper(secondary) .. ' ' .. string.upper(component)
    flavorText = 'The adjacent elements harmonize. The dominant element (' .. primary .. ') is boosted by a minor aspect of ' .. secondary .. '!'

    if secondary == 'fire' then
      if component == 'strike' then
        baseDamage = baseDamage + 2
      elseif component == 'blight' then
        baseDotDamage = baseDotDamage + 1
      else
        retaliateDamage = retaliateDamage + 2
      end
    elseif secondary == 'water' then
      if component == 'mend' then
        baseHeal = baseHeal + 2
      else
        baseShield = baseShield + 1
      end
    elseif secondary == 'earth' then
      baseShield = baseShield + 2
      if decayingShield > 0 then
        decayingShield = decayingShield + 2
      end
    elseif secondary == 'air' then
      if component == 'strike' then
        baseDamage = baseDamage + 1
      end
      cauterize = true
    end
  elseif combination == 'opposed' and secondary then
    local rngVal = math.sin(seed) * 10000
    local isSuccess = (rngVal - math.floor(rngVal)) >= 0.5
    if isSuccess then
      multiplier = 1.5
      reactionTitle = 'VOLATILE SURGE! ' .. string.upper(primary) .. ' VS ' .. string.upper(secondary)
      flavorText = 'Opposed elements clash violently, sparking a powerful SURGE (+50% potency)! No residue tag is deposited.'
    else
      multiplier = 0.5
      reactionTitle = 'VOLATILE FIZZLE! ' .. string.upper(primary) .. ' VS ' .. string.upper(secondary)
      flavorText = 'Opposed elements clashed and canceled each other out, resulting in a FIZZLE (50% potency)! No residue tag is deposited.'
    end
  else
    reactionTitle = 'PURE ' .. string.upper(primary) .. ' ' .. string.upper(component)
    flavorText = 'A single-element brew focused entirely on ' .. primary .. '.'
  end

  local function apply_mult(v)
    if v == 0 then return 0 end
    return math.ceil(v * multiplier)
  end

  local finalDamage = apply_mult(baseDamage)
  local finalShield = apply_mult(baseShield)
  local finalHeal = apply_mult(baseHeal)
  local finalDotDamage = apply_mult(baseDotDamage)
  local finalDotDuration = baseDotDuration
  local finalRetaliate = apply_mult(retaliateDamage)
  local finalDecaying = apply_mult(decayingShield)
  local finalSlow = apply_mult(slowStrength)
  local finalWeakness = apply_mult(weaknessStacks)

  local effectDescParts = {}
  if finalDamage > 0 then
    if primary == 'air' and component == 'strike' then
      table.insert(effectDescParts, 'Deals ' .. math.ceil(finalDamage / 2) .. ' damage twice (Total: ' .. finalDamage .. ' DMG).')
    else
      table.insert(effectDescParts, 'Deals ' .. finalDamage .. ' Damage.')
    end
  end
  if finalShield > 0 then
    table.insert(effectDescParts, 'Grants ' .. finalShield .. ' Shield.')
  end
  if finalHeal > 0 then
    table.insert(effectDescParts, 'Restores ' .. finalHeal .. ' HP.')
  end
  if detonateNextTurn then
    table.insert(effectDescParts, 'Applies volatile fuse: deals 8 damage on next turn.')
  elseif finalDotDamage > 0 then
    table.insert(effectDescParts, 'Applies Blight DoT: deals ' .. finalDotDamage .. ' DMG/turn for ' .. finalDotDuration .. ' turns.')
  end
  if primary == 'fire' and component == 'strike' then
    table.insert(effectDescParts, 'Applies Burning residue.')
  end
  if finalSlow > 0 then
    table.insert(effectDescParts, 'Reduces enemy\'s next intent by -' .. finalSlow .. ' DMG.')
  end
  if finalRetaliate > 0 then
    table.insert(effectDescParts, 'Grants Retaliation (deals ' .. finalRetaliate .. ' back on next hit).')
  end
  if finalDecaying > 0 then
    table.insert(effectDescParts, '' .. finalDecaying .. ' Shield persists to the next turn.')
  end
  if dodgeGranted > 0 then
    table.insert(effectDescParts, 'Grants Evasion (50% chance to dodge the next attack).')
  end
  if cauterize then
    table.insert(effectDescParts, 'Cleanses all negative debuffs (cauterize).')
  end
  if stripBuffs then
    table.insert(effectDescParts, 'Clears any active shields from the enemy.')
  end
  if finalWeakness > 0 then
    table.insert(effectDescParts, 'Applies Root: reduces enemy attack intents by -' .. finalWeakness .. ' DMG.')
  end
  if ticksActiveDoTs then
    table.insert(effectDescParts, 'Forces all currently active Residue DoTs to tick immediately.')
  end

  return {
    name = reactionTitle,
    combination = combination,
    primaryElement = primary,
    secondaryElement = secondary,
    component = component,
    damage = finalDamage,
    shield = finalShield,
    heal = finalHeal,
    dotDamage = finalDotDamage,
    dotDuration = finalDotDuration,
    slowStrength = finalSlow,
    slowTurns = slowTurns,
    dodgeGranted = dodgeGranted,
    retaliateDamage = finalRetaliate,
    decayingShield = finalDecaying,
    cauterize = cauterize,
    detonateNextTurn = detonateNextTurn,
    stripBuffs = stripBuffs,
    weaknessStacks = finalWeakness,
    ticksActiveDoTs = ticksActiveDoTs,
    description = flavorText .. ' Effect: ' .. table.concat(effectDescParts, ' '),
    color = get_element_color(primary)
  }
end

-- ============================================================
-- RESIDUE FIELD
-- ============================================================

function update_residue_field(currentResidues, resultantElement, isVolatile)
  if isVolatile or not resultantElement then
    local log = isVolatile
      and 'The clashing elements neutralized each other—no new residue could solidify in the cauldron.'
      or 'No element was infused—the residue field remains unchanged.'
    return { updated = copy_table(currentResidues), log = log }
  end

  local newTag = get_residue_tag(resultantElement)
  local opposedElement = get_opposed_element(resultantElement)
  local opposedTag = get_residue_tag(opposedElement)

  local updated = copy_table(currentResidues)
  local log = ''

  -- Same element: amplify existing tag
  local existingIdx = nil
  for i, r in ipairs(updated) do
    if r.tag == newTag then existingIdx = i; break end
  end
  if existingIdx then
    local currentLvl = updated[existingIdx].level
    local newLvl = math.min(3, currentLvl + 1)
    updated[existingIdx] = { tag = newTag, level = newLvl }
    log = 'Fused with existing elements: Amplified the cauldron\'s [' .. string.upper(newTag) .. '] residue to Level ' .. newLvl .. '!'
    return { updated = updated, log = log }
  end

  -- Opposed element: clear opposed tag
  local opposedIdx = nil
  for i, r in ipairs(updated) do
    if r.tag == opposedTag then opposedIdx = i; break end
  end
  if opposedIdx then
    local filtered = {}
    for i, r in ipairs(updated) do
      if i ~= opposedIdx then table.insert(filtered, r) end
    end
    log = 'Chemical annihilation: The incoming [' .. string.upper(newTag) .. '] elements completely cleared the opposed [' .. string.upper(opposedTag) .. '] residue!'
    return { updated = filtered, log = log }
  end

  -- Unrelated element: add or replace
  if #updated < 2 then
    table.insert(updated, { tag = newTag, level = 1 })
    log = 'A new sediment settles: Deposited [' .. string.upper(newTag) .. '] residue (Level 1) into the cauldron field.'
  else
    local fortifiedIdx = nil
    for i, r in ipairs(updated) do
      if r.tag == 'fortified' then fortifiedIdx = i; break end
    end
    if fortifiedIdx then
      local otherIdx = fortifiedIdx == 1 and 2 or 1
      if updated[otherIdx].tag ~= 'fortified' then
        log = 'The enduring [FORTIFIED] residue resists decay! Overwrote the less-stable [' .. string.upper(updated[otherIdx].tag) .. '] tag with [' .. string.upper(newTag) .. '].'
        updated[otherIdx] = { tag = newTag, level = 1 }
      else
        if updated[1].level > 1 then
          updated[1].level = updated[1].level - 1
          log = 'The thick [FORTIFIED] shell absorbed the overwrite, diminishing to Level ' .. updated[1].level .. '.'
        else
          log = 'The thick [FORTIFIED] residue was finally worn down and replaced by [' .. string.upper(newTag) .. '].'
          updated[1] = { tag = newTag, level = 1 }
        end
      end
    else
      local replacedTag = updated[1].tag
      table.remove(updated, 1)
      table.insert(updated, { tag = newTag, level = 1 })
      log = 'Cauldron overflow: Replaced the oldest residue [' .. string.upper(replacedTag) .. '] with new [' .. string.upper(newTag) .. '] tag.'
    end
  end

  return { updated = updated, log = log }
end

-- ============================================================
-- ENEMIES
-- ============================================================

function instantiate_enemy(data, archetype, turn)
  local enemyData = data.enemies[archetype]
  if not enemyData then
    error('Unknown enemy archetype: ' .. tostring(archetype))
  end
  local idMap = {
    ashling = 'enemy_ashling',
    bulwark = 'enemy_bulwark',
    molten_ashling = 'enemy_molten',
    rootbound = 'enemy_rootbound'
  }
  return {
    id = idMap[archetype] or 'enemy_unknown',
    name = enemyData.name,
    archetype = archetype,
    hp = enemyData.hp,
    maxHp = enemyData.hp,
    shield = 0,
    intent = get_enemy_intent(data, archetype, turn or 1)
  }
end

function get_enemy_intent(data, archetype, turn)
  local enemyData = data.enemies[archetype]
  if not enemyData then
    error('Unknown enemy archetype: ' .. tostring(archetype))
  end
  local index = ((turn or 1) - 1) % 4 + 1
  local pattern = enemyData.intent_pattern[index]
  return {
    action = pattern.action,
    value = pattern.value,
    description = pattern.description
  }
end

-- ============================================================
-- STATE INITIALIZATION
-- ============================================================

function init_player()
  return {
    hp = 20,
    maxHp = 20,
    shield = 0,
    dodgeCharges = 0,
    retaliateCharges = 0,
    decayingShield = 0,
    burnDebuff = 0
  }
end

local function shuffle_list(list)
  local t = shallow_copy_list(list)
  for i = #t, 2, -1 do
    local j = math.random(i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

local function build_run_nodes(data)
  local nodes = {}
  for i, n in ipairs(data.run_nodes) do
    table.insert(nodes, {
      id = n.id,
      type = n.type,
      name = n.name,
      description = n.description,
      enemy = n.enemy,
      completed = false
    })
  end
  return nodes
end

function init_run(data)
  return {
    player = init_player(),
    enemy = nil,
    currentTurn = 1,
    residues = {},
    drawPile = {},
    hand = {},
    discardPile = {},
    deck = shallow_copy_list(data.starting_deck),
    nodes = build_run_nodes(data),
    currentNodeId = 1,
    gameLogs = {},
    stats = {
      enemiesDefeated = 0,
      totalDamageDealt = 0,
      totalShieldGained = 0,
      totalHealed = 0,
      brewsCreated = 0,
      volatileFails = 0,
      volatileSuccesses = 0
    },
    combatOutcome = nil,
    forageOptions = nil,
    screen = 'run',
    runWon = false
  }
end

function init_fight(data, state, node_id)
  local node = nil
  for i, n in ipairs(state.nodes) do
    if n.id == node_id then node = n; break end
  end
  if not node then
    error('Node ' .. tostring(node_id) .. ' not found')
  end
  if node.type ~= 'fight' or not node.enemy then
    error('Node ' .. tostring(node_id) .. ' is not a fight node')
  end

  local next = copy_table(state)
  next.player.shield = 0
  next.player.dodgeCharges = 0
  next.player.retaliateCharges = 0
  next.player.decayingShield = 0
  next.player.burnDebuff = 0

  next.enemy = instantiate_enemy(data, node.enemy, 1)
  next.currentTurn = 1
  next.residues = {}

  local shuffledDeck = shuffle_list(next.deck)
  next.hand = {}
  for i = 1, math.min(5, #shuffledDeck) do
    table.insert(next.hand, shuffledDeck[i])
  end
  next.drawPile = {}
  for i = 6, #shuffledDeck do
    table.insert(next.drawPile, shuffledDeck[i])
  end
  next.discardPile = {}

  next.gameLogs = {}
  next.combatOutcome = nil
  return next
end

-- ============================================================
-- TURN RESOLUTION
-- ============================================================

local function add_log(state, sender, message, turn)
  table.insert(state.gameLogs, {
    id = 'log_' .. tostring(#state.gameLogs + 1),
    turn = turn or state.currentTurn,
    sender = sender,
    message = message
  })
end

local function damage_shield_first(targetShield, targetHp, damage)
  if targetShield >= damage then
    return targetShield - damage, targetHp, 0
  else
    local remainder = damage - targetShield
    return 0, math.max(0, targetHp - remainder), remainder
  end
end

function resolve_brew(state, brew)
  local next = copy_table(state)
  local player = next.player
  local enemy = next.enemy

  -- Player stat updates
  player.hp = math.min(player.maxHp, player.hp + brew.heal)
  player.shield = player.shield + brew.shield
  player.dodgeCharges = player.dodgeCharges + brew.dodgeGranted
  player.retaliateCharges = player.retaliateCharges + brew.retaliateDamage
  player.decayingShield = player.decayingShield + brew.decayingShield
  if brew.cauterize then
    player.burnDebuff = 0
  end

  -- Enemy shield strip
  local nextEnemyShield = brew.stripBuffs and 0 or enemy.shield
  local nextEnemyHp = enemy.hp

  -- Damage enemy shield/HP
  local unused1, unused2
  nextEnemyShield, nextEnemyHp, unused1 = damage_shield_first(nextEnemyShield, nextEnemyHp, brew.damage)

  -- Air Blight: tick active residue DoTs immediately
  if brew.ticksActiveDoTs and #next.residues > 0 then
    local isWindswept = false
    for i, r in ipairs(next.residues) do
      if r.tag == 'windswept' then isWindswept = true; break end
    end
    local factor = isWindswept and 2 or 1
    for i, r in ipairs(next.residues) do
      if r.tag == 'burning' then
        local tickDmg = r.level * 2 * factor
        nextEnemyShield, nextEnemyHp, unused2 = damage_shield_first(nextEnemyShield, nextEnemyHp, tickDmg)
        add_log(next, 'field', 'Air draft spread! Burning residue flared immediately, dealing ' .. tickDmg .. ' DMG!', next.currentTurn)
      end
    end
  end

  enemy.shield = nextEnemyShield
  enemy.hp = nextEnemyHp

  -- Residue field update
  local isVolatile = brew.combination == 'opposed'
  local fieldResult = update_residue_field(next.residues, brew.primaryElement, isVolatile)
  next.residues = fieldResult.updated
  if fieldResult.log and fieldResult.log ~= '' then
    add_log(next, 'field', fieldResult.log, next.currentTurn)
  end

  add_log(next, 'player', 'Brewed: ' .. brew.name .. '. ' .. brew.description, next.currentTurn)

  return next
end

function resolve_enemy_turn(state, brew)
  local next = copy_table(state)
  local player = next.player
  local enemy = next.enemy

  local nextEnemyShield = enemy.shield
  local nextEnemyHp = enemy.hp

  local intent = enemy.intent
  local finalEnemyDmg = intent.value

  if intent.action == 'attack' or intent.action == 'special' then
    -- Dodge check
    local dodged = false
    if player.dodgeCharges > 0 then
      local coinFlip = math.random() < 0.5
      if coinFlip then
        dodged = true
        add_log(next, 'player', 'Evasion Success! Dodged the entire attack cleanly.', next.currentTurn)
      else
        add_log(next, 'player', 'Evasion FAILED! The attack lands through the fog.', next.currentTurn)
      end
      player.dodgeCharges = math.max(0, player.dodgeCharges - 1)
    end

    if not dodged and finalEnemyDmg > 0 then
      -- Damage player shield/HP
      local pShield, pHp, penetrativeDmg = damage_shield_first(player.shield, player.hp, finalEnemyDmg)
      player.shield = pShield
      player.hp = pHp
      if penetrativeDmg == 0 then
        add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Fully blocked by your Ward shield.', next.currentTurn)
      else
        add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Deals ' .. penetrativeDmg .. ' DMG directly to your vital pool.', next.currentTurn)
      end

      -- Retaliation
      if player.retaliateCharges > 0 then
        nextEnemyHp = math.max(0, nextEnemyHp - player.retaliateCharges)
        add_log(next, 'player', 'Retaliatory flames rebound, dealing ' .. player.retaliateCharges .. ' DMG back to ' .. enemy.name .. '!', next.currentTurn)
        player.retaliateCharges = math.max(0, player.retaliateCharges - 1)
      end

      -- Molten burn application
      if enemy.archetype == 'molten_ashling' and intent.description and string.find(intent.description, 'Burn') then
        player.burnDebuff = player.burnDebuff + 1
        add_log(next, 'enemy', 'Molten embers cling to you: Applied 1 Burn debuff stack.', next.currentTurn)
      end
    end
  elseif intent.action == 'defend' then
    nextEnemyShield = nextEnemyShield + intent.value
    add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Stacked defense shields.', next.currentTurn)
  elseif intent.action == 'heal' then
    nextEnemyHp = math.min(enemy.maxHp, nextEnemyHp + intent.value)
    add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Re-bonded shattered stone cores.', next.currentTurn)
  end

  enemy.shield = nextEnemyShield
  enemy.hp = nextEnemyHp

  return next
end

function apply_residue_tick(state)
  local next = copy_table(state)
  local player = next.player
  local enemy = next.enemy

  local isWindswept = false
  for i, r in ipairs(next.residues) do
    if r.tag == 'windswept' then isWindswept = true; break end
  end
  local factor = isWindswept and 2 or 1
  local soakAttackReduction = 0

  local nextEnemyShield = enemy.shield
  local nextEnemyHp = enemy.hp

  for i, r in ipairs(next.residues) do
    if r.tag == 'burning' then
      local burnDmg = r.level * 2 * factor
      nextEnemyShield, nextEnemyHp, unused1 = damage_shield_first(nextEnemyShield, nextEnemyHp, burnDmg)
      add_log(next, 'field', 'Residue Tick: Cauldron heat deals ' .. burnDmg .. ' Burn DMG to ' .. enemy.name .. '!', next.currentTurn)
    elseif r.tag == 'soaked' then
      soakAttackReduction = r.level * 1 * factor
      add_log(next, 'field', 'Residue Tick: Cold steam reduces ' .. enemy.name .. '\'s next attack intents by -' .. soakAttackReduction .. ' DMG.', next.currentTurn)
    end
  end

  enemy.shield = nextEnemyShield
  enemy.hp = nextEnemyHp

  -- Player burn debuff tick
  if player.burnDebuff > 0 then
    player.hp = math.max(0, player.hp - player.burnDebuff)
    add_log(next, 'system', 'Toxic Burn: Taken ' .. player.burnDebuff .. ' DMG from clinging embers.', next.currentTurn)
  end

  next.soakAttackReduction = soakAttackReduction
  return next
end

function advance_hand(state)
  local next = copy_table(state)

  -- Entire hand goes to discard
  local newDiscard = shallow_copy_list(next.discardPile)
  for i, card in ipairs(next.hand) do
    table.insert(newDiscard, card)
  end

  local nextDrawPile = shallow_copy_list(next.drawPile)
  local nextDiscardPile = newDiscard

  if #nextDrawPile < 5 then
    local shuffledDiscard = shuffle_list(nextDiscardPile)
    for i, card in ipairs(shuffledDiscard) do
      table.insert(nextDrawPile, card)
    end
    nextDiscardPile = {}
    add_log(next, 'system', 'Shuffling discard pile back into the cauldron.', next.currentTurn)
  end

  local nextHand = {}
  for i = 1, math.min(5, #nextDrawPile) do
    table.insert(nextHand, nextDrawPile[i])
  end
  local finalDrawPile = {}
  for i = 6, #nextDrawPile do
    table.insert(finalDrawPile, nextDrawPile[i])
  end

  next.hand = nextHand
  next.drawPile = finalDrawPile
  next.discardPile = nextDiscardPile

  return next
end

function resolve_turn(data, state, el1, el2, component, seed)
  local next = copy_table(state)
  local enemy = next.enemy
  if not enemy then return next end
  if not component then return next end
  if not el1 and not el2 then return next end

  local brew = solve_brew(data, el1, el2, component, seed)

  -- Stats tracking
  local stats = next.stats
  stats.brewsCreated = stats.brewsCreated + 1
  stats.totalDamageDealt = stats.totalDamageDealt + brew.damage
  stats.totalShieldGained = stats.totalShieldGained + brew.shield
  stats.totalHealed = stats.totalHealed + brew.heal
  if brew.combination == 'opposed' then
    if brew.damage > 3 then
      stats.volatileSuccesses = stats.volatileSuccesses + 1
    else
      stats.volatileFails = stats.volatileFails + 1
    end
  end

  -- Apply brew effects
  next = resolve_brew(next, brew)

  -- Check victory after brew
  if next.enemy.hp <= 0 then
    next.enemy.hp = 0
    next.enemy.shield = 0
    next.enemy.intent = { action = 'special', value = 0, description = 'Purified' }
    next.combatOutcome = 'victory'
    add_log(next, 'system', 'Victory! Cleansed the ' .. enemy.name .. '.', next.currentTurn)
    next.stats.enemiesDefeated = next.stats.enemiesDefeated + 1
    return next
  end

  -- Enemy turn
  next = resolve_enemy_turn(next, brew)

  -- Check defeat after enemy turn
  if next.player.hp <= 0 then
    next.player.hp = 0
    next.combatOutcome = 'defeat'
    add_log(next, 'system', 'Your physical form dissolved... Run failed.', next.currentTurn)
    return next
  end

  -- Residue tick
  next = apply_residue_tick(next)

  -- Check player death from burn
  if next.player.hp <= 0 then
    next.player.hp = 0
    next.combatOutcome = 'defeat'
    return next
  end

  -- Check enemy death from residue tick
  if next.enemy.hp <= 0 then
    next.enemy.hp = 0
    next.enemy.shield = 0
    next.enemy.intent = { action = 'special', value = 0, description = 'Purified' }
    next.combatOutcome = 'victory'
    add_log(next, 'system', 'Victory! Residue fields dissolved the ' .. next.enemy.name .. '.', next.currentTurn)
    next.stats.enemiesDefeated = next.stats.enemiesDefeated + 1
    return next
  end

  local nextTurnNum = next.currentTurn + 1

  -- Decay standard shield, apply Earth decaying shield carryover
  next.player.shield = next.player.decayingShield
  if next.player.decayingShield > 0 then
    add_log(next, 'player', 'Earth core stability: carried over ' .. next.player.decayingShield .. ' shield to next turn.', next.currentTurn)
  end
  next.player.decayingShield = 0

  -- Decay active residues
  local decayedResidues = {}
  for i, res in ipairs(next.residues) do
    local newLevel = res.level
    if res.tag == 'fortified' then
      if nextTurnNum % 2 == 0 then
        newLevel = math.max(0, res.level - 1)
      end
    else
      newLevel = math.max(0, res.level - 1)
    end
    if newLevel > 0 then
      table.insert(decayedResidues, { tag = res.tag, level = newLevel })
    end
  end
  next.residues = decayedResidues

  -- Advance hand
  next = advance_hand(next)

  -- Compute next enemy intent with soak/weakness reductions
  local rawIntent = get_enemy_intent(data, next.enemy.archetype, nextTurnNum)
  local finalIntentValue = rawIntent.value
  if rawIntent.action == 'attack' or rawIntent.action == 'special' then
    local reduction = (next.soakAttackReduction or 0) + brew.weaknessStacks
    finalIntentValue = math.max(0, rawIntent.value - reduction)
  end
  local desc = rawIntent.description
  if rawIntent.action == 'attack' then
    local baseDesc = rawIntent.description:match('^(.-)%s*%(') or rawIntent.description
    desc = baseDesc .. ' (' .. finalIntentValue .. ' DMG)'
  end
  next.enemy.intent = {
    action = rawIntent.action,
    value = finalIntentValue,
    description = desc
  }

  next.currentTurn = nextTurnNum
  next.soakAttackReduction = nil

  add_log(next, 'system', 'Turn ' .. nextTurnNum .. ' Begins. Draw hand refilled.', next.currentTurn)

  return next
end

-- ============================================================
-- NON-COMBAT NODES
-- ============================================================

function generate_forage_options()
  local pool = {'fire', 'water', 'earth', 'air'}
  return {
    pool[math.random(#pool)],
    pool[math.random(#pool)],
    pool[math.random(#pool)]
  }
end

function choose_forage(state, element)
  local next = copy_table(state)
  table.insert(next.deck, element)
  next.forageOptions = nil
  return next
end

function rest_stoke_furnace(state)
  local next = copy_table(state)
  next.player.hp = math.min(next.player.maxHp, next.player.hp + 12)
  next.player.burnDebuff = 0
  return next
end

function rest_synthesize_element(state, element)
  local next = copy_table(state)
  table.insert(next.deck, element)
  return next
end

function advance_node(state)
  local next = copy_table(state)
  next.currentNodeId = next.currentNodeId + 1
  if next.currentNodeId > 9 then
    next.screen = 'game_over'
    next.runWon = true
  end
  return next
end

function init_node(data, state, node_id)
  local node = nil
  for i, n in ipairs(state.nodes) do
    if n.id == node_id then node = n; break end
  end
  if not node then
    error('Node ' .. tostring(node_id) .. ' not found')
  end

  if node.type == 'fight' then
    return init_fight(data, state, node_id)
  elseif node.type == 'forage' then
    local next = copy_table(state)
    next.forageOptions = generate_forage_options()
    next.combatOutcome = nil
    return next
  elseif node.type == 'rest' then
    local next = copy_table(state)
    next.combatOutcome = nil
    return next
  end
  return copy_table(state)
end
