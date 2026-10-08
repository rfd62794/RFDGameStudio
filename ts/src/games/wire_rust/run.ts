import type { GameSession } from '../../engine/types';
import { call } from '../../engine/runtime';
import { mulberry32 } from '../../engine/shared/seededRandom';
import type { CardId, EncounterResult, PlayerState, Room, WireRustGameState } from './types';

export const GATE_ROOM = 'reactor_core';
export const GOAL_ROOM = 'control_room';

export type RunStatus = 'playing' | 'won' | 'lost';

/** The D20 for a given turn of a given run. Same seed and turn always give the same roll. */
export function rollD20(seed: number, turn: number): number {
  return Math.floor(mulberry32(seed + turn * 7919)() * 20) + 1;
}

/** The Control Room opens only after the Reactor Core challenge has been won. */
export function canEnterRoom(cleared: readonly string[], roomId: string): boolean {
  return roomId !== GOAL_ROOM || cleared.includes(GATE_ROOM);
}

export function runStatus(state: Pick<WireRustGameState, 'player'>): RunStatus {
  if (state.player.hp <= 0) return 'lost';
  return state.player.current_room_id === GOAL_ROOM ? 'won' : 'playing';
}

function roomsOf(session: GameSession): Record<string, Room> {
  const data = session.files.data as Record<string, unknown>;
  return (data.rooms ?? {}) as Record<string, Room>;
}

export function newRun(session: GameSession, seed: number = Math.floor(Math.random() * 0x7fffffff)): WireRustGameState {
  const data = session.files.data as Record<string, unknown>;
  const rooms = roomsOf(session);
  const player = call(session, 'init_game', data)[0] as PlayerState;
  return {
    player,
    currentRoom: rooms[player.current_room_id] ?? rooms.junk_heap,
    combatHistory: [],
    message: 'Scrapyard entered.',
    cleared: [],
    seed,
    turn: 0,
  };
}

/** Returns the same state object when the move is not allowed. */
export function applyMove(session: GameSession, state: WireRustGameState, roomId: string): WireRustGameState {
  if (!canEnterRoom(state.cleared, roomId)) return state;
  const data = session.files.data as Record<string, unknown>;
  const next = call(session, 'move_room', data, state.player, roomId)[0] as PlayerState | null;
  if (!next || next.current_room_id === state.player.current_room_id) return state;
  const rooms = roomsOf(session);
  return {
    ...state,
    player: next,
    currentRoom: rooms[next.current_room_id] ?? state.currentRoom,
    message: `Moved to ${rooms[next.current_room_id]?.name ?? roomId}`,
  };
}

export interface PlayOutcome {
  state: WireRustGameState;
  result: EncounterResult | null;
}

export function applyPlayCard(session: GameSession, state: WireRustGameState, cardId: CardId): PlayOutcome {
  const data = session.files.data as Record<string, unknown>;
  const roll = rollD20(state.seed, state.turn);
  const result = call(session, 'resolve_encounter', data, state.player, cardId, roll)[0] as EncounterResult | null;
  if (!result) return { state, result: null };

  const cards = (data.cards ?? {}) as Record<string, { combat_mod?: number }>;
  const cardMod = cards[cardId]?.combat_mod ?? 0;
  const math = `D20 ${roll} + card ${cardMod} + chem ${result.bonus} = ${result.total_score} vs ${result.difficulty}`;
  const logMsg = result.won
    ? `[WIN] ${state.currentRoom.name}: ${math} — salvage stored!`
    : `[LOSS] ${state.currentRoom.name}: ${math} — core integrity damaged.`;

  return {
    result,
    state: {
      ...state,
      player: result.player,
      combatHistory: [logMsg, ...state.combatHistory.slice(0, 49)],
      message: result.won ? 'Encounter resolved' : 'Core hit',
      cleared: result.won && !state.cleared.includes(state.currentRoom.id)
        ? [...state.cleared, state.currentRoom.id]
        : state.cleared,
      turn: state.turn + 1,
    },
  };
}
