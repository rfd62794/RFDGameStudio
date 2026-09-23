# Breeding System Design Spec
**Date:** 2026-04-11
**Feature:** Slime breeding — MUTATE tab, multi-tank incubation, genetic inheritance

---

## 1. Overview

Players combine two pen slimes to produce a genetically-derived offspring. One parent (the **donor**) is consumed; the other (the **host**) stays in the pen. Offspring enters an incubation tank and hatches after the standard hatch timer. The MUTATE tab is the primary surface for both tank management and breeding, and is designed to eventually house the Discovery Tree as well.

---

## 2. Scope

**In scope (this spec):**
- Multi-tank incubation store architecture (replaces single `hatchStartedAt` slot)
- Tank upgrade purchase (Roosts from GDD §4.4)
- MUTATE tab with Incubation Tanks section + Breeding Panel
- `breedSlimes()` pure utility — color/shape trait inheritance + mutation
- `SlimePicker` generalization (reused for both breeding slot selection and display assignment)

**Out of scope (future specs):**
- Tap-to-speed hatching
- Pattern and Accessory trait slots
- Discovery Tree UI within MUTATE tab
- Per-breed hatch timer scaling (all breeds use the same `HATCH_DURATION_MS`)

---

## 3. Store Architecture

### 3.1 Tank Slot Type

```ts
// src/types.ts additions
export type TankSlotType = 'hatch' | 'breed'

export interface HatchTankSlot {
  type: 'hatch'
  startedAt: number
}

export interface BreedTankSlot {
  type: 'breed'
  startedAt: number
  hostId: string
  donorSnapshot: PersistedSlime   // full donor genetics captured at startBreed time;
                                  // donor is removed from pen immediately, so the snapshot
                                  // is the only source of truth at resolveBreed time
}

export type TankSlot = HatchTankSlot | BreedTankSlot
```

### 3.2 GameState changes

Remove: `hatchStartedAt: number | null`

Add:
```ts
tanks: Array<TankSlot | null>   // length always equals tankCount; null = empty slot
tankCount: number               // starts at 1; upgradable via buyTankUpgrade()
```

`tanks` is stored as a sparse array: index = slot number, value = TankSlot or null.

### 3.3 New / Changed Store Actions

| Action | Signature | Behaviour |
|---|---|---|
| `startHatch()` | `(tankIndex?: number) → void` | Uses first free tank if no index given. No-op if all tanks occupied or pen full. |
| `resolveHatch(tankIndex: number)` | `→ void` | Idempotent guard remains. Adds slime, clears tank slot. |
| `startBreed(hostId, donorId)` | `(hostId: string, donorId: string) → void` | Validates: both slimes in pen, at least one free tank. Removes donor from pen immediately. Stores donor's full genetics as `donorSnapshot` on the `BreedTankSlot`. Occupies first free tank slot. |
| `resolveBreed(tankIndex: number)` | `→ void` | Reads `hostId` from tank slot (looks up host in `slimes[]`), reads `donorSnapshot` from tank slot. Calls `breedSlimes(host, donorSnapshot)`, adds offspring to pen, clears tank slot. Host remains in pen. |
| `buyTankUpgrade()` | `→ void` | Costs `TANK_UPGRADE_COST` gold. Increments `tankCount`, appends null to `tanks`. |

### 3.4 Persistence

`PersistedGameState` gains `tanks` and `tankCount`. Dexie schema version bumps to 3 with an upgrade handler that migrates `hatchStartedAt` → `tanks[0]` (if non-null, creates a `HatchTankSlot`) and sets `tankCount: 1`.

### 3.5 loadGame Auto-Resolve

On load, iterate all tank slots. For each:
- If `type === 'hatch'` and elapsed ≥ `HATCH_DURATION_MS` → call `resolveHatch(i)`
- If `type === 'breed'` and elapsed ≥ `HATCH_DURATION_MS` → call `resolveBreed(i)`

---

## 4. Genetics Model

### 4.1 Trait Inheritance

Implemented in `src/utils/breedSlimes.ts` as a **pure function**:

```ts
export function breedSlimes(host: Slime, donor: PersistedSlime): Slime
```

`donor` is typed as `PersistedSlime` because the donor snapshot is stored without `variance` (same as all persisted slimes). Only the host needs to be a full `Slime` (looked up live from `slimes[]`). The function only reads `color`, `colorTier`, `shape`, `shapeTier` from both parents — `variance` is not inherited.

For each trait dimension (`color`/`colorTier` pair, `shape`/`shapeTier` pair):
- Roll 60/40: 60% → inherit from host, 40% → inherit from donor
- The full trait pair is inherited together (you get both the label and the tier from the chosen parent)

### 4.2 Mutation

After inheritance:
- 15% chance that mutation fires
- If it fires: ONE trait dimension is randomly selected
- That dimension's tier is incremented by 1, capped at T3
- The trait label (color/shape value) does not change — only the tier upgrades

### 4.3 Extensibility

`breedSlimes()` is written to iterate over a `BREED_TRAITS` constant:

```ts
const BREED_TRAITS = ['color', 'shape'] as const
```

Adding `'pattern'` or `'accessory'` later is additive — no restructuring of the function body.

### 4.4 Offspring Metadata

