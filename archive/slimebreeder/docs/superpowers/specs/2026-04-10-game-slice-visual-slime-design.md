# Game Slice & Visual Slime — Design Spec
**Date:** 2026-04-10
**Status:** Revised after spec review

---

## Overview

Three features expanding the Slime Breeder MVP:

1. **Incubation Timer** — hatch takes real time (30s default), not instant
2. **Display Rooms** — dedicate slimes to passive Gold/hour income slots
3. **SlimeVisual** — procedural SVG rendering driven by `color` + `shape` genetics

Tech context: React 18 + Zustand v5 + Dexie.js v4 (IndexedDB), Tailwind v4, offline-first PWA. No animations per GDD. Target: Moto G 2025.

---

## 1. Incubation Timer

### Goal
Replace the instant hatch with a configurable countdown. Makes hatching feel meaningful without backend clocks.

### Decisions Made
- **Single queue**: one egg incubating at a time (not multiple Roosts — Phase 2)
- **Configurable constant**: `HATCH_DURATION_MS = 30_000` in `src/config.ts`
- **Persists across reloads**: store `hatchStartedAt: number | null` (epoch ms) in Dexie + Zustand
- **Elapsed-time-on-load**: on `loadGame()`, compute how much time has passed — if expired, resolve immediately; if still incubating, resume from correct progress
- **No animations**: progress bar is CSS width %, no transitions

### State Shape (additions to `gameStore.ts`)

```ts
hatchStartedAt: number | null   // null = no egg in incubation

startHatch(): void              // replaces hatchSlime() for initiating
resolveHatch(): void            // called when timer expires; adds slime, clears timestamp
```

`hatchSlime()` becomes a two-phase action:
- `startHatch()`: validates capacity, sets `hatchStartedAt = Date.now()`, persists
- `resolveHatch()`: calls `generateSlime()`, pushes to `slimes`, clears `hatchStartedAt`, persists

### Persistence (Dexie additions)

`PersistedGameState` gains `hatchStartedAt: number | null`.

**Dexie version bump required.** The schema moves from `version(1)` to `version(2)` with an upgrade handler that sets `hatchStartedAt = null` and `displaySlots = [null, null]` on any existing row. Without this, existing saves return `undefined` for new fields, silently breaking incubation resume and idle gold calculation.

```ts
this.version(2).upgrade(tx => tx.table('gameState').toCollection().modify(row => {
  if (row.hatchStartedAt === undefined) row.hatchStartedAt = null
  if (row.displaySlots === undefined) row.displaySlots = [null, null]
}))
```

The `persist()` helper in `gameStore.ts` must also be extended to include `hatchStartedAt` and `displaySlots` in the payload it writes to Dexie.

### UI

- `HatchButton.tsx`: when `hatchStartedAt !== null`, renders an `<IncubationProgress>` bar instead of the button
- `IncubationProgress.tsx`: reads `hatchStartedAt` from store, uses `useEffect` + `setInterval(100ms)` to compute `pct = elapsed / HATCH_DURATION_MS`; calls `resolveHatch()` when `pct >= 1`
- Progress bar: full-width, primary-container fill, `INCUBATING_EGG` label, time-remaining counter (`Xs`)
- When pen is full, hatch button still disabled (capacity check before `startHatch`)

### Tests (TDD)

- `startHatch()` sets `hatchStartedAt` to a number
- `startHatch()` is a no-op when pen is full
- `startHatch()` is a no-op when incubation is already in progress (`hatchStartedAt !== null`)
- `resolveHatch()` adds a slime and clears `hatchStartedAt`
- `loadGame()` with an expired `hatchStartedAt` auto-calls `resolveHatch()` inline
- `loadGame()` with an active `hatchStartedAt` preserves it and does not resolve

---

## 2. Display Rooms

### Goal
Passive idle income. Assign a slime to a Display slot; it earns Gold/sec proportional to its genetic rarity while assigned. Calculated on-load (idle game style), not via a running server.

