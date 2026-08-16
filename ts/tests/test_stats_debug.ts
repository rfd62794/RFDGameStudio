import { describe, it } from 'vitest';
import { calculateStats } from '../src/games/mutant_battle_ball/simulation/mbbSimulation';
import { mapToPlayerStats, averageCyberOrganicLean } from '../src/games/mutant_battle_ball/statsMapper';
import type { Mutant, MutantParts } from '../src/games/mutant_battle_ball/types';
import type { Part } from '../src/engine/shared/partSlots';

function makePart(id: string, slot: Part['slot'], stats: Partial<Part> = {}): Part {
  return {
    id, name: id, slot,
    accuracy: stats.accuracy ?? 50, endurance: stats.endurance ?? 50,
    power: stats.power ?? 50, speed: stats.speed ?? 50, price: stats.price ?? 100,
    brand: stats.brand ?? 'trueflame', qualityTier: stats.qualityTier ?? 'brand_new',
    cyberOrganicLean: stats.cyberOrganicLean ?? 50,
  };
}

describe('debug stats', () => {
  it('Check calculated stats for combat test mutants', () => {
    const parts: MutantParts = {
      head: makePart('h', 'head', { power: 50, endurance: 50 }),
      chest: makePart('c', 'chest', { power: 50, endurance: 50 }),
      left_arm: makePart('la', 'left_arm', { power: 50, endurance: 50 }),
      right_arm: makePart('ra', 'right_arm', { power: 50, endurance: 50 }),
      left_leg: makePart('ll', 'left_leg', { power: 50, endurance: 50 }),
      right_leg: makePart('rl', 'right_leg', { power: 50, endurance: 50 }),
    };
    const stats = calculateStats({ parts });
    console.log('MBB stats:', JSON.stringify(stats));
    const lean = averageCyberOrganicLean(parts as unknown as Record<string, { cyberOrganicLean?: number } | null>);
    const playerStats = mapToPlayerStats(stats, lean);
    console.log('PlayerStats:', JSON.stringify(playerStats));
    // Check combat-relevant stats
    console.log('strength (power):', playerStats.strength);
    console.log('toughness (endurance):', playerStats.toughness);
    console.log('cyberArmor:', playerStats.cyberArmor);
    console.log('aggression:', playerStats.aggression);
    // Calculate expected combat outcome
    const attackPower = playerStats.strength * 0.7 + playerStats.aggression * 0.3;
    const targetDefense = playerStats.toughness * 0.4 + playerStats.cyberArmor * 0.4 + 100 * 0.2;
    console.log('base attackPower (no random):', attackPower);
    console.log('base targetDefense (no random, full stamina):', targetDefense);
    console.log('netAdvantage (no random):', attackPower - targetDefense);
  });
});
