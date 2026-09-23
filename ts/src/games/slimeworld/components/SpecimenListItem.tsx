// @ts-nocheck
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Slime } from '../types';
import { COLOR_SPECS, stageFromLevel } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';

interface SpecimenListItemProps {
  key?: any;
  slime: Slime;
  isSelected?: boolean;
  onClick?: () => void;
  showChevron?: boolean;
  action?: React.ReactNode;
}

export function SpecimenListItem({
  slime,
  isSelected = false,
  onClick,
  showChevron = true,
  action
}: SpecimenListItemProps) {
  const spec = COLOR_SPECS[slime.color];

  return (
    <div
      onClick={onClick}
      className={`group relative p-3 rounded-lg border flex items-center justify-between transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-slate-500 bg-slate-800/60 shadow-[0_4px_12px_rgba(255,255,255,0.03)]'
          : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/80 hover:bg-slate-900/40'
      }`}
    >
      {/* Tiny neon edge highlighting their strain */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1 rounded-l"
        style={{ backgroundColor: spec.rgb }}
      />

      <div className="flex items-center space-x-3.5 pl-1.5 min-w-0 flex-1">
        <SlimeVisual slime={slime} size="xs" />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
            {slime.name}
          </div>
          <div className="flex items-center space-x-1.5 mt-1 flex-wrap gap-y-1">
            <span
              className="text-[9px] px-1.5 py-0 rounded font-bold font-mono uppercase tracking-wider whitespace-nowrap"
              style={{
                color: spec.rgb,
                backgroundColor: `${spec.rgb}15`
              }}
            >
              {slime.color}
            </span>
            <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">
              {slime.pattern}
            </span>
            <span className="text-[8px] px-1 py-0 rounded font-bold font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
              {stageFromLevel(slime.level)}
            </span>
            {slime.lockedRole && (
              <span className={`text-[8px] px-1 py-0.5 rounded font-mono font-bold tracking-wider whitespace-nowrap ${
                slime.lockedRole === 'dispatch'
                  ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                  : slime.lockedRole === 'mediation'
                  ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30'
                  : slime.lockedRole === 'worker'
                  ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
              }`}>
                🔒 {slime.lockedRole === 'dispatch' ? 'COMBAT' : slime.lockedRole === 'mediation' ? 'MEDIATION' : slime.lockedRole === 'worker' ? 'LAB/WORKER' : 'EXPLORATION'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 text-right shrink-0 ml-2">
        <div>
          <div className="text-xs font-bold font-mono text-white">Lv. {slime.level}</div>
          <div className="text-[9px] text-slate-500 font-mono tracking-wider">
            {slime.role === 'dispatch' ? (
              <span className="text-red-400 animate-pulse uppercase">Dispatch</span>
            ) : slime.role === 'corporate' ? (
              <span className="text-yellow-400 uppercase">Corp</span>
            ) : (
              <span className="text-slate-500 uppercase">Idle</span>
            )}
          </div>
        </div>
        
        {action}
        
        {showChevron && onClick && (
          <ChevronRight
            className={`w-4 h-4 text-slate-600 transition-transform ${
              isSelected ? 'translate-x-1 text-slate-400' : ''
            }`}
          />
        )}
      </div>
    </div>
  );
}
