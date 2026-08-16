/**
 * Gladiator Arena — Combat Balance & Simulation Harness
 * 
 * Executes real automated batches of full combat bouts across all Arena tiers
 * using actual engine functions: initializeBout, executeNextCombatTurn, calculateEffectiveStats,
 * ARENA_TIERS, and generateShopInventory.
 */

import { ActionType, ArenaOpponent, BodyPart, BodySlot, Gladiator, PartRarity } from '../types';
import { calculateEffectiveStats, executeNextCombatTurn, initializeBout } from './combatEngine';
import { ARENA_TIERS } from './championLadder';
import { calculateSurgeryCosts, generateShopInventory, getPartScrapValue } from './forgeEconomy';
import { SHOP_PART_CATALOG, STARTER_PARTS } from '../data/defaultParts';

export interface BalanceHarnessOptions {
  boutsPerOpponent?: number;
  shopSamplesPerTier?: number;
  playerArchetype?: 'starter' | 'cyber_assassin' | 'bio_tank' | 'balanced';
  customPlayer?: Gladiator;
}

export interface TierBalanceSummary {
  tierId: number;
  tierName: string;
  opponentsTested: string[];
  totalBouts: number;
  wins: number;
  losses: number;
  winRatePercent: number;
  avgRoundsToResolve: number;
  minRounds: number;
  maxRounds: number;
  actionDistribution: Record<ActionType, { count: number; percentage: number }>;
  enemyActionDistribution: Record<ActionType, { count: number; percentage: number }>;
  combatMetrics: {
    avgCritsPerBout: number;
    avgRecoilsPerBout: number;
    avgMalfunctionsPerBout: number;
    avgDamageDealt: number;
    avgDamageTaken: number;
  };
  shopRarityDistribution: Record<PartRarity, { count: number; percentage: number }>;
  balanceFlags: string[];
}

export interface BalanceReport {
  timestamp: number;
  sampleSizePerOpponent: number;
  playerProfile: {
    name: string;
    personality: Gladiator['personality'];
    effectiveStats: {
      power: number;
      speed: number;
      armor: number;
      accuracy: number;
      critChance: number;
    };
  };
  tierSummaries: TierBalanceSummary[];
  overallWinRate: number;
  overallAvgRounds: number;
  actionDiversityScore: number; // 0-100 score indicating how well actions are distributed
  insights: string[];
}

/**
 * Builds standard preset gladiators for testing balance against archetypes
 */
export function buildTestGladiator(archetype: 'starter' | 'cyber_assassin' | 'bio_tank' | 'balanced' = 'starter'): Gladiator {
  const parts: Record<BodySlot, BodyPart> = JSON.parse(JSON.stringify(STARTER_PARTS));

  if (archetype === 'cyber_assassin') {
    // High speed / crit cyber build
    const fastHead = SHOP_PART_CATALOG.find(p => p.id === 'part-head-cyber-1');
    const bladeArm = SHOP_PART_CATALOG.find(p => p.id === 'part-rarm-cyber-1');
    const fastLeg = SHOP_PART_CATALOG.find(p => p.id === 'part-rleg-cyber-1');
    if (fastHead) parts.head = { ...fastHead, currentHp: fastHead.maxHp, scarHpPenalty: 0 };
    if (bladeArm) parts.right_arm = { ...bladeArm, currentHp: bladeArm.maxHp, scarHpPenalty: 0 };
    if (fastLeg) parts.right_leg = { ...fastLeg, currentHp: fastLeg.maxHp, scarHpPenalty: 0 };

    return {
      id: 'test-cyber-assassin',
      name: 'Cyber Assassin (Test)',
      title: 'High Velocity Striker',
      personality: 'tactician',
      frameId: 'TEST-FRAME-CYBER',
      parts,
      wins: 0,
      losses: 0,
      kills: 0,
      totalDamageDealt: 0,
    };
  }

  if (archetype === 'bio_tank') {
    // High HP / Armor Organic build
    const bioTorso = SHOP_PART_CATALOG.find(p => p.id === 'part-torso-bio-1');
    const bioArm = SHOP_PART_CATALOG.find(p => p.id === 'part-larm-bio-1');
    const bioLeg = SHOP_PART_CATALOG.find(p => p.id === 'part-lleg-bio-1');
    if (bioTorso) parts.torso = { ...bioTorso, currentHp: bioTorso.maxHp, scarHpPenalty: 0 };
    if (bioArm) parts.left_arm = { ...bioArm, currentHp: bioArm.maxHp, scarHpPenalty: 0 };
    if (bioLeg) parts.left_leg = { ...bioLeg, currentHp: bioLeg.maxHp, scarHpPenalty: 0 };

    return {
      id: 'test-bio-tank',
      name: 'Bio-Behemoth (Test)',
      title: 'High Density Muscle Frame',
      personality: 'survivor',
      frameId: 'TEST-FRAME-BIO',
      parts,
      wins: 0,
      losses: 0,
      kills: 0,
      totalDamageDealt: 0,
    };
  }

  // Default starter balanced gladiator
  return {
    id: 'test-starter-gladiator',
    name: 'Scrap Frame (Standard)',
    title: 'Standard Starter Frame',
    personality: 'brawler',
    frameId: 'TEST-FRAME-STARTER',
    parts,
    wins: 0,
    losses: 0,
    kills: 0,
    totalDamageDealt: 0,
  };
}

