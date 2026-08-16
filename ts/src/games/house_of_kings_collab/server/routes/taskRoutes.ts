import { Router, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthenticatedRequest, verifyAuth } from '../middleware/verifyAuth';
import { getDb } from '../lib/firebaseAdmin';
import { kingdomPath, playerPath, taskPath, housePath } from '../lib/paths';
import { resolvePlayerContext } from '../../lib/playerContext';
import { runGuardedTransaction } from '../lib/transactionHelpers';
import { checkAndEvaluateKingdomsIfNeeded } from '../../functions/evaluateKingdomDaily';
import { cathedralContributionMultiplier, resolveActionsState, LegacyItem, DescendantRecord } from '../../types';
import { resolveKingdomAggregateActionsState } from '../../lib/actionsAllocation';
import { getCurrentRealmEvent } from '../../lib/realmEvents';

const HEIR_NAMES = [
  'Crown Princess Eleanor',
  'Lord Regent Roderick',
  'Archduke Valerius',
  'High Thane Jonathan',
  'Duchess Genevieve',
  'Prince Cedric',
  'Lady Rowena',
  'Baron Sterling',
  'Countess Lyanna',
  'Grand Duke William',
];

const HEIR_TITLES = [
  'Sovereign Heir of the Realm',
  'Warden of the Crownlands',
  'Protector of the Realm',
  'High Marshal of the Lineage',
  'Keeper of the Dynasty',
];

const LEGACY_ITEM_NAMES = [
  'Ancestral Royal Signet',
  'Crown Sovereign Chalice',
  'Gilded Astrolabe of Kings',
  'Relic Blade of the Founder',
  'Scepter of the High Dynasty',
  'Ancestral Tome of Heraldry',
  'Tapestry of the First Monarch',
  'Golden Aegis of the Realm',
];

export const TASK_TIERS = {
  quick: { seconds: 90, kingdomContribution: 5, baseGold: 10 },
  standard: { seconds: 240, kingdomContribution: 15, baseGold: 30 },
  extended: { seconds: 480, kingdomContribution: 35, baseGold: 75 },
} as const;

export type TaskTierKey = keyof typeof TASK_TIERS;

export function multiplierForLevel(level: number): number {
  return 1 + level * 0.1; // +10% per level
}

export const taskRouter = Router();

