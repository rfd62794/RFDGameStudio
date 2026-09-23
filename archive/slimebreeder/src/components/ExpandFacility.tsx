import { PEN_UPGRADE_COST } from '../config'
import { useGameStore } from '../store/gameStore'

export function ExpandFacility() {
  const gold = useGameStore((s) => s.gold)
  const buyPenUpgrade = useGameStore((s) => s.buyPenUpgrade)
  const canAfford = gold >= PEN_UPGRADE_COST

  return (
    <footer className="pt-6 pb-24 px-4 border-t border-outline-variant/10">
      <button
        onClick={buyPenUpgrade}
        disabled={!canAfford}
        className={`w-full font-headline font-black text-base py-4 flex justify-between px-6 items-center transition-none uppercase tracking-widest ${
          canAfford
            ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
            : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
        }`}
      >
        <span>EXPAND_FACILITY</span>
        <span className={canAfford ? 'text-secondary-container' : 'text-outline-variant'}>
          ({PEN_UPGRADE_COST}G)
        </span>
      </button>
    </footer>
  )
}
