import { auth } from '../lib/firebase';
import { TaskTier, LegacyItem } from '../types';

export const TASK_TIERS = {
  quick: { seconds: 90, kingdomContribution: 5, baseGold: 10 },
  standard: { seconds: 240, kingdomContribution: 15, baseGold: 30 },
  extended: { seconds: 480, kingdomContribution: 35, baseGold: 75 },
} as const;

export type TaskTierKey = keyof typeof TASK_TIERS;

export function multiplierForLevel(level: number): number {
  return 1 + level * 0.1; // +10% per level
}

export function costForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.15, level));
}

async function getAuthHeaders() {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to perform this action.');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function parseJsonResponse(response: Response, defaultError: string) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${text.slice(0, 120) || defaultError}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(defaultError);
    }
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || defaultError);
    (error as any).data = data;
    throw error;
  }
  return data;
}

export async function assignTaskApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default',
  tier: TaskTier = 'quick',
  force = false,
  isSpecialTask = false,
  specialTaskType = 'establish_wood'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/assignTask', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId, tier, force, isSpecialTask, specialTaskType }),
  });

  const data = await parseJsonResponse(response, 'Failed to assign task');
  if (data.startTime) {
    data.serverOffsetSec = Math.round((data.startTime - Date.now()) / 1000);
  }
  return data;
}

export async function collectTaskApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default',
  options?: { forceLegacyDrop?: boolean }
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/collectTask', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId, forceLegacyDrop: options?.forceLegacyDrop }),
  });

  return await parseJsonResponse(response, 'Failed to collect task');
}

export async function purchaseMultiplierApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/purchaseMultiplier', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to purchase multiplier');
}

export async function resetTaskApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/resetTask', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to reset task');
}

// Admin / Game Master API calls
export async function adminResetTaskApi(
  targetUserId?: string,
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/resetTask', {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetUserId, kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Admin failed to reset task');
}

export async function adminCompleteTaskApi(
  targetUserId?: string,
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/completeTask', {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetUserId, kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Admin failed to complete task');
}

export async function adminCompleteWorkerApi(
  workerId?: string,
  targetUserId?: string,
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/completeWorker', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workerId, targetUserId, kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Admin failed to complete worker timer');
}

export async function adminSetPlayerStateApi(payload: {
  targetUserId?: string;
  gold?: number;
  addGold?: number;
  rewardMultiplierLevel?: number;
  resources?: { food: number; wood: number; stone?: number };
  churchLevel?: number;
  cathedralLevel?: number;
  chapelLevel?: number;
  forgeLevel?: number;
  unlockedTaskTypes?: string[];
  reputationScore?: number;
  reputationLevel?: number;
  specialization?: 'none' | 'provisioners' | 'builders' | 'diplomats';
  legacyItems?: LegacyItem[];
  generation?: number;
  descendantName?: string;
  descendantTitle?: string;
  dynastyLineage?: any[];
  expeditionsCompletedThisGen?: number;
  inauguralExpeditionBonus?: boolean;
  actionsRemainingToday?: number;
  actionsAllowanceToday?: number;
  actionsLastResetAt?: any;
  resetWorkers?: boolean;
  kingdomId?: string;
  houseId?: string;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/setPlayerState', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  return await parseJsonResponse(response, 'Admin failed to set player state');
}

export async function adminGetPlayersApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/admin/players?kingdomId=${encodeURIComponent(kingdomId)}&houseId=${encodeURIComponent(houseId)}`, {
    method: 'GET',
    headers,
  });

  return await parseJsonResponse(response, 'Admin failed to fetch players');
}

export async function getKingdomApi(kingdomId = 'kingdom-mvp-0') {
  const response = await fetch(`/api/kingdom?kingdomId=${encodeURIComponent(kingdomId)}`);
  return await parseJsonResponse(response, 'Failed to fetch Kingdom state');
}

export async function adminEvaluateKingdomApi(kingdomId = 'kingdom-mvp-0') {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/evaluateKingdom', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId }),
  });

  return await parseJsonResponse(response, 'Admin failed to evaluate Kingdom');
}

export async function getWorkersApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/workers?kingdomId=${encodeURIComponent(kingdomId)}&houseId=${encodeURIComponent(houseId)}`, {
    method: 'GET',
    headers,
  });

  return await parseJsonResponse(response, 'Failed to fetch workers');
}

export async function assignWorkerApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default',
  duration = 300,
  taskType: 'food' | 'wood' | 'stone' = 'food'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/assignWorker', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId, duration, taskType }),
  });

  return await parseJsonResponse(response, 'Failed to assign worker');
}

export async function collectWorkerApi(
  workerId: string,
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/collectWorker', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workerId, kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to collect worker task');
}

export async function upgradeCathedralApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/upgradeCathedral', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to upgrade Cathedral');
}

export const upgradeChurchApi = upgradeCathedralApi;

export async function upgradeChapelApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/upgradeChapel', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to upgrade Chapel');
}

export async function upgradeForgeApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/upgradeForge', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to upgrade Forge');
}

export async function getHouseApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const response = await fetch(`/api/house?kingdomId=${encodeURIComponent(kingdomId)}&houseId=${encodeURIComponent(houseId)}`);
  return await parseJsonResponse(response, 'Failed to fetch House status');
}

export async function contributeFestivalApi(
  food: number,
  wood: number,
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/contributeFestival', {
    method: 'POST',
    headers,
    body: JSON.stringify({ food, wood, kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to contribute to Fertility Festival');
}

export async function adminEvaluateHouseFestivalApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/evaluateHouseFestival', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Admin failed to evaluate House Festival');
}

export async function adminGetQuotaUsageApi() {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/quotaUsage', {
    method: 'GET',
    headers,
  });

  return await parseJsonResponse(response, 'Failed to fetch Cloud Monitoring quota usage');
}

export async function selectHouseSpecializationApi(
  specialization: 'provisioners' | 'builders' | 'diplomats',
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/selectHouseSpecialization', {
    method: 'POST',
    headers,
    body: JSON.stringify({ specialization, kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to select House Specialization');
}

export async function retireDescendantApi(
  kingdomId = 'kingdom-mvp-0',
  houseId = 'house-of-kings-default'
) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/retireDescendant', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kingdomId, houseId }),
  });

  return await parseJsonResponse(response, 'Failed to execute royal succession');
}

