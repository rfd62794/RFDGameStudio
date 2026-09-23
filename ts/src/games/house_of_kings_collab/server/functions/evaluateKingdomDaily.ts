import { getDb } from '../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export interface EvaluationResult {
  kingdomId: string;
  previousLevel: number;
  newLevel: number;
  contributionAchieved: number;
  thresholdRequired: number;
  success: boolean;
  evaluatedAt: number;
}

/**
 * Cloud Scheduler-triggered / API-triggered daily evaluation function.
 * Evaluates cumulative contribution against threshold (500), updates kingdom level,
 * resets cumulative contribution to 0, and records last evaluation.
 * Floor for level is 1 (reversible setback, never drops below 1).
 */
export async function evaluateKingdomDaily(kingdomId: string = 'kingdom-mvp-0'): Promise<EvaluationResult> {
  const db = getDb();
  const kingdomRef = db.doc(`kingdoms/${kingdomId}`);
  const snap = await kingdomRef.get();

  const data = snap.data() || {};
  const level = Number(data.level) || 1;
  const cumulativeContribution = Number(data.cumulativeContribution) || 0;

  const THRESHOLD = 500; // Daily requirement threshold

  const success = cumulativeContribution >= THRESHOLD;
  const newLevel = success ? level + 1 : Math.max(1, level - 1); // Floor at 1

  const evaluatedAt = Date.now();
  const evaluationRecord = {
    evaluatedAt,
    previousLevel: level,
    newLevel,
    contributionAchieved: cumulativeContribution,
    thresholdRequired: THRESHOLD,
    success,
  };

  await kingdomRef.set({
    level: newLevel,
    cumulativeContribution: 0, // Reset for the next 24h window
    lastEvaluatedAt: FieldValue.serverTimestamp(),
    lastEvaluation: evaluationRecord,
  }, { merge: true });

  return {
    kingdomId,
    previousLevel: level,
    newLevel,
    contributionAchieved: cumulativeContribution,
    thresholdRequired: THRESHOLD,
    success,
    evaluatedAt,
  };
}

/**
 * Background clock scheduler function.
 * Checks if 24 hours have elapsed since lastEvaluatedAt.
 * If 24h elapsed, automatically triggers evaluateKingdomDaily without requiring user intervention.
 */
export async function checkAndEvaluateKingdomsIfNeeded(kingdomId: string = 'kingdom-mvp-0'): Promise<boolean> {
  try {
    const db = getDb();
    const kingdomRef = db.doc(`kingdoms/${kingdomId}`);
    const snap = await kingdomRef.get();

    if (!snap.exists) {
      // Initialize Kingdom document on first run
      await kingdomRef.set({
        level: 1,
        cumulativeContribution: 0,
        lastEvaluatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return false;
    }

    const data = snap.data() || {};
    const lastEvaluatedAt = data.lastEvaluatedAt;
    let lastEvaluatedMs = 0;

    if (lastEvaluatedAt && typeof lastEvaluatedAt.toMillis === 'function') {
      lastEvaluatedMs = lastEvaluatedAt.toMillis();
    } else if (lastEvaluatedAt && typeof lastEvaluatedAt.seconds === 'number') {
      lastEvaluatedMs = lastEvaluatedAt.seconds * 1000;
    } else if (typeof lastEvaluatedAt === 'number') {
      lastEvaluatedMs = lastEvaluatedAt;
    }

    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    if (lastEvaluatedMs === 0) {
      // Set timestamp baseline if missing
      await kingdomRef.set({
        level: Number(data.level) || 1,
        cumulativeContribution: Number(data.cumulativeContribution) || 0,
        lastEvaluatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return false;
    }

    if (Date.now() - lastEvaluatedMs >= TWENTY_FOUR_HOURS_MS) {
      console.log(`[Scheduled Evaluation] 24h elapsed for ${kingdomId}. Running automatic evaluation...`);
      await evaluateKingdomDaily(kingdomId);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[Scheduled Evaluation] Error checking scheduled evaluation:', err);
    return false;
  }
}
