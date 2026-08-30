# PlanetForge — Phase 1 Directive: World Model, Yield/Scan, SectorZone Soil + Monument (TypeScript)

*August 2026 | Read fully before executing anything. Working title "PlanetForge" — do not confuse with the existing, separately-shipped RFDGameStudio game also called "SlimeWorld." Supersedes the Rust version of this directive — that target environment does not exist in this workspace.*

---

> ⛔ **STOP:** This is a fresh scaffold. No existing test floor for this game's logic. Before writing any game code:
> 1. Report the actual current directory structure (`ls -R src` or equivalent) — do not assume file paths match §1 below without confirming.
> 2. Confirm whether `vitest` is already a devDependency in `package.json`. If not, run `npm install -D vitest` and report the result.
> 3. Run `npx vitest run` once against the empty/default scaffold and report the raw output, even if it reports 0 tests. This establishes the real starting point.
>
> Do not proceed to §2 until all three are reported.

---

## §0 Context

**Why this is a fresh Phase 1, not a continuation:** An earlier design pass (ADR 001, ADR 002) specified this world model in Rust, targeting `cargo test`. That target does not exist in this AI Studio workspace — no `Cargo.toml`, no Rust toolchain, default scaffold is Vite/React/TypeScript. This directive is a full port of that design to TypeScript, built against RFDGameStudio's current TS-native chassis convention (ADR-010), not the older Lua-bridge pattern (ADR-005) used by the unrelated, already-shipped SlimeWorld breeding game.

**What this phase delivers, in one pass since nothing exists yet:**
1. The core data model — `TileState`, `SectorZone`, `WorldState`, and the supporting enums/unions.
2. `evaluateTileYield` + `calculateScanScore` + `selectHarvestTarget` — the settlement scan/targeting logic.
3. `soilUpgradeTarget` + `updateSectorSoil` — sector-level soil tier upgrades.
4. `attemptConstructMonument` — structure construction gated on cost and an empty slot.

**Explicitly NOT in scope — do not implement or stub:**
- Any rendering, React components, or UI. This phase is pure logic, no `.tsx`.
- The Global Core / planetary equilibrium / Aether-Focus regen pool. `bonusFocus` on a Monument is stored but has no consumer yet.
- Elemental flux wave propagation / injection resolution. Separate phase.
- `AutonomousSettlement` phase state machine (Spawn/Scan/Exploit/Ascend/Desperate/Collapse) beyond the two functions named above. Separate phase.
- Persistence (localStorage or otherwise). Separate phase, once there's a UI to persist state for.

**Two design questions locked as Director's rulings for this phase — not open for the agent to decide:**
- `VolcanicAsh` soil is **recoverable**, loops back to `Clay`. Not a dead end.
- Monument `bonusFocus` is a **flat constant** this phase. Does not scale with sector soil tier.

---

## §1 Scope Statement

| File (adjust path to match actual scaffold — report if different) | Status | Action |
|---|---|---|
| `src/planetforge/gameLogic.ts` | New | Full implementation, §2 |
| `src/planetforge/gameLogic.test.ts` | New | Vitest suite, §3 |

**Read-only:** everything the default Vite/React scaffold ships with (`App.tsx`, `main.tsx`, config files). Do not modify, do not delete, do not "clean up." This phase adds a new logic module alongside the scaffold — it does not touch it.

> ⚠️ RULE: If the actual scaffold's `tsconfig.json` has `strict: false` or is missing entirely, report that before proceeding — the exhaustiveness checks in §2 rely on strict mode to catch unhandled union cases at compile time. Do not silently add `strict: true` yourself if it causes unrelated errors elsewhere in the scaffold; report and ask first.

---

## §2 Implementation

Full contents of `src/planetforge/gameLogic.ts`:

