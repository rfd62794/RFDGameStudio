# Breeding System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement slime breeding — a MUTATE tab with a multi-tank incubation system and a genetics model that combines two pen slimes into a genetically-derived offspring.

**Architecture:** The single `hatchStartedAt` store slot is replaced with a `tanks: Array<TankSlot | null>` array. A pure `breedSlimes()` utility handles all genetics math. The MUTATE tab composes `TankCard` and `BreedingPanel` components; tab routing is added to `App.tsx` and `BottomNav`.

**Tech Stack:** TypeScript, React 19, Zustand v5, Dexie.js v4, Vitest 4, Tailwind v4

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/db/db.ts` | Modify | Add `HatchTankSlot`, `BreedTankSlot`, `TankSlot` types; Dexie schema v3 migration |
| `src/config.ts` | Modify | Add `TANK_UPGRADE_COST`, `BREED_MUTATION_CHANCE`, `BREED_HOST_WEIGHT` |
| `src/store/gameStore.ts` | Modify | Replace `hatchStartedAt` with `tanks`/`tankCount`; update all actions; add `buyTankUpgrade` |
| `src/components/IncubationProgress.tsx` | Modify | Refactor from store-reading to prop-driven (`startedAt`, `onComplete`, `label`) |
| `src/components/HatchButton.tsx` | Modify | Use `tanks` array to find active/free slots |
| `src/__tests__/gameStore.test.ts` | Modify | Replace `hatchStartedAt` references with `tanks[0]`; add `buyTankUpgrade` tests |
| `src/utils/breedSlimes.ts` | Create | Pure function `breedSlimes(host, donor)` — genetics inheritance + mutation |
| `src/__tests__/breedSlimes.test.ts` | Create | Unit tests for all inheritance and mutation paths |
| `src/__tests__/gameStore.test.ts` | Modify (again) | Add `startBreed`, `resolveBreed`, `loadGame — breed` tests |
| `src/components/SlimePicker.tsx` | Create | Generalized picker modal (replaces `DisplaySlotPicker`) |
| `src/components/DisplaySlotPicker.tsx` | Delete | Replaced by `SlimePicker` |
| `src/components/DisplayRooms.tsx` | Modify | Update import: `DisplaySlotPicker` → `SlimePicker` |
| `src/components/TankCard.tsx` | Create | Single tank slot UI — empty / hatch-in-progress / breed-in-progress states |
| `src/components/BreedingPanel.tsx` | Create | HOST + DONOR staging slots + START BREED button |
| `src/components/MutatePage.tsx` | Create | Composes `TankCard` list + `BreedingPanel` + BUY TANK button |
| `src/components/BottomNav.tsx` | Modify | Accept `activeTab`/`onTabChange` props; enable CHAMBER and MUTATE tabs |
| `src/App.tsx` | Modify | Add `activeTab` state; render `MutatePage` when MUTATE is selected |

**Do NOT touch:** `src/main.tsx` (calls `loadGame()` before React mounts — correct as-is), `src/utils/slimeGenerator.ts`, `src/utils/economics.ts`

---

## Task 1: Types, Config, Dexie v3

**Files:**
- Modify: `src/db/db.ts`
- Modify: `src/config.ts`

No tests needed — types and constants are verified indirectly by Tasks 2–4.

- [ ] **Step 1.1: Add TankSlot types and update PersistedGameState in db.ts**

Replace the entire contents of `src/db/db.ts`:

```ts
import Dexie, { type Table } from 'dexie'

export interface PersistedSlime {
  id: string
  color: string
  shape: string
  colorTier: number
  shapeTier: number
  actualValue: number
  createdAt: number
}

export interface PersistedDisplaySlot {
  slimeId: string
  assignedAt: number
  slimeData: PersistedSlime
}

export interface HatchTankSlot {
  type: 'hatch'
  startedAt: number
}

export interface BreedTankSlot {
  type: 'breed'
  startedAt: number
  hostId: string
  donorSnapshot: PersistedSlime  // full donor genetics captured at startBreed time;
                                  // donor is removed from pen immediately, so this snapshot
                                  // is the only source of truth at resolveBreed time
}

export type TankSlot = HatchTankSlot | BreedTankSlot

export interface PersistedGameState {
  id: number // always 1 — single-row save
  gold: number
  penCapacity: number
  slimes: PersistedSlime[]
  tanks: Array<TankSlot | null>  // length always equals tankCount; null = empty slot
  tankCount: number
  displaySlots: Array<PersistedDisplaySlot | null>
}

class SlimeBreederDB extends Dexie {
  gameState!: Table<PersistedGameState>

  constructor() {
    super('SlimeBreederDB')
    this.version(1).stores({ gameState: 'id' })
    this.version(2).stores({ gameState: 'id' }).upgrade((tx) =>
      tx
        .table('gameState')
        .toCollection()
        .modify((row) => {
          if (row.hatchStartedAt === undefined) row.hatchStartedAt = null
          if (row.displaySlots === undefined) row.displaySlots = [null, null]
        }),
    )
    this.version(3).stores({ gameState: 'id' }).upgrade((tx) =>
      tx
        .table('gameState')
        .toCollection()
        .modify((row) => {
          // Migrate hatchStartedAt (v2) → tanks[0] (v3)
          const slot: TankSlot | null =
            row.hatchStartedAt != null
              ? { type: 'hatch', startedAt: row.hatchStartedAt }
              : null
          row.tanks = [slot]
          row.tankCount = 1
          delete row.hatchStartedAt
        }),
    )
  }
}

export const db = new SlimeBreederDB()
```

- [ ] **Step 1.2: Add breeding config constants to config.ts**

Replace the entire contents of `src/config.ts`:

```ts
export const HATCH_DURATION_MS = 30_000
export const PEN_UPGRADE_COST = 20
export const DISPLAY_SLOT_COUNT = 2
export const DISPLAY_BASE_RATE = 0.5 // gold per second per colorTier x shapeTier

/**
 * Weighted rarity table for tier selection.
 * Weights are relative (they need not sum to 100).
 * Designer knob: adjust weights here to change drop rates.
 * Current targets: T1=60%, T2=30%, T3=10%
 */
export const TIER_WEIGHTS: { tier: number; weight: number }[] = [
  { tier: 1, weight: 60 },
  { tier: 2, weight: 30 },
  { tier: 3, weight: 10 },
]

/** Gold cost to add a new incubation tank slot (Roost from GDD §4.4). */
export const TANK_UPGRADE_COST = 50

/** Probability (0–1) that one trait tier mutates +1 after breeding. */
export const BREED_MUTATION_CHANCE = 0.15

