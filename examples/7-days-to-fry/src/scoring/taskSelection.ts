/**
 * @file src/scoring/taskSelection.ts
 * Discrete Task Selection (Argmax Evaluation) using consolidated reducer.
 */

import {
  ATTENTION_ACTION_STAMINA_COST,
  ATTENTION_TIER_HIGH,
  ATTENTION_TIER_LOW,
  ATTENTION_TIER_MID,
  CONTAGION_INCREMENT_ON_CORNER_CUT,
  REPAIR_DURATION_STAGE_1,
  REPAIR_DURATION_STAGE_2,
  REPAIR_DURATION_STAGE_3,
  STATION_NUDGE_DURATION_SECONDS,
} from '../data';
import { ActionCandidate, KitchenState, ManagerState, ManagerTaskType, StationId, Worker } from '../types';
import {
  getManagerEffectiveStamina,
  scoreCleanBathroom,
  scoreCleanMess,
  scoreCoffee,
  scoreCornerCut,
  scoreDischargeMeal,
  scoreEatMeal,
  scoreManagerAutoRepair,
  scoreManagerCoffee,
  scoreManagerPatrol,
  scoreManagerRest,
  scoreManagerSupervise,
  scoreProtocol,
  scoreRest,
  scoreThirst,
  scoreUseBathroom,
} from './utilityScoring';

export interface Action<TAgent> {
  name: string;
  score: number;
}

export function selectBestAction<TAgent>(candidates: Action<TAgent>[]): Action<TAgent> {
  return candidates.reduce((best, c) => (c.score > best.score ? c : best));
}

export function evaluateWorkerTick(w: Worker, k: KitchenState): ActionCandidate {
  const candidates: Action<Worker>[] = [
    { name: 'protocol', score: scoreProtocol(w, k) },
    { name: 'corner_cut', score: scoreCornerCut(w, k) },
    { name: 'rest', score: scoreRest(w, k) },
    { name: 'eat_meal', score: scoreEatMeal(w, k) },
    { name: 'drink_coffee', score: scoreCoffee(w, k) },
    { name: 'drink_water', score: scoreThirst(w, k) },
    { name: 'use_bathroom', score: scoreUseBathroom(w, k) },
    { name: 'clean_bathroom', score: scoreCleanBathroom(w, k) },
    { name: 'discharge_meal', score: scoreDischargeMeal(w, k) },
    { name: 'clean_mess', score: scoreCleanMess(w, k) },
  ];
  const selected = selectBestAction(candidates);
  if (selected.name === 'corner_cut') {
    k.peerCorrCutNorm = Math.min(1.0, k.peerCorrCutNorm + CONTAGION_INCREMENT_ON_CORNER_CUT);
  }
  return selected as ActionCandidate;
}

export function evaluateManagerTick(m: ManagerState, k: KitchenState): ActionCandidate {
  if (k.committedRepairTask && k.committedRepairTask.remainingSeconds > 0) {
    return { name: 'repair' as ManagerTaskType, score: 999 };
  }
  const candidates: Action<ManagerState>[] = [
    { name: 'supervise', score: scoreManagerSupervise(m, k) },
    { name: 'patrol', score: scoreManagerPatrol(m, k) },
    { name: 'rest', score: scoreManagerRest(m) },
    { name: 'drink_coffee', score: scoreManagerCoffee(m, k) },
    { name: 'auto_repair', score: scoreManagerAutoRepair(m, k) },
    { name: 'clean_mess', score: scoreCleanMess(m, k) },
  ];
  const selected = selectBestAction(candidates);

  if (selected.name === 'auto_repair') {
    if (k.situationQueue && k.situationQueue.length > 0) {
      let highestIdx = 0;
      for (let i = 1; i < k.situationQueue.length; i++) {
        if (k.situationQueue[i].stage > k.situationQueue[highestIdx].stage) {
          highestIdx = i;
        }
      }
      const sit = k.situationQueue[highestIdx];
      k.situationQueue.splice(highestIdx, 1);

      let duration = REPAIR_DURATION_STAGE_1;
      if (sit.stage === 2) duration = REPAIR_DURATION_STAGE_2;
      else if (sit.stage >= 3) duration = REPAIR_DURATION_STAGE_3;

      k.committedRepairTask = {
        stationId: sit.stationId,
        stage: sit.stage,
        remainingSeconds: duration,
        totalDuration: duration,
      };
      m.currentTask = 'repair';
      return { name: 'repair' as ManagerTaskType, score: selected.score };
    }
  }

  return selected as ActionCandidate;
}

export function getAvailableAttention(m: ManagerState): number {
  const eff = getManagerEffectiveStamina(m);
  if (eff >= ATTENTION_TIER_HIGH) return 3;
  if (eff >= ATTENTION_TIER_MID) return 2;
  if (eff >= ATTENTION_TIER_LOW) return 1;
  return 0;
}

export function spendAttention(m: ManagerState): boolean {
  if (getAvailableAttention(m) <= 0) return false;
  m.stamina = Math.max(0, m.stamina - ATTENTION_ACTION_STAMINA_COST);
  return true;
}

export function respondToSituation(state: KitchenState, situationId: string, response: boolean): boolean {
  if (!state.situationQueue) state.situationQueue = [];
  const index = state.situationQueue.findIndex((s) => s.id === situationId);
  if (index === -1) return false;

  const sit = state.situationQueue[index];
  if (!response) {
    // Defer: Situation stays in queue, escalation clock continues/begins
    return true;
  }

  // Spend attention for player 'Yes' response
  if (!spendAttention(state.manager)) {
    return false;
  }

  state.situationQueue.splice(index, 1);

  let duration = REPAIR_DURATION_STAGE_1;
  if (sit.stage === 2) duration = REPAIR_DURATION_STAGE_2;
  else if (sit.stage >= 3) duration = REPAIR_DURATION_STAGE_3;

  state.committedRepairTask = {
    stationId: sit.stationId,
    stage: sit.stage,
    remainingSeconds: duration,
    totalDuration: duration,
  };
  state.manager.currentTask = 'repair';
  return true;
}

export function investigateWorker(state: KitchenState, workerId: string): boolean {
  state.hasSeenCautionHint = true;
  if (!spendAttention(state.manager)) return false;
  state.manager.currentSuperviseTargetId = workerId;
  return true;
}

export function nudgeToStation(state: KitchenState, workerId: string): boolean {
  if (!spendAttention(state.manager)) return false;
  const worker = state.workers.find((w) => w.id === workerId);
  if (worker) worker.stationNudgeBoostRemaining = STATION_NUDGE_DURATION_SECONDS;
  return true;
}

export function setPrimaryStation(worker: Worker, stationId: StationId): void {
  worker.primaryStation = stationId;
}
