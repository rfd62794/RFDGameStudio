-- Dissonance Depths — Combat Logic
-- Ported from src/logic/combat.ts

local ELEMENTS = { "ember", "ash", "spark", "cinder" }

function get_secondary_type(relation_type)
  if relation_type == "same" then return "burst" end
  if relation_type == "adjacent" then return "hybrid" end
  if relation_type == "opposed" then return "volatile" end
  return nil
end

TYPE_ADVANTAGE = {
  burst = "volatile",
  volatile = "hybrid",
  hybrid = "burst",
}

function get_type_multiplier(card_type, enemy_profile)
  if not card_type then return 1.0 end
  local vulnerable = enemy_profile and enemy_profile.vulnerable
  local resistant = enemy_profile and enemy_profile.resistant
  if vulnerable and vulnerable == card_type then return 1.3 end
  if resistant and resistant == card_type then return 0.7 end
  return 1.0
end

function canonicalize_elements(el1, el2)
  if not el2 then return { el1, nil } end
  if el1 == el2 then return { el1, el2 } end
  local i1 = nil
  local i2 = nil
  for idx, el in ipairs(ELEMENTS) do
    if el == el1 then i1 = idx end
    if el == el2 then i2 = idx end
  end
  if not i1 or not i2 then return { el1, el2 } end
  if i1 < i2 then return { el1, el2 } else return { el2, el1 } end
end

local MODIFIERS = {
  ember  = { sever = 2, mend = -1, guard = -1, unmake = 1 },
  ash    = { sever = 0, mend = 1, guard = 1, unmake = 2 },
  spark  = { sever = 3, mend = -2, guard = -1, unmake = 0 },
  cinder = { sever = 1, mend = 0, guard = 2, unmake = 1 },
}

function resolve_combination(el1, el2, component, seed)
  local i1 = -1
  local i2 = -1
  for idx, el in ipairs(ELEMENTS) do
    if el == el1 then i1 = idx end
    if el2 and el == el2 then i2 = idx end
  end

  local base_val = 0
  if component == "mend" then base_val = 5
  elseif component == "guard" then base_val = 5
  elseif component == "sever" then base_val = 6
  elseif component == "unmake" then base_val = 3 end

  local mod = (MODIFIERS[el1] and MODIFIERS[el1][component]) or 0
  local value_before_multiplier = base_val + mod

  local relation_type = "single"
  local multiplier = 1.0
  local opposed_success = nil
  local bonus_text = ""
  local bonus_effect = nil

  if not el2 then
    relation_type = "single"
    multiplier = 1.0
  elseif i1 == i2 then
    relation_type = "same"
    multiplier = 1.5
  else
    local diff = math.abs(i1 - i2)
    if diff == 1 or diff == 3 then
      relation_type = "adjacent"
      multiplier = 1.0
      if el2 == "ember" then
        bonus_text = "Bonus Heat (+2 Damage)"
        bonus_effect = { type = "damage", value = 2 }
      elseif el2 == "ash" then
        bonus_text = "Bonus Ash (+2 Shield)"
        bonus_effect = { type = "shield", value = 2 }
      elseif el2 == "spark" then
        bonus_text = "Bonus Spark (+2 Heal)"
        bonus_effect = { type = "heal", value = 2 }
      elseif el2 == "cinder" then
        bonus_text = "Bonus Cinder (+2 Shield)"
        bonus_effect = { type = "shield", value = 2 }
      end
    elseif diff == 2 then
      relation_type = "opposed"
      local temp = (seed * 1103515245 + 12345) % 2147483648
      local roll = temp / 2147483648
      if roll < 0.5 then
        opposed_success = true
        multiplier = 1.5
      else
        opposed_success = false
        multiplier = 0.5
      end
    end
  end

  local modified_value = math.floor(value_before_multiplier * multiplier + 0.5)

  local message = ""
  local p_name = string.upper(el1)
  local s_name = el2 and string.upper(el2) or "NONE"
  local c_name = string.upper(component)

  if relation_type == "single" then
    message = string.format("Single Element: Combined %s with %s. Base power: %d (%s%d from %s). Total: %d.",
      p_name, c_name, base_val, mod >= 0 and "+" or "", mod, p_name, modified_value)
  elseif relation_type == "same" then
    message = string.format("Perfect Resonance (Same Elements): Combined %s & %s with %s. 1.5x power multiplier! Total: %d.",
      p_name, s_name, c_name, modified_value)
  elseif relation_type == "adjacent" then
    message = string.format("Adjacent Harmony: Combined %s & %s with %s. Base: %d. Secondary bonus triggered: %s.",
      p_name, s_name, c_name, modified_value, bonus_text)
  elseif relation_type == "opposed" then
    if opposed_success then
      message = string.format("Opposed Resonance Success! Combined %s & %s with %s. Stable fusion achieved! 1.5x multiplier applied. Total: %d.",
        p_name, s_name, c_name, modified_value)
    else
      message = string.format("Opposed Dissonance Collapse! Combined %s & %s with %s. Unstable reaction. 0.5x penalty applied. Total: %d.",
        p_name, s_name, c_name, modified_value)
    end
  end

  return {
    baseValue = value_before_multiplier,
    modifiedValue = modified_value,
    relationType = relation_type,
    multiplier = multiplier,
    bonusText = bonus_text,
    bonusEffect = bonus_effect,
    opposedSuccess = opposed_success,
    message = message,
    dotDuration = (component == "unmake") and 2 or nil,
    dotDamage = (component == "unmake") and modified_value or nil,
  }
