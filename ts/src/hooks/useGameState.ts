import { useState, useEffect } from 'react';
import type { GameSession } from '../engine/types';

export interface UseGameStateReturn<T> {
  state: T | null;
  setState: React.Dispatch<React.SetStateAction<T | null>>;
  isInitialized: boolean;
  initError: string | null;
}

/**
 * Initializes game state from a session.
 * Handles the loading state and initialization error pattern
 * that every game App.tsx currently implements manually.
 *
 * Usage:
 *   const { state, setState, isInitialized } = useGameState(
 *     session,
 *     (s) => buildInitialState(s)
 *   );
 *
 * Note: `init` is called once on mount. Changing `init` reference does NOT
 * re-run initialization — keep it stable or wrap in useCallback.
 */
export function useGameState<T>(
  session: GameSession,
  init: (session: GameSession) => T
): UseGameStateReturn<T> {
  const [state, setState] = useState<T | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setState(init(session));
    } catch (e) {
      setInitError(e instanceof Error ? e.message : String(e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // intentionally exclude `init` — should be stable at call site

  return {
    state,
    setState,
    isInitialized: state !== null,
    initError,
  };
}
