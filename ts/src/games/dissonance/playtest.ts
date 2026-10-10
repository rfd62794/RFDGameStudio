// new: ts/src/games/dissonance/playtest.ts
import { loadGame, call } from '../../engine/runtime';
import type { GameSession } from '../../engine/types';
import type { ExtraCheck, PlaytestAdapter } from '../../engine/playtest';
import type { CombatTurnResult, DeckCard, RewardSlot, RunState } from './types';

export type DissonanceAction = { kind: 'play'; card: DeckCard } | { kind: 'advance' };

function lua<T>(session: GameSession, fn: string, ...args: unknown[]): T | null {
  return ((call(session, fn, ...args) as unknown[])[0] ?? null) as T | null;
}

/** One step of the bot: returns the next run state, or null if a Lua call failed. */
function step(
  session: GameSession,
  data: Record<string, unknown>,
  run: RunState,
  card: DeckCard,
): RunState | null {
  switch (run.status) {
    case 'not_started': {
      if (!run.visitedNodeIds.includes(run.currentNodeId)) {
        return lua<RunState>(session, 'enter_active_node', run, run.deckCardIds, data);
      }
      const node = run.nodes.find((n) => n.id === run.currentNodeId);
      const target = node?.connectsTo?.[0];
      if (!target) return null;
      const moved = lua<RunState>(session, 'select_branch', run, target);
      return moved && lua<RunState>(session, 'enter_active_node', moved, moved.deckCardIds, data);
    }
    case 'combat': {
      const result = lua<CombatTurnResult>(session, 'resolve_combat_turn', run, card, data);
      if (!result) return null;
      const next = result.nextState;
      if (result.fightWon !== true) return next;
      const slots = lua<RewardSlot[]>(
        session,
        'generate_fixed_reward',
        next.playerMaxHp,
        next.deckCardIds,
        next.boons.map((b) => b.id),
        next.relics,
        next.enemy?.tier ?? 'basic',
        data,
        next.nextRewardBias ?? null,
      );
      if (!slots) return null;
      let cur = next;
      for (const slot of slots) cur = lua<RunState>(session, 'apply_reward_slot', cur, slot, data) ?? cur;
      return lua<RunState>(session, 'advance_node', cur);
    }
    case 'rest_craft': {
      const rested = lua<RunState>(session, 'apply_rest', run) ?? run;
      return lua<RunState>(session, 'advance_node', rested);
    }
    case 'treasure': {
      const taken = lua<RunState>(session, 'resolve_treasure', run, 'essence', data) ?? run;
      return lua<RunState>(session, 'advance_node', taken);
    }
    case 'store': {
      const left = lua<RunState>(session, 'resolve_store', run, null, data) ?? run;
      return lua<RunState>(session, 'advance_node', left);
    }
    case 'anomaly': {
      const done = lua<RunState>(session, 'resolve_anomaly', run, data) ?? run;
      return lua<RunState>(session, 'advance_node', done);
    }
    default:
      return null;
  }
}

export function createDissonanceAdapter(): PlaytestAdapter<RunState, DissonanceAction> {
  let session: GameSession;
  let data: Record<string, unknown>;
  let run: RunState;
  return {
    gameId: 'dissonance',
    init(seed: number): void {
      session = loadGame('dissonance', seed);
      data = session.files.data as Record<string, unknown>;
      const deckSize = ((data.run as { deck_size?: number } | undefined)?.deck_size) ?? 8;
      const pool = lua<DeckCard[]>(session, 'build_card_pool', data) ?? [];
      const deckIds = pool.slice(0, deckSize).map((c) => c.id);
      const created = lua<RunState>(session, 'create_run', deckIds, seed, 1, 0, data);
      if (created === null) throw new Error('create_run failed');
      run = created;
    },
    observe(): RunState {
      return run;
    },
    isTerminal(): boolean {
      return run.status === 'victory' || run.status === 'game_over';
    },
    outcome(): string {
      return run.status;
    },
    legalActions(): DissonanceAction[] {
      if (run.status === 'victory' || run.status === 'game_over') return [];
      if (run.status === 'combat') {
        return run.deckState.hand.map((card) => ({ kind: 'play', card }));
      }
      return [{ kind: 'advance' }];
    },
    act(a: DissonanceAction): void {
      const next = step(session, data, run, a.kind === 'play' ? a.card : (undefined as never));
      if (next === null) throw new Error('a Lua call failed at status ' + run.status);
      run = next;
    },
    metrics(): Record<string, number> {
      const m: Record<string, number> = {
        playerHp: run.playerHp,
        playerMaxHp: run.playerMaxHp,
        essence: run.essence,
        visitedNodes: run.visitedNodeIds.length,
        deckSize: run.deckCardIds.length,
      };
      if (run.enemy) m.enemyHp = run.enemy.hp;
      return m;
    },
    fingerprint(): string {
      return JSON.stringify([
        run.status,
        run.currentNodeId,
        run.playerHp,
        run.essence,
        run.enemy?.hp ?? null,
        run.deckState.hand.length,
        run.visitedNodeIds.length,
      ]);
    },
  };
}

export const dissonanceSanity: ExtraCheck = {
  name: 'dissonance-sane',
  check(adapter: PlaytestAdapter): string | null {
    const run = adapter.observe() as RunState;
    if (!Number.isFinite(run.playerHp)) return 'playerHp is not finite';
    if (run.playerHp < 0) return 'playerHp < 0';
    if (run.playerHp > run.playerMaxHp) return 'playerHp > playerMaxHp';
    if (!Number.isFinite(run.essence) || run.essence < 0) return 'essence is not finite or negative';
    if (run.enemy && !Number.isFinite(run.enemy.hp)) return 'enemy hp is not finite';
    return null;
  },
};