### Decisions Made
- **2 slots** at launch (`DISPLAY_SLOT_COUNT = 2` in `src/config.ts`)
- **Idle-style**: on `loadGame()`, compute accumulated gold from `Date.now() - assignedAt` per filled slot, add to gold balance in one shot
- **Live ticker**: `useEffect` in Display Room UI uses `setInterval(1000ms)` to add `goldPerSec` to zustand gold every second while app is open (optimistic UI feel). Does NOT persist every tick — only persists on assign/unassign/sell events.
- **Rate formula**: `goldPerSec = colorTier * shapeTier * DISPLAY_BASE_RATE` where `DISPLAY_BASE_RATE = 0.5` (a Tier-1×Tier-1 slime earns 0.5G/s = 30G/min)
- **Visitor offers**: skipped — Phase 2 per GDD
- **Slimes in Display are NOT in pen**: assigning moves slime to `displaySlots`, frees pen capacity
- **Display slots are outside pen capacity** (intentional game rule): a pen of 5 can hold 5 pen slimes AND fill both display slots. `startHatch()` checks `slimes.length >= penCapacity` only — display-assigned slimes do not count toward this limit. This is the simpler, more fun rule and matches idle game conventions.

### State Shape (additions)

```ts
displaySlots: Array<DisplaySlot | null>   // length = DISPLAY_SLOT_COUNT

interface DisplaySlot {
  slimeId: string
  assignedAt: number   // epoch ms
}

assignToDisplay(slimeId: string, slotIndex: number): void
unassignFromDisplay(slotIndex: number): void
```

On `assignToDisplay`: removes slime from `slimes[]`, puts it in `displaySlots[slotIndex]`, persists.
On `assignToDisplay`: no-op if the target slot is already occupied (guard against double-tap).
On `unassignFromDisplay`: reconstructs the full `Slime` object the same way `loadGame()` does — spread `slimeData` and inject `variance: 0` (since `variance` is not persisted). Puts slime back into `slimes[]`, persists.

Gold accrued during display is credited at assign-time (never lost — slime retains its identity).

### Persistence (Dexie additions)

`PersistedGameState` gains:
```ts
displaySlots: Array<{ slimeId: string; assignedAt: number; slimeData: PersistedSlime } | null>
```

`slimeData` is embedded so the full slime can be restored to `slimes[]` on unassign.

### UI

- New `DisplayRooms.tsx` section below `InventoryList`
- Section header: `DISPLAY_CHAMBER` with Material Symbols icon
- 2 slot cards, each showing:
  - If filled: `SlimeVisual` (small, 48px), slime designation chips, `+{rate}G/s` label, RETRIEVE button
  - If empty: dashed border cell, `ASSIGN` button that opens a modal/picker
- `DisplaySlotPicker.tsx`: modal listing current `slimes[]`, each with SlimeVisual + value, tap to assign
- Live gold tick happens in `DisplayRooms.tsx` `useEffect` — adds to zustand gold every second, no persist. The effect **must** return `() => clearInterval(id)` cleanup to avoid interval leaks on unmount.

### Tests (TDD)

- `assignToDisplay()` removes slime from `slimes[]`
- `assignToDisplay()` puts slime in correct slot index
- `assignToDisplay()` is a no-op when target slot is already occupied
- `unassignFromDisplay()` puts slime back in `slimes[]` with `variance: 0`
- `loadGame()` with filled display slots computes and adds elapsed gold
- Gold accumulation rate = `colorTier * shapeTier * DISPLAY_BASE_RATE`

---

## 3. SlimeVisual

### Goal
Procedural SVG rendering from `{color, shape}` genetics. No external assets. Strategy-pattern interface so SVG internals swap when hand-drawn sprites arrive.

### Design Pattern

```ts
// Stable external interface — never changes
interface SlimeVisualProps {
  color: SlimeColor
  shape: SlimeShape
  size?: number        // px, default 80
}

// Internal: SVG paths + gradient config driven by color/shape
export function SlimeVisual({ color, shape, size = 80 }: SlimeVisualProps)
```

When hand-drawn sprites arrive: replace the SVG `<path>` internals per shape, keep props unchanged.

### SVG Architecture

