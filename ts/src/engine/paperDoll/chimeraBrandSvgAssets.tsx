import React from 'react';
import { Brand, QualityTier, BodyArchetype, FacingDirection } from './chimeraTypes';
import { getPartColors, RefurbishedOverlay, MalfunctionSparkOverlay, BrandNewSheenOverlay } from './chimeraSvgPartDrawers';
import { LIMB_STANDARDS } from './chimeraSockets';

export interface PartProps {
  brand: Brand;
  quality: QualityTier;
  cyberOrganic: number;
  archetype?: BodyArchetype;
  selected?: boolean;
  filterId?: string;
  isRightSide?: boolean;
  malfunctionActive?: boolean;
  facing?: FacingDirection;
}

/**
 * ============================================================================
 * HEADS BY BRAND, ARCHETYPE & FACING
 * Attachment origin: Base of neck/chin at (0, 0)
 * ============================================================================
 */
export const HeadSvg: React.FC<PartProps> = ({
  brand,
  quality,
  cyberOrganic,
  archetype = 'humanoid',
  selected,
  malfunctionActive,
  facing = 'side_right',
}) => {
  const { primary, secondary, accent, glow, base } = getPartColors(brand, cyberOrganic);
  const isAvian = archetype === 'avian_raptor';
  const isQuad = archetype === 'quadruped';
  const isBack = facing === 'back';

  return (
    <g className={`transition-all duration-150 ${selected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}`}>
      {/* =======================================================================
          1. BACK-OF-HEAD GEOMETRY (Rear Occipital Cranium, Nape Plates, Spine Connector)
          CRITICAL: NO eyes, NO mouth/beak openings, NO front visor glass!
         ======================================================================= */}
      {isBack && (
        <g>
          {/* Base Occipital Cranium Skull Vault */}
          <path
            d={
              isAvian
                ? 'M -18,-8 L -32,-48 L -16,-62 L 0,-68 L 16,-62 L 32,-48 L 18,-8 L 8,4 L -8,4 Z'
                : isQuad
                ? 'M -22,-6 L -26,-45 L -14,-56 L 14,-56 L 26,-45 L 22,-6 L 12,6 L -12,6 Z'
                : 'M -24,-10 L -30,-48 L -18,-64 L 0,-68 L 18,-64 L 30,-48 L 24,-10 L 14,4 L -14,4 Z'
            }
            fill={base}
            stroke={primary}
            strokeWidth="2.8"
          />

          {/* Central Cervical Spinal Cable & Nape Vertebrae Column */}
          <rect x="-6" y="-32" width="12" height="36" rx="3" fill="#080c14" stroke={secondary} strokeWidth="1.5" />
          <line x1="0" y1="-30" x2="0" y2="2" stroke={glow} strokeWidth="2.5" strokeDasharray="3 2" />
          <polygon points="0,-28 -4,-22 4,-22" fill={accent} />
          <polygon points="0,-16 -4,-10 4,-10" fill={accent} />
          <polygon points="0,-4 -4,2 4,2" fill={accent} />

          {/* Brand-Specific Rear Skull Architecture */}
          {brand === 'Trueflame' && (
            <g>
              {/* Swept Obsidian & Molten Dorsal Crest Ridges radiating backward */}
              <path d="M -16,-34 L -38,-56 L -20,-48 L 0,-74 L 20,-48 L 38,-56 L 16,-34 Z" fill={secondary} stroke={primary} strokeWidth="2" />
              {/* Thermal Exhaust Vents */}
              <line x1="-12" y1="-44" x2="-28" y2="-62" stroke={glow} strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 4px #ff4500)" />
              <line x1="12" y1="-44" x2="28" y2="-62" stroke={glow} strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 4px #ff4500)" />
              <rect x="-10" y="-52" width="20" height="8" rx="2" fill="#180404" stroke={accent} strokeWidth="1.5" />
            </g>
          )}

          {brand === 'Icevault' && (
            <g>
              {/* Heavy Reinforced Titanium Rear Helmet Shell with Cryo Heat-Sink Louvers */}
              <rect x="-24" y="-52" width="48" height="28" rx="4" fill={secondary} stroke={accent} strokeWidth="2" />
              <line x1="-20" y1="-46" x2="20" y2="-46" stroke={glow} strokeWidth="2.5" />
              <line x1="-20" y1="-40" x2="20" y2="-40" stroke={glow} strokeWidth="2.5" />
              <line x1="-20" y1="-34" x2="20" y2="-34" stroke={glow} strokeWidth="2.5" />
              {/* Thick Hydraulic Collar Clamp */}
              <path d="M -26,-12 L -20,-4 L 20,-4 L 26,-12 Z" fill="#030712" stroke={primary} strokeWidth="2" />
            </g>
          )}

          {brand === 'Quicksilver' && (
            <g>
              {/* Aerodynamic Carbon Fiber Rear Cowl with Twin Trailing Slipstream Vanes */}
              <path d="M -12,-38 L -32,-66 L -8,-52 L 0,-76 L 8,-52 L 32,-66 L 12,-38 Z" fill={primary} stroke={secondary} strokeWidth="1.8" />
              {/* High-speed optic telemetry link module */}
              <circle cx="0" cy="-42" r="5" fill="#021a1a" stroke={accent} strokeWidth="1.5" />
              <circle cx="0" cy="-42" r="2.5" fill={glow} filter="drop-shadow(0 0 4px #00f5d4)" />
              <line x1="-18" y1="-48" x2="-28" y2="-72" stroke={secondary} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="18" y1="-48" x2="28" y2="-72" stroke={secondary} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {brand === 'Prismworks' && (
            <g>
              {/* Geometric Faceted Crystal Back-Head Lattice */}
              <polygon points="0,-72 26,-48 18,-18 0,-10 -18,-18 -26,-48" fill={secondary} stroke={accent} strokeWidth="2" />
              <polygon points="0,-72 12,-44 0,-34 -12,-44" fill={primary} stroke={accent} strokeWidth="1.2" />
              <polygon points="0,-34 10,-20 0,-14 -10,-20" fill={glow} opacity="0.9" filter="drop-shadow(0 0 3px #f72585)" />
            </g>
          )}

          {brand === 'Mirefaith' && (
            <g>
              {/* Organic Chitin Carapace Skull Dome with Dorsal Bio-Spines */}
              <path d="M -22,-14 Q -34,-44 -16,-64 Q 0,-70 16,-64 Q 34,-44 22,-14 Z" fill={secondary} stroke={primary} strokeWidth="2.5" />
              <line x1="-14" y1="-48" x2="-28" y2="-66" stroke={accent} strokeWidth="3" strokeLinecap="round" />
              <line x1="14" y1="-48" x2="28" y2="-66" stroke={accent} strokeWidth="3" strokeLinecap="round" />
              {/* Bio-luminescent neural capillary nodes along dorsal midline */}
              <circle cx="0" cy="-56" r="3.5" fill={glow} filter="drop-shadow(0 0 4px #70e000)" />
              <circle cx="0" cy="-44" r="3" fill={glow} filter="drop-shadow(0 0 4px #70e000)" />
              <circle cx="0" cy="-32" r="2.5" fill={glow} filter="drop-shadow(0 0 4px #70e000)" />
            </g>
          )}

          {brand === 'Tidalcapital' && (
            <g>
              {/* Hydrodynamic Cowl with Rear Marine Baffles */}
              <path d="M -20,-12 C -32,-36 -22,-62 0,-70 C 22,-62 32,-36 20,-12 Z" fill={secondary} stroke={primary} strokeWidth="2.5" />
              <path d="M -12,-40 C 0,-56 0,-56 12,-40 L 8,-20 L -8,-20 Z" fill="#011936" stroke={accent} strokeWidth="1.5" />
              <circle cx="0" cy="-30" r="4" fill={glow} filter="drop-shadow(0 0 4px #48cae4)" />
            </g>
          )}
        </g>
      )}

      {/* =======================================================================
          2. FRONTAL & PROFILE HEAD GEOMETRY
         ======================================================================= */}
      {!isBack && (
        <g>
          {/* AVIAN RAPTOR HEADS */}
          {isAvian && (
            <g>
              <path
                d="M -16,-12 L -34,-48 L -14,-36 L 0,-62 L 14,-36 L 34,-48 L 16,-12 L 8,4 L 0,16 L -8,4 Z"
                fill={base}
                stroke={primary}
                strokeWidth="2.5"
              />
              {/* Hooked Beak */}
              <path d="M -10,0 L 0,18 L 10,0 L 4,-8 L -4,-8 Z" fill={secondary} stroke={accent} strokeWidth="1.5" />
              <polygon points="0,22 -3,14 3,14" fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
              {/* Molten Raptor Eyes */}
              <polygon points="-12,-16 -4,-13 -10,-8" fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
              <polygon points="12,-16 4,-13 10,-8" fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
              {/* Thermal crest exhaust quills */}
              <line x1="-20" y1="-32" x2="-38" y2="-44" stroke={glow} strokeWidth="2" strokeLinecap="round" />
              <line x1="20" y1="-32" x2="38" y2="-44" stroke={glow} strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* QUADRUPED HEADS */}
          {isQuad && (
            <g>
              <path d="M -18,-10 L -24,-38 L -14,-48 L 14,-48 L 24,-38 L 18,-10 L 10,14 L -10,14 Z" fill={base} stroke={primary} strokeWidth="2.5" />
              <polygon points="-8,14 0,22 8,14 0,8" fill={secondary} stroke={accent} strokeWidth="1.2" />
              <circle cx="-9" cy="-16" r="2.5" fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
              <circle cx="9" cy="-16" r="2.5" fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
              <polygon points="-16,-44 -28,-62 -8,-50" fill={secondary} stroke={accent} strokeWidth="1.5" />
              <polygon points="16,-44 28,-62 8,-50" fill={secondary} stroke={accent} strokeWidth="1.5" />
            </g>
          )}

          {/* HUMANOID & BRUTE HEADS */}
          {!isAvian && !isQuad && (
            <g>
              {brand === 'Trueflame' && (
                <g>
                  <path
                    d="M -26,-20 L -38,-55 L -18,-42 L 0,-68 L 18,-42 L 38,-55 L 26,-20 L 22,5 L -22,5 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.5"
                  />
                  <path
                    d="M -16,-12 L -24,-38 L -10,-28 L 0,-48 L 10,-28 L 24,-38 L 16,-12 L 12,2 L -12,2 Z"
                    fill={secondary}
                    stroke={accent}
                    strokeWidth="1.5"
                  />
                  <polygon points="-14,-16 -6,-14 -12,-8" fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
                  <polygon points="14,-16 6,-14 12,-8" fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
                </g>
              )}

              {brand === 'Icevault' && (
                <g>
                  <path
                    d="M -28,-10 L -28,-45 L -18,-58 L 18,-58 L 28,-45 L 28,-10 L 20,6 L -20,6 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="3"
                  />
                  <path d="M -20,-35 L -15,-52 L 15,-52 L 20,-35 L 0,-42 Z" fill={secondary} stroke={accent} strokeWidth="1.5" />
                  <rect x="-20" y="-24" width="40" height="7" rx="2" fill="#030712" stroke={accent} strokeWidth="1.2" />
                  <rect x="-16" y="-22" width="32" height="3" fill={glow} filter="drop-shadow(0 0 5px #00e5ff)" />
                </g>
              )}

              {brand === 'Quicksilver' && (
                <g>
                  <path
                    d="M -20,-5 L -34,-48 L -12,-36 L 0,-62 L 12,-36 L 34,-48 L 20,-5 L 14,5 L -14,5 Z"
                    fill={base}
                    stroke={secondary}
                    strokeWidth="2"
                  />
                  <path d="M -12,-8 L -18,-35 L 0,-46 L 18,-35 L 12,-8 L 0,0 Z" fill={primary} stroke={accent} strokeWidth="1.2" />
                  <path d="M -16,-22 Q 0,-30 16,-22 Q 0,-15 -16,-22" fill={glow} filter="drop-shadow(0 0 4px #00f5d4)" />
                </g>
              )}

              {brand === 'Prismworks' && (
                <g>
                  <polygon points="0,-64 22,-44 26,-15 16,5 -16,5 -26,-15 -22,-44" fill={base} stroke={primary} strokeWidth="2.5" />
                  <polygon points="0,-64 12,-40 0,-32 -12,-40" fill={secondary} stroke={accent} strokeWidth="1" />
                  <circle cx="-9" cy="-18" r="3.5" fill="#111" stroke={accent} strokeWidth="1" />
                  <circle cx="-9" cy="-18" r="1.5" fill={glow} filter="drop-shadow(0 0 3px #f72585)" />
                  <circle cx="9" cy="-18" r="3.5" fill="#111" stroke={accent} strokeWidth="1" />
                  <circle cx="9" cy="-18" r="1.5" fill={glow} filter="drop-shadow(0 0 3px #f72585)" />
                </g>
              )}

              {brand === 'Mirefaith' && (
                <g>
                  <path
                    d="M -24,-5 Q -32,-35 -14,-56 Q 0,-62 14,-56 Q 32,-35 24,-5 L 18,6 L -18,6 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.5"
                  />
                  <circle cx="-14" cy="-36" r="4" fill={accent} opacity="0.85" />
                  <circle cx="12" cy="-38" r="3.5" fill={accent} opacity="0.85" />
                  <circle cx="-12" cy="-16" r="2.5" fill={glow} />
                  <circle cx="12" cy="-16" r="2.5" fill={glow} />
                </g>
              )}

              {brand === 'Tidalcapital' && (
                <g>
                  <path
                    d="M -22,-6 C -35,-30 -25,-55 0,-64 C 25,-55 35,-30 22,-6 L 15,6 L -15,6 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.5"
                  />
                  <circle cx="-8" cy="-16" r="3" fill={glow} filter="drop-shadow(0 0 4px #48cae4)" />
                  <circle cx="8" cy="-16" r="3" fill={glow} filter="drop-shadow(0 0 4px #48cae4)" />
                </g>
              )}
            </g>
          )}
        </g>
      )}

      {/* Quality Tier Overlays */}
      {quality === 'Brand New' && <BrandNewSheenOverlay />}
      {quality === 'Refurbished' && <RefurbishedOverlay />}
      {quality === 'Malfunctioning' && <MalfunctionSparkOverlay active={malfunctionActive} />}
    </g>
  );
};

/**
 * ============================================================================
 * CHEST / TORSO BY BRAND, ARCHETYPE & FACING
 * Attachment origin: Torso center (0, 0)
 * ============================================================================
 */
export const ChestSvg: React.FC<PartProps> = ({
  brand,
  quality,
  cyberOrganic,
  archetype = 'humanoid',
  selected,
  malfunctionActive,
  facing = 'side_right',
}) => {
  const { primary, secondary, accent, glow, base } = getPartColors(brand, cyberOrganic);
  const isAvian = archetype === 'avian_raptor';
  const isQuad = archetype === 'quadruped';
  const isBrute = archetype === 'beast_brute';
  const isBack = facing === 'back';
  const isFront = facing === 'front';
  const isSide = facing === 'side_right' || facing === 'side_left';

  return (
    <g className={`transition-all duration-150 ${selected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}`}>
      {/* =======================================================================
          1. BACK-OF-TORSO GEOMETRY (Scapular Shoulder Blades, Spine Column, Exhaust Vents)
          CRITICAL: NO front pectoral plates, NO front glowing reactor core!
         ======================================================================= */}
      {isBack && (
        <g>
          {/* Main Dorsal Torso Silhouetted Base */}
          <path
            d={
              isAvian
                ? 'M -18,-72 L 18,-72 L 54,-45 L 40,12 L 22,54 L -22,54 L -40,12 L -54,-45 Z'
                : isQuad
                ? 'M -40,-60 L 40,-60 L 44,-10 L 34,45 L -34,45 L -44,-10 Z'
                : isBrute
                ? 'M -26,-76 L 26,-76 L 68,-42 L 52,18 L 32,60 L -32,60 L -52,18 L -68,-42 Z'
                : 'M -22,-74 L 22,-74 L 58,-44 L 46,16 L 28,58 L -28,58 L -46,16 L -58,-44 Z'
            }
            fill={base}
            stroke={primary}
            strokeWidth="3"
          />

          {/* Bilateral Scapular Armor Plates (Left & Right Shoulder Blades) */}
          <polygon points="-16,-62 -48,-42 -36,-12 -12,-32" fill={secondary} stroke={accent} strokeWidth="1.8" />
          <polygon points="16,-62 48,-42 36,-12 12,-32" fill={secondary} stroke={accent} strokeWidth="1.8" />

          {/* Central Articulated Spinal Column */}
          <rect x="-8" y="-66" width="16" height="118" rx="4" fill="#0a0f1d" stroke={primary} strokeWidth="1.8" />
          <line x1="0" y1="-62" x2="0" y2="48" stroke={glow} strokeWidth="2.8" strokeDasharray="5 3" />

          {/* Vertebrae Segment Plates */}
          {[-52, -34, -16, 2, 20, 38].map((y) => (
            <polygon key={y} points={`0,${y - 6} -6,${y} 6,${y}`} fill={accent} />
          ))}

          {/* Dorsal Lumbar Armor Band */}
          <path d="M -34,32 L -18,52 L 18,52 L 34,32 Z" fill={secondary} stroke={accent} strokeWidth="1.5" />

          {/* Brand-Specific Dorsal Features */}
          {brand === 'Trueflame' && (
            <g>
              <rect x="-38" y="-56" width="12" height="24" rx="3" fill="#180404" stroke={accent} strokeWidth="1.5" />
              <rect x="26" y="-56" width="12" height="24" rx="3" fill="#180404" stroke={accent} strokeWidth="1.5" />
              <line x1="-32" y1="-52" x2="-32" y2="-36" stroke={glow} strokeWidth="2.5" filter="drop-shadow(0 0 4px #ff4500)" />
              <line x1="32" y1="-52" x2="32" y2="-36" stroke={glow} strokeWidth="2.5" filter="drop-shadow(0 0 4px #ff4500)" />
            </g>
          )}

          {brand === 'Icevault' && (
            <g>
              <rect x="-42" y="-48" width="84" height="26" rx="4" fill="#030712" stroke={accent} strokeWidth="1.8" />
              <line x1="-36" y1="-35" x2="36" y2="-35" stroke={glow} strokeWidth="3" filter="drop-shadow(0 0 5px #00e5ff)" />
            </g>
          )}

          {brand === 'Quicksilver' && (
            <g>
              <line x1="-28" y1="-54" x2="-22" y2="12" stroke={accent} strokeWidth="2.5" />
              <line x1="28" y1="-54" x2="22" y2="12" stroke={accent} strokeWidth="2.5" />
            </g>
          )}
        </g>
      )}

      {/* =======================================================================
          2. FRONT-VIEW TORSO GEOMETRY (Wide Bilateral Pectorals & Centered Core)
         ======================================================================= */}
      {isFront && (
        <g>
          {/* AVIAN RAPTOR FRONTAL CHEST */}
          {isAvian && (
            <g>
              <path
                d="M -16,-68 Q 0,-74 16,-68 L 50,-42 L 36,10 L 0,56 L -36,10 L -50,-42 Z"
                fill={base}
                stroke={primary}
                strokeWidth="2.8"
              />
              <polygon points="0,-60 22,-20 0,44 -22,-20" fill={secondary} stroke={accent} strokeWidth="1.8" />
              <line x1="-38" y1="-32" x2="-14" y2="-12" stroke={accent} strokeWidth="2.5" />
              <line x1="38" y1="-32" x2="14" y2="-12" stroke={accent} strokeWidth="2.5" />
              <circle cx="0" cy="-6" r="9" fill="#0b0f19" stroke={accent} strokeWidth="1.5" />
              <circle cx="0" cy="-6" r="5" fill={glow} filter="drop-shadow(0 0 6px #ff4500)" />
            </g>
          )}

          {/* QUADRUPED FRONTAL CHEST */}
          {isQuad && (
            <g>
              <path
                d="M -40,-60 L 40,-60 L 46,-10 L 36,45 L -36,45 L -46,-10 Z"
                fill={base}
                stroke={primary}
                strokeWidth="3"
              />
              <rect x="-34" y="-48" width="68" height="24" rx="4" fill={secondary} stroke={accent} strokeWidth="1.5" />
              <circle cx="0" cy="-8" r="11" fill="#0f172a" stroke={accent} strokeWidth="2" />
              <circle cx="0" cy="-8" r="5" fill={glow} />
              <polygon points="-30,10 -15,35 15,35 30,10" fill={secondary} stroke={accent} strokeWidth="1.2" />
            </g>
          )}

          {/* BEAST BRUTE FRONTAL CHEST (Extra Broad Width) */}
          {isBrute && (
            <g>
              <path
                d="M -24,-76 L 24,-76 L 68,-44 L 56,18 L 36,60 L -36,60 L -56,18 L -68,-44 Z"
                fill={base}
                stroke={primary}
                strokeWidth="3.2"
              />
              <polygon points="-12,-66 -54,-38 -28,14 0,-18" fill={secondary} stroke={accent} strokeWidth="2" />
              <polygon points="12,-66 54,-38 28,14 0,-18" fill={secondary} stroke={accent} strokeWidth="2" />
              <rect x="-18" y="-12" width="36" height="28" rx="4" fill="#0a0f1d" stroke={accent} strokeWidth="1.8" />
              <circle cx="0" cy="2" r="7" fill={glow} filter="drop-shadow(0 0 6px #ff4500)" />
            </g>
          )}

          {/* HUMANOID FRONTAL CHEST */}
          {!isAvian && !isQuad && !isBrute && (
            <g>
              {brand === 'Trueflame' && (
                <g>
                  <path
                    d="M -18,-72 L 18,-72 L 56,-45 L 48,15 L 28,58 L -28,58 L -48,15 L -56,-45 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.8"
                  />
                  <polygon points="0,-64 36,-32 24,18 0,44 -24,18 -36,-32" fill={secondary} stroke={accent} strokeWidth="1.8" />
                  <polygon points="0,-24 16,-8 0,16 -16,-8" fill="#180404" stroke={primary} strokeWidth="2" />
                  <polygon points="0,-18 10,-6 0,10 -10,-6" fill={glow} filter="drop-shadow(0 0 6px #ff4500)" />
                </g>
              )}

              {brand === 'Icevault' && (
                <g>
                  <rect x="-56" y="-62" width="112" height="118" rx="10" fill={base} stroke={primary} strokeWidth="3.2" />
                  <rect x="-42" y="-48" width="84" height="42" rx="6" fill={secondary} stroke={accent} strokeWidth="1.8" />
                  <line x1="-36" y1="-27" x2="36" y2="-27" stroke={glow} strokeWidth="3" filter="drop-shadow(0 0 6px #00e5ff)" />
                </g>
              )}

              {brand !== 'Trueflame' && brand !== 'Icevault' && (
                <g>
                  <path
                    d="M -18,-72 L 18,-72 L 52,-44 L 42,15 L 26,58 L -26,58 L -42,15 L -52,-44 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.6"
                  />
                  <polygon points="0,-60 30,-30 20,20 0,40 -20,20 -30,-30" fill={secondary} stroke={accent} strokeWidth="1.5" />
                  <circle cx="0" cy="-6" r="12" fill="#0f172a" stroke={accent} strokeWidth="2" />
                  <circle cx="0" cy="-6" r="6" fill={glow} />
                </g>
              )}
            </g>
          )}
        </g>
      )}

      {/* =======================================================================
          3. SIDE-VIEW (PROFILE) TORSO GEOMETRY
          CRITICAL: Genuine narrower anatomical depth and dedicated profile silhouette!
         ======================================================================= */}
      {isSide && (
        <g>
          {/* AVIAN RAPTOR PROFILE: Sharp Keel / Sternum Blade Protrusion */}
          {isAvian && (
            <g>
              {/* Narrow Aerodynamic Keel Silhouette: ~48px depth */}
              <path
                d="M -8,-66 Q -22,-35 -18,12 L -12,48 L 10,48 L 16,20 L 26,-15 L 22,-48 L 8,-66 Z"
                fill={base}
                stroke={primary}
                strokeWidth="2.8"
              />
              {/* Sharp Carina Keel Plate */}
              <polygon points="12,-44 26,-15 14,20 4,-30" fill={secondary} stroke={accent} strokeWidth="1.6" />
              {/* Forward-facing Raptor Core */}
              <circle cx="12" cy="-10" r="7" fill="#0b0f19" stroke={accent} strokeWidth="1.5" />
              <circle cx="12" cy="-10" r="4" fill={glow} filter="drop-shadow(0 0 5px #ff4500)" />
              {/* Aerodynamic Flank Ribs */}
              <line x1="-12" y1="-28" x2="6" y2="-18" stroke={accent} strokeWidth="2" />
              <line x1="-10" y1="0" x2="8" y2="8" stroke={accent} strokeWidth="2" />
            </g>
          )}

          {/* QUADRUPED PROFILE: Long Barrel Chassis */}
          {isQuad && (
            <g>
              <path
                d="M -55,-24 Q 0,-38 60,-20 L 68,-6 L 55,24 Q 10,20 -20,28 L -46,24 L -60,-2 Z"
                fill={base}
                stroke={primary}
                strokeWidth="3"
              />
              <rect x="-40" y="-14" width="75" height="24" rx="4" fill={secondary} stroke={accent} strokeWidth="1.5" />
              {/* Flank Core Module */}
              <circle cx="-32" cy="2" r="11" fill="#0f172a" stroke={accent} strokeWidth="2" />
              <circle cx="-32" cy="2" r="5" fill={glow} />
              <circle cx="38" cy="2" r="9" fill="#0f172a" stroke={accent} strokeWidth="1.5" />
            </g>
          )}

          {/* BEAST BRUTE PROFILE: Massive Hunched Torso */}
          {isBrute && (
            <g>
              {/* Heavy Hunched Profile: ~70px depth */}
              <path
                d="M 12,-52 L -12,-66 Q -36,-42 -32,8 L -18,58 L 16,58 L 22,24 Q 34,-6 32,-30 Z"
                fill={base}
                stroke={primary}
                strokeWidth="3.2"
              />
              {/* Heavy Chest Slab & Trapezoid Armor */}
              <polygon points="12,-48 30,-28 18,18 2,-20" fill={secondary} stroke={accent} strokeWidth="2" />
              <polygon points="-8,-60 -28,-36 -24,4 -4,-28" fill={secondary} stroke={accent} strokeWidth="1.8" />
              {/* Forward Brute Core */}
              <circle cx="16" cy="-8" r="9" fill="#0a0f1d" stroke={accent} strokeWidth="1.8" />
              <circle cx="16" cy="-8" r="5" fill={glow} filter="drop-shadow(0 0 5px #ff4500)" />
            </g>
          )}

          {/* HUMANOID PROFILE: Distinct Narrow Torso Depth (~52px vs 112px front width) */}
          {!isAvian && !isQuad && !isBrute && (
            <g>
              {brand === 'Trueflame' && (
                <g>
                  {/* Trueflame Angular Flame Prow Profile */}
                  <path
                    d="M 6,-68 Q -24,-35 -20,12 L -14,56 L 12,56 L 14,24 Q 26,-8 22,-38 L 8,-68 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.8"
                  />
                  {/* Anterior Thermal Prow Plate */}
                  <polygon points="6,-40 22,-18 12,22 2,-22" fill={secondary} stroke={accent} strokeWidth="1.8" />
                  {/* Forward-facing Thermal Reactor Core */}
                  <polygon points="14,-14 20,-4 14,6 8,-4" fill="#180404" stroke={primary} strokeWidth="1.5" />
                  <polygon points="14,-10 18,-4 14,2 10,-4" fill={glow} filter="drop-shadow(0 0 5px #ff4500)" />
                  {/* Dorsal Spine Heat Exhaust Rib */}
                  <line x1="-16" y1="-32" x2="-8" y2="-20" stroke={accent} strokeWidth="2" />
                </g>
              )}

              {brand === 'Icevault' && (
                <g>
                  {/* Icevault Heavy Modular Cryo Armor Profile */}
                  <path
                    d="M 6,-64 L -22,-60 L -22,54 L 14,54 L 18,20 Q 24,-10 20,-40 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="3.2"
                  />
                  <rect x="-14" y="-44" width="30" height="42" rx="4" fill={secondary} stroke={accent} strokeWidth="1.8" />
                  <line x1="-6" y1="-23" x2="16" y2="-23" stroke={glow} strokeWidth="2.8" filter="drop-shadow(0 0 5px #00e5ff)" />
                  <rect x="-20" y="10" width="30" height="34" rx="3" fill="#030712" stroke={accent} strokeWidth="1.5" />
                </g>
              )}

              {brand === 'Quicksilver' && (
                <g>
                  {/* Quicksilver Aerodynamic Slipstream Profile */}
                  <path
                    d="M 4,-66 Q -22,-35 -18,12 L -14,56 L 12,56 L 14,24 Q 24,-6 20,-38 L 6,-66 Z"
                    fill={base}
                    stroke={secondary}
                    strokeWidth="2.4"
                  />
                  <path d="M 2,-42 Q 18,-18 10,22 Q 0,-15 2,-42" fill={primary} stroke={accent} strokeWidth="1.5" />
                  <line x1="8" y1="-30" x2="16" y2="10" stroke={glow} strokeWidth="2.5" filter="drop-shadow(0 0 4px #00f5d4)" />
                </g>
              )}

              {brand === 'Prismworks' && (
                <g>
                  {/* Prismworks Faceted Polygonal Profile */}
                  <polygon points="6,-64 22,-32 18,16 10,54 -14,54 -20,10 -16,-40" fill={base} stroke={primary} strokeWidth="2.6" />
                  <polygon points="4,-42 16,-16 8,16 0,-20" fill={secondary} stroke={accent} strokeWidth="1.5" />
                  <circle cx="10" cy="-6" r="6" fill="#111" stroke={accent} strokeWidth="1" />
                  <circle cx="10" cy="-6" r="3" fill={glow} filter="drop-shadow(0 0 4px #f72585)" />
                </g>
              )}

              {brand === 'Mirefaith' && (
                <g>
                  {/* Mirefaith Organic Chitinous Profile Carapace */}
                  <path
                    d="M 4,-66 Q -24,-30 -18,14 L -12,56 L 12,56 L 14,24 Q 24,-5 18,-38 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.5"
                  />
                  <path d="M -12,-30 Q 8,-20 14,-8" stroke={accent} strokeWidth="2.5" fill="none" />
                  <path d="M -8,0 Q 6,10 12,20" stroke={accent} strokeWidth="2.5" fill="none" />
                  <circle cx="8" cy="-8" r="4.5" fill={glow} />
                </g>
              )}

              {brand === 'Tidalcapital' && (
                <g>
                  {/* Tidalcapital Fluid Nautilus Profile */}
                  <path
                    d="M 4,-66 Q -22,-32 -18,12 L -12,56 L 12,56 L 14,22 Q 26,-8 18,-40 Z"
                    fill={base}
                    stroke={primary}
                    strokeWidth="2.5"
                  />
                  <path d="M 0,-40 Q 18,-15 8,24" stroke={secondary} strokeWidth="2" fill="none" />
                  <circle cx="10" cy="-6" r="5" fill={glow} filter="drop-shadow(0 0 4px #48cae4)" />
                </g>
              )}
            </g>
          )}
        </g>
      )}

      {/* Quality Tier Overlays */}
      {quality === 'Brand New' && <BrandNewSheenOverlay />}
      {quality === 'Refurbished' && <RefurbishedOverlay />}
      {quality === 'Malfunctioning' && <MalfunctionSparkOverlay active={malfunctionActive} />}
    </g>
  );
};

/**
 * ============================================================================
 * UPPER ARM / FORELEG UPPER BY BRAND, ARCHETYPE & FACING
 * ============================================================================
 */
export const UpperArmSvg: React.FC<PartProps> = ({
  brand,
  quality,
  cyberOrganic,
  archetype = 'humanoid',
  selected,
  isRightSide,
  malfunctionActive,
  facing = 'side_right',
}) => {
  const { primary, secondary, accent, glow, base } = getPartColors(brand, cyberOrganic);
  const L = LIMB_STANDARDS.upperArmLength;
  const flip = isRightSide ? -1 : 1;
  const isAvian = archetype === 'avian_raptor';
  const isQuad = archetype === 'quadruped';
  const isBack = facing === 'back';

  return (
    <g className={`transition-all duration-150 ${selected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}`}>
      {/* Shoulder Joint Anchor Collar */}
      <circle cx="0" cy="0" r="13" fill={base} stroke={primary} strokeWidth="2" />
      <circle cx="0" cy="0" r="7" fill="#0f172a" stroke={accent} strokeWidth="1.5" />

      {/* AVIAN RAPTOR UPPER ARM */}
      {isAvian && (
        <g>
          <path
            d={`M -7,4 L ${-10 * flip},${L * 0.5} L -6,${L - 4} L 6,${L - 4} L ${10 * flip},${L * 0.5} L 7,4 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.2"
          />
          <path
            d={`M ${8 * flip},8 L ${22 * flip},${L * 0.45} L ${16 * flip},${L * 0.75} L ${6 * flip},${L - 4}`}
            fill={secondary}
            stroke={accent}
            strokeWidth="1.5"
          />
          <polygon points={`${10 * flip},14 ${28 * flip},${L * 0.4} ${14 * flip},${L * 0.6}`} fill={primary} opacity="0.85" />
          <line x1="0" y1="6" x2="0" y2={L - 6} stroke={glow} strokeWidth="2" filter="drop-shadow(0 0 4px #ff4500)" />
        </g>
      )}

      {/* QUADRUPED FORE-UPPER LEG */}
      {isQuad && (
        <g>
          <path
            d={`M -9,4 L ${-14 * flip},${L * 0.4} L -10,${L - 4} L 10,${L - 4} L ${12 * flip},${L * 0.4} L 9,4 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.5"
          />
          <rect x={isRightSide ? -12 : 2} y="10" width="10" height="26" rx="2" fill={secondary} stroke={accent} strokeWidth="1.2" />
        </g>
      )}

      {/* HUMANOID & BRUTE UPPER ARM */}
      {!isAvian && !isQuad && (
        <g>
          {brand === 'Trueflame' && (
            <g>
              <path
                d={`M -10,6 L ${-14 * flip},${L * 0.4} L ${-11 * flip},${L - 4} L 9,${L - 4} L ${12 * flip},${L * 0.4} L 10,6 Z`}
                fill={base}
                stroke={primary}
                strokeWidth="2"
              />
              <polygon points={`0,12 ${16 * flip},${L * 0.45} 0,${L - 8}`} fill={secondary} stroke={accent} strokeWidth="1" />
            </g>
          )}

          {brand === 'Icevault' && (
            <g>
              <rect x="-11" y="5" width="22" height={L - 10} rx="3" fill={base} stroke={primary} strokeWidth="2.5" />
              <line x1="0" y1="8" x2="0" y2={L - 8} stroke={accent} strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {brand !== 'Trueflame' && brand !== 'Icevault' && (
            <g>
              <path
                d={`M -8,4 L ${-11 * flip},${L * 0.5} L -6,${L - 4} L 6,${L - 4} L ${11 * flip},${L * 0.5} L 8,4 Z`}
                fill={base}
                stroke={secondary}
                strokeWidth="1.8"
              />
              <line x1="0" y1="6" x2="0" y2={L - 6} stroke={glow} strokeWidth="2" />
            </g>
          )}
        </g>
      )}

      {/* Elbow Joint Pivot Capsule */}
      <circle cx="0" cy={L} r="9" fill={base} stroke={accent} strokeWidth="1.8" />
      <circle cx="0" cy={L} r="4" fill="#0f172a" stroke={glow} strokeWidth="1" />

      {/* Quality Tier Overlays */}
      {quality === 'Brand New' && <BrandNewSheenOverlay />}
      {quality === 'Refurbished' && <RefurbishedOverlay />}
      {quality === 'Malfunctioning' && <MalfunctionSparkOverlay active={malfunctionActive} />}
    </g>
  );
};

/**
 * ============================================================================
 * FOREARM / HAND / WING-BLADE BY BRAND, ARCHETYPE & FACING
 * ============================================================================
 */
export const ForearmSvg: React.FC<PartProps> = ({
  brand,
  quality,
  cyberOrganic,
  archetype = 'humanoid',
  selected,
  isRightSide,
  malfunctionActive,
  facing = 'side_right',
}) => {
  const { primary, secondary, accent, glow, base } = getPartColors(brand, cyberOrganic);
  const L = LIMB_STANDARDS.forearmLength;
  const flip = isRightSide ? -1 : 1;
  const isAvian = archetype === 'avian_raptor';
  const isQuad = archetype === 'quadruped';

  return (
    <g className={`transition-all duration-150 ${selected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}`}>
      {/* AVIAN RAPTOR FOREARM */}
      {isAvian && (
        <g>
          <path
            d={`M -6,4 L ${-8 * flip},${L * 0.5} L -4,${L} L 4,${L} L ${8 * flip},${L * 0.5} L 6,4 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.2"
          />
          <path
            d={`M ${6 * flip},8 L ${32 * flip},${L * 0.35} L ${18 * flip},${L * 0.55} L ${5 * flip},${L * 0.5}`}
            fill={secondary}
            stroke={accent}
            strokeWidth="1.5"
          />
          <path
            d={`M ${5 * flip},${L * 0.4} L ${42 * flip},${L * 0.75} L ${24 * flip},${L + 12} L ${4 * flip},${L}`}
            fill={primary}
            stroke={accent}
            strokeWidth="1.8"
          />
          <path
            d={`M ${4 * flip},${L * 0.7} L ${34 * flip},${L + 24} L ${12 * flip},${L + 28} L 0,${L + 8}`}
            fill={secondary}
            stroke={glow}
            strokeWidth="1.5"
            filter="drop-shadow(0 0 4px rgba(0,0,0,0.5))"
          />
          <line
            x1="0"
            y1="10"
            x2={36 * flip}
            y2={L * 0.7}
            stroke={glow}
            strokeWidth="2"
            strokeLinecap="round"
            filter="drop-shadow(0 0 5px #ff4500)"
          />

          {/* Grasping Raptor Hand */}
          <g transform={`translate(0, ${L})`}>
            <path d={`M -5,0 L ${-12 * flip},14 L ${-8 * flip},22 L ${-2 * flip},12 Z`} fill={secondary} stroke={accent} strokeWidth="1.5" />
            <path d={`M 0,0 L 0,26 L ${4 * flip},24 L 2,0 Z`} fill={secondary} stroke={accent} strokeWidth="1.5" />
            <path d={`M 4,0 L ${10 * flip},20 L ${8 * flip},26 L 2,0 Z`} fill={secondary} stroke={accent} strokeWidth="1.5" />
            <polygon points={`${-8 * flip},22 ${-14 * flip},28 ${-5 * flip},22`} fill={glow} />
            <polygon points={`0,26 ${-2 * flip},32 4,26`} fill={glow} />
          </g>
        </g>
      )}

      {/* QUADRUPED FORE-SHANK & PAW */}
      {isQuad && (
        <g>
          <path
            d={`M -8,4 L ${-10 * flip},${L * 0.5} L -6,${L} L 6,${L} L ${10 * flip},${L * 0.5} L 8,4 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.5"
          />
          <path d={`M -12,${L} L 12,${L} L 16,${L + 18} L -16,${L + 18} Z`} fill={secondary} stroke={accent} strokeWidth="2" />
          <polygon points={`-12,${L + 18} -16,${L + 24} -8,${L + 18}`} fill={glow} />
          <polygon points={`0,${L + 18} 0,${L + 26} 4,${L + 18}`} fill={glow} />
          <polygon points={`12,${L + 18} 16,${L + 24} 8,${L + 18}`} fill={glow} />
        </g>
      )}

      {/* HUMANOID & BRUTE FOREARM */}
      {!isAvian && !isQuad && (
        <g>
          {brand === 'Trueflame' && (
            <g>
              <path
                d={`M -9,4 L ${-15 * flip},${L * 0.6} L -10,${L} L 10,${L} L ${15 * flip},${L * 0.6} L 9,4 Z`}
                fill={base}
                stroke={primary}
                strokeWidth="2.2"
              />
              <polygon points={`-8,${L} -14,${L + 24} -6,${L + 18}`} fill={secondary} stroke={accent} strokeWidth="1.2" />
              <polygon points={`-3,${L} -2,${L + 28} 3,${L + 26}`} fill={glow} stroke={accent} strokeWidth="1.2" filter="drop-shadow(0 0 4px #ff4500)" />
              <polygon points={`8,${L} 14,${L + 24} 6,${L + 18}`} fill={secondary} stroke={accent} strokeWidth="1.2" />
            </g>
          )}

          {brand === 'Icevault' && (
            <g>
              <rect x="-12" y="4" width="24" height={L - 4} rx="3" fill={base} stroke={primary} strokeWidth="2.5" />
              <rect x="-11" y={L} width="22" height="22" rx="4" fill="#0f172a" stroke={accent} strokeWidth="2" />
              <line x1="-6" y1={L + 8} x2="6" y2={L + 8} stroke={glow} strokeWidth="2" />
            </g>
          )}

          {brand !== 'Trueflame' && brand !== 'Icevault' && (
            <g>
              <path
                d={`M -7,4 L ${-11 * flip},${L * 0.5} L -6,${L} L 6,${L} L ${11 * flip},${L * 0.5} L 7,4 Z`}
                fill={base}
                stroke={secondary}
                strokeWidth="1.8"
              />
              <path d={`M ${10 * flip},12 L ${20 * flip},${L * 0.8} L ${6 * flip},${L + 26}`} fill="none" stroke={glow} strokeWidth="2.5" filter="drop-shadow(0 0 5px #00f5d4)" />
              <line x1="-4" y1={L} x2="-6" y2={L + 20} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="0" y1={L} x2="0" y2={L + 24} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="4" y1={L} x2="6" y2={L + 20} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}

      {/* Quality Tier Overlays */}
      {quality === 'Brand New' && <BrandNewSheenOverlay />}
      {quality === 'Refurbished' && <RefurbishedOverlay />}
      {quality === 'Malfunctioning' && <MalfunctionSparkOverlay active={malfunctionActive} />}
    </g>
  );
};

/**
 * ============================================================================
 * THIGH / HIND THIGH BY BRAND, ARCHETYPE & FACING
 * ============================================================================
 */
export const ThighSvg: React.FC<PartProps> = ({
  brand,
  quality,
  cyberOrganic,
  archetype = 'humanoid',
  selected,
  isRightSide,
  malfunctionActive,
  facing = 'side_right',
}) => {
  const { primary, secondary, accent, glow, base } = getPartColors(brand, cyberOrganic);
  const L = LIMB_STANDARDS.thighLength;
  const flip = isRightSide ? -1 : 1;
  const isAvian = archetype === 'avian_raptor';
  const isQuad = archetype === 'quadruped';

  return (
    <g className={`transition-all duration-150 ${selected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}`}>
      {/* Pelvic Socket Attachment Joint */}
      <circle cx="0" cy="0" r="14" fill={base} stroke={primary} strokeWidth="2.2" />
      <circle cx="0" cy="0" r="7" fill="#0f172a" stroke={accent} strokeWidth="1.5" />

      {/* AVIAN RAPTOR THIGH */}
      {isAvian && (
        <g>
          <path
            d={`M -10,6 L ${-16 * flip},${L * 0.4} L -8,${L - 4} L 8,${L - 4} L ${18 * flip},${L * 0.45} L 12,6 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.4"
          />
          <polygon points={`0,12 ${16 * flip},${L * 0.5} 0,${L - 10}`} fill={secondary} stroke={accent} strokeWidth="1.2" />
          <line x1="0" y1="8" x2="0" y2={L - 8} stroke={glow} strokeWidth="2" filter="drop-shadow(0 0 3px #ff4500)" />
        </g>
      )}

      {/* QUADRUPED HIND HAUNCH */}
      {isQuad && (
        <g>
          <path
            d={`M -14,6 L ${-22 * flip},${L * 0.5} L -10,${L - 4} L 10,${L - 4} L ${18 * flip},${L * 0.5} L 14,6 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.8"
          />
          <circle cx={4 * flip} cy={L * 0.45} r="8" fill={secondary} stroke={accent} strokeWidth="1.5" />
        </g>
      )}

      {/* HUMANOID & BRUTE THIGH */}
      {!isAvian && !isQuad && (
        <g>
          {brand === 'Trueflame' && (
            <g>
              <path
                d={`M -12,6 L ${-16 * flip},${L * 0.5} L -10,${L - 6} L 10,${L - 6} L ${16 * flip},${L * 0.5} L 12,6 Z`}
                fill={base}
                stroke={primary}
                strokeWidth="2.4"
              />
              <polygon points={`0,14 ${14 * flip},${L * 0.5} 0,${L - 12}`} fill={secondary} stroke={accent} strokeWidth="1.2" />
            </g>
          )}

          {brand === 'Icevault' && (
            <g>
              <rect x="-13" y="6" width="26" height={L - 12} rx="4" fill={base} stroke={primary} strokeWidth="2.8" />
              <line x1="0" y1="10" x2="0" y2={L - 10} stroke={accent} strokeWidth="5" strokeLinecap="round" />
            </g>
          )}

          {brand !== 'Trueflame' && brand !== 'Icevault' && (
            <g>
              <path
                d={`M -9,6 L ${-12 * flip},${L * 0.5} L -7,${L - 6} L 7,${L - 6} L ${12 * flip},${L * 0.5} L 9,6 Z`}
                fill={base}
                stroke={secondary}
                strokeWidth="2"
              />
              <line x1="0" y1="8" x2="0" y2={L - 8} stroke={glow} strokeWidth="2.5" />
            </g>
          )}
        </g>
      )}

      {/* Knee Joint Anchor Capsule */}
      <circle cx="0" cy={L} r="10" fill={base} stroke={accent} strokeWidth="2" />
      <circle cx="0" cy={L} r="5" fill="#0f172a" stroke={glow} strokeWidth="1.2" />

      {/* Quality Tier Overlays */}
      {quality === 'Brand New' && <BrandNewSheenOverlay />}
      {quality === 'Refurbished' && <RefurbishedOverlay />}
      {quality === 'Malfunctioning' && <MalfunctionSparkOverlay active={malfunctionActive} />}
    </g>
  );
};

/**
 * ============================================================================
 * CALF / FOOT / TALON BY BRAND, ARCHETYPE & FACING
 * ============================================================================
 */
export const CalfSvg: React.FC<PartProps> = ({
  brand,
  quality,
  cyberOrganic,
  archetype = 'humanoid',
  selected,
  isRightSide,
  malfunctionActive,
  facing = 'side_right',
}) => {
  const { primary, secondary, accent, glow, base } = getPartColors(brand, cyberOrganic);
  const L = LIMB_STANDARDS.calfLength;
  const flip = isRightSide ? -1 : 1;
  const isAvian = archetype === 'avian_raptor';
  const isQuad = archetype === 'quadruped';
  const isBack = facing === 'back';

  return (
    <g className={`transition-all duration-150 ${selected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}`}>
      {/* AVIAN RAPTOR CALF */}
      {isAvian && (
        <g>
          <path
            d={`M -7,4 L ${-11 * flip},${L * 0.4} L -5,${L} L 5,${L} L ${9 * flip},${L * 0.4} L 7,4 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.2"
          />
          <polygon
            points={`${-4 * flip},${L * 0.55} ${-18 * flip},${L * 0.65} ${-3 * flip},${L * 0.75}`}
            fill={secondary}
            stroke={accent}
            strokeWidth="1.5"
          />

          {/* Talon Foot */}
          <g transform={`translate(0, ${L})`}>
            {/* Rear Hallux Spur */}
            <path d={`M ${-4 * flip},0 L ${-16 * flip},16 L ${-12 * flip},22 L 0,4 Z`} fill={secondary} stroke={accent} strokeWidth="1.5" />
            <path d={`M -6,0 L ${-16 * flip},18 L ${-10 * flip},26 L -2,4 Z`} fill={secondary} stroke={accent} strokeWidth="1.5" />
            <path d={`M 0,0 L 0,22 L ${4 * flip},28 L 2,4 Z`} fill={primary} stroke={accent} strokeWidth="1.5" />
            <path d={`M 4,0 L ${14 * flip},18 L ${18 * flip},24 L 2,4 Z`} fill={secondary} stroke={accent} strokeWidth="1.5" />
            <polygon points={`${-10 * flip},26 ${-16 * flip},32 ${-6 * flip},26`} fill={glow} filter="drop-shadow(0 0 3px #ff4500)" />
            <polygon points={`0,28 ${2 * flip},34 4,28`} fill={glow} filter="drop-shadow(0 0 3px #ff4500)" />
            <polygon points={`${18 * flip},24 ${24 * flip},30 ${14 * flip},24`} fill={glow} filter="drop-shadow(0 0 3px #ff4500)" />
          </g>
        </g>
      )}

      {/* QUADRUPED HOCK & REAR PAW */}
      {isQuad && (
        <g>
          <path
            d={`M -8,4 L ${-12 * flip},${L * 0.4} L -6,${L} L 6,${L} L ${10 * flip},${L * 0.4} L 8,4 Z`}
            fill={base}
            stroke={primary}
            strokeWidth="2.5"
          />
          <polygon points={`${-6 * flip},${L * 0.5} ${-14 * flip},${L * 0.6} ${-5 * flip},${L * 0.7}`} fill={secondary} stroke={accent} strokeWidth="1.2" />
          <path d={`M -12,${L} L 12,${L} L 16,${L + 18} L -16,${L + 18} Z`} fill={secondary} stroke={accent} strokeWidth="2" />
          <polygon points={`-12,${L + 18} -16,${L + 24} -8,${L + 18}`} fill={glow} />
          <polygon points={`12,${L + 18} 16,${L + 24} 8,${L + 18}`} fill={glow} />
        </g>
      )}

      {/* HUMANOID & BRUTE CALF */}
      {!isAvian && !isQuad && (
        <g>
          {brand === 'Trueflame' && (
            <g>
              <path
                d={`M -10,4 L ${-16 * flip},${L * 0.5} L -8,${L} L 8,${L} L ${12 * flip},${L * 0.5} L 10,4 Z`}
                fill={base}
                stroke={primary}
                strokeWidth="2.4"
              />
              <path
                d={
                  isBack
                    ? `M -10,${L} L 10,${L} L 12,${L + 24} L -12,${L + 24} Z`
                    : `M -8,${L} L -18,${L + 22} L -6,${L + 18} L 6,${L + 22} L 16,${L + 22} L 8,${L} Z`
                }
                fill={secondary}
                stroke={primary}
                strokeWidth="2"
              />
              {isBack ? (
                // Rear Achilles spur
                <polygon points={`-4,${L + 18} 0,${L + 28} 4,${L + 18}`} fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
              ) : (
                <>
                  <polygon points={`-12,${L + 22} -16,${L + 28} -8,${L + 22}`} fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
                  <polygon points={`6,${L + 22} 12,${L + 28} 14,${L + 22}`} fill={glow} filter="drop-shadow(0 0 4px #ff4500)" />
                </>
              )}
            </g>
          )}

          {brand === 'Icevault' && (
            <g>
              <rect x="-12" y="4" width="24" height={L - 4} rx="3" fill={base} stroke={primary} strokeWidth="2.8" />
              <path d={`M -16,${L} L 16,${L} L 20,${L + 20} L -22,${L + 20} Z`} fill="#0f172a" stroke={accent} strokeWidth="2.5" />
              <line x1="-18" y1={L + 14} x2="16" y2={L + 14} stroke={glow} strokeWidth="2.5" />
            </g>
          )}

          {brand !== 'Trueflame' && brand !== 'Icevault' && (
            <g>
              <path
                d={`M -8,4 Q ${-12 * flip},${L * 0.5} -5,${L} L 5,${L} Q ${12 * flip},${L * 0.5} 8,4 Z`}
                fill={base}
                stroke={secondary}
                strokeWidth="2"
              />
              <path d={`M -10,${L} L 10,${L} L 14,${L + 22} L -14,${L + 22} Z`} fill={secondary} stroke={accent} strokeWidth="1.8" />
            </g>
          )}
        </g>
      )}

      {/* Quality Tier Overlays */}
      {quality === 'Brand New' && <BrandNewSheenOverlay />}
      {quality === 'Refurbished' && <RefurbishedOverlay />}
      {quality === 'Malfunctioning' && <MalfunctionSparkOverlay active={malfunctionActive} />}
    </g>
  );
};

/**
 * ============================================================================
 * TAIL BY BRAND, ARCHETYPE & FACING
 * ============================================================================
 */
export const TailSvg: React.FC<PartProps> = ({
  brand,
  quality,
  cyberOrganic,
  archetype = 'avian_raptor',
  selected,
  malfunctionActive,
  facing = 'side_right',
}) => {
  const { primary, secondary, accent, glow, base } = getPartColors(brand, cyberOrganic);
  const isAvian = archetype === 'avian_raptor';
  const isBack = facing === 'back';

  return (
    <g className={`transition-all duration-150 ${selected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}`}>
      {/* Avian Rudder Tail Fan */}
      {isAvian && (
        <g>
          <path d="M -8,0 L -28,45 L -10,75 L 0,85 L 10,75 L 28,45 L 8,0 Z" fill={base} stroke={primary} strokeWidth="2.2" />
          <polygon points="0,10 -18,55 0,72 18,55" fill={secondary} stroke={accent} strokeWidth="1.5" />
          <line x1="0" y1="12" x2="0" y2="78" stroke={glow} strokeWidth="2.5" filter="drop-shadow(0 0 4px #ff4500)" />
        </g>
      )}

      {/* Quadruped Bio-Cyber Tail */}
      {!isAvian && (
        <g>
          <path d="M -6,0 Q 18,30 22,65 Q 24,90 12,115 L 6,112 Q 16,88 12,62 Q 8,28 0,0 Z" fill={base} stroke={primary} strokeWidth="2.5" />
          <circle cx="10" cy="115" r="7" fill={secondary} stroke={accent} strokeWidth="1.5" />
          <circle cx="10" cy="115" r="3.5" fill={glow} filter="drop-shadow(0 0 4px #00f5d4)" />
        </g>
      )}

      {/* Quality Tier Overlays */}
      {quality === 'Brand New' && <BrandNewSheenOverlay />}
      {quality === 'Refurbished' && <RefurbishedOverlay />}
      {quality === 'Malfunctioning' && <MalfunctionSparkOverlay active={malfunctionActive} />}
    </g>
  );
};
