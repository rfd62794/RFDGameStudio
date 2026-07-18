import { GameFiles, GameSession, RuntimeError } from './types';
import { loadGameFiles } from './loader';
import { LuaExecutor } from './executor';

export function loadGame(gameId: string, seed: number = 42): GameSession {
  const files: GameFiles = loadGameFiles(gameId);
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

export function getStaticList(session: GameSession, key: string): unknown[] {
  const raw = session.files.data[key];
  if (!Array.isArray(raw)) throw new RuntimeError(`Static list not found or not an array: ${key}`);
  return raw;
}
