/**
 * PaperDoll React Component
 *
 * Wraps the composer for easy game consumption. Renders an SVG figure
 * from a BodyPlan + parts + colors. Games pass their mutant/chimera's
 * parts and a color scheme, and get a composed figure.
 *
 * Usage in MBB:
 *   <PaperDoll
 *     bodyPlan={humanoidBilateral}
 *     parts={mutant.parts}
 *     color={mutant.color}
 *     size={80}
 *   />
 *
 * Usage in Chimera Wilds:
 *   <PaperDoll
 *     bodyPlan={chimeraAsymmetric}
 *     parts={chimera.parts}
 *     color="#ef4444"
 *     size={120}
 *   />
 */

import React, { useMemo } from 'react';
import type { PartSlot } from '../shared/partSlots';
import { renderFigureSvg } from './composer';
import type { BodyPlan, PartForComposition } from './types';

interface PaperDollProps {
  bodyPlan: BodyPlan;
  parts: Record<string, { id: string; name: string; slot: PartSlot } | null>;
  color: string;
  size?: number;
  seed?: number;
  className?: string;
}

export function PaperDoll({
  bodyPlan,
  parts,
  color,
  size = 80,
  seed = 0,
  className,
}: PaperDollProps): React.ReactElement {
  const svg = useMemo(() => {
    // Build colors record — all slots use the mutant's color, with
    // slight opacity variation for visual depth. The Brand/Cyber-Organic/
    // Quality styling system (deferred) will replace this with richer
    // per-part color resolution.
    const colors: Record<string, string> = {};
    for (const node of bodyPlan.nodes) {
      colors[node.slot] = color;
    }

    // Convert parts to the composer's expected format
    const compositionParts: Record<string, PartForComposition | null> = {};
    for (const node of bodyPlan.nodes) {
      const part = parts[node.slot];
      compositionParts[node.slot] = part
        ? { id: part.id, name: part.name, slot: part.slot }
        : null;
    }

    return renderFigureSvg(
      { bodyPlan, parts: compositionParts, colors, seed },
      size,
      size,
    );
  }, [bodyPlan, parts, color, seed, size]);

  return (
    <div
      className={className ?? 'paper-doll'}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
