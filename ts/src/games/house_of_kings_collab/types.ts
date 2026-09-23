export interface ChapelData {
  level: number;
}

export const CHAPEL_MAX_LEVEL = 3;

export function chapelUpgradeCost(currentLevel: number): { food: number; wood: number } {
  const costs = [
    { food: 150, wood: 150 },  // level 0 -> 1
    { food: 350, wood: 350 },  // level 1 -> 2
    { food: 800, wood: 800 },  // level 2 -> 3
  ];
  return costs[currentLevel] || { food: 999999, wood: 999999 };
}

export function chapelReputationMultiplier(level: number): number {
  return 1 + (Number(level) || 0) * 0.1;
}

export interface ForgeData {
  level: number;
}

export const FORGE_MAX_LEVEL = 3;

export function forgeUpgradeCost(currentLevel: number): { food: number; wood: number; stone: number } {
  const costs = [
    { food: 100, wood: 150, stone: 100 },  // level 0 -> 1
    { food: 250, wood: 350, stone: 250 },  // level 1 -> 2
    { food: 500, wood: 800, stone: 600 },  // level 2 -> 3
  ];
  return costs[currentLevel] || { food: 999999, wood: 999999, stone: 999999 };
}

export type HouseSpecialization = 'none' | 'provisioners' | 'builders' | 'diplomats';

export function specializationDiscount<T extends { food: number; wood: number; stone?: number }>(
  spec: string | undefined,
  cost: T
): T {
  if (spec === 'builders') {
    return {
      ...cost,
      food: Math.floor(cost.food * 0.85),
      wood: Math.floor(cost.wood * 0.85),
      ...(typeof cost.stone === 'number' ? { stone: Math.floor(cost.stone * 0.85) } : {}),
    };
  }
  return cost;
}

export interface House {
  id: string;
  name: string;
  createdAt: number | string;
  reputationScore?: number;
  reputationLevel?: number;
  festivalContributionToday?: number;
  festivalLastResolvedAt?: number | string | null;
  lastResolution?: any;
  chapel?: ChapelData;
  forge?: ForgeData;
  specialization?: HouseSpecialization;
}

export const REPUTATION_THRESHOLDS = [0, 100, 300, 700, 1500]; // score needed for level 0-4

export function reputationLevelForScore(score: number): number {
  let level = 0;
  for (let i = 0; i < REPUTATION_THRESHOLDS.length; i++) {
    if (score >= REPUTATION_THRESHOLDS[i]) {
      level = i;
    }
  }
  return level;
}

export type TaskType = 'food' | 'wood' | 'stone';

export interface ResourcesMap {
  food: number;
  wood: number;
  stone: number;
}

export interface LegacyItem {
  id: string;
  name: string;
  bonusMultiplier: number;
  foundByDescendant: string;
  foundAtTask: string;
  acquiredAt: number;
}

export interface DescendantRecord {
  generation: number;
  name: string;
  title: string;
  retiredAt: number;
  totalExpeditionsCompleted: number;
  relicsBequeathed: number;
}

export interface Player {
  userId: string;
  displayName: string;
  joinedAt: number | string;
  gold: number;
  rewardMultiplierLevel: number;
  resources?: number | ResourcesMap;
  actionsRemainingToday?: number;
  actionsAllowanceToday?: number;
  actionsLastResetAt?: any;
  legacyItems?: LegacyItem[];
  generation?: number;
  descendantName?: string;
  descendantTitle?: string;
  dynastyLineage?: DescendantRecord[];
  expeditionsCompletedThisGen?: number;
  inauguralExpeditionBonus?: boolean;
}

export const ACTIONS_PER_DAY = 20; // Default / max per player
export const RESERVED_DAILY_BUDGET = 10000; // Half of Spark's real 20,000 write/day limit
export const MIN_PER_PLAYER = 5;
export const MAX_PER_PLAYER = 20; // Original Phase 8 ceiling, now upper bound of division
export const AGGREGATE_WARNING_THRESHOLD = 0.8; // 80% of reserved budget consumed
export const PERSONAL_WARNING_THRESHOLD = 0.2; // 20% of player allowance remaining

