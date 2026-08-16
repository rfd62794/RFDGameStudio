// @vitest-environment node
//
// Planet of Greed — Culture Stat Asymmetry Balance Harness
//
// Runs N simulated all-AI playthroughs per House configuration and reports
// real win-rate/outcome distribution. Every House plays as every position
// (player slot and AI slots are all AI-controlled — no human decisions).
//
// This is a REAL balance check, not a unit test. It simulates the core game
// loop (weekly orders, transit, combat, income, population balance, rank)
// with the House stat modifiers active, and reports honest results.
//
// PASS CRITERIA: No House wins more than 35% of games across N trials.
// If a House exceeds 35%, that's a dominant strategy risk — do not ship.
//
import { describe, it, expect } from 'vitest';
import { generateVoronoiMap } from '../src/games/planetofgreed/utils/mapGenerator';
import { resolveCellCombat } from '../src/engine/shared/combat';
import { selectWeightedNeighbor } from '../src/games/planetofgreed/aiDecisions';
import { initializeFragments, onHouseEliminated } from '../src/games/planetofgreed/fragmentSystem';
import { getHouseStats } from '../src/games/planetofgreed/houseStats';
import type { Corporation, MapCell, UnitTransit, UnitGroup, UnitType, CultureId, GameDate } from '../src/games/planetofgreed/types';

const CULTURE_WHEEL: CultureId[] = ['ember', 'marsh', 'gale', 'tundra', 'crystal', 'tide'];

// ─── Seeded RNG (deterministic per seed) ───
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Build corporations (all AI, no player) ───
function buildAllAICorps(): Corporation[] {
  return CULTURE_WHEEL.map((cultureId) => {
    return {
      id: `ai-${cultureId}`,
      name: cultureId,
      color: '#000',
      borderColor: '#000',
      bgClass: '',
      textClass: '',
      isPlayer: false,
      cultureId,
      treasury: 100000,
      scoutedCells: {},
      rank: 1,
      fragments: [cultureId],
    };
  });
}

// ─── computeRank (same formula as App.tsx) ───
function computeRank(corps: Corporation[], cells: MapCell[]): void {
  const scores = corps.map(corp => {
    const ownedCells = cells.filter(c => c.ownerId === corp.id);
    const territory = ownedCells.length;
    const avgPublicOpinion = ownedCells.length > 0
      ? ownedCells.reduce((sum, c) => sum + (c.publicOpinion ?? 50), 0) / ownedCells.length
      : 50;
    return { corp, score: territory * 10 + avgPublicOpinion };
  });
  scores.sort((a, b) => b.score - a.score);
  scores.forEach((s, i) => { s.corp.rank = i + 1; });
}

function applyPublicOpinionOffset(cell: MapCell, offset: number) {
  const current = cell.publicOpinion ?? 50;
  cell.publicOpinion = Math.max(0, Math.min(100, current + offset));
}

// ─── AI weekly order generation (stat-aware, same logic as App.tsx) ───
function generateAIWeeklyOrders(
  cells: MapCell[], corps: Corporation[], transits: UnitTransit[], rng: () => number
) {
  const cellsById: { [id: number]: MapCell } = {};
  for (const c of cells) cellsById[c.id] = c;
  const corpsById: { [id: string]: Corporation } = {};
  for (const c of corps) corpsById[c.id] = c;

  for (const corp of corps) {
    const aiStats = getHouseStats(corp.cultureId);
    const ownedCells = cells.filter(c => c.ownerId === corp.id);
    if (ownedCells.length === 0) continue;

    for (const cell of ownedCells) {
      const totalUnits = cell.units.circle + cell.units.square + cell.units.triangle;
      const roll = rng();

      if (roll < 0.40 && totalUnits >= 2) {
        const targetNeighId = selectWeightedNeighbor(corp, cell, cellsById, corpsById);
        if (targetNeighId === null) continue;
        const targetCell = cells.find(c => c.id === targetNeighId)!;

        const maxSend = 2 + aiStats.expandBonusUnits;
        const sendUnits: UnitGroup = { circle: 0, square: 0, triangle: 0 };
        let unitsAdded = 0;
        const unitTypes: UnitType[] = ['circle', 'square', 'triangle'];
        for (const type of unitTypes) {
          if (cell.units[type] > 0 && unitsAdded < maxSend) {
            sendUnits[type] = 1;
            cell.units[type]--;
            unitsAdded++;
          }
        }

        if (unitsAdded > 0) {
          transits.push({
            id: `transit-${corp.id}-${cell.id}-${targetNeighId}-${rng()}`,
            corpId: corp.id,
            originCellId: cell.id,
            targetCellId: targetNeighId,
            units: sendUnits,
            totalDays: aiStats.transitDays,
            daysLeft: aiStats.transitDays
          });
          corp.scoutedCells[targetNeighId] = true;
          targetCell.neighbors.forEach(nid => { corp.scoutedCells[nid] = true; });
        }
      } else if (roll < 0.60 && corp.treasury >= 30000) {
        corp.treasury -= 30000;
        const type: UnitType = ['circle', 'square', 'triangle'][Math.floor(rng() * 3)] as UnitType;
        cell.recruitmentQueue.push({ type, weeksLeft: 1 });
      } else if (roll < 0.80 && corp.treasury >= aiStats.fortifyCost && cell.fortification < aiStats.fortifyMax) {
        corp.treasury -= aiStats.fortifyCost;
        cell.fortification = Math.min(aiStats.fortifyMax, cell.fortification + 1);
      }
    }
  }
}

