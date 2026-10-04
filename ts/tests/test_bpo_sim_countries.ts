// @vitest-environment node
// new: ts/tests/test_bpo_sim_countries.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import {
  COUNTRY_ATTRIBUTES, ATTRIBUTE_RANGES, parseCountriesYaml, validateCountries, loadCountries, findCountry,
} from '../../examples/bpo-sim/src/data/countries';

const TEXT = readFileSync(new URL('../../examples/bpo-sim/src/data/countries.yaml', import.meta.url), 'utf8');

const REQUIRED_IDS = [
  'philippines', 'india', 'malaysia', 'vietnam', 'poland', 'romania', 'egypt', 'south-africa', 'kenya', 'colombia', 'mexico', 'costa-rica',
];

describe('test_bpo_sim_countries', () => {
  it('lists the twelve starting countries, each once', () => {
    const countries = loadCountries(TEXT);
    expect(countries.map((c) => c.id).sort()).toEqual([...REQUIRED_IDS].sort());
    expect(new Set(countries.map((c) => c.name)).size).toBe(countries.length);
  });

  it('the small reader gives exactly what a real YAML parser gives for the shipped file', () => {
    const real = yaml.load(TEXT) as { version: number; countries: unknown[] };
    const mine = parseCountriesYaml(TEXT);
    expect(mine.version).toBe(real.version);
    expect(mine.entries).toEqual(real.countries);
  });

  it('every attribute is inside its documented range and the file documents the same ranges', () => {
    for (const c of loadCountries(TEXT)) {
      for (const key of COUNTRY_ATTRIBUTES) {
        const [min, max] = ATTRIBUTE_RANGES[key];
        expect(c[key], `${c.id}.${key}`).toBeGreaterThanOrEqual(min);
        expect(c[key], `${c.id}.${key}`).toBeLessThanOrEqual(max);
      }
    }
    for (const key of COUNTRY_ATTRIBUTES) {
      expect(TEXT, `countries.yaml should explain ${key}`).toContain(key);
    }
  });

  it('countries differ in real ways: every attribute varies, and no country is best at everything', () => {
    const countries = loadCountries(TEXT);
    for (const key of COUNTRY_ATTRIBUTES) {
      const values = new Set(countries.map((c) => c[key]));
      expect(values.size, `${key} should vary`).toBeGreaterThan(5);
    }
    const cheapest = Math.min(...countries.map((c) => c.laborCostIndex));
    const steadiest = Math.min(...countries.map((c) => c.connectivityRisk));
    expect(countries.some((c) => c.laborCostIndex === cheapest && c.connectivityRisk === steadiest)).toBe(false);
  });

  it('names the country and the field when an entry is wrong', () => {
    const base = parseCountriesYaml(TEXT).entries;
    const broken = base.map((e, i) => (i === 0 ? { ...e, attritionRate: 9 } : e));
    expect(() => validateCountries(broken)).toThrow('country "philippines": "attritionRate" is 9, allowed 0.1 to 0.6');
    expect(() => validateCountries([base[0], { ...base[1], id: 'philippines' }])).toThrow('listed twice');
    expect(() => validateCountries([{ ...base[0], laborCostIndex: 'cheap' }])).toThrow('"laborCostIndex" must be a number');
    expect(() => validateCountries([])).toThrow('no countries listed');
  });

  it('refuses text it cannot read instead of guessing', () => {
    expect(() => loadCountries('version: 2\ncountries:\n')).toThrow('unsupported version 2');
    expect(() => parseCountriesYaml('version: 1\nmystery: 3\n')).toThrow('line 2: unknown top-level key "mystery"');
    expect(() => parseCountriesYaml('version: 1\ncountries:\n  - id: "oops\n')).toThrow('line 3: unterminated string');
    expect(() => parseCountriesYaml('version: 1\ncountries:\n  nonsense here\n')).toThrow('line 3: cannot read');
  });

  it('finds a country by id', () => {
    const countries = loadCountries(TEXT);
    expect(findCountry(countries, 'poland')?.name).toBe('Poland');
    expect(findCountry(countries, 'nowhere')).toBeUndefined();
    expect(findCountry(countries, null)).toBeUndefined();
  });
});
