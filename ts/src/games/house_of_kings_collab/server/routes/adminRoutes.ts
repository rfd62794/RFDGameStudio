import { Router, Response } from 'express';
import { AuthenticatedRequest, verifyAuth, verifyAdmin } from '../middleware/verifyAuth';
import { getDb } from '../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  kingdomPath,
  housePath,
  playersCollectionPath,
  playerPath,
  taskPath,
  workersCollectionPath,
} from '../lib/paths';

import { evaluateHouseFestival } from '../functions/evaluateHouseFestival';
import { SPARK_LIMITS } from '../../lib/sparkLimits';
import { getFirestoreUsage } from '../../lib/monitoringClient';
import config from '../../firebase-applet-config.json' with { type: 'json' };

export const adminRouter = Router();

// Apply auth and admin middleware ONLY to routes handled by adminRouter
adminRouter.use(verifyAuth);
adminRouter.use(verifyAdmin);

// POST /api/admin/resetTask
adminRouter.post('/resetTask', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      kingdomId = 'kingdom-mvp-0',
      houseId = 'house-of-kings-default',
      targetUserId,
    } = req.body;

    const uid = targetUserId || req.verifiedUid;
    if (!uid) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    const db = getDb();
    const taskRef = db.doc(taskPath(kingdomId, houseId, uid));

    await taskRef.set({
      status: 'idle',
      startTime: null,
      duration: 90,
      tier: 'quick',
      result: null,
    });

    return res.json({
      success: true,
      gm: req.verifiedEmail,
      targetUserId: uid,
      message: `Game Master successfully reset task for player ${uid}`,
    });
  } catch (err: any) {
    console.error('Error in admin resetTask:', err);
    return res.status(500).json({ error: err.message || 'Server error in admin resetTask' });
  }
});

// POST /api/admin/completeTask
adminRouter.post('/completeTask', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      kingdomId = 'kingdom-mvp-0',
      houseId = 'house-of-kings-default',
      targetUserId,
    } = req.body;

    const uid = targetUserId || req.verifiedUid;
    if (!uid) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    const db = getDb();
    const taskRef = db.doc(taskPath(kingdomId, houseId, uid));
    const docSnap = await taskRef.get();

    const taskData = docSnap.data() || {};
    const duration = Number(taskData.duration) || 90;

    // Set startTime well into the past (at least 1 hour) so collectTask requirement is guaranteed fulfilled
    const pastStartTime = Date.now() - Math.max(duration * 1000 + 60000, 3600000);

    await taskRef.set({
      status: 'in_progress',
      startTime: pastStartTime,
      duration,
      tier: taskData.tier || 'quick',
      result: null,
    }, { merge: true });

    return res.json({
      success: true,
      gm: req.verifiedEmail,
      targetUserId: uid,
      message: `Game Master instantly completed task timer for player ${uid}! Ready for collection.`,
    });
  } catch (err: any) {
    console.error('Error in admin completeTask:', err);
    return res.status(500).json({ error: err.message || 'Server error in admin completeTask' });
  }
});

