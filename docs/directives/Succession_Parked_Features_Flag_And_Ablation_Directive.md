# Succession M0: measure how long a run takes, and ablate the parked systems behind a flag (Size M)

**Depends on:** none. This run touches `AudienceStage.tsx`, `WhisperPanel.tsx` and `gameOrchestration.ts`, not `App.tsx`, so it does not collide with `Succession_Run_Controls_Directive` or `Succession_Run_Save_Continue_Directive`. **Why Succession:** `docs/demos/succession/DIRECTION.md` (overseer judgement 2026-10-05, Robert may overrule), milestone M0 "Trim and measure", and `ts/src/games/succession/ROADMAP.md` M0.

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/succession/DIRECTION.md` ("Keep / park" and "Replan" M0), `ts/src/games/succession/utils/gameOrchestration.ts`, `ts/src/games/succession/components/AudienceStage.tsx` (lines 480-580), `ts/src/games/succession/components/WhisperPanel.tsx` (lines 10-20 and 58-66), `ts/tests/test_succession_balance_sim.ts` (lines 1-75: how the report is captured), `ts/tools/succession-balance-sim.ts` (read only; DO NOT EDIT).

## 1. Why this exists

The direction says Succession is probably already inside a 5-10 minute session (8 segments, one move each) but nobody has timed it, and that three systems may be extra load on the action menu: the Discredit move, the Indictment panel, and the domain-ripple friction. It says nothing is deleted: the three are "parked" behind a flag, and a harness run with them parked must show that every origin still wins at least once.

Measured facts this run builds on:
- The balance sim (`ts/tools/succession-balance-sim.ts`, 569 lines) has no exports and prints its whole report when imported; it plays 7 strategies x 3 origins = 21 deterministic runs; `ts/tests/test_succession_balance_sim.ts` already captures that report by spying on `console.log` during a dynamic import.
- The sim never plays Indictment (`deliverIndictmentTo`), so parking it cannot change the sim: the ablation will show no difference for it, which is itself the finding.
- `TOTAL_SEGMENTS = 8` (`ts/src/games/succession/data/gameConstants.ts`).
- `DOMAIN_RIPPLE_CONFLICTS` is read in exactly three source places: `gameOrchestration.ts` twice (in `whisperTo` and `presentEvidenceTo`) and `WhisperPanel.tsx` once (the display).

Prototype result for this exact change (real output, 2026-10-05; "player wins per origin" counts the 7 strategies):

```text
nothing parked (baseline): {"bastard_scion":1,"disgraced_knight":1,"merchant_banker":1}
discredit parked:          {"bastard_scion":1,"disgraced_knight":1,"merchant_banker":1}
indictment parked:         {"bastard_scion":1,"disgraced_knight":1,"merchant_banker":1}
domain ripple parked:      {"bastard_scion":2,"disgraced_knight":1,"merchant_banker":2}
all three parked:          {"bastard_scion":2,"disgraced_knight":1,"merchant_banker":1}
```

Your numbers must match these (the engine is deterministic). Every origin keeps at least one win in every configuration, so the DIRECTION bar holds on paper; this run makes the harness prove it.

The default flag state is "nothing parked", so shipping behaviour does not change in this run. Flipping a default to parked is a later decision for Robert, made from this data.

## 2. Scope

1. New module `<!-- new: ts/src/games/succession/parkedFeatures.ts -->`: the flag (one job: hold which features are parked).
2. New module `<!-- new: ts/src/games/succession/utils/sessionTiming.ts -->`: the assumption-based session-time estimate (one job: arithmetic).
3. Gate the three systems on the flag: `gameOrchestration.ts`, `AudienceStage.tsx`, `WhisperPanel.tsx` (diff below; nothing deleted).
4. New test `<!-- new: ts/tests/test_succession_parked_features.ts -->`.
5. New test `<!-- new: ts/tests/test_succession_ablation.ts -->`.

## 3. The work

**Step 1: create `ts/src/games/succession/parkedFeatures.ts`** with exactly this content:

```ts
// new: ts/src/games/succession/parkedFeatures.ts
export type ParkedFeatureId = 'discredit' | 'indictment' | 'domainRipple';
export type ParkedFeatures = Record<ParkedFeatureId, boolean>;
export const DEFAULT_PARKED_FEATURES: Readonly<ParkedFeatures> = {
  discredit: false,
  indictment: false,
  domainRipple: false,
};
let current: ParkedFeatures = { ...DEFAULT_PARKED_FEATURES };
export function isParked(id: ParkedFeatureId): boolean {
  return current[id];
}
export function getParkedFeatures(): ParkedFeatures {
  return { ...current };
}
export function setParkedFeatures(next: Partial<ParkedFeatures>): void {
  current = { ...current, ...next };
}
export function resetParkedFeatures(): void {
  current = { ...DEFAULT_PARKED_FEATURES };
}
```

**Step 2: create `ts/src/games/succession/utils/sessionTiming.ts`** with exactly this content:

```ts
// new: ts/src/games/succession/utils/sessionTiming.ts
import { TOTAL_SEGMENTS } from '../data/gameConstants';

