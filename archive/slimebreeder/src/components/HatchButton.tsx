import { useCallback, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { IncubationProgress } from './IncubationProgress'
import { REGENT_LOCK_COST } from '../config'
import { COLOR_DEFS, SHAPE_DEFS, getColorTier, getShapeTier } from '../data/traitDefs'
import type { HatchTankSlot } from '../db/db'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'

export function HatchButton() {
  const startHatch = useGameStore((s) => s.startHatch)
  const resolveHatch = useGameStore((s) => s.resolveHatch)
  const slimes = useGameStore((s) => s.slimes)
  const penCapacity = useGameStore((s) => s.penCapacity)
  const tanks = useGameStore((s) => s.tanks)
  const discoveredColors = useGameStore((s) => s.discoveredColors)
  const discoveredShapes = useGameStore((s) => s.discoveredShapes)
  const regents = useGameStore((s) => s.regents)

  const [lockedColor, setLockedColor] = useState<SlimeColor | ''>('')
  const [lockedShape, setLockedShape] = useState<SlimeShape | ''>('')

  const isFull = slimes.length >= penCapacity
  const allOccupied = tanks.every((t) => t !== null)

  // Calculate total lock cost
  let lockCost = 0
  if (lockedColor) lockCost += REGENT_LOCK_COST[getColorTier(lockedColor)] || 0
  if (lockedShape) lockCost += REGENT_LOCK_COST[getShapeTier(lockedShape)] || 0

  const canAfford = regents >= lockCost
  const canHatch = !isFull && !allOccupied && canAfford

  // Show the first active hatch tank in CHAMBER (breed tanks shown in MUTATE)
  const activeHatchIndex = tanks.findIndex((t) => t !== null && t.type === 'hatch')

  const handleHatchComplete = useCallback(
    () => resolveHatch(activeHatchIndex),
    [resolveHatch, activeHatchIndex],
  )

  const handleStart = () => {
    if (!canHatch) return
    startHatch(undefined, lockedColor || undefined, lockedShape || undefined)
    setLockedColor('')
    setLockedShape('')
  }

  if (activeHatchIndex !== -1) {
    const slot = tanks[activeHatchIndex] as HatchTankSlot
    return (
      <IncubationProgress
        startedAt={slot.startedAt}
        onComplete={handleHatchComplete}
        label="HATCH_IN_PROGRESS"
      />
    )
  }

  return (
    <section className="bg-surface-container-high p-6 flex flex-col items-center">
      
      {/* Trait Locks */}
      <div className="w-full flex gap-2 mb-4">
        <div className="flex-1">
          <label className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest block mb-1">
            LOCK_COLOR
          </label>
          <select 
            value={lockedColor} 
            onChange={(e) => setLockedColor(e.target.value as SlimeColor | '')}
            className="w-full bg-surface text-[10px] font-label text-on-surface p-2 border border-outline-variant/30 uppercase"
          >
            <option value="">-- RANDOM --</option>
            {discoveredColors.map(c => (
              <option key={c} value={c}>{COLOR_DEFS[c].designation} (T{getColorTier(c)})</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest block mb-1">
            LOCK_SHAPE
          </label>
          <select 
            value={lockedShape} 
            onChange={(e) => setLockedShape(e.target.value as SlimeShape | '')}
            className="w-full bg-surface text-[10px] font-label text-on-surface p-2 border border-outline-variant/30 uppercase"
          >
            <option value="">-- RANDOM --</option>
            {discoveredShapes.map(s => (
              <option key={s} value={s}>{SHAPE_DEFS[s].designation} (T{getShapeTier(s)})</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canHatch}
        className={`w-full font-headline font-black text-lg py-5 uppercase tracking-[0.2em] transition-none ${
          !canHatch
            ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
            : 'bg-primary-container text-on-primary-container'
        }`}
      >
        {isFull
          ? 'CONTAINMENT_FULL'
          : allOccupied
            ? 'ALL_TANKS_OCCUPIED'
            : !canAfford
              ? `NEED ${lockCost} REGENTS`
              : lockCost > 0
                ? `INCUBATE (-${lockCost}R)`
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
