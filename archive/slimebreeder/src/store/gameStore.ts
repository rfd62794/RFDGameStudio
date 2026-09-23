import { create } from 'zustand'
import { db } from '../db/db'
import { generateSlime } from '../utils/slimeGenerator'
import { breedSlimes } from '../utils/breedSlimes'
import { generateWandererRequest } from '../utils/requestGenerator'
import { getColorTier, getShapeTier, STARTING_COLORS, STARTING_SHAPES } from '../data/traitDefs'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import type { Slime, DisplaySlot } from '../types'
import type { TankSlot, WandererRequest } from '../db/db'
import {
  PEN_UPGRADE_COST,
  HATCH_DURATION_MS,
  DISPLAY_SLOT_COUNT,
  DISPLAY_BASE_RATE,
  TANK_UPGRADE_COST,
  DISCOVERY_REGENT_REWARDS,
  REGENT_LOCK_COST,
  WANDERER_REQUEST_MAX,
} from '../config'

interface GameState {
  gold: number
  penCapacity: number
  slimes: Slime[]
  tanks: Array<TankSlot | null>
  tankCount: number
  displaySlots: Array<DisplaySlot | null>
  discoveredColors: SlimeColor[]
  discoveredShapes: SlimeShape[]
  regents: number
  wandererRequests: WandererRequest[]

  startHatch: (tankIndex?: number, lockedColor?: SlimeColor, lockedShape?: SlimeShape) => void
  resolveHatch: (tankIndex: number) => void
  startBreed: (hostId: string, donorId: string) => void
  resolveBreed: (tankIndex: number) => void
  sellSlime: (id: string) => void
  buyPenUpgrade: () => void
  buyTankUpgrade: () => void
  assignToDisplay: (slimeId: string, slotIndex: number) => void
  unassignFromDisplay: (slotIndex: number) => void
  tickDisplayGold: () => void
  loadGame: () => Promise<void>

  generateRequests: () => void
  fulfillRequest: (requestId: string, slimeId: string) => void
  dismissRequest: (requestId: string) => void
}

function snapshotSlime(s: Slime) {
  return {
    id: s.id,
    color: s.color,
    shape: s.shape,
    variance: s.variance,
    actualValue: s.actualValue,
    createdAt: s.createdAt,
  }
}

async function persist(
  state: Pick<GameState, 'gold' | 'penCapacity' | 'slimes' | 'tanks' | 'tankCount' | 'displaySlots' | 'wandererRequests'>,
) {
  await db.gameState.put({
    id: 1,
    gold: state.gold,
    penCapacity: state.penCapacity,
    tanks: state.tanks,
    tankCount: state.tankCount,
    slimes: state.slimes.map(snapshotSlime),
    displaySlots: state.displaySlots.map((slot) =>
      slot
        ? {
            slimeId: slot.slimeId,
            assignedAt: slot.assignedAt,
            slimeData: snapshotSlime(slot.slime),
          }
        : null,
    ),
    wandererRequests: state.wandererRequests,
  })
}

async function persistDiscovery(
  state: Pick<GameState, 'discoveredColors' | 'discoveredShapes' | 'regents'>,
) {
  await db.discovery.put({
    id: 1,
    colors: state.discoveredColors,
    shapes: state.discoveredShapes,
    regents: state.regents,
  })
}

