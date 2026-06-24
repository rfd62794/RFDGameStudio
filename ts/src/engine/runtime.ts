import { GameFiles, GameSession, RuntimeError } from './types';
import { loadGameFiles } from './loader';
import { LuaExecutor } from './executor';

export function loadGame(gameId: string, seed: number = 42): GameSession {
  const files: GameFiles = loadGameFiles(gameId);
  const executor = new LuaExecutor(files.logic, seed);
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
