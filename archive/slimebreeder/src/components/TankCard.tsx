import { useGameStore } from '../store/gameStore'
import { IncubationProgress } from './IncubationProgress'
import { SlimeVisual } from './SlimeVisual'
import type { BreedTankSlot } from '../db/db'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'

interface Props {
  tankIndex: number
}

export function TankCard({ tankIndex }: Props) {
  const slot = useGameStore((s) => s.tanks[tankIndex])
  const startHatch = useGameStore((s) => s.startHatch)
  const resolveHatch = useGameStore((s) => s.resolveHatch)
  const resolveBreed = useGameStore((s) => s.resolveBreed)
  const penFull = useGameStore((s) => s.slimes.length >= s.penCapacity)

  // ── Idle ─────────────────────────────────────────────────────
  if (!slot) {
    return (
      <div className="bg-surface-container-high border border-outline-variant/20 p-3 flex items-center justify-between">
        <span className="text-on-surface-variant text-xs font-label uppercase tracking-widest">
          TANK_{tankIndex + 1} — IDLE
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => !penFull && startHatch(tankIndex)}
            disabled={penFull}
            className="px-4 py-1.5 text-[10px] font-label font-bold uppercase tracking-widest bg-primary text-on-primary disabled:opacity-30"
          >
            HATCH
          </button>
          <button
            onClick={() => {}}
            className="px-4 py-1.5 text-[10px] font-label font-bold uppercase tracking-widest bg-surface-container-highest text-on-surface"
          >
            BREED
          </button>
        </div>
      </div>
    )
  }

  // ── Hatch in progress ────────────────────────────────────────
  if (slot.type === 'hatch') {
    return (
      <div className="bg-surface-container-high border border-outline-variant/20">
        <IncubationProgress
          startedAt={slot.startedAt}
          onComplete={() => resolveHatch(tankIndex)}
          label="HATCH_IN_PROGRESS"
        />
      </div>
    )
  }

  // ── Breed in progress ────────────────────────────────────────
  const breedSlot = slot as BreedTankSlot
  return (
    <div className="bg-surface-container-high border border-outline-variant/20">
      <div className="flex items-center gap-3 p-3 pb-0">
        <SlimeVisual
          color={breedSlot.hostSnapshot?.color as SlimeColor ?? breedSlot.donorSnapshot.color as SlimeColor}
          shape={breedSlot.hostSnapshot?.shape as SlimeShape ?? breedSlot.donorSnapshot.shape as SlimeShape}
          size={32}
        />
        <span className="text-on-surface-variant text-xs font-headline">×</span>
        <SlimeVisual
          color={breedSlot.donorSnapshot.color as SlimeColor}
          shape={breedSlot.donorSnapshot.shape as SlimeShape}
          size={32}
        />
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
