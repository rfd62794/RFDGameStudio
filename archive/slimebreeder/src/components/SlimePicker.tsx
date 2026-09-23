import { useGameStore } from '../store/gameStore'
import { COLOR_DEFS, SHAPE_DEFS } from '../data/traitDefs'
import { SlimeVisual } from './SlimeVisual'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import type { Slime } from '../types'

interface Props {
  onSelect: (slime: Slime) => void
  onClose: () => void
  excludeIds?: string[]
  title?: string
  isValid?: (slime: Slime) => boolean
}

export function SlimePicker({ onSelect, onClose, excludeIds = [], title = 'SELECT_SPECIMEN', isValid = () => true }: Props) {
  const slimes = useGameStore((s) => s.slimes).filter((s) => !excludeIds.includes(s.id))
  const displaySlots = useGameStore((s) => s.displaySlots)
  const displayedSlimes = displaySlots
    .filter((slot) => slot !== null)
    .map((slot) => slot.slime)

  const hasAny = slimes.length > 0 || displayedSlimes.length > 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-high pb-8 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest p-4 border-b border-outline-variant/20 flex-shrink-0">
          {title}
        </p>

        {!hasAny ? (
          <p className="text-[11px] font-label text-on-surface-variant/50 uppercase tracking-widest p-6 text-center">
            No specimens in facility.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/10 overflow-y-auto">
            {slimes.map((slime) => {
              const colorDef = COLOR_DEFS[slime.color as SlimeColor] ?? COLOR_DEFS.Red
              const shapeDef = SHAPE_DEFS[slime.shape as SlimeShape] ?? SHAPE_DEFS.Circle
              const valid = isValid(slime)
              return (
                <li key={slime.id}>
                  {valid ? (
                    <button
                      onClick={() => { onSelect(slime); onClose() }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-highest transition-none text-left"
                    >
                      <SlimeVisual color={slime.color} shape={slime.shape} size={40} />
                      <div className="flex-grow">
                        <span
                          className="text-[10px] font-label font-bold uppercase px-2 py-0.5"
                          style={{ background: colorDef.chipBg, color: colorDef.chipText }}
                        >
                          {colorDef.designation}
                        </span>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                          {shapeDef.designation}
                        </p>
                      </div>
                      <span className="text-sm font-headline font-bold text-primary">
                        {slime.actualValue}G
                      </span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-3 p-3 opacity-35 cursor-not-allowed">
                      <SlimeVisual color={slime.color} shape={slime.shape} size={40} />
                      <div className="flex-grow">
                        <span
                          className="text-[10px] font-label font-bold uppercase px-2 py-0.5"
                          style={{ background: colorDef.chipBg, color: colorDef.chipText }}
                        >
                          {colorDef.designation}
                        </span>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                          {shapeDef.designation}
                        </p>
                      </div>
                      <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/40 px-2 py-0.5">
                        INELIGIBLE
                      </span>
                    </div>
                  )}
                </li>
              )
            })}

            {displayedSlimes.map((slime) => {
              const colorDef = COLOR_DEFS[slime.color as SlimeColor] ?? COLOR_DEFS.Red
              const shapeDef = SHAPE_DEFS[slime.shape as SlimeShape] ?? SHAPE_DEFS.Circle
              return (
                <li key={slime.id}>
                  <div className="w-full flex items-center gap-3 p-3 opacity-35 cursor-not-allowed">
                    <SlimeVisual color={slime.color} shape={slime.shape} size={40} />
                    <div className="flex-grow">
                      <span
                        className="text-[10px] font-label font-bold uppercase px-2 py-0.5"
                        style={{ background: colorDef.chipBg, color: colorDef.chipText }}
                      >
                        {colorDef.designation}
                      </span>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                        {shapeDef.designation}
                      </p>
                    </div>
                    <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/40 px-2 py-0.5">
                      ON_DISPLAY
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
