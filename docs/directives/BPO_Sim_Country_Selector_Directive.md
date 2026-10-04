# BPO Sim: a start-screen country selector, and a real effect for each country attribute

**Depends on:** BPO_Sim_Neutral_Copy_Check_Directive.md (edits the same files), BPO_Sim_Country_Data_Directive.md (the YAML), BPO_Sim_Repromote_And_Rename_Directive.md (the folder)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/bpo_sim/DIRECTION.md` ("Decision update 2026-10-04"), `examples/bpo-sim/src/data/countries.ts`, `examples/bpo-sim/src/data/countries.yaml` (header comment),
`examples/bpo-sim/src/systems/dialerSystem.ts`, `examples/bpo-sim/src/App.tsx` (lines 90-110, 165-200, 250-260, 450-460, 1030-1050), `examples/bpo-sim/src/components/RecruitingModal.tsx` (lines 1-30 and 66-95).

## 1. Why this exists

Robert's decision (2026-10-04, recorded in `docs/demos/bpo_sim/DIRECTION.md`, "Decision update"): BPO Sim opens with a start-screen country selector driven by a YAML data file, with BPO-heavy countries as the choices. Countries must differ ONLY through neutral business attributes. This directive builds the selector and gives each of the six attributes
a real, small effect in the sim, so the choice matters. The data (`countries.yaml`), the name and the neutral copy are the three earlier BPO Sim directives; the neutral-copy test (`ts/tests/test_bpo_sim_neutral_copy.ts`) also guards this one: no country name may appear outside the YAML file, so the code below contains no country-specific branch.

**What each attribute does (first-pass numbers, not balance-tested; every formula is a small pure function in the new `systems/countrySystem.ts`):**

| Attribute (`countries.yaml`) | Effect in the sim | Formula |
|---|---|---|
| `clientOverlap` | share of calls that connect | `contactWindowFactor = 0.6 + 0.4 * overlap` (0.6 to 1), a new optional 4th argument of `computeCallGenerationRate` (default 1, so the existing 22 tests are unchanged) |
| `regulatoryOverhead` | share of each completed call's payout lost to compliance | `netPayout = payout * (1 - overhead)` |
| `laborCostIndex` | what candidates ask for (and so the signing bonus, a share of the salary) | `scaleSalary = round(base * index)` |
| `talentPoolIndex` | how many candidates the recruiting screen offers | `candidateCount = clamp(round(6 * index), 2, 10)` (6 was the old fixed number) |
| `connectivityRisk` | how often the network-outage floor event comes up | weight `risk / 0.14` for the outage in a weighted event draw (the other events keep weight 1) |
| `attritionRate` | agents resigning at day end | each agent leaves with probability `rate / 30` per day; the floor never empties (one agent always stays); a line on the After-Hours screen names who left |

Before a country is chosen (and in tests) a `NEUTRAL_PROFILE` with every effect switched off is used, so nothing changes by accident. The simulation does not tick until a country is chosen; the choice is saved in `localStorage` (`bpo_country`) and Settings > reset asks again.

Facts you need (verified by running the prototype; do not re-derive):
- The example is a Vite app: `countries.yaml` is imported with `?raw` through a one-line module (`data/countriesData.ts`) plus a type declaration (`src/raw.d.ts`); there is no YAML library, and `data/countries.ts` (earlier directive) has the validated reader. A ts test must not import `countriesData.ts` or any `.tsx` file of the example: the `ts` package type-check cannot resolve `react` from there and would gain errors. The tests below read the YAML from disk and import only pure modules.
- Baseline on the prepared build with the earlier BPO Sim directives merged: the example's own suite `Tests  22 passed (22)` and `tsc --noEmit` 0 errors; `cd ts && npx tsc --noEmit` prints 4 errors, all `Cannot find module '.../game-metadata.json'`.
- This run needs `examples/bpo-sim/src/data/countries.ts` and `countries.yaml` (Country Data directive) and the neutral copy (Neutral Copy directive: it edits the same `App.tsx`, `RecruitingModal.tsx` and `AfterHoursView.tsx`). If either file is missing, STOP and write why in the Status row.

## 2. Scope

All paths to files in the app are relative to `examples/bpo-sim/src/` unless stated otherwise.

1. New files: `<!-- new: examples/bpo-sim/src/systems/countrySystem.ts -->`, `<!-- new: examples/bpo-sim/src/data/countriesData.ts -->`, `<!-- new: examples/bpo-sim/src/raw.d.ts -->`, `<!-- new: examples/bpo-sim/src/components/CountrySelectScreen.tsx -->`, `<!-- new: ts/tests/test_bpo_sim_country_effects.ts -->`.
2. Edits: `examples/bpo-sim/src/systems/dialerSystem.ts`, `examples/bpo-sim/src/components/RecruitingModal.tsx`, `examples/bpo-sim/src/components/AfterHoursView.tsx`, `examples/bpo-sim/src/App.tsx`, and one sentence in `ts/src/games/bpo_sim/config.ts`.

## 3. The work

Existing files are CRLF; keep their endings. New files use CRLF too. The diffs are the exact prototype changes (context lines unchanged).

**Step 1: the pure module.** Create `examples/bpo-sim/src/systems/countrySystem.ts` with exactly:

```ts
// new: examples/bpo-sim/src/systems/countrySystem.ts
import type { Agent } from '../types';
import type { CountryAttribute, CountryProfile } from '../data/countries';
import { ATTRIBUTE_RANGES, COUNTRY_ATTRIBUTES } from '../data/countries';