// API Route: assignTask
taskRouter.post('/api/assignTask', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');
    const force = Boolean(req.body.force);

    const isSpecialTask = Boolean(req.body.isSpecialTask);
    const specialTaskType = req.body.specialTaskType || (isSpecialTask ? 'establish_wood' : null);

    const requestedTier: string = isSpecialTask ? 'extended' : (req.body.tier || 'quick');
    const tierKey: TaskTierKey = (requestedTier in TASK_TIERS)
      ? (requestedTier as TaskTierKey)
      : 'quick';
    const tierConfig = TASK_TIERS[tierKey];

    const db = getDb();
    const taskRef = db.doc(taskPath(kingdomId, houseId, userId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));
    const kingdomRef = db.doc(kingdomPath(kingdomId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      // 1. Fetch player & kingdom docs inside transaction
      const playerSnap = await transaction.get(playerRef);
      const kingdomSnap = await transaction.get(kingdomRef);

      const kingdomData = kingdomSnap.data() || {};
      const playerData = playerSnap.data() || {};

      const isNewPlayer = !playerSnap.exists;
      const totalPlayerCount = (Number(kingdomData.totalPlayerCount) || 0) + (isNewPlayer ? 1 : 0);

      const { remaining, allowance, needsReset } = resolveActionsState(playerData, totalPlayerCount);

      if (remaining <= 0) {
        throw {
          status: 400,
          error: 'No Actions remaining today',
          remaining: 0,
          allowance,
        };
      }

      // 2. Resolve Kingdom aggregate actions counter state
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);

      // 3. Check if task is already in progress
      const docSnap = await transaction.get(taskRef);
      if (docSnap.exists && !force) {
        const data = docSnap.data();
        if (data?.status === 'in_progress') {
          const elapsedMs = Date.now() - (Number(data.startTime) || 0);
          const requiredMs = (Number(data.duration) || tierConfig.seconds) * 1000;

          if (elapsedMs < requiredMs) {
            throw {
              status: 400,
              error: 'Task is already in progress!',
              currentTask: data,
            };
          }
        }
      }

      const serverNowMs = Date.now();
      const taskData = {
        status: 'in_progress',
        startTime: serverNowMs,
        duration: tierConfig.seconds,
        tier: tierKey,
        isSpecialTask,
        specialTaskType,
        result: null,
      };

      const newRemaining = remaining - 1;
      const newAggregateConsumed = dailyActionsConsumed + 1;

      transaction.set(taskRef, taskData, { merge: true });

      transaction.set(playerRef, {
        actionsRemainingToday: newRemaining,
        actionsAllowanceToday: allowance,
        ...(needsReset ? { actionsLastResetAt: FieldValue.serverTimestamp() } : {}),
        ...(isNewPlayer ? { displayName: 'Noble Lord', joinedAt: new Date().toISOString(), gold: 0, rewardMultiplierLevel: 0 } : {}),
      }, { merge: true });

      transaction.set(kingdomRef, {
        dailyActionsConsumed: newAggregateConsumed,
        totalPlayerCount: isNewPlayer ? FieldValue.increment(1) : (Number(kingdomData.totalPlayerCount) || 1),
        ...(needsKingdomActionsReset ? { dailyActionsResetAt: FieldValue.serverTimestamp() } : {}),
      }, { merge: true });

      return {
        serverNowMs,
        remainingActions: newRemaining,
        allowance,
        aggregateConsumed: newAggregateConsumed,
      };
    });

    return res.json({
      success: true,
      verifiedUserId: userId,
      status: 'in_progress',
      startTime: txResult.serverNowMs,
      duration: tierConfig.seconds,
      tier: tierKey,
      isSpecialTask,
      specialTaskType,
      actionsRemaining: txResult.remainingActions,
      message: isSpecialTask
        ? `Special Task (${specialTaskType === 'establish_stone' ? 'Establish Stone Quarry' : 'Establish Woodcutting'}) successfully assigned!`
        : 'Task successfully assigned by server clock and verified token',
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error in assignTask:', error);
    return res.status(500).json({ error: error.message || 'Server error in assignTask' });
  }
});

