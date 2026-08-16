import { Router, Response, Request } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from '../lib/firebaseAdmin';
import { housePath, playerPath, kingdomPath } from '../lib/paths';
import { resolvePlayerContext } from '../lib/playerContext';
import { runGuardedTransaction } from '../lib/transactionHelpers';
import { AuthenticatedRequest, verifyAuth } from '../middleware/verifyAuth';
import {
  REPUTATION_THRESHOLDS,
  reputationLevelForScore,
  CHAPEL_MAX_LEVEL,
  chapelUpgradeCost,
  chapelReputationMultiplier,
  FORGE_MAX_LEVEL,
  forgeUpgradeCost,
  resolveActionsState,
  specializationDiscount,
  HouseSpecialization,
} from '../../types';
import { resolveKingdomAggregateActionsState } from '../../lib/actionsAllocation';
import { evaluateHouseFestival, checkAndEvaluateHouseFestivalIfNeeded } from '../../functions/evaluateHouseFestival';

export const houseRouter = Router();

function parseResources(rawResources: any, rawDoc?: any): { food: number; wood: number; stone: number } {
  let food = 0;
  let wood = 0;
  let stone = 0;

  if (rawResources && typeof rawResources === 'object') {
    food = Number(rawResources.food) || 0;
    wood = Number(rawResources.wood) || 0;
    stone = Number(rawResources.stone) || 0;
  } else if (typeof rawResources === 'number') {
    food = rawResources;
  }

  if (food === 0 && wood === 0 && stone === 0 && rawDoc && typeof rawDoc === 'object') {
    if (typeof rawDoc['resources.food'] === 'number') food = rawDoc['resources.food'];
    if (typeof rawDoc['resources.wood'] === 'number') wood = rawDoc['resources.wood'];
    if (typeof rawDoc['resources.stone'] === 'number') stone = rawDoc['resources.stone'];
  }

  return { food: Math.max(0, food), wood: Math.max(0, wood), stone: Math.max(0, stone) };
}

// GET /api/house - Fetch House Reputation, Chapel, Forge & Festival status
houseRouter.get('/api/house', async (req: Request, res: Response) => {
  try {
    const kingdomId = (req.query.kingdomId as string) || 'kingdom-mvp-0';
    const houseId = (req.query.houseId as string) || 'house-of-kings-default';

    // Visit-triggered evaluation check for 24h window
    await checkAndEvaluateHouseFestivalIfNeeded(kingdomId, houseId);

    const db = getDb();
    const hRef = db.doc(housePath(kingdomId, houseId));
    const snap = await hRef.get();

    if (!snap.exists) {
      return res.json({
        kingdomId,
        houseId,
        name: 'House of Kings',
        reputationScore: 0,
        reputationLevel: 0,
        specialization: 'none',
        festivalContributionToday: 0,
        festivalLastResolvedAt: null,
        lastResolution: null,
        nextLevelThreshold: REPUTATION_THRESHOLDS[1],
        chapel: { level: 0 },
        chapelMultiplier: 1.0,
        nextChapelCost: chapelUpgradeCost(0),
        maxChapelLevel: CHAPEL_MAX_LEVEL,
        forge: { level: 0 },
        nextForgeCost: forgeUpgradeCost(0),
        maxForgeLevel: FORGE_MAX_LEVEL,
      });
    }

    const data = snap.data() || {};
    const reputationScore = Number(data.reputationScore) || 0;
    const reputationLevel = Number(data.reputationLevel) || reputationLevelForScore(reputationScore);
    const festivalContributionToday = Number(data.festivalContributionToday) || 0;
    const specialization = data.specialization || 'none';

    const chapelLevel = Number(data.chapel?.level) || 0;
    const chapelMultiplier = chapelReputationMultiplier(chapelLevel);

    const forgeLevel = Number(data.forge?.level) || 0;

    const nextLevelThreshold = REPUTATION_THRESHOLDS[reputationLevel + 1] ?? null;

    return res.json({
      kingdomId,
      houseId,
      name: data.name || 'House of Kings',
      reputationScore,
      reputationLevel,
      specialization,
      festivalContributionToday,
      festivalLastResolvedAt: data.festivalLastResolvedAt || null,
      lastResolution: data.lastResolution || null,
      nextLevelThreshold,
      chapel: { level: chapelLevel },
      chapelMultiplier,
      nextChapelCost: specializationDiscount(specialization, chapelUpgradeCost(chapelLevel)),
      maxChapelLevel: CHAPEL_MAX_LEVEL,
      forge: { level: forgeLevel },
      nextForgeCost: forgeUpgradeCost(forgeLevel),
      maxForgeLevel: FORGE_MAX_LEVEL,
    });
  } catch (error: any) {
    console.error('Error fetching House status:', error);
    return res.status(500).json({ error: error.message || 'Server error fetching House' });
  }
});

