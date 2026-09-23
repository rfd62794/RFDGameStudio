import React, { useState } from 'react';
import { GameLogEvent } from '../types';
import {
  ScrollText,
  TrendingUp,
  Landmark,
  Wheat,
  Zap,
  Filter,
  Trash2,
} from 'lucide-react';

interface EventLogProps {
  logs: GameLogEvent[];
  onClearLogs?: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'soil_upgrade' | 'monument_built' | 'harvest' | 'perturbation'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getLogBadge = (type: GameLogEvent['type']) => {
    switch (type) {
      case 'soil_upgrade':
        return (
          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
            <TrendingUp className="w-3 h-3" /> Soil Upgrade
          </span>
        );
      case 'monument_built':
        return (
          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
            <Landmark className="w-3 h-3" /> Monument
          </span>
        );
      case 'harvest':
        return (
          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
            <Wheat className="w-3 h-3" /> Harvest
          </span>
        );
      case 'perturbation':
        return (
          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
            <Zap className="w-3 h-3" /> Flux Perturb
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            System
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">Planetary Event Stream</h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
          {(['all', 'soil_upgrade', 'monument_built', 'harvest'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded transition-all capitalize ${
                filter === f
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1 custom-scrollbar">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2.5 text-xs transition-colors hover:border-slate-700"
            >
              <div className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">
                t{log.tick}
              </div>
              <div className="shrink-0">{getLogBadge(log.type)}</div>
              <div className="flex-1 text-slate-300 text-[11px] leading-relaxed">
                {log.message}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-slate-500 italic">
            No events match current filter.
          </div>
        )}
      </div>
    </div>
  );
};