- New `id` via `crypto.randomUUID()`
- `variance` freshly rolled in `[-0.1, 0.1]` (same as `generateSlime`)
- `actualValue` computed via `computeBaseValue(colorTier, shapeTier, variance)`
- `createdAt: Date.now()`

---

## 5. Config Additions

```ts
// src/config.ts additions
export const TANK_UPGRADE_COST = 50    // gold cost to add a tank slot
export const BREED_MUTATION_CHANCE = 0.15
export const BREED_HOST_WEIGHT = 0.60  // probability of inheriting from host vs donor
```

---

## 6. UI: MUTATE Tab

### 6.1 Routing

`BottomNav` currently renders all tabs as stubs. Add simple tab state to `App.tsx` (or a lightweight router): `activeTab: 'chamber' | 'mutate'`. CHAMBER shows the existing scroll layout; MUTATE shows `MutatePage`.

### 6.2 MutatePage Layout

```
INCUBATION_TANKS
  [Tank 1 card]
  [Tank 2 card]   ← only visible if tankCount ≥ 2
  [BUY TANK — 50G]

BREEDING_LAB
  [HOST SLOT]  ×  [DONOR SLOT]
    tap to           tap to
    select           select
        [START BREED]
```

### 6.3 Tank Card States

| State | Display |
|---|---|
| Empty | Two buttons: HATCH (starts a wild hatch immediately in this tank) and BREED (scrolls the page to the Breeding Panel below; does not start a breed — the Breeding Panel's START BREED button does that, using the first free tank) |
| Hatch in progress | Progress bar + countdown + `HATCH_IN_PROGRESS` label |
| Breed in progress | Progress bar + countdown + `BREED_IN_PROGRESS` label + small host/donor SlimeVisual thumbnails |

Tank cards use `IncubationProgress` logic (100ms interval, clearInterval before resolve).

### 6.4 Breeding Panel

- HOST and DONOR slots each show an empty placeholder or the selected slime's `SlimeVisual` (size 64)
- DONOR slot shows a small ⚠ `CONSUMED` chip so the player knows it will be spent
- Tapping either slot opens `SlimePicker` filtered to pen slimes not already selected in the other slot
- `START BREED` button: disabled unless both slots are filled AND `tanks.some(t => t === null)`
- On START BREED: calls `store.startBreed(hostId, donorId)`, clears both panel slots

### 6.5 SlimePicker Generalization

`DisplaySlotPicker` is renamed to `SlimePicker` and accepts an `onSelect` callback + optional `excludeIds` prop. Both DisplayRooms and BreedingPanel use it.

---

## 7. Component File Map

| File | Action |
|---|---|
| `src/types.ts` | Add `TankSlot`, `HatchTankSlot`, `BreedTankSlot`, `TankSlotType` |
| `src/config.ts` | Add `TANK_UPGRADE_COST`, `BREED_MUTATION_CHANCE`, `BREED_HOST_WEIGHT` |
| `src/db/db.ts` | Schema version 3, migrate `hatchStartedAt` → `tanks[0]` |
| `src/store/gameStore.ts` | Replace `hatchStartedAt` with `tanks`/`tankCount`; add `startBreed`, `resolveBreed`, `buyTankUpgrade` |
| `src/utils/breedSlimes.ts` | New — pure `breedSlimes()` function |
| `src/__tests__/breedSlimes.test.ts` | New — unit tests for all inheritance + mutation paths |
| `src/__tests__/gameStore.test.ts` | Update — replace `hatchStartedAt` tests with `tanks` array tests |
| `src/components/SlimePicker.tsx` | Rename + generalize `DisplaySlotPicker.tsx` |
| `src/components/DisplayRooms.tsx` | Update import: `DisplaySlotPicker` → `SlimePicker` |
| `src/components/TankCard.tsx` | New — single tank slot UI (empty / hatch / breed states) |
| `src/components/BreedingPanel.tsx` | New — HOST + DONOR slots + START BREED |
| `src/components/MutatePage.tsx` | New — composes TankCard list + BreedingPanel |
| `src/components/HatchButton.tsx` | Update — calls `startHatch()` (first free tank), shows ALL TANKS OCCUPIED |
| `src/components/IncubationProgress.tsx` | Update — accepts `tankIndex` prop, drives per-tank timer |
| `src/App.tsx` | Add `activeTab` state, render `MutatePage` when MUTATE selected |
| `src/components/BottomNav.tsx` | Wire CHAMBER / MUTATE tab switching |

---

## 8. Testing Strategy

- **`breedSlimes.test.ts`** — mock `Math.random()` to cover: host wins 60/40, donor wins 60/40, mutation fires on color, mutation fires on shape, mutation caps at T3, no mutation path
- **`gameStore.test.ts`** — update existing hatch tests to use `tanks[0]`; add: `startBreed` removes donor, `startBreed` occupies tank, `resolveBreed` adds offspring + clears slot, `buyTankUpgrade` increments tankCount
- No tests for pure UI components (MutatePage, BreedingPanel, TankCard) — logic lives in store and utilities

---

## 9. Open Questions (Deferred)

- `TANK_UPGRADE_COST = 50G` — subject to economy playtesting
- Should the host slime be visually marked as "busy" while a breed is in progress? (Not in scope for this spec)
- Breed timer duration — currently same as `HATCH_DURATION_MS`. Could diverge in a future spec.
