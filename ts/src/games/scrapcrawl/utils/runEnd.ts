// new: ts/src/games/scrapcrawl/utils/runEnd.ts
export type RunOutcome = 'playing' | 'won' | 'lost';

export interface RunProgress {
  hp: number;
  maxHp: number;
  clearedRoomIds: string[];
  outcome: RunOutcome;
}

export const PLAYER_MAX_HP = 10;
export const LOSS_DAMAGE = 2;

type RoomTypes = Record<string, { interaction_types?: string[] }>;

export function newRun(): RunProgress {
  return {
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    clearedRoomIds: [],
    outcome: 'playing',
  };
}

export function fightRoomIds(rooms: RoomTypes): string[] {
  return Object.keys(rooms).filter(id => rooms[id].interaction_types?.includes('fight'));
}

export function applyFight(run: RunProgress, rooms: RoomTypes, roomId: string, won: boolean): RunProgress {
  if (run.outcome !== 'playing') return run;
  if (won) {
    const isFightRoom = rooms[roomId]?.interaction_types?.includes('fight') ?? false;
    const clearedRoomIds = isFightRoom && !run.clearedRoomIds.includes(roomId)
      ? [...run.clearedRoomIds, roomId]
      : run.clearedRoomIds;
    const fightIds = fightRoomIds(rooms);
    const allCleared = fightIds.length > 0 && fightIds.every(id => clearedRoomIds.includes(id));
    return { ...run, clearedRoomIds, outcome: allCleared ? 'won' : 'playing' };
  }
  const hp = Math.max(0, run.hp - LOSS_DAMAGE);
  return { ...run, hp, outcome: hp === 0 ? 'lost' : 'playing' };
}

export function applyMove(run: RunProgress, rooms: RoomTypes, toRoomId: string): RunProgress {
  if (run.outcome !== 'playing') return run;
  if (rooms[toRoomId]?.interaction_types?.includes('rest') && run.hp !== run.maxHp) {
    return { ...run, hp: run.maxHp };
  }
  return run;
}
