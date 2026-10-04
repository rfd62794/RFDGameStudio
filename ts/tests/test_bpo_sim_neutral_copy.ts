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

function termRegex(term: string, caseSensitive = false): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flags = caseSensitive ? '' : 'i';
  return /^[a-z0-9]/i.test(term) && /[a-z0-9]$/i.test(term) ? new RegExp(`\\b${escaped}\\b`, flags) : new RegExp(escaped, flags);
}

type Rule = { t: string; re: RegExp };
const rulesFor = (terms: string[], caseSensitive = false): Rule[] => terms.map((t) => ({ t, re: termRegex(t, caseSensitive) }));

/** Scan one text; `label` names the file. Pure, so the positive tests below can feed it synthetic strings. */
function scanText(label: string, text: string, rules: Rule[]): string[] {
  const hits: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const { t, re } of rules) {
      if (re.test(line)) hits.push(`${label}:${i + 1}: "${line.trim().slice(0, 100)}" contains "${t}"`);
    }
  });
  return hits;
}

const rel = (file: string) => relative(REPO, file).replace(/\\/g, '/');
function scanFiles(check: (label: string, text: string) => string[]): string[] {
  return SCANNED.flatMap((file) => check(rel(file), readFileSync(file, 'utf8')));
}
const scan = (rules: Rule[]) => scanFiles((label, text) => scanText(label, text, rules));

