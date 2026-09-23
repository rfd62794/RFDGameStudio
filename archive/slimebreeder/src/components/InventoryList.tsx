import { useGameStore } from '../store/gameStore'
import { SlimeCard } from './SlimeCard'

export function InventoryList() {
  const slimes = useGameStore((s) => s.slimes)

  return (
    <section className="space-y-4 px-0">
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="material-symbols-outlined text-sm text-on-surface-variant">database</span>
        <h3 className="font-headline text-sm font-bold uppercase tracking-[0.3em] text-on-surface-variant">
          BIOLOGICAL_ASSETS
        </h3>
        <span className="ml-auto text-[10px] font-label text-outline-variant uppercase">
          {slimes.length} specimen{slimes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {slimes.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-[10px] font-label uppercase tracking-widest text-outline-variant mb-2">
            INVENTORY_EMPTY
          </div>
          <div className="text-sm text-on-surface-variant/50">
            No biological assets in containment.
          </div>
          <div className="text-sm text-on-surface-variant/50">
            Initiate incubation to acquire specimens.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0 px-4 space-y-2">
          {slimes.map((slime) => (
            <SlimeCard key={slime.id} slime={slime} />
          ))}
        </div>
      )}
    </section>
  )
}
