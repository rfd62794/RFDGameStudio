import { Router, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthenticatedRequest, verifyAuth } from '../middleware/verifyAuth';
import { getDb } from '../lib/firebaseAdmin';
import { kingdomPath, housePath, playerPath, workersCollectionPath } from '../lib/paths';
import { resolvePlayerContext } from '../lib/playerContext';
import { runGuardedTransaction } from '../lib/transactionHelpers';
import { workerPoolSize, WorkerTask, TaskType, parseUnlockedTaskTypes, resolveActionsState } from '../../types';
import { resolveKingdomAggregateActionsState } from '../../lib/actionsAllocation';
import { getCurrentRealmEvent } from '../../lib/realmEvents';
import { checkAndEvaluateKingdomsIfNeeded } from '../../functions/evaluateKingdomDaily';

export const workerRouter = Router();

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

// GET /api/workers - Fetch player's worker pool status and active tasks
workerRouter.get('/api/workers', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'query');

    // Lazy evaluation trigger for 24h window
    await checkAndEvaluateKingdomsIfNeeded(kingdomId);

    const db = getDb();
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const kingdomSnap = await kingdomRef.get();
    const kingdomData = kingdomSnap.data() || {};
    const kingdomLevel = Number(kingdomData.level) || 1;

    const houseRef = db.doc(housePath(kingdomId, houseId));
    const houseSnap = await houseRef.get();
    const houseData = houseSnap.data() || {};
    const forgeLevel = Number(houseData.forge?.level) || 0;

    const poolSize = workerPoolSize(kingdomLevel, forgeLevel);
    const unlockedTaskTypes = parseUnlockedTaskTypes(kingdomData.unlockedTaskTypes);

    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));
    const playerSnap = await playerRef.get();
    const playerData = playerSnap.data() || {};
    const resources = parseResources(playerData.resources, playerData);

    const workersSnap = await db.collection(workersCollectionPath(kingdomId, houseId, userId)).get();

    const workers: WorkerTask[] = [];
    let activeCount = 0;

    workersSnap.forEach((doc) => {
      const data = doc.data() as WorkerTask;
      workers.push({
        id: doc.id,
        status: data.status || 'idle',
        startTime: data.startTime || null,
        duration: data.duration || 300,
        taskType: data.taskType || 'food',
        result: data.result || null,
        createdAt: data.createdAt,
      });
      if (data.status === 'in_progress') {
        activeCount++;
      }
    });

    return res.json({
      success: true,
      kingdomLevel,
      forgeLevel,
      poolSize,
      unlockedTaskTypes,
      resources,
      activeCount,
      workers,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error fetching workers:', error);
    return res.status(500).json({ error: error.message || 'Server error fetching workers' });
  }
});

// POST /api/assignWorker - Assign a new worker task
workerRouter.post('/api/assignWorker', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const requestedDuration = Number(req.body.duration) || 300; // 300s (5min) to 3600s (1hr)
    const validDuration = Math.max(300, Math.min(3600, requestedDuration));
    const requestedTaskType: TaskType = (req.body.taskType === 'stone' ? 'stone' : req.body.taskType === 'wood' ? 'wood' : 'food');

    // Lazy evaluation check
    await checkAndEvaluateKingdomsIfNeeded(kingdomId);

    const db = getDb();
    const kingdomRef = db.doc(kingdomPath(kingdomId));
    const houseRef = db.doc(housePath(kingdomId, houseId));
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));
    const workersCol = db.collection(workersCollectionPath(kingdomId, houseId, userId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      // 1. Get kingdom, house & player docs
      const kingdomSnap = await transaction.get(kingdomRef);
      const houseSnap = await transaction.get(houseRef);
      const playerSnap = await transaction.get(playerRef);

      const kingdomData = kingdomSnap.data() || {};
      const houseData = houseSnap.data() || {};
      const playerData = playerSnap.data() || {};

      const isNewPlayer = !playerSnap.exists;
      const totalPlayerCount = (Number(kingdomData.totalPlayerCount) || 0) + (isNewPlayer ? 1 : 0);

      // Actions Cap Check with per-player allowance formula
      const { remaining, allowance, needsReset } = resolveActionsState(playerData, totalPlayerCount);

      if (remaining <= 0) {
        throw {
          status: 400,
          error: 'No Actions remaining today',
          remaining: 0,
          allowance,
        };
      }

      // Resolve Kingdom aggregate actions state
      const { dailyActionsConsumed, needsReset: needsKingdomActionsReset } = resolveKingdomAggregateActionsState(kingdomData);

      const kingdomLevel = Number(kingdomData.level) || 1;
      const forgeLevel = Number(houseData.forge?.level) || 0;
      const poolSize = workerPoolSize(kingdomLevel, forgeLevel);
      const unlockedTaskTypes = parseUnlockedTaskTypes(kingdomData.unlockedTaskTypes);

      // STRICT UNLOCKED TASK TYPE VALIDATION
      if (!unlockedTaskTypes.includes(requestedTaskType)) {
        throw {
          status: 400,
          error: `Task Type '${requestedTaskType}' is not yet unlocked`,
          unlockedTaskTypes,
        };
      }

      // Query currently in_progress workers for this player
      const activeWorkersQuery = workersCol.where('status', '==', 'in_progress');
      const workersSnap = await transaction.get(activeWorkersQuery);

      if (workersSnap.size >= poolSize) {
        throw {
          status: 400,
          error: 'Worker Pool at capacity',
          poolSize,
          active: workersSnap.size,
        };
      }

      // Create new worker task document
      const workerRef = workersCol.doc();
      const startTime = Date.now();
      const newWorker: WorkerTask = {
        id: workerRef.id,
        status: 'in_progress',
        startTime,
        duration: validDuration,
        taskType: requestedTaskType,
        result: null,
        createdAt: startTime,
      };

      const newRemaining = remaining - 1;
      const newAggregateConsumed = dailyActionsConsumed + 1;

      transaction.set(workerRef, newWorker);

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
        workerId: workerRef.id,
        startTime,
        activeCount: workersSnap.size + 1,
        poolSize,
        remainingActions: newRemaining,
        allowance,
        aggregateConsumed: newAggregateConsumed,
      };
    });

    return res.json({
      success: true,
      workerId: txResult.workerId,
      startTime: txResult.startTime,
      duration: validDuration,
      taskType: requestedTaskType,
      activeCount: txResult.activeCount,
      poolSize: txResult.poolSize,
      actionsRemaining: txResult.remainingActions,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error in assignWorker:', error);
    return res.status(500).json({ error: error.message || 'Server error assigning worker' });
  }
});