/**
 * Stand-in profile used before a country is chosen: every effect is switched off.
 * It is not listed in countries.yaml and never shown to the player as a choice.
 */
export const NEUTRAL_PROFILE: CountryProfile = {
  id: 'neutral',
  name: 'Standard operation',
  region: 'Anywhere',
  blurb: 'Baseline numbers with no country effects.',
  laborCostIndex: 1,
  talentPoolIndex: 1,
  clientOverlap: 1,
  connectivityRisk: 0.14,
  attritionRate: 0,
  regulatoryOverhead: 0,
};

/** The outage chance the event table was written with. A country at this value sees outages as often as before. */
export const BASELINE_CONNECTIVITY_RISK = 0.14;
/** Candidates the recruiting screen offered before countries existed. */
export const BASE_CANDIDATE_COUNT = 6;
/** The yearly attrition rate is spread over this many working days to get a daily chance. */
export const ATTRITION_DAYS = 30;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Share of calls that still connect when little of the day overlaps with the client: between 0.6 and 1. */
export function contactWindowFactor(clientOverlap: number): number {
  return 0.6 + 0.4 * clamp(clientOverlap, 0, 1);
}

/** Payout per completed call after compliance work takes its share. */
export function netPayout(payout: number, regulatoryOverhead: number): number {
  return payout * (1 - clamp(regulatoryOverhead, 0, 0.5));
}

/** What a candidate asks for in this country (the signing bonus follows, it is a share of the salary). */
export function scaleSalary(baseSalary: number, laborCostIndex: number): number {
  return Math.round(baseSalary * laborCostIndex);
}

/** How many candidates the recruiting screen offers. Baseline is the original six. */
export function candidateCount(talentPoolIndex: number): number {
  return clamp(Math.round(BASE_CANDIDATE_COUNT * talentPoolIndex), 2, 10);
}

/** Weight of a floor event in the random draw: the network outage follows the country's connectivity risk, the rest stay at 1. */
export function eventWeight(eventId: string, connectivityRisk: number): number {
  return eventId === 'fiber_cut' ? connectivityRisk / BASELINE_CONNECTIVITY_RISK : 1;
}

