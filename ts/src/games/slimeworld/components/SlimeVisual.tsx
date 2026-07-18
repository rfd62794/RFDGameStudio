// @ts-nocheck
import React from 'react';
import { Slime, SlimeColor, SlimePattern } from '../types';
import { COLOR_SPECS } from '../gameLogic';

// --- Seeded PRNG (mulberry32) ---
// Standard, well-known small PRNG with good distribution properties.
// Deterministic: same seed → same sequence, every time.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Derive a deterministic integer seed from a slime's id string.
function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// Generate SVG polygon points for a slime silhouette.
// vertexCount: number of polygon vertices (3–22)
// irregularity: 0–100, where 0 = perfect regular polygon
// seed: deterministic per-slime seed (from id hash)
// radius: base radius in SVG units
// center: center coordinate in SVG units
export function generateSlimePolygonPoints(
  vertexCount: number,
  irregularity: number,
  seed: number,
  radius = 40,
  center = 50
): string {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / vertexCount;
  const rng = mulberry32(seed);
  const irrFactor = irregularity / 100;

  for (let i = 0; i < vertexCount; i++) {
    const baseAngle = i * angleStep;
    const angleJitter = (rng() - 0.5) * irrFactor * angleStep * 0.5;
    const radiusJitter = 1 + (rng() - 0.5) * irrFactor * 0.6;
    const angle = baseAngle + angleJitter;
    const r = radius * radiusJitter;
    points.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

// Export for testing
export { mulberry32, hashStringToSeed };

interface SlimeVisualProps {
  slime: Slime;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
}

export function SlimeVisual({ slime, size = 'md', showDetails = false }: SlimeVisualProps) {
  const spec = COLOR_SPECS[slime.color];
  const colorHex = spec.rgb;

  // Determine size classes
  let sizeClass = 'w-16 h-16';
  let eyeSize = 'w-1.5 h-1.5';
  let eyeOffset = 'top-6';
  let mouthSize = 'w-2 h-1';
  let faceWidth = 'w-8';

  if (size === 'xs') {
    sizeClass = 'w-10 h-10';
    eyeSize = 'w-1 h-1';
    eyeOffset = 'top-4';
    mouthSize = 'w-1.5 h-0.5';
    faceWidth = 'w-5';
  } else if (size === 'sm') {
    sizeClass = 'w-12 h-12';
    eyeSize = 'w-1 h-1';
    eyeOffset = 'top-5';
    mouthSize = 'w-1.5 h-0.5';
    faceWidth = 'w-6';
  } else if (size === 'lg') {
    sizeClass = 'w-24 h-24';
    eyeSize = 'w-2.5 h-2.5';
    eyeOffset = 'top-9';
    mouthSize = 'w-4 h-2';
    faceWidth = 'w-12';
  } else if (size === 'xl') {
    sizeClass = 'w-36 h-36';
    eyeSize = 'w-4 h-4';
    eyeOffset = 'top-14';
    mouthSize = 'w-6 h-3';
    faceWidth = 'w-18';
  }

  // Polygon points for the slime silhouette — deterministic per slime id
  const vertexCount = slime.vertexCount || 4;
  const irregularity = slime.irregularity || 0;
  const seed = hashStringToSeed(slime.id);
  const polygonPoints = generateSlimePolygonPoints(vertexCount, irregularity, seed);

  // SVG pattern definitions for each slime pattern
  const renderSvgPattern = (patternId: string) => {
    switch (slime.pattern) {
      case 'Stripe':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
            <rect width="4" height="12" fill="rgba(255,255,255,0.25)" />
          </pattern>
        );
      case 'Polka':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="14" height="14">
            <circle cx="4" cy="4" r="2" fill="rgba(255,255,255,0.35)" />
            <circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.25)" />
          </pattern>
        );
      case 'Glow':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="rgba(255,255,255,0.15)" />
            <circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.2)" />
          </pattern>
        );
      case 'Nebula':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="rgba(147,51,234,0.15)" />
            <circle cx="20" cy="30" r="1.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="70" cy="60" r="1" fill="rgba(255,255,255,0.5)" />
            <circle cx="50" cy="20" r="0.8" fill="rgba(255,255,255,0.4)" />
          </pattern>
        );
      case 'Obsidian':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="none" stroke="rgba(15,23,42,0.7)" strokeWidth="4" />
          </pattern>
        );
      case 'Solid':
      default:
        return null;
    }
  };

  // Determine the pattern fill (if any) for the polygon
  const patternId = `slime-pattern-${slime.id}`;
  const hasPattern = slime.pattern !== 'Solid' && slime.pattern !== 'Crown' && slime.pattern !== 'Ringed';
  const patternFill = hasPattern ? `url(#${patternId})` : undefined;

  // Handle pattern rendering overlay (for Crown/Ringed which are external to the body shape)
  const renderExternalPattern = () => {
    switch (slime.pattern) {
      case 'Crown':
        return (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
            <div className="w-2 h-4 bg-white/70 rotate-[-15deg] rounded-t-full clip-triangle"></div>
            <div className="w-2.5 h-5 bg-white rounded-t-full clip-triangle"></div>
            <div className="w-2 h-4 bg-white/70 rotate-[15deg] rounded-t-full clip-triangle"></div>
          </div>
        );
      case 'Ringed':
        return (
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[30%] border border-white/60 rounded-full rotate-[-15deg] pointer-events-none z-10 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          />
        );
      default:
        return null;
    }
  };

  // Decide face expression based on stats
  const isHighAtk = slime.stats.atk > slime.stats.int;
  const isHighInt = slime.stats.int > slime.stats.atk;
  const isDispatched = slime.role === 'dispatch';

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative">
        {/* Glow behind high-grade patterns */}
        {['Glow', 'Nebula', 'Obsidian'].includes(slime.pattern) && (
          <div 
            className="absolute inset-0 rounded-full filter blur-md opacity-60 animate-pulse"
            style={{ backgroundColor: colorHex }}
          />
        )}

        {/* Organic slime body — SVG polygon from real vertexCount/irregularity */}
        <div 
          className={`relative ${sizeClass} transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 active:scale-95`}
          style={{
            animation: isDispatched 
              ? 'pulse 1.2s infinite alternate ease-in-out' 
              : 'pulse 3s infinite alternate ease-in-out',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full"
            style={{
              filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.3)) drop-shadow(0 0 12px ${colorHex}50)`,
            }}
          >
            <defs>
              {/* Radial gradient for body fill */}
              <radialGradient id={`grad-${slime.id}`} cx="35%" cy="35%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="80%" stopColor="transparent" />
              </radialGradient>
              {/* Pattern fill if applicable */}
              {renderSvgPattern(patternId)}
            </defs>
            {/* Base color polygon */}
            <polygon
              points={polygonPoints}
              fill={colorHex}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="0.5"
            />
            {/* Gradient overlay for depth */}
            <polygon
              points={polygonPoints}
              fill={`url(#grad-${slime.id})`}
            />
            {/* Pattern overlay */}
            {patternFill && (
              <polygon
                points={polygonPoints}
                fill={patternFill}
              />
            )}
            {/* Inner shadow for 3D effect */}
            <polygon
              points={polygonPoints}
              fill="none"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="2"
              style={{ filter: 'blur(3px)', transform: 'translate(2px, 2px)' }}
            />
          </svg>

          {/* External patterns (Crown, Ringed) */}
          {renderExternalPattern()}

          {/* Core Nucleus */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full opacity-40 animate-pulse pointer-events-none"
            style={{ 
              background: `radial-gradient(circle, #fff 0%, ${colorHex} 70%)`,
              filter: 'blur(2px)'
            }}
          />

          {/* Adorable Face */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${faceWidth} flex flex-col items-center ${eyeOffset} pointer-events-none`}>
            {/* Eyes */}
            <div className="w-full flex justify-between px-1">
              {isDispatched ? (
                <>
                  <div className={`${eyeSize} bg-slate-900 rounded-full animate-bounce`} />
                  <div className={`${eyeSize} bg-slate-900 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
                </>
              ) : isHighAtk ? (
                <>
                  {/* Determined eyes */}
                  <div className="relative">
                    <div className={`${eyeSize} bg-slate-950 rounded-full`} />
                    <div className="absolute -top-1 left-0 w-2 h-0.5 bg-slate-950 rotate-[20deg]" />
                  </div>
                  <div className="relative">
                    <div className={`${eyeSize} bg-slate-950 rounded-full`} />
                    <div className="absolute -top-1 right-0 w-2 h-0.5 bg-slate-950 rotate-[-20deg]" />
                  </div>
                </>
              ) : isHighInt ? (
                <>
                  {/* Glowing, thoughtful eyes */}
                  <div className={`${eyeSize} bg-cyan-100 rounded-full shadow-[0_0_4px_#22d3ee] animate-pulse`} />
                  <div className={`${eyeSize} bg-cyan-100 rounded-full shadow-[0_0_4px_#22d3ee] animate-pulse`} />
                </>
              ) : (
                <>
                  {/* Standard cute eyes */}
                  <div className={`${eyeSize} bg-slate-900 rounded-full`} />
                  <div className={`${eyeSize} bg-slate-900 rounded-full`} />
                </>
              )}
            </div>

            {/* Mouth */}
            <div className={`mt-1 flex justify-center`}>
              {isDispatched ? (
                <div className={`${mouthSize} border-b-2 border-slate-900 rounded-full`} />
              ) : isHighAtk ? (
                <div className={`${mouthSize} h-1.5 border-t-2 border-slate-950 rounded-none`} />
              ) : isHighInt ? (
                <div className={`${mouthSize} h-2 w-2 rounded-full border border-cyan-300 bg-cyan-900/30`} />
              ) : (
                <div className={`${mouthSize} border-b-2 border-slate-900 rounded-full`} />
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 text-center">
          <div className="font-mono text-xs font-bold tracking-tight text-slate-200">
            {slime.name}
          </div>
          <div className="flex items-center justify-center space-x-1.5 mt-0.5">
            <span 
              className="text-[9px] px-1.5 py-0.5 rounded font-medium border text-slate-300"
              style={{ 
                backgroundColor: `${colorHex}15`, 
                borderColor: `${colorHex}40`
              }}
            >
              {slime.color}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium border border-slate-700 bg-slate-800/50 text-slate-400">
              {slime.pattern}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Lv. {slime.level} • {slime.role.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
