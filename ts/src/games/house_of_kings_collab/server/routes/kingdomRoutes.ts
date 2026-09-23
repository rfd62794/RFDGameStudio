import { Router, Response, Request } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from '../lib/firebaseAdmin';
import { kingdomPath, playerPath } from '../lib/paths';
import { resolvePlayerContext } from '../lib/playerContext';
import { runGuardedTransaction } from '../lib/transactionHelpers';
import { AuthenticatedRequest, verifyAuth, verifyAdmin } from '../middleware/verifyAuth';
import { evaluateKingdomDaily, checkAndEvaluateKingdomsIfNeeded } from '../functions/evaluateKingdomDaily';
import { CATHEDRAL_MAX_LEVEL, cathedralUpgradeCost, cathedralContributionMultiplier, parseUnlockedTaskTypes, resolveActionsState } from '../../types';
import { resolveKingdomAggregateActionsState, isAggregateWarningActive, RESERVED_DAILY_BUDGET } from '../../lib/actionsAllocation';

export const kingdomRouter = Router();

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

// GET /api/kingdom - Fetch Kingdom status (public or authenticated)
kingdomRouter.get('/api/kingdom', async (req: Request, res: Response) => {
  try {
    const kingdomId = (req.query.kingdomId as string) || 'kingdom-mvp-0';

    // Lazy evaluation on visit: check and evaluate if 24h window has elapsed
    await checkAndEvaluateKingdomsIfNeeded(kingdomId);

    const db = getDb();
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const snap = await kingdomRef.get();

    if (!snap.exists) {
      return res.json({
        kingdomId,
        level: 1,
        cumulativeContribution: 0,
        unlockedTaskTypes: ['food'],
        cathedral: { level: 0 },
        church: { level: 0 },
        cathedralMultiplier: 1.0,
        churchMultiplier: 1.0,
        lastEvaluatedAt: null,
        lastEvaluation: null,
      });
    }

    const data = snap.data() || {};
    const unlockedTaskTypes = parseUnlockedTaskTypes(data.unlockedTaskTypes);

    // Auto-heal Firestore if 'food' was omitted in kingdom document
    if (!Array.isArray(data.unlockedTaskTypes) || !data.unlockedTaskTypes.includes('food')) {
      await kingdomRef.set({ unlockedTaskTypes: FieldValue.arrayUnion('food') }, { merge: true });
    }

    // Resolve aggregate actions 24h reset
    const aggregateState = resolveKingdomAggregateActionsState(data);
    if (aggregateState.needsReset) {
      await kingdomRef.set({
        dailyActionsConsumed: 0,
        dailyActionsResetAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    const totalPlayerCount = Math.max(1, Number(data.totalPlayerCount) || 1);
    const dailyActionsConsumed = aggregateState.dailyActionsConsumed;
    const aggregateWarning = isAggregateWarningActive(dailyActionsConsumed);

    // Cathedral migration: if church exists but cathedral does not, copy value across
    let cathedralLevel = 0;
    if (data.cathedral && typeof data.cathedral.level === 'number') {
      cathedralLevel = Number(data.cathedral.level) || 0;
    } else if (data.church && typeof data.church.level === 'number') {
      cathedralLevel = Number(data.church.level) || 0;
      // Persist migration so future reads find cathedral
      await kingdomRef.set({ cathedral: { level: cathedralLevel } }, { merge: true });
    }

    const multiplier = cathedralContributionMultiplier(cathedralLevel);

    return res.json({
      kingdomId,
      level: Number(data.level) || 1,
      cumulativeContribution: Number(data.cumulativeContribution) || 0,
      unlockedTaskTypes,
      cathedral: { level: cathedralLevel },
      church: { level: cathedralLevel },
      cathedralMultiplier: multiplier,
      churchMultiplier: multiplier,
      nextUpgradeCost: cathedralUpgradeCost(cathedralLevel),
      maxLevel: CATHEDRAL_MAX_LEVEL,
      lastEvaluatedAt: data.lastEvaluatedAt || null,
      lastEvaluation: data.lastEvaluation || null,
      totalPlayerCount,
      dailyActionsConsumed,
      reservedDailyBudget: RESERVED_DAILY_BUDGET,
      aggregateWarningActive: aggregateWarning,
    });
  } catch (error: any) {
    console.error('Error fetching Kingdom status:', error);
    return res.status(500).json({ error: error.message || 'Server error fetching Kingdom' });
  }
});

// Handler for upgrading Cathedral (also aliased for Church)
async function upgradeCathedralHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const db = getDb();
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      const kingdomSnap = await transaction.get(kingdomRef);
      const playerSnap = await transaction.get(playerRef);

      const kingdomData = kingdomSnap.data() || {};
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
      
      // 2. Determine existing level with migration fallback
      let currentLevel = 0;
      if (kingdomData.cathedral && typeof kingdomData.cathedral.level === 'number') {
        currentLevel = Number(kingdomData.cathedral.level) || 0;
      } else if (kingdomData.church && typeof kingdomData.church.level === 'number') {
        currentLevel = Number(kingdomData.church.level) || 0;
      }

      // 3. Hard ceiling check
      if (currentLevel >= CATHEDRAL_MAX_LEVEL) {
        throw {
          status: 400,
          error: 'Cathedral is already at maximum level',
          maxLevel: CATHEDRAL_MAX_LEVEL,
          currentLevel,
        };
      }

      // 4. Resource check
      const cost = cathedralUpgradeCost(currentLevel);
      const resources = parseResources(playerData.resources, playerData);

      if (resources.food < cost.food || resources.wood < cost.wood) {
        throw {
          status: 400,
          error: 'Insufficient resources to upgrade Cathedral',
          required: cost,
          current: resources,
        };
      }

      // 5. Kingdom aggregate actions state
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);

      const newLevel = currentLevel + 1;
      const newRemaining = remaining - 1;
      const newAggregateConsumed = dailyActionsConsumed + 1;
      const newFood = Math.max(0, resources.food - cost.food);
      const newWood = Math.max(0, resources.wood - cost.wood);

      // Atomic, complete resource deduction & action decrement inside transaction
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

      // Update Kingdom Cathedral level and aggregate actions consumed
      transaction.set(kingdomRef, {
        cathedral: { level: newLevel },
        church: { level: newLevel },
        dailyActionsConsumed: newAggregateConsumed,
        totalPlayerCount: isNewPlayer ? FieldValue.increment(1) : (Number(kingdomData.totalPlayerCount) || 1),
        ...(needsKingdomActionsReset ? { dailyActionsResetAt: FieldValue.serverTimestamp() } : {}),
      }, { merge: true });

      const newMultiplier = cathedralContributionMultiplier(newLevel);

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
      newLevel: txResult.newLevel,
      cathedralMultiplier: txResult.newMultiplier,
      churchMultiplier: txResult.newMultiplier,
      costPaid: txResult.cost,
      remainingActions: txResult.remainingActions,
      actionsAllowanceToday: txResult.allowance,
      message: `Cathedral successfully upgraded to Level ${txResult.newLevel}! Kingdom Contribution boost now +${Math.round((txResult.newMultiplier - 1) * 100)}%.`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error upgrading Cathedral:', error);
    return res.status(500).json({ error: error.message || 'Server error upgrading Cathedral' });
  }
}

// POST /api/upgradeCathedral - Upgrade Kingdom Cathedral structure
kingdomRouter.post('/api/upgradeCathedral', verifyAuth, upgradeCathedralHandler);

// POST /api/upgradeChurch - Backward compatible alias for Cathedral upgrade
kingdomRouter.post('/api/upgradeChurch', verifyAuth, upgradeCathedralHandler);

// POST /api/admin/evaluateKingdom - Trigger daily evaluation (Game Master / Admin)
kingdomRouter.post('/api/admin/evaluateKingdom', verifyAuth, verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId = 'kingdom-mvp-0' } = req.body;
    const result = await evaluateKingdomDaily(kingdomId);
    return res.json({
      success: true,
      gm: req.verifiedEmail,
      result,
      message: `Daily evaluation executed for kingdom ${kingdomId}. New level: ${result.newLevel}.`,
    });
  } catch (error: any) {
    console.error('Error in evaluateKingdom API:', error);
    return res.status(500).json({ error: error.message || 'Server error evaluating kingdom' });
  }
});
