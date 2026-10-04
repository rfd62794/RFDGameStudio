# BPO Sim: a deterministic neutral-copy check, and the rewrite that makes the game pass it

**Depends on:** BPO_Sim_Repromote_And_Rename_Directive.md and BPO_Sim_Country_Data_Directive.md (the test reads `countries.yaml`; the folder comes from the rename)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/filipino_bpo_simulator/DIRECTION.md` ("Decision update 2026-10-04"), `examples/bpo-sim/src/utils/names.ts`, `examples/bpo-sim/src/components/IsometricOfficeCanvas.tsx` (lines 440-500),
`examples/bpo-sim/src/components/FacilitiesModal.tsx` (lines 30-75), `examples/bpo-sim/src/data/countries.yaml` (the country list the test reads).

## 1. Why this exists

BPO Sim is country-agnostic (Robert, 2026-10-04: "non-racist", countries differ only by neutral business attributes, no accent or language jokes, no caricature art or names, no national stereotyping in copy, characters or events, a diverse neutral cast). The Phase 2b build the demo now uses was written as a Philippine call center: currency is the peso sign, facilities are Metro Manila business parks,
snacks, perks and phrases are local brands and Tagalog, the ISPs are two Philippine carriers, a training course is "Accent Neutralization", the agent stat is `englishSkill`, the recruiting bios name two local employers and a university, and every agent avatar is drawn with one skin tone (`ctx.fillStyle = '#fed7aa'; // Pinoy skin tone`, `examples/bpo-sim/src/components/IsometricOfficeCanvas.tsx`).
This directive adds the deterministic check Robert asked for AND makes the game pass it, in one run (a check that fails on main cannot land alone).

Measured on the prepared build, with the blocklist below: **133 offending lines in 20 source files** (176 term hits against 81 blocked terms), plus the one-skin-tone avatar and the old name pool. Running the new test before any edit: `Test Files  1 failed (1)` / `Tests  3 failed | 2 passed (5)` (the term scan, the cast check, the avatar check fail; the blocklist-shape and country-branch checks pass). After the replacements below: `5 passed (5)`.

The check has two halves, both in one test file:
- **Blocklist** (`examples/bpo-sim/src/data/neutral-copy-blocklist.yaml`, a data file): national and place words, local brands, local-language words and currency, region-specific events, stereotype phrases, and the retired single-country name pool. Any hit in the game's shipped text, code or data fails the test and names `file:line`, the line and the term.
- **Country branches outside the data file**: the test reads every country name and id from `examples/bpo-sim/src/data/countries.yaml` and fails if any of them appears anywhere else in the shipped source (a country-specific `if`, a string, a comment). Countries may differ only through that file.

Facts you need (verified by running the prototype; do not re-derive):
- The test scans `examples/bpo-sim/src/**/*.ts(x)` (excluding `*.test.ts` and `data/countries.ts`), `examples/bpo-sim/index.html`, `examples/bpo-sim/metadata.json` and `ts/src/games/bpo_sim/config.ts`. Matching is case-insensitive and by whole word or phrase, so `onPlaceBuildItem` does not match `cebu` and Tailwind's `accent-sky-500` class does not match `accent coaching`.
- The example's own suite (3 files) and its own `tsc --noEmit` are unchanged by the rewrite: controller-run with a temporary junction, `Tests  22 passed (22)` and 0 type errors, before and after.
- This run needs `examples/bpo-sim/src/data/countries.yaml` from `BPO_Sim_Country_Data_Directive` and the folder from `BPO_Sim_Repromote_And_Rename_Directive`. If either is missing, STOP and write why in the Status row.

## 2. Scope

1. New `<!-- new: examples/bpo-sim/src/data/neutral-copy-blocklist.yaml -->` and new test `<!-- new: ts/tests/test_bpo_sim_neutral_copy.ts -->`.
2. The replacements below, in the example's source: every `examples/bpo-sim/src/**` file named in the table, plus `utils/names.ts` (arrays and four phrases), and the avatar palette in `components/IsometricOfficeCanvas.tsx`.

