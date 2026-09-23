import { useEffect, useState } from 'react'
import { HATCH_DURATION_MS } from '../config'

interface Props {
  startedAt: number
  onComplete: () => void
  label?: string
}

export function IncubationProgress({ startedAt, onComplete, label = 'INCUBATING_EGG' }: Props) {
  const [pct, setPct] = useState(0)
  const [secsLeft, setSecsLeft] = useState(Math.ceil(HATCH_DURATION_MS / 1000))

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const p = Math.min(elapsed / HATCH_DURATION_MS, 1)
      setPct(p)
      setSecsLeft(Math.max(0, Math.ceil((HATCH_DURATION_MS - elapsed) / 1000)))
      if (p >= 1) {
        clearInterval(id) // stop ticker before calling onComplete — prevents multi-fire
        onComplete()
      }
    }, 100)
    return () => clearInterval(id)
  }, [startedAt, onComplete])

  return (
    <section className="bg-surface-container-high p-6">
      <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-2">
        {label} — {secsLeft}s
      </p>
      <div className="w-full bg-surface-container-highest h-5">
        <div
          className="h-full bg-primary-container"
          style={{ width: `${(pct * 100).toFixed(1)}%` }}
        />
      </div>
    </section>
  )
}