// POST /api/collectWorker - Collect completed worker task
workerRouter.post('/api/collectWorker', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const workerId = req.body.workerId;
    if (!workerId) {
      return res.status(400).json({ error: 'workerId is required' });
    }

    const db = getDb();
    const workerRef = db.doc(`${workersCollectionPath(kingdomId, houseId, userId)}/${workerId}`);
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      const workerSnap = await transaction.get(workerRef);
      if (!workerSnap.exists) {
        throw { status: 404, error: 'Worker task not found' };
      }

      const workerData = workerSnap.data() as WorkerTask;
      if (workerData.status !== 'in_progress') {
        throw { status: 400, error: 'Worker task is not currently in progress' };
      }

      const startTimeMs = Number(workerData.startTime) || 0;
      const requiredDurationMs = (Number(workerData.duration) || 300) * 1000;
      const serverNowMs = Date.now();
      const elapsedMs = serverNowMs - startTimeMs;

      // Strict elapsed time verification with clock drift tolerance (3.5s)
      if (elapsedMs < requiredDurationMs - 3500) {
        const remainingSeconds = Math.ceil((requiredDurationMs - elapsedMs) / 1000);
        throw {
          status: 400,
          error: 'Worker task duration not completed on server clock',
          remainingSeconds,
        };
      }

      // Calculate resources earned
      const durationSec = Number(workerData.duration) || 300;
      const baseResourcesEarned = Math.max(10, Math.floor(durationSec / 30));
      const taskType: TaskType = workerData.taskType === 'stone' ? 'stone' : workerData.taskType === 'wood' ? 'wood' : 'food';

      // Compute active Realm Event modifier inside transaction
      const { event: currentEvent } = getCurrentRealmEvent(serverNowMs);
      let eventMultiplier = 1.0;
      if (taskType === 'food' && currentEvent.id === 'bountiful_harvest') {
        eventMultiplier = currentEvent.multiplier; // 1.5
      } else if (taskType === 'wood' && currentEvent.id === 'timber_rush') {
        eventMultiplier = currentEvent.multiplier; // 1.5
      }

      const resourcesEarned = Math.floor(baseResourcesEarned * eventMultiplier);

      // ATOMIC INCREMENT FOR TYPED RESOURCES
      const playerSnap = await transaction.get(playerRef);
      const playerData = playerSnap.data() || {};
      const currentRes = parseResources(playerData.resources, playerData);

      const newFood = taskType === 'food' ? currentRes.food + resourcesEarned : currentRes.food;
      const newWood = taskType === 'wood' ? currentRes.wood + resourcesEarned : currentRes.wood;
      const newStone = taskType === 'stone' ? currentRes.stone + resourcesEarned : currentRes.stone;

      transaction.set(playerRef, {
        resources: {
          food: newFood,
          wood: newWood,
          stone: newStone,
        },
      }, { merge: true });

      // Update worker status to idle
      transaction.set(workerRef, {
        status: 'idle',
        result: { resourcesEarned, taskType },
      }, { merge: true });

      return {
        taskType,
        resourcesEarned,
      };
    });

    return res.json({
      success: true,
      workerId,
      taskType: txResult.taskType,
      resourcesEarned: txResult.resourcesEarned,
      message: `Worker task collected! Earned +${txResult.resourcesEarned} ${txResult.taskType.toUpperCase()}.`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error in collectWorker:', error);
    return res.status(500).json({ error: error.message || 'Server error collecting worker task' });
  }
});
