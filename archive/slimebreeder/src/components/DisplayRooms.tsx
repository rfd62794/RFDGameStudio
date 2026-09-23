import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { DISPLAY_BASE_RATE } from '../config'
import { COLOR_DEFS, SHAPE_DEFS, getColorTier, getShapeTier } from '../data/traitDefs'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import { SlimeVisual } from './SlimeVisual'
import { SlimePicker } from './SlimePicker'

function slotGoldPerSec(color: SlimeColor, shape: SlimeShape) {
  return getColorTier(color) * getShapeTier(shape) * DISPLAY_BASE_RATE
}

export function DisplayRooms() {
  const displaySlots = useGameStore((s) => s.displaySlots)
  const unassignFromDisplay = useGameStore((s) => s.unassignFromDisplay)
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)

  // Live gold ticker — uses store action for proper persistence
  useEffect(() => {
    const id = setInterval(() => {
      useGameStore.getState().tickDisplayGold()
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <section className="bg-surface-container p-4">
        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">museum</span>
          DISPLAY_CHAMBER
        </p>

        <div className="grid grid-cols-2 gap-2">
          {displaySlots.map((slot, i) => {
            const colorDef = slot ? (COLOR_DEFS[slot.slime.color as SlimeColor] ?? COLOR_DEFS.Red) : null
            const shapeDef = slot ? (SHAPE_DEFS[slot.slime.shape as SlimeShape] ?? SHAPE_DEFS.Circle) : null
            return (
              <div
                key={i}
                className="bg-surface-container-high border border-outline-variant/20 flex flex-col items-center p-3 gap-2 min-h-[120px] justify-center"
              >
                {slot && colorDef && shapeDef ? (
                  <>
                    <SlimeVisual color={slot.slime.color} shape={slot.slime.shape} size={48} />
                    <span
                      className="text-[9px] font-label font-bold uppercase px-2 py-0.5"
                      style={{ background: colorDef.chipBg, color: colorDef.chipText }}
                    >
                      {shapeDef.designation}
                    </span>
                    <span className="text-[10px] font-label text-on-surface-variant uppercase">
                      +{slotGoldPerSec(slot.slime.color, slot.slime.shape).toFixed(1)}G/s
                    </span>
                    <button
                      onClick={() => unassignFromDisplay(i)}
                      className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface transition-none"
                    >
                      RETRIEVE
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-label text-on-surface-variant/30 uppercase tracking-widest">
                      SLOT_{i + 1}_EMPTY
                    </span>
                    <button
                      onClick={() => setPickerSlot(i)}
                      className="text-[10px] font-label uppercase tracking-widest bg-surface-container-highest text-on-surface px-3 py-1.5 hover:bg-surface-bright transition-none"
                    >
                      ASSIGN
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {pickerSlot !== null && (
        <SlimePicker
          title={`SELECT_SPECIMEN — SLOT_${pickerSlot + 1}`}
          onSelect={(slime) => {
            useGameStore.getState().assignToDisplay(slime.id, pickerSlot)
            setPickerSlot(null)
          }}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  )
}
