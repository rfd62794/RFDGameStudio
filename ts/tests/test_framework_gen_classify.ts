import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { classifySourceFile } from '../tools/framework_gen/classify';
import { declarationToYaml, camelToSnake, convertKeysToSnake } from '../tools/framework_gen/emit_yaml';
import { generateReport } from '../tools/framework_gen/report';
import { runCli } from '../tools/framework_gen/cli';

const REAL_COLOR_TARGETS_SOURCE = `
export const COLOR_TARGETS = [
  { id: "guild_ember_marsh", tier: "guild", name: "Thornward", centerHues: [30], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: "guild_marsh_gale", tier: "guild", name: "Guild: Amberglow", centerHues: [90], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: "guild_gale_tundra", tier: "guild", name: "Frostwind", centerHues: [150], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: "guild_tundra_crystal", tier: "guild", name: "Guild: Mossy Crystal", centerHues: [210], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: "guild_crystal_tide", tier: "guild", name: "Tidereign", centerHues: [270], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: "guild_tide_ember", tier: "guild", name: "Guild: Abyssal Ember", centerHues: [330], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: "rival_ember_tundra", tier: "rival", name: "The Fault Line", centerHues: [90, 270], tolerance: 10, saturationMin: 35, saturationMax: 65 },
  { id: "rival_marsh_crystal", tier: "rival", name: "Rival: Eclipse Void", centerHues: [150, 330], tolerance: 10, saturationMin: 35, saturationMax: 65 },
  { id: "rival_gale_tide", tier: "rival", name: "Rival: Stormsurge", centerHues: [210, 30], tolerance: 10, saturationMin: 35, saturationMax: 65 },
  { id: "arc_ember_marsh_gale", tier: "arc_triad", name: "Arc: Ember-Marsh-Gale", centerHues: [60], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: "arc_marsh_gale_tundra", tier: "arc_triad", name: "Arc: Marsh-Gale-Tundra", centerHues: [120], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: "arc_gale_tundra_crystal", tier: "arc_triad", name: "Arc: Gale-Tundra-Crystal", centerHues: [180], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: "arc_tundra_crystal_tide", tier: "arc_triad", name: "Arc: Tundra-Crystal-Tide", centerHues: [240], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: "arc_crystal_tide_ember", tier: "arc_triad", name: "Arc: Crystal-Tide-Ember", centerHues: [300], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: "arc_tide_ember_marsh", tier: "arc_triad", name: "Arc: Tide-Ember-Marsh", centerHues: [0], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: "skip_ember_gale_crystal", tier: "skip_triad", name: "Skip: Ember-Gale-Crystal", centerHues: [0, 120, 240], tolerance: 10, saturationMin: 15, saturationMax: 20 },
  { id: "skip_marsh_tundra_tide", tier: "skip_triad", name: "Skip: Marsh-Tundra-Tide", centerHues: [60, 180, 300], tolerance: 10, saturationMin: 15, saturationMax: 20 },
];
`;

const SYNTHETIC_NOT_PURE_SOURCE = `
export const SEED_DEFS = [
  { id: "a", angle: computeAngle(0) },
  { id: "b", angle: computeAngle(1) },
];
export const INITIAL_STATE = { config: DEFAULT_CONFIG, count: 5 };
export const PURE_OBJ = { name: "test", values: [1, 2, 3], nested: { a: true, b: "hello" } };
`;

const REAL_DATA_YAML_PATH = resolve(import.meta.dirname, '../../games/slimeworld/data.yaml');

