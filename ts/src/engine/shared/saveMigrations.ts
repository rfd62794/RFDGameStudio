// NEW: ordered save migration registry, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md

/** One step of a migration: takes data at version N, returns it at N+1. */
export type Migration = (data: unknown) => unknown;

export interface MigrationRegistry {
  /**
   * Applies steps[fromVersion .. toVersion-1] in order. Returns null when
   * fromVersion > toVersion, a step is missing, or a step throws — a
   * failed migration must never surface a half-migrated save.
   */
  migrate(old: unknown, fromVersion: number, toVersion: number): unknown | null;
}

export function createMigrationRegistry(steps: Record<number, Migration>): MigrationRegistry {
  return {
    migrate(old: unknown, fromVersion: number, toVersion: number): unknown | null {
      if (fromVersion > toVersion) return null;
      let data = old;
      for (let v = fromVersion; v < toVersion; v++) {
        const step = steps[v];
        if (typeof step !== 'function') return null;
        try {
          data = step(data);
        } catch {
          return null;
        }
      }
      return data;
    },
  };
}
