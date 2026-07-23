import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import yaml from 'js-yaml';
import { auditExports, type SymbolStatus } from '../tools/framework_gen/audit';
import { generateManifest } from '../tools/framework_gen/manifest_report';

const TS_DIR = import.meta.dirname;
const REPO_ROOT = resolve(TS_DIR, '..', '..');

const DISSONANCE_SRC = resolve(REPO_ROOT, 'tmp/dissonance-src/src');
const GAME_DIR = resolve(REPO_ROOT, 'games/dissonance');
const DATA_YAML_PATH = join(GAME_DIR, 'data.yaml');

const SOURCE_FILES = [
  'logic/combat.ts',
  'logic/builds.ts',
  'logic/rooms.ts',
  'logic/rewards.ts',
  'logic/enemies.ts',
  'logic/deck.ts',
  'logic/boons.ts',
  'logic/relics.ts',
  'logic/mapGraph.ts',
  'state/runState.ts',
  'types.ts',
];

function combineDissonanceSource(): string {
  const parts: string[] = [];
  for (const rel of SOURCE_FILES) {
    const p = join(DISSONANCE_SRC, rel);
    parts.push(readFileSync(p, 'utf8'));
  }
  return parts.join('\n\n');
}

function loadLuaText(): string {
  const systems = yaml.load(readFileSync(join(GAME_DIR, 'systems.yaml'), 'utf8')) as Record<string, unknown>;
  const files = (systems.lua_files as string[]) ?? ['logic.lua'];
  return files.map(f => readFileSync(join(GAME_DIR, f), 'utf8')).join('\n\n');
}

function writeTempSource(): string {
  const tmpName = `dissonance_combined_${Date.now()}.ts`;
  const tmpPath = join(REPO_ROOT, 'tmp', tmpName);
  mkdirSync(join(REPO_ROOT, 'tmp'), { recursive: true });
  writeFileSync(tmpPath, combineDissonanceSource());
  return tmpPath;
}

function runAudit() {
  const sourcePath = writeTempSource();
  try {
    return auditExports({
      sourcePath,
      luaPath: join(GAME_DIR, 'logic.lua'),
      luaText: loadLuaText(),
      dataYamlPath: DATA_YAML_PATH,
      tsSlimeworldDir: DISSONANCE_SRC,
    });
  } finally {
    rmSync(sourcePath, { force: true });
  }
}

const RECOVERED_FUNCTIONS = [
  'resolve_combination',
  'getBehaviorTypeIntent',
  'getEnemyIntent',
  'checkBuildGate',
  'getBuildOfferWarning',
  'applySynergyMechanic',
  'generateFixedReward',
  'generateReward',
  'generateOpeningPack',
];

describe('Dissonance Recovery Manifest — Framework Generation Layer', () => {
  it('produces a valid manifest with only the three allowed statuses', () => {
    const result = runAudit();
    const allowed: SymbolStatus[] = ['RECOVERED', 'DEFINED_NOT_CALLED', 'NEEDS_HUMAN_REVIEW'];
    for (const s of result.symbols) {
      expect(allowed).toContain(s.status);
      expect(s.status).not.toBe('MISSING');
    }

    const manifest = generateManifest(result);
    expect(manifest).toContain('# SlimeGarden Recovery Manifest');
    expect(manifest).toContain('RECOVERED');
    expect(manifest).toContain('DEFINED_NOT_CALLED');
    expect(manifest).toContain('NEEDS_HUMAN_REVIEW');
    expect(result.symbols.length).toBeGreaterThan(0);

    // eslint-disable-next-line no-console
    console.log(
      `[Dissonance Recovery Manifest] ${result.symbols.length} symbols: ` +
        `RECOVERED=${result.statusBreakdown.RECOVERED}, ` +
        `DEFINED_NOT_CALLED=${result.statusBreakdown.DEFINED_NOT_CALLED}, ` +
        `NEEDS_HUMAN_REVIEW=${result.statusBreakdown.NEEDS_HUMAN_REVIEW}`
    );
  });

  it('recovers the core gameplay functions expected to be wired', () => {
    const result = runAudit();
    // eslint-disable-next-line no-console
    console.log('AUDITED SYMBOLS:', result.symbols.map(s => `${s.name}=${s.status}`).join(', '));
    const byName = new Map(result.symbols.map(s => [s.name, s]));
    for (const fn of RECOVERED_FUNCTIONS) {
      const sym = byName.get(fn);
      expect(sym, `expected symbol ${fn} to be audited`).toBeDefined();
      expect(sym!.status, `expected ${fn} to be RECOVERED`).toBe('RECOVERED');
    }
  });
});
