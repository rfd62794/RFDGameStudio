import React, { useId } from 'react';
import { CreatureConfig, CreaturePose, SlotType, FacingDirection } from './chimeraTypes';
import { SOCKET_DEFINITIONS, LIMB_STANDARDS } from './chimeraSockets';
import { HeadSvg, ChestSvg, UpperArmSvg, ForearmSvg, ThighSvg, CalfSvg, TailSvg } from './chimeraBrandSvgAssets';
import { SocketCollar } from './chimeraSvgPartDrawers';

interface SvgCreatureRendererProps {
  creature: CreatureConfig;
  pose: CreaturePose;
  selectedSlot: SlotType | null;
  onSelectSlot?: (slot: SlotType) => void;
  showSockets?: boolean;
  showSkeleton?: boolean;
  viewBox?: string;
  className?: string;
  facing?: FacingDirection;
}

export const SvgCreatureRenderer: React.FC<SvgCreatureRendererProps> = ({
  creature,
  pose,
  selectedSlot,
  onSelectSlot,
  showSockets = false,
  showSkeleton = false,
  viewBox = '0 0 400 480',
  className = '',
  facing = 'side_right',
}) => {
  const filterUniqueId = useId().replace(/:/g, '_');
  const sockets = SOCKET_DEFINITIONS[creature.archetype] || SOCKET_DEFINITIONS.humanoid;
  const isQuadruped = creature.archetype === 'quadruped';
  const isAvian = creature.archetype === 'avian_raptor';
  const isFront = facing === 'front';
  const isBack = facing === 'back';
  const isBilateral = isFront || isBack;

  // Sockets positioning based on facing
  let neckRel = { x: 0, y: -66 };
  let shoulderLRel = { x: -52, y: -44 };
  let shoulderRRel = { x: 52, y: -44 };
  let hipLRel = { x: -28, y: 56 };
  let hipRRel = { x: 28, y: 56 };
  let tailRel = sockets.tail ? { x: 0, y: isBack ? 38 : 54 } : null;

  if (isBilateral) {
    // Symmetrical frontal/dorsal anchor layout
    const isBrute = creature.archetype === 'beast_brute';
    const shoulderSpread = isAvian ? 46 : isQuadruped ? 40 : isBrute ? 64 : 52;
    const hipSpread = isAvian ? 26 : isQuadruped ? 32 : isBrute ? 36 : 28;
    neckRel = { x: 0, y: isAvian ? -56 : isBrute ? -52 : -66 };
    shoulderLRel = { x: -shoulderSpread, y: -44 };
    shoulderRRel = { x: shoulderSpread, y: -44 };
    hipLRel = { x: -hipSpread, y: 56 };
    hipRRel = { x: hipSpread, y: 56 };
    tailRel = { x: 0, y: isBack ? 38 : 54 };
  } else {
    // SIDE PROFILE ANCHOR LAYOUT (Distinct per Archetype!)
    // In profile: Left limbs are FAR (behind torso), Right limbs are NEAR (in front of torso)
    if (isQuadruped) {
      neckRel = { x: -55, y: -24 };
      shoulderLRel = { x: -44, y: 14 }; // Fore-Left (Far)
      shoulderRRel = { x: -30, y: 18 }; // Fore-Right (Near)
      hipLRel = { x: 42, y: 14 };       // Hind-Left (Far)
      hipRRel = { x: 58, y: 18 };       // Hind-Right (Near)
      tailRel = { x: 68, y: -6 };
    } else if (isAvian) {
      neckRel = { x: 8, y: -58 };
      shoulderLRel = { x: -8, y: -44 };  // Far wing/arm (Left)
      shoulderRRel = { x: 6, y: -40 };   // Near wing/arm (Right)
      hipLRel = { x: -10, y: 48 };       // Far leg (Left)
      hipRRel = { x: 8, y: 52 };         // Near leg (Right)
      tailRel = { x: -20, y: 44 };
    } else if (creature.archetype === 'beast_brute') {
      neckRel = { x: 12, y: -50 };
      shoulderLRel = { x: -12, y: -38 }; // Far arm (Left)
      shoulderRRel = { x: 8, y: -34 };   // Near arm (Right)
      hipLRel = { x: -12, y: 56 };       // Far leg (Left)
      hipRRel = { x: 8, y: 62 };         // Near leg (Right)
      tailRel = null;
    } else {
      // Standard Humanoid Profile
      neckRel = { x: 4, y: -64 };
      shoulderLRel = { x: -10, y: -46 }; // Far arm (Left)
      shoulderRRel = { x: 4, y: -42 };   // Near arm (Right)
      hipLRel = { x: -8, y: 52 };        // Far leg (Left)
      hipRRel = { x: 6, y: 56 };         // Near leg (Right)
      tailRel = null;
    }
  }

  const handleSlotClick = (slot: SlotType, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectSlot?.(slot);
  };

  // Geometric root body transforms for facing states
  let rootX = sockets.core.x + pose.chest.x;
  let rootY = sockets.core.y + pose.chest.y;
  let rootRot = pose.chest.rotation;

  if (isFront) {
    rootX = 200 + (pose.chest.x || 0) * 0.25;
    rootY = sockets.core.y + (pose.chest.y || 0);
    rootRot = (pose.chest.rotation || 0) * 0.15;
  } else if (isBack) {
    rootX = 200 - (pose.chest.x || 0) * 0.25;
    rootY = sockets.core.y + (pose.chest.y || 0);
    rootRot = -(pose.chest.rotation || 0) * 0.15;
  }

  // Limb rotations adjusted for bilateral front/back stance
  const leftArmRot = isBilateral
    ? isFront
      ? (pose.leftUpperArm.rotation * 0.35) - 10
      : (-pose.leftUpperArm.rotation * 0.35) - 10
    : pose.leftUpperArm.rotation;

  const rightArmRot = isBilateral
    ? isFront
      ? (-pose.leftUpperArm.rotation * 0.35) + 10
      : (pose.leftUpperArm.rotation * 0.35) + 10
    : pose.rightUpperArm.rotation;

  const leftForearmRot = isBilateral
    ? isFront
      ? (pose.leftForearm.rotation * 0.35) + 6
      : (-pose.leftForearm.rotation * 0.35) + 6
    : pose.leftForearm.rotation;

  const rightForearmRot = isBilateral
    ? isFront
      ? (-pose.leftForearm.rotation * 0.35) - 6
      : (pose.leftForearm.rotation * 0.35) - 6
    : pose.rightForearm.rotation;

  const leftLegRot = isBilateral ? (pose.leftThigh.rotation * 0.3) - 3 : pose.leftThigh.rotation;
  const rightLegRot = isBilateral ? (pose.rightThigh.rotation * 0.3) + 3 : pose.rightThigh.rotation;
  const leftCalfRot = isBilateral ? pose.leftCalf.rotation * 0.3 : pose.leftCalf.rotation;
  const rightCalfRot = isBilateral ? pose.rightCalf.rotation * 0.3 : pose.rightCalf.rotation;
  const headRot = isBilateral ? (pose.head.rotation * 0.2) : pose.head.rotation;

  return (
    <svg
      viewBox={viewBox}
      className={`w-full h-full select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Dynamic Malfunctioning SVG Glitch Filter */}
        <filter id={`glitch_${filterUniqueId}`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.06 0.95"
            numOctaves="2"
            result="noise"
            seed={pose.glitchJitter.active ? 42 : 12}
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={pose.glitchJitter.active ? 16 : 4}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Dynamic Emissive Bloom Glow */}
        <filter id={`bloom_${filterUniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Ambient Arena Floor Shadow */}
        <radialGradient id={`shadowGrad_${filterUniqueId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#000000" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer mirror container if facing left */}
      <g transform={facing === 'side_left' ? 'translate(400, 0) scale(-1, 1)' : undefined}>
        {/* Ground Contact Shadow */}
        <ellipse
          cx="200"
          cy={isQuadruped ? 405 : isAvian ? 415 : 430}
          rx={isBilateral ? (isQuadruped ? 120 : isAvian ? 100 : 95) : (isQuadruped ? 135 : isAvian ? 105 : 90)}
          ry={isQuadruped ? 24 : isAvian ? 20 : 18}
          fill={`url(#shadowGrad_${filterUniqueId})`}
          className="pointer-events-none"
        />

        {/* =====================================================================
            ROOT BODY HIERARCHY
            Chest drives position, bounce, and orientation
           ===================================================================== */}
        <g
          transform={`translate(${rootX}, ${rootY}) rotate(${rootRot}) scale(1, ${pose.chest.scaleY || 1})`}
        >
          {/* =================================================================
              LIMB / SEGMENT DEFINITIONS
             ================================================================= */}
          {(() => {
            const tailBehindElement = tailRel && !isBack && (
              <g
                key="tailBehind"
                transform={`translate(${tailRel.x}, ${tailRel.y}) rotate(${(sockets.tail?.rotation || 0) + (pose.tail?.rotation || 0)})`}
              >
                <TailSvg
                  brand={creature.slots.chest.brand}
                  quality={creature.slots.chest.quality}
                  cyberOrganic={creature.slots.chest.cyberOrganic}
                  archetype={creature.archetype}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
              </g>
            );

            const tailForegroundElement = tailRel && isBack && (
              <g
                key="tailForeground"
                transform={`translate(${tailRel.x}, ${tailRel.y}) rotate(${(sockets.tail?.rotation || 0) + (pose.tail?.rotation || 0)})`}
              >
                <TailSvg
                  brand={creature.slots.chest.brand}
                  quality={creature.slots.chest.quality}
                  cyberOrganic={creature.slots.chest.cyberOrganic}
                  archetype={creature.archetype}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
              </g>
            );

            const leftLegElement = (
              <g
                key="leftLeg"
                transform={`translate(${hipLRel.x}, ${hipLRel.y}) rotate(${leftLegRot})`}
                className="cursor-pointer"
                onClick={(e) => handleSlotClick('leftLeg', e)}
                filter={creature.slots.leftLeg.quality === 'Malfunctioning' ? `url(#glitch_${filterUniqueId})` : undefined}
              >
                <SocketCollar x={0} y={0} brand={creature.slots.leftLeg.brand} cyberOrganic={creature.slots.leftLeg.cyberOrganic} />
                <ThighSvg
                  brand={creature.slots.leftLeg.brand}
                  quality={creature.slots.leftLeg.quality}
                  cyberOrganic={creature.slots.leftLeg.cyberOrganic}
                  archetype={creature.archetype}
                  selected={selectedSlot === 'leftLeg'}
                  isRightSide={false}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
                <g transform={`translate(0, ${LIMB_STANDARDS.thighLength}) rotate(${leftCalfRot})`}>
                  <CalfSvg
                    brand={creature.slots.leftLeg.brand}
                    quality={creature.slots.leftLeg.quality}
                    cyberOrganic={creature.slots.leftLeg.cyberOrganic}
                    archetype={creature.archetype}
                    selected={selectedSlot === 'leftLeg'}
                    isRightSide={false}
                    malfunctionActive={pose.glitchJitter.active}
                    facing={facing}
                  />
                </g>
              </g>
            );

            const rightLegElement = (
              <g
                key="rightLeg"
                transform={`translate(${hipRRel.x}, ${hipRRel.y}) rotate(${rightLegRot})`}
                className="cursor-pointer"
                onClick={(e) => handleSlotClick('rightLeg', e)}
                filter={creature.slots.rightLeg.quality === 'Malfunctioning' ? `url(#glitch_${filterUniqueId})` : undefined}
              >
                <SocketCollar x={0} y={0} brand={creature.slots.rightLeg.brand} cyberOrganic={creature.slots.rightLeg.cyberOrganic} />
                <ThighSvg
                  brand={creature.slots.rightLeg.brand}
                  quality={creature.slots.rightLeg.quality}
                  cyberOrganic={creature.slots.rightLeg.cyberOrganic}
                  archetype={creature.archetype}
                  selected={selectedSlot === 'rightLeg'}
                  isRightSide={true}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
                <g transform={`translate(0, ${LIMB_STANDARDS.thighLength}) rotate(${rightCalfRot})`}>
                  <CalfSvg
                    brand={creature.slots.rightLeg.brand}
                    quality={creature.slots.rightLeg.quality}
                    cyberOrganic={creature.slots.rightLeg.cyberOrganic}
                    archetype={creature.archetype}
                    selected={selectedSlot === 'rightLeg'}
                    isRightSide={true}
                    malfunctionActive={pose.glitchJitter.active}
                    facing={facing}
                  />
                </g>
              </g>
            );

            const leftArmElement = (
              <g
                key="leftArm"
                transform={`translate(${shoulderLRel.x}, ${shoulderLRel.y}) rotate(${leftArmRot})`}
                className="cursor-pointer"
                onClick={(e) => handleSlotClick('leftArm', e)}
                filter={creature.slots.leftArm.quality === 'Malfunctioning' ? `url(#glitch_${filterUniqueId})` : undefined}
              >
                <SocketCollar x={0} y={0} brand={creature.slots.leftArm.brand} cyberOrganic={creature.slots.leftArm.cyberOrganic} />
                <UpperArmSvg
                  brand={creature.slots.leftArm.brand}
                  quality={creature.slots.leftArm.quality}
                  cyberOrganic={creature.slots.leftArm.cyberOrganic}
                  archetype={creature.archetype}
                  selected={selectedSlot === 'leftArm'}
                  isRightSide={false}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
                <g transform={`translate(0, ${LIMB_STANDARDS.upperArmLength}) rotate(${leftForearmRot})`}>
                  <ForearmSvg
                    brand={creature.slots.leftArm.brand}
                    quality={creature.slots.leftArm.quality}
                    cyberOrganic={creature.slots.leftArm.cyberOrganic}
                    archetype={creature.archetype}
                    selected={selectedSlot === 'leftArm'}
                    isRightSide={false}
                    malfunctionActive={pose.glitchJitter.active}
                    facing={facing}
                  />
                </g>
              </g>
            );

            const rightArmElement = (
              <g
                key="rightArm"
                transform={`translate(${shoulderRRel.x}, ${shoulderRRel.y}) rotate(${rightArmRot})`}
                className="cursor-pointer"
                onClick={(e) => handleSlotClick('rightArm', e)}
                filter={creature.slots.rightArm.quality === 'Malfunctioning' ? `url(#glitch_${filterUniqueId})` : undefined}
              >
                <SocketCollar x={0} y={0} brand={creature.slots.rightArm.brand} cyberOrganic={creature.slots.rightArm.cyberOrganic} />
                <UpperArmSvg
                  brand={creature.slots.rightArm.brand}
                  quality={creature.slots.rightArm.quality}
                  cyberOrganic={creature.slots.rightArm.cyberOrganic}
                  archetype={creature.archetype}
                  selected={selectedSlot === 'rightArm'}
                  isRightSide={true}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
                <g transform={`translate(0, ${LIMB_STANDARDS.upperArmLength}) rotate(${rightForearmRot})`}>
                  <ForearmSvg
                    brand={creature.slots.rightArm.brand}
                    quality={creature.slots.rightArm.quality}
                    cyberOrganic={creature.slots.rightArm.cyberOrganic}
                    archetype={creature.archetype}
                    selected={selectedSlot === 'rightArm'}
                    isRightSide={true}
                    malfunctionActive={pose.glitchJitter.active}
                    facing={facing}
                  />
                </g>
              </g>
            );

            const chestElement = (
              <g
                key="chest"
                className="cursor-pointer"
                onClick={(e) => handleSlotClick('chest', e)}
                filter={creature.slots.chest.quality === 'Malfunctioning' ? `url(#glitch_${filterUniqueId})` : undefined}
              >
                <ChestSvg
                  brand={creature.slots.chest.brand}
                  quality={creature.slots.chest.quality}
                  cyberOrganic={creature.slots.chest.cyberOrganic}
                  archetype={creature.archetype}
                  selected={selectedSlot === 'chest'}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
              </g>
            );

            const headElement = (
              <g
                key="head"
                transform={`translate(${neckRel.x}, ${neckRel.y}) rotate(${headRot})`}
                className="cursor-pointer"
                onClick={(e) => handleSlotClick('head', e)}
                filter={creature.slots.head.quality === 'Malfunctioning' ? `url(#glitch_${filterUniqueId})` : undefined}
              >
                <SocketCollar x={0} y={0} radius={11} brand={creature.slots.head.brand} cyberOrganic={creature.slots.head.cyberOrganic} />
                <HeadSvg
                  brand={creature.slots.head.brand}
                  quality={creature.slots.head.quality}
                  cyberOrganic={creature.slots.head.cyberOrganic}
                  archetype={creature.archetype}
                  selected={selectedSlot === 'head'}
                  malfunctionActive={pose.glitchJitter.active}
                  facing={facing}
                />
              </g>
            );

            {/* =================================================================
                HIERARCHICAL DRAW STACK CONDITIONAL ON FACING DIRECTION:
                - side_right: Left limbs are FAR (under torso), Right limbs are NEAR (on top)
                - side_left:  In mirrored X space, Right limbs are FAR (under torso), Left limbs are NEAR (on top)
                - front:      Legs behind chest, Chest, Head, Arms in front
                - back:       Legs, Arms, Chest, Head, Tail in foreground
               ================================================================= */}
            if (facing === 'side_right') {
              return (
                <>
                  {tailBehindElement}
                  {leftLegElement}
                  {leftArmElement}
                  {chestElement}
                  {headElement}
                  {rightLegElement}
                  {rightArmElement}
                </>
              );
            }

            if (facing === 'side_left') {
              return (
                <>
                  {tailBehindElement}
                  {rightLegElement}
                  {rightArmElement}
                  {chestElement}
                  {headElement}
                  {leftLegElement}
                  {leftArmElement}
                </>
              );
            }

            if (facing === 'front') {
              return (
                <>
                  {tailBehindElement}
                  {leftLegElement}
                  {rightLegElement}
                  {chestElement}
                  {headElement}
                  {leftArmElement}
                  {rightArmElement}
                </>
              );
            }

            // 'back' dorsal retreat view
            return (
              <>
                {leftLegElement}
                {rightLegElement}
                {leftArmElement}
                {rightArmElement}
                {chestElement}
                {headElement}
                {tailForegroundElement}
              </>
            );
          })()}

          {/* =================================================================
              DEBUG OVERLAYS: Sockets & Bone Skeleton
             ================================================================= */}
          {showSockets && (
            <g className="pointer-events-none">
              <circle cx={neckRel.x} cy={neckRel.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <text x={neckRel.x + 8} y={neckRel.y} fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">NECK</text>
              <circle cx={shoulderLRel.x} cy={shoulderLRel.y} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
              <text x={shoulderLRel.x - 45} y={shoulderLRel.y - 4} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">L_SHL</text>
              <circle cx={shoulderRRel.x} cy={shoulderRRel.y} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
              <text x={shoulderRRel.x + 8} y={shoulderRRel.y - 4} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">R_SHL</text>
              <circle cx={hipLRel.x} cy={hipLRel.y} r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
              <text x={hipLRel.x - 45} y={hipLRel.y + 12} fill="#a855f7" fontSize="9" fontWeight="bold" fontFamily="monospace">L_HIP</text>
              <circle cx={hipRRel.x} cy={hipRRel.y} r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
              <text x={hipRRel.x + 8} y={hipRRel.y + 12} fill="#a855f7" fontSize="9" fontWeight="bold" fontFamily="monospace">R_HIP</text>
              {tailRel && (
                <>
                  <circle cx={tailRel.x} cy={tailRel.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <text x={tailRel.x + 8} y={tailRel.y - 4} fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">TAIL</text>
                </>
              )}
              <circle cx="0" cy="0" r="4" fill="#fbbf24" stroke="#000" strokeWidth="1" />
              <circle cx="0" cy="0" r="16" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" />
            </g>
          )}

          {showSkeleton && (
            <g className="pointer-events-none" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="3 2" opacity="0.85">
              <line x1="0" y1="0" x2={neckRel.x} y2={neckRel.y} />
              <line x1="0" y1="0" x2={shoulderLRel.x} y2={shoulderLRel.y} />
              <line x1="0" y1="0" x2={shoulderRRel.x} y2={shoulderRRel.y} />
              <line x1="0" y1="0" x2={hipLRel.x} y2={hipLRel.y} />
              <line x1="0" y1="0" x2={hipRRel.x} y2={hipRRel.y} />
              {tailRel && <line x1="0" y1="0" x2={tailRel.x} y2={tailRel.y} />}
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};
