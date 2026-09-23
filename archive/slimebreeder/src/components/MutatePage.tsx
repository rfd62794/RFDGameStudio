import { useGameStore } from '../store/gameStore'
import { TankCard } from './TankCard'
import { BreedingPanel } from './BreedingPanel'
import { TANK_UPGRADE_COST } from '../config'

export function MutatePage() {
  const tankCount = useGameStore((s) => s.tankCount)
  const gold = useGameStore((s) => s.gold)
  const buyTankUpgrade = useGameStore((s) => s.buyTankUpgrade)

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
            <TankCard key={i} tankIndex={i} />
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
      <div>
        <BreedingPanel />
      </div>
    </div>
  )
}
