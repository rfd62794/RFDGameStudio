# Factory Idle: reskin the weapon labels to tools (labels only, same mechanics)

**Depends on:** Polish_Factory_Idle_TierA_Directive.md (it edits the same `config.ts` and the same example folder; merge it first)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/factory_idle/DIRECTION.md` (Open question section), `docs/directives/Polish_Factory_Idle_TierA_Directive.md`,
`examples/factory-idle-precision-armory-phase2/src/engine/recipes.ts` (lines 1-140 and 255-295 only), `ts/tests/test_ledger_utils.ts` (the shape of a test that imports from an example folder).

## 1. Why this exists

Factory Idle: Precision Armory is a factory sim whose products are firearms: `WEAPON_RECIPES` in
`examples/factory-idle-precision-armory-phase2/src/engine/recipes.ts` sells a Duty Pistol, Tactical Shotgun, Service Rifle, Tactical SMG and
Mil-Spec DMR, and the storefront customers are "Tactical SWAT Unit" and "Federal Task Force" (`examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts` line 1133). The card
will sit in an arcade next to business-facing client pages. Robert's decision (2026-10-04, all recommendations approved): reskin the LABELS
only to tools, same mechanics, same ids. Measured on origin/main `afb1cefe`: the player-visible weapon words are in `recipes.ts` (names,
categories, descriptions, tech names, sector taglines, preset names), `examples/factory-idle-precision-armory-phase2/src/components/Header.tsx` line 68 (`ARMORY`), `examples/factory-idle-precision-armory-phase2/src/components/RecipeBookModal.tsx`
lines 32, 94, 185, 188, `examples/factory-idle-precision-armory-phase2/src/components/StorefrontPanel.tsx` line 255, and the customer name and role arrays in `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts` lines 1132-1133.

## 2. Scope

1. `examples/factory-idle-precision-armory-phase2/src/engine/recipes.ts`: label strings only.
2. `examples/factory-idle-precision-armory-phase2/src/components/Header.tsx`, `RecipeBookModal.tsx`, `StorefrontPanel.tsx`: the visible strings listed in step 2.
3. `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts`: the two arrays on lines 1132-1133 only.
4. `ts/src/games/factory_idle/config.ts`: `label` only. `examples/factory-idle-precision-armory-phase2/metadata.json`: `name` only.
5. New test `<!-- new: ts/tests/test_factory_idle_labels.ts -->`.

## 3. The work

**IDs never change.** `pistol`, `shotgun`, `rifle`, `smg`, `dmr`, `chassis`, `barrel`, `magazine`, `stock`, `optic`, every `tech_*` id, `category: 'weapons'` on upgrades (a type tag, not shown), `requiredParts`, prices, craft times and all code identifiers (`WEAPON_RECIPES`, `WeaponId`, `weaponId`) stay exactly as they are.

**Step 1: `recipes.ts` label map.** Replace these `name`, `category`, `description`, `tagline` values (exact new text):

| Where | Old | New |
|---|---|---|
| RAW_PARTS chassis name / description | `Receiver Chassis` / `Milled aeronautical aluminum receiver block.` | `Housing Shell` / `Milled aluminum housing block.` |
| barrel name / description | `Rifled Barrel` / `Precision ported steel pressure barrel.` | `Drive Shaft` / `Precision-ground steel drive shaft.` |
| magazine name / description | `Spring Magazine` / `Double-stack steel feed cassette.` | `Battery Pack` / `Rechargeable double-cell power cassette.` |
| stock name / description | `Recoil Stock` / `Reinforced glass-nylon adjustable buttstock.` | `Grip Handle` / `Reinforced glass-nylon adjustable grip.` |
| optic name / description | `Precision Optic` / `Nitrogen-purged illuminated variable reticle.` | `Precision Sensor` / `Sealed optical sensor with a variable beam.` |
| pistol name / category / description | `Duty Pistol` / `Handgun` / `Compact semi-automatic sidearm with high civilian & police demand.` | `Hand Drill` / `Hand Tools` / `Compact corded drill with steady demand from home and trade customers.` |
| shotgun name / category / description | `Tactical Shotgun` / `Scatter` / `Close-quarters smoothbore with high kinetic stopping power.` | `Power Nailer` / `Fasteners` / `Fast pneumatic nailer for framing and roofing crews.` |
| rifle name / category / description | `Service Rifle` / `Rifle` / `Standard infantry modular rifle with dependable military contract margins.` | `Cordless Saw` / `Power Saws` / `Modular cordless saw with dependable contractor margins.` |
| smg name / category / description | `Tactical SMG` / `Special Ops` / `High-cyclic personal defense weapon for security details.` | `Rotary Sander` / `Finishing` / `High-speed random-orbit sander for finishing crews.` |
| dmr name / category / description | `Mil-Spec DMR` / `Precision` / `Long-range designated marksman platform with premier defense margins.` | `Laser Level` / `Measuring` / `Long-range self-leveling laser with premium margins.` |

Then these substring replacements wherever they occur in `recipes.ts` string values (use Grep for each old text first; do not touch comments):
`Tactical Shotgun` -> `Power Nailer`; `Service Rifle Blueprint` -> `Cordless Saw Blueprint`; `Service Rifle` -> `Cordless Saw`; `Tactical SMG License` -> `Rotary Sander License`; `Tactical SMG` -> `Rotary Sander`;
`Mil-Spec DMR License` -> `Laser Level License`; `Mil-Spec DMR` -> `Laser Level`; `Rifled Barrel` -> `Drive Shaft`; `Recoil Stock` -> `Grip Handle`; `Precision Optic` -> `Precision Sensor`; `Scattershot Tooling` -> `Nailer Tooling`;
`crafts precision firearms` -> `crafts precision tools`; `finished firearms` -> `finished tools` (two places); `items/weapons` -> `items/tools`; `parts & weapons` -> `parts & tools`; `10 firearms per category` -> `10 tools per category`;
sector taglines: `Primary Small Arms & Handgun Machining` -> `Hand Tool Machining`; `Long Guns, Shotgun & Assault Rifle Lines` -> `Power Nailer and Cordless Saw Lines`; `Advanced Optics, DMRs & Research Power Core` -> `Sensors, Laser Levels & Research Power Core`; sector name `Sector β: Heavy Munitions` -> `Sector β: Heavy Tooling`;
presets: `Pistol Starter Assembly` -> `Hand Drill Starter Assembly`; `two parallel pistol fitters` -> `two parallel drill fitters`.
The upgrade text `Unlocks Rifled Barrel ($10) and Tactical Shotgun recipe ...` becomes `Unlocks Drive Shaft ($10) and Power Nailer recipe ...` by the same substring rules.

**Step 2: the UI strings.**
- `examples/factory-idle-precision-armory-phase2/src/components/Header.tsx` line 68: the text `ARMORY` becomes `WORKSHOP`.
- `examples/factory-idle-precision-armory-phase2/src/components/RecipeBookModal.tsx`: line 32 `Firearms Blueprint & Schematic Codex` -> `Tool Blueprint & Schematic Codex`; line 94 `Firearm Assembly Formulations` -> `Tool Assembly Formulations`; line 185 `finished firearms directly` -> `finished tools directly`; line 188 `finished weapons so` -> `finished tools so`.
- `examples/factory-idle-precision-armory-phase2/src/components/StorefrontPanel.tsx` line 255: `Target Firearm Recipe:` -> `Target Tool Recipe:`.

**Step 3: customers.** In `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts` replace line 1132 (`const names = [...]`) with
`          const names = ['Alex Rivera', 'Sam Okafor', 'Jordan Lee', 'Priya Nair', 'Casey Moreau', 'Taylor Brandt', 'Morgan Ito', 'Dana Novak'];`
and line 1133 (`const roles = [...]`) with
`          const roles = ['Framing Crew', 'City Maintenance Dept', 'Roofing Contractor', 'Property Manager', 'Renovation Crew', 'Facilities Team'];`
(keep the 10-space indent; the arrays keep their length so the random picks are unchanged).

**Step 4: card label.** `ts/src/games/factory_idle/config.ts`: `label: 'Factory Idle: Precision Armory'` -> `label: 'Factory Idle: Precision Workshop'`. In `examples/factory-idle-precision-armory-phase2/metadata.json` change the `name` value the same way. Leave `description`, `source`, `gameId` as they are (the Tier A directive owns them).

**Step 5: the test.** Create `<!-- new: ts/tests/test_factory_idle_labels.ts -->` with exactly this content (the same file was run against the unchanged code and failed 3 of 4 tests, then against a prototype of steps 1-3 and passed 4 of 4):

```ts
// @vitest-environment node
// new: ts/tests/test_factory_idle_labels.ts

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  RAW_PARTS, WEAPON_RECIPES, BUILDING_DEFS, TECH_UPGRADES, INITIAL_SECTORS, PRESET_FACTORIES,
} from '../../examples/factory-idle-precision-armory-phase2/src/engine/recipes';