// API Route: collectTask
taskRouter.post('/api/collectTask', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const db = getDb();
    const taskRef = db.doc(taskPath(kingdomId, houseId, userId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const houseRef = db.doc(housePath(kingdomId, houseId));

    const resultData = await runGuardedTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(taskRef);

      if (!docSnap.exists) {
        throw { status: 404, error: 'No active task found to collect' };
      }

      const taskData = docSnap.data();
      if (!taskData || taskData.status !== 'in_progress') {
        throw {
          status: 400,
          error: `Task is not in progress! Current status: ${taskData?.status || 'unknown'}`,
        };
      }

      const startTimeMs = Number(taskData.startTime);
      const tierKey: TaskTierKey = (taskData.tier in TASK_TIERS) ? (taskData.tier as TaskTierKey) : 'quick';
      const tierConfig = TASK_TIERS[tierKey];
      const durationSec = Number(taskData.duration) || tierConfig.seconds;
      const requiredDurationMs = durationSec * 1000;

      const serverNowMs = Date.now();
      const elapsedMs = serverNowMs - startTimeMs;

      // STRICT SERVER TIMING VERIFICATION
      if (elapsedMs < requiredDurationMs - 3500) {
        const remainingSec = Math.ceil((requiredDurationMs - elapsedMs) / 1000);
        throw {
          status: 400,
          success: false,
          error: `Task is not completed yet! Server time check failed.`,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
          requiredSeconds: durationSec,
          remainingSeconds: remainingSec,
        };
      }

      const playerSnap = await transaction.get(playerRef);
      const playerData = playerSnap.data() || {};
      const multiplierLevel = Number(playerData.rewardMultiplierLevel) || 0;
      const currentMultiplier = multiplierForLevel(multiplierLevel);

      const kingdomSnap = await transaction.get(kingdomRef);
      const kingdomData = kingdomSnap.data() || {};
      const cathedralLevel = Number(kingdomData.cathedral?.level) ?? Number(kingdomData.church?.level) ?? 0;
      const cathedralMultiplier = cathedralContributionMultiplier(cathedralLevel);

      const houseSnap = await transaction.get(houseRef);
      const houseData = houseSnap.data() || {};
      const provisionersMultiplier = houseData.specialization === 'provisioners' ? 1.10 : 1.0;

      // Compute active Realm Event modifier inside transaction
      const { event: currentEvent } = getCurrentRealmEvent(serverNowMs);
      const eventGoldMultiplier = currentEvent.id === 'crown_jubilee' ? currentEvent.multiplier : 1.0;

      // Legacy items multiplier (+5% gold bonus per legacy item)
      const existingLegacyItems: LegacyItem[] = Array.isArray(playerData.legacyItems) ? playerData.legacyItems : [];
      const legacyBonus = existingLegacyItems.reduce((acc, item) => acc + (Number(item.bonusMultiplier) || 0.05), 0);
      const legacyMultiplier = 1 + legacyBonus;

      // Inaugural successor expedition bonus (+20% gold on first expedition of the new reign)
      const hasInauguralBonus = Boolean(playerData.inauguralExpeditionBonus);
      const inauguralMultiplier = hasInauguralBonus ? 1.20 : 1.0;

      const goldEarned = Math.floor(
        tierConfig.baseGold * currentMultiplier * eventGoldMultiplier * provisionersMultiplier * legacyMultiplier * inauguralMultiplier
      );
      const kingdomContribution = Math.floor(tierConfig.kingdomContribution * cathedralMultiplier);

      // Extended tier task: 25% chance of Legacy Item discovery
      let legacyItemAcquired: LegacyItem | null = null;
      const shouldDiscoverLegacy =
        tierKey === 'extended' &&
        (req.body.forceLegacyDrop === true || taskData.forceLegacyDrop === true || Math.random() < 0.25);

      if (shouldDiscoverLegacy) {
        const randomName = LEGACY_ITEM_NAMES[Math.floor(Math.random() * LEGACY_ITEM_NAMES.length)];
        const descendantName = playerData.descendantName || playerData.displayName || 'Crown Prince Alistair';
        legacyItemAcquired = {
          id: `legacy_${serverNowMs}_${Math.random().toString(36).substring(2, 8)}`,
          name: randomName,
          bonusMultiplier: 0.05,
          foundByDescendant: descendantName,
          foundAtTask: 'Extended Expedition',
          acquiredAt: serverNowMs,
        };
      }

      const playerUpdates: Record<string, any> = {
        gold: FieldValue.increment(goldEarned),
        rewardMultiplierLevel: multiplierLevel,
        expeditionsCompletedThisGen: FieldValue.increment(1),
      };

      if (hasInauguralBonus) {
        playerUpdates.inauguralExpeditionBonus = false;
      }

      if (legacyItemAcquired) {
        playerUpdates.legacyItems = FieldValue.arrayUnion(legacyItemAcquired);
      }

      transaction.set(playerRef, playerUpdates, { merge: true });

      let unlockedWood = false;
      let unlockedStone = false;
      if (taskData.isSpecialTask && taskData.specialTaskType === 'establish_stone') {
        unlockedStone = true;
        transaction.set(kingdomRef, {
          cumulativeContribution: FieldValue.increment(kingdomContribution),
          unlockedTaskTypes: FieldValue.arrayUnion('food', 'wood', 'stone'),
        }, { merge: true });
      } else if (taskData.isSpecialTask && (taskData.specialTaskType === 'establish_wood' || !taskData.specialTaskType)) {
        unlockedWood = true;
        transaction.set(kingdomRef, {
          cumulativeContribution: FieldValue.increment(kingdomContribution),
          unlockedTaskTypes: FieldValue.arrayUnion('food', 'wood'),
        }, { merge: true });
      } else {
        transaction.set(kingdomRef, {
          cumulativeContribution: FieldValue.increment(kingdomContribution),
        }, { merge: true });
      }

      const resultReward = {
        kingdomContribution,
        baseKingdomContribution: tierConfig.kingdomContribution,
        cathedralLevel,
        cathedralMultiplier,
        churchLevel: cathedralLevel,
        churchMultiplier: cathedralMultiplier,
        goldEarned,
        specialization: houseData.specialization || 'none',
        provisionersMultiplier,
        legacyMultiplier,
        legacyItemsCount: existingLegacyItems.length + (legacyItemAcquired ? 1 : 0),
        legacyItemAcquired,
        inauguralBonusApplied: hasInauguralBonus,
        inauguralMultiplier,
        completedAt: serverNowMs,
        unlockedWood,
        unlockedStone,
      };

      transaction.set(taskRef, {
        status: 'idle',
        startTime: null,
        duration: durationSec,
        tier: tierKey,
        result: resultReward,
      }, { merge: true });

      return {
        kingdomContribution,
        goldEarned,
        legacyItemAcquired,
        legacyMultiplier,
        inauguralBonusApplied: hasInauguralBonus,
        inauguralMultiplier,
        resultReward,
        elapsedMs,
      };
    });

    // Check and trigger daily Kingdom evaluation outside transaction
    await checkAndEvaluateKingdomsIfNeeded(kingdomId);

    return res.json({
      success: true,
      verifiedUserId: userId,
      status: 'idle',
      kingdomContribution: resultData.kingdomContribution,
      goldEarned: resultData.goldEarned,
      legacyItemAcquired: resultData.legacyItemAcquired,
      legacyMultiplier: resultData.legacyMultiplier,
      inauguralBonusApplied: resultData.inauguralBonusApplied,
      inauguralMultiplier: resultData.inauguralMultiplier,
      result: resultData.resultReward,
      serverElapsedSeconds: Math.floor(resultData.elapsedMs / 1000),
      message: resultData.legacyItemAcquired
        ? `Task collected! Unearthed Legacy Relic: "${resultData.legacyItemAcquired.name}" (+5% Gold)!`
        : resultData.inauguralBonusApplied
        ? `Task collected! Inaugural Successor Expedition (+20% Gold Bonus applied)!`
        : 'Task collected',
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error in collectTask:', error);
    return res.status(500).json({ error: error.message || 'Server error in collectTask' });
  }
});

