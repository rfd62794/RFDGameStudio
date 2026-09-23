import { useGameStore } from '../store/gameStore'
import { SlimeVisual } from './SlimeVisual'
import { COLOR_DEFS, SHAPE_DEFS, getColorTier, getShapeTier } from '../data/traitDefs'
import type { Slime } from '../types'

interface Props {
  slime: Slime
}

export function SlimeCard({ slime }: Props) {
  const sellSlime = useGameStore((s) => s.sellSlime)
  const colorDef = COLOR_DEFS[slime.color] ?? COLOR_DEFS.Red
  const shapeDef = SHAPE_DEFS[slime.shape] ?? SHAPE_DEFS.Circle
  const colorTier = getColorTier(slime.color)
  const shapeTier = getShapeTier(slime.shape)

  return (
    <div className="flex items-center gap-3 p-3 bg-surface-container border border-outline-variant/15">
      <SlimeVisual color={slime.color} shape={slime.shape} size={56} />

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-label font-bold uppercase px-2 py-0.5"
            style={{ background: colorDef.chipBg, color: colorDef.chipText }}
          >
            {colorDef.designation}
          </span>
          <span className="text-[9px] font-label text-on-surface-variant/60 uppercase">T{colorTier}</span>
        </div>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
          {shapeDef.designation}
          <span className="text-on-surface-variant/50 ml-1">T{shapeTier}</span>
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-headline font-bold text-primary">{slime.actualValue}G</p>
        <button
          onClick={() => sellSlime(slime.id)}
          className="text-[9px] font-label uppercase tracking-widest text-error hover:text-error/80 transition-none mt-1"
        >
          LIQUIDATE
        </button>
      </div>
    </div>
  )
}