const BANNED = /\b(pistols?|shotguns?|rifles?|smgs?|dmrs?|firearms?|weapons?|armory|ammo|swat|handgun|small arms|munitions|assault|sidearm|marksman|tactical|mil-spec)\b/i;
const EXAMPLE = '../../examples/factory-idle-precision-armory-phase2/src/';

function collect(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const add = (where: string, v: unknown) => { if (typeof v === 'string') out.push([where, v]); };
  for (const p of Object.values(RAW_PARTS)) { add(`part ${p.id} name`, p.name); add(`part ${p.id} description`, p.description); }
  for (const w of Object.values(WEAPON_RECIPES)) { add(`item ${w.id} name`, w.name); add(`item ${w.id} category`, w.category); add(`item ${w.id} description`, w.description); }
  for (const b of Object.values(BUILDING_DEFS)) { add(`building ${b.type} name`, b.name); add(`building ${b.type} description`, b.description); }
  for (const t of TECH_UPGRADES) { add(`tech ${t.id} name`, t.name); add(`tech ${t.id} description`, t.description); }
  for (const s of Object.values(INITIAL_SECTORS)) { add(`sector ${s.id} name`, s.name); add(`sector ${s.id} tagline`, s.tagline); }
  for (const f of PRESET_FACTORIES) { add(`preset ${f.id} name`, f.name); add(`preset ${f.id} description`, f.description); }
  return out;
}

