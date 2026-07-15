import React from 'react';
import { Slime, SlimeColor, SlimePattern } from '../types';
import { COLOR_SPECS } from '../gameLogic';

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

  // Handle pattern rendering overlay
  const renderPattern = () => {
    switch (slime.pattern) {
      case 'Stripe':
        return (
          <div 
            className="absolute inset-0 rounded-[inherit] opacity-25" 
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 4px, transparent 4px, transparent 12px)'
            }}
          />
        );
      case 'Polka':
        return (
          <div 
            className="absolute inset-0 rounded-[inherit] opacity-35 flex flex-wrap justify-around items-center p-1.5"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        );
      case 'Glow':
        return (
          <div 
            className="absolute inset-1 rounded-[inherit] bg-white opacity-20 filter blur-xs animate-pulse"
          />
        );
      case 'Crown':
        // Render hard crystal point coordinates at the top
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
      case 'Nebula':
        return (
          <div 
            className="absolute inset-0 rounded-[inherit] bg-radial from-transparent to-purple-500/30 overflow-hidden"
          >
            <div className="absolute top-2 left-3 w-1 h-1 bg-white rounded-full animate-ping"></div>
            <div className="absolute bottom-3 right-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-6 right-2 w-0.5 h-0.5 bg-white rounded-full"></div>
          </div>
        );
      case 'Obsidian':
        return (
          <div className="absolute inset-0 rounded-[inherit] border-4 border-slate-900/80">
            <div className="absolute top-0 left-0 w-3 h-3 bg-slate-800 rounded-br-md"></div>
            <div className="absolute bottom-0 right-1 w-2.5 h-2.5 bg-slate-800 rounded-tl-md"></div>
            <div className="absolute top-1/2 right-0 w-2 h-3 bg-slate-800 -translate-y-1/2 rounded-l-sm"></div>
          </div>
        );
      case 'Solid':
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

        {/* Organic slime body */}
        <div 
          className={`relative ${sizeClass} transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 active:scale-95`}
          style={{
            background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45) 0%, rgba(255,255,255,0.1) 40%, transparent 80%), ${colorHex}`,
            borderRadius: isDispatched 
              ? '55% 45% 55% 45% / 45% 55% 45% 55%' // moving shape
              : '50% 50% 50% 50% / 60% 60% 40% 40%', // resting teardrop
            boxShadow: `inset -6px -6px 12px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3), 0 0 12px ${colorHex}50`,
            animation: isDispatched 
              ? 'pulse 1.2s infinite alternate ease-in-out' 
              : 'pulse 3s infinite alternate ease-in-out',
          }}
        >
          {/* Pattern Overlay */}
          {renderPattern()}

          {/* Core Nucleus */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full opacity-40 animate-pulse"
            style={{ 
              background: `radial-gradient(circle, #fff 0%, ${colorHex} 70%)`,
              filter: 'blur(2px)'
            }}
          />

          {/* Adorable Face */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${faceWidth} flex flex-col items-center ${eyeOffset}`}>
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
                <div className={`${mouthSize} h-1.5 border-t-2 border-slate-950 rounded-none`} /> // determined straight line
              ) : isHighInt ? (
                <div className={`${mouthSize} h-2 w-2 rounded-full border border-cyan-300 bg-cyan-900/30`} /> // tiny 'o' gasp
              ) : (
                <div className={`${mouthSize} border-b-2 border-slate-900 rounded-full`} /> // smiley curve
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
