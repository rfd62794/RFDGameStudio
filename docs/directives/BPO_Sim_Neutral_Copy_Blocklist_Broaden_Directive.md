# BPO Sim: broaden the neutral-copy guard to all twelve countries

**Depends on:** BPO_Sim_Neutral_Copy_Check_Directive.md (merged: PR #165). This run edits the two files that directive created.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/tests/test_bpo_sim_neutral_copy.ts`, `examples/bpo-sim/src/data/neutral-copy-blocklist.yaml`, `examples/bpo-sim/src/data/countries.yaml` (the 12 countries).

## 1. Why this exists

Robert (2026-10-04): BPO Sim must be non-racist and country-agnostic for ALL twelve countries in `countries.yaml` (Philippines, India, Malaysia, Vietnam, Poland, Romania, Egypt, South Africa, Kenya, Colombia, Mexico, Costa Rica), and AI-written content will keep growing, so the guard has to be broad and generic, not a Philippines-only list.

PR #165's guard works, but a reviewer proved three gaps on main: the blocklist (6 categories, about 105 terms) names Philippines terms only, so `Mumbai`, `Indian accent` and `country === "in"` all pass undetected; and the country check matches full names and ids only (`india`, `Philippines`), not ISO codes.

Measured by the author on `origin/main` (71e9b4a0) in a scratch worktree, before and after the change below:

- Baseline, the merged test: `Test Files  1 passed (1)` / `Tests  5 passed (5)`.
- The new test plus the new blocklist (the exact content in section 3): `Test Files  1 passed (1)` / `Tests  10 passed (10)`. The real tree is already clean against the broad list, so **no game string needs rewriting**. Current-tree sweep (word-boundary, case-insensitive) for `accent|curry|exotic|jugaad|chai|bollywood|native speaker|polish|rand|dong|leu|lei|kes|colon|spanish|tico|malay|pune|delhi|pound|shilling|hindi|arabic` found only: `App.tsx:551` (`{/* BUILD - Green Accent Button ... */}`), `IsometricOfficeCanvas.tsx:243` (`// Accent stripe`), and Tailwind `accent-sky-500` / `accent-amber-400` classes in `DialerControlModal.tsx:88` and `WageModal.tsx:98,124`. All are the colour word "accent", not a stereotype. So bare `accent` is deliberately NOT blocklisted; only stereotype phrases are (`heavy accent`, `accent training`, `native speaker`, ...), and a nationality plus "accent" is caught by the nationality term. No `INR|MYR|VND|PLN|RON|EGP|ZAR|KES|COP|MXN|CRC|₹|₫|zł` appears anywhere in the shipped sources.
- With the NEW test and the OLD blocklist (proves the new rules bite): `Tests  2 failed | 8 passed (10)`: `the blocklist file lists terms in every category` (the file lacks the 6 new categories) and `the new categories fail on realistic synthetic copy` with `city: expected 0 to be greater than 0` (so `Mumbai` slipped through the old list).
- `cd ts && npx tsc --noEmit`: 4 errors, all pre-existing and identical before and after (`Cannot find module '../games/game-metadata.json'` in `src/arcade/GameDetailView.tsx`, `src/arcade/GameSelector.tsx`, `tests/test_arcade_hover_preview.ts`, `tests/test_arcade_metadata_expansion.ts`; the generated metadata file is not in a fresh checkout). Zero errors mention bpo.

## 2. Scope

1. `examples/bpo-sim/src/data/neutral-copy-blocklist.yaml`: append six categories (demonyms, cities and hubs, currency names and symbols, languages, stereotype phrases, case-sensitive currency codes). Existing categories are untouched.
2. `ts/tests/test_bpo_sim_neutral_copy.ts`: replace the helper and test block with the version below (case-sensitive code rules, a pure `scanText`, the country-code branch check, positive fixtures). The last three tests of the file (the cast check and the avatar check, plus the closing `});`) stay exactly as they are.

Nothing else. No game file changes (the current tree is already clean; see section 1).

## 3. The work

**Step 1: append to the blocklist.** Append this to the END of `examples/bpo-sim/src/data/neutral-copy-blocklist.yaml` (after the `retired_cast_names` list). Line endings of these two files do not matter (git normalises them).

```yaml
# ---- Added by the broaden directive: all twelve countries, not only the first one. ----

# Demonyms and nationality or ethnicity shorthand for every country in countries.yaml.
# Bare "polish" is NOT listed (it is also an ordinary English verb); only its unambiguous phrases are.
demonym_terms:
  - indian
  - indians
  - desi
  - malaysian
  - malaysians
  - vietnamese
  - polish people
  - polish speaker
  - polish speakers
  - romanian
  - romanians
  - egyptian
  - egyptians
  - south african
  - south africans
  - kenyan
  - kenyans
  - colombian
  - colombians
  - mexican
  - mexicans
  - costa rican
  - costa ricans
  - tico
  - ticos
  - tica
  - ticas
  - latino
  - latina
  - latinos
  - hispanic
  - latam

# Major cities and BPO hubs. Spellings with and without diacritics.
city_and_hub_terms:
  - mumbai
  - bombay
  - bangalore
  - bengaluru
  - pune
  - hyderabad
  - chennai
  - madras
  - gurgaon
  - gurugram
  - noida
  - delhi
  - new delhi
  - kolkata
  - kuala lumpur
  - penang
  - cyberjaya
  - ho chi minh
  - saigon
  - hanoi
  - da nang
  - krakow
  - kraków
  - wroclaw
  - wrocław
  - warsaw
  - katowice
  - bucharest
  - cluj
  - cairo
  - cape town
  - johannesburg
  - durban
  - pretoria
  - nairobi
  - mombasa
  - medellin
  - medellín
  - bogota
  - bogotá
  - barranquilla
  - monterrey
  - guadalajara
  - mexico city
  - tijuana
  - san jose
  - san josé
  - heredia
  - davao
  - bacolod
  - iloilo

# Local currency names and symbols. Ambiguous English words ("pound", "shilling", "rand", "leu", "colon") are
# not listed bare; the three-letter codes live in case_sensitive_codes below.
currency_terms:
  - rupee
  - rupees
  - ringgit
  - dong
  - zloty
  - złoty
  - zlotys
  - romanian leu
  - egyptian pound
  - south african rand
  - kenyan shilling
  - kenya shillings
  - colombian peso
  - mexican peso
  - costa rican colon
  - colón
  - colones
  - "₹"
  - "₫"
  - "zł"

# National languages. "spanish" is listed as a language NAME only; ordinary Spanish words such as "peso" are
# covered separately and no other Spanish vocabulary is blocked.
language_terms:
  - hindi
  - tamil
  - telugu
  - bengali
  - marathi
  - punjabi
  - urdu
  - malay
  - bahasa
  - romanian
  - arabic
  - afrikaans
  - zulu
  - xhosa
  - swahili
  - kiswahili
  - spanish
  - castellano
  - español
  - polish language
  - vietnamese language

# More stereotype shorthand: accents, "native speaker" framing, food and culture shorthand, call-centre jokes.
# Bare "accent" is NOT listed (the game's own code uses Tailwind's accent-* classes and "Accent" in comments).
stereotype_phrase_terms:
  - heavy accent
  - thick accent
  - strong accent
  - foreign accent
  - accent reduction
  - accent training
  - accent neutral
  - native speaker
  - native speakers
  - native english
  - exotic
  - curry
  - jugaad
  - chai wallah
  - bollywood
  - do the needful
  - kindly revert
  - low cost country
  - low-cost labor
  - low-cost labour
  - offshore labor
  - offshore labour

# Three-letter currency codes. Matched CASE-SENSITIVELY as whole words (so "cop", "ron", "crc" the checksum
# in lower case, and "kes" do not fire, only the upper-case code).
case_sensitive_codes:
  - INR
  - MYR
  - VND
  - PLN
  - RON
  - EGP
  - ZAR
  - KES
  - COP
  - MXN
  - CRC
  - PHP
```

Judgement calls already made in that content, do not revisit: bare `polish`, `rand`, `pound`, `shilling`, `leu`, `colon`, `cop`, `ron`, `crc`, `kes` and bare `accent` are NOT listed as case-insensitive words, because they are ordinary English words, names, code identifiers or colour terms; the three-letter currency codes are matched upper-case only (`case_sensitive_codes`). `spanish` is blocked only as a language NAME (a national marker); no other Spanish vocabulary is blocked, so ordinary Spanish words in copy are never flagged by this list beyond the pre-existing `peso`/`pesos`. Non-ASCII terms (`₹`, `złoty`, `kraków`) are matched as plain substrings, ASCII terms as whole words, via the existing `termRegex` rule.

**Step 2: replace the test.** In `ts/tests/test_bpo_sim_neutral_copy.ts`, keep the header (imports, `REPO`, `SRC`, `listSource`, `blocklist`, `countries`, `SCANNED`) and keep the last two `it(...)` blocks (`the cast is a varied mix...`, `agent avatars use a varied palette...`) with the closing `});`. Everything from `function termRegex` down to just before `it('the cast is a varied mix` (including the old `scan`, the old `allTerms` line and the `describe(` line with its first three `it` blocks) is replaced by exactly this (it ends with the new `describe(` opening and its tests; the file then continues with the existing cast test):

```ts
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
    expect(caseInsensitiveTerms.length + caseSensitiveCodes.length).toBeGreaterThan(250);
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
```

**Step 3: the rules the new test enforces**

- Every term in the yaml is caught by its own rule (generated positive test; a typo, a bad regex escape or a non-ASCII term that fails to match breaks it).
- Country codes: ISO-2 and ISO-3 for all twelve countries (`ph phl in ind my mys vn vnm pl pol ro rou eg egy za zaf ke ken co col mx mex cr cri`), as quoted literals (single, double or backtick quotes, any case), compared with `===`, `!==`, `==` or `!=` against any identifier containing `country` (either side), inside an array literal followed by `.includes(country...)`, or as a `case` label of a `switch` on such a variable. Quoted codes that are not compared to a country variable (`const label = "in"`, `mode === "in"`) pass.
- The scan covers the same `SCANNED` file list as before, which excludes `data/countries.ts` (the data reader) by design; `countries.yaml` is not a scanned file.

## 4. What NOT to do

- Do not weaken, delete or skip any test or term. Do not shorten the blocklist.
- Do not remove or reword the existing six categories; do not rename `retired_cast_names`.
- Do not add bare `accent`, `polish`, `rand`, `pound`, `colon`, `cop`, `ron`, `crc`, `leu` or `kes` as case-insensitive terms (they break real code or colour classes); do not add a skip list or an allow-list to hide a hit. If a real hit ever appears in the game, rewrite the string neutrally (none exists today).
- Do not edit any game file under `examples/bpo-sim/src/` other than the blocklist yaml, `ts/src/games/bpo_sim/config.ts`, `index.html` or `metadata.json`. Do not touch `countries.yaml` or `countries.ts`.
- Do not write the synthetic fixtures into any game or data file; they live inside the test only.
- No new dependency; no build, `vite-node` or `uv run` command; no extra scripts.

## 5. Verification

Run, one per call, from the repo root (the worktree):

1. `cd ts && npx vitest run test_bpo_sim_neutral_copy.ts` expects `Test Files  1 passed (1)` and `Tests  10 passed (10)`.
2. `cd ts && npx tsc --noEmit` expects exactly the 4 pre-existing `game-metadata.json` errors listed in section 1 and no error mentioning bpo or the test file.
3. `git status --short` expects exactly two modified files: the blocklist yaml and the test.
4. `git diff --stat` for the log line.

Real tail of the author's run of command 1 (after):

```
 ✓ tests/test_bpo_sim_neutral_copy.ts (10 tests) 124ms

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

Real tail of command 1 with the new test and the OLD blocklist (for reference only; do not reproduce):

```
 × test_bpo_sim_neutral_copy > the blocklist file lists terms in every category
   → expected [ 'brand_terms', …(5) ] to deeply equal [ 'brand_terms', …(11) ]
 × test_bpo_sim_neutral_copy > the new categories fail on realistic synthetic copy (fixtures live here, not in the game files)
   → city: expected 0 to be greater than 0
 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
```

Real tail of command 2 (identical before and after):

```
src/arcade/GameDetailView.tsx(3,26): error TS2307: Cannot find module '../games/game-metadata.json' or its corresponding type declarations.
src/arcade/GameSelector.tsx(8,26): error TS2307: Cannot find module '../games/game-metadata.json' or its corresponding type declarations.
tests/test_arcade_hover_preview.ts(6,26): error TS2307: Cannot find module '../src/games/game-metadata.json' or its corresponding type declarations.
tests/test_arcade_metadata_expansion.ts(11,26): error TS2307: Cannot find module '../src/games/game-metadata.json' or its corresponding type declarations.
```

If command 1 reports a real hit in the game (a `file:line` list), do NOT add a skip: rewrite that one string neutrally, re-run, and name it in the Status log. If a tail differs for any other reason, STOP and write why in the Status row.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line `cd ts && npx vitest run test_bpo_sim_neutral_copy.ts`. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and content you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run ...`, `npm run build:*`, `vite-node`, or `git merge origin/main` (the sandbox refuses them).
- `examples/` folders are AI Studio exports (untrusted code); this run changes only the blocklist data file and the test.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge. If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The blocklist yaml has the six new categories with the exact content above, and the existing six categories are unchanged.
- [ ] The test file has the exact new block above plus the unchanged cast and avatar tests.
- [ ] `cd ts && npx vitest run test_bpo_sim_neutral_copy.ts` passes: 1 file, 10 tests (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] `git status --short` lists only the two files; no game file changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

`cd ts && npx vitest run test_bpo_sim_neutral_copy.ts`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`. Nothing else.

## 8. Report

Findings first: the two files changed, and whether any real hit in the game turned up (expected none). Evidence second: real tails of the vitest and `tsc --noEmit` commands. Then say plainly what was not run (the example's own suite, a browser skim) and that nothing was published.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts`; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-bpo-sim-neutral-copy-blocklist-br-125fb6 |
| Base branch | - |
| Base commit | 4930b0d3fa8acaed7a74dae8b12172507430344d |

**Status log**
- 2026-10-04 16:23 · robert-claude-laptop · none → Queued
- 2026-10-04 16:24 · robert-claude-laptop · Queued → Approved — lint override: author ran baseline+after proofs; Robert 2026-10-04 BPO Sim non-racist direction; lint FP fixes merged in AgentFlow #534
- 2026-10-04 17:05 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-bpo-sim-neutral-copy-blocklist-br-125fb6; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