/** ISO 3166 alpha-2 and alpha-3 codes of every country in countries.yaml. */
const COUNTRY_CODES = ['ph', 'phl', 'in', 'ind', 'my', 'mys', 'vn', 'vnm', 'pl', 'pol', 'ro', 'rou', 'eg', 'egy', 'za', 'zaf', 'ke', 'ken', 'co', 'col', 'mx', 'mex', 'cr', 'cri'];
const CODE = `(['"\`])(?:${COUNTRY_CODES.join('|')})\\1`;
const CMP_LEFT = new RegExp(`\\b\\w*country\\w*\\s*[!=]==?\\s*${CODE}`, 'i');
const CMP_RIGHT = new RegExp(`${CODE}\\s*[!=]==?\\s*[\\w.]*country\\w*`, 'i');
const INCLUDES = new RegExp(`\\[[^\\]]*${CODE}[^\\]]*\\]\\.includes\\(\\s*[\\w.]*country`, 'i');
const SWITCH_ON_COUNTRY = /switch\s*\(\s*[\w.]*country\w*/i;
const CASE_CODE = new RegExp(`\\bcase\\s+${CODE}`, 'i');

/** A country code compared against a country variable is a country-specific branch, whatever the spelling. */
function codeBranchHits(label: string, text: string): string[] {
  const hits: string[] = [];
  const switching = SWITCH_ON_COUNTRY.test(text);
  text.split(/\r?\n/).forEach((line, i) => {
    const bad = CMP_LEFT.test(line) || CMP_RIGHT.test(line) || INCLUDES.test(line) || (switching && CASE_CODE.test(line));
    if (bad) hits.push(`${label}:${i + 1}: "${line.trim().slice(0, 100)}" branches on a country code`);
  });
  return hits;
}

const caseSensitiveCodes = (blocklist.case_sensitive_codes as string[]) ?? [];
const caseInsensitiveTerms = Object.entries(blocklist)
  .filter(([k]) => k !== 'version' && k !== 'case_sensitive_codes')
  .flatMap(([, v]) => v as string[]);
const allRules = [...rulesFor(caseInsensitiveTerms), ...rulesFor(caseSensitiveCodes, true)];

const REQUIRED_CATEGORIES = [
  'national_and_place_terms', 'brand_terms', 'local_language_and_currency_terms', 'region_specific_terms', 'stereotype_terms',
  'retired_cast_names', 'demonym_terms', 'city_and_hub_terms', 'currency_terms', 'language_terms', 'stereotype_phrase_terms', 'case_sensitive_codes',
];

describe('test_bpo_sim_neutral_copy', () => {
  it('the blocklist file lists terms in every category', () => {
    const categories = Object.keys(blocklist).filter((k) => k !== 'version');
    expect([...categories].sort()).toEqual([...REQUIRED_CATEGORIES].sort());
    for (const c of categories) expect((blocklist[c] as string[]).length, c).toBeGreaterThan(1);
    // floor: 81 original + 158 broadened terms; raise when terms are added
    expect(caseInsensitiveTerms.length + caseSensitiveCodes.length).toBeGreaterThanOrEqual(239);
  });

  it('no blocked national, brand, language, currency or stereotype term appears in the shipped copy or code', () => {
    const hits = scan(allRules);
    expect(hits, `Neutral copy violations:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no country is named outside countries.yaml (no country-specific branches or copy)', () => {
    const names = countries.flatMap((c) => [c.name, c.id]);
    const hits = scan(rulesFor(names));
    expect(hits, `Country named outside countries.yaml:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no country code is compared against a country variable outside countries.yaml', () => {
    const hits = scanFiles(codeBranchHits);
    expect(hits, `Country-code branches:\n${hits.join('\n')}`).toEqual([]);
  });

  it('every listed term is caught by its own rule (positive test for the whole list, incl. non-ASCII terms)', () => {
    for (const t of caseInsensitiveTerms) {
      expect(scanText('fixture', `a ${t.toUpperCase()} b`, rulesFor([t])).length, t).toBe(1);
    }
    for (const t of caseSensitiveCodes) {
      expect(scanText('fixture', `price: ${t} 5`, rulesFor([t], true)).length, t).toBe(1);
      expect(scanText('fixture', `price: ${t.toLowerCase()} 5`, rulesFor([t], true)), t).toEqual([]);
    }
  });

  it('the new categories fail on realistic synthetic copy (fixtures live here, not in the game files)', () => {
    const fixtures: Array<[string, string]> = [
      ['city', 'Open a new floor in Mumbai'],
      ['city hub', "hub: 'Bangalore'"],
      ['demonym', 'They hired another Indian agent'],
      ['accent shorthand', 'The Indian accent training course'],
      ['currency name', 'Pay the rupee bonus'],
      ['currency symbol', 'cost: ₹500'],
      ['currency code', 'wage: 400 PLN'],
      ['language', 'Support in Hindi and Tamil'],
      ['spanish as national marker', 'Spanish speaking team'],
      ['native speaker', 'Only native speakers apply'],
      ['stereotype', 'cheap labor and a sweatshop'],
      ['food shorthand', 'curry lunch'],
      ['polish as a language', 'a Polish speaker joins'],
    ];
    for (const [name, text] of fixtures) expect(scanText('fixture', text, allRules).length, name).toBeGreaterThan(0);
  });

  it('ordinary English that shares letters with a blocked term does not fire', () => {
    const ok = [
      'Polish the UI before launch',
      'className="accent-sky-500"',
      '// Accent stripe',
      'const cop = 1; // crc checksum, ron the intern',
      'const r = rand() * 2;',
    ];
    for (const text of ok) expect(scanText('fixture', text, allRules), text).toEqual([]);
  });

  it('country-code branches fail on every spelling, and ordinary comparisons pass', () => {
    const bad = [
      'if (country === "in") {',
      "if (country === 'IN') {",
      'if (country == "PH") {',
      'if (countryId !== `vn`) {',
      'return "pl" === state.countryId;',
      "const isLatam = ['MX', 'CO', 'CR'].includes(country);",
    ];
    for (const line of bad) expect(codeBranchHits('fixture', line).length, line).toBe(1);
    const sw = 'switch (country) {\n  case "ke":\n    return 1;\n}';
    expect(codeBranchHits('fixture', sw).length).toBe(1);
    const good = ['if (country === selected) {', 'const label = "in";', 'if (mode === "in") {', 'switch (mode) {\n case "in":\n}'];
    for (const text of good) expect(codeBranchHits('fixture', text), text).toEqual([]);
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
