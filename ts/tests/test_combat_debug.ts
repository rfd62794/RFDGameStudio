import { describe, it, expect } from 'vitest';
import { CombatSystem } from '../src/engine/shared/sportsSim';
import { mapToPlayerStats } from '../src/games/mutant_battle_ball/statsMapper';
import type { Player, Ball, CombatRules } from '../src/engine/shared/sportsSim';

describe('debug combat', () => {
  it('CombatSystem blunder rate', () => {
    const stats = mapToPlayerStats({ speed: 50, power: 50, accuracy: 50, endurance: 50, maxHealth: 100 }, 50);
    const makePlayer = (id: string, team: string): Player => ({
      id, name: id, number: 1, team: team as any, pos: {x:50,y:30}, velocity: {x:0,y:0}, targetPos: null,
      role: 'chaser', stats, stamina: 100, injuryState: 'none', stunTicksRemaining: 0,
      markProtectionTicks: 0, distanceCarriedWithoutTouch: 0, tackledTicks: 0, tackledByPlayerId: null,
      markedOpponentId: null, statsMatch: { kicks:0, handballs:0, marks:0, tackles:0, hitsInflicted:0, injuriesInflicted:0, casualtiesCaused:0, turnoversConceded:0, goals:0, distanceRun:0 },
    });
    const ball: Ball = { pos: {x:50,y:30}, velocity: {x:0,y:0}, height: 1, zVelocity: 0, state: 'held', carrierId: 't1', lastCarrierId: 't1', lastPossessionTeam: 'teamB', hangTimeRemaining: 0, totalHangTime: 0, bounceCount: 0, looseTicks: 0 };
    const combatConfig: CombatRules = {
      violenceAllowed: true, canTargetNonCarriers: true, armorMitigatesSeverity: true,
      failedAttackPenalty: { causesTurnover: true, attackerStunChance: 1.0, attackerInjuryRoll: false },
      severityTable: { stunnedChance: 0.45, downChance: 0.30, casualtyChance: 0.18, fatalChance: 0.07 },
      foulDownedPlayers: false,
    };
    let hits = 0, armors = 0, blunders = 0;
    const severities: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const attacker = makePlayer('a1', 'teamA');
      const target = makePlayer('t1', 'teamB');
      ball.state = 'held'; ball.carrierId = 't1';
      const result = CombatSystem.executeAttack(attacker, target, ball, combatConfig, i);
      if (result.outcome === 'hit_success') { hits++; severities[result.severity] = (severities[result.severity]||0)+1; }
      else if (result.outcome === 'armor_held') armors++;
      else if (result.outcome === 'attacker_blunder') blunders++;
    }
    console.log('hits:', hits, 'armors:', armors, 'blunders:', blunders);
    console.log('severities:', JSON.stringify(severities));
    expect(blunders).toBeGreaterThan(0);
  });
});