// API Route: retireDescendant (Phase 16)
taskRouter.post('/api/retireDescendant', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const db = getDb();
    const taskRef = db.doc(taskPath(kingdomId, houseId, userId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));
    const kingdomRef = db.doc(kingdomPath(kingdomId));

    const resultData = await runGuardedTransaction(db, async (transaction) => {
      // 1. Check active task status (reject with 400 if in progress)
      const taskSnap = await transaction.get(taskRef);
      if (taskSnap.exists) {
        const taskData = taskSnap.data();
        if (taskData?.status === 'in_progress') {
          throw {
            status: 400,
            error: 'Cannot initiate royal succession while an expedition is in progress!',
          };
        }
      }

      // 2. Fetch player and kingdom data
      const playerSnap = await transaction.get(playerRef);
      const kingdomSnap = await transaction.get(kingdomRef);

      const kingdomData = kingdomSnap.data() || {};
      const playerData = playerSnap.data() || {};

      const isNewPlayer = !playerSnap.exists;
      const totalPlayerCount = (Number(kingdomData.totalPlayerCount) || 0) + (isNewPlayer ? 1 : 0);

      // 3. Resolve and verify actions budget
      const { remaining, allowance, needsReset } = resolveActionsState(playerData, totalPlayerCount);

      if (remaining <= 0) {
        throw {
          status: 400,
          error: 'No Actions remaining today to initiate royal succession',
          remaining: 0,
          allowance,
        };
      }

      // 4. Archive current descendant and advance generation
      const currentGen = Number(playerData.generation) || 1;
      const nextGen = currentGen + 1;
      const currentName = playerData.descendantName || 'Crown Prince Alistair';
      const currentTitle = playerData.descendantTitle || 'Heir Apparent';
      const totalExpeditions = Math.max(1, Number(playerData.expeditionsCompletedThisGen) || 1);
      const existingRelics: LegacyItem[] = Array.isArray(playerData.legacyItems) ? playerData.legacyItems : [];

      const retiredRecord: DescendantRecord = {
        generation: currentGen,
        name: currentName,
        title: currentTitle,
        retiredAt: Date.now(),
        totalExpeditionsCompleted: totalExpeditions,
        relicsBequeathed: existingRelics.length,
      };

      const availableNames = HEIR_NAMES.filter((n) => n !== currentName);
      const newName = availableNames[Math.floor(Math.random() * availableNames.length)] || 'Crown Princess Eleanor';
      const newTitle = HEIR_TITLES[Math.floor(Math.random() * HEIR_TITLES.length)] || 'Sovereign Heir of the Realm';

      const playerUpdates: Record<string, any> = {
        generation: nextGen,
        descendantName: newName,
        descendantTitle: newTitle,
        dynastyLineage: FieldValue.arrayUnion(retiredRecord),
        expeditionsCompletedThisGen: 0,
        inauguralExpeditionBonus: true,
        actionsRemainingToday: remaining - 1,
      };

      if (needsReset) {
        playerUpdates.actionsAllowanceToday = allowance;
        playerUpdates.actionsLastResetAt = FieldValue.serverTimestamp();
      }

      transaction.set(playerRef, playerUpdates, { merge: true });

      // Kingdom aggregate actions counter update
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);
      if (needsKingdomActionsReset) {
        transaction.set(kingdomRef, {
          dailyActionsConsumed: 1,
          dailyActionsResetAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        transaction.set(kingdomRef, {
          dailyActionsConsumed: FieldValue.increment(1),
        }, { merge: true });
      }

      return {
        success: true,
        retiredDescendant: retiredRecord,
        newHeir: {
          generation: nextGen,
          name: newName,
          title: newTitle,
        },
        dynastyLineageCount: (Array.isArray(playerData.dynastyLineage) ? playerData.dynastyLineage.length : 0) + 1,
        actionsRemainingToday: remaining - 1,
        legacyRelicsPreserved: existingRelics.length,
        inauguralExpeditionBonus: true,
      };
    });

    return res.json({
      success: true,
      verifiedUserId: userId,
      ...resultData,
      message: `Royal succession complete! Generation ${resultData.newHeir.generation} begins under ${resultData.newHeir.name}.`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error in retireDescendant:', error);
    return res.status(500).json({ error: error.message || 'Server error in retireDescendant' });
  }
});

// API Route: resetTask
taskRouter.post('/api/resetTask', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const db = getDb();
    const taskRef = db.doc(taskPath(kingdomId, houseId, userId));

    await taskRef.set({
      status: 'idle',
      startTime: null,
      duration: 90,
      tier: 'quick',
      result: null,
    });

    return res.json({
      success: true,
      verifiedUserId: userId,
      status: 'idle',
      message: 'Task state successfully reset to idle',
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error in resetTask:', error);
    return res.status(500).json({ error: error.message || 'Server error in resetTask' });
  }
});