export const useGameStore = create<GameState>((set, get) => ({
  gold: 50,
  penCapacity: 5,
  slimes: [],
  tanks: [null],
  tankCount: 1,
  displaySlots: Array(DISPLAY_SLOT_COUNT).fill(null),
  discoveredColors: [...STARTING_COLORS],
  discoveredShapes: [...STARTING_SHAPES],
  regents: 0,
  wandererRequests: [],

  startHatch(tankIndex?: number, lockedColor?: SlimeColor, lockedShape?: SlimeShape) {
    const state = get()
    if (state.slimes.length >= state.penCapacity) return
    const idx = tankIndex ?? state.tanks.findIndex((t) => t === null)
    if (idx === -1 || state.tanks[idx] !== null) return

    // Deduct regent cost if locking traits
    let regents = state.regents
    if (lockedColor) {
      const cost = REGENT_LOCK_COST[getColorTier(lockedColor)] ?? 2
      if (regents < cost) return
      regents -= cost
    }
    if (lockedShape) {
      const cost = REGENT_LOCK_COST[getShapeTier(lockedShape)] ?? 2
      if (regents < cost) return
      regents -= cost
    }

    const newTanks = state.tanks.map((t, i): TankSlot | null =>
      i === idx ? { type: 'hatch', startedAt: Date.now(), lockedColor, lockedShape } : t,
    )
    const next = { ...state, tanks: newTanks, regents }
    set(next)
    persist(next)
    if (regents !== state.regents) persistDiscovery(next)
  },

  resolveHatch(tankIndex: number) {
    const state = get()
    const slot = state.tanks[tankIndex]
    if (!slot || slot.type !== 'hatch') return
    const hatchSlot = slot as import('../db/db').HatchTankSlot
    const newSlime = generateSlime(
      state.discoveredColors,
      state.discoveredShapes,
      hatchSlot.lockedColor as SlimeColor | undefined,
      hatchSlot.lockedShape as SlimeShape | undefined,
    )
    const newTanks = state.tanks.map((t, i): TankSlot | null => (i === tankIndex ? null : t))
    const next = {
      ...state,
      slimes: [...state.slimes, newSlime],
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
    if (idx === -1) return
    const newTanks = tanks.map((t, i): TankSlot | null =>
      i === idx
        ? {
            type: 'breed',
            startedAt: Date.now(),
            hostId,
            hostSnapshot: snapshotSlime(host),
            donorSnapshot: snapshotSlime(donor),
          }
        : t,
    )
    const next = {
      ...get(),
      slimes: slimes.filter((s) => s.id !== donorId),
      tanks: newTanks,
    }
    set(next)
    persist(next)
  },

  resolveBreed(tankIndex: number) {
    const state = get()
    const slot = state.tanks[tankIndex]
    if (!slot || slot.type !== 'breed') return

    if (!slot.hostSnapshot || !slot.donorSnapshot) {
      // Legacy guard: if it's an old breed tank missing snapshots, just clear it and fail gracefully
      const cleanTanks = state.tanks.map((t, i) => (i === tankIndex ? null : t))
      set({ ...state, tanks: cleanTanks })
      persist({ ...state, tanks: cleanTanks })
      return
    }

    const hostForBreed: Slime = {
      ...slot.hostSnapshot,
      color: slot.hostSnapshot.color as SlimeColor,
      shape: slot.hostSnapshot.shape as SlimeShape,
    }

    const result = breedSlimes(
      hostForBreed,
      slot.donorSnapshot,
      new Set(state.discoveredColors),
      new Set(state.discoveredShapes),
    )

    const newTanks = state.tanks.map((t, i): TankSlot | null => (i === tankIndex ? null : t))

    // Process discoveries
    let { discoveredColors, discoveredShapes, regents } = state
    let discoveryHappened = false

    if (result.newColorDiscovery) {
      discoveredColors = [...discoveredColors, result.newColorDiscovery]
      const tier = getColorTier(result.newColorDiscovery)
      regents += DISCOVERY_REGENT_REWARDS[tier] ?? 0
      discoveryHappened = true
    }
    if (result.newShapeDiscovery) {
      discoveredShapes = [...discoveredShapes, result.newShapeDiscovery]
      const tier = getShapeTier(result.newShapeDiscovery)
      regents += DISCOVERY_REGENT_REWARDS[tier] ?? 0
      discoveryHappened = true
    }

    const next = {
      ...state,
      slimes: [...state.slimes, result.offspring],
      tanks: newTanks,
      discoveredColors,
      discoveredShapes,
      regents,
    }
    set(next)
    persist(next)
    if (discoveryHappened) persistDiscovery(next)
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
    const restoredSlime: Slime = { ...slot.slime }
    const newSlots = displaySlots.map((s, i) => (i === slotIndex ? null : s))
    const next = { ...get(), slimes: [...slimes, restoredSlime], displaySlots: newSlots }
    set(next)
    persist(next)
  },

  tickDisplayGold() {
    const state = get()
    const earned = state.displaySlots.reduce((acc, slot) => {
      if (!slot) return acc
      const ct = getColorTier(slot.slime.color)
      const st = getShapeTier(slot.slime.shape)
      return acc + ct * st * DISPLAY_BASE_RATE
    }, 0)
    if (earned > 0) {
      const next = { ...state, gold: state.gold + earned }
      set(next)
      persist(next)
    }
  },

  async loadGame() {
    const saved = await db.gameState.get(1)
    const disc = await db.discovery.get(1)

    const discoveredColors = (disc?.colors ?? STARTING_COLORS) as SlimeColor[]
    const discoveredShapes = (disc?.shapes ?? STARTING_SHAPES) as SlimeShape[]
    const regents = disc?.regents ?? 0

    if (!saved) {
      set({ discoveredColors, discoveredShapes, regents })
      return
    }

    const now = Date.now()
    let gold = saved.gold

    // Credit accumulated display room income
    const displaySlots: Array<DisplaySlot | null> = (
      saved.displaySlots ?? Array(DISPLAY_SLOT_COUNT).fill(null)
    ).map((slot) => {
      if (!slot) return null
      const ct = getColorTier(slot.slimeData.color as SlimeColor)
      const st = getShapeTier(slot.slimeData.shape as SlimeShape)
      const elapsedSec = (now - slot.assignedAt) / 1000
      const rate = ct * st * DISPLAY_BASE_RATE
      gold += elapsedSec * rate
      return {
        slimeId: slot.slimeId,
        assignedAt: slot.assignedAt,
        slime: {
          ...slot.slimeData,
          color: slot.slimeData.color as SlimeColor,
          shape: slot.slimeData.shape as SlimeShape,
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
      discoveredColors,
      discoveredShapes,
      regents,
      slimes: saved.slimes.map((s) => ({
        ...s,
        color: s.color as SlimeColor,
        shape: s.shape as SlimeShape,
      })),
    })

    // Auto-resolve any expired tanks
    tanks.forEach((slot, i) => {
      if (slot && now - slot.startedAt >= HATCH_DURATION_MS) {
        if (slot.type === 'hatch') {
          get().resolveHatch(i)
        } else if (slot.type === 'breed') {
          // Guard: legacy breed tanks from before hostSnapshot was added
          if (!('hostSnapshot' in slot) || !slot.hostSnapshot) {
            const cleanTanks = get().tanks.map((t, j) => (j === i ? null : t))
            set({ tanks: cleanTanks })
          } else {
            get().resolveBreed(i)
          }
        }
      }
    })

    // Seed requests if they don't exist
    if (saved.wandererRequests && saved.wandererRequests.length > 0) {
      set({ wandererRequests: saved.wandererRequests })
    } else {
      get().generateRequests()
    }
  },

  generateRequests() {
    const state = get()
    const { discoveredColors, discoveredShapes, wandererRequests } = state
    if (wandererRequests.length >= WANDERER_REQUEST_MAX) return
    if (discoveredColors.length === 0 || discoveredShapes.length === 0) return

    const newReqs = [...wandererRequests]
    while (newReqs.length < WANDERER_REQUEST_MAX) {
      newReqs.push(generateWandererRequest(discoveredColors, discoveredShapes))
    }
    
    const next = { ...state, wandererRequests: newReqs }
    set(next)
    persist(next)
  },

  fulfillRequest(requestId: string, slimeId: string) {
    const state = get()
    const { slimes, wandererRequests, gold } = state
    
    const request = wandererRequests.find(r => r.id === requestId)
    const slime = slimes.find(s => s.id === slimeId)
    if (!request || !slime) return

    // Verify it matches
    if (request.targetColor && request.targetColor !== slime.color) return
    if (request.targetShape && request.targetShape !== slime.shape) return

    const nextSlimes = slimes.filter(s => s.id !== slimeId)
    const nextRequests = wandererRequests.filter(r => r.id !== requestId)

    // Automatically regenerate
    if (nextRequests.length < WANDERER_REQUEST_MAX) {
      nextRequests.push(generateWandererRequest(state.discoveredColors, state.discoveredShapes))
    }

    const next = {
      ...state,
      slimes: nextSlimes,
      wandererRequests: nextRequests,
      gold: gold + request.rewardGold
    }
    
    set(next)
    persist(next)
  },

  dismissRequest(requestId: string) {
    const state = get()
    const { wandererRequests, discoveredColors, discoveredShapes } = state
    if (discoveredColors.length === 0 || discoveredShapes.length === 0) return

    const nextRequests = wandererRequests.filter(r => r.id !== requestId)
    // Automatically regenerate to max immediately
    while (nextRequests.length < WANDERER_REQUEST_MAX) {
      nextRequests.push(generateWandererRequest(discoveredColors, discoveredShapes))
    }

    const next = { ...state, wandererRequests: nextRequests }
    set(next)
    persist(next)
  }
}))