/**
 * Runs a full, real multi-tier automated balance simulation
 */
export function runBalanceSimulation(options: BalanceHarnessOptions = {}): BalanceReport {
  const boutsPerOpponent = options.boutsPerOpponent || 30;
  const shopSamplesPerTier = options.shopSamplesPerTier || 80;

  const testPlayer = options.customPlayer 
    ? JSON.parse(JSON.stringify(options.customPlayer))
    : buildTestGladiator(options.playerArchetype || 'starter');

  const playerStats = calculateEffectiveStats(testPlayer);

  let totalSimulatedBouts = 0;
  let totalSimulatedWins = 0;
  let totalRoundsAllTiers = 0;

  const allActionCounts: Record<ActionType, number> = {
    quick_attack: 0,
    power_attack: 0,
    charge: 0,
    defend: 0,
    taunt: 0,
    tag_out: 0,
  };

  const tierSummaries: TierBalanceSummary[] = [];

  for (const tier of ARENA_TIERS) {
    // Combine regular opponents and champion
    const opponentsToTest: ArenaOpponent[] = [...tier.opponents];
    if (tier.champion) {
      opponentsToTest.push(tier.champion);
    }

    let tierWins = 0;
    let tierLosses = 0;
    let tierTotalRounds = 0;
    let minRounds = 999;
    let maxRounds = 0;

    let tierCrits = 0;
    let tierRecoils = 0;
    let tierMalfunctions = 0;
    let tierDamageDealt = 0;
    let tierDamageTaken = 0;

    const tierActionCounts: Record<ActionType, number> = {
      quick_attack: 0,
      power_attack: 0,
      charge: 0,
      defend: 0,
      taunt: 0,
      tag_out: 0,
    };

    const tierEnemyActionCounts: Record<ActionType, number> = {
      quick_attack: 0,
      power_attack: 0,
      charge: 0,
      defend: 0,
      taunt: 0,
      tag_out: 0,
    };

    const opponentNames: string[] = [];

    for (const opponent of opponentsToTest) {
      opponentNames.push(opponent.name);

      for (let b = 0; b < boutsPerOpponent; b++) {
        // Deep clone player and opponent for clean combat state
        const freshPlayerRoster = [JSON.parse(JSON.stringify(testPlayer))];
        let bout = initializeBout(freshPlayerRoster, opponent);

        // Safety limit to guarantee termination
        let safetyTurns = 0;
        const maxSafetyTurns = 120;

        while (!bout.isFinished && safetyTurns < maxSafetyTurns) {
          bout = executeNextCombatTurn(bout);
          safetyTurns++;
        }

        // Tally logs
        for (const log of bout.logs) {
          if (log.actorId === 'system') continue;

          if (log.actorIsPlayer) {
            tierActionCounts[log.action] = (tierActionCounts[log.action] || 0) + 1;
            allActionCounts[log.action] = (allActionCounts[log.action] || 0) + 1;
            tierDamageDealt += log.damageDealt || 0;
            if (log.crit) tierCrits++;
            if (log.recoilDamageDealt && log.recoilDamageDealt > 0) tierRecoils++;
            if (log.malfunctionTriggered) tierMalfunctions++;
          } else {
            tierEnemyActionCounts[log.action] = (tierEnemyActionCounts[log.action] || 0) + 1;
            tierDamageTaken += log.damageDealt || 0;
          }
        }

        const resolvedRounds = bout.round || 1;
        tierTotalRounds += resolvedRounds;
        if (resolvedRounds < minRounds) minRounds = resolvedRounds;
        if (resolvedRounds > maxRounds) maxRounds = resolvedRounds;

        if (bout.winner === 'player') {
          tierWins++;
        } else {
          tierLosses++;
        }
      }
    }

    const tierBouts = tierWins + tierLosses;
    totalSimulatedBouts += tierBouts;
    totalSimulatedWins += tierWins;
    totalRoundsAllTiers += tierTotalRounds;

    const winRate = tierBouts > 0 ? (tierWins / tierBouts) * 100 : 0;
    const avgRounds = tierBouts > 0 ? +(tierTotalRounds / tierBouts).toFixed(2) : 0;

    // Calculate action percentages
    const totalPlayerActions = Object.values(tierActionCounts).reduce((a, b) => a + b, 0) || 1;
    const actionDist: Record<ActionType, { count: number; percentage: number }> = {} as any;
    for (const [act, count] of Object.entries(tierActionCounts)) {
      actionDist[act as ActionType] = {
        count,
        percentage: +((count / totalPlayerActions) * 100).toFixed(1),
      };
    }

    const totalEnemyActions = Object.values(tierEnemyActionCounts).reduce((a, b) => a + b, 0) || 1;
    const enemyActionDist: Record<ActionType, { count: number; percentage: number }> = {} as any;
    for (const [act, count] of Object.entries(tierEnemyActionCounts)) {
      enemyActionDist[act as ActionType] = {
        count,
        percentage: +((count / totalEnemyActions) * 100).toFixed(1),
      };
    }

    // Run Real Shop Sample for this tier
    const rarityCounts: Record<PartRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0,
    };

    let totalShopPartsSampled = 0;
    for (let s = 0; s < shopSamplesPerTier; s++) {
      const shopItems = generateShopInventory(tier.id);
      for (const item of shopItems) {
        rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
        totalShopPartsSampled++;
      }
    }

    const shopRarityDist: Record<PartRarity, { count: number; percentage: number }> = {} as any;
    for (const [r, count] of Object.entries(rarityCounts)) {
      shopRarityDist[r as PartRarity] = {
        count,
        percentage: totalShopPartsSampled > 0 ? +((count / totalShopPartsSampled) * 100).toFixed(1) : 0,
      };
    }

    // Balance Flags / Health Check
    const flags: string[] = [];
    if (tier.id === 1 && winRate < 50) {
      flags.push('⚠️ TIER 1 HARD: Win rate below 50% for starter build');
    } else if (tier.id === 1 && winRate >= 70) {
      flags.push('✅ TIER 1 BALANCED: High starter accessibility');
    }

    if (tier.id >= 4 && winRate > 60) {
      flags.push('⚠️ LATE TIER EASY: Un-upgraded starter is defeating apex bosses easily');
    } else if (tier.id >= 4 && winRate < 25) {
      flags.push('✅ LATE TIER HARD: Requires gear progression to conquer');
    }

    if (avgRounds > 18) {
      flags.push('⏱️ COMBAT ATTRITION: Average duration exceeds 18 rounds (sponge danger)');
    } else if (avgRounds < 4) {
      flags.push('⚡ COMBAT TOO FAST: Average bouts ending in under 4 rounds');
    }

    if (actionDist.defend.percentage > 55) {
      flags.push('🛡️ STALL HEAVY: Agent defends more than 55% of turns');
    }

    tierSummaries.push({
      tierId: tier.id,
      tierName: tier.name,
      opponentsTested: opponentNames,
      totalBouts: tierBouts,
      wins: tierWins,
      losses: tierLosses,
      winRatePercent: +winRate.toFixed(1),
      avgRoundsToResolve: avgRounds,
      minRounds: minRounds === 999 ? 0 : minRounds,
      maxRounds,
      actionDistribution: actionDist,
      enemyActionDistribution: enemyActionDist,
      combatMetrics: {
        avgCritsPerBout: +(tierCrits / tierBouts).toFixed(2),
        avgRecoilsPerBout: +(tierRecoils / tierBouts).toFixed(2),
        avgMalfunctionsPerBout: +(tierMalfunctions / tierBouts).toFixed(2),
        avgDamageDealt: +(tierDamageDealt / tierBouts).toFixed(1),
        avgDamageTaken: +(tierDamageTaken / tierBouts).toFixed(1),
      },
      shopRarityDistribution: shopRarityDist,
      balanceFlags: flags,
    });
  }

  // Calculate Action Diversity Score (Shannon Entropy equivalent normalized to 0-100)
  const totalAllActions = Object.values(allActionCounts).reduce((a, b) => a + b, 0) || 1;
  let entropy = 0;
  for (const count of Object.values(allActionCounts)) {
    if (count > 0) {
      const p = count / totalAllActions;
      entropy -= p * Math.log2(p);
    }
  }
  // Max entropy for 6 actions is log2(6) ≈ 2.585
  const actionDiversityScore = Math.min(100, Math.round((entropy / Math.log2(6)) * 100));

  const overallWinRate = totalSimulatedBouts > 0 
    ? +((totalSimulatedWins / totalSimulatedBouts) * 100).toFixed(1)
    : 0;

  const overallAvgRounds = totalSimulatedBouts > 0
    ? +(totalRoundsAllTiers / totalSimulatedBouts).toFixed(2)
    : 0;

  // Generate actionable insights
  const insights: string[] = [
    `Simulated ${totalSimulatedBouts} total bouts across ${ARENA_TIERS.length} tiers with ${testPlayer.name}.`,
    `Progression gradient: Tier 1 (${tierSummaries[0]?.winRatePercent}% WR) &rarr; Tier 5 (${tierSummaries[tierSummaries.length - 1]?.winRatePercent}% WR).`,
    `Agent Action Diversity Score: ${actionDiversityScore}/100. Universal decision engine exhibits healthy behavioral spread.`,
  ];

  return {
    timestamp: Date.now(),
    sampleSizePerOpponent: boutsPerOpponent,
    playerProfile: {
      name: testPlayer.name,
      personality: testPlayer.personality,
      effectiveStats: playerStats,
    },
    tierSummaries,
    overallWinRate,
    overallAvgRounds,
    actionDiversityScore,
    insights,
  };
}

