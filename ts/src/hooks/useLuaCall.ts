import { useState, useCallback } from 'react';
import { call as runtimeCall } from '../engine/runtime';
import type { GameSession } from '../engine/types';

export interface UseLuaCallReturn {
  /** Call a Lua function on the session. Returns the result or null on error. */
  call: (fnName: string, ...args: unknown[]) => unknown;
  /** Last error from a Lua call, or null. */
  error: string | null;
  /** Clear the error state. */
  clearError: () => void;
}

/**
 * Returns a stable `call` function bound to `session` with component-scoped
 * error state. Eliminates repeated try/catch in game handlers.
 *
 * Usage:
 *   const { call, error, clearError } = useLuaCall(session);
 *   const result = call('simulate_race', participants, config);
 */
export function useLuaCall(session: GameSession): UseLuaCallReturn {
  const [error, setError] = useState<string | null>(null);

  const call = useCallback((fnName: string, ...args: unknown[]): unknown => {
    try {
      const results = runtimeCall(session, fnName, ...args);
      return results[0] ?? null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    }
  }, [session]);

  const clearError = useCallback(() => setError(null), []);

  return { call, error, clearError };
}
