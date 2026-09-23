import { ActiveBuild, BuildId, Card, CombinationResult, RunState } from '../types';

export const GATE_MAP: Record<string, BuildId> = {
  'escalation_boon': 'burster',
  'embers_momentum': 'burster',
  'cracked_mirror': 'gambler',
  'volatile_surge': 'gambler',
  'guard_reflect': 'steward',
  'steadfast_ward': 'steward',
  'ember_sever_duo': 'weaver',
  'spark_mend_duo': 'weaver',
  'ash_guard_duo': 'weaver',
  'cinder_unmake_duo': 'weaver',
  'anchor_of_ash': 'vault',
  'essence_ledger': 'vault',
};

export const BUILD_DETAILS: Record<BuildId, { name: string; mechanicName: string; description: string; icon: string }> = {
  burster: {
    name: 'Burster',
    mechanicName: 'Escalation',
    description: 'Consecutive Same plays stack Escalation (+0.25x multiplier per stack, resets on non-Same play).',
    icon: '🔥',
  },
  gambler: {
    name: 'Gambler',
    mechanicName: 'Momentum',
    description: 'Opposed plays stack Momentum (+0.15x to Opposed multipliers on both success & fail).',
    icon: '🎲',
  },
  steward: {
    name: 'Steward',
    mechanicName: 'Reserves',
    description: 'Guard actions accumulate Ward Reserves (+2 Ward per Guard, boosting defenses & reflect).',
    icon: '🛡️',
  },
  weaver: {
    name: 'Weaver',
    mechanicName: 'Chain',
    description: 'Alternating element/action combinations stack Chain (+4 flat effect value per Chain link).',
    icon: '🧵',
  },
  vault: {
    name: 'Vault',
    mechanicName: 'Compound',
    description: 'Unspent Essence grants compounding card power efficiency (+1% per 2 Essence, up to +25%).',
    icon: '💎',
  },
};

export function checkBuildGate(
  newItemId: string,
  currentBuild?: ActiveBuild | null
): { build: ActiveBuild; newlyCommitted: boolean; message?: string } {
  if (currentBuild?.buildId) {
    return { build: currentBuild, newlyCommitted: false };
  }

  const targetBuildId = GATE_MAP[newItemId];
  if (targetBuildId) {
    const details = BUILD_DETAILS[targetBuildId];
    const newBuild: ActiveBuild = {
      buildId: targetBuildId,
      mechanicState: {},
    };
    return {
      build: newBuild,
      newlyCommitted: true,
      message: `✨ BUILD COMMITTED: ${details.name} — ${details.mechanicName} is now active! (${details.description})`,
    };
  }

  return { build: currentBuild || { buildId: null, mechanicState: {} }, newlyCommitted: false };
}

export function getBuildOfferWarning(itemId: string, activeBuild?: ActiveBuild | null): string | null {
  if (!activeBuild?.buildId) return null;
  const targetBuild = GATE_MAP[itemId];
  if (!targetBuild || targetBuild === activeBuild.buildId) return null;

  const currentDetails = BUILD_DETAILS[activeBuild.buildId];
  const targetDetails = BUILD_DETAILS[targetBuild];
  return `⚠️ Build Committed: You are aligned with ${currentDetails.name}. This item will grant its stats but will NOT unlock ${targetDetails.name} (${targetDetails.mechanicName}) mechanic.`;
}

export function applySynergyMechanic(
  activeBuild: ActiveBuild | undefined | null,
  playedCard: Card,
  result: CombinationResult,
  runState: RunState
): {
  result: CombinationResult;
  nextMechanicState: Record<string, any>;
  logMessages: string[];
  extraPlayerShield?: number;
  extraValueBonus?: number;
} {
  if (!activeBuild?.buildId) {
    return { result, nextMechanicState: {}, logMessages: [] };
  }

  const buildId = activeBuild.buildId;
  const currentState = activeBuild.mechanicState || {};
  let nextState = { ...currentState };
  let logMessages: string[] = [];
  let updatedResult = { ...result };
  let extraPlayerShield = 0;
  let extraValueBonus = 0;

  if (buildId === 'burster') {
    if (playedCard.relationType === 'same') {
      const stacks = (Number(currentState.escalationStacks) || 0) + 1;
      nextState.escalationStacks = stacks;
      const boost = stacks * 0.25;
      const newMult = updatedResult.multiplier + boost;
      const modifiedValue = Math.round(updatedResult.baseValue * newMult);
      updatedResult = {
        ...updatedResult,
        multiplier: newMult,
        modifiedValue,
      };
      logMessages.push(`🔥 [Burster Escalation x${stacks}] Same-relation play stacked +${boost.toFixed(2)}x multiplier! Modified total: ${modifiedValue}.`);
    } else {
      if ((Number(currentState.escalationStacks) || 0) > 0) {
        logMessages.push(`ℹ️ [Burster Escalation Reset] Non-Same relation played — Escalation stacks reset to 0.`);
      }
      nextState.escalationStacks = 0;
    }
  } else if (buildId === 'gambler') {
    if (playedCard.relationType === 'opposed') {
      const stacks = (Number(currentState.momentumStacks) || 0) + 1;
      nextState.momentumStacks = stacks;
      const boost = stacks * 0.15;
      const newMult = updatedResult.multiplier + boost;
      const modifiedValue = Math.round(updatedResult.baseValue * newMult);
      updatedResult = {
        ...updatedResult,
        multiplier: newMult,
        modifiedValue,
      };
      logMessages.push(`🎲 [Gambler Momentum x${stacks}] Opposed play stacked +${boost.toFixed(2)}x multiplier! Modified total: ${modifiedValue}.`);
    }
  } else if (buildId === 'steward') {
    if (playedCard.component === 'guard') {
      const reserves = (Number(currentState.wardReserves) || 0) + 2;
      nextState.wardReserves = reserves;
      extraPlayerShield = reserves;
      logMessages.push(`🛡️ [Steward Reserves] Guard action built Ward Reserves (+2) — Total Ward ${reserves}. Added +${reserves} extra Shield!`);
    }
  } else if (buildId === 'weaver') {
    const currentComboKey = `${playedCard.el1}_${playedCard.component}`;
    const lastCombo = currentState.lastComboKey;
    if (lastCombo && lastCombo !== currentComboKey) {
      const chain = (Number(currentState.chainCount) || 0) + 1;
      nextState.chainCount = chain;
      nextState.lastComboKey = currentComboKey;
      extraValueBonus = chain * 4;
      updatedResult.modifiedValue += extraValueBonus;
      logMessages.push(`🧵 [Weaver Chain x${chain}] Alternating element/action chain! Added +${extraValueBonus} flat power output.`);
    } else {
      nextState.chainCount = 1;
      nextState.lastComboKey = currentComboKey;
      logMessages.push(`🧵 [Weaver Chain Reset] Same combination pattern repeated — Chain set to 1.`);
    }
  } else if (buildId === 'vault') {
    const unspentEssence = runState.essence || 0;
    const compoundPct = Math.min(0.25, Math.floor(unspentEssence / 2) * 0.01);
    if (compoundPct > 0) {
      extraValueBonus = Math.round(updatedResult.modifiedValue * compoundPct);
      updatedResult.modifiedValue += extraValueBonus;
      logMessages.push(`💎 [Vault Compound +${(compoundPct * 100).toFixed(0)}%] Unspent Essence (${unspentEssence}) boosted card power by +${extraValueBonus}!`);
    }
  }

  return {
    result: updatedResult,
    nextMechanicState: nextState,
    logMessages,
    extraPlayerShield,
    extraValueBonus
  };
}