## 3. The work

Existing files are CRLF; keep their endings (the Edit tool preserves them). New files use CRLF too.

**Step 1: create the blocklist and the test** (exact content, so you can run the test and read its failures first):

```yaml
# new: examples/bpo-sim/src/data/neutral-copy-blocklist.yaml
#
# BPO Sim is country-agnostic. These words and phrases must not appear anywhere in the game's shipped text,
# code or data. ts/tests/test_bpo_sim_neutral_copy.ts reads this file and fails, naming the file, the line
# and the term, when one comes back. Terms are matched case-insensitively as whole words or phrases.
#
# Countries differ only through src/data/countries.yaml (neutral business attributes). The test also fails
# when the game's code or copy names a country outside that file.

version: 1

# Nationality labels, place names and national flags or colours.
national_and_place_terms:
  - filipino
  - filipina
  - pinoy
  - pinay
  - philippine
  - philippines
  - manila
  - metro manila
  - cebu
  - clark freeport
  - makati
  - ortigas
  - eastwood
  - bonifacio
  - taguig
  - quezon
  - libis
  - pasig
  - luzon
  - edsa
  - mrt
  - bgc

# Local brands, companies and institutions.
brand_terms:
  - jollibee
  - chickenjoy
  - kopiko
  - chippy
  - piattos
  - lucky me
  - pancit
  - siopao
  - sykes
  - convergys
  - ust
  - pldt
  - globe_corp
  - maxicare
  - intellicare
  - videoke

# Local-language words and local currency.
local_language_and_currency_terms:
  - tagalog
  - taglish
  - mabuhay
  - kape
  - sahod
  - peso
  - pesos
  - php
  - "₱"

# Region-specific events and legal terms that tie a game to one country.
region_specific_terms:
  - typhoon
  - 13th month

# Stereotypes and language or accent jokes. Country differences are business attributes only.
stereotype_terms:
  - cheap labor
  - cheap labour
  - third world
  - sweatshop
  - broken english
  - accent coaching
  - accent neutralization
  - english & accent
  - american english
  - rooster
  - englishskill

# Surnames and first names from the removed single-country name pool. The cast is a varied mix.
retired_cast_names:
  - dela cruz
  - bautista
  - villanueva
  - aquino
  - ocampo
  - soriano
  - mercado
  - navarro
  - salazar
  - valdez
  - paolo
  - jerome
  - alden
  - miggy
  - lester
  - maricar
  - sheena
  - princess
  - danica
  - roxanne
  - kathryn
```

```ts
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
```

Run `cd ts && npx vitest run test_bpo_sim_neutral_copy.ts` now: it fails and lists every `file:line` to fix. Work through the steps below until it passes.

**Step 2: the two global replacements** (use Grep for each token to find every place; keep numbers and spacing, change only the token):
- `₱` becomes `$`: every currency sign in every file (about 60 places); keep the numbers and spacing.
- `englishSkill` becomes `communicationSkill`: the stat field (types.ts, utils/gameData.ts, App.tsx, components/AgentModal.tsx, components/RecruitingModal.tsx).
(The currency stays plain "$" game dollars: amounts are unchanged. `englishSkill` becomes `communicationSkill` in the type, the data, the stat bars and the training effect; the old name tied a skill to a nationality.)

**Step 3: the per-file replacements** (each old text occurs exactly once in the file named; apply AFTER step 2, so currency signs already read `$`). Where a row shows Before and After blocks, the text spans lines:

**`examples/bpo-sim/src/App.tsx`**
- `text: 'Kape muna sa pantry! ☕',` becomes `text: 'Coffee break in the pantry! ☕',`

