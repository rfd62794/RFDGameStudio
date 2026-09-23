# Game Slice & Visual Slime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add incubation timer, display room passive income, and procedural SVG slime rendering to the Slime Breeder MVP.

**Architecture:** A `config.ts` constants file anchors all tuning values; the Zustand store gains two new action pairs (`startHatch`/`resolveHatch` and `assignToDisplay`/`unassignFromDisplay`); a `SlimeVisual` SVG component renders all 9 color×shape combinations with per-instance gradient IDs via `useId()`; a `DisplayRooms` section handles the live gold ticker with proper interval cleanup.

**Tech Stack:** React 19, Zustand v5, Dexie.js v4 (IndexedDB), Tailwind v4, Vitest 4 + React Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/config.ts` | **Create** | All tuning constants — single source of truth |
| `src/db/db.ts` | **Modify** | Dexie v2 schema: add `hatchStartedAt`, `displaySlots` with upgrade handler |
| `src/types.ts` | **Modify** | Add `DisplaySlot` interface (in-memory shape) |
| `src/components/SlimeVisual.tsx` | **Create** | Procedural SVG, color+shape props, `useId()` gradient IDs |
| `src/__tests__/SlimeVisual.test.tsx` | **Create** | 5 tests — all 9 combos render, unique IDs, drip, core |
| `src/store/gameStore.ts` | **Modify** | Remove `hatchSlime`; add `startHatch`, `resolveHatch`, `assignToDisplay`, `unassignFromDisplay`; extend `persist()` and `loadGame()` |
| `src/__tests__/gameStore.test.ts` | **Modify** | Replace `hatchSlime` tests; add incubation + display room tests; update `beforeEach` reset |
| `src/components/IncubationProgress.tsx` | **Create** | Progress bar with 100ms tick, calls `resolveHatch()` on expiry, clears interval on unmount |
| `src/components/HatchButton.tsx` | **Modify** | Branch on `hatchStartedAt`: show `IncubationProgress` or button; use `startHatch` |
| `src/components/SlimeCard.tsx` | **Modify** | Replace color-div placeholder with `<SlimeVisual>` |
| `src/components/DisplayRooms.tsx` | **Create** | Display chamber section: 2 slots, live gold ticker with cleanup |
| `src/components/DisplaySlotPicker.tsx` | **Create** | Modal overlay: lists pen slimes, tap to assign |
| `src/components/ExpandFacility.tsx` | **Modify** | Update import: `PEN_UPGRADE_COST` from `config` not `gameStore` |
| `src/App.tsx` | **Modify** | Add `<DisplayRooms>` between `InventoryList` and `ExpandFacility` |

---

## Task 1: Config File

> **Note:** This task is a pure refactor (no behavior change). It is exempt from the red-test TDD requirement — the existing passing test suite serves as the regression guard.

**Files:**
- Create: `src/config.ts`
- Modify: `src/store/gameStore.ts` (remove `PEN_UPGRADE_COST` export, import from config)
- Modify: `src/components/ExpandFacility.tsx` (update import path)

- [ ] **Step 1: Create `src/config.ts`**

```ts
export const HATCH_DURATION_MS = 30_000
export const PEN_UPGRADE_COST = 20
export const DISPLAY_SLOT_COUNT = 2
export const DISPLAY_BASE_RATE = 0.5 // gold per second per colorTier×shapeTier
```

- [ ] **Step 2: Update `gameStore.ts` — remove exported constant, import from config**

At the top of `src/store/gameStore.ts`, replace:
```ts
export const PEN_UPGRADE_COST = 20
```
with:
```ts
import { PEN_UPGRADE_COST } from '../config'
```

- [ ] **Step 3: Update `ExpandFacility.tsx` — fix import path**

```ts
// Before:
import { useGameStore, PEN_UPGRADE_COST } from '../store/gameStore'