describe('Framework Generation — Module 1: Pure-Data Extraction', () => {
  it('test_classifies_color_targets_as_pure_data', () => {
    const result = classifySourceFile(REAL_COLOR_TARGETS_SOURCE, 'color_targets.ts');
    const ct = result.declarations.find(d => d.name === 'COLOR_TARGETS');
    expect(ct).toBeDefined();
    expect(ct!.isPureData).toBe(true);
    expect(ct!.kind).toBe('array');
  });

  it('test_extracts_all_17_entries_not_9', () => {
    const result = classifySourceFile(REAL_COLOR_TARGETS_SOURCE, 'color_targets.ts');
    const ct = result.declarations.find(d => d.name === 'COLOR_TARGETS');
    expect(ct).toBeDefined();
    expect(ct!.isPureData).toBe(true);
    expect(ct!.entryCount).toBe(17);

    const yaml = declarationToYaml(ct!);
    const idMatches = yaml.match(/id: /g);
    expect(idMatches).not.toBeNull();
    expect(idMatches!.length).toBe(17);

    const guildMatches = yaml.match(/tier: guild/g);
    expect(guildMatches).not.toBeNull();
    expect(guildMatches!.length).toBe(6);

    const rivalMatches = yaml.match(/tier: rival/g);
    expect(rivalMatches).not.toBeNull();
    expect(rivalMatches!.length).toBe(3);

    const arcMatches = yaml.match(/tier: arc_triad/g);
    expect(arcMatches).not.toBeNull();
    expect(arcMatches!.length).toBe(6);

    const skipMatches = yaml.match(/tier: skip_triad/g);
    expect(skipMatches).not.toBeNull();
    expect(skipMatches!.length).toBe(2);
  });

  it('test_converts_camelCase_to_snake_case_correctly', () => {
    expect(camelToSnake('centerHues')).toBe('center_hues');
    expect(camelToSnake('saturationMin')).toBe('saturation_min');
    expect(camelToSnake('saturationMax')).toBe('saturation_max');
    expect(camelToSnake('vertexTolerance')).toBe('vertex_tolerance');
    expect(camelToSnake('COLOR_TARGETS')).toBe('color_targets');

    const converted = convertKeysToSnake({
      centerHues: [30],
      saturationMin: 65,
      tolerance: 15,
    }) as Record<string, unknown>;
    expect(converted['center_hues']).toEqual([30]);
    expect(converted['saturation_min']).toBe(65);
    expect(converted['tolerance']).toBe(15);

    const realYaml = readFileSync(REAL_DATA_YAML_PATH, 'utf8');
    expect(realYaml).toContain('center_hues:');
    expect(realYaml).toContain('saturation_min:');
    expect(realYaml).toContain('saturation_max:');
  });

  it('test_flags_function_call_as_not_pure_data', () => {
    const result = classifySourceFile(SYNTHETIC_NOT_PURE_SOURCE, 'synthetic.ts');
    const seedDefs = result.declarations.find(d => d.name === 'SEED_DEFS');
    expect(seedDefs).toBeDefined();
    expect(seedDefs!.isPureData).toBe(false);
    expect(seedDefs!.reason).toContain('function call');
    expect(seedDefs!.reason).toContain('computeAngle');
  });

  it('test_flags_external_reference_as_not_pure_data', () => {
    const result = classifySourceFile(SYNTHETIC_NOT_PURE_SOURCE, 'synthetic.ts');
    const initialState = result.declarations.find(d => d.name === 'INITIAL_STATE');
    expect(initialState).toBeDefined();
    expect(initialState!.isPureData).toBe(false);
    expect(initialState!.reason).toContain('external identifier');
    expect(initialState!.reason).toContain('DEFAULT_CONFIG');
  });

  it('test_report_gives_specific_reason_not_generic', () => {
    const result = classifySourceFile(SYNTHETIC_NOT_PURE_SOURCE, 'synthetic.ts');
    const report = generateReport(result, 'synthetic.ts');
    expect(report).toContain('Not Converted');
    expect(report).toContain('SEED_DEFS');
    expect(report).toContain('computeAngle');
    expect(report).toContain('INITIAL_STATE');
    expect(report).toContain('DEFAULT_CONFIG');
    expect(report).not.toContain('too complex');
  });

  it('test_never_writes_to_real_data_yaml', () => {
    const realYamlBefore = readFileSync(REAL_DATA_YAML_PATH, 'utf8');

    const tempDir = resolve(import.meta.dirname, '_temp_framework_gen_test');
    rmSync(tempDir, { recursive: true, force: true });

    const tempInputPath = resolve(tempDir, 'input.ts');
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(tempInputPath, REAL_COLOR_TARGETS_SOURCE, 'utf8');

    const outputDir = resolve(tempDir, 'output');
    const cliResult = runCli({ input: tempInputPath, outputDir });

    expect(cliResult.yamlFiles.length).toBe(1);
    expect(existsSync(resolve(outputDir, 'color_targets.yaml'))).toBe(true);
    expect(existsSync(resolve(outputDir, 'report.md'))).toBe(true);

    const realYamlAfter = readFileSync(REAL_DATA_YAML_PATH, 'utf8');
    expect(realYamlAfter).toBe(realYamlBefore);

    rmSync(tempDir, { recursive: true, force: true });
  });
});