export function resolveActionsState(
  playerData: any,
  totalPlayerCount?: number
): { remaining: number; allowance: number; needsReset: boolean } {
  let lastResetMs = 0;
  if (playerData?.actionsLastResetAt) {
    if (typeof playerData.actionsLastResetAt.toMillis === 'function') {
      lastResetMs = playerData.actionsLastResetAt.toMillis();
    } else if (typeof playerData.actionsLastResetAt === 'number') {
      lastResetMs = playerData.actionsLastResetAt;
    } else if (typeof playerData.actionsLastResetAt === 'string') {
      lastResetMs = new Date(playerData.actionsLastResetAt).getTime() || 0;
    }
  }

  const hoursSinceReset = lastResetMs > 0 ? (Date.now() - lastResetMs) / (1000 * 60 * 60) : 999;
  const currentAllowance = Number(playerData?.actionsAllowanceToday) || MAX_PER_PLAYER;

  if (hoursSinceReset >= 24) {
    const totalPlayers = Math.max(1, Number(totalPlayerCount) || 1);
    const calculatedAllowance = Math.min(
      MAX_PER_PLAYER,
      Math.max(MIN_PER_PLAYER, Math.floor(RESERVED_DAILY_BUDGET / totalPlayers))
    );
    return { remaining: calculatedAllowance, allowance: calculatedAllowance, needsReset: true };
  }

  const remaining = typeof playerData?.actionsRemainingToday === 'number'
    ? playerData.actionsRemainingToday
    : currentAllowance;

  return { remaining, allowance: currentAllowance, needsReset: false };
}

export type TaskStatus = 'idle' | 'in_progress' | 'ready_to_collect';
export type TaskTier = 'quick' | 'standard' | 'extended';

export interface WorkerTask {
  id: string;
  status: 'idle' | 'in_progress';
  startTime: number | null; // epoch timestamp in ms
  duration: number; // in seconds (300 to 3600)
  taskType?: TaskType;
  result: { resourcesEarned: number; taskType?: TaskType } | null;
  createdAt?: number;
}

export function workerPoolSize(kingdomLevel: number, forgeLevel: number = 0): number {
  return 5 * (Number(kingdomLevel) || 1) + 2 * (Number(forgeLevel) || 0);
}

export interface TaskResult {
  kingdomContribution: number;
  goldEarned: number;
  completedAt?: number;
  unlockedWood?: boolean;
}

export interface TaskDoc {
  status: TaskStatus;
  startTime: number | null; // epoch timestamp in ms
  duration: number; // in seconds
  tier?: TaskTier;
  isSpecialTask?: boolean;
  specialTaskType?: string;
  result: TaskResult | null;
}

export interface EvaluationRecord {
  evaluatedAt: number;
  previousLevel: number;
  newLevel: number;
  contributionAchieved: number;
  thresholdRequired: number;
  success: boolean;
}

export interface CathedralData {
  level: number;
}
export type ChurchData = CathedralData;

export const CATHEDRAL_MAX_LEVEL = 3;
export const CHURCH_MAX_LEVEL = CATHEDRAL_MAX_LEVEL;

export function cathedralUpgradeCost(currentLevel: number): { food: number; wood: number } {
  const costs = [
    { food: 200, wood: 100 },  // level 0 -> 1
    { food: 500, wood: 300 },  // level 1 -> 2
    { food: 1000, wood: 700 }, // level 2 -> 3
  ];
  return costs[currentLevel] || { food: 999999, wood: 999999 };
}
export const churchUpgradeCost = cathedralUpgradeCost;

export function cathedralContributionMultiplier(level: number): number {
  return 1 + (Number(level) || 0) * 0.1;
}
export const churchContributionMultiplier = cathedralContributionMultiplier;

export function parseUnlockedTaskTypes(raw: any): string[] {
  const set = new Set<string>(['food']);
  if (Array.isArray(raw)) {
    raw.forEach((t) => {
      if (typeof t === 'string' && t.trim()) {
        set.add(t.trim());
      }
    });
  }
  return Array.from(set);
}

export interface KingdomDoc {
  level: number;
  cumulativeContribution: number;
  unlockedTaskTypes?: string[];
  cathedral?: CathedralData;
  church?: ChurchData;
  lastEvaluatedAt?: any;
  lastEvaluation?: EvaluationRecord | null;
  totalPlayerCount?: number;
  dailyActionsConsumed?: number;
  dailyActionsResetAt?: any;
}

export interface VerificationItem {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  proof: string;
  details?: string;
}
