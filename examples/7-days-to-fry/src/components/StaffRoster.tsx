/**
 * @file src/components/StaffRoster.tsx
 * Horizontal Staff Roster positioned below the kitchen canvas.
 * Shows worker state, facial expression, task badge, Stamina and Morale bars.
 */

import React from 'react';
import { KitchenState, StationId } from '../types';
import { getWorkerFacialExpression } from '../utilityScoring';
import { getAvailableAttention, nudgeToStation, setPrimaryStation } from '../scoring/taskSelection';
import { Users, Battery, Heart, Zap, CheckCircle2, Target } from 'lucide-react';

interface StaffRosterProps {
  state: KitchenState;
}

export const StaffRoster: React.FC<StaffRosterProps> = ({ state }) => {
  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Worker Roster
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">4 Active Agents</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {state.workers.map((w) => {
          const staminaPct = Math.round(w.stamina * 100);
          const moralePct = Math.round(w.morale * 100);
          const expression = getWorkerFacialExpression(w);

          return (
            <div
              key={w.id}
              className="bg-slate-900/80 border border-slate-700/70 rounded-lg p-3 space-y-2.5 hover:border-slate-600 transition"
            >
              {/* Header: Name, Expression & Task Badge */}
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full border border-white/40 flex-shrink-0"
                    style={{ backgroundColor: w.color }}
                  ></span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-100 text-xs flex items-center gap-1 truncate">
                      <span className="truncate">{w.name}</span>
                      <span className="text-sm flex-shrink-0">{expression}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate capitalize">
                      {w.role}
                    </div>
                  </div>
                </div>

                {/* Task Badge */}
                <div className="text-[10px] font-semibold flex-shrink-0">
                  {w.currentTask === 'corner_cut' && (
                    <span className="bg-amber-950 border border-amber-600/60 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400" /> Cut
                    </span>
                  )}
                  {w.currentTask === 'rest' && (
                    <span className="bg-purple-950 border border-purple-600/60 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      ☕ Rest
                    </span>
                  )}
                  {w.currentTask === 'eat_meal' && (
                    <span className="bg-emerald-950 border border-emerald-600/60 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      🍲 Meal
                    </span>
                  )}
                  {w.currentTask === 'protocol' && (
                    <span className="bg-blue-950 border border-blue-600/60 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-blue-400" /> Protocol
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bars: Stamina & Morale */}
              <div className="space-y-1.5 text-[10px]">
                {/* Stamina */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-emerald-400" /> Stamina
                    </span>
                    <span className="font-mono text-slate-300">{staminaPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        staminaPct > 50
                          ? 'bg-emerald-500'
                          : staminaPct > 25
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${staminaPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Morale */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" /> Morale
                    </span>
                    <span className="font-mono text-slate-300">{moralePct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${moralePct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Primary Station & Nudge Controls */}
                <div className="pt-1 space-y-1.5 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-400" /> Station:
                    </span>
                    <select
                      value={w.primaryStation}
                      onChange={(e) => setPrimaryStation(w, e.target.value as StationId)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="queue">Queue</option>
                      <option value="grill">Grill</option>
                      <option value="assembly">Assembly</option>
                      <option value="window">Window</option>
                      <option value="fryer">Fryer</option>
                    </select>
                  </div>

                  <button
                    onClick={() => nudgeToStation(state, w.id)}
                    disabled={getAvailableAttention(state.manager) === 0}
                    className={`w-full py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      w.stationNudgeBoostRemaining > 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : getAvailableAttention(state.manager) > 0
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>
                      {w.stationNudgeBoostRemaining > 0
                        ? `Nudged (${Math.ceil(w.stationNudgeBoostRemaining)}s)`
                        : 'Nudge Station'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