Before:
```
id: 'typhoon',
        title: '🌀 TYPHOON WARNING SIGNAL #3 ADVISORY',
        description: 'Heavy rains and EDSA flooding across Metro Manila! Transportation is halted. Graveyard shift agents need shelter and support.',
```
After:
```
id: 'storm',
        title: '⛈️ SEVERE STORM ADVISORY',
        description: 'Heavy rain and flooding across the city! Public transport is disrupted. Night shift agents need shelter and support.',
```

Before:
```
title: '🌐 PLDT SUBMARINE CABLE CUT ADVISORY',
        description: 'Undersea fiber cable hit by anchor off Luzon! Floor VoIP ping spiking to 450ms. Calls are dropping!',
```
After:
```
title: '🌐 NETWORK CARRIER OUTAGE ADVISORY',
        description: 'A main fiber cable was damaged by roadworks! Floor VoIP ping spiking to 450ms. Calls are dropping!',
```
- `effectDescription: 'Bandwidth rerouted through Globe & Starlink within 60 seconds!',` becomes `effectDescription: 'Bandwidth rerouted through the backup carrier and satellite within 60 seconds!',`

Before:
```
title: '🍕 JOLLIBEE & PIZZA SURPRISE SPONSORED',
        description: 'A satisfied US VIP caller sent 20 buckets of Chickenjoy and 15 Yellow Cab pizzas directly to the pantry!',
```
After:
```
title: '🍕 CLIENT LUNCH SURPRISE',
        description: 'A satisfied VIP caller sent 20 buckets of fried chicken and 15 pizzas directly to the pantry!',
```
- `if (skillType === 'english') updated.communicationSkill` becomes `if (skillType === 'communication') updated.communicationSkill`

**`examples/bpo-sim/src/components/BuildModal.tsx`**
- `name: 'Kopiko 3-in-1 Coffee Station',` becomes `name: 'Instant Coffee Station',`
- `description: 'The lifeblood of Philippine call center graveyard shift workers.',` becomes `description: 'The lifeblood of every night shift.',`
- `name: 'Pinoy Snack Vending Machine',` becomes `name: 'Snack Vending Machine',`
- `description: 'Stocked with Chippy, Piattos, Lucky Me Pancit Canton and cold drinks.',` becomes `description: 'Stocked with chips, instant noodles and cold drinks.',`

**`examples/bpo-sim/src/components/AgentModal.tsx`**
- `>English & Accent</span>` becomes `>Communication</span>`
- `<span>⚡</span> 3-in-1 Kopiko ($150)` becomes `<span>⚡</span> Energy Coffee ($150)`

**`examples/bpo-sim/src/components/FacilitiesModal.tsx`**

Before:
```
name: 'Eastwood City Cyberpark',
      city: 'Libis, Quezon City',
```
After:
```
name: 'Starter Office Park',
      city: 'Business district',
```
- `prestige: 'Birthplace of PH BPOs',` becomes `prestige: 'Where every operation begins',`
- `description: 'The historic pioneer BPO cyberpark in Metro Manila with 24/7 convenience stores and dining.',` becomes `description: 'A well-known outsourcing park with 24/7 convenience stores and dining.',`

Before:
```
name: 'Ortigas Center Corporate Tower',
      city: 'Pasig City (Emerald Ave / Julia Vargas)',
```
After:
```
name: 'Corporate Tower',
      city: 'Central business district',
```
- `prestige: 'Dense Metro Manila Hub',` becomes `prestige: 'Dense city hub',`
- `description: 'Strategic location near EDSA & MRT, huge applicant walk-in recruitment rate and faster ISP peering.',` becomes `description: 'Strategic location near major transit lines, a high walk-in applicant rate and faster ISP peering.',`

Before:
```
name: 'Bonifacio Global City (BGC) High Street',
      city: 'Taguig City',
```
After:
```
name: 'High Street Campus',
      city: 'Modern business quarter',
```