Each `SlimeVisual` renders a self-contained `<svg>` with:
- `<defs>` containing a `<radialGradient>` with an instance-unique `id` — generated via React's `useId()` hook (`${uid}-grad`). This avoids gradient ID collisions when multiple slimes of the **same** color+shape are rendered in the same DOM (e.g., two Green Blob slimes in InventoryList + DisplayRooms simultaneously).
- A `<path>` for the body geometry (shape-driven)
- A highlight `<ellipse>` (same across all shapes, positioned per shape)
- A drip `<path>` accent (Elongated only)
- `drop-shadow` CSS filter for the toxic glow

### Shape Geometry (from approved matrix)

| Shape | SVG Path |
|-------|----------|
| Blob | `M50,15 C70,12 88,28 90,50 C92,72 75,88 50,88 C25,88 10,72 10,50 C10,28 30,18 50,15Z` |
| Spiked | `M50,10 L58,38 L88,38 L64,56 L72,84 L50,68 L28,84 L36,56 L12,38 L42,38Z` |
| Elongated | `M50,8 C65,8 80,22 80,45 C80,65 68,82 55,90 C52,92 48,92 45,90 C32,82 20,65 20,45 C20,22 35,8 50,8Z` |

Spiked also renders an inner `<circle>` core at 50,52 r=14 for the softer mass effect.

### Color Gradient Config

| Color | Highlight Stop | Dark Stop | Glow |
|-------|----------------|-----------|------|
| Green | `#a0ffa0` | `#003907` | `rgba(0,255,65,0.4)` |
| Blue | `#9ef0ff` | `#001f24` | `rgba(0,227,253,0.4)` |
| Red | `#ff9090` | `#3c0700` | `rgba(255,65,54,0.4)` |

Radial gradient: `cx="38%"` `cy="33%"` `r="65%"` (Blob/Spiked), `cy="28%"` `r="60%"` (Elongated — taller center).

### File Structure

```
src/components/SlimeVisual.tsx     ← the component
src/components/SlimeVisual.test.tsx ← renders all 9 combos without throwing
```

No sub-files. All path/gradient data lives as constants at the top of `SlimeVisual.tsx`.

### Integration

- `SlimeCard.tsx`: replace color `div` placeholder with `<SlimeVisual color={slime.color} shape={slime.shape} size={80} />`
- `DisplayRooms.tsx` slot cards: `<SlimeVisual size={48} />`
- `DisplaySlotPicker.tsx` list items: `<SlimeVisual size={40} />`

### Tests (TDD)

- Renders without throwing for each of the 9 `color × shape` combinations
- Renders an `<svg>` element
- Two instances rendered simultaneously use different gradient `id` values (no collision)
- Elongated shape includes the drip element
- Spiked shape includes the inner core circle

---

## 4. Config File

All magic numbers live in one place:

```ts
// src/config.ts
export const HATCH_DURATION_MS = 30_000
export const PEN_UPGRADE_COST = 20     // moved here from gameStore
export const DISPLAY_SLOT_COUNT = 2
export const DISPLAY_BASE_RATE = 0.5  // gold per second per tier-product
```

---

## 5. Implementation Order

1. `src/config.ts` — constants (no deps)
2. `src/db/db.ts` — add `hatchStartedAt` + `displaySlots` to schema
3. `src/types.ts` — add `DisplaySlot` interface
4. `SlimeVisual` component + tests
5. `gameStore.ts` — add incubation + display room actions + `loadGame()` extensions
6. `IncubationProgress.tsx` component
7. `HatchButton.tsx` — branch on `hatchStartedAt`
8. `SlimeCard.tsx` — integrate `SlimeVisual`
9. `DisplayRooms.tsx` + `DisplaySlotPicker.tsx`
10. `App.tsx` — add `DisplayRooms` to layout

---

## 6. Out of Scope (Phase 2)

- Multiple egg queues / Roosts
- Visitor offers in Display Rooms
- Tier 2 colors (Crimson, Emerald, Cyan-variant)
- Hand-drawn SVG sprites (just swap `<path>` internals in `SlimeVisual.tsx`)
- Animations of any kind