// After:
import { PEN_UPGRADE_COST } from '../config'
import { useGameStore } from '../store/gameStore'
```

- [ ] **Step 4: Verify build still passes**

```bash
npm test
```
Expected: all existing tests pass (0 failures)

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/store/gameStore.ts src/components/ExpandFacility.tsx
git commit -m "refactor: extract constants to src/config.ts"
```

---

## Task 2: Dexie Schema v2

**Files:**
- Modify: `src/db/db.ts`

- [ ] **Step 1: Update `src/db/db.ts` with new interfaces and v2 migration**

Replace the entire file with:

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

export interface PersistedGameState {
  id: number // always 1 — single-row save
  gold: number
  penCapacity: number
  slimes: PersistedSlime[]
  hatchStartedAt: number | null
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
  }
}

export const db = new SlimeBreederDB()
```

- [ ] **Step 2: Run tests to confirm no breakage**

```bash
npm test
```
Expected: all existing tests pass

- [ ] **Step 3: Commit**

```bash
git add src/db/db.ts
git commit -m "feat: dexie schema v2 — add hatchStartedAt and displaySlots"
```

---

## Task 3: Types — DisplaySlot

> **Note:** Pure type addition — no runtime behavior. Exempt from the red-test requirement.

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `DisplaySlot` interface to `src/types.ts`**

Append after the `Slime` interface:

```ts
// In-memory shape for a filled display slot.
// Distinct from PersistedDisplaySlot (which embeds slimeData as PersistedSlime).
export interface DisplaySlot {
  slimeId: string
  assignedAt: number  // epoch ms — used for idle income calculation on load
  slime: Slime        // full in-memory slime; drives rendering and rate calculation
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add DisplaySlot type"
```

---

## Task 4: SlimeVisual Component (TDD)

**Files:**
- Create: `src/components/SlimeVisual.tsx`
- Create: `src/__tests__/SlimeVisual.test.tsx`

### Shape and color data reference (from approved brainstorm matrix)

| Shape | Path |
|-------|------|
| Blob | `M50,15 C70,12 88,28 90,50 C92,72 75,88 50,88 C25,88 10,72 10,50 C10,28 30,18 50,15Z` |
| Spiked | `M50,10 L58,38 L88,38 L64,56 L72,84 L50,68 L28,84 L36,56 L12,38 L42,38Z` |
| Elongated | `M50,8 C65,8 80,22 80,45 C80,65 68,82 55,90 C52,92 48,92 45,90 C32,82 20,65 20,45 C20,22 35,8 50,8Z` |

| Color | Light stop | Dark stop | Glow |
|-------|-----------|-----------|------|
| Green | `#a0ffa0` | `#003907` | `rgba(0,255,65,0.4)` |
| Blue | `#9ef0ff` | `#001f24` | `rgba(0,227,253,0.4)` |
| Red | `#ff9090` | `#3c0700` | `rgba(255,65,54,0.4)` |

- [ ] **Step 1: Write failing tests — `src/__tests__/SlimeVisual.test.tsx`**

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SlimeVisual } from '../components/SlimeVisual'
import type { SlimeColor, SlimeShape } from '../types'

const COLORS: SlimeColor[] = ['Green', 'Blue', 'Red']
const SHAPES: SlimeShape[] = ['Blob', 'Spiked', 'Elongated']