Before:
```
name: 'Cebu IT Park & Clark Multi-Site Mega Campus',
      city: 'Cebu City & Clark Freeport',
```
After:
```
name: 'Multi-Site Mega Campus',
      city: 'Two linked tech parks',
```
- `description: 'Multi-campus redundancy immune to regional power and typhoon disruptions. Enterprise level client trust.',` becomes `description: 'Multi-campus redundancy that rides out regional power and storm disruptions. Enterprise level client trust.',`
- `FACILITIES & METRO MANILA CYBERPARKS` becomes `FACILITIES & OFFICE PARKS`
- `Expand your call center footprint across premier Philippine IT corridors` becomes `Expand your call center footprint across premier technology parks`

**`examples/bpo-sim/src/components/HelpModal.tsx`**
- `HOW TO PLAY & PHILIPPINE BPO GUIDE` becomes `HOW TO PLAY & BPO GUIDE`
- `Grow your Philippine Business Process Outsourcing (BPO) call center into an enterprise powerhouse!` becomes `Grow your Business Process Outsourcing (BPO) call center into an enterprise powerhouse!`
- `<span>2. ☕ Energy, Stress & Kopiko 3-in-1</span>` becomes `<span>2. ☕ Energy, Stress & Coffee</span>`
- `Order Jollibee or Friday Videoke through <strong>HR</strong> to boost happiness!` becomes `Order a team lunch or a karaoke night through <strong>HR</strong> to boost happiness!`
- `Upgrade from basic PLDT fiber to Dual-Fiber Failover or Starlink to prevent submarine fiber outages.` becomes `Upgrade from basic fiber to Dual-Fiber Failover or a satellite backup to ride out carrier outages.`
- `Equip noise-cancelling Plantronics headsets to eliminate background rooster/traffic noises.` becomes `Equip noise-cancelling headsets to cut out background street noise.`
- `<span>4. 🏢 Expanding to BGC & Ortigas</span>` becomes `<span>4. 🏢 Expanding to bigger offices</span>`

Before:
```
Once you accumulate profits in <strong>$ (PHP)</strong>, expand from Eastwood City to Ortigas Center
                and Bonifacio Global City (BGC) to take on premium multi-million Fortune 500 contracts!
```
After:
```
Once you accumulate profits in <strong>$</strong>, expand from the Starter Office Park to the Corporate Tower
                and the High Street Campus to take on premium multi-million Fortune 500 contracts!
```

**`examples/bpo-sim/src/components/HRModal.tsx`**

Before:
```
id: 'jollibee',
      title: 'Jollibee Chickenjoy & Spaghetti Feast',
```
After:
```
id: 'feast',
      title: 'Fried Chicken & Spaghetti Feast',
```
- `description: 'The ultimate Pinoy comfort meal delivered straight to the pantry floor. Clears stress instantly!',` becomes `description: 'The ultimate comfort meal delivered straight to the pantry floor. Clears stress instantly!',`
- `description: 'Safe transport to/from MRT/EDSA for Graveyard shift employees during rain and late nights.',` becomes `description: 'Safe transport to and from the office for night shift employees during rain and late hours.',`

**`examples/bpo-sim/src/components/IsometricOfficeCanvas.tsx`**

Before:
```
    ctx.fillStyle = '#fed7aa'; // Pinoy skin tone
```
After:
```
    const skinTone = AVATAR_SKIN_TONES[Math.abs(agent.avatarSeed) % AVATAR_SKIN_TONES.length]; // varied avatar palette
    ctx.fillStyle = skinTone;
```

Before:
```
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(sx - 5
```
After:
```
      ctx.fillStyle = skinTone;
      ctx.fillRect(sx - 5
```

**`examples/bpo-sim/src/components/HRModal.tsx`**
- `description: 'Yellow Cab / Domino\'s box stack for agents handling peak queue surges.',` becomes `description: 'A tall stack of pizza boxes for agents handling peak queue surges.',`

