-- Dissonance Depths — Build Archetype & Synergy Mechanics
-- Ported and corrected from src/logic/builds.ts

GATE_MAP = {
  escalation_boon = "burster",
  embers_momentum = "burster",
  cracked_mirror = "gambler",
  volatile_surge = "gambler",
  guard_reflect = "steward",
  steadfast_ward = "steward",
  ember_sever_duo = "weaver",
  spark_mend_duo = "weaver",
  ash_guard_duo = "weaver",
  cinder_unmake_duo = "weaver",
  anchor_of_ash = "vault",
  essence_ledger = "vault",
}

BUILD_DETAILS = {
  burster = { name = "Burster", mechanicName = "Escalation", icon = "🔥",
    description = "Consecutive Same plays stack Escalation (+0.25x multiplier per stack, resets on non-Same play)." },
  gambler = { name = "Gambler", mechanicName = "Momentum", icon = "🎲",
    description = "Opposed plays stack Momentum (+0.15x to Opposed multipliers on both success & fail)." },
  steward = { name = "Steward", mechanicName = "Reserves", icon = "🛡️",
    description = "Guard actions accumulate Ward Reserves (+2 Ward per Guard, boosting defenses & reflect)." },
  weaver = { name = "Weaver", mechanicName = "Chain", icon = "🧵",
    description = "Alternating action types stack Chain; 4 distinct actions grant a completion bonus." },
  vault = { name = "Vault", mechanicName = "Compound", icon = "💎",
    description = "Undamaged Guard plays compound toward an Essence payout threshold." },
}

function check_build_gate(item_id, current_build)
  current_build = current_build or { buildId = nil, mechanicState = {} }
  if current_build.buildId then
    return { build = current_build, newlyCommitted = false }
  end

  local target_build_id = GATE_MAP[item_id]
  if target_build_id then
    local details = BUILD_DETAILS[target_build_id]
    local new_build = { buildId = target_build_id, mechanicState = {} }
    return {
      build = new_build,
      newlyCommitted = true,
      message = string.format("✨ BUILD COMMITTED: %s — %s is now active! (%s)",
        details.name, details.mechanicName, details.description),
    }
  end

  return { build = current_build, newlyCommitted = false }
end

function get_build_offer_warning(item_id, active_build)
  if not active_build or not active_build.buildId then return nil end
  local target_build = GATE_MAP[item_id]
  if not target_build or target_build == active_build.buildId then return nil end
  local current_details = BUILD_DETAILS[active_build.buildId]
  local target_details = BUILD_DETAILS[target_build]
  return string.format("⚠️ Build Committed: You are aligned with %s. This item will grant its stats but will NOT unlock %s (%s) mechanic.",
    current_details.name, target_details.name, target_details.mechanicName)
end

-- Apply the active build's synergy mechanic to a played card.
-- played_card: { component, relationType, el1, el2, ... }
-- result: output table from resolve_combination
-- run_state: full run state table
-- damage_taken: true if the player took damage this turn (used for Vault correction)
function apply_synergy_mechanic(active_build, played_card, result, run_state, damage_taken)
  if not active_build or not active_build.buildId then
    return { result = result, nextMechanicState = {}, logMessages = {} }
  end

  local build_id = active_build.buildId
  local current_state = active_build.mechanicState or {}
  local next_state = {}
  for k, v in pairs(current_state) do next_state[k] = v end

  local log_messages = {}
  local updated_result = {}
  for k, v in pairs(result) do updated_result[k] = v end

  local extra_player_shield = 0
  local extra_value_bonus = 0
  local extra_essence = 0

  if build_id == "burster" then
    if played_card.relationType == "same" then
      local stacks = (tonumber(current_state.escalationStacks) or 0) + 1
      next_state.escalationStacks = stacks
      local boost = stacks * 0.25
      local new_mult = updated_result.multiplier + boost
      local modified_value = math.floor(updated_result.baseValue * new_mult + 0.5)
      updated_result.multiplier = new_mult
      updated_result.modifiedValue = modified_value
      table.insert(log_messages, string.format("🔥 [Burster Escalation x%d] Same-relation play stacked +%.2fx multiplier! Modified total: %d.", stacks, boost, modified_value))
    else
      if (tonumber(current_state.escalationStacks) or 0) > 0 then
        table.insert(log_messages, "ℹ️ [Burster Escalation Reset] Non-Same relation played — Escalation stacks reset to 0.")
      end
      next_state.escalationStacks = 0
    end

  elseif build_id == "gambler" then
    if played_card.relationType == "opposed" then
      local stacks = (tonumber(current_state.momentumStacks) or 0) + 1
      next_state.momentumStacks = stacks
      local boost = stacks * 0.15
      local new_mult = updated_result.multiplier + boost
      local modified_value = math.floor(updated_result.baseValue * new_mult + 0.5)
      updated_result.multiplier = new_mult
      updated_result.modifiedValue = modified_value
      table.insert(log_messages, string.format("🎲 [Gambler Momentum x%d] Opposed play stacked +%.2fx multiplier! Modified total: %d.", stacks, boost, modified_value))
    end

  elseif build_id == "steward" then
    if played_card.component == "guard" then
      local reserves = (tonumber(current_state.wardReserves) or 0) + 2
      next_state.wardReserves = reserves
      extra_player_shield = reserves
      table.insert(log_messages, string.format("🛡️ [Steward Reserves] Guard action built Ward Reserves (+2) — Total Ward %d. Added +%d extra Shield!", reserves, reserves))
    end

  elseif build_id == "weaver" then
    -- Corrected: track the last 4 distinct action types with zero repeats.
    local chain = {}
    if type(current_state.chain) == "table" then
      for _, c in ipairs(current_state.chain) do table.insert(chain, c) end
    end

    local action = played_card.component
    local repeated = false
    for _, c in ipairs(chain) do
      if c == action then repeated = true; break end
    end

    if repeated then
      -- Hard reset: a repeat disqualifies the current chain.
      chain = { action }
      table.insert(log_messages, string.format("🧵 [Weaver Chain Reset] Repeated action '%s' — chain reset. Start again from this play.", action))
    else
      table.insert(chain, action)
    end

    if #chain == 4 then
      extra_value_bonus = #chain * 4
      updated_result.modifiedValue = updated_result.modifiedValue + extra_value_bonus
      table.insert(log_messages, string.format("🧵 [Weaver Chain Complete] 4 distinct actions! Added +%d flat power output.", extra_value_bonus))
      -- Reset after completion bonus; the current action seeds the next chain.
      chain = { action }
    end

    next_state.chain = chain

  elseif build_id == "vault" then
    -- Corrected: compound stacks on Guard played without taking damage.
    local VAULT_THRESHOLD = 3
    local VAULT_PAYOUT = 10
    if played_card.component == "guard" and not damage_taken then
      local stacks = (tonumber(current_state.compoundStacks) or 0) + 1
      next_state.compoundStacks = stacks
      table.insert(log_messages, string.format("💎 [Vault Compound] Undamaged Guard stacked Compound (%d/%d).", stacks, VAULT_THRESHOLD))
      if stacks >= VAULT_THRESHOLD then
        extra_essence = VAULT_PAYOUT
        next_state.compoundStacks = 0
        table.insert(log_messages, string.format("💎 [Vault Compound Payout] Compound threshold reached! +%d Essence.", VAULT_PAYOUT))
      end
    end
  end

  return {
    result = updated_result,
    nextMechanicState = next_state,
    logMessages = log_messages,
    extraPlayerShield = extra_player_shield,
    extraValueBonus = extra_value_bonus,
    extraEssence = extra_essence,
  }
end
