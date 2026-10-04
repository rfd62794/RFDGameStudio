import React, { useState } from 'react';
import { Drone, HaulerFSMState, MiningFSMState } from '../types';
import { Activity, ShieldCheck, Zap, ArrowRight, Anchor, Cpu } from 'lucide-react';

interface FSMInspectorProps {
  miningDrones: Drone[];
  haulers: Drone[];
  selectedDroneId: string | null;
  onSelectDrone: (id: string | null) => void;
  onToggleDroneTier?: (droneId: string) => void;
}

export const FSMInspector: React.FC<FSMInspectorProps> = ({
  miningDrones,
  haulers,
  selectedDroneId,
  onSelectDrone,
  onToggleDroneTier,
}) => {
  const [activeTab, setActiveTab] = useState<'MINING' | 'HAULER'>('MINING');

  const miningStates: MiningFSMState[] = ['Holding', 'Dispatched', 'Traveling', 'Mining', 'Returning'];
  const haulerStates: HaulerFSMState[] = ['Docked', 'Dispatched', 'Traveling', 'Latched', 'Tugging', 'Released', 'Returning'];

  return (
    <div id="fsm-inspector-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-100 uppercase">
            FSM State Engine Inspector
          </h2>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            id="fsm-tab-mining-btn"
            onClick={() => setActiveTab('MINING')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'MINING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Mining Fleet ({miningDrones.length})
          </button>
          <button
            id="fsm-tab-hauler-btn"
            onClick={() => setActiveTab('HAULER')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'HAULER'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Anchor className="w-3.5 h-3.5 text-purple-400" />
            Tug Hauler Fleet ({haulers.length})
          </button>
        </div>
      </div>

      {/* Mining Fleet FSM Stream */}
      {activeTab === 'MINING' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-slate-400 font-mono">
            Mining Drone Loop: <span className="text-amber-300">Holding $\rightarrow$ Dispatched $\rightarrow$ Traveling $\rightarrow$ Mining $\rightarrow$ Returning</span>
          </div>

          <div className="space-y-3">
            {miningDrones.map((drone) => {
              const isSelected = selectedDroneId === drone.id;
              const isBreaker = drone.tier === 2;
              return (
                <div
                  key={drone.id}
                  onClick={() => onSelectDrone(drone.id)}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? isBreaker ? 'bg-pink-950/30 border-pink-500/80 ring-1 ring-pink-500/40' : 'bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isBreaker ? 'bg-pink-500 shadow-sm shadow-pink-500' : 'bg-amber-400'}`}></span>
                      <span className="font-mono text-xs font-semibold text-slate-200">
                        {drone.name}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                        isBreaker
                          ? 'bg-pink-950 text-pink-300 border-pink-800'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {isBreaker ? 'TIER 2 BREAKER' : 'TIER 1 MINER'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span>Missions: <strong className="text-slate-200">{drone.completedMissions}</strong></span>
                      {onToggleDroneTier && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleDroneTier(drone.id);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                            isBreaker
                              ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                              : 'bg-pink-950 text-pink-300 border-pink-800 hover:bg-pink-900'
                          }`}
                        >
                          {isBreaker ? 'Downgrade to Mk I' : 'Upgrade to Breaker'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* FSM Step Process Bar */}
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {miningStates.map((st) => {
                      const isActive = drone.state === st;
                      return (
                        <div
                          key={st}
                          className={`p-1.5 rounded text-center font-mono text-[10px] transition border ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-md animate-pulse'
                              : 'bg-slate-900/80 text-slate-500 border-slate-800'
                          }`}
                        >
                          {st}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tug Hauler Fleet FSM Stream */}
      {activeTab === 'HAULER' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-slate-400 font-mono">
            Tug Hauler Loop: <span className="text-purple-300">Docked $\rightarrow$ Dispatched $\rightarrow$ Traveling $\rightarrow$ Latched $\rightarrow$ Tugging $\rightarrow$ Released $\rightarrow$ Returning</span>
          </div>

          <div className="space-y-3">
            {haulers.map((hauler) => {
              const isSelected = selectedDroneId === hauler.id;
              return (
                <div
                  key={hauler.id}
                  onClick={() => onSelectDrone(hauler.id)}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/80 ring-1 ring-purple-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                      <span className="font-mono text-xs font-semibold text-slate-200">
                        {hauler.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      Tugs Completed: <strong className="text-purple-300">{hauler.totalAsteroidsTugged || 0}</strong>
                    </span>
                  </div>

                  {/* Hauler Step Process Bar */}
                  <div className="grid grid-cols-7 gap-1 mt-2">
                    {haulerStates.map((st) => {
                      const isActive = hauler.state === st;
                      return (
                        <div
                          key={st}
                          className={`p-1 rounded text-center font-mono text-[9px] transition border ${
                            isActive
                              ? 'bg-purple-500 text-slate-950 font-bold border-purple-300 shadow-md animate-pulse'
                              : 'bg-slate-900/80 text-slate-500 border-slate-800'
                          }`}
                        >
                          {st}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