// POST /api/admin/setPlayerState
adminRouter.post('/setPlayerState', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      kingdomId = 'kingdom-mvp-0',
      houseId = 'house-of-kings-default',
      targetUserId,
      gold,
      rewardMultiplierLevel,
      addGold,
      resources,
      churchLevel,
      cathedralLevel,
      chapelLevel,
      reputationScore,
      reputationLevel,
      actionsRemainingToday,
      actionsAllowanceToday,
      actionsLastResetAt,
    } = req.body;

    const uid = targetUserId || req.verifiedUid;
    if (!uid) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    const db = getDb();
    const playerRef = db.doc(playerPath(kingdomId, houseId, uid));

    const updates: Record<string, any> = {};

    if (typeof addGold === 'number') {
      updates.gold = FieldValue.increment(addGold);
    } else if (typeof gold === 'number') {
      updates.gold = gold;
    }

    if (typeof rewardMultiplierLevel === 'number') {
      updates.rewardMultiplierLevel = rewardMultiplierLevel;
    }

    if (typeof actionsRemainingToday === 'number') {
      updates.actionsRemainingToday = actionsRemainingToday;
      if (actionsLastResetAt === undefined) {
        updates.actionsLastResetAt = Date.now();
      }
    }

    if (typeof actionsAllowanceToday === 'number') {
      updates.actionsAllowanceToday = actionsAllowanceToday;
    }

    if (actionsLastResetAt !== undefined) {
      updates.actionsLastResetAt = actionsLastResetAt;
    }

    if (resources && typeof resources === 'object') {
      updates.resources = {
        food: Number(resources.food) || 0,
        wood: Number(resources.wood) || 0,
        stone: Number(resources.stone) || 0,
      };
    }

    if (req.body.legacyItems !== undefined) {
      updates.legacyItems = req.body.legacyItems;
    }

    if (typeof req.body.generation === 'number') {
      updates.generation = req.body.generation;
    }

    if (typeof req.body.descendantName === 'string') {
      updates.descendantName = req.body.descendantName;
    }

    if (typeof req.body.descendantTitle === 'string') {
      updates.descendantTitle = req.body.descendantTitle;
    }

    if (Array.isArray(req.body.dynastyLineage)) {
      updates.dynastyLineage = req.body.dynastyLineage;
    }

    if (typeof req.body.expeditionsCompletedThisGen === 'number') {
      updates.expeditionsCompletedThisGen = req.body.expeditionsCompletedThisGen;
    }

    if (typeof req.body.inauguralExpeditionBonus === 'boolean') {
      updates.inauguralExpeditionBonus = req.body.inauguralExpeditionBonus;
    }

    await playerRef.set(updates, { merge: true });

    const targetCathedralLevel = typeof cathedralLevel === 'number' ? cathedralLevel : churchLevel;
    if (typeof targetCathedralLevel === 'number') {
      const kingdomRef = db.doc(kingdomPath(kingdomId));
      await kingdomRef.set({
        cathedral: { level: targetCathedralLevel },
        church: { level: targetCathedralLevel },
      }, { merge: true });
    }

    if (req.body.unlockedTaskTypes !== undefined) {
      const kingdomRef = db.doc(kingdomPath(kingdomId));
      await kingdomRef.set({
        unlockedTaskTypes: req.body.unlockedTaskTypes,
      }, { merge: true });
    }

    if (typeof chapelLevel === 'number') {
      const houseRef = db.doc(housePath(kingdomId, houseId));
      await houseRef.set({ chapel: { level: chapelLevel } }, { merge: true });
    }

    if (typeof req.body.forgeLevel === 'number') {
      const houseRef = db.doc(housePath(kingdomId, houseId));
      await houseRef.set({ forge: { level: req.body.forgeLevel } }, { merge: true });
    }

    if (req.body.resetWorkers) {
      const workersCol = db.collection(workersCollectionPath(kingdomId, houseId, uid));
      const activeSnap = await workersCol.where('status', '==', 'in_progress').get();
      if (!activeSnap.empty) {
        const batch = db.batch();
        activeSnap.forEach((doc) => {
          batch.set(doc.ref, { status: 'idle' }, { merge: true });
        });
        await batch.commit();
      }
    }

    if (typeof reputationScore === 'number' || typeof reputationLevel === 'number' || req.body.specialization !== undefined) {
      const houseRef = db.doc(housePath(kingdomId, houseId));
      const houseUpdates: Record<string, any> = {};
      if (typeof reputationScore === 'number') houseUpdates.reputationScore = reputationScore;
      if (typeof reputationLevel === 'number') houseUpdates.reputationLevel = reputationLevel;
      if (req.body.specialization !== undefined) houseUpdates.specialization = req.body.specialization;
      await houseRef.set(houseUpdates, { merge: true });
    }

    return res.json({
      success: true,
      gm: req.verifiedEmail,
      targetUserId: uid,
      updatedFields: Object.keys(updates),
      message: `Game Master updated player ${uid} state successfully`,
    });
  } catch (err: any) {
    console.error('Error in admin setPlayerState:', err);
    return res.status(500).json({ error: err.message || 'Server error in admin setPlayerState' });
  }
});

