import { getDb } from '../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { housePath } from '../lib/paths';
import { reputationLevelForScore, chapelReputationMultiplier } from '../../types';
import { runGuardedTransaction } from '../lib/transactionHelpers';
import { getCurrentRealmEvent } from '../../lib/realmEvents';

export interface FestivalResolutionResult {
  kingdomId: string;
  houseId: string;
  previousScore: number;
  addedScore: number;
  newScore: number;
  previousLevel: number;
  newLevel: number;
  resolvedAt: number;
  chapelLevel?: number;
  chapelMultiplier?: number;
  eventMultiplier?: number;
  activeEventId?: string;
}

/**
 * Daily resolution for House Fertility Festival.
 * Converts accumulated festivalContributionToday into permanent reputationScore
 * (boosted by chapelReputationMultiplier and active holy_convocation Realm Event),
 * recomputes reputationLevel, resets festivalContributionToday to 0, and updates festivalLastResolvedAt.
 * Executed atomically inside runGuardedTransaction.
 */
export async function evaluateHouseFestival(
  kingdomId: string = 'kingdom-mvp-0',
  houseId: string = 'house-of-kings-default'
): Promise<FestivalResolutionResult> {
  const db = getDb();
  const hRef = db.doc(housePath(kingdomId, houseId));

  return runGuardedTransaction(db, async (transaction) => {
    const snap = await transaction.get(hRef);

    const data = snap.data() || {};
    const currentScore = Number(data.reputationScore) || 0;
    const currentLevel = Number(data.reputationLevel) || reputationLevelForScore(currentScore);
    const contributionToday = Number(data.festivalContributionToday) || 0;

    const chapelLevel = Number(data.chapel?.level) || 0;
    const chapelMultiplier = chapelReputationMultiplier(chapelLevel);

    const resolvedAt = Date.now();
    const { event: currentEvent } = getCurrentRealmEvent(resolvedAt);
    const eventMultiplier = currentEvent.id === 'holy_convocation' ? currentEvent.multiplier : 1.0;

    const addedScore = Math.floor(contributionToday * chapelMultiplier * eventMultiplier);

    const newScore = currentScore + addedScore;
    const newLevel = reputationLevelForScore(newScore);

    const resolutionRecord = {
      resolvedAt,
      previousScore: currentScore,
      addedScore,
      newScore,
      previousLevel: currentLevel,
      newLevel,
      chapelLevel,
      chapelMultiplier,
      eventMultiplier,
      activeEventId: currentEvent.id,
    };

    transaction.set(hRef, {
      reputationScore: newScore,
      reputationLevel: newLevel,
      festivalContributionToday: 0, // Reset for next 24h window
      festivalLastResolvedAt: FieldValue.serverTimestamp(),
      lastResolution: resolutionRecord,
    }, { merge: true });

    return {
      kingdomId,
      houseId,
      previousScore: currentScore,
      addedScore,
      newScore,
      previousLevel: currentLevel,
      newLevel,
      resolvedAt,
      chapelLevel,
      chapelMultiplier,
      eventMultiplier,
      activeEventId: currentEvent.id,
    };
  });
}

/**
 * Visit-triggered evaluation check for House Fertility Festival.
 * Triggered on requests to GET /api/house and POST /api/contributeFestival.
 * Zero background timers or setIntervals used.
 */
export async function checkAndEvaluateHouseFestivalIfNeeded(
  kingdomId: string = 'kingdom-mvp-0',
  houseId: string = 'house-of-kings-default'
): Promise<boolean> {
  try {
    const db = getDb();
    const hRef = db.doc(housePath(kingdomId, houseId));
    const snap = await hRef.get();

    if (!snap.exists) {
      // Initialize House document on first visit
      await hRef.set({
        name: 'House of Kings',
        reputationScore: 0,
        reputationLevel: 0,
        festivalContributionToday: 0,
        festivalLastResolvedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return false;
    }

    const data = snap.data() || {};
    const lastResolvedAt = data.festivalLastResolvedAt;
    let lastResolvedMs = 0;

    if (lastResolvedAt && typeof lastResolvedAt.toMillis === 'function') {
      lastResolvedMs = lastResolvedAt.toMillis();
    } else if (lastResolvedAt && typeof lastResolvedAt.seconds === 'number') {
      lastResolvedMs = lastResolvedAt.seconds * 1000;
    } else if (typeof lastResolvedAt === 'number') {
      lastResolvedMs = lastResolvedAt;
    }

    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    if (lastResolvedMs === 0) {
      // Baseline timestamp initialization
      await hRef.set({
        reputationScore: Number(data.reputationScore) || 0,
        reputationLevel: Number(data.reputationLevel) || 0,
        festivalContributionToday: Number(data.festivalContributionToday) || 0,
        festivalLastResolvedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return false;
    }

    if (Date.now() - lastResolvedMs >= TWENTY_FOUR_HOURS_MS) {
      console.log(`[Visit-Triggered Evaluation] 24h elapsed for House ${houseId}. Executing daily festival resolution...`);
      await evaluateHouseFestival(kingdomId, houseId);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[Visit-Triggered Evaluation] Error checking house festival evaluation:', err);
    return false;
  }
}
