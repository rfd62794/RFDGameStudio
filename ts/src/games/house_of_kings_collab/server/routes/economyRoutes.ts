import { Router, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthenticatedRequest, verifyAuth } from '../middleware/verifyAuth';
import { getDb } from '../lib/firebaseAdmin';
import { playerPath } from '../lib/paths';
import { resolvePlayerContext } from '../lib/playerContext';
import { runGuardedTransaction } from '../lib/transactionHelpers';
import { multiplierForLevel } from './taskRoutes';

export function costForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.15, level));
}

export const economyRouter = Router();

// API Route: purchaseMultiplier
economyRouter.post('/api/purchaseMultiplier', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kingdomId, houseId, userId } = resolvePlayerContext(req, 'body');

    const db = getDb();
    const playerRef = db.doc(playerPath(kingdomId, houseId, userId));

    const txResult = await runGuardedTransaction(db, async (transaction) => {
      const snap = await transaction.get(playerRef);
      const playerData = snap.data() || {};
      const currentGold = Number(playerData.gold) || 0;
      const currentLevel = Number(playerData.rewardMultiplierLevel) || 0;
      const cost = costForLevel(currentLevel);

      if (currentGold < cost) {
        throw {
          status: 400,
          error: 'Not enough Gold',
          required: cost,
          current: currentGold,
        };
      }

      const newLevel = currentLevel + 1;

      transaction.set(playerRef, {
        gold: FieldValue.increment(-cost),
        rewardMultiplierLevel: FieldValue.increment(1),
      }, { merge: true });

      const newMultiplier = multiplierForLevel(newLevel);

      return {
        newLevel,
        cost,
        newMultiplier,
        remainingGold: currentGold - cost,
      };
    });

    return res.json({
      success: true,
      newLevel: txResult.newLevel,
      cost: txResult.cost,
      newMultiplier: txResult.newMultiplier,
      remainingGold: txResult.remainingGold,
      message: `Successfully upgraded Reward Multiplier to Level ${txResult.newLevel}!`,
    });
  } catch (error: any) {
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      return res.status(error.status).json(error);
    }
    console.error('Error in purchaseMultiplier:', error);
    return res.status(500).json({ error: error.message || 'Server error in purchaseMultiplier' });
  }
});