```typescript
// PlanetForge — core world model and sector logic
// Ported from ADR 001/002 (originally specified in Rust). No Lua, no bridge —
// plain TypeScript, per RFDGameStudio's current TS-native chassis (ADR-010).

export const RING_SIZE = 32;
export const TILES_PER_SECTOR = 4;
export const SECTOR_COUNT = RING_SIZE / TILES_PER_SECTOR;

export enum ElementType {
  Heat = 0,
  Moisture = 1,
  Charge = 2,
  Purity = 3,
}

export type AspectId =
  | 'BasicSoil'
  | 'FertileLoam'
  | 'ScrubFlora'
  | 'LushFlora'
  | 'GrazerFauna'
  | 'MineralVein'
  | 'ResonanceSpire';

export interface ResourceLedger {
  food: number;
  energy: number;
  material: number;
}

export function emptyLedger(): ResourceLedger {
  return { food: 0, energy: 0, material: 0 };
}

export type SoilType = 'BarrenRock' | 'Clay' | 'FertileLoam' | 'VolcanicAsh';

// Discriminated union — the TS equivalent of Rust's data-carrying enum.
export type StructureSlot =
  | { kind: 'None' }
  | { kind: 'Monument'; bonusFocus: number }
  | { kind: 'Aqueduct'; moistureBoost: number }
  | { kind: 'MineShaft'; extractionMult: number };

// Rust's u8 tier fields enforced compile-time bounds implicitly via type +
// explicit clamping at write sites. TypeScript has neither — this function
// is the single enforcement point. Every write to a tier value must go
// through this. A tier written without it is a silent-drift bug waiting
// to happen, exactly the failure mode the discrete-tier design was chosen
// to avoid in the first place.
export function clampTier(value: number): number {
  return Math.max(0, Math.min(3, Math.trunc(value)));
}

export interface TileState {
  tiers: [number, number, number, number]; // [Heat, Moisture, Charge, Purity] — always clampTier'd, 0-3
  resistances: [number, number, number, number]; // 0-3, per element
  aspectSlots: (AspectId | null)[]; // fixed length 4
  ticksStable: number; // increments when tiers unchanged this resolve, resets to 0 on any tier delta
}

export function makeTileState(): TileState {
  return {
    tiers: [0, 0, 0, 0],
    resistances: [0, 0, 0, 0],
    aspectSlots: [null, null, null, null],
    ticksStable: 0,
  };
}

export interface SectorZone {
  sectorId: number;
  soilProfile: SoilType;
  structure: StructureSlot;
  tileIndices: [number, number, number, number];
}

export interface WorldState {
  tiles: TileState[]; // length RING_SIZE
  sectors: SectorZone[]; // length SECTOR_COUNT
}

export function makeWorldState(): WorldState {
  const tiles = Array.from({ length: RING_SIZE }, () => makeTileState());
  const sectors: SectorZone[] = Array.from({ length: SECTOR_COUNT }, (_, i) => ({
    sectorId: i,
    soilProfile: 'BarrenRock',
    structure: { kind: 'None' },
    tileIndices: [
      i * TILES_PER_SECTOR,
      i * TILES_PER_SECTOR + 1,
      i * TILES_PER_SECTOR + 2,
      i * TILES_PER_SECTOR + 3,
    ],
  }));
  return { tiles, sectors };
}

// ---------------------------------------------------------
// 1. Yield calculation
// ---------------------------------------------------------

export function evaluateTileYield(tile: TileState, sector: SectorZone): ResourceLedger {
  const total = emptyLedger();
  for (const aspect of tile.aspectSlots) {
    if (aspect === null) continue;
    switch (aspect) {
      case 'BasicSoil':
        total.food += 1;
        break;
      case 'FertileLoam':
        total.food += 3;
        if (sector.soilProfile === 'FertileLoam') total.food += 1; // sector synergy
        break;
      case 'ScrubFlora':
        total.material += 1;
        break;
      case 'LushFlora':
        total.food += 2;
        total.material += 2;
        break;
      case 'GrazerFauna':
        total.food += 4;
        break;
      case 'MineralVein':
        total.material += 3;
        total.energy += 1;
        break;
      case 'ResonanceSpire':
        total.energy += 4;
        break;
      default: {
        // Exhaustiveness check — the TS equivalent of Rust's compile-time
        // guarantee that every enum variant is handled. If AspectId gains
        // a new variant and this switch isn't updated, this line fails to
        // compile. Do not remove this default case.
        const exhaustive: never = aspect;
        throw new Error(`Unhandled AspectId: ${exhaustive}`);
      }
    }
  }
  return total;
}

// ---------------------------------------------------------
// 2. ScanRadius scoring
// ---------------------------------------------------------

export interface DemandProfile {
  weightFood: number;
  weightEnergy: number;
  weightMaterial: number;
}

export function calculateScanScore(
  yields: ResourceLedger,
  demand: DemandProfile,
  distance: number,
  distancePenalty: number
): number {
  const raw =
    yields.food * demand.weightFood +
    yields.energy * demand.weightEnergy +
    yields.material * demand.weightMaterial;
  return raw - distance * distancePenalty;
}

// JS's % operator is not Euclidean — it can return negative values for
// negative inputs. Rust's rem_euclid() in the original design does not
// have this problem. This wrapper is required, not optional, or ring
// wraparound breaks silently for any origin/direction combo that goes
// negative before wrapping.
function ringIndex(i: number): number {
  return ((i % RING_SIZE) + RING_SIZE) % RING_SIZE;
}

export function selectHarvestTarget(
  world: WorldState,
  originTile: number,
  radius: number,
  demand: DemandProfile
): number | null {
  let bestTile: number | null = null;
  let highestScore = -Infinity;

  for (let d = 0; d <= radius; d++) {
    for (const dir of [-1, 1]) {
      const targetIdx = ringIndex(originTile + d * dir);
      const sectorIdx = Math.floor(targetIdx / TILES_PER_SECTOR);
      const tile = world.tiles[targetIdx];
      const sector = world.sectors[sectorIdx];
      const yields = evaluateTileYield(tile, sector);
      const score = calculateScanScore(yields, demand, d, 2);
      if (score > highestScore) {
        highestScore = score;
        bestTile = targetIdx;
      }
      if (d === 0) break; // origin tile only needs evaluating once, not twice
    }
  }
  return bestTile;
}

// ---------------------------------------------------------
// 3. Soil ladder
// ---------------------------------------------------------

export function soilUpgradeTarget(current: SoilType): SoilType | null {
  switch (current) {
    case 'BarrenRock':
      return 'Clay';
    case 'Clay':
      return 'FertileLoam';
    case 'FertileLoam':
      return null; // top of the primary ladder
    case 'VolcanicAsh':
      return 'Clay'; // LOCKED this phase: recoverable, loops onto the primary ladder
    default: {
      const exhaustive: never = current;
      throw new Error(`Unhandled SoilType: ${exhaustive}`);
    }
  }
}

// ---------------------------------------------------------
// 4. Sector soil upgrade pass
// ---------------------------------------------------------

export const SOIL_STABILITY_TICKS = 20; // placeholder — tune after playtest, not a locked balance number

export function updateSectorSoil(sector: SectorZone, tiles: TileState[]): boolean {
  const allStable = sector.tileIndices.every(
    (idx) => tiles[idx].ticksStable >= SOIL_STABILITY_TICKS
  );
  if (!allStable) return false;

  const next = soilUpgradeTarget(sector.soilProfile);
  if (next === null) return false;

  sector.soilProfile = next;
  return true;
}

// ---------------------------------------------------------
// 5. Monument construction
// ---------------------------------------------------------

export const MONUMENT_COST: ResourceLedger = { food: 10, energy: 5, material: 15 };
export const MONUMENT_BASE_FOCUS = 5; // LOCKED flat this phase — does not scale with soil tier

export function attemptConstructMonument(sector: SectorZone, ledger: ResourceLedger): boolean {
  if (sector.structure.kind !== 'None') return false;

  const affordable =
    ledger.food >= MONUMENT_COST.food &&
    ledger.energy >= MONUMENT_COST.energy &&
    ledger.material >= MONUMENT_COST.material;

  if (!affordable) return false;

  ledger.food -= MONUMENT_COST.food;
  ledger.energy -= MONUMENT_COST.energy;
  ledger.material -= MONUMENT_COST.material;

  sector.structure = { kind: 'Monument', bonusFocus: MONUMENT_BASE_FOCUS };
  return true;
}
```