Before:
```
id: 'videoke',
      title: 'Friday Videoke / Karaoke Night',
```
After:
```
id: 'karaoke',
      title: 'Friday Karaoke Night',
```
- `description: 'Birit sessions in the lounge! Unleashes the natural singing talent of your agents.',` becomes `description: 'Sing-along sessions in the lounge! Unleashes the natural singing talent of your agents.',`

**`examples/bpo-sim/src/components/ITSupportModal.tsx`**

Before:
```
id: 'PLDT_BASIC',
                  title: 'PLDT Enterprise Basic Fiber',
```
After:
```
id: 'BASIC_FIBER',
                  title: 'Enterprise Basic Fiber',
```
- `desc: 'Standard commercial fiber. Susceptible to occasional Luzon submarine fiber cuts.',` becomes `desc: 'Standard commercial fiber. Susceptible to occasional carrier outages.',`

Before:
```
id: 'GLOBE_CORP',
                  title: 'Globe Corporate Dedicated Leased Line',
```
After:
```
id: 'DEDICATED_LINE',
                  title: 'Corporate Dedicated Leased Line',
```
- `title: 'Dual-Fiber BGP Auto-Failover (PLDT + Globe)',` becomes `title: 'Dual-Fiber BGP Auto-Failover (two carriers)',`
- `desc: 'Completely immune to terrestrial fiber severed cables and typhoons. Zero downtime guarantee.',` becomes `desc: 'Completely immune to terrestrial fiber cuts and storms. Zero downtime guarantee.',`

**`examples/bpo-sim/src/components/RecruitingModal.tsx`**
- `'3 years voice account experience at Sykes/Convergys. Excellent customer rapport.',` becomes `'3 years of voice account experience at large call centers. Excellent customer rapport.',`
- `'Fresh Mass Comm graduate from UST. Fluent American English, high stamina.',` becomes `'Recent communications graduate. Clear, confident speaker with high stamina.',`
- `'Specializes in accent coaching, empathy statements, and compliance audits.'` becomes `'Specializes in call coaching, empathy statements, and compliance audits.'`

**`examples/bpo-sim/src/components/ScriptModal.tsx`**
- `title: 'Warm Pinoy Hospitality', desc: '"Mabuhay! Thank you for calling, my name is Mark! How can I make your day great?"',` becomes `title: 'Warm Welcome', desc: '"Hello and thank you for calling, my name is Mark! How can I make your day great?"',`

**`examples/bpo-sim/src/components/TrainingModal.tsx`**
- `skillType: 'english' | 'empathy' | 'tech' | 'speed', amount: number) => void;` becomes `skillType: 'communication' | 'empathy' | 'tech' | 'speed', amount: number) => void;`
- `  skillType: 'english' | 'empathy' | 'tech' | 'speed';` becomes `  skillType: 'communication' | 'empathy' | 'tech' | 'speed';`

Before:
```
id: 'accent',
      title: 'American & British Accent Neutralization',
      category: 'Language & Voice',
```
After:
```
id: 'communication',
      title: 'Clear Communication Workshop',
      category: 'Communication & Voice',
```
- `skillType: 'english',` becomes `skillType: 'communication',`
- `description: 'Phonetics coaching, tongue placement, intonation, and idiom comprehension for US/UK callers.',` becomes `description: 'Pacing, intonation, active listening and idiom comprehension for callers from any region.',`

**`examples/bpo-sim/src/components/WageModal.tsx`**
- `night differential, 13th month pay & HMO` becomes `night differential, year-end bonus & health plan`
- `3. HMO Health Card Tier (Maxicare / Intellicare)` becomes `3. Health Plan Tier`
- `name: 'No HMO',` becomes `name: 'No Health Plan',`
- `name: 'Basic (MBL $80k)',` becomes `name: 'Basic (up to $80k)',`
- `name: 'Silver (MBL $150k)',` becomes `name: 'Silver (up to $150k)',`
- `{/* 13th Month Pay Accrual Information */}` becomes `{/* Year-end bonus accrual information */}`
- `>13th Month Pay Statutory Reserve</span>` becomes `>Year-End Bonus Reserve</span>`

