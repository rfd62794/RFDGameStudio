-- Dissonance Depths — Game Logic Entry Point
-- This file is concatenated after the split logic modules by the runtime.

-- Initialize global enemy pool from data.yaml (called manually by tests / runtime).
function init_dissonance(data)
  build_enemy_pool(data)
  return true
end

-- Convenience wrappers around module functions.

function play_card(card, run_state, data)
  local result = resolve_combination(card.el1, card.el2, card.component, run_state.seed)
  local synergy = apply_synergy_mechanic(run_state.activeBuild, card, result, run_state, false)
  return {
    baseResult = synergy.result,
    nextMechanicState = synergy.nextMechanicState,
    logMessages = synergy.logMessages,
    extraPlayerShield = synergy.extraPlayerShield,
    extraValueBonus = synergy.extraValueBonus,
    extraEssence = synergy.extraEssence,
  }
end