// POST /api/upgradeChapel - Upgrade House Chapel structure
houseRouter.post('/api/upgradeChapel', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const db = getDb();
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const houseRef = db.doc(housePath(kingdomId, houseId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      const kingdomSnap = await transaction.get(kingdomRef);
      const houseSnap = await transaction.get(houseRef);
      const playerSnap = await transaction.get(playerRef);

      const kingdomData = kingdomSnap.data() || {};
      const houseData = houseSnap.data() || {};
      const playerData = playerSnap.data() || {};

      const isNewPlayer = !playerSnap.exists;
      const totalPlayerCount = (Number(kingdomData.totalPlayerCount) || 0) + (isNewPlayer ? 1 : 0);

      // 1. Actions Cap Check
      const { remaining, allowance, needsReset } = resolveActionsState(playerData, totalPlayerCount);
      if (remaining <= 0) {
        throw {
          status: 400,
          error: 'No Actions remaining today',
          remaining: 0,
          allowance,
        };
      }

      const chapelLevel = Number(houseData.chapel?.level) || 0;

      // 2. Hard ceiling check
      if (chapelLevel >= CHAPEL_MAX_LEVEL) {
        throw {
          status: 400,
          error: 'House Chapel is already at maximum level',
          maxLevel: CHAPEL_MAX_LEVEL,
          currentLevel: chapelLevel,
        };
      }

      const newLevel = chapelLevel + 1;

      // 3. Strictly enforce Chapel upgrade reputation gates
      // Level 1 requires Level 1 (>=100 Score), Level 2 requires Level 2 (>=300 Score), Level 3 requires Level 3 (>=700 Score)
      const reputationScore = Number(houseData.reputationScore) || 0;
      const reputationLevel = Number(houseData.reputationLevel) || reputationLevelForScore(reputationScore);

      if (reputationLevel < newLevel) {
        throw {
          status: 400,
          error: `House Reputation Level ${newLevel} required to upgrade Chapel to Level ${newLevel} (current House Level: ${reputationLevel}, Score: ${reputationScore})`,
          requiredLevel: newLevel,
          currentLevel: reputationLevel,
          reputationScore,
        };
      }

      // 4. Resource check
      const rawCost = chapelUpgradeCost(chapelLevel);
      const cost = specializationDiscount(houseData.specialization, rawCost);
      const resources = parseResources(playerData.resources, playerData);

      if (resources.food < cost.food || resources.wood < cost.wood) {
        throw {
          status: 400,
          error: 'Insufficient resources to upgrade House Chapel',
          required: cost,
          current: resources,
        };
      }

      // 5. Kingdom aggregate actions state
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);

      const newRemaining = remaining - 1;
      const newAggregateConsumed = dailyActionsConsumed + 1;
      const newFood = Math.max(0, resources.food - cost.food);
      const newWood = Math.max(0, resources.wood - cost.wood);

      // Atomic resource deduction & action budget decrement
      transaction.set(playerRef, {
        resources: {
          food: newFood,
          wood: newWood,
          stone: resources.stone,
        },
        actionsRemainingToday: newRemaining,
        actionsAllowanceToday: allowance,
        ...(needsReset ? { actionsLastResetAt: FieldValue.serverTimestamp() } : {}),
        ...(isNewPlayer ? { displayName: 'Noble Lord', joinedAt: new Date().toISOString(), gold: 0, rewardMultiplierLevel: 0 } : {}),
      }, { merge: true });

      // Update House Chapel level inside transaction
      transaction.set(houseRef, {
        chapel: { level: newLevel },
      }, { merge: true });

      // Update Kingdom aggregate actions consumed
      transaction.set(kingdomRef, {
        dailyActionsConsumed: newAggregateConsumed,
        totalPlayerCount: isNewPlayer ? FieldValue.increment(1) : (Number(kingdomData.totalPlayerCount) || 1),
        ...(needsKingdomActionsReset ? { dailyActionsResetAt: FieldValue.serverTimestamp() } : {}),
      }, { merge: true });

      const newMultiplier = chapelReputationMultiplier(newLevel);

      return {
        newLevel,
        newMultiplier,
        cost,
        remainingActions: newRemaining,
        allowance,
        aggregateConsumed: newAggregateConsumed,
      };
    });

    return res.json({
      success: true,
      kingdomId,
      houseId,
      newLevel: txResult.newLevel,
      chapelMultiplier: txResult.newMultiplier,
      costPaid: txResult.cost,
      remainingActions: txResult.remainingActions,
      actionsAllowanceToday: txResult.allowance,
      message: `House Chapel successfully upgraded to Level ${txResult.newLevel}! Reputation multiplier is now +${Math.round((txResult.newMultiplier - 1) * 100)}%.`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error upgrading Chapel:', error);
    return res.status(500).json({ error: error.message || 'Server error upgrading Chapel' });
  }
});