**`examples/bpo-sim/src/systems/dialerSystem.ts`**
- ` * Cost (in PHP) to upgrade the dialer` becomes ` * Cost (in game dollars) to upgrade the dialer`

**`examples/bpo-sim/src/types.ts`**
- `salary: number; // in PHP monthly` becomes `salary: number; // in game dollars, monthly`

Before:
```
payoutPerCall: number; // in PHP

```
After:
```
payoutPerCall: number; // in game dollars

```
- `money: number; // PHP` becomes `money: number; // game dollars`
- `officeLevel: number; // 1: Eastwood, 2: Ortigas, 3: BGC, 4: Cebu IT Park` becomes `officeLevel: number; // 1: Starter Office Park, 2: Corporate Tower, 3: High Street Campus, 4: Multi-Site Mega Campus`
- `ispProvider: 'PLDT_BASIC' | 'GLOBE_CORP' | 'DUAL_FIBER_FAILOVER' | 'STARLINK_REDUNDANT';` becomes `ispProvider: 'BASIC_FIBER' | 'DEDICATED_LINE' | 'DUAL_FIBER_FAILOVER' | 'STARLINK_REDUNDANT';`
- `payoutPerCall: number; // PHP earned per completed call` becomes `payoutPerCall: number; // game dollars earned per completed call`

**`examples/bpo-sim/src/components/RecruitingModal.tsx`**
- `askingSalary: number; // monthly PHP` becomes `askingSalary: number; // monthly, in game dollars`

**`examples/bpo-sim/src/utils/gameData.ts`**
- `payoutPerCall: 145, // PHP` becomes `payoutPerCall: 145, // game dollars`
- `ispProvider: 'GLOBE_CORP',` becomes `ispProvider: 'DEDICATED_LINE',`

**Step 4: the cast and the phrases (`examples/bpo-sim/src/utils/names.ts`).** Replace the three name arrays at the top of the file (everything above `export function getRandomName`) with exactly:
```ts
export const FIRST_NAMES_M = [
  'Marcus', 'Daniel', 'Amir', 'Kofi', 'Mateo', 'Liam', 'Hiroshi', 'Rohan',
  'Samuel', 'Andrei', 'Tomasz', 'Omar', 'Diego', 'Felix', 'Tariq', 'Ivan',
  'Jamal', 'Nikolai', 'Kwame', 'Jun', 'Rafael', 'Elias', 'Viktor', 'Dev'
];

export const FIRST_NAMES_F = [
  'Amara', 'Sofia', 'Priya', 'Mei', 'Isabel', 'Nadia', 'Chloe', 'Fatima',
  'Ingrid', 'Lucia', 'Zainab', 'Hannah', 'Anika', 'Camila', 'Yuki', 'Elena',
  'Grace', 'Leila', 'Mira', 'Thandi', 'Olivia', 'Sara', 'Aisha', 'Noor'
];

export const LAST_NAMES = [
  'Adeyemi', 'Nguyen', 'Kowalski', 'Fernandez', 'Patel', 'Okafor', 'Tanaka',
  'Silva', 'Ivanov', 'Haddad', 'Mensah', 'Costa', 'Lindqvist', 'Rahman',
  'Park', 'Moreau', 'Dubois', 'Castro', 'Zhang', 'Novak', 'Hassan', 'Mendes',
  'Kim', 'Popescu', 'Ndlovu', 'Rossi', 'Ortiz', 'Singh', 'Das', 'Abdi'
];
```
and replace these four lines in `CALL_CENTER_PHRASES`:
- `{ text: "Kape muna tayo sa pantry! ☕", icon: "☕" },` becomes `{ text: "Coffee break in the pantry! ☕", icon: "☕" },`
- `{ text: "Sahod day feels! Payout na! 💰", icon: "💰" },` becomes `{ text: "Payday feels good! 💰", icon: "💰" },`
- `{ text: "Order na ba tayo ng Jollibee Chickenjoy? 🍗", icon: "🍗" },` becomes `{ text: "Shall we order lunch for the floor? 🍗", icon: "🍗" },`
- `{ text: "Siopao & cold water break! 🥟", icon: "🥟" },` becomes `{ text: "Snack and cold water break! 🥟", icon: "🥟" },`

