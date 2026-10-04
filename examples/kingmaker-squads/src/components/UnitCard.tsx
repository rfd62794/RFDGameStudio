import React from 'react';
import { UnitState } from '../types';
import { ChessIcon } from './ChessIcon';
import { Crown } from 'lucide-react';

export const ZODIAC_GLYPHS: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';

export const ZODIAC_ELEMENTS: Record<string, ZodiacElement> = {
  aries: 'fire',
  leo: 'fire',
  sagittarius: 'fire',
  taurus: 'earth',
  virgo: 'earth',
  capricorn: 'earth',
  gemini: 'air',
  libra: 'air',
  aquarius: 'air',
  cancer: 'water',
  scorpio: 'water',
  pisces: 'water',
};

export const ELEMENT_BORDER_CLASSES: Record<ZodiacElement, string> = {
  fire: 'border-amber-500/80 shadow-amber-950/30',
  earth: 'border-emerald-500/80 shadow-emerald-950/30',
  air: 'border-cyan-500/80 shadow-cyan-950/30',
  water: 'border-violet-500/80 shadow-violet-950/30',
};

export function getZodiacElement(zodiac?: string): { element: ZodiacElement; elementBorderClass: string } {
  const element = zodiac ? ZODIAC_ELEMENTS[zodiac] || 'fire' : 'fire';
  return {
    element,
    elementBorderClass: ELEMENT_BORDER_CLASSES[element],
  };
}

export interface UnitCardProps {
  unit: UnitState;
  isKing?: boolean;
  variant?: 'default' | 'compact';
  onClick?: () => void;
  className?: string;
  headerExtra?: React.ReactNode;
  children?: React.ReactNode;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  isKing = false,
  variant = 'default',
  onClick,
  className = '',
  headerExtra,
  children,
}) => {
  const effectiveIsKing = isKing || Boolean(unit.isKing);
  const { element, elementBorderClass } = getZodiacElement(unit.zodiac);

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl p-2 flex flex-col justify-between transition border shadow-md bg-zinc-950/90 ${elementBorderClass} ${className} ${
        onClick ? 'cursor-pointer hover:border-amber-400/80' : ''
      }`}
    >
      {/* Top Bar: Corner Marks [Rank] [Crown if King] [Zodiac + Extra] */}
      <div className="flex items-center justify-between px-0.5 pt-0.5 mb-1">
        {/* Top-Left: Rank Corner Mark */}
        <div className="flex items-center gap-0.5">
          {unit.rank === 'elite' ? (
            <span
              className="text-[8px] font-mono font-black uppercase text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/50 leading-none"
              title="Elite Rank"
            >
              ELITE
            </span>
          ) : unit.rank === 'veteran' ? (
            <span
              className="text-[8px] font-mono font-bold uppercase text-cyan-300 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-500/50 leading-none"
              title="Veteran Rank"
            >
              VET
            </span>
          ) : (
            <span className="w-2" />
          )}
        </div>

        {/* Top-Center: King Crown */}
        {effectiveIsKing ? (
          <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0 drop-shadow" />
        ) : (
          <span className="w-2" />
        )}

        {/* Top-Right: Zodiac Corner Glyph + Optional Extra */}
        <div className="flex items-center gap-1">
          {headerExtra}
          {unit.zodiac && (
            <span
              className="text-xs font-mono text-amber-200/90 leading-none"
              title={`Zodiac: ${unit.zodiac} (${element})`}
            >
              {ZODIAC_GLYPHS[unit.zodiac] || ''}
            </span>
          )}
        </div>
      </div>

      {/* Central Illustration: Dominant Archetype Icon */}
      <div className="flex-1 flex items-center justify-center my-1">
        <ChessIcon
          type={unit.archetype}
          className={`${variant === 'compact' ? 'w-5 h-5' : 'w-7 h-7'} text-amber-400 drop-shadow-md`}
        />
      </div>

      {/* Dedicated Full-Width Unit Name Band */}
      <div className="w-full bg-zinc-950/80 border-y border-zinc-800/80 py-0.5 px-1 text-center my-1">
        <span className="text-xs font-bold text-zinc-100 truncate block leading-tight">
          {unit.name}
        </span>
      </div>

      {/* Slot for Stats, Actions, HP Bar, Floating Damage, etc. */}
      {children}
    </div>
  );
};
