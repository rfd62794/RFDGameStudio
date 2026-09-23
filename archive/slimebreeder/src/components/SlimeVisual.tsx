import { useId } from 'react'
import { COLOR_DEFS, SHAPE_DEFS } from '../data/traitDefs'
import type { SlimeColor, SlimeShape, EyeConfig } from '../data/traitDefs'

interface SlimeVisualProps {
  color: SlimeColor
  shape: SlimeShape
  size?: number
}

export function SlimeVisual({ color, shape, size = 80 }: SlimeVisualProps) {
  const uid = useId()
  const gradId = `${uid}-grad`

  const colorDef = COLOR_DEFS[color as SlimeColor] ?? COLOR_DEFS.Red
  const shapeDef = SHAPE_DEFS[shape as SlimeShape] ?? SHAPE_DEFS.Circle

  const g = colorDef.gradient
  const hl = shapeDef.highlight
  const focal = shapeDef.gradFocal
  const face = shapeDef.face

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="38%" cy={focal.cy} r={focal.r}>
          <stop offset="0%" stopColor={g.light} />
          <stop offset="100%" stopColor={g.dark} />
        </radialGradient>
      </defs>

      {/* Body */}
      <path
        d={shapeDef.svgPath}
        fill={`url(#${gradId})`}
        style={{ filter: `drop-shadow(0 0 10px ${g.glow})` }}
      />

      {/* Shape extras */}
      {shapeDef.extras === 'core' && (
        <circle cx={50} cy={52} r={14} fill={`${g.light}30`} data-core="" />
      )}
      {shapeDef.extras === 'drip' && (
        <path
          d="M50,85 C50,85 48,90 50,94 C52,90 50,85 50,85Z"
          fill={g.light}
          opacity={0.7}
          data-drip=""
        />
      )}

      {/* Highlight — gives depth illusion */}
      <ellipse
        cx={hl.cx}
        cy={hl.cy}
        rx={9}
        ry={5}
        fill="rgba(255,255,255,0.18)"
        transform={`rotate(-15,${hl.cx},${hl.cy})`}
      />

      {/* Face — eyes */}
      {([face.left, face.right] as EyeConfig[]).map((eye, i) => (
        <g key={i}>
          {/* Eye white */}
          <ellipse cx={eye.cx} cy={eye.cy} rx={eye.rx} ry={eye.ry} fill="rgba(255,255,255,0.94)" />
          {/* Pupil */}
          <circle cx={eye.px} cy={eye.py} r={eye.pr} fill={g.pupil} />
          {/* Glint */}
          <circle cx={eye.gx} cy={eye.gy} r={2} fill="rgba(255,255,255,0.8)" />
        </g>
      ))}

      {/* Mouth */}
      <path
        d={face.mouth}
        stroke="rgba(0,0,0,0.65)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
