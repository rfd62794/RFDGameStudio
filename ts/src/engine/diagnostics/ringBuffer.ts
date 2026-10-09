// NEW: fixed-capacity ring buffer for diagnostics, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md

export interface RingBuffer<T> {
  push(item: T): void;
  /** Oldest first. Returns a copy; mutating it does not affect the buffer. */
  snapshot(): T[];
  clear(): void;
}

export function createRingBuffer<T>(capacity: number): RingBuffer<T> {
  let items: T[] = [];
  return {
    push(item: T) {
      items.push(item);
      if (items.length > capacity) items.splice(0, items.length - capacity);
    },
    snapshot() {
      return items.slice();
    },
    clear() {
      items = [];
    },
  };
}