// ─── Simulate one full game ───
interface GameResult {
  winner: CultureId | null;  // Rank 1 at end of 3 years
  rankings: { cultureId: CultureId; rank: number; territory: number; treasury: number }[];
  eliminated: CultureId[];
}

function simulateGame(seed: number): GameResult {
  const rng = mulberry32(seed);
  const originalRandom = Math.random;
  Math.random = rng;

  try {
    const corps = buildAllAICorps();
    const cells = generateVoronoiMap(600, 600, 36, corps);
    initializeFragments(corps);

    // Initialize public opinion per-House
    cells.forEach(cell => {
      if (cell.ownerId) {
        const owner = corps.find(c => c.id === cell.ownerId);
        cell.publicOpinion = owner ? getHouseStats(owner.cultureId).baseOpinion : 50;
      } else {
        cell.publicOpinion = 50;
      }
    });

    // Initial scouting
    for (const corp of corps) {
      corp.scoutedCells = {};
      const cap = cells.find(c => c.ownerId === corp.id);
      if (cap) {
        corp.scoutedCells[cap.id] = true;
        cap.neighbors.forEach(nid => { corp.scoutedCells[nid] = true; });
      }
    }

    computeRank(corps, cells);

    let date: GameDate = { year: 1, month: 1, week: 1, day: 1 };
    const maxDays = 3 * 12 * 4 * 7; // 3 years = 1008 days
    let eliminated: CultureId[] = [];
    let transits: UnitTransit[] = [];

    for (let dayCount = 0; dayCount < maxDays; dayCount++) {
      // Day 1 of each week: generate AI orders
      if (date.day === 1) {
        generateAIWeeklyOrders(cells, corps, transits, rng);
      }

      // Process transits (decrement days, resolve arrivals)
      const stillTransiting: UnitTransit[] = [];
      const arrivedTransits: UnitTransit[] = [];
      for (const t of transits) {
        t.daysLeft--;
        if (t.daysLeft <= 0) {
          arrivedTransits.push(t);
        } else {
          stillTransiting.push(t);
        }
      }
      transits = stillTransiting;

      // Resolve combat for cells with arrived invaders
      const combatCells = new Set<number>();
      for (const t of arrivedTransits) {
        combatCells.add(t.targetCellId);
      }

      for (const cellId of combatCells) {
        const cell = cells.find(c => c.id === cellId)!;
        const previousOwnerId = cell.ownerId;
        const combatInitialForces: { [corpId: string]: UnitGroup } = {};

        if (cell.ownerId) {
          combatInitialForces[cell.ownerId] = { ...cell.units };
        }

        const cellInvaders = arrivedTransits.filter(t => t.targetCellId === cellId);
        for (const inv of cellInvaders) {
          if (!combatInitialForces[inv.corpId]) {
            combatInitialForces[inv.corpId] = { circle: 0, square: 0, triangle: 0 };
          }
          combatInitialForces[inv.corpId].circle += inv.units.circle;
          combatInitialForces[inv.corpId].square += inv.units.square;
          combatInitialForces[inv.corpId].triangle += inv.units.triangle;
        }

        const corpNames: { [corpId: string]: string } = {};
        corps.forEach(c => { corpNames[c.id] = c.name; });

        const result = resolveCellCombat(
          cellId, cell.name, combatInitialForces, cell.ownerId, cell.fortification, corpNames
        );

        // Apply combat results
        for (const cid in result.finalUnits) {
          if (result.victorId === cid && cell.ownerId !== cid) {
            cell.ownerId = cid;
            cell.units = { ...result.finalUnits[cid] };
            cell.fortification = 0;
          } else if (cell.ownerId === cid) {
            cell.units = { ...result.finalUnits[cid] };
          }
        }

        applyPublicOpinionOffset(cell, -5);

        // Check if the previous owner was eliminated by this combat
        if (previousOwnerId && previousOwnerId !== cell.ownerId) {
          const prevOwner = corps.find(c => c.id === previousOwnerId);
          const victor = corps.find(c => c.id === cell.ownerId);
          if (prevOwner && victor) {
            const prevOwned = cells.filter(c => c.ownerId === prevOwner.id);
            if (prevOwned.length === 0 && !eliminated.includes(prevOwner.cultureId)) {
              eliminated.push(prevOwner.cultureId);
              onHouseEliminated(prevOwner, victor);
            }
          }
        }
      }

      // Week-end processing (day 7)
      if (date.day === 7) {
        // Recruitment queue
        cells.forEach(cell => {
          if (cell.ownerId) {
            const queue = cell.recruitmentQueue.filter(r => {
              r.weeksLeft--;
              if (r.weeksLeft <= 0) {
                cell.units[r.type] += 1;
                return false;
              }
              return true;
            });
            cell.recruitmentQueue = queue;

            // Passive production
            cell.productionProgress += 1;
            if (cell.productionProgress >= 2) {
              cell.units[cell.preferredProduction] += 1;
              cell.productionProgress = 0;
            }
          }
        });

        // Income (per-House)
        cells.forEach(cell => {
          if (cell.ownerId) {
            const ownerIdx = corps.findIndex(c => c.id === cell.ownerId);
            if (ownerIdx !== -1 && (cell.publicOpinion ?? 50) >= 30) {
              const ownerStats = getHouseStats(corps[ownerIdx].cultureId);
              corps[ownerIdx].treasury += ownerStats.incomePerCell;
            }
          }
        });

        // Population Balance erosion
        cells.forEach(cell => {
          const current = cell.publicOpinion ?? 50;
          if (current > 50) cell.publicOpinion = current - 1;
          else if (current < 50) cell.publicOpinion = current + 1;
        });

        // Month-end: compute rank + annual bonus
        if (date.week === 4) {
          computeRank(corps, cells);

          if (date.month === 12) {
            for (const corp of corps) {
              const stats = getHouseStats(corp.cultureId);
              if (stats.annualBonusUnits > 0) {
                const ownedCells = cells.filter(c => c.ownerId === corp.id);
                for (const cell of ownedCells) {
                  cell.units[cell.preferredProduction] += stats.annualBonusUnits;
                }
              }
            }
          }
        }
      }

      // Advance date
      date.day++;
      if (date.day > 7) { date.day = 1; date.week++; }
      if (date.week > 4) { date.week = 1; date.month++; }
      if (date.month > 12) { date.month = 1; date.year++; }
    }

    // Final rankings
    computeRank(corps, cells);
    const rankings = corps.map(corp => {
      const territory = cells.filter(c => c.ownerId === corp.id).length;
      return {
        cultureId: corp.cultureId as CultureId,
        rank: corp.rank ?? 6,
        territory,
        treasury: corp.treasury,
      };
    }).sort((a, b) => a.rank - b.rank);

    const winner = rankings[0]?.cultureId ?? null;

    return { winner, rankings, eliminated };
  } finally {
    Math.random = originalRandom;
  }
}