// POST /api/upgradeForge - Upgrade House Forge structure
houseRouter.post('/api/upgradeForge', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const db = getDb();
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const houseRef = db.doc(housePath(kingdomId, houseId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      const kingdomSnap = await transaction.get(kingdomRef);
      const houseSnap = await transaction.get(houseRef);
      const playerSnap = await transaction.get(playerRef);

      const kingdomData = kingdomSnap.data() || {};
      const houseData = houseSnap.data() || {};
      const playerData = playerSnap.data() || {};

      const isNewPlayer = !playerSnap.exists;
      const totalPlayerCount = (Number(kingdomData.totalPlayerCount) || 0) + (isNewPlayer ? 1 : 0);

      // 1. Actions Cap Check
      const { remaining, allowance, needsReset } = resolveActionsState(playerData, totalPlayerCount);
      if (remaining <= 0) {
        throw {
          status: 400,
          error: 'No Actions remaining today',
          remaining: 0,
          allowance,
        };
      }

      const forgeLevel = Number(houseData.forge?.level) || 0;

      // 2. Hard ceiling check
      if (forgeLevel >= FORGE_MAX_LEVEL) {
        throw {
          status: 400,
          error: 'House Forge is already at maximum level',
          maxLevel: FORGE_MAX_LEVEL,
          currentLevel: forgeLevel,
        };
      }

      const newLevel = forgeLevel + 1;

      // 3. Resource check (Food, Wood, Stone)
      const cost = forgeUpgradeCost(forgeLevel);
      const resources = parseResources(playerData.resources, playerData);

      if (resources.food < cost.food || resources.wood < cost.wood || resources.stone < cost.stone) {
        throw {
          status: 400,
          error: 'Insufficient resources to upgrade House Forge',
          required: cost,
          current: resources,
        };
      }

      // 4. Kingdom aggregate actions state
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);

      const newRemaining = remaining - 1;
      const newAggregateConsumed = dailyActionsConsumed + 1;
      const newFood = Math.max(0, resources.food - cost.food);
      const newWood = Math.max(0, resources.wood - cost.wood);
      const newStone = Math.max(0, resources.stone - cost.stone);

      // Atomic resource deduction & action budget decrement
      transaction.set(playerRef, {
        resources: {
          food: newFood,
          wood: newWood,
          stone: newStone,
        },
        actionsRemainingToday: newRemaining,
        actionsAllowanceToday: allowance,
        ...(needsReset ? { actionsLastResetAt: FieldValue.serverTimestamp() } : {}),
        ...(isNewPlayer ? { displayName: 'Noble Lord', joinedAt: new Date().toISOString(), gold: 0, rewardMultiplierLevel: 0 } : {}),
      }, { merge: true });

      // Update House Forge level inside transaction
      transaction.set(houseRef, {
        forge: { level: newLevel },
      }, { merge: true });

      // Update Kingdom aggregate actions consumed
      transaction.set(kingdomRef, {
        dailyActionsConsumed: newAggregateConsumed,
        totalPlayerCount: isNewPlayer ? FieldValue.increment(1) : (Number(kingdomData.totalPlayerCount) || 1),
        ...(needsKingdomActionsReset ? { dailyActionsResetAt: FieldValue.serverTimestamp() } : {}),
      }, { merge: true });

      return {
        newLevel,
        cost,
        remainingActions: newRemaining,
        allowance,
        aggregateConsumed: newAggregateConsumed,
      };
    });

    return res.json({
      success: true,
      kingdomId,
      houseId,
      newLevel: txResult.newLevel,
      costPaid: txResult.cost,
      remainingActions: txResult.remainingActions,
      actionsAllowanceToday: txResult.allowance,
      message: `House Forge successfully upgraded to Level ${txResult.newLevel}! Worker pool capacity increased by +2 slots.`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error upgrading Forge:', error);
    return res.status(500).json({ error: error.message || 'Server error upgrading Forge' });
  }
});

