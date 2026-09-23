import { RunNode } from '../types';
import { ENEMY_POOL } from './enemies';

export type Rung = 'early' | 'mid' | 'final';

export const RUNG_ELIGIBILITY: Record<Rung, {
  enemyTiers: ('basic' | 'advanced' | 'elite' | 'master')[];
  roomTypes: ('fight' | 'restCraft' | 'treasure' | 'store' | 'anomaly' | 'boss')[];
}> = {
  early: { enemyTiers: ['basic'], roomTypes: ['fight', 'restCraft'] },
  mid:   { enemyTiers: ['basic', 'advanced', 'elite'], roomTypes: ['fight', 'restCraft', 'treasure', 'store', 'anomaly'] },
  final: { enemyTiers: ['master'], roomTypes: ['boss'] },
};

function lcg(seed: number) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getValidLaneMoves(lane: number): number[] {
  // Forward = same lane, Up-Forward = lane-1, Down-Forward = lane+1, clamped
  const moves = [lane];
  if (lane - 1 >= 0) moves.push(lane - 1);
  if (lane + 1 <= 2) moves.push(lane + 1);
  return moves;
}

export function generateBranchingMap(seed: number, numLayersParam: number = 5, currentFloor: number = 1): RunNode[] {
  const nextRand = lcg(seed);

  const getEnemyForTier = (tier: 'basic' | 'advanced' | 'elite' | 'master') => {
    const pool = ENEMY_POOL.filter(e => e.tier === tier);
    if (pool.length === 0) return { name: "Corrupted Ashling", hp: 14 };
    return pool[Math.floor(nextRand() * pool.length)];
  };

  const numLayers = Math.max(3, numLayersParam);
  const layers: RunNode[][] = [];

  for (let l = 0; l < numLayers; l++) {
    layers[l] = [];
  }

  // Layer 0: Starting Node (single node, lane 1)
  const startEnemy = getEnemyForTier('basic');
  const startNode: RunNode = {
    id: "node_0_0",
    rung: "early",
    type: "fight",
    enemyTier: "basic",
    enemyName: startEnemy.name,
    enemyHp: startEnemy.hp,
    connectsTo: [],
    lane: 1,
    x: 10,
    y: 50
  };
  layers[0].push(startNode);

  // Intermediate layers (1 to numLayers - 2): exactly 3 nodes each (lanes 0, 1, 2)
  for (let l = 1; l < numLayers - 1; l++) {
    const isEarly = l < Math.ceil((numLayers - 1) * 0.4);
    const rung: 'early' | 'mid' = isEarly ? 'early' : 'mid';
    const elig = RUNG_ELIGIBILITY[rung];

    layers[l] = [0, 1, 2].map(lane => {
      let roomType: 'fight' | 'restCraft' | 'treasure' | 'store' | 'anomaly' | 'boss';

      // §2 GUARANTEED PRE-BOSS REST AND — ALL THREE LANES
      if (l === numLayers - 2) {
        roomType = 'restCraft';
      } else {
        const roomIdx = Math.floor(nextRand() * elig.roomTypes.length);
        roomType = elig.roomTypes[roomIdx];
      }

      const node: RunNode = {
        id: `node_${l}_${lane}`,
        lane,
        rung,
        type: roomType,
        connectsTo: [],
        x: 10 + (l / (numLayers - 1)) * 80,
        y: 20 + lane * 30, // fixed vertical lane positions (20, 50, 80)
      };

      if (roomType === 'fight') {
        const tierIdx = Math.floor(nextRand() * elig.enemyTiers.length);
        const enemyTier = elig.enemyTiers[tierIdx];
        node.enemyTier = enemyTier;

        const enemy = getEnemyForTier(enemyTier);
        node.enemyName = enemy.name;
        node.enemyHp = enemy.hp;
      }

      return node;
    });
  }

  // Final Layer (Boss)
  // §3 Floor 1 Boss — Advanced Tier (Molten Ashling), Not Master
  const isFloor1 = currentFloor === 1;
  const bossTier = isFloor1 ? 'advanced' : 'master';
  const bossEnemy = isFloor1
    ? (ENEMY_POOL.find(e => e.id === 'molten_ashling') || { name: 'Molten Ashling', hp: 20 })
    : getEnemyForTier('master');

  const bossNode: RunNode = {
    id: "boss",
    rung: "final",
    type: "boss",
    enemyTier: bossTier,
    enemyName: bossEnemy.name,
    enemyHp: bossEnemy.hp,
    connectsTo: [],
    lane: 1,
    x: 90,
    y: 50
  };
  layers[numLayers - 1].push(bossNode);

  // Build connections forward
  for (let l = 0; l < numLayers - 1; l++) {
    const currLayer = layers[l];
    const nextLayer = layers[l + 1];

    currLayer.forEach(node => {
      if (nextLayer.length === 1) {
        node.connectsTo = [nextLayer[0].id]; // funneling into boss or layer 1
      } else {
        const validLanes = getValidLaneMoves(node.lane ?? 1);
        node.connectsTo = validLanes
          .map(lane => nextLayer.find(n => n.lane === lane)?.id)
          .filter(Boolean) as string[];
      }
    });
  }

  const flatNodes: RunNode[] = [];
  layers.forEach(layer => {
    flatNodes.push(...layer);
  });

  return flatNodes;
}