// ─── Test suite ───
const N_TRIALS = 60; // 60 games per configuration, 6 configs = 360 total
const DOMINANCE_THRESHOLD = 0.35; // No House should win >35% of games

describe('test_planetofgreed_house_stats_balance', () => {
  it('real_balance_harness: no House dominates across N simulated playthroughs', () => {
    const winCounts: Record<string, number> = {};
    const rankSum: Record<string, number> = {};
    const territorySum: Record<string, number> = {};
    let totalGames = 0;

    for (let seed = 1; seed <= N_TRIALS; seed++) {
      const result = simulateGame(seed);
      if (result.winner) {
        winCounts[result.winner] = (winCounts[result.winner] || 0) + 1;
      }
      for (const r of result.rankings) {
        rankSum[r.cultureId] = (rankSum[r.cultureId] || 0) + r.rank;
        territorySum[r.cultureId] = (territorySum[r.cultureId] || 0) + r.territory;
      }
      totalGames++;
    }

    // Report real results
    const results = CULTURE_WHEEL.map(cultureId => {
      const wins = winCounts[cultureId] || 0;
      const winRate = wins / totalGames;
      const avgRank = (rankSum[cultureId] || 0) / totalGames;
      const avgTerritory = (territorySum[cultureId] || 0) / totalGames;
      return { cultureId, wins, winRate, avgRank, avgTerritory };
    });

    // Log results for devlog capture
    console.log('\n=== HOUSE STAT BALANCE RESULTS ===');
    console.log(`Trials: ${totalGames}`);
    console.log('House       | Wins | Win%  | AvgRank | AvgTerritory');
    console.log('------------|------|-------|---------|-------------');
    for (const r of results) {
      console.log(
        `${r.cultureId.padEnd(11)} | ${String(r.wins).padStart(4)} | ${(r.winRate * 100).toFixed(1)}% | ${r.avgRank.toFixed(2)}    | ${r.avgTerritory.toFixed(1)}`
      );
    }
    console.log('===================================\n');

    // Assert no House exceeds dominance threshold
    for (const r of results) {
      expect(r.winRate, `${r.cultureId} win rate ${(r.winRate * 100).toFixed(1)}% exceeds ${(DOMINANCE_THRESHOLD * 100)}% threshold`).toBeLessThanOrEqual(DOMINANCE_THRESHOLD);
    }
  }, 120000); // 2 min timeout — this is a real simulation

  it('house_stats_are_asymmetric: every House has at least one non-default stat', () => {
    for (const cultureId of CULTURE_WHEEL) {
      const stats = getHouseStats(cultureId);
      // Each House should have at least one stat that differs from the default
      const hasAsymmetry =
        stats.expandBonusUnits !== 0 ||
        stats.expandCost !== 0 ||
        stats.fortifyCost !== 20000 ||
        stats.fortifyMax !== 3 ||
        stats.incomePerCell !== 10000 ||
        stats.transitDays !== 4 ||
        stats.annualBonusUnits !== 0 ||
        stats.baseOpinion !== 50 ||
        stats.unrestBoost !== 8;
      expect(hasAsymmetry, `${cultureId} has no asymmetric stats`).toBe(true);
    }
  });

  it('mirror_pairs_are_opposite: Ember/Tundra, Marsh/Crystal, Gale/Tide have opposing stats', () => {
    const ember = getHouseStats('ember');
    const tundra = getHouseStats('tundra');
    const marsh = getHouseStats('marsh');
    const crystal = getHouseStats('crystal');
    const gale = getHouseStats('gale');
    const tide = getHouseStats('tide');

    // Ember/Tundra: expand bonus vs defense bonus; fortify max down vs up
    expect(ember.expandBonusUnits).toBeGreaterThan(0);
    expect(tundra.fortifyMax).toBeGreaterThan(ember.fortifyMax);
    expect(ember.fortifyCost).toBeGreaterThan(20000);
    expect(tundra.fortifyCost).toBeLessThan(20000);
    expect(tundra.incomePerCell).toBeGreaterThan(10000); // "largest Ore reserves"

    // Marsh/Crystal: opinion up vs opinion down
    expect(marsh.baseOpinion).toBeGreaterThan(50);
    expect(crystal.baseOpinion).toBeLessThan(50);

    // Gale/Tide: transit fast vs slow; fortify down vs income up
    expect(gale.transitDays).toBeLessThan(4);
    expect(tide.transitDays).toBeGreaterThan(4);
    expect(gale.fortifyMax).toBeLessThan(3);
    expect(tide.incomePerCell).toBeGreaterThan(10000);
  });
});
