// @vitest-environment node
// new: ts/tests/test_bpo_sim_neutral_copy.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { FIRST_NAMES_M, FIRST_NAMES_F, LAST_NAMES } from '../../examples/bpo-sim/src/utils/names';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const SRC = join(REPO, 'examples', 'bpo-sim', 'src');

function listSource(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listSource(full));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(full);
  }
  return out;
}

const blocklist = yaml.load(readFileSync(join(SRC, 'data', 'neutral-copy-blocklist.yaml'), 'utf8')) as Record<string, unknown>;
const countries = (yaml.load(readFileSync(join(SRC, 'data', 'countries.yaml'), 'utf8')) as { countries: Array<{ id: string; name: string }> }).countries;

/** The files whose text a player or a reader of the shipped code can see. The country data and the blocklist are the only places allowed to name countries or terms. */
const SCANNED = [
  ...listSource(SRC).filter((f) => !/[\\/]data[\\/]countries\.ts$/.test(f)),
  join(REPO, 'examples', 'bpo-sim', 'index.html'),
  join(REPO, 'examples', 'bpo-sim', 'metadata.json'),
  join(REPO, 'ts', 'src', 'games', 'bpo_sim', 'config.ts'),
];

function termRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return /^[a-z0-9]/i.test(term) && /[a-z0-9]$/i.test(term) ? new RegExp(`\\b${escaped}\\b`, 'i') : new RegExp(escaped, 'i');
}

function scan(terms: string[]): string[] {
  const rules = terms.map((t) => ({ t, re: termRegex(t) }));
  const hits: string[] = [];
  for (const file of SCANNED) {
    readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
      for (const { t, re } of rules) {
        if (re.test(line)) hits.push(`${relative(REPO, file).replace(/\\/g, '/')}:${i + 1}: "${line.trim().slice(0, 100)}" contains "${t}"`);
      }
    });
  }
  return hits;
}

const allTerms = Object.entries(blocklist).filter(([k]) => k !== 'version').flatMap(([, v]) => v as string[]);

describe('test_bpo_sim_neutral_copy', () => {
  it('the blocklist file lists terms in every category', () => {
    const categories = Object.keys(blocklist).filter((k) => k !== 'version');
    expect(categories.length).toBe(6);
    for (const c of categories) expect((blocklist[c] as string[]).length, c).toBeGreaterThan(1);
    expect(allTerms.length).toBeGreaterThan(60);
  });

  it('no blocked national, brand, language, currency or stereotype term appears in the shipped copy or code', () => {
    const hits = scan(allTerms);
    expect(hits, `Neutral copy violations:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no country is named outside countries.yaml (no country-specific branches or copy)', () => {
    const names = countries.flatMap((c) => [c.name, c.id]);
    const hits = scan(names);
    expect(hits, `Country named outside countries.yaml:\n${hits.join('\n')}`).toEqual([]);
  });

  it('the cast is a varied mix: three real name pools, no repeats, none of the retired names', () => {
    expect(FIRST_NAMES_M.length).toBeGreaterThanOrEqual(24);
    expect(FIRST_NAMES_F.length).toBeGreaterThanOrEqual(24);
    expect(LAST_NAMES.length).toBeGreaterThanOrEqual(30);
    for (const pool of [FIRST_NAMES_M, FIRST_NAMES_F, LAST_NAMES]) {
      expect(new Set(pool).size).toBe(pool.length);
    }
    const retired = new Set((blocklist.retired_cast_names as string[]).map((n) => n.toLowerCase()));
    for (const name of [...FIRST_NAMES_M, ...FIRST_NAMES_F, ...LAST_NAMES]) {
      expect(retired.has(name.toLowerCase()), name).toBe(false);
    }
  });

  it('agent avatars use a varied palette, not one skin tone', () => {
    const canvas = readFileSync(join(SRC, 'components', 'IsometricOfficeCanvas.tsx'), 'utf8');
    const palette = /const AVATAR_SKIN_TONES = \[([^\]]+)\]/.exec(canvas);
    expect(palette, 'AVATAR_SKIN_TONES palette').not.toBeNull();
    expect(palette![1].split(',').length).toBeGreaterThanOrEqual(5);
    expect(canvas).toContain('AVATAR_SKIN_TONES[Math.abs(agent.avatarSeed)');
    expect(canvas).not.toContain("ctx.fillStyle = '#fed7aa'");
  });
});