end

function get_behavior_type_intent(behavior_id, turn)
  if behavior_id == "mirror" then
    local patterns = {
      { type = "attack", value = 4, description = "[Mirror] Reflective Strike (4 Dmg - Mirror Stance)" },
      { type = "heavy_attack", value = 7, description = "[Mirror] Echo Slash (7 Dmg - Reflected Action)" },
      { type = "shield", value = 6, description = "[Mirror] Prism Barrier (6 Shield)" },
      { type = "attack", value = 5, description = "[Mirror] Shatter Pulse (5 Dmg)" },
    }
    return patterns[((turn - 1) % 4) + 1]
  elseif behavior_id == "escalator" then
    local dmg = math.floor(4 + turn * 1.5 + 0.5)
    return { type = "attack", value = dmg, description = string.format("[Escalator] Escalating Pulse (%d Dmg - Growing Threat)", dmg) }
  elseif behavior_id == "weaver" then
    local stances = { "Burst Stance", "Hybrid Stance", "Volatile Stance" }
    local st = stances[((turn - 1) % 3) + 1]
    return { type = "attack", value = 5, description = string.format("[Weaver] %s Shift (5 Dmg - Shifting Type)", st) }
  elseif behavior_id == "saboteur" then
    local slot = ((turn - 1) % 3) + 1
    return { type = "attack", value = 5, description = string.format("[Saboteur] Lock Hand Slot #%d (5 Dmg)", slot) }
  elseif behavior_id == "parasite" then
    local rot = 2 + math.floor((turn - 1) / 2)
    return { type = "dot_attack", value = rot, duration = 3, description = string.format("[Parasite] Corrupting Spore (%d Dmg/Turn for 3 Turns)", rot) }
  elseif behavior_id == "coin" then
    if turn % 2 == 1 then
      return { type = "attack", value = 8, description = "[Coin] Dual Telegraph: Heavy Attack (8 Dmg) OR Counter Shield" }
    else
      return { type = "shield", value = 8, description = "[Coin] Dual Telegraph: Guard (8 Shield) OR Spark Strike" }
    end
  elseif behavior_id == "countdown" then
    local cycle_step = ((turn - 1) % 3) + 1
    if cycle_step == 1 then
      return { type = "shield", value = 5, description = "[Countdown] Prime Core (5 Shield - T-minus 2 Turns)" }
    elseif cycle_step == 2 then
      return { type = "attack", value = 3, description = "[Countdown] Energy Focus (3 Dmg - T-minus 1 Turn)" }
    else
      return { type = "heavy_attack", value = 16, description = "[Countdown] DEVASTATING PULSE SPIKE!! (16 Dmg)" }
    end
  elseif behavior_id == "tally" then
    local cycle_step = ((turn - 1) % 3) + 1
    if cycle_step == 3 then
      return { type = "heavy_attack", value = 10, description = "[Tally] Punishing Overload! (10 Dmg Threshold Strike)" }
    else
      return { type = "attack", value = 4, description = string.format("[Tally] Resonance Gauge (4 Dmg - Tracking Action Repeats Step %d)", cycle_step) }
    end
  else
    return { type = "attack", value = 5, description = "Strike (5 Dmg)" }
  end