describe('SlimeVisual', () => {
  it.each(
    COLORS.flatMap((c) => SHAPES.map((s) => [c, s] as [SlimeColor, SlimeShape])),
  )('renders %s %s without throwing', (color, shape) => {
    const { container } = render(<SlimeVisual color={color} shape={shape} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('two same-variant instances have different gradient ids', () => {
    const { container } = render(
      <>
        <SlimeVisual color="Green" shape="Blob" />
        <SlimeVisual color="Green" shape="Blob" />
      </>,
    )
    const gradients = container.querySelectorAll('radialGradient')
    expect(gradients).toHaveLength(2)
    const [id1, id2] = Array.from(gradients).map((g) => g.id)
    expect(id1).not.toBe(id2)
  })

  it('Elongated renders a drip element', () => {
    const { container } = render(<SlimeVisual color="Blue" shape="Elongated" />)
    expect(container.querySelector('[data-drip]')).not.toBeNull()
  })

  it('Spiked renders an inner core circle', () => {
    const { container } = render(<SlimeVisual color="Red" shape="Spiked" />)
    expect(container.querySelector('[data-core]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/SlimeVisual.test.tsx
```
Expected: FAIL — `Cannot find module '../components/SlimeVisual'`

- [ ] **Step 3: Implement `src/components/SlimeVisual.tsx`**

```tsx
import { useId } from 'react'
import type { SlimeColor, SlimeShape } from '../types'

const SHAPE_PATHS: Record<SlimeShape, string> = {
  Blob: 'M50,15 C70,12 88,28 90,50 C92,72 75,88 50,88 C25,88 10,72 10,50 C10,28 30,18 50,15Z',
  Spiked: 'M50,10 L58,38 L88,38 L64,56 L72,84 L50,68 L28,84 L36,56 L12,38 L42,38Z',
  Elongated:
    'M50,8 C65,8 80,22 80,45 C80,65 68,82 55,90 C52,92 48,92 45,90 C32,82 20,65 20,45 C20,22 35,8 50,8Z',
}

const GRADIENT_CONFIG: Record<SlimeColor, { light: string; dark: string; glow: string }> = {
  Green: { light: '#a0ffa0', dark: '#003907', glow: 'rgba(0,255,65,0.4)' },
  Blue: { light: '#9ef0ff', dark: '#001f24', glow: 'rgba(0,227,253,0.4)' },
  Red: { light: '#ff9090', dark: '#3c0700', glow: 'rgba(255,65,54,0.4)' },
}

// Highlight ellipse position varies per shape
const HIGHLIGHT: Record<SlimeShape, { cx: number; cy: number }> = {
  Blob: { cx: 38, cy: 32 },
  Spiked: { cx: 40, cy: 35 },
  Elongated: { cx: 39, cy: 27 },
}

// Gradient focal point varies — Elongated is taller so the light source sits higher
const GRAD_FOCAL: Record<SlimeShape, { cy: string; r: string }> = {
  Blob: { cy: '33%', r: '65%' },
  Spiked: { cy: '33%', r: '65%' },
  Elongated: { cy: '28%', r: '60%' },
}

interface SlimeVisualProps {
  color: SlimeColor
  shape: SlimeShape
  size?: number
}

export function SlimeVisual({ color, shape, size = 80 }: SlimeVisualProps) {
  const uid = useId()
  const gradId = `${uid}-grad`
  const g = GRADIENT_CONFIG[color]
  const hl = HIGHLIGHT[shape]
  const focal = GRAD_FOCAL[shape]

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="38%" cy={focal.cy} r={focal.r}>
          <stop offset="0%" stopColor={g.light} />
          <stop offset="100%" stopColor={g.dark} />
        </radialGradient>
      </defs>

      {/* Body */}
      <path
        d={SHAPE_PATHS[shape]}
        fill={`url(#${gradId})`}
        style={{ filter: `drop-shadow(0 0 10px ${g.glow})` }}
      />

      {/* Spiked: soft inner mass */}
      {shape === 'Spiked' && (
        <circle cx={50} cy={52} r={14} fill={`${g.light}30`} data-core="" />
      )}

      {/* Elongated: drip accent at base */}
      {shape === 'Elongated' && (
        <path
          d="M50,85 C50,85 48,90 50,94 C52,90 50,85 50,85Z"
          fill={g.light}
          opacity={0.7}
          data-drip=""
        />
      )}

      {/* Highlight — gives depth illusion */}
      <ellipse
        cx={hl.cx}
        cy={hl.cy}
        rx={9}
        ry={5}
        fill="rgba(255,255,255,0.18)"
        transform={`rotate(-15,${hl.cx},${hl.cy})`}
      />
    </svg>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/SlimeVisual.test.tsx
```
Expected: 12 tests pass (9 combo renders + 3 structural tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/SlimeVisual.tsx src/__tests__/SlimeVisual.test.tsx
git commit -m "feat: SlimeVisual procedural SVG — all 9 color×shape combinations"
```

---

## Task 5: Store — Incubation Timer (TDD)

**Files:**
- Modify: `src/__tests__/gameStore.test.ts`
- Modify: `src/store/gameStore.ts`

The existing `hatchSlime()` action is replaced by `startHatch()` + `resolveHatch()`. We must update both the store and its tests together.

- [ ] **Step 1: Update `src/__tests__/gameStore.test.ts` — replace hatchSlime tests with incubation tests**

Replace the entire file with:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../store/gameStore'
import { DISPLAY_BASE_RATE } from '../config'

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
    hatchStartedAt: null,
    displaySlots: [null, null],
  })
})

// ── Incubation ────────────────────────────────────────────────────

describe('startHatch', () => {
  it('sets hatchStartedAt to a number', () => {
    useGameStore.getState().startHatch()
    expect(typeof useGameStore.getState().hatchStartedAt).toBe('number')
  })

  it('is a no-op when pen is full', () => {
    useGameStore.setState({ penCapacity: 2 })
    const { startHatch, resolveHatch } = useGameStore.getState()
    startHatch()
    resolveHatch()
    startHatch()
    resolveHatch()
    // pen is now full — third startHatch should be blocked
    startHatch()
    expect(useGameStore.getState().slimes).toHaveLength(2)
    expect(useGameStore.getState().hatchStartedAt).toBeNull()
  })

  it('is a no-op when incubation is already in progress', () => {
    useGameStore.getState().startHatch()
    const first = useGameStore.getState().hatchStartedAt
    useGameStore.getState().startHatch()
    expect(useGameStore.getState().hatchStartedAt).toBe(first)
  })
})

describe('resolveHatch', () => {
  it('adds a slime and clears hatchStartedAt', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch()
    expect(useGameStore.getState().slimes).toHaveLength(1)
    expect(useGameStore.getState().hatchStartedAt).toBeNull()
  })
})

describe('loadGame — incubation', () => {
  it('auto-resolves an expired hatchStartedAt', async () => {
    const { db } = await import('../db/db')
    const expiredAt = Date.now() - 60_000 // 60s ago — well past 30s
    vi.mocked(db.gameState.get).mockResolvedValueOnce({
      id: 1,
      gold: 50,
      penCapacity: 5,
      slimes: [],
      hatchStartedAt: expiredAt,
      displaySlots: [null, null],
    })
    await useGameStore.getState().loadGame()
    expect(useGameStore.getState().slimes).toHaveLength(1)
    expect(useGameStore.getState().hatchStartedAt).toBeNull()
  })

  it('preserves an active hatchStartedAt without resolving', async () => {
    const { db } = await import('../db/db')
    const activeAt = Date.now() - 5_000 // only 5s in — still incubating
    vi.mocked(db.gameState.get).mockResolvedValueOnce({
      id: 1,
      gold: 50,
      penCapacity: 5,
      slimes: [],
      hatchStartedAt: activeAt,
      displaySlots: [null, null],
    })
    await useGameStore.getState().loadGame()
    expect(useGameStore.getState().slimes).toHaveLength(0)
    expect(useGameStore.getState().hatchStartedAt).toBe(activeAt)
  })
})

// ── Sell / upgrade (existing, preserved) ─────────────────────────

describe('sellSlime', () => {
  it('removes slime and adds its value to Gold', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch()
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
    expect(useGameStore.getState().gold).toBe(10)
  })
})

// ── Display Rooms ─────────────────────────────────────────────────

describe('assignToDisplay', () => {
  it('removes slime from slimes[]', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch()
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 0)
    expect(useGameStore.getState().slimes).toHaveLength(0)
  })

  it('puts slime in correct slot index', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch()
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 1)
    expect(useGameStore.getState().displaySlots[1]?.slimeId).toBe(slime.id)
    expect(useGameStore.getState().displaySlots[0]).toBeNull()
  })

  it('is a no-op when target slot is already occupied', () => {
    // Hatch two slimes
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch()
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch()
    const [first, second] = useGameStore.getState().slimes
    useGameStore.getState().assignToDisplay(first.id, 0)
    const existingSlotId = useGameStore.getState().displaySlots[0]?.slimeId
    useGameStore.getState().assignToDisplay(second.id, 0) // occupied slot
    expect(useGameStore.getState().displaySlots[0]?.slimeId).toBe(existingSlotId)
    expect(useGameStore.getState().slimes).toHaveLength(1) // second slime still in pen
  })
})

