import React from 'react';
import { ArchetypeSymbolSpec, SymbolShape } from './archetypes';

/**
 * Native-SVG renderer for a role symbol. No canvas, no external library —
 * matches the studio's confirmed zero-dependency graphics primitive.
 *
 * Renders the archetype's base silhouette shape filled with its palette,
 * then the charge (mark) centered inside, optionally rotated by the
 * `chargeRotation` carried on a generated spec. All geometry is authored
 * against a 0..100 viewBox so the symbol scales cleanly to any `size`.
 */
export interface RoleSymbolProps {
  spec: ArchetypeSymbolSpec & { chargeRotation?: number };
  size?: number;
  /** Optional accessible label; defaults to the archetype name. */
  label?: string;
}

const SHAPE_PATHS: Record<SymbolShape, string> = {
  // circle: full disc
  circle: 'M50 50 m-44 0 a44 44 0 1 0 88 0 a44 44 0 1 0 -88 0 Z',
  // shield: classic heraldic shield
  shield: 'M50 8 L88 22 L88 50 Q88 78 50 92 Q12 78 12 50 L12 22 Z',
  // diamond: rhombus
  diamond: 'M50 6 L94 50 L50 94 L6 50 Z',
  // hexagon: regular, flat-top
  hexagon: 'M88 50 L69 83 L31 83 L12 50 L31 17 L69 17 Z',
};

export function RoleSymbol({ spec, size = 48, label }: RoleSymbolProps): React.ReactElement {
  const shapePath = SHAPE_PATHS[spec.shape];
  const rotation = spec.chargeRotation ?? 0;
  const accessibleLabel = label ?? spec.archetype;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={accessibleLabel}
      style={{ display: 'block' }}
    >
      <path d={shapePath} fill={spec.defaultPalette} fillOpacity={0.22} stroke={spec.defaultPalette} strokeWidth={3} />
      <g transform={`rotate(${rotation} 50 50)`}>
        <path d={spec.charge} fill="none" stroke={spec.defaultPalette} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default RoleSymbol;