end

local function find_enemy_def(enemy_name)
  local pool = ENEMY_POOL
  if not pool then return nil end
  for _, e in ipairs(pool) do
    if e.name == enemy_name or e.id == enemy_name or string.find(enemy_name, e.name or "", 1, true) == 1 then
      return e
    end
  end
  return nil
end

function get_enemy_intent(enemy_name, turn)
  local matched = find_enemy_def(enemy_name)
  if matched and matched.behaviorTypeIds and #matched.behaviorTypeIds > 0 then
    local ids = matched.behaviorTypeIds
    if #ids == 1 then
      return get_behavior_type_intent(ids[1], turn)
    else
      local active_id = (turn % 2 == 1) and ids[1] or ids[2]
      return get_behavior_type_intent(active_id, turn)
    end
  end

  local t = (turn - 1) % 4
  local multiplier = 1.0
  if string.find(enemy_name, "Elite", 1, true) == 1 then multiplier = 1.5
  elseif string.find(enemy_name, "Advanced", 1, true) == 1 then multiplier = 1.25
  elseif string.find(enemy_name, "(Boss)", 1, true) or string.find(enemy_name, "Deep", 1, true) == 1 or string.find(enemy_name, "Echo", 1, true) then multiplier = 1.8
  end

  local function scaled(v)
    return math.floor(v * multiplier + 0.5)
  end

  if string.find(enemy_name, "Drifting Cinder", 1, true) then
    local patterns = {
      { type = "attack", value = 4, description = "Erratic Spark (4 Dmg)" },
      { type = "shield", value = 5, description = "Cinder Veil (5 Shield)" },
      { type = "attack", value = 6, description = "Erratic Burst (6 Dmg)" },
      { type = "dot_attack", value = 2, duration = 2, description = "Cinder Flare (2 Dmg/Turn for 2 Turns)" },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Sparkling Husk", 1, true) then
    local patterns = {
      { type = "attack", value = 6, description = "Husk Strike (6 Dmg)" },
      { type = "attack", value = 5, description = "Fast Spark (5 Dmg)" },
      { type = "attack", value = 4, description = "Husk Jab (4 Dmg)" },
      { type = "shield", value = 3, description = "Fragile Guard (3 Shield)" },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Ashbound Wisp", 1, true) then
    if turn == 1 then
      return { type = "shield", value = 8, description = "Wisp Guard (8 Shield)" }
    end
    local patterns = {
      { type = "shield", value = 8, description = "Wisp Guard (8 Shield)" },
      { type = "attack", value = 4, description = "Wisp Lash (4 Dmg)" },
      { type = "attack", value = 5, description = "Spark Flash (5 Dmg)" },
      { type = "shield", value = 5, description = "Smoke Screen (5 Shield)" },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Molten Ashling", 1, true) then
    local escalation_dmg = 4 + (turn - 1) * 2
    local patterns = {
      { type = "attack", value = escalation_dmg, description = string.format("Molten Strike (%d Dmg - Escalating)", escalation_dmg) },
      { type = "attack", value = escalation_dmg + 1, description = string.format("Molten Surge (%d Dmg - Escalating)", escalation_dmg + 1) },
      { type = "shield", value = 5, description = "Molten Shell (5 Shield)" },
      { type = "heavy_attack", value = escalation_dmg + 3, description = string.format("Eruption (%d Dmg - Escalating)", escalation_dmg + 3) },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Cinder Brute", 1, true) then
    if turn % 3 == 0 then
      return { type = "heavy_attack", value = 16, description = "Devastating Brute Smash!! (16 Dmg)" }
    end
    local patterns = {
      { type = "attack", value = 5, description = "Cinder Swipe (5 Dmg)" },
      { type = "shield", value = 5, description = "Brute Stance (5 Shield)" },
      { type = "heavy_attack", value = 16, description = "Devastating Brute Smash!! (16 Dmg)" },
    }
    return patterns[((turn - 1) % 3) + 1] or patterns[1]
  elseif string.find(enemy_name, "Spark Lash", 1, true) then
    local patterns = {
      { type = "attack", value = 6, description = "Double Spark (3x2 Dmg)" },
      { type = "attack", value = 5, description = "Lash Flutter (5 Dmg)" },
      { type = "attack", value = 8, description = "Double Lash (4x2 Dmg)" },
      { type = "shield", value = 4, description = "Spark Shroud (4 Shield)" },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Ashen Marauder", 1, true) then
    local patterns = {
      { type = "dot_attack", value = 2, duration = 3, description = "Ashen Decay (2 Dmg/Turn for 3 Turns)" },
      { type = "attack", value = 5, description = "Marauder Slash (5 Dmg)" },
      { type = "dot_attack", value = 3, duration = 2, description = "Void Rot Mirror (3 Dmg/Turn for 2 Turns)" },
      { type = "shield", value = 5, description = "Ashen Shroud (5 Shield)" },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Fracture Warden", 1, true) then
    local patterns = {
      { type = "shield", value = 6, description = "Warden Shield (6 Shield)" },
      { type = "attack", value = 6, description = "Fracture Strike (6 Dmg)" },
      { type = "attack", value = 7, description = "Dissonant Pulse (7 Dmg)" },
      { type = "shield", value = 5, description = "Warden Barrier (5 Shield)" },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Cinderlord Sentinel", 1, true) then
    local patterns = {
      { type = "attack", value = 5, description = "Sentinel Flame (5 Dmg)" },
      { type = "attack", value = 6, description = "Sentinel Slash (6 Dmg)" },
      { type = "heavy_attack", value = 8, description = "Cinder Blast (8 Dmg)" },
      { type = "attack", value = 6, description = "Sentinel Flame (6 Dmg)" },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Ashling", 1, true) then
    local patterns = {
      { type = "attack", value = scaled(3), description = string.format("Quick Spark (%d Dmg)", scaled(3)) },
      { type = "attack", value = scaled(5), description = string.format("Flame Leap (%d Dmg)", scaled(5)) },
      { type = "shield", value = scaled(2), description = string.format("Smoke Veil (%d Shield)", scaled(2)) },
      { type = "dot_attack", value = scaled(1), duration = 2, description = string.format("Ashen Rot (%d Dmg/Turn for 2 Turns)", scaled(1)) },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Bulwark", 1, true) then
    local patterns = {
      { type = "shield", value = scaled(6), description = string.format("Iron Wall (%d Shield)", scaled(6)) },
      { type = "attack", value = scaled(4), description = string.format("Shield Slam (%d Dmg)", scaled(4)) },
      { type = "shield", value = scaled(4), description = string.format("Rocky Shell (%d Shield)", scaled(4)) },
      { type = "heavy_attack", value = scaled(7), description = string.format("Heavy Smash! (%d Dmg)", scaled(7)) },
    }
    return patterns[t + 1] or patterns[1]
  elseif string.find(enemy_name, "Guardian") or string.find(enemy_name, "Rootbound") then
    local patterns = {
      { type = "shield", value = scaled(6), description = string.format("Root Armor (%d Shield)", scaled(6)) },
      { type = "attack", value = scaled(5), description = string.format("Thorn Lash (%d Dmg)", scaled(5)) },
      { type = "dot_attack", value = scaled(2), duration = 2, description = string.format("Spore Choke (%d Dmg/Turn for 2 Turns)", scaled(2)) },
      { type = "heavy_attack", value = scaled(9), description = string.format("Forest Slam! (%d Dmg)", scaled(9)) },
    }
    return patterns[t + 1] or patterns[1]
  else
    local patterns = {
      { type = "dot_attack", value = scaled(2), duration = 3, description = string.format("Void Rot (%d Dmg/Turn for 3 Turns)", scaled(2)) },
      { type = "shield", value = scaled(6), description = string.format("Fracture Shield (%d Shield)", scaled(6)) },
      { type = "attack", value = scaled(6), description = string.format("Echo Strike (%d Dmg)", scaled(6)) },
      { type = "heavy_attack", value = scaled(10), description = string.format("Dissonance Scream!!! (%d Dmg)", scaled(10)) },
    }
    return patterns[t + 1] or patterns[1]
  end
end

-- ============================================================
-- BREWFIELD CHEMISTRY LAYER
-- Elemental residue statuses on the enemy + the 4x4 component x element
-- effect matrix, driven entirely by data.residue.chemistry. Semantics come
-- from games/brewfield/logic.lua (solve_brew, update_residue_field,
-- apply_residue_tick); the shape is Dissonance's data-driven style.
-- These are pure helpers — run_state.resolve_combat_turn applies the results.
-- ============================================================

local function chem_config(data)
  return data and data.residue and data.residue.chemistry or nil
end

function chemistry_active(run_state, data)
  local cfg = chem_config(data)
  if not cfg then return false end
  return (run_state.currentFloor or 1) >= (cfg.min_floor or 4)
end

local function chem_statuses(data)
  local cfg = chem_config(data)
  return (cfg and cfg.statuses) or {}
end

local function residue_list(residues)
  if type(residues) ~= "table" then return {} end
  if collect then return collect(residues) end
  return residues
end

function residue_tag_for_element(element, data)
  for tag, def in pairs(chem_statuses(data)) do
    if def.element == element then return tag end
  end
  return nil
end

function residue_matrix_cell(component, element, data)
  local cfg = chem_config(data)
  local matrix = cfg and cfg.matrix
  local row = matrix and matrix[component]
  return (row and row[element]) or {}
end

function scale_matrix_effect(v, multiplier)
  return math.floor((v or 0) * (multiplier or 1) + 0.5)
end

-- Deposit the residue status of `element` onto the enemy's residue list.
-- Mirrors Brewfield's update_residue_field rules, adapted to on-target
-- statuses: same element amplifies, opposed element annihilates, unrelated
-- adds (replacing oldest at capacity); fortified resists removal.
-- Returns { residues = <new list>, logs = {..} }.
function deposit_enemy_residue(residues, element, is_opposed, data)
  local defs = chem_statuses(data)
  local updated = {}
  for _, r in ipairs(residue_list(residues)) do
    table.insert(updated, {
      tag = r.tag,
      level = r.level or 1,
      turnsLeft = r.turnsLeft or (defs[r.tag] and defs[r.tag].duration) or 2,
    })
  end
  local logs = {}

  if is_opposed then
    table.insert(logs, "[Residue] Opposed reaction — no residue could settle on the target.")
    return { residues = updated, logs = logs }
  end
  if not element then
    return { residues = updated, logs = logs }
  end

  local tag = residue_tag_for_element(element, data)
  if not tag then
    return { residues = updated, logs = logs }
  end

  local duration = (defs[tag] and defs[tag].duration) or 2
  local max_slots = (data and data.residue and data.residue.max_slots) or 2
  local max_level = (data and data.residue and data.residue.max_level) or 3
  local opposed_pairs = (data and data.residue and data.residue.opposed_pairs) or {}
  local opposed_el = opposed_pairs[element]
  local opposed_tag = opposed_el and residue_tag_for_element(opposed_el, data) or nil

  -- Same element amplifies an existing status and refreshes its duration.
  for _, r in ipairs(updated) do
    if r.tag == tag then
      local old = r.level
      r.level = math.min(max_level, old + 1)
      r.turnsLeft = duration
      if r.level > old then
        table.insert(logs, string.format("[Residue] %s amplified to Level %d!", string.upper(tag), r.level))
      else
        table.insert(logs, string.format("[Residue] %s refreshed at Level %d.", string.upper(tag), r.level))
      end
      return { residues = updated, logs = logs }
    end
  end

  -- Opposed element annihilates the opposed status (no new deposit).
  if opposed_tag then
    for i, r in ipairs(updated) do
      if r.tag == opposed_tag then
        local def = defs[opposed_tag] or {}
        if def.absorbs_annihilation and (r.level or 1) > 1 then
          r.level = r.level - 1
          table.insert(logs, string.format("[Residue] %s absorbed the annihilation — diminished to Level %d.", string.upper(opposed_tag), r.level))
        else
          table.remove(updated, i)
          table.insert(logs, string.format("[Residue] %s annihilated the opposed %s!", string.upper(tag), string.upper(opposed_tag)))
        end
        return { residues = updated, logs = logs }
      end
    end
  end

  -- Unrelated element: add, or replace at capacity (resists_overwrite last).
  if #updated < max_slots then
    table.insert(updated, { tag = tag, level = 1, turnsLeft = duration })
    table.insert(logs, string.format("[Residue] %s settled on the target (Level 1).", string.upper(tag)))
    return { residues = updated, logs = logs }
  end

  for i, r in ipairs(updated) do
    local def = defs[r.tag] or {}
    if not def.resists_overwrite then
      local replaced = r.tag
      updated[i] = { tag = tag, level = 1, turnsLeft = duration }
      table.insert(logs, string.format("[Residue] %s replaced %s on the target.", string.upper(tag), string.upper(replaced)))
      return { residues = updated, logs = logs }
    end
  end

  -- Every slot resists overwrite: wear the oldest down one level instead.
  local first = updated[1]
  if (first.level or 1) > 1 then
    first.level = first.level - 1
    table.insert(logs, string.format("[Residue] %s shell absorbed the overwrite — diminished to Level %d.", string.upper(first.tag), first.level))
  else
    local worn = first.tag
    updated[1] = { tag = tag, level = 1, turnsLeft = duration }
    table.insert(logs, string.format("[Residue] %s was finally worn down and replaced by %s.", string.upper(worn), string.upper(tag)))
  end
  return { residues = updated, logs = logs }
end

-- Per-turn residue behaviour. Returns effect magnitudes; the caller applies
-- them to enemy/player state so victory checks stay in one place.
function tick_enemy_residues(residues, data)
  local defs = chem_statuses(data)
  local list = residue_list(residues)

  local factor = 1
  for _, r in ipairs(list) do
    local def = defs[r.tag]
    if def and def.amplify_factor then
      factor = def.amplify_factor
      break
    end
  end

  local enemy_damage = 0
  local player_shield = 0
  local intent_reduction = 0
  local logs = {}

  for _, r in ipairs(list) do
    local def = defs[r.tag] or {}
    local lvl = r.level or 1
    if def.tick_damage then
      local dmg = lvl * def.tick_damage * factor
      enemy_damage = enemy_damage + dmg
      table.insert(logs, string.format("[Residue] %s ticks — %d damage to the enemy.", string.upper(r.tag), dmg))
    end
    if def.intent_reduction then
      local red = lvl * def.intent_reduction * factor
      intent_reduction = intent_reduction + red
      table.insert(logs, string.format("[Residue] %s chills the enemy — next attack intents -%d.", string.upper(r.tag), red))
    end
    if def.shield_per_level then
      local sh = lvl * def.shield_per_level * factor
      player_shield = player_shield + sh
      table.insert(logs, string.format("[Residue] %s hardens around you — +%d Shield carried into next turn.", string.upper(r.tag), sh))
    end
  end

  return { enemyDamage = enemy_damage, playerShield = player_shield, intentReduction = intent_reduction, logs = logs }
end

-- Burning residues flare immediately (air blight's ticks_active_dots).
function residue_immediate_burn(residues, data)
  local defs = chem_statuses(data)
  local list = residue_list(residues)

  local factor = 1
  for _, r in ipairs(list) do
    local def = defs[r.tag]
    if def and def.amplify_factor then
      factor = def.amplify_factor
      break
    end
  end

  local damage = 0
  for _, r in ipairs(list) do
    local def = defs[r.tag] or {}
    if def.tick_damage then
      damage = damage + (r.level or 1) * def.tick_damage * factor
    end
  end
  return damage
end

-- Residues expire by turnsLeft — one turn is consumed per combat turn,
-- after the tick. Returns the surviving list.
function decay_enemy_residues(residues, data)
  local out = {}
  local expired = {}
  for _, r in ipairs(residue_list(residues)) do
    local left = (r.turnsLeft or 0) - 1
    if left > 0 then
      table.insert(out, { tag = r.tag, level = r.level or 1, turnsLeft = left })
    else
      table.insert(expired, r.tag)
    end
  end
  return { residues = out, expired = expired }
end