**Step 5: the avatar palette (`examples/bpo-sim/src/components/IsometricOfficeCanvas.tsx`).** Directly before the line `export const IsometricOfficeCanvas: React.FC<Props> = ({` add (with a blank line after it):
```ts
/** Varied avatar skin tones, picked per agent from avatarSeed. */
const AVATAR_SKIN_TONES = ['#f5d0b0', '#e8b98a', '#d99a6c', '#c68642', '#8d5524', '#6b4423'];
```
(the two `ctx.fillStyle` replacements for the head and the typing hands are in the Step 3 table, so every agent shows one of six tones and its hands match.)

## 4. What NOT to do

- Do not change gameplay: numbers, rules, `systems/*`, balance, ids that are not named in the table, or the structure of any component. Amounts stay as they are; only the currency sign changes.
- Do not add the country selector, country effects or any country name (the Selector directive does; the test would fail on a country name in the code).
- Do not weaken the test, shorten the blocklist, or edit the blocklist to make a term pass: fix the text instead. Do not add "country-specific" jokes or caricature back in any form.
- Do not touch `index.html` or `metadata.json` copy (already neutral from the Rename directive), `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json`, `ts/src/games/registry.ts`.
- No Lua, no engine changes, no deploys or builds, no protected repos, no player layer or cloud saves. Do not publish: Robert approves deploys after the local safe check.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

```
cd ts && npx vitest run test_bpo_sim_neutral_copy.ts test_bpo_sim_countries.ts test_bpo_sim_identity.ts
```
Real tail from the prototype of exactly these edits (with the Rename and Country Data directives in place): `Test Files  3 passed (3)` / `Tests  16 passed (16)` (the neutral-copy file has 5 tests).
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors.
Source checks (Grep tool, one call each, over `examples/bpo-sim/src`): pattern `₱` has no match; pattern `englishSkill` has no match; pattern `Pinoy|Philippine|Manila|Jollibee|typhoon` has no match.

Controller step, not this run: the example's own suite and type check with a temporary `node_modules` junction (real result on the prototype: `Tests  22 passed (22)`, 0 type errors), a skim of the new copy in a browser at 1280x720 and 390x844, and Robert's local safe check before any deploy.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts [<bare-filename>.ts]` (and `uv run pytest ...` where named below). Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use bare test filenames as filters (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index`, any `npm run build:*`, `vite-node`, or `git merge origin/main` (the sandbox refuses them).
- Match each file's existing line endings (the Edit tool preserves them); do not convert.
- `examples/` folders are AI Studio exports (untrusted code). New logic goes in small new modules; no file over 600 lines unless it already is (then do not grow it by more than the lines named here).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `neutral-copy-blocklist.yaml` and `test_bpo_sim_neutral_copy.ts` exist with the exact content above.
- [ ] Steps 2 to 5 are applied; `cd ts && npx vitest run test_bpo_sim_neutral_copy.ts test_bpo_sim_countries.ts test_bpo_sim_identity.ts` passes: 3 files, 16 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The test and the blocklist were not weakened; no gameplay number or rule changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed, the count of lines fixed (should match the measured 133), and whether any quoted old text differed from the file. Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then say plainly what was not run (the example's own suite and type check, a browser skim) and that nothing was published.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.