// POST /api/contributeFestival - Contribute resources to the Fertility Festival
houseRouter.post('/api/contributeFestival', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const food = Math.max(0, Math.floor(Number(req.body.food) || 0));
    const wood = Math.max(0, Math.floor(Number(req.body.wood) || 0));

    if (food <= 0 && wood <= 0) {
      return res.status(400).json({ error: 'Must contribute a positive amount of Food or Wood' });
    }

    // Visit-triggered evaluation check prior to contribution
    await checkAndEvaluateHouseFestivalIfNeeded(kingdomId, houseId);

    const db = getDb();
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));
    const houseRef = db.doc(housePath(kingdomId, houseId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      const kingdomSnap = await transaction.get(kingdomRef);
      const playerSnap = await transaction.get(playerRef);
      const houseSnap = await transaction.get(houseRef);

      const kingdomData = kingdomSnap.data() || {};
      const playerData = playerSnap.data() || {};
      const houseData = houseSnap.data() || {};

      const isNewPlayer = !playerSnap.exists;
      const totalPlayerCount = (Number(kingdomData.totalPlayerCount) || 0) + (isNewPlayer ? 1 : 0);

      // 1. Actions Cap Check
      const { remaining, allowance, needsReset } = resolveActionsState(playerData, totalPlayerCount);
      if (remaining <= 0) {
        throw {
          status: 400,
          error: 'No Actions remaining today',
          remaining: 0,
          allowance,
        };
      }

      // 2. Resource check
      const resources = parseResources(playerData.resources, playerData);
      if (resources.food < food || resources.wood < wood) {
        throw {
          status: 400,
          error: 'Insufficient resources for Festival contribution',
          required: { food, wood },
          available: resources,
        };
      }

      const baseContribution = food + wood;
      const scoreMultiplier = houseData.specialization === 'diplomats' ? 1.15 : 1.0;
      const contributionValue = Math.floor(baseContribution * scoreMultiplier);

      // 3. Kingdom aggregate actions state
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);

      const newRemaining = remaining - 1;
      const newAggregateConsumed = dailyActionsConsumed + 1;
      const newFood = Math.max(0, resources.food - food);
      const newWood = Math.max(0, resources.wood - wood);

      // Atomic resource deduction from player & action budget decrement
      transaction.set(playerRef, {
        resources: {
          food: newFood,
          wood: newWood,
          stone: resources.stone,
        },
        actionsRemainingToday: newRemaining,
        actionsAllowanceToday: allowance,
        ...(needsReset ? { actionsLastResetAt: FieldValue.serverTimestamp() } : {}),
        ...(isNewPlayer ? { displayName: 'Noble Lord', joinedAt: new Date().toISOString(), gold: 0, rewardMultiplierLevel: 0 } : {}),
      }, { merge: true });

      // Atomic increment of House festival contribution
      transaction.set(houseRef, {
        festivalContributionToday: FieldValue.increment(contributionValue),
      }, { merge: true });

      // Atomic increment of Kingdom aggregate actions consumed
      transaction.set(kingdomRef, {
        dailyActionsConsumed: newAggregateConsumed,
        totalPlayerCount: isNewPlayer ? FieldValue.increment(1) : (Number(kingdomData.totalPlayerCount) || 1),
        ...(needsKingdomActionsReset ? { dailyActionsResetAt: FieldValue.serverTimestamp() } : {}),
      }, { merge: true });

      return {
        contributionValue,
        baseContribution,
        isDiplomatsBoost: houseData.specialization === 'diplomats',
        remainingFood: newFood,
        remainingWood: newWood,
        remainingStone: resources.stone,
        remainingActions: newRemaining,
        allowance,
        aggregateConsumed: newAggregateConsumed,
      };
    });

    return res.json({
      success: true,
      kingdomId,
      houseId,
      contributionValue: txResult.contributionValue,
      baseContribution: txResult.baseContribution,
      isDiplomatsBoost: txResult.isDiplomatsBoost,
      remainingFood: txResult.remainingFood,
      remainingWood: txResult.remainingWood,
      remainingActions: txResult.remainingActions,
      actionsAllowanceToday: txResult.allowance,
      message: `Successfully contributed ${food > 0 ? food + ' Food ' : ''}${wood > 0 ? wood + ' Wood ' : ''}to the Fertility Festival (+${txResult.contributionValue} House Score pending daily resolution${txResult.isDiplomatsBoost ? ' [Diplomats +15% Boost]' : ''})!`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error contributing to Festival:', error);
    return res.status(500).json({ error: error.message || 'Server error contributing to Festival' });
  }
});

