import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { SlimeVisual } from './SlimeVisual'
import { SlimePicker } from './SlimePicker'
import type { Slime } from '../types'

export function BreedingPanel() {
  const [host, setHost] = useState<Slime | null>(null)
  const [donor, setDonor] = useState<Slime | null>(null)
  const [pickerOpen, setPickerOpen] = useState<'host' | 'donor' | null>(null)

  const startBreed = useGameStore((s) => s.startBreed)
  const tanks = useGameStore((s) => s.tanks)

  const hasFreeTank = tanks.some((t) => t === null)
  const canBreed = host !== null && donor !== null && hasFreeTank

  function handleStartBreed() {
    if (!host || !donor) return
    startBreed(host.id, donor.id)
    setHost(null)
    setDonor(null)
  }

  return (
    <section className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <span className="material-symbols-outlined text-sm text-on-surface-variant">science</span>
        <h3 className="font-headline text-sm font-bold uppercase tracking-[0.3em] text-on-surface-variant">
          BREEDING_LAB
        </h3>
      </div>

      {/* Parent slots */}
      <div className="flex items-center gap-3">
        <SlotButton
          slime={host}
          label="HOST"
          onClick={() => setPickerOpen('host')}
        />
        <span className="text-on-surface-variant font-headline text-2xl flex-shrink-0">×</span>
        <SlotButton
          slime={donor}
          label="DONOR"
          onClick={() => setPickerOpen('donor')}
          isConsumed
        />
      </div>

      {/* Start breed */}
      <button
        onClick={handleStartBreed}
        disabled={!canBreed}
        className={`w-full font-headline font-black text-lg py-4 uppercase tracking-[0.2em] transition-none ${
          canBreed
            ? 'bg-primary-container text-on-primary-container'
            : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50'
        }`}
      >
        {!hasFreeTank ? 'ALL_TANKS_OCCUPIED' : 'START_BREED'}
      </button>

      {/* Picker modal */}
      {pickerOpen && (
        <SlimePicker
          title={pickerOpen === 'host' ? 'SELECT_HOST' : 'SELECT_DONOR — WILL_BE_CONSUMED'}
          excludeIds={[
            ...(pickerOpen === 'host' && donor ? [donor.id] : []),
            ...(pickerOpen === 'donor' && host ? [host.id] : []),
          ]}
          onSelect={(slime) => {
            if (pickerOpen === 'host') setHost(slime)
            else setDonor(slime)
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}
    </section>
  )
}

interface SlotButtonProps {
  slime: Slime | null
  label: string
  onClick: () => void
  isConsumed?: boolean
}

function SlotButton({ slime, label, onClick, isConsumed = false }: SlotButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-outline-variant/30 bg-surface-container p-3 flex flex-col items-center gap-2 min-h-[100px] justify-center hover:bg-surface-container-high transition-none"
    >
      {slime ? (
        <>
          <SlimeVisual color={slime.color} shape={slime.shape} size={64} />
          <span className="text-[10px] font-label text-primary uppercase">{slime.actualValue}G</span>
          {isConsumed && (
            <span className="text-[9px] font-label text-error uppercase tracking-wider">⚠ CONSUMED</span>
          )}
        </>
      ) : (
        <>
          <span className="text-on-surface-variant/30 text-3xl leading-none">+</span>
          <span className="text-[10px] font-label text-on-surface-variant/50 uppercase">{label}</span>
        </>
      )}
    </button>
  )
}
