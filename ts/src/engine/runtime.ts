import { GameFiles, GameSession, RuntimeError } from './types';
import { loadGameFiles } from './loader';
import { LuaExecutor } from './executor';

export async function loadGame(gameId: string, seed: number = 42): Promise<GameSession> {
  const files: GameFiles = await loadGameFiles(gameId);
  const executor = new LuaExecutor(files.logic, seed, files.engineSource);
  return { gameId, files, executor };
}

export function call(session: GameSession, fnName: string, ...args: unknown[]): unknown {
  return session.executor.call(fnName, ...args);
}

export function getSchema(session: GameSession, entity: string): Record<string, unknown> {
  const top = session.files.data[entity] as Record<string, unknown> | undefined;
  if (!top) throw new RuntimeError(`Schema not found: ${entity}`);
  const fields = top['fields'] as Record<string, unknown> | undefined;
  return fields ?? top;
}