describe('test_factory_idle_labels', () => {
  it('no player-facing data string uses weapon wording', () => {
    for (const [where, text] of collect()) {
      expect(BANNED.test(text), `${where}: "${text}"`).toBe(false);
    }
  });

  it('the UI files carry no weapon wording in visible text', () => {
    const files = ['components/Header.tsx', 'components/RecipeBookModal.tsx', 'components/StorefrontPanel.tsx'];
    for (const f of files) {
      const lines = readFileSync(new URL(EXAMPLE + f, import.meta.url), 'utf8').split('\n');
      lines.forEach((line, i) => {
        // visible text sits between > and < or inside quotes; identifiers and comments are skipped
        if (/^\s*(\/\/|\{\/\*)/.test(line) || /import |WEAPON_RECIPES|WeaponId|weaponId|weaponList|weaponKeys/.test(line)) return;
        const visible = [...line.matchAll(/>([^<>{}]+)</g)].map(m => m[1]).join(' ')
          + ' ' + [...line.matchAll(/title="([^"]*)"/g)].map(m => m[1]).join(' ');
        expect(BANNED.test(visible), `${f}:${i + 1}: ${line.trim()}`).toBe(false);
      });
    }
  });

  it('the customer pool in the reducer names no law-enforcement or military groups', () => {
    const src = readFileSync(new URL(EXAMPLE + 'engine/gameReducer.ts', import.meta.url), 'utf8');
    expect(/SWAT|Task Force|Constabulary|Armored|Recon|Sheriff|Marshal|Major|Commander|Captain|Operative/.test(src)).toBe(false);
  });

  it('ids are unchanged so saves and presets keep working', () => {
    expect(Object.keys(WEAPON_RECIPES).sort()).toEqual(['dmr', 'pistol', 'rifle', 'shotgun', 'smg']);
    expect(Object.keys(RAW_PARTS).sort()).toEqual(['barrel', 'chassis', 'magazine', 'optic', 'stock']);
  });
});
```

## 4. What NOT to do

- No change to ids, prices, craft times, recipe part counts, tech prerequisites, balance, tile logic, the reducer's behaviour, or the `WeaponId` / `WEAPON_RECIPES` identifiers (renaming code identifiers is a different, larger change).
- No new machines, recipes, persistence, goal or hint (separate directives), no changes to `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.
- Do not touch the Phase 1 or spindle folders. No Lua, no engine changes, no deploys, no protected repos, no player-layer or cloud saves.
- Do not add network, `eval` or storage use to the example.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

Baseline, before editing (real result on origin/main `afb1cefe` with the new test file in place and nothing else changed): `Tests  3 failed | 1 passed (4)`.
Baseline for the neighbour test, same form: `cd ts && npx vitest run test_registry_export.ts` gives `Test Files  1 passed (1)` / `Tests  3 passed (3)`.

After editing:
```
cd ts && npx vitest run test_factory_idle_labels.ts
```
Real tail from the prototype: `Test Files  1 passed (1)` / `Tests  4 passed (4)`.
```
cd ts && npx vitest run test_registry_export.ts
```
Expected: `Tests  3 passed (3)` unchanged.

Source checks (Grep tool, one call each, over `examples/factory-idle-precision-armory-phase2/src`): pattern `Firearm|ARMORY|SWAT|Duty Pistol|Rifled Barrel` returns no match; pattern `Hand Drill` matches in `recipes.ts`.

Not runnable in this run: building the example, a browser smoke test.

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
- **Controller finish.** `docs/children.json` (generated, holds each demo's `id`, `path` and `label`) is checked by `tests/test_children_fresh.py`. A Devin run cannot run the generator, so the run must NOT touch that file. When this run changes a label, set the row to Review and put the exact phrase `ready for controller finish: children.json` in the log line.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] Every table row and substring rule in Step 1 is applied; Grep for `Firearm|ARMORY|SWAT|Duty Pistol|Rifled Barrel` over the Phase 2 `src` finds nothing.
- [ ] `examples/factory-idle-precision-armory-phase2/src/engine/gameReducer.ts` lines 1132-1133 are the two new arrays; no other line of that file changed.
- [ ] `ts/tests/test_factory_idle_labels.ts` exists and `cd ts && npx vitest run test_factory_idle_labels.ts` passes (real tail pasted); `test_registry_export.ts` still passes (real tail pasted).
- [ ] `config.ts` label and `metadata.json` name say `Precision Workshop`; nothing else in `config.ts` changed.
- [ ] `docs/children.json` is untouched and the log line carries `ready for controller finish: children.json`.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: which strings changed per file and whether any quoted line differed from the file. Evidence second: the real tails of `uv run python --version` and the two vitest commands.
Then say plainly what was not run (example build, browser smoke) and that the controller regenerates `docs/children.json` (the label changed) and rebuilds the embed after merge; deploying is Robert's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
<!-- queue:end -->