/** Probability (0–1) that each trait inherits from the host vs. donor. */
export const BREED_HOST_WEIGHT = 0.60
```

- [ ] **Step 1.3: Run tests to confirm nothing broke**

Run: `npm test`

Expected: all 40 tests pass (zero changes to test files).

- [ ] **Step 1.4: Commit**

```bash
git add src/db/db.ts src/config.ts
git commit -m "feat: add tank slot types, breeding config constants, Dexie v3 schema migration"
```

---

## Task 2: Store Multi-Tank Refactor + CHAMBER UI Compatibility

**Files:**
- Modify: `src/store/gameStore.ts`
- Modify: `src/components/IncubationProgress.tsx`
- Modify: `src/components/HatchButton.tsx`
- Modify: `src/__tests__/gameStore.test.ts`

`hatchStartedAt` is removed from the store. `tanks: Array<TankSlot | null>` and `tankCount: number` replace it. `IncubationProgress` is refactored from store-reading to prop-driven so `TankCard` can reuse it. `HatchButton` is updated to use `tanks`. Tests are updated before implementation (TDD).

- [ ] **Step 2.1: Update gameStore tests to use tanks[] (they will fail)**

Replace the entire contents of `src/__tests__/gameStore.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../store/gameStore'
import { DISPLAY_BASE_RATE, TANK_UPGRADE_COST } from '../config'

vi.mock('../db/db', () => ({
  db: {
    gameState: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    },
  },
}))

beforeEach(() => {
  useGameStore.setState({
    gold: 50,
    penCapacity: 5,
    slimes: [],
    tanks: [null],
    tankCount: 1,
    displaySlots: [null, null],
  })
})

// ── Incubation ────────────────────────────────────────────────────

describe('startHatch', () => {
  it('puts a hatch slot in tanks[0]', () => {
    useGameStore.getState().startHatch()
    const slot = useGameStore.getState().tanks[0]
    expect(slot?.type).toBe('hatch')
    expect(typeof (slot as any)?.startedAt).toBe('number')
  })

  it('is a no-op when pen is full', () => {
    useGameStore.setState({ penCapacity: 2 })
    const { startHatch, resolveHatch } = useGameStore.getState()
    startHatch(); resolveHatch(0)
    startHatch(); resolveHatch(0)
    startHatch() // pen full — third startHatch should be blocked
    expect(useGameStore.getState().slimes).toHaveLength(2)
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })

  it('is a no-op when tank is already occupied', () => {
    useGameStore.getState().startHatch()
    const first = useGameStore.getState().tanks[0]
    useGameStore.getState().startHatch()
    expect(useGameStore.getState().tanks[0]).toBe(first)
  })
})

describe('resolveHatch', () => {
  it('adds a slime and clears tanks[0]', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch(0)
    expect(useGameStore.getState().slimes).toHaveLength(1)
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })
})

describe('loadGame — incubation', () => {
  it('auto-resolves an expired hatch tank on load', async () => {
    const { db } = await import('../db/db')
    const expiredAt = Date.now() - 60_000
    vi.mocked(db.gameState.get).mockResolvedValueOnce({
      id: 1, gold: 50, penCapacity: 5, slimes: [],
      tanks: [{ type: 'hatch', startedAt: expiredAt }],
      tankCount: 1,
      displaySlots: [null, null],
    })
    await useGameStore.getState().loadGame()
    expect(useGameStore.getState().slimes).toHaveLength(1)
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })

  it('preserves an active hatch tank without resolving', async () => {
    const { db } = await import('../db/db')
    const activeAt = Date.now() - 5_000
    vi.mocked(db.gameState.get).mockResolvedValueOnce({
      id: 1, gold: 50, penCapacity: 5, slimes: [],
      tanks: [{ type: 'hatch', startedAt: activeAt }],
      tankCount: 1,
      displaySlots: [null, null],
    })
    await useGameStore.getState().loadGame()
    expect(useGameStore.getState().slimes).toHaveLength(0)
    expect(useGameStore.getState().tanks[0]).toMatchObject({ type: 'hatch', startedAt: activeAt })
  })
})

// ── Sell / upgrade ────────────────────────────────────────────────

describe('sellSlime', () => {
  it('removes slime and adds its value to Gold', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    const goldBefore = useGameStore.getState().gold
    useGameStore.getState().sellSlime(slime.id)
    expect(useGameStore.getState().slimes).toHaveLength(0)
    expect(useGameStore.getState().gold).toBe(goldBefore + slime.actualValue)
  })
})

describe('buyPenUpgrade', () => {
  it('increases penCapacity by 1 and deducts gold', () => {
    useGameStore.setState({ gold: 50 })
    useGameStore.getState().buyPenUpgrade()
    expect(useGameStore.getState().penCapacity).toBe(6)
    expect(useGameStore.getState().gold).toBe(30)
  })

  it('does not buy when gold < cost', () => {
    useGameStore.setState({ gold: 10 })
    useGameStore.getState().buyPenUpgrade()
    expect(useGameStore.getState().penCapacity).toBe(5)
  })
})

describe('buyTankUpgrade', () => {
  it('adds a null slot to tanks and increments tankCount', () => {
    useGameStore.setState({ gold: 100 })
    useGameStore.getState().buyTankUpgrade()
    expect(useGameStore.getState().tankCount).toBe(2)
    expect(useGameStore.getState().tanks).toHaveLength(2)
    expect(useGameStore.getState().tanks[1]).toBeNull()
    expect(useGameStore.getState().gold).toBe(100 - TANK_UPGRADE_COST)
  })

  it('does not buy when gold < TANK_UPGRADE_COST', () => {
    useGameStore.setState({ gold: 30 })
    useGameStore.getState().buyTankUpgrade()
    expect(useGameStore.getState().tankCount).toBe(1)
  })
})

// ── Display Rooms ─────────────────────────────────────────────────

describe('assignToDisplay', () => {
  it('removes slime from slimes[]', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 0)
    expect(useGameStore.getState().slimes).toHaveLength(0)
  })

  it('puts slime in correct slot index', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 1)
    expect(useGameStore.getState().displaySlots[1]?.slimeId).toBe(slime.id)
    expect(useGameStore.getState().displaySlots[0]).toBeNull()
  })

  it('is a no-op when target slot is already occupied', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [first, second] = useGameStore.getState().slimes
    useGameStore.getState().assignToDisplay(first.id, 0)
    const existingSlotId = useGameStore.getState().displaySlots[0]?.slimeId
    useGameStore.getState().assignToDisplay(second.id, 0)
    expect(useGameStore.getState().displaySlots[0]?.slimeId).toBe(existingSlotId)
    expect(useGameStore.getState().slimes).toHaveLength(1)
  })
})

describe('unassignFromDisplay', () => {
  it('puts slime back in slimes[] with variance 0', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 0)
    useGameStore.getState().unassignFromDisplay(0)
    const restored = useGameStore.getState().slimes[0]
    expect(restored.id).toBe(slime.id)
    expect(restored.variance).toBe(0)
    expect(useGameStore.getState().displaySlots[0]).toBeNull()
  })
})