// POST /api/admin/evaluateHouseFestival
adminRouter.post('/evaluateHouseFestival', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      kingdomId = 'kingdom-mvp-0',
      houseId = 'house-of-kings-default',
    } = req.body;

    const result = await evaluateHouseFestival(kingdomId, houseId);

    return res.json({
      success: true,
      gm: req.verifiedEmail,
      result,
      newScore: result.newScore,
      newLevel: result.newLevel,
      addedScore: result.addedScore,
      previousScore: result.previousScore,
      previousLevel: result.previousLevel,
      message: `House Festival evaluated for ${houseId}. New reputation score: ${result.newScore}, Level: ${result.newLevel}.`,
    });
  } catch (err: any) {
    console.error('Error in admin evaluateHouseFestival:', err);
    return res.status(500).json({ error: err.message || 'Server error evaluating house festival' });
  }
});

// GET /api/admin/players
adminRouter.get('/players', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const kingdomId = (req.query.kingdomId as string) || 'kingdom-mvp-0';
    const houseId = (req.query.houseId as string) || 'house-of-kings-default';

    const db = getDb();
    const playersCol = db.collection(playersCollectionPath(kingdomId, houseId));
    const snap = await playersCol.get();

    const players = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return res.json({
      success: true,
      gm: req.verifiedEmail,
      count: players.length,
      players,
    });
  } catch (err: any) {
    console.error('Error in admin players list:', err);
    return res.status(500).json({ error: err.message || 'Server error in admin players list' });
  }
});

// POST /api/admin/completeWorker
adminRouter.post('/completeWorker', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      kingdomId = 'kingdom-mvp-0',
      houseId = 'house-of-kings-default',
      targetUserId,
      workerId,
    } = req.body;

    const uid = targetUserId || req.verifiedUid;
    if (!uid) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    const db = getDb();
    const workersCol = db.collection(workersCollectionPath(kingdomId, houseId, uid));

    let wId = workerId;
    if (!wId) {
      const snap = await workersCol.where('status', '==', 'in_progress').limit(1).get();
      if (!snap.empty) {
        wId = snap.docs[0].id;
      }
    }

    if (!wId) {
      return res.status(404).json({ error: 'No in_progress worker found to complete' });
    }

    const workerRef = workersCol.doc(wId);
    const docSnap = await workerRef.get();
    const data = docSnap.data() || {};
    const duration = Number(data.duration) || 300;

    // Set startTime well into the past (at least 1 hour) so collectWorker requirement is guaranteed fulfilled
    const pastStartTime = Date.now() - Math.max(duration * 1000 + 60000, 3600000);

    await workerRef.set({
      status: 'in_progress',
      startTime: pastStartTime,
      duration,
    }, { merge: true });

    return res.json({
      success: true,
      gm: req.verifiedEmail,
      targetUserId: uid,
      workerId: wId,
      message: `Game Master completed worker timer for worker ${wId}`,
    });
  } catch (err: any) {
    console.error('Error in admin completeWorker:', err);
    return res.status(500).json({ error: err.message || 'Server error in admin completeWorker' });
  }
});

// GET /api/admin/quotaUsage
adminRouter.get('/quotaUsage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || config.projectId;
    const usage = await getFirestoreUsage(projectId);

    return res.json({
      success: true,
      gm: req.verifiedEmail,
      projectId,
      limits: SPARK_LIMITS,
      usage,
    });
  } catch (err: any) {
    console.error('Error in admin quotaUsage:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch Cloud Monitoring quota usage',
      limits: SPARK_LIMITS,
    });
  }
});

