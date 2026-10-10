// @vitest-environment node
// new: ts/tests/test_factory_idle_starter_goal.ts

import { describe, it, expect } from 'vitest';
import {
  STARTER_GOAL_TARGET, HINT_DISMISSED_KEY, starterGoalProgress, starterHint, isHintDismissed, dismissHint,
} from '../../examples/factory-idle-precision-armory-phase2/src/engine/starterGoal';
import type { StorageLike } from '../../examples/factory-idle-precision-armory-phase2/src/engine/persistence';

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

describe('test_factory_idle_starter_goal', () => {
  it('counts served customers up to the target and then reports done', () => {
    expect(starterGoalProgress({ fulfilledOrders: 0 })).toEqual({ served: 0, target: STARTER_GOAL_TARGET, done: false });
    expect(starterGoalProgress({ fulfilledOrders: 3 }).served).toBe(3);
    expect(starterGoalProgress({ fulfilledOrders: STARTER_GOAL_TARGET }).done).toBe(true);
    expect(starterGoalProgress({ fulfilledOrders: 99 })).toEqual({ served: STARTER_GOAL_TARGET, target: STARTER_GOAL_TARGET, done: true });
    expect(starterGoalProgress({ fulfilledOrders: -4 }).served).toBe(0);
  });

  it('the hint is plain, friendly player language', () => {
    const early = starterHint(starterGoalProgress({ fulfilledOrders: 2 }));
    expect(early).toContain('Serve 5 customers');
    expect(early).toContain('2 so far');
    expect(starterHint(starterGoalProgress({ fulfilledOrders: 5 }))).toContain('Nice work');
    for (const n of [0, 2, 5]) {
      const text = starterHint(starterGoalProgress({ fulfilledOrders: n }));
      expect(/reducer|dispatch|localStorage|TODO|debug/i.test(text)).toBe(false);
    }
  });

  it('remembers the dismissal and never throws without storage', () => {
    const storage = memoryStorage();
    expect(isHintDismissed(storage)).toBe(false);
    dismissHint(storage);
    expect(isHintDismissed(storage)).toBe(true);
    expect(storage.getItem(HINT_DISMISSED_KEY)).toBe('1');
    expect(isHintDismissed(null)).toBe(false);
    expect(() => dismissHint(null)).not.toThrow();
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(isHintDismissed(blocked)).toBe(false);
    expect(() => dismissHint(blocked)).not.toThrow();
  });
});
