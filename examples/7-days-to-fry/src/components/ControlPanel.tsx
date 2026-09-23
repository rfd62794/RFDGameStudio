/**
 * @file src/components/ControlPanel.tsx
 * Interactive Control Panel for simulation controls (Pause, Speed, Reset)
 * and background status indicators.
 */

import React from 'react';
import { KitchenState } from '../types';
import { Coffee, Shield, Pause, Play, RotateCcw, Truck } from 'lucide-react';
import { STOCK_UNITS_CAPACITY, UNLOAD_TRUCK_COST } from '../data';

interface ControlPanelProps {
  state: KitchenState;
  onTogglePause: () => void;
  onChangeSpeed: (speed: number) => void;
  onResetSession: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  onTogglePause,
  onChangeSpeed,
  onResetSession,
}) => {
  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-4 shadow-lg">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <h3 className="font-semibold text-slate-100 text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Simulation Controls
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePause}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
            title={state.isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {state.isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${
                  state.speedMultiplier === spd
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={onResetSession}
            className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 transition cursor-pointer"
            title="Reset Shift"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Background Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Stock Units Automated Status */}
        <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                Stock Units
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {state.stockUnits} / {STOCK_UNITS_CAPACITY + (state.stockCapacityBonus || 0)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Auto-Restock Active (${UNLOAD_TRUCK_COST})
              </div>
            </div>
          </div>
        </div>

        {/* Staff Meal Auto-Discharge Status */}
        <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Coffee className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                Staff Meal Area
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {state.mealUnits.toFixed(1)} units
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Auto-Discharges Waste Buffer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
