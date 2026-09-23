import Dexie, { type Table } from 'dexie'

export interface PersistedSlime {
  id: string
  color: string
  shape: string
  variance: number
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
  lockedColor?: string   // regent-locked color (optional)
  lockedShape?: string   // regent-locked shape (optional)
}

export interface BreedTankSlot {
  type: 'breed'
  startedAt: number
  hostId: string
  hostSnapshot: PersistedSlime
  donorSnapshot: PersistedSlime
}

export type TankSlot = HatchTankSlot | BreedTankSlot

export interface PersistedDiscovery {
  id: number           // always 1 — single-row
  colors: string[]     // discovered SlimeColor names
  shapes: string[]     // discovered SlimeShape names
  regents: number
}

export interface WandererRequest {
  id: string
  targetColor: string | null
  targetShape: string | null
  rewardGold: number
  createdAt: number
}

export interface PersistedGameState {
  id: number // always 1 — single-row save
  gold: number
  penCapacity: number
  slimes: PersistedSlime[]
  tanks: Array<TankSlot | null>
  tankCount: number
  displaySlots: Array<PersistedDisplaySlot | null>
  wandererRequests?: WandererRequest[]
}

class SlimeBreederDB extends Dexie {
  gameState!: Table<PersistedGameState>
  discovery!: Table<PersistedDiscovery>

  constructor() {
    super('SlimeBreederDB')

    this.version(1).stores({ gameState: 'id' })

    this.version(2).stores({ gameState: 'id' }).upgrade((tx) =>
      tx.table('gameState').toCollection().modify((row) => {
        if (row.hatchStartedAt === undefined) row.hatchStartedAt = null
        if (row.displaySlots === undefined) row.displaySlots = [null, null]
      }),
    )

    this.version(3).stores({ gameState: 'id' }).upgrade((tx) =>
      tx.table('gameState').toCollection().modify((row) => {
        const slot: TankSlot | null =
          row.hatchStartedAt != null
            ? { type: 'hatch', startedAt: row.hatchStartedAt }
            : null
        row.tanks = [slot]
        row.tankCount = 1
        delete row.hatchStartedAt
      }),
    )

    // v4: Discovery system — migrate old slimes (remove colorTier/shapeTier),
    // add discovery table, map old shape names to new geometry names.
    this.version(4).stores({ gameState: 'id', discovery: 'id' }).upgrade(async (tx) => {
      const SHAPE_MIGRATION: Record<string, string> = {
        Blob: 'Circle',
        Spiked: 'Triangle',
        Elongated: 'Teardrop',
      }

      const discoveredColors = new Set(['Red', 'Yellow', 'Blue'])
      const discoveredShapes = new Set<string>(['Circle', 'Square', 'Triangle'])

      await tx.table('gameState').toCollection().modify((row) => {
        // Migrate slimes
        for (const s of row.slimes ?? []) {
          if (SHAPE_MIGRATION[s.shape]) s.shape = SHAPE_MIGRATION[s.shape]
          discoveredColors.add(s.color)
          discoveredShapes.add(s.shape)
          delete s.colorTier
          delete s.shapeTier
        }
        // Migrate display slot slime data
        for (const slot of row.displaySlots ?? []) {
          if (slot?.slimeData) {
            if (SHAPE_MIGRATION[slot.slimeData.shape]) {
              slot.slimeData.shape = SHAPE_MIGRATION[slot.slimeData.shape]
            }
            discoveredColors.add(slot.slimeData.color)
            discoveredShapes.add(slot.slimeData.shape)
            delete (slot.slimeData as Record<string, unknown>).colorTier
            delete (slot.slimeData as Record<string, unknown>).shapeTier
          }
        }
        // Migrate tank snapshots
        for (const tank of row.tanks ?? []) {
          if (tank?.type === 'breed') {
            for (const snap of [tank.hostSnapshot, tank.donorSnapshot]) {
              if (snap) {
                if (SHAPE_MIGRATION[snap.shape]) snap.shape = SHAPE_MIGRATION[snap.shape]
                delete (snap as Record<string, unknown>).colorTier
                delete (snap as Record<string, unknown>).shapeTier
              }
            }
          }
        }
      })

      // Create default discovery row
      await tx.table('discovery').put({
        id: 1,
        colors: [...discoveredColors],
        shapes: [...discoveredShapes],
        regents: 0,
      })
    })

    // v5: Add wandererRequests to gameState
    this.version(5).stores({ gameState: 'id', discovery: 'id' }).upgrade((tx) => {
      return tx.table('gameState').toCollection().modify((row) => {
        if (!row.wandererRequests) {
          row.wandererRequests = []
        }
      })
    })
  }
}

export const db = new SlimeBreederDB()