// POST /api/selectHouseSpecialization - Lock in House Specialization (Reputation Level 2+ required)
houseRouter.post('/api/selectHouseSpecialization', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId } = resolvePlayerContext(req, 'body');
    const specialization = req.body.specialization as HouseSpecialization;

    const VALID_SPECS: HouseSpecialization[] = ['provisioners', 'builders', 'diplomats'];
    if (!VALID_SPECS.includes(specialization)) {
      return res.status(400).json({
        error: `Invalid specialization. Must be one of: ${VALID_SPECS.join(', ')}`,
      });
    }

    const db = getDb();
    const houseRef = db.doc(housePath(kingdomId, houseId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      const houseSnap = await transaction.get(houseRef);
      if (!houseSnap.exists) {
        throw { status: 404, error: 'House not found' };
      }

      const houseData = houseSnap.data() || {};
      const reputationScore = Number(houseData.reputationScore) || 0;
      const reputationLevel = Number(houseData.reputationLevel) || reputationLevelForScore(reputationScore);

      if (reputationLevel < 2) {
        throw {
          status: 400,
          error: `House Reputation Level 2 required to choose specialization (current House Level: ${reputationLevel}, Score: ${reputationScore})`,
          currentLevel: reputationLevel,
          requiredLevel: 2,
          reputationScore,
        };
      }

      if (houseData.specialization && houseData.specialization !== 'none') {
        throw {
          status: 400,
          error: 'House specialization is already locked',
          currentSpecialization: houseData.specialization,
        };
      }

      transaction.set(houseRef, {
        specialization,
      }, { merge: true });

      return {
        specialization,
        reputationLevel,
      };
    });

    return res.json({
      success: true,
      kingdomId,
      houseId,
      specialization: txResult.specialization,
      message: `House specialization successfully set to '${txResult.specialization}'!`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error selecting specialization:', error);
    return res.status(500).json({ error: error.message || 'Server error selecting specialization' });
  }
});
