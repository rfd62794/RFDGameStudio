import React from 'react';
import { Asteroid, Drone } from '../types';
import { Radar, Anchor, Zap, Crosshair } from 'lucide-react';

interface DetectionRadarPanelProps {
  asteroids: Asteroid[];
  miningDrones: Drone[];
  haulers: Drone[];
  selectedAsteroidId: string | null;
  onSelectAsteroid: (id: string | null) => void;
  onManualMiningDispatch: (droneId: string, asteroidId: string) => void;
  onManualHaulerTug: (haulerId: string, asteroidId: string) => void;
  ring1OuterRadius: number;
}

export const DetectionRadarPanel: React.FC<DetectionRadarPanelProps> = ({
  asteroids,
  miningDrones,
  haulers,
  selectedAsteroidId,
  onSelectAsteroid,
  onManualMiningDispatch,
  onManualHaulerTug,
  ring1OuterRadius,
}) => {
  // Detected Ring 1 Targets (Ready for Mining Drones)
  const ring1Targets = asteroids.filter(
    (a) => a.isDetected && !a.isDepleted && a.orbitRadius <= ring1OuterRadius
  );

  // Detected Ring 2 Targets (Require Tug Hauler to pull into Ring 1)
  const ring2Targets = asteroids.filter(
    (a) => a.ring === 2 && a.isDetected && !a.isDepleted && a.orbitRadius > ring1OuterRadius
  );

  // Available Idle Drones
  const idleMiners = miningDrones.filter((d) => d.state === 'Holding');
  const idleHaulers = haulers.filter((h) => h.state === 'Docked');

  return (
    <div id="detection-radar-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Panel Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-100 uppercase">
            Radar Detection & Target Dispatch Queue
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
            R1 Targets: {ring1Targets.length}
          </span>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/50">
            R2 Tug Queue: {ring2Targets.length}
          </span>
        </div>
      </div>

      {/* Ring 2 Medium Asteroids Queue (Requires Tug) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono text-purple-300">
          <span className="flex items-center gap-1.5 font-bold">
            <Anchor className="w-3.5 h-3.5 text-purple-400" />
            RING 2 MEDIUM ASTEROIDS (Requires Tug Hauler)
          </span>
          <span className="text-[11px] text-slate-400">
            Idle Haulers: {idleHaulers.length}
          </span>
        </div>

        {ring2Targets.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-center text-xs font-mono text-slate-500">
            Scout scanning Ring 2 for Medium Asteroids...
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {ring2Targets.map((target) => {
              const isSelected = selectedAsteroidId === target.id;
              const isGasBearing = (target.gasAmount || 0) > 0;
              return (
                <div
                  key={target.id}
                  onClick={() => onSelectAsteroid(target.id)}
                  className={`p-2.5 rounded-lg border transition flex items-center justify-between font-mono text-xs cursor-pointer ${
                    isSelected
                      ? isGasBearing ? 'bg-pink-950/40 border-pink-500 text-pink-200' : 'bg-purple-950/40 border-purple-500 text-purple-200'
                      : isGasBearing ? 'bg-slate-950 border-pink-900/60 hover:border-pink-700 text-slate-300' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded ${isGasBearing ? 'bg-pink-500 shadow-sm shadow-pink-500' : 'bg-purple-400'}`}></span>
                      <span className={isGasBearing ? 'text-pink-300' : 'text-purple-300'}>{target.id}</span>
                      {isGasBearing && (
                        <span className="text-[9px] bg-pink-950 text-pink-300 border border-pink-800 px-1.5 py-0.2 rounded font-bold">
                          H3 GAS CORE ({target.gasAmount}MT)
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Radius: {Math.round(target.orbitRadius)}px | Action: {isGasBearing ? 'Tier 2 Breaker In-Place Drill' : 'Hauler Tug to Ring 1'}
                    </span>
                  </div>

                  {/* Manual Action Button */}
                  {target.isTargeted ? (
                    <span className={`text-[10px] px-2 py-1 rounded border animate-pulse ${
                      isGasBearing ? 'text-pink-300 bg-pink-950/80 border-pink-800' : 'text-purple-400 bg-purple-950/80 border-purple-800'
                    }`}>
                      {isGasBearing ? 'Breaker Drilling' : 'Tug Dispatched'}
                    </span>
                  ) : isGasBearing ? (
                    <span className="text-[10px] text-pink-400 font-bold bg-pink-950/60 px-2 py-1 rounded border border-pink-800">
                      Auto Breaker Queue
                    </span>
                  ) : idleHaulers.length > 0 ? (
                    <button
                      id={`manual-tug-btn-${target.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onManualHaulerTug(idleHaulers[0].id, target.id);
                      }}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold rounded text-[10px] flex items-center gap-1 transition"
                    >
                      <Anchor className="w-3 h-3" /> Tug to R1
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">No Haulers Free</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ring 1 Targets Queue (Mining Drone Ready) */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between text-xs font-mono text-amber-300">
          <span className="flex items-center gap-1.5 font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            RING 1 MINING TARGETS (Direct Extraction)
          </span>
          <span className="text-[11px] text-slate-400">
            Idle Miners: {idleMiners.length}
          </span>
        </div>

        {ring1Targets.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-center text-xs font-mono text-slate-500">
            No active targets in Ring 1 range. Tug medium asteroids from Ring 2 or wait for Scout.
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {ring1Targets.map((target) => {
              const isSelected = selectedAsteroidId === target.id;
              return (
                <div
                  key={target.id}
                  onClick={() => onSelectAsteroid(target.id)}
                  className={`p-2.5 rounded-lg border transition flex items-center justify-between font-mono text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      {target.id} {target.isMedium && '(Tugged Medium)'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Radius: {Math.round(target.orbitRadius)}px | Metal: {target.metalAmount} MT
                    </span>
                  </div>

                  {target.isTargeted ? (
                    <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-1 rounded border border-amber-800 animate-pulse">
                      Mining Active
                    </span>
                  ) : idleMiners.length > 0 ? (
                    <button
                      id={`manual-mine-btn-${target.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onManualMiningDispatch(idleMiners[0].id, target.id);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] flex items-center gap-1 transition"
                    >
                      <Crosshair className="w-3 h-3" /> Mine
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">No Miners Free</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
