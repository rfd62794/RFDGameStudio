// new: ts/src/engine/playtest/policies.ts
import type { Policy } from './types';

export function randomPolicy(): Policy {
  return (_obs, legal, rng) => legal[Math.floor(rng() * legal.length)];
}

export function firstLegalPolicy(): Policy {
  return (_obs, legal) => legal[0];
}

export function greedyPolicy(score: (a: unknown, obs: unknown) => number): Policy {
  return (obs, legal) => {
    let best = legal[0];
    let bestScore = score(best, obs);
    for (const a of legal.slice(1)) {
      const s = score(a, obs);
      if (s > bestScore) {
        best = a;
        bestScore = s;
      }
    }
    return best;
  };
}

export function scriptedPolicy(actions: unknown[]): Policy {
  let i = 0;
  return () => {
    if (i >= actions.length) throw new Error('script exhausted');
    return actions[i++];
  };
}