describe('loadGame — display rooms', () => {
  it('computes and adds elapsed display gold on load', async () => {
    const { db } = await import('../db/db')
    const assignedAt = Date.now() - 100_000
    vi.mocked(db.gameState.get).mockResolvedValueOnce({
      id: 1, gold: 50, penCapacity: 5, slimes: [],
      tanks: [null], tankCount: 1,
      displaySlots: [
        {
          slimeId: 'test-slime', assignedAt,
          slimeData: { id: 'test-slime', color: 'Green', shape: 'Blob', colorTier: 1, shapeTier: 1, actualValue: 10, createdAt: assignedAt },
        },
        null,
      ],
    })
    await useGameStore.getState().loadGame()
    const expectedGold = 50 + 100 * (1 * 1 * DISPLAY_BASE_RATE)
    expect(useGameStore.getState().gold).toBeCloseTo(expectedGold, 0)
  })
})
```

- [ ] **Step 2.2: Run tests to confirm failures**

Run: `npm test`

Expected: multiple failures — `tanks` is not in state, `resolveHatch(0)` signature mismatch, `buyTankUpgrade` not found. The non-incubation tests (sellSlime, buyPenUpgrade, display rooms) may also fail due to `beforeEach` using `tanks`.

- [ ] **Step 2.3: Replace gameStore.ts**

Replace the entire contents of `src/store/gameStore.ts`:

```ts
import { create } from 'zustand'
import { db } from '../db/db'
import { generateSlime } from '../utils/slimeGenerator'
import type { Slime, DisplaySlot } from '../types'
import type { TankSlot } from '../db/db'
import {
  PEN_UPGRADE_COST,
  HATCH_DURATION_MS,
  DISPLAY_SLOT_COUNT,
  DISPLAY_BASE_RATE,
  TANK_UPGRADE_COST,
} from '../config'

interface GameState {
  gold: number
  penCapacity: number
  slimes: Slime[]
  tanks: Array<TankSlot | null>
  tankCount: number
  displaySlots: Array<DisplaySlot | null>

  startHatch: (tankIndex?: number) => void
  resolveHatch: (tankIndex: number) => void
  startBreed: (hostId: string, donorId: string) => void
  resolveBreed: (tankIndex: number) => void
  sellSlime: (id: string) => void
  buyPenUpgrade: () => void
  buyTankUpgrade: () => void
  assignToDisplay: (slimeId: string, slotIndex: number) => void
  unassignFromDisplay: (slotIndex: number) => void
  loadGame: () => Promise<void>
}

async function persist(
  state: Pick<GameState, 'gold' | 'penCapacity' | 'slimes' | 'tanks' | 'tankCount' | 'displaySlots'>,
) {
  await db.gameState.put({
    id: 1,
    gold: state.gold,
    penCapacity: state.penCapacity,
    tanks: state.tanks,
    tankCount: state.tankCount,
    slimes: state.slimes.map((s) => ({
      id: s.id,
      color: s.color,
      shape: s.shape,
      colorTier: s.colorTier,
      shapeTier: s.shapeTier,
      actualValue: s.actualValue,
      createdAt: s.createdAt,
    })),
    displaySlots: state.displaySlots.map((slot) =>
      slot
        ? {
            slimeId: slot.slimeId,
            assignedAt: slot.assignedAt,
            slimeData: {
              id: slot.slime.id,
              color: slot.slime.color,
              shape: slot.slime.shape,
              colorTier: slot.slime.colorTier,
              shapeTier: slot.slime.shapeTier,
              actualValue: slot.slime.actualValue,
              createdAt: slot.slime.createdAt,
            },
          }
        : null,
    ),
  })
}

export const useGameStore = create<GameState>((set, get) => ({
  gold: 50,
  penCapacity: 5,
  slimes: [],
  tanks: [null],
  tankCount: 1,
  displaySlots: Array(DISPLAY_SLOT_COUNT).fill(null),

  startHatch(tankIndex?: number) {
    const { slimes, penCapacity, tanks } = get()
    if (slimes.length >= penCapacity) return
    const idx = tankIndex ?? tanks.findIndex((t) => t === null)
    if (idx === -1 || tanks[idx] !== null) return
    const newTanks = tanks.map((t, i): TankSlot | null =>
      i === idx ? { type: 'hatch', startedAt: Date.now() } : t,
    )
    const next = { ...get(), tanks: newTanks }
    set(next)
    persist(next)
  },

  resolveHatch(tankIndex: number) {
    const state = get()
    const slot = state.tanks[tankIndex]
    if (!slot || slot.type !== 'hatch') return // idempotent guard
    const newTanks = state.tanks.map((t, i): TankSlot | null => (i === tankIndex ? null : t))
    const next = {
      ...state,
      slimes: [...state.slimes, generateSlime()],
      tanks: newTanks,
    }
    set(next)
    persist(next)
  },

  startBreed(hostId: string, donorId: string) {
    const { slimes, tanks } = get()
    const host = slimes.find((s) => s.id === hostId)
    const donor = slimes.find((s) => s.id === donorId)
    if (!host || !donor) return
    const idx = tanks.findIndex((t) => t === null)
    if (idx === -1) return // no free tank
    const donorSnapshot = {
      id: donor.id,
      color: donor.color,
      shape: donor.shape,
      colorTier: donor.colorTier,
      shapeTier: donor.shapeTier,
      actualValue: donor.actualValue,
      createdAt: donor.createdAt,
    }
    const newTanks = tanks.map((t, i): TankSlot | null =>
      i === idx ? { type: 'breed', startedAt: Date.now(), hostId, donorSnapshot } : t,
    )
    const next = {
      ...get(),
      slimes: slimes.filter((s) => s.id !== donorId), // donor consumed immediately
      tanks: newTanks,
    }
    set(next)
    persist(next)
  },

  resolveBreed(tankIndex: number) {
    const state = get()
    const slot = state.tanks[tankIndex]
    if (!slot || slot.type !== 'breed') return // idempotent guard
    const host = state.slimes.find((s) => s.id === slot.hostId)
    if (!host) return // host not found — guard against corrupt state
    // breedSlimes imported here to avoid circular dependency during testing
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { breedSlimes } = require('../utils/breedSlimes') as typeof import('../utils/breedSlimes')
    const offspring = breedSlimes(host, slot.donorSnapshot)
    const newTanks = state.tanks.map((t, i): TankSlot | null => (i === tankIndex ? null : t))
    const next = {
      ...state,
      slimes: [...state.slimes, offspring],
      tanks: newTanks,
    }
    set(next)
    persist(next)
  },

  sellSlime(id: string) {
    const { slimes, gold } = get()
    const slime = slimes.find((s) => s.id === id)
    if (!slime) return
    const next = { ...get(), gold: gold + slime.actualValue, slimes: slimes.filter((s) => s.id !== id) }
    set(next)
    persist(next)
  },

  buyPenUpgrade() {
    const { gold, penCapacity } = get()
    if (gold < PEN_UPGRADE_COST) return
    const next = { ...get(), gold: gold - PEN_UPGRADE_COST, penCapacity: penCapacity + 1 }
    set(next)
    persist(next)
  },

  buyTankUpgrade() {
    const { gold, tankCount, tanks } = get()
    if (gold < TANK_UPGRADE_COST) return
    const next = {
      ...get(),
      gold: gold - TANK_UPGRADE_COST,
      tankCount: tankCount + 1,
      tanks: [...tanks, null],
    }
    set(next)
    persist(next)
  },

  assignToDisplay(slimeId: string, slotIndex: number) {
    const { slimes, displaySlots } = get()
    if (displaySlots[slotIndex] !== null) return
    const slime = slimes.find((s) => s.id === slimeId)
    if (!slime) return
    const newSlots = displaySlots.map((s, i) =>
      i === slotIndex ? { slimeId, assignedAt: Date.now(), slime } : s,
    )
    const next = {
      ...get(),
      slimes: slimes.filter((s) => s.id !== slimeId),
      displaySlots: newSlots,
    }
    set(next)
    persist(next)
  },

  unassignFromDisplay(slotIndex: number) {
    const { displaySlots, slimes } = get()
    const slot = displaySlots[slotIndex]
    if (!slot) return
    const restoredSlime: Slime = { ...slot.slime, variance: 0 }
    const newSlots = displaySlots.map((s, i) => (i === slotIndex ? null : s))
    const next = { ...get(), slimes: [...slimes, restoredSlime], displaySlots: newSlots }
    set(next)
    persist(next)
  },

  async loadGame() {
    const saved = await db.gameState.get(1)
    if (!saved) return

    const now = Date.now()
    let gold = saved.gold

    // Credit accumulated display room income (idle game style)
    const displaySlots: Array<DisplaySlot | null> = (
      saved.displaySlots ?? Array(DISPLAY_SLOT_COUNT).fill(null)
    ).map((slot) => {
      if (!slot) return null
      const elapsedSec = (now - slot.assignedAt) / 1000
      const rate = slot.slimeData.colorTier * slot.slimeData.shapeTier * DISPLAY_BASE_RATE
      gold += elapsedSec * rate
      return {
        slimeId: slot.slimeId,
        assignedAt: slot.assignedAt,
        slime: {
          ...slot.slimeData,
          color: slot.slimeData.color as import('../types').SlimeColor,
          shape: slot.slimeData.shape as import('../types').SlimeShape,
          variance: 0,
        },
      }
    })

    const tanks: Array<TankSlot | null> = saved.tanks ?? [null]
    const tankCount = saved.tankCount ?? 1

    set({
      gold: Math.floor(gold),
      penCapacity: saved.penCapacity,
      tanks,
      tankCount,
      displaySlots,
      slimes: saved.slimes.map((s) => ({
        ...s,
        color: s.color as import('../types').SlimeColor,
        shape: s.shape as import('../types').SlimeShape,
        variance: 0,
      })),
    })

    // Auto-resolve any expired tanks
    tanks.forEach((slot, i) => {
      if (slot && now - slot.startedAt >= HATCH_DURATION_MS) {
        if (slot.type === 'hatch') get().resolveHatch(i)
        else if (slot.type === 'breed') get().resolveBreed(i)
      }
    })
  },
}))
```

- [ ] **Step 2.4: Refactor IncubationProgress to be prop-driven**

Replace the entire contents of `src/components/IncubationProgress.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { HATCH_DURATION_MS } from '../config'