describe('unassignFromDisplay', () => {
  it('puts slime back in slimes[] with variance 0', () => {
    useGameStore.getState().startHatch()
    useGameStore.getState().resolveHatch()
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
    const assignedAt = Date.now() - 100_000 // 100 seconds ago
    vi.mocked(db.gameState.get).mockResolvedValueOnce({
      id: 1,
      gold: 50,
      penCapacity: 5,
      slimes: [],
      hatchStartedAt: null,
      displaySlots: [
        {
          slimeId: 'test-slime',
          assignedAt,
          slimeData: {
            id: 'test-slime',
            color: 'Green',
            shape: 'Blob',
            colorTier: 1,
            shapeTier: 1,
            actualValue: 10,
            createdAt: assignedAt,
          },
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

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/gameStore.test.ts
```
Expected: FAIL — `startHatch is not a function` (and other missing actions)

- [ ] **Step 3: Rewrite `src/store/gameStore.ts` with all new actions**

```ts
import { create } from 'zustand'
import { db } from '../db/db'
import { generateSlime } from '../utils/slimeGenerator'
import type { Slime, DisplaySlot } from '../types'
import { PEN_UPGRADE_COST, HATCH_DURATION_MS, DISPLAY_SLOT_COUNT, DISPLAY_BASE_RATE } from '../config'

interface GameState {
  gold: number
  penCapacity: number
  slimes: Slime[]
  hatchStartedAt: number | null
  displaySlots: Array<DisplaySlot | null>

  startHatch: () => void
  resolveHatch: () => void
  sellSlime: (id: string) => void
  buyPenUpgrade: () => void
  assignToDisplay: (slimeId: string, slotIndex: number) => void
  unassignFromDisplay: (slotIndex: number) => void
  loadGame: () => Promise<void>
}

async function persist(state: Pick<GameState, 'gold' | 'penCapacity' | 'slimes' | 'hatchStartedAt' | 'displaySlots'>) {
  await db.gameState.put({
    id: 1,
    gold: state.gold,
    penCapacity: state.penCapacity,
    hatchStartedAt: state.hatchStartedAt,
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
  hatchStartedAt: null,
  displaySlots: Array(DISPLAY_SLOT_COUNT).fill(null),

  startHatch() {
    const { slimes, penCapacity, hatchStartedAt } = get()
    if (slimes.length >= penCapacity) return
    if (hatchStartedAt !== null) return
    const next = { ...get(), hatchStartedAt: Date.now() }
    set(next)
    persist(next)
  },

  resolveHatch() {
    const state = get()
    if (state.hatchStartedAt === null) return // guard: idempotent — safe to call multiple times
    const next = {
      ...state,
      slimes: [...state.slimes, generateSlime()],
      hatchStartedAt: null,
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

  assignToDisplay(slimeId: string, slotIndex: number) {
    const { slimes, displaySlots } = get()
    if (displaySlots[slotIndex] !== null) return // guard: slot already occupied
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
    const displaySlots: Array<DisplaySlot | null> = (saved.displaySlots ?? [null, null]).map(
      (slot) => {
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
      },
    )

    const baseState: Omit<GameState, 'startHatch' | 'resolveHatch' | 'sellSlime' | 'buyPenUpgrade' | 'assignToDisplay' | 'unassignFromDisplay' | 'loadGame'> = {
      gold: Math.floor(gold),
      penCapacity: saved.penCapacity,
      hatchStartedAt: saved.hatchStartedAt ?? null,
      displaySlots,
      slimes: saved.slimes.map((s) => ({
        ...s,
        color: s.color as import('../types').SlimeColor,
        shape: s.shape as import('../types').SlimeShape,
        variance: 0,
      })),
    }

    set(baseState)

    // Auto-resolve an expired incubation
    if (baseState.hatchStartedAt !== null && now - baseState.hatchStartedAt >= HATCH_DURATION_MS) {
      get().resolveHatch()
    }
  },
}))
```

> **Note on the `import('../types')` cast:** TypeScript can't narrow plain `string` from IndexedDB to a union type without a cast. `'../types'` is correct because `gameStore.ts` lives at `src/store/gameStore.ts` — one level up from `src/types.ts`.

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/gameStore.test.ts
```
Expected: all tests pass

- [ ] **Step 5: Run full test suite**

```bash
npm test
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/store/gameStore.ts src/__tests__/gameStore.test.ts
git commit -m "feat: incubation timer + display room store actions (TDD)"
```

---

## Task 6: IncubationProgress Component + HatchButton Update

**Files:**
- Create: `src/components/IncubationProgress.tsx`
- Modify: `src/components/HatchButton.tsx`

- [ ] **Step 1: Create `src/components/IncubationProgress.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { HATCH_DURATION_MS } from '../config'

export function IncubationProgress() {
  const hatchStartedAt = useGameStore((s) => s.hatchStartedAt)
  const resolveHatch = useGameStore((s) => s.resolveHatch)
  const [pct, setPct] = useState(0)
  const [secsLeft, setSecsLeft] = useState(Math.ceil(HATCH_DURATION_MS / 1000))

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - (hatchStartedAt ?? Date.now())
      const p = Math.min(elapsed / HATCH_DURATION_MS, 1)
      setPct(p)
      setSecsLeft(Math.max(0, Math.ceil((HATCH_DURATION_MS - elapsed) / 1000)))
      if (p >= 1) {
        clearInterval(id) // stop the ticker before resolving — prevents multi-fire before re-render
        resolveHatch()    // resolveHatch() also guards hatchStartedAt !== null, so double-call is safe
      }
    }, 100)
    return () => clearInterval(id)
  }, [hatchStartedAt, resolveHatch])

  return (
    <section className="bg-surface-container-high p-6">
      <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-2">
        INCUBATING_EGG — {secsLeft}s
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

- [ ] **Step 2: Update `src/components/HatchButton.tsx`**

```tsx
import { useGameStore } from '../store/gameStore'
import { IncubationProgress } from './IncubationProgress'

export function HatchButton() {
  const startHatch = useGameStore((s) => s.startHatch)
  const slimes = useGameStore((s) => s.slimes)
  const penCapacity = useGameStore((s) => s.penCapacity)
  const hatchStartedAt = useGameStore((s) => s.hatchStartedAt)
  const isFull = slimes.length >= penCapacity

  if (hatchStartedAt !== null) {
    return <IncubationProgress />
  }

  return (
    <section className="bg-surface-container-high p-6 flex flex-col items-center">
      <button
        onClick={startHatch}
        disabled={isFull}
        className={`w-full font-headline font-black text-lg py-5 uppercase tracking-[0.2em] transition-none ${
          isFull
            ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
            : 'bg-primary-container text-on-primary-container'
        }`}
      >
        {isFull ? 'CONTAINMENT_FULL' : 'INITIATE_INCUBATION'}
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

- [ ] **Step 3: Run full test suite**

```bash
npm test
```
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/IncubationProgress.tsx src/components/HatchButton.tsx
git commit -m "feat: incubation progress bar replaces instant hatch button"
```

---

## Task 7: SlimeCard — Integrate SlimeVisual

**Files:**
- Modify: `src/components/SlimeCard.tsx`

- [ ] **Step 1: Update `src/components/SlimeCard.tsx`**

Replace the color-div placeholder section with `SlimeVisual`. The chip and `BIO_ASSET` label are removed — shape info is now conveyed by the visual. Keep the color chip in the lower card data area for the designation label.

```tsx
import { useGameStore } from '../store/gameStore'
import { COLOR_CHIP_CLASSES, SHAPE_DESIGNATIONS } from '../types'
import { SlimeVisual } from './SlimeVisual'
import type { Slime } from '../types'

interface Props {
  slime: Slime
}

export function SlimeCard({ slime }: Props) {
  const sellSlime = useGameStore((s) => s.sellSlime)

  return (
    <div className="bg-surface border-t-2 border-outline-variant/30 flex flex-col group">
      {/* Slime visual area */}
      <div className="h-24 flex items-center justify-center bg-surface-container-lowest relative">
        <SlimeVisual color={slime.color} shape={slime.shape} size={80} />
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-label font-bold uppercase ${COLOR_CHIP_CLASSES[slime.color]}`}
        >
          {SHAPE_DESIGNATIONS[slime.shape]}
        </span>
      </div>

      {/* Card data */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-label text-on-surface-variant uppercase block">
            Unit_Value
          </span>
          <span className="text-xl font-headline font-bold text-primary">
            {slime.actualValue}G
          </span>
        </div>
        <button
          onClick={() => sellSlime(slime.id)}
          className="bg-surface-container-highest text-primary font-label text-[11px] py-2 px-4 hover:bg-surface-bright transition-none uppercase tracking-widest"
        >
          LIQUIDATE
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/SlimeCard.tsx
git commit -m "feat: SlimeCard renders procedural SVG visual"
```

---

## Task 8: Display Rooms UI

**Files:**
- Create: `src/components/DisplaySlotPicker.tsx`
- Create: `src/components/DisplayRooms.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/DisplaySlotPicker.tsx`**

A simple overlay modal that lists pen slimes for selection. Tapping a slime assigns it and closes the picker.

```tsx
import { useGameStore } from '../store/gameStore'
import { COLOR_CHIP_CLASSES, SHAPE_DESIGNATIONS, COLOR_DESIGNATIONS } from '../types'
import { SlimeVisual } from './SlimeVisual'

interface Props {
  slotIndex: number
  onClose: () => void
}

export function DisplaySlotPicker({ slotIndex, onClose }: Props) {
  const slimes = useGameStore((s) => s.slimes)
  const assignToDisplay = useGameStore((s) => s.assignToDisplay)

  function handleAssign(slimeId: string) {
    assignToDisplay(slimeId, slotIndex)
    onClose()
  }

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
          SELECT_SPECIMEN — SLOT_{slotIndex + 1}
        </p>

        {slimes.length === 0 ? (
          <p className="text-[11px] font-label text-on-surface-variant/50 uppercase tracking-widest p-6 text-center">
            No specimens in containment.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/10">
            {slimes.map((slime) => (
              <li key={slime.id}>
                <button
                  onClick={() => handleAssign(slime.id)}
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

- [ ] **Step 2: Create `src/components/DisplayRooms.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { DISPLAY_BASE_RATE } from '../config'
import { COLOR_CHIP_CLASSES, SHAPE_DESIGNATIONS } from '../types'
import { SlimeVisual } from './SlimeVisual'
import { DisplaySlotPicker } from './DisplaySlotPicker'

function slotGoldPerSec(colorTier: number, shapeTier: number) {
  return colorTier * shapeTier * DISPLAY_BASE_RATE
}

export function DisplayRooms() {
  const displaySlots = useGameStore((s) => s.displaySlots)
  const unassignFromDisplay = useGameStore((s) => s.unassignFromDisplay)
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)

  // Live gold ticker — updates zustand gold every second without persisting
  useEffect(() => {
    const id = setInterval(() => {
      const state = useGameStore.getState()
      const earned = state.displaySlots.reduce((acc, slot) => {
        if (!slot) return acc
        return acc + slotGoldPerSec(slot.slime.colorTier, slot.slime.shapeTier)
      }, 0)
      if (earned > 0) {
        useGameStore.setState((s) => ({ gold: s.gold + earned }))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <section className="bg-surface-container p-4">
        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">museum</span>
          DISPLAY_CHAMBER
        </p>

        <div className="grid grid-cols-2 gap-2">
          {displaySlots.map((slot, i) => (
            <div
              key={i}
              className="bg-surface-container-high border border-outline-variant/20 flex flex-col items-center p-3 gap-2 min-h-[120px] justify-center"
            >
              {slot ? (
                <>
                  <SlimeVisual color={slot.slime.color} shape={slot.slime.shape} size={48} />
                  <span
                    className={`text-[9px] font-label font-bold uppercase px-2 py-0.5 ${COLOR_CHIP_CLASSES[slot.slime.color]}`}
                  >
                    {SHAPE_DESIGNATIONS[slot.slime.shape]}
                  </span>
                  <span className="text-[10px] font-label text-on-surface-variant uppercase">
                    +{slotGoldPerSec(slot.slime.colorTier, slot.slime.shapeTier).toFixed(1)}G/s
                  </span>
                  <button
                    onClick={() => unassignFromDisplay(i)}
                    className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface transition-none"
                  >
                    RETRIEVE
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-label text-on-surface-variant/30 uppercase tracking-widest">
                    SLOT_{i + 1}_EMPTY
                  </span>
                  <button
                    onClick={() => setPickerSlot(i)}
                    className="text-[10px] font-label uppercase tracking-widest bg-surface-container-highest text-on-surface px-3 py-1.5 hover:bg-surface-bright transition-none"
                  >
                    ASSIGN
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {pickerSlot !== null && (
        <DisplaySlotPicker slotIndex={pickerSlot} onClose={() => setPickerSlot(null)} />
      )}
    </>
  )
}
```

- [ ] **Step 3: Add `DisplayRooms` to `src/App.tsx`**

```tsx
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { HatchButton } from './components/HatchButton'
import { InventoryList } from './components/InventoryList'
import { DisplayRooms } from './components/DisplayRooms'
import { ExpandFacility } from './components/ExpandFacility'
import { BottomNav } from './components/BottomNav'

export function App() {
  return (
    <div className="min-h-screen bg-surface-container-lowest max-w-lg mx-auto flex flex-col">
      <Header />
      <main className="flex-grow overflow-y-auto space-y-0">
        <StatsBar />
        <HatchButton />
        <InventoryList />
        <DisplayRooms />
        <ExpandFacility />
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/DisplaySlotPicker.tsx src/components/DisplayRooms.tsx src/App.tsx
git commit -m "feat: display chamber UI — passive gold income slots"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run complete test suite**

```bash
npm test
```
Expected: all tests pass, 0 failures

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Dev server smoke test**

```bash
npm run dev
```
Open browser, verify:
- Clicking INITIATE_INCUBATION shows progress bar with countdown
- After 30s, slime appears in pen automatically
- Slime cards render the procedural SVG shape (Blob/Spiked/Elongated with correct color)
- ASSIGN button in Display Chamber opens picker
- Assigning a slime moves it to the slot, shows rate label and RETRIEVE button
- RETRIEVE returns slime to pen
- Refreshing the page resumes incubation at correct progress and credits accumulated display gold

- [ ] **Step 4: Final commit (if any cleanup)**

```bash
git add -p  # review changes
git commit -m "chore: final cleanup after game slice integration"
```