/** Weighted pick. `rng` returns a number in [0, 1). */
export function pickWeighted<T extends { id: string }>(items: ReadonlyArray<T>, weightOf: (id: string) => number, rng: () => number): T {
  const weights = items.map((i) => Math.max(0, weightOf(i.id)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Chance that one agent resigns at the end of a day. */
export function dailyQuitChance(attritionRate: number): number {
  return clamp(attritionRate, 0, 1) / ATTRITION_DAYS;
}

/** Day-end turnover. The floor never empties: at least one agent always stays. */
export function applyAttrition(agents: ReadonlyArray<Agent>, attritionRate: number, rng: () => number): { stayed: Agent[]; left: Agent[] } {
  const chance = dailyQuitChance(attritionRate);
  const stayed: Agent[] = [];
  const left: Agent[] = [];
  for (const a of agents) {
    if (rng() < chance) left.push(a);
    else stayed.push(a);
  }
  if (stayed.length === 0 && left.length > 0) stayed.push(left.shift() as Agent);
  return { stayed, left };
}

export type AttributeLevel = 'Low' | 'Medium' | 'High';

/** Plain-word level for a card: the lower, middle or upper third of the attribute's allowed range. */
export function attributeLevel(key: CountryAttribute, value: number): AttributeLevel {
  const [min, max] = ATTRIBUTE_RANGES[key];
  const t = (value - min) / (max - min);
  return t < 1 / 3 ? 'Low' : t < 2 / 3 ? 'Medium' : 'High';
}

export interface AttributeRow {
  key: CountryAttribute;
  label: string;
  level: AttributeLevel;
}

export const ATTRIBUTE_LABELS: Record<CountryAttribute, string> = {
  laborCostIndex: 'Labor cost',
  talentPoolIndex: 'Talent pool',
  clientOverlap: 'Overlap with client hours',
  connectivityRisk: 'Outage risk',
  attritionRate: 'Staff turnover',
  regulatoryOverhead: 'Compliance overhead',
};

/** The six rows a country card shows, in plain words. */
export function attributeRows(profile: CountryProfile): AttributeRow[] {
  return COUNTRY_ATTRIBUTES.map((key) => ({ key, label: ATTRIBUTE_LABELS[key], level: attributeLevel(key, profile[key]) }));
}
```

**Step 2: data module and type declaration.** Create `examples/bpo-sim/src/data/countriesData.ts` with exactly:

```ts
// new: examples/bpo-sim/src/data/countriesData.ts
import raw from './countries.yaml?raw';
import { loadCountries } from './countries';

/** The countries the player can choose from, read once from countries.yaml. */
export const COUNTRIES = loadCountries(raw);
```

and `examples/bpo-sim/src/raw.d.ts` with exactly:

```ts
// new: examples/bpo-sim/src/raw.d.ts
declare module '*?raw' {
  const content: string;
  export default content;
}
```

**Step 3: the selector screen.** Create `examples/bpo-sim/src/components/CountrySelectScreen.tsx` with exactly:

```tsx
// new: examples/bpo-sim/src/components/CountrySelectScreen.tsx
import React from 'react';
import type { CountryProfile } from '../data/countries';
import { attributeRows } from '../systems/countrySystem';

interface Props {
  countries: ReadonlyArray<CountryProfile>;
  onChoose: (countryId: string) => void;
}

/** Shown before the first shift. Every country has strengths and trade-offs; there is no wrong choice. */
export const CountrySelectScreen: React.FC<Props> = ({ countries, onChoose }) => (
  <div
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-4 sm:p-8 text-slate-100"
    data-testid="country-select"
  >
    <div className="mx-auto max-w-5xl">
      <h1 className="font-pixel text-sm sm:text-base text-sky-300 tracking-wide">CHOOSE WHERE YOUR OPERATION RUNS</h1>
      <p className="mt-2 text-xs sm:text-sm text-slate-300">
        Every location has strengths and trade-offs. Pick the one that suits how you want to play; you can start over from Settings to try another.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {countries.map((c) => (
          <button
            key={c.id}
            onClick={() => onChoose(c.id)}
            className="text-left rounded-xl border-2 border-slate-700 bg-slate-900 p-4 hover:border-sky-400 hover:bg-slate-800 transition cursor-pointer"
            data-testid={`country-${c.id}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold text-sky-300">{c.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{c.region}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-snug">{c.blurb}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {attributeRows(c).map((row) => (
                <div key={row.key} className="flex justify-between gap-2">
                  <dt className="text-slate-400">{row.label}</dt>
                  <dd className="font-semibold text-slate-100">{row.level}</dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>
    </div>
  </div>
);
```

**Step 4: wire the effects.**

```diff
--- a/examples/bpo-sim/src/systems/dialerSystem.ts
+++ b/examples/bpo-sim/src/systems/dialerSystem.ts
@@ -22,6 +22,7 @@ export function computeSafePace(availableAgents: number): number {
  * - list.purity / list.freshness: lead quality, 0-100
  * - list.volume: remaining leads; cannot generate more calls than this
  * - availableAgents: idle agents that can take calls; sets the safe pace ceiling
+ * - contactFactor: share of calls that still connect given the country's overlap with client hours (1 = no effect)
  *
  * Behavior:
  * - At or below safe pace, generated calls = dialer.pace * quality factor.
@@ -33,6 +34,7 @@ export function computeCallGenerationRate(
   dialer: DialerConfig,
   list: LeadList,
   availableAgents: number,
+  contactFactor = 1,
 ): number {
   const safePace = computeSafePace(availableAgents);
   const excess = Math.max(0, dialer.pace - safePace);
@@ -41,7 +43,7 @@ export function computeCallGenerationRate(
     dialer.pace <= safePace ? dialer.pace : Math.max(0, safePace - excess * 0.5);
 
   const qualityFactor = (list.purity / 100) * (list.freshness / 100);
-  const rawCalls = effectivePace * qualityFactor * (1 + (dialer.tier - 1) * 0.1);
+  const rawCalls = effectivePace * qualityFactor * (1 + (dialer.tier - 1) * 0.1) * contactFactor;
 
   return Math.max(0, Math.floor(Math.min(list.volume, rawCalls)));
 }
```

```diff
--- a/examples/bpo-sim/src/components/RecruitingModal.tsx
+++ b/examples/bpo-sim/src/components/RecruitingModal.tsx
@@ -2,12 +2,16 @@ import React, { useState } from 'react';
 import { Agent, AgentRole, ShiftType } from '../types';
 import { getRandomName } from '../utils/names';
 import { sounds } from '../utils/audio';
+import { candidateCount, scaleSalary } from '../systems/countrySystem';
 
 interface Props {
   isOpen: boolean;
   onClose: () => void;
   money: number;
   availableDesksCount: number;
+  /** Country effects: pay scale and how many candidates apply (1 = baseline). */
+  laborCostIndex?: number;
+  talentPoolIndex?: number;
   onHireAgent: (candidate: Omit<Agent, 'id' | 'deskId' | 'gridX' | 'gridY'>) => void;
 }
 
@@ -31,6 +35,8 @@ export const RecruitingModal: React.FC<Props> = ({
   onClose,
   money,
   availableDesksCount,
+  laborCostIndex = 1,
+  talentPoolIndex = 1,
   onHireAgent,
 }) => {
   const [candidates, setCandidates] = useState<Candidate[]>(() => generateInitialCandidates());
@@ -70,7 +76,7 @@ export const RecruitingModal: React.FC<Props> = ({
       ]
     };
 
-    return Array.from({ length: 6 }).map((_, i) => {
+    return Array.from({ length: candidateCount(talentPoolIndex) }).map((_, i) => {
       const { name, gender } = getRandomName();
       const role = roles[i % roles.length];
       const shift = shifts[Math.floor(Math.random() * shifts.length)];
@@ -85,7 +91,7 @@ export const RecruitingModal: React.FC<Props> = ({
         role,
         shift,
         experienceYears: exp,
-        askingSalary: baseSal + exp * 1500,
+        askingSalary: scaleSalary(baseSal + exp * 1500, laborCostIndex),
         communicationSkill: 65 + Math.floor(Math.random() * 30),
         empathySkill: 60 + Math.floor(Math.random() * 35),
         techSkill: role === 'TSR' || role === 'IT' ? 85 + Math.floor(Math.random() * 12) : 50 + Math.floor(Math.random() * 35),
```

```diff
--- a/examples/bpo-sim/src/components/AfterHoursView.tsx
+++ b/examples/bpo-sim/src/components/AfterHoursView.tsx
@@ -9,6 +9,8 @@ interface Props {
   activeList: LeadList;
   upgradeCost: number;
   lastVerdict: DayVerdict | null;
+  /** Names of agents who resigned at the end of this day. */
+  departures?: string[];
   onUpgradeDialer: () => void;
   onRequestNewList: () => void;
   onStartNextDay: () => void;
@@ -48,6 +50,7 @@ export const AfterHoursView: React.FC<Props> = ({
   activeList,
   upgradeCost,
   lastVerdict,
+  departures = [],
   onUpgradeDialer,
   onRequestNewList,
   onStartNextDay,
@@ -70,6 +73,12 @@ export const AfterHoursView: React.FC<Props> = ({
         </div>
       </div>
 
+      {departures.length > 0 && (
+        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4 text-xs text-slate-300" data-testid="departures">
+          Left the team today: {departures.join(', ')}. Hiring more agents keeps the floor staffed.
+        </div>
+      )}
+
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
           <div className="text-sm font-semibold text-slate-200 mb-2">
```

```diff
--- a/examples/bpo-sim/src/App.tsx
+++ b/examples/bpo-sim/src/App.tsx
@@ -31,6 +31,10 @@ import {
   applyDialerUpgrade,
 } from './systems/dialerSystem';
 import { createQuota, updateProgress, resetDay, getDayVerdict } from './systems/quotaSystem';
+import { COUNTRIES } from './data/countriesData';
+import { findCountry } from './data/countries';
+import { CountrySelectScreen } from './components/CountrySelectScreen';
+import { NEUTRAL_PROFILE, contactWindowFactor, netPayout, eventWeight, pickWeighted, applyAttrition } from './systems/countrySystem';
 
 import { IsometricOfficeCanvas } from './components/IsometricOfficeCanvas';
 import { AfterHoursView } from './components/AfterHoursView';
@@ -100,6 +104,18 @@ export default function App() {
   const [hrPolicy, setHrPolicy] = useState<HRPolicy>(INITIAL_HR_CONFIG);
   const [officeLevel, setOfficeLevel] = useState<number>(1);
 
+  // Country: chosen on the first screen, remembered between visits
+  const [countryId, setCountryId] = useState<string | null>(() => {
+    try {
+      const saved = localStorage.getItem('bpo_country');
+      return COUNTRIES.some(c => c.id === saved) ? saved : null;
+    } catch (e) {
+      return null;
+    }
+  });
+  const profile = findCountry(COUNTRIES, countryId) ?? NEUTRAL_PROFILE;
+  const [departures, setDepartures] = useState<string[]>([]);
+
   // Phase 1 core systems: List, Dialer, Quota
   const [activeList, setActiveList] = useState<LeadList>(() =>
     createList('starter-001', 'ACBS', 85, 90, 1000)
@@ -141,6 +157,20 @@ export default function App() {
     }
   }, [grid, agents]);
 
+  // Day-end turnover: some agents resign, depending on the country's attrition rate
+  const agentsRef = useRef(agents);
+  agentsRef.current = agents;
+  useEffect(() => {
+    if (day <= 1 || profile.attritionRate <= 0) return;
+    const { stayed, left } = applyAttrition(agentsRef.current, profile.attritionRate, Math.random);
+    setDepartures(left.map(a => a.name));
+    if (left.length === 0) return;
+    const leftIds = new Set(left.map(a => a.id));
+    setAgents(stayed);
+    setGrid(prev => prev.map(t => (t.assignedAgentId && leftIds.has(t.assignedAgentId) ? { ...t, assignedAgentId: null } : t)));
+    setSelectedAgent(prev => (prev && leftIds.has(prev.id) ? null : prev));
+  }, [day]);
+
   // Format Time to 12-Hour format (e.g. "11:30 AM")
   const formatTime = (totalMinutes: number): string => {
     const hours24 = Math.floor(totalMinutes / 60) % 24;
@@ -165,7 +195,7 @@ export default function App() {
 
   // Main Simulation Loop
   useEffect(() => {
-    if (gameSpeed === 0) return;
+    if (gameSpeed === 0 || countryId === null) return;
 
     const intervalTime = 1000 / gameSpeed;
     const timer = setInterval(() => {
@@ -192,7 +222,8 @@ export default function App() {
       const generatedCalls = computeCallGenerationRate(
         dialerConfig,
         activeList,
-        availableAgents
+        availableAgents,
+        contactWindowFactor(profile.clientOverlap)
       );
       if (generatedCalls > 0) {
         setCallsQueue(q => Math.min(q + generatedCalls, 99));
@@ -251,7 +282,7 @@ export default function App() {
               updatedAgent.stress = Math.min(100, updatedAgent.stress + 1);
 
               const activeCamp = campaigns.find(c => c.active) || campaigns[0];
-              moneyEarned += activeCamp.payoutPerCall;
+              moneyEarned += netPayout(activeCamp.payoutPerCall, profile.regulatoryOverhead);
               callsHandled += 1;
 
               // CSAT rating calculation
@@ -323,7 +354,7 @@ export default function App() {
     }, intervalTime);
 
     return () => clearInterval(timer);
-  }, [gameSpeed, callsQueue, campaigns, itConfig, hrPolicy, activeEvent, agents, dialerConfig, activeList, quota]);
+  }, [gameSpeed, countryId, profile, callsQueue, campaigns, itConfig, hrPolicy, activeEvent, agents, dialerConfig, activeList, quota]);
 
   // Phase 2: screen / planning handlers
   const handlePaceChange = (newPace: number) => {
@@ -450,7 +481,7 @@ export default function App() {
       }
     ];
 
-    const chosen = eventPool[Math.floor(Math.random() * eventPool.length)];
+    const chosen = pickWeighted(eventPool, id => eventWeight(id, profile.connectivityRisk), Math.random);
     setActiveEvent(chosen);
   };
 
@@ -519,6 +550,19 @@ export default function App() {
 
   return (
     <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none text-slate-100">
+      {countryId === null && (
+        <CountrySelectScreen
+          countries={COUNTRIES}
+          onChoose={(id) => {
+            try {
+              localStorage.setItem('bpo_country', id);
+            } catch (e) {
+              /* ignore */
+            }
+            setCountryId(id);
+          }}
+        />
+      )}
       
       {/* 1. TOP-LEFT LOGO & LEFT ACTION TOOLBAR */}
       <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 pointer-events-auto">
@@ -542,6 +586,9 @@ export default function App() {
             <h2 className="font-pixel text-[10px] text-sky-400 tracking-wide mt-0.5">
               CALL CENTER TYCOON
             </h2>
+            {countryId !== null && (
+              <p className="font-pixel text-[9px] text-slate-400 mt-0.5" data-testid="country-name">{profile.name}</p>
+            )}
           </div>
         </div>
 
@@ -733,6 +780,7 @@ export default function App() {
             activeList={activeList}
             upgradeCost={dialerUpgradeCost(dialerConfig.tier)}
             lastVerdict={lastVerdict}
+            departures={departures}
             onUpgradeDialer={handleUpgradeDialer}
             onRequestNewList={handleRequestNewList}
             onStartNextDay={handleStartNextDay}
@@ -840,6 +888,8 @@ export default function App() {
         onClose={() => setActiveModal(null)}
         money={money}
         availableDesksCount={Math.max(0, totalDesks - agents.filter(a => a.deskId).length)}
+        laborCostIndex={profile.laborCostIndex}
+        talentPoolIndex={profile.talentPoolIndex}
         onHireAgent={handleHireAgent}
       />
 
@@ -1031,6 +1081,9 @@ export default function App() {
         onResetGame={() => {
           localStorage.removeItem('bpo_grid');
           localStorage.removeItem('bpo_agents');
+          localStorage.removeItem('bpo_country');
+          setCountryId(null);
+          setDepartures([]);
           setGrid(generateInitialGrid());
           setAgents(generateInitialAgents(generateInitialGrid()));
           setMoney(50000);
```

**Step 5: one sentence on the card.** In `ts/src/games/bpo_sim/config.ts` change the `description` to
`'Run the data side of an outsourced call center from a country you choose: pick a lead list, set the dialer pace, hit the daily quota, then spend your earnings after hours. Early build.'`

**Step 6: the test.** Create `ts/tests/test_bpo_sim_country_effects.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_bpo_sim_country_effects.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadCountries, COUNTRY_ATTRIBUTES } from '../../examples/bpo-sim/src/data/countries';
import {
  NEUTRAL_PROFILE, BASE_CANDIDATE_COUNT, contactWindowFactor, netPayout, scaleSalary, candidateCount, eventWeight,
  pickWeighted, dailyQuitChance, applyAttrition, attributeLevel, attributeRows, ATTRIBUTE_LABELS,
} from '../../examples/bpo-sim/src/systems/countrySystem';
import { computeCallGenerationRate } from '../../examples/bpo-sim/src/systems/dialerSystem';
import { createList } from '../../examples/bpo-sim/src/systems/listSystem';
import type { Agent } from '../../examples/bpo-sim/src/types';

const read = (rel: string) => readFileSync(new URL(`../../examples/bpo-sim/src/${rel}`, import.meta.url), 'utf8');
const countries = loadCountries(read('data/countries.yaml'));

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const agent = (id: string): Agent => ({ id, name: `Agent ${id}` } as unknown as Agent);

describe('test_bpo_sim_country_effects', () => {
  it('the neutral profile switches every effect off', () => {
    const p = NEUTRAL_PROFILE;
    expect(contactWindowFactor(p.clientOverlap)).toBe(1);
    expect(netPayout(145, p.regulatoryOverhead)).toBe(145);
    expect(scaleSalary(22000, p.laborCostIndex)).toBe(22000);
    expect(candidateCount(p.talentPoolIndex)).toBe(BASE_CANDIDATE_COUNT);
    expect(eventWeight('fiber_cut', p.connectivityRisk)).toBe(1);
    expect(dailyQuitChance(p.attritionRate)).toBe(0);
  });

  it('each effect moves the way its attribute says', () => {
    expect(contactWindowFactor(0)).toBeCloseTo(0.6, 5);
    expect(contactWindowFactor(1)).toBe(1);
    expect(contactWindowFactor(0.5)).toBeGreaterThan(contactWindowFactor(0.2));
    expect(netPayout(100, 0.1)).toBeCloseTo(90, 5);
    expect(netPayout(100, 0.2)).toBeLessThan(netPayout(100, 0.05));
    expect(scaleSalary(20000, 1.5)).toBe(30000);
    expect(scaleSalary(20000, 0.5)).toBe(10000);
    expect(candidateCount(0.3)).toBe(2);
    expect(candidateCount(1.8)).toBe(10);
    expect(candidateCount(1)).toBe(6);
    expect(eventWeight('fiber_cut', 0.28)).toBeCloseTo(2, 5);
    expect(eventWeight('storm', 0.28)).toBe(1);
    expect(dailyQuitChance(0.3)).toBeCloseTo(0.01, 5);
  });

  it('a larger share of the day shared with the client generates more calls, and the default changes nothing', () => {
    const list = createList('l', 'ACBS', 100, 100, 500);
    const dialer = { pace: 6, tier: 1 };
    const none = computeCallGenerationRate(dialer, list, 5);
    expect(computeCallGenerationRate(dialer, list, 5, 1)).toBe(none);
    expect(computeCallGenerationRate(dialer, list, 5, contactWindowFactor(0))).toBeLessThan(none);
    expect(computeCallGenerationRate(dialer, list, 5, contactWindowFactor(0.9))).toBeGreaterThan(computeCallGenerationRate(dialer, list, 5, contactWindowFactor(0.1)));
  });

  it('the weighted pick favours the outage more when connectivity risk is higher, and is repeatable', () => {
    const events = [{ id: 'storm' }, { id: 'fiber_cut' }, { id: 'client_bonus' }, { id: 'lunch' }];
    const count = (risk: number) => {
      const rng = seeded(5);
      let outages = 0;
      for (let i = 0; i < 4000; i++) {
        if (pickWeighted(events, (id) => eventWeight(id, risk), rng).id === 'fiber_cut') outages++;
      }
      return outages;
    };
    expect(count(0.35)).toBeGreaterThan(count(0.07));
    expect(count(0.2)).toBe(count(0.2));
  });

  it('attrition: nobody leaves at rate 0, someone leaves at high rates, and one agent always stays', () => {
    const agents = Array.from({ length: 10 }, (_, i) => agent(String(i)));
    expect(applyAttrition(agents, 0, () => 0).left.length).toBe(0);
    const everyone = applyAttrition(agents, 0.6, () => 0);
    expect(everyone.stayed.length).toBe(1);
    expect(everyone.left.length).toBe(9);
    const rng = seeded(9);
    let leaving = 0;
    for (let day = 0; day < 300; day++) leaving += applyAttrition(agents, 0.3, rng).left.length;
    expect(leaving / 300).toBeGreaterThan(0.05);
    expect(leaving / 300).toBeLessThan(0.2);
  });

  it('every real country gives sane effects', () => {
    for (const c of countries) {
      expect(contactWindowFactor(c.clientOverlap), c.id).toBeGreaterThanOrEqual(0.6);
      expect(contactWindowFactor(c.clientOverlap), c.id).toBeLessThanOrEqual(1);
      expect(netPayout(100, c.regulatoryOverhead), c.id).toBeGreaterThan(79);
      expect(candidateCount(c.talentPoolIndex), c.id).toBeGreaterThanOrEqual(2);
      expect(candidateCount(c.talentPoolIndex), c.id).toBeLessThanOrEqual(10);
      expect(dailyQuitChance(c.attritionRate), c.id).toBeGreaterThan(0);
      expect(eventWeight('fiber_cut', c.connectivityRisk), c.id).toBeGreaterThan(0.3);
    }
  });

  it('each country card has all six attributes in plain words', () => {
    for (const c of countries) {
      const rows = attributeRows(c);
      expect(rows.map((r) => r.key)).toEqual([...COUNTRY_ATTRIBUTES]);
      for (const r of rows) {
        expect(r.label).toBe(ATTRIBUTE_LABELS[r.key]);
        expect(['Low', 'Medium', 'High']).toContain(r.level);
      }
    }
    expect(attributeLevel('laborCostIndex', 0.6)).toBe('Low');
    expect(attributeLevel('laborCostIndex', 1.5)).toBe('High');
    const levels = new Set(countries.map((c) => attributeLevel('clientOverlap', c.clientOverlap)));
    expect(levels.size).toBe(3);
  });

  it('the selector screen lists every country from the data and offers each as a choice', () => {
    const screen = read('components/CountrySelectScreen.tsx');
    expect(screen).toContain('countries.map((c) =>');
    expect(screen).toContain('onClick={() => onChoose(c.id)}');
    expect(screen).toContain('attributeRows(c)');
    expect(screen).toContain('CHOOSE WHERE YOUR OPERATION RUNS');
    expect(screen).toContain('data-testid="country-select"');
  });

  it('the app waits for a country, applies each effect, and a reset asks again', () => {
    const app = read('App.tsx');
    expect(app).toContain('countryId === null');
    expect(app).toContain('contactWindowFactor(profile.clientOverlap)');
    expect(app).toContain('netPayout(activeCamp.payoutPerCall, profile.regulatoryOverhead)');
    expect(app).toContain('pickWeighted(eventPool');
    expect(app).toContain('applyAttrition(agentsRef.current, profile.attritionRate, Math.random)');
    expect(app).toContain("localStorage.removeItem('bpo_country')");
    expect(app).toContain('laborCostIndex={profile.laborCostIndex}');
    expect(app).toContain('talentPoolIndex={profile.talentPoolIndex}');
    const recruiting = read('components/RecruitingModal.tsx');
    expect(recruiting).toContain('candidateCount(talentPoolIndex)');
    expect(recruiting).toContain('scaleSalary(baseSal + exp * 1500, laborCostIndex)');
  });
});
```

## 4. What NOT to do

- No country-specific code or copy anywhere (the neutral-copy test fails on a country name outside the YAML file). No jokes, accents, stereotypes or caricature in any card text, event or message; keep the copy exactly as written.
- Do not change the numbers in `countries.yaml`, the existing `systems/*` behaviour (the dialer's new argument defaults to 1), or any gameplay rule beyond the six effects above. Do not add a country list anywhere except the YAML file.
- Do not add a dependency or touch `package.json`. Do not import `countriesData.ts` or any `.tsx` file from a ts test.
- Do not publish: no deploy, no build, no site-repo change. Robert approves deploys after the local safe check.
- No Lua, no engine changes, no protected repos, no player layer or cloud saves. Do not touch `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

```
cd ts && npx vitest run test_bpo_sim_country_effects.ts test_bpo_sim_neutral_copy.ts test_bpo_sim_countries.ts test_bpo_sim_identity.ts
```
Real tail from the prototype of exactly these edits on top of the three earlier BPO Sim directives: `Test Files  4 passed (4)` / `Tests  25 passed (25)` (the new file has 9 tests).
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors.

Controller step, not this run: the example's own checks with a temporary `node_modules` junction. Real result on the prototype: `tsc --noEmit` 0 errors, suite `Tests  22 passed (22)`. Then a build of the example (`vite build` resolves the `?raw` import), a play-through at 1280x720 and 390x844 (the selector shows on first load, choosing a country starts the day, Settings > reset asks again, a day end with a high-attrition country can list departures), and Robert's local safe check before any deploy.

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

- [ ] The five new files exist with the exact content above and the four diffs and the config sentence are applied.
- [ ] `cd ts && npx vitest run test_bpo_sim_country_effects.ts test_bpo_sim_neutral_copy.ts test_bpo_sim_countries.ts test_bpo_sim_identity.ts` passes: 4 files, 25 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] No country name appears in code or copy outside `countries.yaml`; no number in `countries.yaml` changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether the three earlier BPO Sim files were present. Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then say plainly what was not run (the example's own suite, type check and build; a play-through) and that the six effect sizes are first-pass numbers for Robert to tune.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 14:57 · robert-claude-laptop · none → Queued
- 2026-10-04 18:47 · robert-claude-laptop · Queued → Approved — lint override: [secret] hits are the identifier 'key: CountryAttribute' (false positive); cited systems/data/raw.d.ts paths are new files under examples/bpo-sim/src that this directive creates, and the stale demo path was fixed in PR 196
<!-- queue:end -->
