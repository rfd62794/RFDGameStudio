import { useState, useCallback, ReactNode } from 'react';

/**
 * Shared onboarding gate — extracted from SlimeWorld's tutorial mechanism
 * (shouldFireTutorial / markTutorialShown / prepopulateAllTutorials).
 *
 * Provides a generic, game-agnostic fire-once gate for onboarding content.
 * The gate fires ONLY on a genuinely new session, never on a resumed/returning
 * one. Game-local content (tutorial IDs, copy, beat definitions) stays in each
 * game; only the gate mechanism is shared.
 *
 * Two usage modes:
 *
 * 1. **Boolean gate** (KingMaker/Planet of Greed pattern): A simple boolean
 *    flag controls whether the onboarding content shows. The gate manages
 *    the flag state and exposes onComplete to clear it.
 *
 * 2. **ID-tracked gate** (SlimeWorld pattern): Multiple onboarding steps,
 *    each tracked by a string ID. shouldFire / markShown / prepopulateAll
 *    manage which steps have been seen.
 *
 * @example Boolean gate (Planet of Greed style)
 * ```tsx
 * const { shouldShow, handleComplete } = useOnboardingGate({ mode: 'boolean' });
 * if (shouldShow) return <OpeningSequence onComplete={handleComplete} />;
 * ```
 *
 * @example ID-tracked gate (SlimeWorld style)
 * ```tsx
 * const { shouldFire, markShown, prepopulateAll } = useOnboardingGate({
 *   mode: 'id-tracked',
 *   allIds: ['t1', 't2', 't3'],
 *   isResuming: !!savedState,
 * });
 * ```
 */

export interface BooleanGateResult {
  shouldShow: boolean;
  handleComplete: () => void;
  trigger: () => void;
}

export interface IdTrackedGateResult {
  shouldFire: (id: string) => boolean;
  markShown: (id: string) => void;
  prepopulateAll: () => Record<string, boolean>;
  shownIds: Record<string, boolean>;
}

export interface OnboardingGateOptions {
  mode: 'boolean' | 'id-tracked';
  // Boolean mode: set true to show onboarding (caller controls when to trigger)
  initialShow?: boolean;
  // ID-tracked mode: all known onboarding IDs
  allIds?: string[];
  // ID-tracked mode: whether this is a resumed session (skips all onboarding)
  isResuming?: boolean;
  // ID-tracked mode: previously shown IDs from saved state
  savedShownIds?: Record<string, boolean>;
}

export function useOnboardingGate(options: { mode: 'boolean'; initialShow?: boolean }): BooleanGateResult;
export function useOnboardingGate(options: { mode: 'id-tracked'; allIds?: string[]; isResuming?: boolean; savedShownIds?: Record<string, boolean> }): IdTrackedGateResult;
export function useOnboardingGate(options: OnboardingGateOptions): BooleanGateResult | IdTrackedGateResult {
  if (options.mode === 'boolean') {
    return useBooleanGate(options.initialShow ?? false);
  }
  return useIdTrackedGate(
    options.allIds ?? [],
    options.isResuming ?? false,
    options.savedShownIds,
  );
}

function useBooleanGate(initialShow: boolean): BooleanGateResult {
  const [shouldShow, setShouldShow] = useState<boolean>(initialShow);

  const handleComplete = useCallback(() => {
    setShouldShow(false);
  }, []);

  const trigger = useCallback(() => {
    setShouldShow(true);
  }, []);

  return { shouldShow, handleComplete, trigger };
}

function useIdTrackedGate(
  allIds: string[],
  isResuming: boolean,
  savedShownIds?: Record<string, boolean>,
): IdTrackedGateResult {
  const [shownIds, setShownIds] = useState<Record<string, boolean>>(() => {
    if (isResuming) {
      const result: Record<string, boolean> = {};
      for (const id of allIds) {
        result[id] = true;
      }
      return result;
    }
    return savedShownIds ?? {};
  });

  const shouldFire = useCallback(
    (id: string): boolean => {
      return !shownIds[id];
    },
    [shownIds],
  );

  const markShown = useCallback((id: string) => {
    setShownIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  const prepopulateAll = useCallback((): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    for (const id of allIds) {
      result[id] = true;
    }
    return result;
  }, [allIds]);

  return { shouldFire, markShown, prepopulateAll, shownIds };
}

/**
 * Convenience component for boolean-gate onboarding content.
 * Renders children only when the gate is active, calls onComplete when done.
 */
interface OnboardingGateProps {
  active: boolean;
  children: ReactNode;
}

export function OnboardingGate({ active, children }: OnboardingGateProps) {
  if (!active) return null;
  return <>{children}</>;
}