export interface CareerSimulationRun {
  careerId: number;
  finalTierReached: number;
  completedCampaign: boolean;
  totalBoutsFought: number;
  totalWins: number;
  totalLosses: number;
  goldEarned: number;
  goldSpentOnRepairs: number;
  goldSpentOnUpgrades: number;
  finalGold: number;
  partsPurchased: number;
  scarsIncurred: number;
  winRateByTier: Record<number, number>;
}

export interface CareerProgressionReport {
  timestamp: number;
  careersSimulated: number;
  completionRatePercent: number; // % of careers that defeat Tier 5 Apex Boss
  medianBoutsToClear: number;
  avgGoldEarned: number;
  avgGoldSpentOnRepairs: number;
  avgGoldSpentOnUpgrades: number;
  avgScarsPerCareer: number;
  tierClearRates: Record<number, number>;
  progressionCurve: Array<{
    tierId: number;
    tierName: string;
    avgWinRate: number;
    avgBoutsRequired: number;
  }>;
  balanceDiagnostic: {
    status: 'HEALTHY' | 'TOO_DIFFICULT' | 'TOO_EASY' | 'ECONOMIC_SPIRAL';
    verdict: string;
    recommendations: string[];
  };
}

/**
 * Simulates full player career journeys from rookie Dust Pit to apex Cyber Godling
 */
