import { useGameStore } from '../store/gameStore'

export function StatsBar() {
  const gold = useGameStore((s) => s.gold)
  const slimes = useGameStore((s) => s.slimes)
  const penCapacity = useGameStore((s) => s.penCapacity)
  const regents = useGameStore((s) => s.regents)

  return (
    <section className="grid grid-cols-3 gap-0">
      <div className="bg-surface p-4 border-l-4 border-primary-container toxic-glow">
        <p className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest mb-1">
          Current_Liquidity
        </p>
        <h2 className="text-xl font-headline font-black text-primary leading-none tracking-tight">
          {Math.floor(gold)}G
        </h2>
      </div>
      <div className="bg-surface p-4 border-l-4 border-secondary-container">
        <p className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest mb-1">
          Containment
        </p>
        <h2 className="text-xl font-headline font-black text-secondary leading-none tracking-tight">
          {slimes.length}/{penCapacity}
        </h2>
      </div>
      <div className="bg-surface p-4 border-l-4 border-tertiary-container">
        <p className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest mb-1">
          Research
        </p>
        <h2 className="text-xl font-headline font-black text-tertiary leading-none tracking-tight">
          {regents}R
        </h2>
      </div>
    </section>
  )
}