/**
 * A first-order ESTIMATE of how long a solo run takes. The engine is headless and
 * deterministic, so it cannot measure human reading time: these seconds are stated
 * assumptions, not measurements. A real stopwatch run replaces them.
 */
export interface TimingAssumptions {
  /** Title, origin pick and primer, once per run. */
  setupSeconds: number;
  /** Time per segment (one move each): choosing a figure and approach, reading the ticker. */
  secondsPerMove: { fast: number; typical: number; slow: number };
  /** Verdict screen plus epilogue, once per run. */
  endSeconds: number;
}

export const TIMING_ASSUMPTIONS: TimingAssumptions = {
  setupSeconds: 60,
  secondsPerMove: { fast: 20, typical: 45, slow: 90 },
  endSeconds: 90,
};

export interface SessionEstimate {
  segments: number;
  fastMinutes: number;
  typicalMinutes: number;
  slowMinutes: number;
}

function toMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 10) / 10;
}

export function estimateSessionMinutes(
  segments: number = TOTAL_SEGMENTS,
  assumptions: TimingAssumptions = TIMING_ASSUMPTIONS
): SessionEstimate {
  const fixed = assumptions.setupSeconds + assumptions.endSeconds;
  return {
    segments,
    fastMinutes: toMinutes(fixed + segments * assumptions.secondsPerMove.fast),
    typicalMinutes: toMinutes(fixed + segments * assumptions.secondsPerMove.typical),
    slowMinutes: toMinutes(fixed + segments * assumptions.secondsPerMove.slow),
  };
}
```

**Step 3: apply this diff** to `gameOrchestration.ts`, `AudienceStage.tsx` and `WhisperPanel.tsx` (all CRLF; use the Edit tool, which keeps CRLF; the `@@` lines are only for locating; do not change anything else, and do not re-indent the wrapped JSX):

```diff
diff --git a/ts/src/games/succession/components/AudienceStage.tsx b/ts/src/games/succession/components/AudienceStage.tsx
index 1ca701f8..f49f80c5 100644
--- a/ts/src/games/succession/components/AudienceStage.tsx
+++ b/ts/src/games/succession/components/AudienceStage.tsx
@@ -40,4 +40,5 @@ import { WhisperPanel } from './WhisperPanel';
 import { EvidencePanel } from './EvidencePanel';
 import { IndictmentPanel } from './IndictmentPanel';