const ENEMY_HP: Record<string, number[]> = {
  basic: [14, 10, 8, 12],
  advanced: [20, 24, 16, 18],
  elite: [30, 40, 28, 32],
  master: [50, 60]
};

const DMG_PER_TURN: Record<string, number> = {
  basic: 2.5,
  advanced: 3.5,
  elite: 4,
  master: 3.5
};

const avgHp = (t: string) => {
  const arr = ENEMY_HP[t] || ENEMY_HP['basic'];
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

const TTK = (t: string) => avgHp(t) / 7.5; // matches the validated formula exactly

export function evaluateMapBalance(nodes: RunNode[], currentMaxHp: number): {
  netDamage: number;
  inBand: boolean;
  band: [number, number];
} {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const startNode = nodes.find(n => n.id === 'node_0_0') || nodes[0];

  function bestReachableNet(node: RunNode, dmgSoFar: number, healSoFar: number, visited: Set<string>): number {
    if (!node.connectsTo || node.connectsTo.length === 0 || node.type === 'boss') {
      const finalDmg = node.type === 'boss'
        ? dmgSoFar + DMG_PER_TURN['master'] * TTK('master')
        : dmgSoFar;
      return finalDmg - healSoFar;
    }
    let best = Infinity;
    for (const nextId of node.connectsTo) {
      const next = nodeMap.get(nextId);
      if (!next || visited.has(next.id)) continue;
      let d = dmgSoFar, h = healSoFar;
      if (next.type === 'fight') {
        const tier = next.enemyTier || 'basic';
        d += DMG_PER_TURN[tier] * TTK(tier);
      } else if (next.type === 'restCraft') {
        h += Math.round(currentMaxHp * 0.4);
      }
      const result = bestReachableNet(next, d, h, new Set([...visited, next.id]));
      best = Math.min(best, result);
    }
    return best === Infinity ? (dmgSoFar - healSoFar) : best;
  }

  const netDamage = Math.round(bestReachableNet(startNode, 0, 0, new Set(['node_0_0'])) * 10) / 10;
  const band: [number, number] = [
    Math.round(0.25 * currentMaxHp * 10) / 10,
    Math.round(0.85 * currentMaxHp * 10) / 10
  ];
  const inBand = netDamage >= band[0] && netDamage <= band[1];

  return { netDamage, inBand, band };
}

export const MAX_MAP_ATTEMPTS = 20;

export function generateBalancedMap(
  baseSeed: number,
  numLayers: number,
  currentMaxHp: number,
  currentFloor: number = 1
): {
  nodes: RunNode[];
  balance: {
    netDamage: number;
    inBand: boolean;
    band: [number, number];
    attempts: number;
  };
} {
  let attempt = 0;
  let bestMap: RunNode[] | null = null;
  let bestDelta = Infinity;
  let bestEval: { netDamage: number; inBand: boolean; band: [number, number] } | null = null;

  while (attempt < MAX_MAP_ATTEMPTS) {
    const seed = baseSeed + attempt; // deterministic increment, not random
    const nodes = generateBranchingMap(seed, numLayers, currentFloor);
    const evalRes = evaluateMapBalance(nodes, currentMaxHp);

    if (evalRes.inBand) {
      return {
        nodes,
        balance: {
          ...evalRes,
          attempts: attempt + 1
        }
      };
    }

    const midpoint = (evalRes.band[0] + evalRes.band[1]) / 2;
    const delta = Math.abs(evalRes.netDamage - midpoint);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestMap = nodes;
      bestEval = evalRes;
    }
    attempt++;
  }

  // Hard safety ceiling check: if best match exceeds currentMaxHp entirely, extend search in emergency mode up to 40 attempts
  if (bestEval && bestEval.netDamage > currentMaxHp && attempt < 40) {
    console.warn(`[BalanceChecker] CRITICAL: even closest match exceeds Max HP (${bestEval.netDamage} > ${currentMaxHp}). Extending search.`);
    while (attempt < 40) {
      const seed = baseSeed + attempt;
      const nodes = generateBranchingMap(seed, numLayers, currentFloor);
      const evalRes = evaluateMapBalance(nodes, currentMaxHp);

      if (evalRes.inBand) {
        return {
          nodes,
          balance: {
            ...evalRes,
            attempts: attempt + 1
          }
        };
      }

      const midpoint = (evalRes.band[0] + evalRes.band[1]) / 2;
      const delta = Math.abs(evalRes.netDamage - midpoint);
      if (evalRes.netDamage <= currentMaxHp && delta < bestDelta) {
        bestDelta = delta;
        bestMap = nodes;
        bestEval = evalRes;
      }
      attempt++;
    }
    if (bestEval && bestEval.netDamage > currentMaxHp) {
      console.error(`[BalanceChecker] EXTREME CRITICAL: Even after 40 attempts, closest map netDamage (${bestEval.netDamage}) exceeds Max HP (${currentMaxHp}).`);
    }
  }

  console.warn(`[BalanceChecker] No map within band after ${attempt} attempts, seed base ${baseSeed}. Using closest match, delta ${bestDelta}.`);

  return {
    nodes: bestMap || generateBranchingMap(baseSeed, numLayers, currentFloor),
    balance: {
      netDamage: bestEval?.netDamage ?? 0,
      inBand: false,
      band: bestEval?.band ?? [0.25 * currentMaxHp, 0.85 * currentMaxHp],
      attempts: attempt
    }
  };
}
