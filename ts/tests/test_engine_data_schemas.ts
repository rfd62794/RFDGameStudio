// NEW: vitest validating games/*/data.yaml against Zod schemas, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { dataSchemas, validateGameData } from '../src/engine/schemas';

const repoRoot = resolve(import.meta.dirname, '..', '..');

const GAMES_WITH_SCHEMA = ['chimera_wilds', 'horse_racing', 'choke_point'] as const;

const REQUIRED_KEY: Record<(typeof GAMES_WITH_SCHEMA)[number], string> = {
  chimera_wilds: 'parts',
  horse_racing: 'starter_horses',
  choke_point: 'waves',
};

function loadDataYaml(gameId: string): Record<string, unknown> {
  const raw = readFileSync(resolve(repoRoot, 'games', gameId, 'data.yaml'), 'utf-8');
  return yaml.load(raw) as Record<string, unknown>;
}

describe('validateGameData', () => {
  it.each(GAMES_WITH_SCHEMA)('%s data.yaml validates ok', (gameId) => {
    expect(validateGameData(gameId, loadDataYaml(gameId))).toEqual({ ok: true });
  });

  it.each(GAMES_WITH_SCHEMA)(
    '%s missing required key reports file path and key',
    (gameId) => {
      const key = REQUIRED_KEY[gameId];
      const parsed = loadDataYaml(gameId);
      delete parsed[key];

      const result = validateGameData(gameId, parsed);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const text = result.issues.join('\n');
        expect(text).toContain(`games/${gameId}/data.yaml`);
        expect(text).toContain(key);
      }
    }
  );

  it('exactly 9 YAML games lack a schema', () => {
    const gamesDir = resolve(repoRoot, 'games');
    const yamlGames = readdirSync(gamesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((id) => existsSync(resolve(gamesDir, id, 'data.yaml')));
    const uncovered = yamlGames.filter((id) => !(id in dataSchemas));
    expect(uncovered).toHaveLength(9);
  });
});