+import { isParked } from '../parkedFeatures';
 
 interface AudienceStageProps {
@@ -485,4 +486,5 @@ export const AudienceStage: React.FC<AudienceStageProps> = ({
 
         {/* Section 4: Indictment Panel */}
+        {!isParked('indictment') && (
         <IndictmentPanel
           figure={figure}
@@ -492,6 +494,8 @@ export const AudienceStage: React.FC<AudienceStageProps> = ({
           onToggle={() => toggleApproach('indictment')}
         />
+        )}
 
         {/* Section 5: Discredit a Rival */}
+        {!isParked('discredit') && (
         <div
           id="audience-action-discredit"
@@ -571,4 +575,5 @@ export const AudienceStage: React.FC<AudienceStageProps> = ({
           )}
         </div>
+        )}
       </div>
     </div>
diff --git a/ts/src/games/succession/components/WhisperPanel.tsx b/ts/src/games/succession/components/WhisperPanel.tsx
index 7f90c967..2c97c797 100644
--- a/ts/src/games/succession/components/WhisperPanel.tsx
+++ b/ts/src/games/succession/components/WhisperPanel.tsx
@@ -14,4 +14,5 @@ import { checkContradictionAgainstKnown } from '../engine/gossip';
 import { isLockedMethod, persuasionMethodGain } from '../engine/methodLock';
 import { DOMAIN_RIPPLE_CONFLICTS, WHISPER_FAVOR_GAIN } from '../data/gameConstants';
+import { isParked } from '../parkedFeatures';
 import { TickerEntry } from '../types/gameState';
 import { PlayerOriginId } from '../engine/types';
@@ -60,5 +61,5 @@ export const WhisperPanel: React.FC<WhisperPanelProps> = ({
   const isCurrentSelectionContradiction = isThemeContradiction(selectedThemeId);
 
-  const domainConflict = DOMAIN_RIPPLE_CONFLICTS[figure.id];
+  const domainConflict = isParked('domainRipple') ? undefined : DOMAIN_RIPPLE_CONFLICTS[figure.id];
   const opposingFigureMeta = domainConflict ? COURT_FIGURES[domainConflict.targetFigureId] : null;
 
diff --git a/ts/src/games/succession/utils/gameOrchestration.ts b/ts/src/games/succession/utils/gameOrchestration.ts
index 9ac52342..042ac3dd 100644
--- a/ts/src/games/succession/utils/gameOrchestration.ts
+++ b/ts/src/games/succession/utils/gameOrchestration.ts
@@ -20,4 +20,5 @@ import {
 } from '../data/gameConstants';
 import { getOriginModifiers } from '../data/origins';
+import { isParked } from '../parkedFeatures';
 
 
@@ -184,5 +185,5 @@ export function whisperTo(state: GameState, figureId: FigureId, themeId: string)
   let rippleData = undefined;
   if (!exposed) {
-    const conflict = DOMAIN_RIPPLE_CONFLICTS[figureId];
+    const conflict = isParked('domainRipple') ? undefined : DOMAIN_RIPPLE_CONFLICTS[figureId];
     if (conflict) {
       const opposingFigure = figures.find((f) => f.id === conflict.targetFigureId);
@@ -275,5 +276,5 @@ export function presentEvidenceTo(state: GameState, figureId: FigureId, evidence
   // Zero-sum domain ripple friction for evidence presentation
   let rippleData = undefined;
-  const conflict = DOMAIN_RIPPLE_CONFLICTS[figureId];
+  const conflict = isParked('domainRipple') ? undefined : DOMAIN_RIPPLE_CONFLICTS[figureId];
   if (conflict) {
     const opposingFigure = figures.find((f) => f.id === conflict.targetFigureId);
@@ -354,4 +355,5 @@ export function deliverIndictmentTo(
 ): GameState {
   if (state.phase === 'verdict') return state;
+  if (isParked('indictment')) return state;
 
   const validation = validateIndictmentForFigure(figureId, triad);
@@ -418,4 +420,5 @@ export function discreditFigure(
 ): GameState {
   if (state.phase === 'verdict') return state;
+  if (isParked('discredit')) return state;
   if (targetRivalId === 'player') return state;
 
```

**Step 4: create `ts/tests/test_succession_parked_features.ts`** with exactly this content:

```ts
// new: ts/tests/test_succession_parked_features.ts
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULT_PARKED_FEATURES,
  getParkedFeatures,
  isParked,
  resetParkedFeatures,
  setParkedFeatures,
} from '../src/games/succession/parkedFeatures';
import {
  createInitialGameState,
  discreditFigure,
  deliverIndictmentTo,
  whisperTo,
} from '../src/games/succession/utils/gameOrchestration';
import { CLAIM_THEMES } from '../src/games/succession/data/claimThemes';
import { estimateSessionMinutes } from '../src/games/succession/utils/sessionTiming';
import { TOTAL_SEGMENTS } from '../src/games/succession/data/gameConstants';
import type { GameState } from '../src/games/succession/types/gameState';

afterEach(() => resetParkedFeatures());

function commanderFavor(state: GameState): number {
  return state.figures.find((f) => f.id === 'commander')!.favor.player;
}

function withCommanderFavor(state: GameState, favor: number): GameState {
  return {
    ...state,
    figures: state.figures.map((f) =>
      f.id === 'commander' ? { ...f, favor: { ...f.favor, player: favor } } : f
    ),
  };
}

describe('parkedFeatures flag', () => {
  it('nothing is parked by default, so shipped behaviour is unchanged', () => {
    expect(DEFAULT_PARKED_FEATURES).toEqual({ discredit: false, indictment: false, domainRipple: false });
    expect(getParkedFeatures()).toEqual(DEFAULT_PARKED_FEATURES);
  });

  it('setParkedFeatures merges and resetParkedFeatures restores the defaults', () => {
    setParkedFeatures({ discredit: true });
    expect(isParked('discredit')).toBe(true);
    expect(isParked('indictment')).toBe(false);
    resetParkedFeatures();
    expect(getParkedFeatures()).toEqual(DEFAULT_PARKED_FEATURES);
  });
});

describe('parked features in the orchestration (code kept, behaviour gated)', () => {
  it('a parked discredit leaves the state untouched; unparked it changes it', () => {
    const state = createInitialGameState('bastard_scion');
    expect(discreditFigure(state, 'chancellor', 'aldric')).not.toBe(state);
    setParkedFeatures({ discredit: true });
    expect(discreditFigure(state, 'chancellor', 'aldric')).toBe(state);
  });

  it('a parked indictment leaves the state untouched', () => {
    const state = createInitialGameState('bastard_scion');
    setParkedFeatures({ indictment: true });
    const triad = { suspect: 'x', method: 'y', motive: 'z' } as never;
    expect(deliverIndictmentTo(state, 'chancellor', triad)).toBe(state);
  });

  it('domain ripple friction costs the opposing councilor favor, and parking it removes the cost', () => {
    const theme = CLAIM_THEMES.find((t) => t.figureId === 'chancellor')!;
    const base = withCommanderFavor(createInitialGameState('merchant_banker'), 10);
    const withRipple = whisperTo(base, 'chancellor', theme.id);
    expect(commanderFavor(withRipple)).toBeLessThan(10);
    setParkedFeatures({ domainRipple: true });
    const withoutRipple = whisperTo(base, 'chancellor', theme.id);
    expect(commanderFavor(withoutRipple)).toBe(10);
  });
});

describe('estimateSessionMinutes (assumption-based, not a measurement)', () => {
  it('uses the real segment count and orders fast < typical < slow', () => {
    const e = estimateSessionMinutes();
    expect(e.segments).toBe(TOTAL_SEGMENTS);
    expect(e.fastMinutes).toBeLessThan(e.typicalMinutes);
    expect(e.typicalMinutes).toBeLessThan(e.slowMinutes);
  });

  it('with the stated assumptions an 8-segment run is 5.2 / 8.5 / 14.5 minutes', () => {
    const e = estimateSessionMinutes(8);
    expect([e.fastMinutes, e.typicalMinutes, e.slowMinutes]).toEqual([5.2, 8.5, 14.5]);
  });
});
```

**Step 5: create `ts/tests/test_succession_ablation.ts`** with exactly this content:

```ts
// new: ts/tests/test_succession_ablation.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ParkedFeatures } from '../src/games/succession/parkedFeatures';
import { estimateSessionMinutes } from '../src/games/succession/utils/sessionTiming';

/**
 * Ablation of the parked systems. The balance sim is a script module: it has no exports
 * and prints its report at import time, so this test imports it once per configuration
 * (vi.resetModules) with the parked-features flag set first, captures console.log, and
 * parses the PER-RUN RESULTS table (strategy | origin | winner | ...).
 */

const ORIGINS = ['bastard_scion', 'disgraced_knight', 'merchant_banker'];

interface Row {
  strategy: string;
  origin: string;
  winner: string;
}

async function runSim(parked: Partial<ParkedFeatures>): Promise<Row[]> {
  vi.resetModules();
  const flags = await import('../src/games/succession/parkedFeatures');
  flags.resetParkedFeatures();
  flags.setParkedFeatures(parked);
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  try {
    await import('../tools/succession-balance-sim');
  } finally {
    spy.mockRestore();
    flags.resetParkedFeatures();
  }
  const start = lines.findIndex((l) => l.includes('PER-RUN RESULTS'));
  const end = lines.findIndex((l, i) => i > start && l.includes('PER-FIGURE WINNERS'));
  return lines
    .slice(start + 1, end)
    .filter((l) => l.includes(' | '))
    .map((l) => l.split(' | ').map((c) => c.trim()))
    .filter((cells) => ORIGINS.includes(cells[1]))
    .map((cells) => ({ strategy: cells[0], origin: cells[1], winner: cells[2] }));
}

function playerWinsByOrigin(rows: Row[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of ORIGINS) out[o] = rows.filter((r) => r.origin === o && r.winner === 'player').length;
  return out;
}

const CONFIGS: Array<{ name: string; parked: Partial<ParkedFeatures> }> = [
  { name: 'nothing parked (baseline)', parked: {} },
  { name: 'discredit parked', parked: { discredit: true } },
  { name: 'indictment parked', parked: { indictment: true } },
  { name: 'domain ripple parked', parked: { domainRipple: true } },
  { name: 'all three parked', parked: { discredit: true, indictment: true, domainRipple: true } },
];

describe('succession ablation (parked features)', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  for (const cfg of CONFIGS) {
    it(`${cfg.name}: 7 strategies x 3 origins all finish; wins per origin printed`, async () => {
      const rows = await runSim(cfg.parked);
      expect(rows).toHaveLength(21);
      const wins = playerWinsByOrigin(rows);
      console.info(`ABLATION ${cfg.name}: player wins per origin ${JSON.stringify(wins)}`);
      for (const origin of ORIGINS) {
        expect(wins[origin], `${cfg.name}: ${origin} must still win at least once`).toBeGreaterThanOrEqual(1);
      }
    }, 60000);
  }

  it('prints the session-time estimate for the 8-segment run (assumptions, not a measurement)', () => {
    const e = estimateSessionMinutes();
    console.info(`SESSION ESTIMATE: ${e.fastMinutes} / ${e.typicalMinutes} / ${e.slowMinutes} minutes (fast / typical / slow, ${e.segments} segments)`);
    expect(e.typicalMinutes).toBeGreaterThan(0);
  });
});
```

## 4. What NOT to do

- Do NOT edit `ts/tools/succession-balance-sim.ts` or `ts/tests/test_succession_balance_sim.ts`: the existing test parses the sim's printed report, and the ablation test reuses the sim unchanged.
- Delete nothing: no component, function, constant, data file, test or ADR. Parked code stays and keeps its tests.
- Do not change any default: `DEFAULT_PARKED_FEATURES` stays all `false`. Do not change any favor, penalty or threshold number (`DOMAIN_RIPPLE_PENALTY`, `RIVAL_SLANDER_PENALTY`, etc.).
- Do not edit `App.tsx`, `TitleScreen.tsx`, `IndictmentPanel.tsx`, `deduction.ts`, or `data/gameConstants.ts`. Do not add the title-screen "one-sentence core" line (a separate small step, not part of this run).
- Do not loosen an assertion if a configuration fails the "every origin wins at least once" check: stop, set the row to Blocked, and paste the printed per-origin table in the Status row. A failing bar is the finding.
- The session-time numbers are assumptions, not measurements: do not describe them as measured anywhere (report, comments, test names). The real number needs a stopwatch playthrough, which is a controller step.
- No Playwright or browser run. No `npm run build:*`. No file over 600 lines; no scratch or debug files in the repo.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified `Python 3.12.12`; no Python is changed).

Baseline before editing (origin/main `9ffa6c56`, 2026-10-05):
```
cd ts && npx vitest run test_succession
```
Real tail: `Test Files  18 passed (18)` / `Tests  172 passed (172)`.

After editing (verified on a prototype of exactly the files above):
```
cd ts && npx vitest run test_succession
```
Expected: `Test Files  20 passed (20)` / `Tests  185 passed (185)` (13 new: 7 in the parked-features file, 6 in the ablation file). The ablation test prints `ABLATION ...` lines and one `SESSION ESTIMATE: 5.2 / 8.5 / 14.5 minutes` line; paste them in your report.
```
cd ts && npx vitest run test_succession_ablation.ts
```
Expected: `Test Files  1 passed (1)` / `Tests  6 passed (6)`, with the five `ABLATION` lines equal to the table in section 1.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0.

The timed solo run (a person with a stopwatch, 390 px and desktop) and the arcade build are the controller's step after merge: say so under Controller finish in your report.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename-or-prefix> [...]` and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files marked CRLF keep CRLF. New files use CRLF to match.
- SOLID/SRP/KISS: the flag is `parkedFeatures.ts`, the arithmetic is `sessionTiming.ts`; the gated files only call `isParked(...)`. No new logic inside `AudienceStage.tsx`.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge. If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The four new files exist as above and the diff in step 3 is applied; `git diff --stat` shows only the three edited files plus the four new ones.
- [ ] `cd ts && npx vitest run test_succession` shows 20 files / 185 tests passing (real tail pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] The five `ABLATION` lines and the `SESSION ESTIMATE` line are pasted in the report.
- [ ] Nothing deleted; defaults unchanged (`DEFAULT_PARKED_FEATURES` all false).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: per configuration, which origins still win and whether any config breaks the bar; the session estimate with the sentence "assumption-based, not measured". Evidence second: real tails of the vitest and tsc commands. Controller finish: a stopwatch solo run to replace the estimate, and the decision (Robert's) whether to flip any default to parked. Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin-laptop |
| Branch | directive/rfdgamestudio-succession-parked-features-flag-a-57aff9 |
| Base branch | - |
| Base commit | 6c8f9ccbaaf3d6b5a21e8b0ce9b6b498997d3082 |
| Head commit | 4c55844def5d8af0e61dd4b5da15b8281d765083 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-05 22:02 · robert-claude-laptop · none → Queued — authored from DIRECTION.md (2026-10-05); queued only, not approved
- 2026-10-05 23:40 · devin-overseer (delegated) · Queued → Approved — lint override: tests/fixtures/demo_lists_snapshot.json cite is inside the directive's Forbidden Actions boilerplate (a do-not-edit list), not a work input
- 2026-10-05 23:57 · dispatcher · Approved → In progress — dispatched devin-laptop on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-succession-parked-features-flag-a-57aff9; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 23:57 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-succession-parked-features-flag-a-57aff9; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-06 00:14 · devin · In progress → Review — Flag + gates + estimate + 2 tests added; vitest test_succession 20 files/185 passed, ablation 6/6, tsc clean; ablation table matches prototype; pushed to branch [origin] spent: devin 13 min est. n/a
- 2026-10-06 01:27 · devin-overseer (delegated) · Review → Done — note: merged via PR 221
<!-- queue:end -->