interface Props {
  startedAt: number
  onComplete: () => void
  label?: string
}

export function IncubationProgress({ startedAt, onComplete, label = 'INCUBATING_EGG' }: Props) {
  const [pct, setPct] = useState(0)
  const [secsLeft, setSecsLeft] = useState(Math.ceil(HATCH_DURATION_MS / 1000))

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const p = Math.min(elapsed / HATCH_DURATION_MS, 1)
      setPct(p)
      setSecsLeft(Math.max(0, Math.ceil((HATCH_DURATION_MS - elapsed) / 1000)))
      if (p >= 1) {
        clearInterval(id) // stop ticker before calling onComplete — prevents multi-fire
        onComplete()
      }
    }, 100)
    return () => clearInterval(id)
  }, [startedAt, onComplete])

  return (
    <section className="bg-surface-container-high p-6">
      <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-2">
        {label} — {secsLeft}s
      </p>
      <div className="w-full bg-surface-container-highest h-5">
        <div
          className="h-full bg-primary-container"
          style={{ width: `${(pct * 100).toFixed(1)}%` }}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2.5: Update HatchButton to use tanks array**

Replace the entire contents of `src/components/HatchButton.tsx`:

```tsx
import { useGameStore } from '../store/gameStore'
import { IncubationProgress } from './IncubationProgress'
import type { HatchTankSlot } from '../db/db'

export function HatchButton() {
  const startHatch = useGameStore((s) => s.startHatch)
  const resolveHatch = useGameStore((s) => s.resolveHatch)
  const slimes = useGameStore((s) => s.slimes)
  const penCapacity = useGameStore((s) => s.penCapacity)
  const tanks = useGameStore((s) => s.tanks)

  const isFull = slimes.length >= penCapacity
  const allOccupied = tanks.every((t) => t !== null)

  // Show the first active hatch tank in CHAMBER (breed tanks shown in MUTATE)
  const activeHatchIndex = tanks.findIndex((t) => t !== null && t.type === 'hatch')

  if (activeHatchIndex !== -1) {
    const slot = tanks[activeHatchIndex] as HatchTankSlot
    return (
      <IncubationProgress
        startedAt={slot.startedAt}
        onComplete={() => resolveHatch(activeHatchIndex)}
      />
    )
  }

  return (
    <section className="bg-surface-container-high p-6 flex flex-col items-center">
      <button
        onClick={() => startHatch()}
        disabled={isFull || allOccupied}
        className={`w-full font-headline font-black text-lg py-5 uppercase tracking-[0.2em] transition-none ${
          isFull || allOccupied
            ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
            : 'bg-primary-container text-on-primary-container'
        }`}
      >
        {isFull
          ? 'CONTAINMENT_FULL'
          : allOccupied
            ? 'ALL_TANKS_OCCUPIED'
            : 'INITIATE_INCUBATION'}
      </button>
      {isFull && (
        <p className="text-[10px] font-label text-outline-variant uppercase tracking-widest mt-2">
          Expand capacity to hatch additional specimens.
        </p>
      )}
    </section>
  )
}
```

- [ ] **Step 2.6: Run tests to confirm all pass**

Run: `npm test`

Expected: all tests pass. Count: 6 economics + 8 slimeGenerator + 18 gameStore (was 14, +2 buyTankUpgrade, +2 incubation tests updated) + 12 SlimeVisual = ~44 tests.

Note: `startBreed` and `resolveBreed` are in the store but have no tests yet — that is Task 4.

- [ ] **Step 2.7: Commit**

```bash
git add src/store/gameStore.ts src/components/IncubationProgress.tsx src/components/HatchButton.tsx src/__tests__/gameStore.test.ts
git commit -m "feat: multi-tank store architecture — replace hatchStartedAt with tanks array"
```

---

## Task 3: breedSlimes Utility

**Files:**
- Create: `src/utils/breedSlimes.ts`
- Create: `src/__tests__/breedSlimes.test.ts`

Pure genetics function. Fully independent of the store. Write tests first.

**Math.random() call order inside breedSlimes:**
1. `colorFromHost` — `< BREED_HOST_WEIGHT (0.60)` → host color wins
2. `shapeFromHost` — `< BREED_HOST_WEIGHT (0.60)` → host shape wins
3. `mutationFires` — `< BREED_MUTATION_CHANCE (0.15)` → mutation triggers
4. `whichTrait` — `* BREED_TRAITS.length (2)` → 0=color, 1=shape (only called if mutation fires)
5. `variance` — `* 0.2 - 0.1` → offspring variance

- [ ] **Step 3.1: Write the failing tests**

Create `src/__tests__/breedSlimes.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { breedSlimes } from '../utils/breedSlimes'
import type { Slime } from '../types'
import type { PersistedSlime } from '../db/db'

// Fixed test fixtures
const host: Slime = {
  id: 'host-1',
  color: 'Green',
  shape: 'Blob',
  colorTier: 2,
  shapeTier: 1,
  variance: 0,
  actualValue: 27,
  createdAt: 1000,
}

const donor: PersistedSlime = {
  id: 'donor-1',
  color: 'Red',
  shape: 'Spiked',
  colorTier: 1,
  shapeTier: 3,
  actualValue: 100,
  createdAt: 2000,
}

afterEach(() => vi.restoreAllMocks())

// Mock call sequence helper:
// breedSlimes calls Math.random() in this order:
//   1. colorFromHost (< 0.60 → host)
//   2. shapeFromHost (< 0.60 → host)
//   3. mutationFires (< 0.15 → fires)
//   4. whichTrait    (only if mutation fired — * 2, floor → 0=color 1=shape)
//   5. variance      (* 0.2 - 0.1)

describe('breedSlimes — host/donor inheritance', () => {
  it('inherits color and shape from host when random=0.5 (< 0.60, no mutation)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // call1: 0.5 < 0.60 → host color (Green T2)
    // call2: 0.5 < 0.60 → host shape (Blob T1)
    // call3: 0.5 < 0.15? NO → no mutation
    // call4: skipped
    // call5: variance = 0.5*0.2 - 0.1 = 0.0
    const offspring = breedSlimes(host, donor)
    expect(offspring.color).toBe('Green')
    expect(offspring.colorTier).toBe(2)
    expect(offspring.shape).toBe('Blob')
    expect(offspring.shapeTier).toBe(1)
  })

  it('inherits color and shape from donor when random=0.65 (>= 0.60, no mutation)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.65)
    // call1: 0.65 < 0.60? NO → donor color (Red T1)
    // call2: 0.65 < 0.60? NO → donor shape (Spiked T3)
    // call3: 0.65 < 0.15? NO → no mutation
    const offspring = breedSlimes(host, donor)
    expect(offspring.color).toBe('Red')
    expect(offspring.colorTier).toBe(1)
    expect(offspring.shape).toBe('Spiked')
    expect(offspring.shapeTier).toBe(3)
  })
})

describe('breedSlimes — mutation', () => {
  it('mutation on color bumps colorTier +1 (host color inherited, then mutated)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    // call1: 0.0 < 0.60 → host color (Green T2)
    // call2: 0.0 < 0.60 → host shape (Blob T1)
    // call3: 0.0 < 0.15 → mutation fires!
    // call4: floor(0.0 * 2) = 0 → mutate color
    // result: colorTier 2 + 1 = 3
    const offspring = breedSlimes(host, donor)
    expect(offspring.color).toBe('Green')     // label unchanged
    expect(offspring.colorTier).toBe(3)       // T2 → T3 via mutation
    expect(offspring.shapeTier).toBe(1)       // host shape, no mutation
  })

  it('mutation on shape bumps shapeTier +1', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)   // colorFromHost: TRUE (host Green T2)
      .mockReturnValueOnce(0.5)   // shapeFromHost: TRUE (host Blob T1)
      .mockReturnValueOnce(0.05)  // mutationFires: 0.05 < 0.15 → YES
      .mockReturnValueOnce(0.5)   // whichTrait: floor(0.5*2)=1 → shape
      .mockReturnValueOnce(0.0)   // variance
    const offspring = breedSlimes(host, donor)
    expect(offspring.shape).toBe('Blob')    // label unchanged
    expect(offspring.shapeTier).toBe(2)     // T1 → T2 via mutation
    expect(offspring.colorTier).toBe(2)     // host, no mutation
  })

  it('mutation caps tier at 3', () => {
    const t3Host: Slime = { ...host, colorTier: 3 }
    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    // mutation fires on color, but T3 is already max
    const offspring = breedSlimes(t3Host, donor)
    expect(offspring.colorTier).toBe(3) // stays 3, not 4
  })

  it('no mutation when random=0.5 (0.5 >= 0.15)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const offspring = breedSlimes(host, donor)
    // host T2 color, no mutation → stays T2
    expect(offspring.colorTier).toBe(2)
    expect(offspring.shapeTier).toBe(1)
  })
})

describe('breedSlimes — offspring metadata', () => {
  it('generates a unique id different from both parents', () => {
    const o1 = breedSlimes(host, donor)
    const o2 = breedSlimes(host, donor)
    expect(o1.id).not.toBe(host.id)
    expect(o1.id).not.toBe(donor.id)
    expect(o1.id).not.toBe(o2.id)
  })

  it('actualValue is positive', () => {
    for (let i = 0; i < 20; i++) {
      const offspring = breedSlimes(host, donor)
      expect(offspring.actualValue).toBeGreaterThanOrEqual(1)
    }
  })

  it('variance is stored on offspring', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)  // colorFromHost
      .mockReturnValueOnce(0.5)  // shapeFromHost
      .mockReturnValueOnce(0.5)  // no mutation
      .mockReturnValueOnce(0.0)  // variance roll: 0.0*0.2-0.1 = -0.1
    const offspring = breedSlimes(host, donor)
    expect(offspring.variance).toBeCloseTo(-0.1, 2)
  })
})
```

- [ ] **Step 3.2: Run tests to confirm breedSlimes tests fail**

Run: `npm test`

Expected: all `breedSlimes` tests fail with "Cannot find module '../utils/breedSlimes'". All other tests continue to pass.

- [ ] **Step 3.3: Implement breedSlimes**

Create `src/utils/breedSlimes.ts`:

```ts
import { BREED_HOST_WEIGHT, BREED_MUTATION_CHANCE, TIER_WEIGHTS } from '../config'
import { computeBaseValue } from './economics'
import type { Slime, SlimeColor, SlimeShape } from '../types'
import type { PersistedSlime } from '../db/db'

/** Trait dimensions available for inheritance and mutation. Add 'pattern' | 'accessory' here later. */
const BREED_TRAITS = ['color', 'shape'] as const
type BreedTrait = (typeof BREED_TRAITS)[number]

const MAX_TIER = Math.max(...TIER_WEIGHTS.map((w) => w.tier))

/**
 * Produce a genetically-derived offspring from two parent slimes.
 * @param host   - The surviving parent (stays in pen after breed)
 * @param donor  - The consumed parent (snapshot stored on BreedTankSlot)
 *
 * Inheritance: each trait dimension independently rolls 60/40 host vs donor.
 * Mutation: 15% chance that ONE randomly-selected trait tier bumps +1 (capped at MAX_TIER).
 */
export function breedSlimes(host: Slime, donor: PersistedSlime): Slime {
  // Per-trait inheritance: 60% host, 40% donor
  const colorFromHost = Math.random() < BREED_HOST_WEIGHT
  const shapeFromHost = Math.random() < BREED_HOST_WEIGHT

  let color: SlimeColor = (colorFromHost ? host.color : donor.color) as SlimeColor
  let colorTier = colorFromHost ? host.colorTier : donor.colorTier
  let shape: SlimeShape = (shapeFromHost ? host.shape : donor.shape) as SlimeShape
  let shapeTier = shapeFromHost ? host.shapeTier : donor.shapeTier

  // 15% mutation: pick one trait dimension, bump its tier +1 (capped at MAX_TIER)
  if (Math.random() < BREED_MUTATION_CHANCE) {
    const mutatedTrait: BreedTrait = BREED_TRAITS[Math.floor(Math.random() * BREED_TRAITS.length)]
    if (mutatedTrait === 'color') colorTier = Math.min(colorTier + 1, MAX_TIER)
    else shapeTier = Math.min(shapeTier + 1, MAX_TIER)
  }

  const variance = parseFloat((Math.random() * 0.2 - 0.1).toFixed(2))
  const actualValue = computeBaseValue(colorTier, shapeTier, variance)

  return {
    id: crypto.randomUUID(),
    color,
    shape,
    colorTier,
    shapeTier,
    variance,
    actualValue,
    createdAt: Date.now(),
  }
}
```

- [ ] **Step 3.4: Run all tests to confirm they pass**

Run: `npm test`

Expected: all tests pass including the new breedSlimes tests.

- [ ] **Step 3.5: Commit**

```bash
git add src/utils/breedSlimes.ts src/__tests__/breedSlimes.test.ts
git commit -m "feat: breedSlimes — 60/40 trait inheritance with 15% single-trait mutation"
```

---

## Task 4: Store — startBreed and resolveBreed Tests

**Files:**
- Modify: `src/__tests__/gameStore.test.ts`

`startBreed` and `resolveBreed` are already in the store (added in Task 2). This task adds their tests to verify correctness.

- [ ] **Step 4.1: Add breed tests to gameStore.test.ts**

Append the following `describe` blocks to the end of `src/__tests__/gameStore.test.ts`:

```ts
// ── Breeding ──────────────────────────────────────────────────────

describe('startBreed', () => {
  it('removes donor from slimes[] immediately', () => {
    // Hatch two slimes
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    useGameStore.getState().startBreed(host.id, donor.id)
    expect(useGameStore.getState().slimes).toHaveLength(1)
    expect(useGameStore.getState().slimes[0].id).toBe(host.id)
  })

  it('occupies the first free tank as a breed slot with donorSnapshot', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    useGameStore.getState().startBreed(host.id, donor.id)
    const tank = useGameStore.getState().tanks[0]
    expect(tank?.type).toBe('breed')
    expect((tank as any)?.hostId).toBe(host.id)
    expect((tank as any)?.donorSnapshot?.id).toBe(donor.id)
  })

  it('is a no-op when no free tank exists', () => {
    useGameStore.getState().startHatch() // occupy the only tank
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    // tank[0] is occupied by hatch from the first startHatch
    useGameStore.getState().startBreed(host.id, donor.id)
    // breed should be blocked — tank already has hatch
    expect(useGameStore.getState().tanks[0]?.type).toBe('hatch')
    expect(useGameStore.getState().slimes).toHaveLength(2)
  })
})

describe('resolveBreed', () => {
  it('adds offspring to slimes[] and clears the breed tank', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    useGameStore.getState().startBreed(host.id, donor.id)
    useGameStore.getState().resolveBreed(0)
    // host stayed + offspring added = 2
    expect(useGameStore.getState().slimes).toHaveLength(2)
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })
})

describe('loadGame — breed', () => {
  it('auto-resolves an expired breed tank on load', async () => {
    const { db } = await import('../db/db')
    const expiredAt = Date.now() - 60_000
    const hostSlime = {
      id: 'host-1', color: 'Green', shape: 'Blob',
      colorTier: 1, shapeTier: 1, actualValue: 10, createdAt: 1000,
    }
    const donorSnapshot = {
      id: 'donor-1', color: 'Red', shape: 'Spiked',
      colorTier: 1, shapeTier: 1, actualValue: 10, createdAt: 2000,
    }
    vi.mocked(db.gameState.get).mockResolvedValueOnce({
      id: 1, gold: 50, penCapacity: 5,
      slimes: [hostSlime],
      tanks: [{ type: 'breed', startedAt: expiredAt, hostId: 'host-1', donorSnapshot }],
      tankCount: 1,
      displaySlots: [null, null],
    })
    await useGameStore.getState().loadGame()
    // host still present + offspring added
    expect(useGameStore.getState().slimes).toHaveLength(2)
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })
})
```

- [ ] **Step 4.2: Run tests to confirm the new breed tests pass**

Run: `npm test`

Expected: all tests pass. The breed tests exercise `startBreed`/`resolveBreed` which were already implemented in Task 2.

- [ ] **Step 4.3: Commit**

```bash
git add src/__tests__/gameStore.test.ts
git commit -m "test: add startBreed, resolveBreed, and loadGame-breed tests"
```

---

## Task 5: SlimePicker Generalization

**Files:**
- Create: `src/components/SlimePicker.tsx`
- Delete: `src/components/DisplaySlotPicker.tsx`
- Modify: `src/components/DisplayRooms.tsx`

`DisplaySlotPicker` is tightly coupled to `assignToDisplay`. `SlimePicker` is a generic modal that accepts `onSelect(slime)` and `excludeIds` — usable for both Display assignment and Breeding.

- [ ] **Step 5.1: Create SlimePicker.tsx**

Create `src/components/SlimePicker.tsx`:

```tsx
import { useGameStore } from '../store/gameStore'
import { COLOR_CHIP_CLASSES, SHAPE_DESIGNATIONS, COLOR_DESIGNATIONS } from '../types'
import { SlimeVisual } from './SlimeVisual'
import type { Slime } from '../types'

interface Props {
  onSelect: (slime: Slime) => void
  onClose: () => void
  excludeIds?: string[]  // slimes to hide (e.g. already selected in the other breed slot)
  title?: string
}

export function SlimePicker({ onSelect, onClose, excludeIds = [], title = 'SELECT_SPECIMEN' }: Props) {
  const slimes = useGameStore((s) => s.slimes).filter((s) => !excludeIds.includes(s.id))

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-high pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest p-4 border-b border-outline-variant/20">
          {title}
        </p>

        {slimes.length === 0 ? (
          <p className="text-[11px] font-label text-on-surface-variant/50 uppercase tracking-widest p-6 text-center">
            No specimens available.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/10">
            {slimes.map((slime) => (
              <li key={slime.id}>
                <button
                  onClick={() => { onSelect(slime); onClose() }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-highest transition-none text-left"
                >
                  <SlimeVisual color={slime.color} shape={slime.shape} size={40} />
                  <div className="flex-grow">
                    <span
                      className={`text-[10px] font-label font-bold uppercase px-2 py-0.5 ${COLOR_CHIP_CLASSES[slime.color]}`}
                    >
                      {COLOR_DESIGNATIONS[slime.color]}
                    </span>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                      {SHAPE_DESIGNATIONS[slime.shape]}
                    </p>
                  </div>
                  <span className="text-sm font-headline font-bold text-primary">
                    {slime.actualValue}G
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: Update DisplayRooms to use SlimePicker**

In `src/components/DisplayRooms.tsx`, replace the old import and usage:

Replace:
```ts
import { DisplaySlotPicker } from './DisplaySlotPicker'
```
With:
```ts
import { SlimePicker } from './SlimePicker'
import { useGameStore } from '../store/gameStore'
```
(Note: `useGameStore` is already imported — only add SlimePicker import)

Replace the import line only:
```ts
import { SlimePicker } from './SlimePicker'
```

Replace the usage at the bottom of the JSX:
```tsx
{pickerSlot !== null && (
  <DisplaySlotPicker slotIndex={pickerSlot} onClose={() => setPickerSlot(null)} />
)}
```
With:
```tsx
{pickerSlot !== null && (
  <SlimePicker
    title={`SELECT_SPECIMEN — SLOT_${pickerSlot + 1}`}
    onSelect={(slime) => {
      useGameStore.getState().assignToDisplay(slime.id, pickerSlot)
      setPickerSlot(null)
    }}
    onClose={() => setPickerSlot(null)}
  />
)}
```

- [ ] **Step 5.3: Delete DisplaySlotPicker.tsx**

```bash
rm src/components/DisplaySlotPicker.tsx
```

- [ ] **Step 5.4: Run tests to confirm nothing broke**

Run: `npm test`

Expected: all tests pass (no tests reference DisplaySlotPicker directly).

- [ ] **Step 5.5: Commit**

```bash
git add src/components/SlimePicker.tsx src/components/DisplayRooms.tsx
git rm src/components/DisplaySlotPicker.tsx
git commit -m "refactor: generalize DisplaySlotPicker → SlimePicker with onSelect + excludeIds props"
```

---

## Task 6: TankCard Component

**Files:**
- Create: `src/components/TankCard.tsx`

Displays a single tank slot in one of three states: empty (HATCH + BREED buttons), hatch in progress, or breed in progress with parent thumbnails.

- [ ] **Step 6.1: Create TankCard.tsx**

Create `src/components/TankCard.tsx`:

```tsx
import { useGameStore } from '../store/gameStore'
import { IncubationProgress } from './IncubationProgress'
import { SlimeVisual } from './SlimeVisual'
import type { BreedTankSlot } from '../db/db'
import type { SlimeColor, SlimeShape } from '../types'

interface Props {
  tankIndex: number
  onBreedClick: () => void  // scrolls to BreedingPanel; does not start a breed
}

export function TankCard({ tankIndex, onBreedClick }: Props) {
  const slot = useGameStore((s) => s.tanks[tankIndex])
  const startHatch = useGameStore((s) => s.startHatch)
  const resolveHatch = useGameStore((s) => s.resolveHatch)
  const resolveBreed = useGameStore((s) => s.resolveBreed)
  const slimes = useGameStore((s) => s.slimes)
  const penCapacity = useGameStore((s) => s.penCapacity)
  const isFull = slimes.length >= penCapacity

  // ── Empty slot ────────────────────────────────────────────────
  if (slot === null) {
    return (
      <div className="bg-surface-container border border-outline-variant/20 p-3 flex items-center gap-2">
        <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest flex-grow">
          TANK_{tankIndex + 1} — IDLE
        </span>
        <button
          onClick={() => startHatch(tankIndex)}
          disabled={isFull}
          className="text-[11px] font-label py-2 px-4 uppercase tracking-widest bg-primary-container text-on-primary-container disabled:opacity-40 disabled:cursor-not-allowed"
        >
          HATCH
        </button>
        <button
          onClick={onBreedClick}
          className="text-[11px] font-label py-2 px-4 uppercase tracking-widest bg-surface-container-highest text-primary"
        >
          BREED
        </button>
      </div>
    )
  }

  // ── Hatch in progress ─────────────────────────────────────────
  if (slot.type === 'hatch') {
    return (
      <IncubationProgress
        startedAt={slot.startedAt}
        onComplete={() => resolveHatch(tankIndex)}
        label={`TANK_${tankIndex + 1} — HATCH_IN_PROGRESS`}
      />
    )
  }

  // ── Breed in progress ─────────────────────────────────────────
  const breedSlot = slot as BreedTankSlot
  return (
    <div className="bg-surface-container-high border border-outline-variant/20">
      <div className="flex items-center gap-3 p-3 pb-0">
        <SlimeVisual
          color={breedSlot.donorSnapshot.color as SlimeColor}
          shape={breedSlot.donorSnapshot.shape as SlimeShape}
          size={32}
        />
        <span className="text-on-surface-variant text-xs font-headline">×</span>
        <HostVisual hostId={breedSlot.hostId} />
        <span className="ml-auto text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
          TANK_{tankIndex + 1}
        </span>
      </div>
      <IncubationProgress
        startedAt={breedSlot.startedAt}
        onComplete={() => resolveBreed(tankIndex)}
        label="BREED_IN_PROGRESS"
      />
    </div>
  )
}

/** Looks up the host slime by id from the live store for its visual. */
function HostVisual({ hostId }: { hostId: string }) {
  const host = useGameStore((s) => s.slimes.find((sl) => sl.id === hostId))
  if (!host) return null
  return <SlimeVisual color={host.color} shape={host.shape} size={32} />
}
```

- [ ] **Step 6.2: Run tests to confirm nothing broke**

Run: `npm test`

Expected: all tests pass (no tests for UI-only components).

- [ ] **Step 6.3: Commit**

```bash
git add src/components/TankCard.tsx
git commit -m "feat: TankCard — empty/hatch/breed states for single incubation slot"
```

---

## Task 7: BreedingPanel Component

**Files:**
- Create: `src/components/BreedingPanel.tsx`

Two-slot staging area. HOST and DONOR selected via SlimePicker. START BREED fires `store.startBreed()`.

- [ ] **Step 7.1: Create BreedingPanel.tsx**

Create `src/components/BreedingPanel.tsx`:

```tsx
import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { SlimeVisual } from './SlimeVisual'
import { SlimePicker } from './SlimePicker'
import type { Slime } from '../types'

export function BreedingPanel() {
  const [host, setHost] = useState<Slime | null>(null)
  const [donor, setDonor] = useState<Slime | null>(null)
  const [pickerOpen, setPickerOpen] = useState<'host' | 'donor' | null>(null)

  const startBreed = useGameStore((s) => s.startBreed)
  const tanks = useGameStore((s) => s.tanks)

  const hasFreeTank = tanks.some((t) => t === null)
  const canBreed = host !== null && donor !== null && hasFreeTank

  function handleStartBreed() {
    if (!host || !donor) return
    startBreed(host.id, donor.id)
    setHost(null)
    setDonor(null)
  }

  return (
    <section className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <span className="material-symbols-outlined text-sm text-on-surface-variant">science</span>
        <h3 className="font-headline text-sm font-bold uppercase tracking-[0.3em] text-on-surface-variant">
          BREEDING_LAB
        </h3>
      </div>

      {/* Parent slots */}
      <div className="flex items-center gap-3">
        <SlotButton
          slime={host}
          label="HOST"
          onClick={() => setPickerOpen('host')}
        />
        <span className="text-on-surface-variant font-headline text-2xl flex-shrink-0">×</span>
        <SlotButton
          slime={donor}
          label="DONOR"
          onClick={() => setPickerOpen('donor')}
          isConsumed
        />
      </div>

      {/* Start breed */}
      <button
        onClick={handleStartBreed}
        disabled={!canBreed}
        className={`w-full font-headline font-black text-lg py-4 uppercase tracking-[0.2em] transition-none ${
          canBreed
            ? 'bg-primary-container text-on-primary-container'
            : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50'
        }`}
      >
        {!hasFreeTank ? 'ALL_TANKS_OCCUPIED' : 'START_BREED'}
      </button>

      {/* Picker modal */}
      {pickerOpen && (
        <SlimePicker
          title={pickerOpen === 'host' ? 'SELECT_HOST' : 'SELECT_DONOR — WILL_BE_CONSUMED'}
          excludeIds={[
            ...(pickerOpen === 'host' && donor ? [donor.id] : []),
            ...(pickerOpen === 'donor' && host ? [host.id] : []),
          ]}
          onSelect={(slime) => {
            if (pickerOpen === 'host') setHost(slime)
            else setDonor(slime)
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}
    </section>
  )
}

interface SlotButtonProps {
  slime: Slime | null
  label: string
  onClick: () => void
  isConsumed?: boolean
}

function SlotButton({ slime, label, onClick, isConsumed = false }: SlotButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-outline-variant/30 bg-surface-container p-3 flex flex-col items-center gap-2 min-h-[100px] justify-center hover:bg-surface-container-high transition-none"
    >
      {slime ? (
        <>
          <SlimeVisual color={slime.color} shape={slime.shape} size={64} />
          <span className="text-[10px] font-label text-primary uppercase">{slime.actualValue}G</span>
          {isConsumed && (
            <span className="text-[9px] font-label text-error uppercase tracking-wider">⚠ CONSUMED</span>
          )}
        </>
      ) : (
        <>
          <span className="text-on-surface-variant/30 text-3xl leading-none">+</span>
          <span className="text-[10px] font-label text-on-surface-variant/50 uppercase">{label}</span>
        </>
      )}
    </button>
  )
}
```

- [ ] **Step 7.2: Run tests to confirm nothing broke**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 7.3: Commit**

```bash
git add src/components/BreedingPanel.tsx
git commit -m "feat: BreedingPanel — host/donor staging slots with SlimePicker integration"
```

---

## Task 8: MutatePage + Tab Routing

**Files:**
- Create: `src/components/MutatePage.tsx`
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/App.tsx`

Wire the MUTATE tab and enable tab switching. The CHAMBER tab stays as-is. `loadGame()` is already called in `main.tsx` before React mounts — do NOT move or duplicate it.

- [ ] **Step 8.1: Create MutatePage.tsx**

Create `src/components/MutatePage.tsx`:

```tsx
import { useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { TankCard } from './TankCard'
import { BreedingPanel } from './BreedingPanel'
import { TANK_UPGRADE_COST } from '../config'

export function MutatePage() {
  const tankCount = useGameStore((s) => s.tankCount)
  const gold = useGameStore((s) => s.gold)
  const buyTankUpgrade = useGameStore((s) => s.buyTankUpgrade)
  const breedingPanelRef = useRef<HTMLDivElement>(null)

  function scrollToBreeding() {
    breedingPanelRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-0">
      {/* ── INCUBATION TANKS ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">vaccines</span>
          <h3 className="font-headline text-sm font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            INCUBATION_TANKS
          </h3>
        </div>

        <div className="space-y-2 px-4">
          {Array.from({ length: tankCount }, (_, i) => (
            <TankCard key={i} tankIndex={i} onBreedClick={scrollToBreeding} />
          ))}
        </div>

        <div className="px-4 pt-3 pb-2">
          <button
            onClick={buyTankUpgrade}
            disabled={gold < TANK_UPGRADE_COST}
            className="w-full text-[11px] font-label py-3 px-4 uppercase tracking-widest bg-surface-container text-primary border border-outline-variant/30 hover:bg-surface-container-high transition-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ADD_TANK — ({TANK_UPGRADE_COST}G)
          </button>
        </div>
      </section>

      {/* ── BREEDING LAB ───────────────────────────────────────────── */}
      <div ref={breedingPanelRef}>
        <BreedingPanel />
      </div>
    </div>
  )
}
```

- [ ] **Step 8.2: Update BottomNav to accept tab props**

Replace the entire contents of `src/components/BottomNav.tsx`:

```tsx
type Tab = 'chamber' | 'mutate'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const NAV_ITEMS: Array<{ icon: string; label: string; tab: Tab | null }> = [
  { icon: 'database', label: 'CHAMBER', tab: 'chamber' },
  { icon: 'science',  label: 'MUTATE',  tab: 'mutate' },
  { icon: 'token',    label: 'MARKET',  tab: null },   // not yet implemented
  { icon: 'settings', label: 'SYSTEM',  tab: null },
]

export function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 flex justify-around items-stretch bg-surface-container-lowest z-50">
      {NAV_ITEMS.map(({ icon, label, tab }) => (
        <button
          key={label}
          onClick={() => tab && onTabChange(tab)}
          disabled={tab === null}
          className={`flex flex-col items-center justify-center h-full w-full transition-colors ${
            tab === activeTab
              ? 'bg-primary-container text-on-primary-container'
              : tab !== null
                ? 'text-on-surface-variant hover:bg-surface-container'
                : 'text-outline-variant cursor-not-allowed'
          }`}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={tab === activeTab ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>
          <span className="font-label text-[10px] tracking-tighter uppercase mt-0.5">{label}</span>
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 8.3: Update App.tsx with tab state**

Replace the entire contents of `src/App.tsx`:

```tsx
import { useState } from 'react'
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { HatchButton } from './components/HatchButton'
import { InventoryList } from './components/InventoryList'
import { DisplayRooms } from './components/DisplayRooms'
import { ExpandFacility } from './components/ExpandFacility'
import { BottomNav } from './components/BottomNav'
import { MutatePage } from './components/MutatePage'

type Tab = 'chamber' | 'mutate'

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chamber')

  return (
    <div className="min-h-screen bg-surface-container-lowest max-w-lg mx-auto flex flex-col">
      <Header />
      <main className="flex-grow overflow-y-auto space-y-0 pb-16">
        <StatsBar />
        {activeTab === 'chamber' && (
          <>
            <HatchButton />
            <InventoryList />
            <DisplayRooms />
            <ExpandFacility />
          </>
        )}
        {activeTab === 'mutate' && <MutatePage />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
```

Note: `pb-16` added to `<main>` so content is not hidden behind the fixed bottom nav.

- [ ] **Step 8.4: Run all tests to confirm nothing broke**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 8.5: Commit**

```bash
git add src/components/MutatePage.tsx src/components/BottomNav.tsx src/App.tsx
git commit -m "feat: MutatePage and tab routing — CHAMBER and MUTATE tabs now switchable"
```

---

## Verification Checklist

After all 8 tasks:

- [ ] `npm test` reports zero failures
- [ ] In browser: CHAMBER tab shows HatchButton + Inventory + Display + Expand (unchanged)
- [ ] In browser: MUTATE tab shows tank cards + breeding panel
- [ ] Empty tank card shows HATCH and BREED buttons
- [ ] HATCH button starts incubation in that tank (progress visible in MUTATE and CHAMBER)
- [ ] BREED button scrolls to BreedingPanel
- [ ] Selecting HOST and DONOR in BreedingPanel filters out already-selected slime in the other slot
- [ ] DONOR slot shows ⚠ CONSUMED chip
- [ ] START BREED removes donor immediately, occupies tank with breed slot (host+donor thumbnails visible)
- [ ] After 30s, breed resolves: offspring appears in BIOLOGICAL_ASSETS with correct genetics
- [ ] ADD_TANK button costs 50G and adds a second tank card
- [ ] Reload with active tanks preserves state; expired tanks auto-resolve on load