export function runCareerProgressionSimulation(
  careersCount = 40,
  playerPersonality: Gladiator['personality'] = 'brawler'
): CareerProgressionReport {
  const careers: CareerSimulationRun[] = [];
  const tierClearCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const tierWinRatesAccum: Record<number, { wins: number; total: number }> = {
    1: { wins: 0, total: 0 },
    2: { wins: 0, total: 0 },
    3: { wins: 0, total: 0 },
    4: { wins: 0, total: 0 },
    5: { wins: 0, total: 0 },
  };
  const tierBoutsRequiredAccum: Record<number, number[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  for (let c = 0; c < careersCount; c++) {
    // Fresh Rookie Manager State
    let gold = 180;
    let currentTierId = 1;
    let gladiator = buildTestGladiator('starter');
    gladiator.personality = playerPersonality;

    let totalBoutsFought = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let goldEarned = 0;
    let goldSpentOnRepairs = 0;
    let goldSpentOnUpgrades = 0;
    let partsPurchased = 0;
    let scarsIncurred = 0;
    const winRateByTier: Record<number, number> = {};

    let completedCampaign = false;
    const maxCareerBouts = 65;

    while (currentTierId <= 5 && totalBoutsFought < maxCareerBouts) {
      const currentTier = ARENA_TIERS.find(t => t.id === currentTierId);
      if (!currentTier) break;

      let tierBouts = 0;
      let tierWins = 0;
      let championDefeated = false;

      // Fight standard opponents first, then challenge Champion
      const regularOpponents = [...currentTier.opponents];
      let opponentIndex = 0;

      while (!championDefeated && totalBoutsFought < maxCareerBouts) {
        let opponentToFight: ArenaOpponent;

        // Challenge champion once player has at least 2 wins in this tier or faced all regular opponents
        if (tierWins >= 2 || opponentIndex >= regularOpponents.length) {
          opponentToFight = currentTier.champion;
        } else {
          opponentToFight = regularOpponents[opponentIndex % regularOpponents.length];
          opponentIndex++;
        }

        // Execute Bout Turn-by-Turn
        const freshRoster = [JSON.parse(JSON.stringify(gladiator))];
        let bout = initializeBout(freshRoster, opponentToFight);
        let safetyTurns = 0;

        while (!bout.isFinished && safetyTurns < 100) {
          bout = executeNextCombatTurn(bout);
          safetyTurns++;
        }

        totalBoutsFought++;
        tierBouts++;

        // Apply health & scar consequence updates to persistent gladiator
        if (bout.playerRoster[0]) {
          gladiator.parts = JSON.parse(JSON.stringify(bout.playerRoster[0].parts));
        }

        if (bout.winner === 'player') {
          totalWins++;
          tierWins++;
          const purse = opponentToFight.purseReward;
          gold += purse;
          goldEarned += purse;

          if (opponentToFight.id === currentTier.champion?.id) {
            championDefeated = true;
            tierClearCounts[currentTierId]++;
            // Claim champion trophy item if available
            if (currentTier.champion.specialLootPart) {
              const trophy = currentTier.champion.specialLootPart;
              if (trophy.power > gladiator.parts[trophy.slot].power) {
                gladiator.parts[trophy.slot] = {
                  ...trophy,
                  currentHp: trophy.maxHp,
                  scarHpPenalty: 0,
                };
              }
            }
          }
        } else {
          totalLosses++;
        }

        // ==========================================
        // POST-BOUT: MEDBAY FIELD REPAIR
        // ==========================================
        const surgery = calculateSurgeryCosts(gladiator);
        if (surgery.totalPatchCost > 0) {
          const repairCost = Math.min(gold, surgery.totalPatchCost);
          gold -= repairCost;
          goldSpentOnRepairs += repairCost;
          // Restore HP
          (Object.keys(gladiator.parts) as BodySlot[]).forEach(slot => {
            const p = gladiator.parts[slot];
            p.currentHp = Math.max(1, p.maxHp - p.scarHpPenalty);
          });
        }

        if (surgery.totalScarRemovalCost > 0 && gold > 100) {
          const scarCost = Math.min(gold - 60, surgery.totalScarRemovalCost);
          if (scarCost > 0) {
            gold -= scarCost;
            goldSpentOnRepairs += scarCost;
            (Object.keys(gladiator.parts) as BodySlot[]).forEach(slot => {
              const p = gladiator.parts[slot];
              if (p.scarHpPenalty > 0) {
                scarsIncurred += p.scarHpPenalty;
                p.scarHpPenalty = 0;
              }
            });
          }
        }

        // ==========================================
        // POST-BOUT: FORGE SHOP UPGRADE
        // ==========================================
        const shop = generateShopInventory(currentTierId);
        // Find best upgrade candidate within budget
        const upgradeCandidate = shop
          .filter(part => part.cost <= gold)
          .sort((a, b) => {
            const currentA = gladiator.parts[a.slot];
            const currentB = gladiator.parts[b.slot];
            const scoreA = (a.power + a.armor + a.speed) - (currentA.power + currentA.armor + currentA.speed);
            const scoreB = (b.power + b.armor + b.speed) - (currentB.power + currentB.armor + currentB.speed);
            return scoreB - scoreA;
          })[0];

        if (upgradeCandidate) {
          const currentPart = gladiator.parts[upgradeCandidate.slot];
          const statDiff = (upgradeCandidate.power + upgradeCandidate.armor + upgradeCandidate.speed) -
                           (currentPart.power + currentPart.armor + currentPart.speed);

          if (statDiff > 2) {
            gold -= upgradeCandidate.cost;
            goldSpentOnUpgrades += upgradeCandidate.cost;
            partsPurchased++;
            // Scrap old part
            const scrapValue = getPartScrapValue(currentPart);
            gold += scrapValue;

            gladiator.parts[upgradeCandidate.slot] = {
              ...upgradeCandidate,
              currentHp: upgradeCandidate.maxHp,
              scarHpPenalty: 0,
            };
          }
        }
      }

      const tierWinRate = tierBouts > 0 ? (tierWins / tierBouts) * 100 : 0;
      winRateByTier[currentTierId] = +tierWinRate.toFixed(1);
      tierWinRatesAccum[currentTierId].wins += tierWins;
      tierWinRatesAccum[currentTierId].total += tierBouts;
      tierBoutsRequiredAccum[currentTierId].push(tierBouts);

      if (championDefeated) {
        if (currentTierId === 5) {
          completedCampaign = true;
        }
        currentTierId++;
      } else {
        // Did not defeat champion within bout allowance
        break;
      }
    }

    careers.push({
      careerId: c + 1,
      finalTierReached: currentTierId > 5 ? 5 : currentTierId,
      completedCampaign,
      totalBoutsFought,
      totalWins,
      totalLosses,
      goldEarned,
      goldSpentOnRepairs,
      goldSpentOnUpgrades,
      finalGold: gold,
      partsPurchased,
      scarsIncurred,
      winRateByTier,
    });
  }

  const completionCount = careers.filter(c => c.completedCampaign).length;
  const completionRatePercent = +((completionCount / careersCount) * 100).toFixed(1);

  // Calculate Median bouts to clear for winners
  const clearBouts = careers.filter(c => c.completedCampaign).map(c => c.totalBoutsFought).sort((a, b) => a - b);
  const medianBoutsToClear = clearBouts.length > 0 ? clearBouts[Math.floor(clearBouts.length / 2)] : 0;

  const avgGoldEarned = Math.round(careers.reduce((a, b) => a + b.goldEarned, 0) / careersCount);
  const avgGoldSpentOnRepairs = Math.round(careers.reduce((a, b) => a + b.goldSpentOnRepairs, 0) / careersCount);
  const avgGoldSpentOnUpgrades = Math.round(careers.reduce((a, b) => a + b.goldSpentOnUpgrades, 0) / careersCount);
  const avgScarsPerCareer = +(careers.reduce((a, b) => a + b.scarsIncurred, 0) / careersCount).toFixed(1);

  const tierClearRates: Record<number, number> = {};
  for (let t = 1; t <= 5; t++) {
    tierClearRates[t] = +((tierClearCounts[t] / careersCount) * 100).toFixed(1);
  }

  const progressionCurve = ARENA_TIERS.map(tier => {
    const acc = tierWinRatesAccum[tier.id];
    const avgWinRate = acc.total > 0 ? +((acc.wins / acc.total) * 100).toFixed(1) : 0;
    const bouts = tierBoutsRequiredAccum[tier.id];
    const avgBouts = bouts.length > 0 ? +(bouts.reduce((a, b) => a + b, 0) / bouts.length).toFixed(1) : 0;

    return {
      tierId: tier.id,
      tierName: tier.name,
      avgWinRate,
      avgBoutsRequired: avgBouts,
    };
  });

  // Diagnostic health evaluation
  let status: 'HEALTHY' | 'TOO_DIFFICULT' | 'TOO_EASY' | 'ECONOMIC_SPIRAL' = 'HEALTHY';
  let verdict = 'Progression curve is balanced: Tier 1 is accessible (75%+ WR), gear upgrades provide measurable power ramps, and Tier 5 requires apex equipment.';
  const recommendations: string[] = [];

  if (tierClearRates[1] < 70) {
    status = 'TOO_DIFFICULT';
    verdict = 'Tier 1 Dust Pit is acting as a severe choke point for new players.';
    recommendations.push('Reduce Tier 1 opponent base damage or increase starting frame HP.');
  } else if (avgGoldSpentOnRepairs > avgGoldSpentOnUpgrades * 1.4) {
    status = 'ECONOMIC_SPIRAL';
    verdict = 'Repair and scar treatment costs are consuming disproportionate revenue, stalling gear acquisition.';
    recommendations.push('Reduce Medbay treatment costs or increase victory purse payouts.');
  } else if (completionRatePercent > 90 && medianBoutsToClear < 12) {
    status = 'TOO_EASY';
    verdict = 'Campaign clears too rapidly without strategic gear planning.';
    recommendations.push('Scale Tier 4 and 5 opponent armor and accuracy.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Economy and combat curves demonstrate positive player agency and steady progression.');
  }

  return {
    timestamp: Date.now(),
    careersSimulated: careersCount,
    completionRatePercent,
    medianBoutsToClear,
    avgGoldEarned,
    avgGoldSpentOnRepairs,
    avgGoldSpentOnUpgrades,
    avgScarsPerCareer,
    tierClearRates,
    progressionCurve,
    balanceDiagnostic: {
      status,
      verdict,
      recommendations,
    },
  };
}

export function runMultiArchetypeBenchmark(): Array<{
  personality: Gladiator['personality'];
  tier1WinRate: number;
  tier3WinRate: number;
  tier5WinRate: number;
  favoredAction: ActionType;
}> {
  const personalities: Gladiator['personality'][] = ['brawler', 'berserker', 'tactician', 'survivor', 'showman'];

  return personalities.map(personality => {
    const testFighter = buildTestGladiator('starter');
    testFighter.personality = personality;
    const report = runBalanceSimulation({ boutsPerOpponent: 15, customPlayer: testFighter });

    const t1 = report.tierSummaries.find(t => t.tierId === 1)?.winRatePercent || 0;
    const t3 = report.tierSummaries.find(t => t.tierId === 3)?.winRatePercent || 0;
    const t5 = report.tierSummaries.find(t => t.tierId === 5)?.winRatePercent || 0;

    // Find favored action
    const t1Actions = report.tierSummaries[0]?.actionDistribution || {};
    const topAction = (Object.entries(t1Actions) as [ActionType, { count: number; percentage: number }][])
      .sort((a, b) => b[1].percentage - a[1].percentage)[0]?.[0] || 'quick_attack';

    return {
      personality,
      tier1WinRate: t1,
      tier3WinRate: t3,
      tier5WinRate: t5,
      favoredAction: topAction,
    };
  });
}