> ⚠️ RULE: Do not add a default/fallback branch to any `switch` that returns a value instead of throwing (e.g., don't make the `AspectId` switch silently return `emptyLedger()` for an unhandled case "to be safe"). The `never`-typed exhaustiveness check is the actual safety net — a silent fallback defeats it and can hide a real bug behind a plausible-looking empty result.

---

## §3 Test Anchors

Full contents of `src/planetforge/gameLogic.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  RING_SIZE,
  makeWorldState,
  makeTileState,
  selectHarvestTarget,
  soilUpgradeTarget,
  updateSectorSoil,
  SOIL_STABILITY_TICKS,
  attemptConstructMonument,
  type DemandProfile,
  type SectorZone,
  type TileState,
  type ResourceLedger,
} from './gameLogic';

describe('yield and scan selection', () => {
  it('selects the highest-yield tile within radius under a food-weighted demand', () => {
    const world = makeWorldState();
    world.tiles[2].aspectSlots[0] = 'LushFlora';   // 2 food, 2 material
    world.tiles[5].aspectSlots[0] = 'MineralVein';  // out of radius 3 from origin 0

    const foodDemand: DemandProfile = { weightFood: 5, weightEnergy: 1, weightMaterial: 1 };
    const target = selectHarvestTarget(world, 0, 3, foodDemand);
    expect(target).toBe(2);
  });
});

describe('sector soil upgrade', () => {
  function stableTile(): TileState {
    const t = makeTileState();
    t.ticksStable = SOIL_STABILITY_TICKS;
    return t;
  }
  function unstableTile(): TileState {
    const t = makeTileState();
    t.ticksStable = SOIL_STABILITY_TICKS - 1;
    return t;
  }

  it('upgrades only when all four tiles in the sector are stable', () => {
    const tiles: TileState[] = Array.from({ length: RING_SIZE }, () => stableTile());
    tiles[3] = unstableTile();

    const sector: SectorZone = {
      sectorId: 0,
      soilProfile: 'BarrenRock',
      structure: { kind: 'None' },
      tileIndices: [0, 1, 2, 3],
    };

    expect(updateSectorSoil(sector, tiles)).toBe(false);
    expect(sector.soilProfile).toBe('BarrenRock');

    tiles[3].ticksStable = SOIL_STABILITY_TICKS;
    expect(updateSectorSoil(sector, tiles)).toBe(true);
    expect(sector.soilProfile).toBe('Clay');
  });

  it('VolcanicAsh recovers to Clay rather than being a dead end', () => {
    expect(soilUpgradeTarget('VolcanicAsh')).toBe('Clay');
  });
});

describe('monument construction', () => {
  it('requires full resource cost and an empty structure slot', () => {
    const sector: SectorZone = {
      sectorId: 0,
      soilProfile: 'FertileLoam',
      structure: { kind: 'None' },
      tileIndices: [0, 1, 2, 3],
    };
    let ledger: ResourceLedger = { food: 5, energy: 5, material: 5 }; // short on food and material

    expect(attemptConstructMonument(sector, ledger)).toBe(false);
    expect(sector.structure.kind).toBe('None');

    ledger = { food: 20, energy: 20, material: 20 };
    expect(attemptConstructMonument(sector, ledger)).toBe(true);
    expect(sector.structure.kind).toBe('Monument');

    // second attempt fails — slot occupied
    expect(attemptConstructMonument(sector, ledger)).toBe(false);
  });
});
```

**Target floor: 4 passed, 0 failed, 0 skipped.** Run `npx vitest run` and report the raw terminal output.

---

## §4 Completion Criteria

- [ ] `npx vitest run` reports exactly `4 passed, 0 failed, 0 skipped` — raw output pasted, not paraphrased
- [ ] `npx tsc --noEmit` exits clean — confirms the exhaustiveness checks actually compile under strict mode
- [ ] `gameLogic.ts` contains no React imports, no DOM references, no `.tsx` syntax — this is pure logic, verify with `grep -n "react\|useState\|useEffect" src/planetforge/gameLogic.ts` returning zero matches
- [ ] Default scaffold files (`App.tsx`, `main.tsx`, configs) are unmodified — confirm via `git diff` or equivalent if version control is present, otherwise confirm by direct comparison
- [ ] Neither `VolcanicAsh` recoverability nor `MONUMENT_BASE_FOCUS` scaling was changed from the locked values in §0/§2
- [ ] Global Core, wave propagation, and `AutonomousSettlement` phase logic were NOT touched — confirm this phase stayed in scope

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Working title | PlanetForge (placeholder — do not confuse with the shipped RFDGameStudio SlimeWorld) |
| Chassis | TypeScript-native (ADR-010 pattern), no Lua bridge |
| Test runner | Vitest — `npx vitest run` |
| `RING_SIZE` | 32 |
| `TILES_PER_SECTOR` | 4 |
| `SOIL_STABILITY_TICKS` | 20 (placeholder) |
| `MONUMENT_COST` | food 10 / energy 5 / material 15 (placeholder) |
| `MONUMENT_BASE_FOCUS` | 5 — LOCKED flat this phase |
| Soil ladder | BarrenRock → Clay → FertileLoam (top); VolcanicAsh → Clay (LOCKED recoverable) |
| Pre-flight floor | 0 (fresh scaffold — confirm, don't assume) |
| Target floor | 4 passed, 0 failed, 0 skipped |

---

*PlanetForge | Phase 1 | RFDGameStudio-adjacent, TS-native*
*Next phase, not this one: Global Core regen pool, elemental flux wave propagation, AutonomousSettlement phase state machine.*
