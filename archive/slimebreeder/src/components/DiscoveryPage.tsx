import { useGameStore } from '../store/gameStore'
import { ALL_COLORS, ALL_SHAPES, COLOR_DEFS, SHAPE_DEFS, getColorTier, getShapeTier } from '../data/traitDefs'
import { getColorRecipeHint, getShapeRecipeHint } from '../utils/discovery'
import { SlimeVisual } from './SlimeVisual'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'

export function DiscoveryPage() {
  const discoveredColors = useGameStore((s) => s.discoveredColors)
  const discoveredShapes = useGameStore((s) => s.discoveredShapes)
  const regents = useGameStore((s) => s.regents)

  const discoveredColorSet = new Set(discoveredColors)
  const discoveredShapeSet = new Set(discoveredShapes)

  // Group by tier
  const colorsByTier = groupByTier(ALL_COLORS, (c) => getColorTier(c))
  const shapesByTier = groupByTier(ALL_SHAPES, (s) => getShapeTier(s))

  return (
    <div className="space-y-0">
      {/* Regent Balance */}
      <section className="bg-surface-container-high p-4 border-b border-outline-variant/15">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">diamond</span>
            RESEARCH_ALLOCATION
          </p>
          <p className="text-lg font-headline font-bold text-tertiary">
            {regents}<span className="text-[10px] text-on-surface-variant ml-1">REGENTS</span>
          </p>
        </div>
        <p className="text-[9px] text-on-surface-variant/50 mt-1 uppercase tracking-wider">
          Discover new traits through breeding. Spend Regents to guarantee traits during incubation.
        </p>
      </section>

      {/* Color Discovery Tree */}
      <section className="p-4">
        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">palette</span>
          CHROMATIC_CODEX
          <span className="ml-auto text-on-surface-variant/40">
            {discoveredColors.length}/{ALL_COLORS.length}
          </span>
        </p>

        {[1, 2, 3, 4].map((tier) => {
          const colors = colorsByTier.get(tier) ?? []
          if (colors.length === 0) return null
          return (
            <div key={tier} className="mb-4">
              <p className="text-[9px] font-label text-on-surface-variant/50 uppercase tracking-widest mb-2">
                {tierLabel(tier)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {colors.map((color) => (
                  <TraitCell
                    key={color}
                    discovered={discoveredColorSet.has(color)}
                    label={COLOR_DEFS[color].designation}
                    chipBg={COLOR_DEFS[color].chipBg}
                    chipText={COLOR_DEFS[color].chipText}
                    hint={getColorRecipeHintText(color)}
                    preview={
                      discoveredColorSet.has(color) ? (
                        <SlimeVisual color={color} shape="Circle" size={36} />
                      ) : null
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* Shape Discovery Tree */}
      <section className="p-4 border-t border-outline-variant/15">
        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">category</span>
          MORPHOLOGY_CODEX
          <span className="ml-auto text-on-surface-variant/40">
            {discoveredShapes.length}/{ALL_SHAPES.length}
          </span>
        </p>

        {[1, 2, 3, 4].map((tier) => {
          const shapes = shapesByTier.get(tier) ?? []
          if (shapes.length === 0) return null
          return (
            <div key={tier} className="mb-4">
              <p className="text-[9px] font-label text-on-surface-variant/50 uppercase tracking-widest mb-2">
                {tierLabel(tier)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {shapes.map((shape) => (
                  <TraitCell
                    key={shape}
                    discovered={discoveredShapeSet.has(shape)}
                    label={SHAPE_DEFS[shape].designation}
                    chipBg="#2a2a2a"
                    chipText="#aaa"
                    hint={getShapeRecipeHintText(shape)}
                    preview={
                      discoveredShapeSet.has(shape) ? (
                        <SlimeVisual color="Blue" shape={shape} size={36} />
                      ) : null
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────

interface TraitCellProps {
  discovered: boolean
  label: string
  chipBg: string
  chipText: string
  hint: string | null
  preview: React.ReactNode
}

function TraitCell({ discovered, label, chipBg, chipText, hint, preview }: TraitCellProps) {
  return (
    <div
      className={`border flex flex-col items-center p-2 gap-1.5 min-h-[80px] justify-center ${
        discovered
          ? 'bg-surface-container-high border-outline-variant/30'
          : 'bg-surface-container border-outline-variant/10 opacity-40'
      }`}
    >
      {discovered ? (
        <>
          {preview}
          <span
            className="text-[8px] font-label font-bold uppercase px-1.5 py-0.5 text-center leading-tight"
            style={{ background: chipBg, color: chipText }}
          >
            {label}
          </span>
        </>
      ) : (
        <>
          <span className="text-[18px] text-on-surface-variant/30">?</span>
          {hint && (
            <span className="text-[7px] font-label text-on-surface-variant/30 uppercase tracking-wider text-center leading-tight">
              {hint}
            </span>
          )}
        </>
      )}
    </div>
  )
}

// ── Utilities ──────────────────────────────────────────────────

function groupByTier<T>(items: T[], getTier: (item: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const item of items) {
    const tier = getTier(item)
    if (!map.has(tier)) map.set(tier, [])
    map.get(tier)!.push(item)
  }
  return map
}

function tierLabel(tier: number): string {
  switch (tier) {
    case 1: return 'TIER_1 — FOUNDATIONAL'
    case 2: return 'TIER_2 — SECONDARY'
    case 3: return 'TIER_3 — TERTIARY'
    case 4: return 'TIER_4 — EXOTIC'
    default: return `TIER_${tier}`
  }
}

function getColorRecipeHintText(color: SlimeColor): string | null {
  const hint = getColorRecipeHint(color)
  if (!hint) return null
  return `${hint[0]} × ${hint[1]}`
}

function getShapeRecipeHintText(shape: SlimeShape): string | null {
  const hint = getShapeRecipeHint(shape)
  if (!hint) return null
  return `${hint[0]} × ${hint[1]}`
}
