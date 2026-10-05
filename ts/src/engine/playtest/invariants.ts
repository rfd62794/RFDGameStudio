// new: ts/src/engine/playtest/invariants.ts

/** The first metric whose value is not finite, as `key=value`; null when all are. */
export function findNonFinite(metrics: Record<string, number>): string | null {
  for (const key of Object.keys(metrics)) {
    const value = metrics[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return `${key}=${String(value)}`;
    }
  }
  return null;
}

/** True once the same fingerprint has been seen `window` consecutive calls. */
export function createStallTracker(window: number): (fingerprint: string) => boolean {
  let last: string | null = null;
  let count = 0;
  return (fingerprint: string): boolean => {
    if (fingerprint === last) {
      count += 1;
    } else {
      last = fingerprint;
      count = 1;
    }
    return count >= window;
  };
}
