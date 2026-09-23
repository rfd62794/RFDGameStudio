import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { COLOR_DEFS, SHAPE_DEFS } from '../data/traitDefs'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import { SlimePicker } from './SlimePicker'
import type { WandererRequest } from '../db/db'

export function MarketPage() {
  const requests = useGameStore((s) => s.wandererRequests)
  const fulfillRequest = useGameStore((s) => s.fulfillRequest)
  const dismissRequest = useGameStore((s) => s.dismissRequest)
  
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)

  const activeRequestObj = requests.find(r => r.id === activeRequestId)

  return (
    <div className="space-y-0">
      <section className="bg-surface-container-high p-4 border-b border-outline-variant/15">
        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[14px]">storefront</span>
          WANDERER_CONTRACTS
        </p>
        <p className="text-[9px] text-on-surface-variant/50 uppercase tracking-wider">
          External parties seek specific genetic combinations. Fulfill contracts for premium liquidity payouts.
        </p>
      </section>

      <section className="p-4 space-y-3">
        {requests.map((req) => (
          <RequestCard 
            key={req.id} 
            req={req} 
            onFulfill={() => setActiveRequestId(req.id)}
            onDismiss={() => dismissRequest(req.id)}
          />
        ))}
        {requests.length === 0 && (
          <div className="p-8 text-center border border-outline-variant/20 bg-surface-container">
            <p className="text-[10px] font-label text-on-surface-variant/50 uppercase tracking-widest">
              NO_ACTIVE_CONTRACTS
            </p>
          </div>
        )}
      </section>

      {activeRequestId && activeRequestObj && (
        <SlimePicker
          title="SELECT_SPECIMEN_TO_FULFILL"
          onClose={() => setActiveRequestId(null)}
          isValid={(slime) => {
            if (activeRequestObj.targetColor && activeRequestObj.targetColor !== slime.color) return false
            if (activeRequestObj.targetShape && activeRequestObj.targetShape !== slime.shape) return false
            return true
          }}
          onSelect={(slime) => {
            fulfillRequest(activeRequestObj.id, slime.id)
            setActiveRequestId(null)
          }}
        />
      )}
    </div>
  )
}

function RequestCard({ req, onFulfill, onDismiss }: { req: WandererRequest, onFulfill: () => void, onDismiss: () => void }) {
  const colorDef = req.targetColor ? COLOR_DEFS[req.targetColor as SlimeColor] : null
  const shapeDef = req.targetShape ? SHAPE_DEFS[req.targetShape as SlimeShape] : null

  return (
    <div className="bg-surface border border-outline-variant/20 p-3 flex flex-col gap-3 relative overflow-hidden">
      <div className="flex items-start justify-between z-10 w-full">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex justify-between items-center w-full">
            <span className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">
              TARGET_ACQUISITION
            </span>
            <span className="text-xl font-headline font-black text-primary">
              {req.rewardGold}G
            </span>
          </div>

          <div className="flex gap-2 items-center mt-2">
            {colorDef ? (
              <span className="text-[10px] font-label font-bold uppercase px-2 py-0.5" style={{ background: colorDef.chipBg, color: colorDef.chipText }}>
                {colorDef.designation}
              </span>
            ) : (
              <span className="text-[10px] font-label font-bold uppercase px-2 py-0.5 bg-surface-container text-on-surface-variant/60 border border-outline-variant/20">
                ANY_COLOR
              </span>
            )}
            
            <span className="text-on-surface-variant/40 text-[10px]">×</span>

            {shapeDef ? (
              <span className="text-[10px] font-label font-bold uppercase px-2 py-0.5 bg-[#2a2a2a] text-[#aaa] border border-outline-variant/10">
                {shapeDef.designation}
              </span>
            ) : (
              <span className="text-[10px] font-label font-bold uppercase px-2 py-0.5 bg-surface-container text-on-surface-variant/60 border border-outline-variant/20">
                ANY_SHAPE
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2 z-10">
        <button
          onClick={onFulfill}
          className="flex-grow py-2 text-[10px] font-label font-bold uppercase tracking-widest bg-primary-container text-on-primary-container hover:brightness-110"
        >
          FULFILL_CONTRACT
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 text-[10px] font-label text-error/80 hover:text-error hover:bg-error/10 uppercase tracking-widest border border-error/20"
        >
          DISMISS
        </button>
      </div>
    </div>
  )
}
