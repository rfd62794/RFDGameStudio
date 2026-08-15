/**
 * PaperDoll React Component — Chimera Paper Doll Studio port
 *
 * Renders a creature figure using the hand-authored, socket-contracted,
 * facing-aware SVG system from Chimera Paper Doll Studio.
 *
 * This replaces the previous procedural composer/body-plan approach.
 * The old procedural files are preserved for POC consumers (Character
 * Viewer, Technique Showcase) but production rendering goes through
 * this component.
 *
 * Usage in MBB:
 *   <PaperDoll
 *     parts={mutant.parts}
 *     color={mutant.color}
 *     size={80}
 *   />
 *
 * Usage in Chimera Wilds:
 *   <PaperDoll
 *     parts={chimera.parts}
 *     color="#ef4444"
 *     size={120}
 *     archetype="quadruped"
 *   />
 *
 * The `color` prop is kept for backward compatibility but is now
 * optional — the Chimera system derives colors from Brand + Cyber/Organic
 * lean per-part, which is richer than the old single-color approach.
 */

import React, { useMemo } from 'react';
import type { Part } from '../shared/partSlots';
import { partsToCreatureConfig, getDefaultPose } from './adapter';
import type { BodyArchetype, FacingDirection, AnimationType } from './chimeraTypes';
import { SvgCreatureRenderer } from './chimeraSvgCreatureRenderer';

interface PaperDollProps {
  /** MBB-style parts: Record<slot, Part | null> */
  parts: Record<string, Part | null>;
  /** Kept for backward compat — Chimera system derives colors from Brand */
  color?: string;
  size?: number;
  seed?: number;
  className?: string;
  /** Body archetype — defaults to 'humanoid' */
  archetype?: BodyArchetype;
  /** Facing direction — defaults to 'side_right' */
  facing?: FacingDirection;
  /** Animation type — defaults to 'idle' */
  animation?: AnimationType;
  /** Animation time (0-1) — defaults to 0 */
  animationT?: number;
  /** Show socket debug overlay */
  showSockets?: boolean;
}

export function PaperDoll({
  parts,
  color: _color,
  size = 80,
  seed = 0,
  className,
  archetype = 'humanoid',
  facing = 'side_right',
  animation = 'idle',
  animationT = 0,
  showSockets = false,
}: PaperDollProps): React.ReactElement {
  const creature = useMemo(
    () => partsToCreatureConfig(`doll_${seed}`, 'Creature', parts, archetype),
    [parts, archetype, seed],
  );

  const pose = useMemo(
    () => getDefaultPose(creature, animation, animationT, facing),
    [creature, animation, animationT, facing],
  );

  return (
    <div
      className={className ?? 'paper-doll'}
      style={{ width: size, height: size }}
    >
      <SvgCreatureRenderer
        creature={creature}
        pose={pose}
        selectedSlot={null}
        facing={facing}
        showSockets={showSockets}
        viewBox="0 0 400 480"
        className="w-full h-full"
      />
    </div>
  );
}
