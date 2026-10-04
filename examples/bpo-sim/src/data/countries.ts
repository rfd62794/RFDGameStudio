// new: examples/bpo-sim/src/data/countries.ts

/** The six business attributes that make countries differ. Nothing else about a country affects the game. */
export const COUNTRY_ATTRIBUTES = [
  'laborCostIndex',
  'talentPoolIndex',
  'clientOverlap',
  'connectivityRisk',
  'attritionRate',
  'regulatoryOverhead',
] as const;

export type CountryAttribute = (typeof COUNTRY_ATTRIBUTES)[number];

export interface CountryProfile {
  id: string;
  name: string;
  region: string;
  blurb: string;
  laborCostIndex: number;
  talentPoolIndex: number;
  clientOverlap: number;
  connectivityRisk: number;
  attritionRate: number;
  regulatoryOverhead: number;
}

/** Allowed range per attribute (inclusive). The same numbers are documented at the top of countries.yaml. */
export const ATTRIBUTE_RANGES: Record<CountryAttribute, readonly [number, number]> = {
  laborCostIndex: [0.4, 1.8],
  talentPoolIndex: [0.3, 1.8],
  clientOverlap: [0, 1],
  connectivityRisk: [0.05, 0.4],
  attritionRate: [0.1, 0.6],
  regulatoryOverhead: [0, 0.2],
};

type Scalar = string | number;

function parseScalar(raw: string, lineNo: number): Scalar {
  const text = raw.trim();
  if (text.startsWith('"')) {
    if (!text.endsWith('"') || text.length < 2) throw new Error(`countries.yaml line ${lineNo}: unterminated string`);
    return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

/**
 * Reads the small YAML subset countries.yaml uses: `#` comments, `version: <n>`, then `countries:` followed by a
 * list of flat entries (`  - key: value` then `    key: value`). Values are numbers, "double-quoted" strings or bare words.
 * Anything else throws with the line number. Returns the raw entries; use loadCountries to validate them.
 */
export function parseCountriesYaml(text: string): { version: number; entries: Array<Record<string, Scalar>> } {
  let version = 0;
  const entries: Array<Record<string, Scalar>> = [];
  let current: Record<string, Scalar> | null = null;
  let inCountries = false;

  text.split(/\r?\n/).forEach((line, i) => {
    const lineNo = i + 1;
    if (!line.trim() || line.trim().startsWith('#')) return;
    const top = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (top) {
      if (top[1] === 'version') version = Number(parseScalar(top[2], lineNo));
      else if (top[1] === 'countries') inCountries = true;
      else throw new Error(`countries.yaml line ${lineNo}: unknown top-level key "${top[1]}"`);
      return;
    }
    if (!inCountries) throw new Error(`countries.yaml line ${lineNo}: expected a top-level key`);
    const start = /^ {2}- ([A-Za-z]+):\s*(.*)$/.exec(line);
    const more = /^ {4}([A-Za-z]+):\s*(.*)$/.exec(line);
    if (start) {
      current = {};
      entries.push(current);
      current[start[1]] = parseScalar(start[2], lineNo);
    } else if (more && current) {
      current[more[1]] = parseScalar(more[2], lineNo);
    } else {
      throw new Error(`countries.yaml line ${lineNo}: cannot read "${line.trim()}"`);
    }
  });
  return { version, entries };
}

/** Checks every entry and returns typed profiles. Throws an Error that names the country and the field. */
export function validateCountries(entries: ReadonlyArray<Record<string, Scalar>>): CountryProfile[] {
  if (entries.length === 0) throw new Error('countries.yaml: no countries listed');
  const seen = new Set<string>();
  return entries.map((e, index) => {
    const label = typeof e.id === 'string' && e.id ? `country "${e.id}"` : `country #${index + 1}`;
    for (const key of ['id', 'name', 'region', 'blurb'] as const) {
      if (typeof e[key] !== 'string' || !(e[key] as string).trim()) throw new Error(`${label}: "${key}" must be a non-empty text`);
    }
    const id = e.id as string;
    if (!/^[a-z]+(-[a-z]+)*$/.test(id)) throw new Error(`${label}: id must be lowercase words joined by dashes`);
    if (seen.has(id)) throw new Error(`${label}: id is listed twice`);
    seen.add(id);
    for (const key of COUNTRY_ATTRIBUTES) {
      const value = e[key];
      const [min, max] = ATTRIBUTE_RANGES[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label}: "${key}" must be a number`);
      if (value < min || value > max) throw new Error(`${label}: "${key}" is ${value}, allowed ${min} to ${max}`);
    }
    return e as unknown as CountryProfile;
  });
}

/** Parse and validate in one step. */
export function loadCountries(text: string): CountryProfile[] {
  const { version, entries } = parseCountriesYaml(text);
  if (version !== 1) throw new Error(`countries.yaml: unsupported version ${version}`);
  return validateCountries(entries);
}

export function findCountry(countries: ReadonlyArray<CountryProfile>, id: string | null | undefined): CountryProfile | undefined {
  return countries.find((c) => c.id === id);
}
