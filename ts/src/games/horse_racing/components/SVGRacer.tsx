/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface SVGRacerProps {
  colorBody: string;
  colorMane: string;
  colorSocks: string;
  colorJockeySilk: string;
  gateNumber?: number;
  isRunning?: boolean;
  runTick?: number; // animation accumulator
  size?: number | string;
  className?: string;
}

export const SVGRacer: React.FC<SVGRacerProps> = ({
  colorBody,
  colorMane,
  colorSocks,
  colorJockeySilk,
  gateNumber,
  isRunning = false,
  runTick = 0,
  size = '100%',
  className = ''
}) => {
  // Let's create leg swing angles if running
  const speedScale = isRunning ? 1 : 0;
  
  // High-frequency gallop oscillation
  const phase = runTick * 0.55; 
  
  const frontLeg1Angle = isRunning ? Math.sin(phase) * 32 : 12;
  const frontLeg2Angle = isRunning ? Math.sin(phase + Math.PI) * 28 : -8;
  const backLeg1Angle = isRunning ? Math.sin(phase + 0.5) * 30 : -10;
  const backLeg2Angle = isRunning ? Math.sin(phase + Math.PI + 0.5) * 32 : 15;
  
  // Body and head bobbing
  const bodyBobY = isRunning ? Math.abs(Math.sin(phase * 2)) * -4 : 0;
  const headBobX = isRunning ? Math.cos(phase) * 2.5 : 0;
  const headBobY = isRunning ? Math.sin(phase * 2) * 1.5 : 0;
  
  // Tail wagging
  const tailWagAngle = isRunning ? Math.sin(phase * 1.5) * 15 : 0;

  // Jockey bobbing (leaning forward / aggressive galloping posture)
  const jockeyBobX = isRunning ? Math.sin(phase) * 2 - 1 : 0;
  const jockeyBobY = isRunning ? Math.cos(phase * 2) * 1.2 : 0;

  return (
    <svg 
      viewBox="0 0 160 110" 
      width={size} 
      height={size} 
      className={`select-none overflow-visible ${className}`}
      id={`racer-svg-${gateNumber}`}
    >
      <g transform={`translate(0, ${bodyBobY + 12})`}>
        {/* Shadow */}
        <ellipse 
          cx="82" 
          cy="86" 
          rx={isRunning ? 45 + Math.sin(phase)*5 : 42} 
          ry="6" 
          fill="rgba(0,0,0,0.15)" 
        />

        {/* Back Leg 2 (Furthest from viewer) */}
        <g transform={`translate(48, 55) rotate(${backLeg2Angle})`}>
          {/* Upper leg */}
          <path d="M-4,0 L-2,18 L3,18 L2,0 Z" fill={colorBody} opacity="0.8" />
          {/* Lower leg */}
          <path d="M-2,18 L-5,32 L-1,33 L3,18 Z" fill={colorBody} opacity="0.8" />
          {/* Sock & Hoof */}
          <path d="M-5,32 L-6,38 L-1,38 L-1,33 Z" fill={colorSocks} opacity="0.8" />
          <path d="M-6,38 L-7,42 L0,42 L-1,38 Z" fill="#4B5563" opacity="0.8" />
        </g>

        {/* Front Leg 2 (Furthest from viewer) */}
        <g transform={`translate(108, 55) rotate(${frontLeg2Angle})`}>
          <path d="M-3,0 L-4,18 L1,18 L2,0 Z" fill={colorBody} opacity="0.8" />
          <path d="M-4,18 L-8,30 L-4,32 L1,18 Z" fill={colorBody} opacity="0.8" />
          <path d="M-8,30 L-10,38 L-5,38 L-4,32 Z" fill={colorSocks} opacity="0.8" />
          <path d="M-10,38 L-11,41 L-4,41 L-5,38 Z" fill="#4B5563" opacity="0.8" />
        </g>

        {/* Tail */}
        <g transform={`translate(28, 38) rotate(${tailWagAngle})`}>
          {/* Dynamic wavy tail */}
          <path 
            d="M0,0 C-12,5 -22,18 -26,30 C-22,26 -12,20 -2,12 Z" 
            fill={colorMane} 
          />
        </g>

        {/* Main Torso */}
        <path 
          d="M32,36 C28,38 28,45 32,50 C40,58 55,60 70,60 C90,60 110,55 116,46 C122,38 116,30 102,32 C88,34 50,32 32,36 Z" 
          fill={colorBody} 
        />

        {/* Rear flank muscle accent */}
        <path 
          d="M35,36 C30,42 32,48 38,52 C44,55 48,46 45,38 Z" 
          fill="rgba(0,0,0,0.06)" 
        />

        {/* Back Leg 1 (Closest to viewer) */}
        <g transform={`translate(48, 55) rotate(${backLeg1Angle})`}>
          {/* Upper leg */}
          <path d="M-5,0 L-3,18 L3,18 L3,0 Z" fill={colorBody} />
          {/* Lower leg */}
          <path d="M-3,18 L-6,32 L-1,33 L3,18 Z" fill={colorBody} />
          {/* Sock & Hoof */}
          <path d="M-6,32 L-7,38 L-2,38 L-1,33 Z" fill={colorSocks} />
          <path d="M-7,38 L-8,42 L-1,42 L-2,38 Z" fill="#1F2937" />
        </g>

        {/* Front Leg 1 (Closest to viewer) */}
        <g transform={`translate(108, 55) rotate(${frontLeg1Angle})`}>
          <path d="M-4,0 L-5,18 L1,18 L3,0 Z" fill={colorBody} />
          <path d="M-5,18 L-9,30 L-4,32 L1,18 Z" fill={colorBody} />
          <path d="M-9,30 L-11,38 L-6,38 L-4,32 Z" fill={colorSocks} />
          <path d="M-11,38 L-12,41 L-5,41 L-6,38 Z" fill="#1F2937" />
        </g>

        {/* Neck & Head */}
        <g transform={`translate(112, 38) translate(${headBobX}, ${headBobY})`}>
          {/* Neck */}
          <path 
            d="M-12,-8 C-5,-22 -2,-42 10,-42 C14,-42 18,-35 15,-20 C11,0 -4,14 -12,14 Z" 
            fill={colorBody} 
          />
          {/* Mane */}
          <path 
            d="M-14,-6 C-12,-18 -15,-30 -8,-40 C-6,-24 -8,-12 -12,-4 Z" 
            fill={colorMane} 
          />
          <path 
            d="M-8,-26 C-4,-32 -2,-38 5,-44 C2,-36 -2,-30 -6,-24 Z" 
            fill={colorMane} 
          />
          
          {/* Head */}
          <path 
            d="M6,-38 C10,-40 22,-44 28,-36 C34,-28 32,-18 24,-16 C18,-14 12,-14 6,-26 Z" 
            fill={colorBody} 
          />
          
          {/* Snout / Muzzle */}
          <path 
            d="M24,-16 C25,-16 32,-18 31,-23 C30,-28 26,-27 24,-24 Z" 
            fill="rgba(0,0,0,0.15)" 
          />

          {/* Ears */}
          <path d="M5,-43 L10,-52 L12,-42 Z" fill={colorBody} />
          <path d="M8,-42 L13,-49 L14,-41 Z" fill={colorMane} opacity="0.9" />

          {/* Eye */}
          <circle cx="20" cy="-30" r="2" fill="#FFFFFF" />
          <circle cx="20.5" cy="-30" r="1" fill="#000000" />

          {/* Bridle (Reins) */}
          <path d="M28,-18 C20,-20 16,-22 10,-24" stroke="#78350F" strokeWidth="1.2" fill="none" />
          <path d="M22,-25 L21,-15" stroke="#78350F" strokeWidth="1.2" fill="none" />
        </g>

        {/* Jockey Saddle & Cloth */}
        <path d="M62,34 C64,34 78,34 75,44 C72,50 63,48 60,38 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
        <path d="M64,34 L72,34 L69,42 L65,42 Z" fill={colorJockeySilk} />

        {/* Dynamic Jockey (bobbing rider) */}
        <g transform={`translate(67, 28) translate(${jockeyBobX}, ${jockeyBobY})`}>
          {/* Back/Torso leaning forward */}
          <path 
            d="M-8,1 C-15,-6 -8,-16 5,-14 C12,-13 14,-7 11,2 C8,6 -2,6 -8,1 Z" 
            fill={colorJockeySilk} 
          />
          
          {/* Decorative jersey stripe */}
          <path 
            d="M-3,-13 C2,-12 4,-8 1,-1" 
            stroke="#FFFFFF" 
            strokeWidth="2.5" 
            fill="none" 
            opacity="0.7"
          />

          {/* White Helmet with Goggles */}
          <circle cx="8" cy="-19" r="6.5" fill="#FFFFFF" />
          <path d="M5,-22 L11,-22 L11,-17 L5,-17 Z" fill="#EAB308" /> {/* visor */}
          {/* Cap cover (Silk matching) */}
          <path d="M3,-19 C4,-26 12,-26 13,-19 Z" fill={colorJockeySilk} />

          {/* Arms holding reins */}
          <path d="M4,-9 L16,-5" stroke={colorJockeySilk} strokeWidth="3" strokeLinecap="round" />
          {/* Hands */}
          <circle cx="16" cy="-5" r="2" fill="#FDBA74" />

          {/* Legs folded in saddle */}
          <path d="M-6,2 L-2,10 L3,6" stroke="#1E2937" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Boots */}
          <path d="M2,6 L4,10 L6,10" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Reins from hand of jockey to head */}
        <path 
          d={`M83, ${23 + jockeyBobY} Q108,${22 + headBobY} 122,${20 + headBobY}`} 
          stroke="#78350F" 
          strokeWidth="1" 
          fill="none" 
        />

        {/* Horse Saddle Number Bib */}
        {gateNumber && (
          <g transform="translate(68, 42)">
            <rect x="-9" y="-6" width="18" height="13" rx="2" fill="#000000" />
            <text 
              x="0" 
              y="4.5" 
              fill="#FFFFFF" 
              fontSize="9" 
              fontWeight="bold" 
              fontFamily="monospace" 
              textAnchor="middle"
            >
              {gateNumber}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};
