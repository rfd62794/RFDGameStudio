/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  UnitShape,
  LANE_NAMES,
  OrcUnit,
  BattleResult,
  SHAPE_MATRIX,
  RACE_LEAN,
  GamePhase,
  Unit,
  WEIGHT_FLOOR_BASELINE,
} from "../types";
import { AlertCircle, Flame, Shield, TrendingDown, Swords, CheckCircle } from "lucide-react";

interface WaveLogProps {
  phase: GamePhase;
  forecastedLanes: number[];
  forecastedAttacks: Record<number, OrcUnit[]>;
  battleResults: Record<number, BattleResult>;
  units: Unit[];
  usePaired: boolean;
  onToggleResolver: () => void;
  preSelectedNextLane: number | null;
  wave: number;
  lives: number;
}

export default function WaveLog({
  phase,
  forecastedLanes,
  forecastedAttacks,
  battleResults,
  units,
  usePaired,
  onToggleResolver,
  preSelectedNextLane,
  wave,
  lives,
}: WaveLogProps) {
  
  // Calculate defense strength per lane for forecast explanation
  const laneDefenses = LANE_NAMES.map((_, laneId) => {
    const laneUnits = units.filter(u => u.lane === laneId);
    const strength = laneUnits.reduce((sum, u) => sum + u.currentStrength, 0);
    const weight = 1 / (1 + strength + WEIGHT_FLOOR_BASELINE);
    return { laneId, name: LANE_NAMES[laneId], strength, weight };
  });

  const totalWeight = laneDefenses.reduce((sum, d) => sum + d.weight, 0);

  return (
    <div className="flex flex-col gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow-lg h-full" id="wave-log-panel">
      {/* Header with toggle for Combat Resolver */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5" id="resolver-selector">
        <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-cyan-400" /> Tactical Intelligence
        </span>
        <button
          onClick={onToggleResolver}
          disabled={phase === GamePhase.RESOLVE}
          className={`px-2 py-1 rounded text-[9px] font-mono border font-bold uppercase transition-all ${
            phase === GamePhase.RESOLVE
              ? "bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed"
              : "bg-cyan-950/40 hover:bg-cyan-950 text-cyan-400 border-cyan-800 cursor-pointer"
          }`}
          title="Toggle between Cascading Paired duels and simple Aggregate sum math"
        >
          Resolver: {usePaired ? "Paired Duels" : "Aggregate Sum"}
        </button>
      </div>

      {/* Citadel Integrity Status */}
      <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-mono" id="citadel-lives-status">
        <span className="text-slate-400">Citadel Integrity:</span>
        <span className={`font-bold flex items-center gap-1.5 ${lives <= 5 ? "text-red-500 animate-pulse" : lives <= 10 ? "text-amber-400" : "text-emerald-400"}`}>
          <span className="w-2 h-2 rounded-full bg-current"></span>
          {lives} / 15 Lives Remaining
        </span>
      </div>

      {/* Forecast / Defense Weightings explanations */}
      {(phase === GamePhase.FORECAST || phase === GamePhase.ALLOCATE) && (
        <div className="flex flex-col gap-3" id="forecast-details">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
            <h4 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-amber-500" /> Target Threat Analysis
            </h4>
            
            <p className="text-[10.5px] font-sans text-slate-400 mb-3 leading-relaxed">
              Orcs hunt for fragility. Target probability is inversely proportional to a corridor's total garrison strength: <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded text-[9.5px]">W = 1 / (1 + Defense + {WEIGHT_FLOOR_BASELINE})</code>.
            </p>

            {/* Lane weights chart */}
            <div className="flex flex-col gap-2">
              {laneDefenses.map((d) => {
                const probability = (d.weight / totalWeight) * 100;
                const isThreatened = forecastedLanes.includes(d.laneId);

                return (
                  <div key={d.laneId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={`font-semibold ${isThreatened ? "text-red-400" : "text-slate-300"}`}>
                        {d.name} {isThreatened && "⚠️"}
                      </span>
                      <span className="text-slate-500">
                        HP: {d.strength.toFixed(1)} | W: {d.weight.toFixed(3)} | Prob: {probability.toFixed(0)}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${isThreatened ? "bg-red-500" : "bg-cyan-600/60"}`}
                        style={{ width: `${probability}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active threats list */}
          <div className="flex flex-col gap-2" id="threat-garrisons">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Incoming Orcs</span>
            {forecastedLanes.map((laneId) => {
              const orcs = forecastedAttacks[laneId] || [];
              return (
                <div
                  key={laneId}
                  className="bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-red-400 font-bold uppercase">
                    <span>{LANE_NAMES[laneId]} Corridor</span>
                    <span>{orcs.length} Orcs approaching</span>
                  </div>
                  {/* Orc list */}
                  <div className="flex flex-wrap gap-1.5">
                    {orcs.map((orc, idx) => (
                      <span
                        key={orc.id}
                        className="inline-flex items-center gap-1 bg-red-950/40 px-1.5 py-0.5 rounded text-[9px] font-mono text-red-300 border border-red-900/40"
                      >
                        {orc.shape === UnitShape.CIRCLE && <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>}
                        {orc.shape === UnitShape.SQUARE && <span className="w-1.5 h-1.5 bg-red-400"></span>}
                        {orc.shape === UnitShape.TRIANGLE && (
                          <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-400"></span>
                        )}
                        {orc.shape} ({orc.baseStrength})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pre-selected lane warning */}
          {preSelectedNextLane !== null && (
            <div className="flex flex-col gap-2 mt-2" id="pre-selected-forecast">
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider font-semibold animate-pulse">
                ⚠ Early Sonar Intel: Wave {wave + 1} Target
              </span>
              <div className="bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 font-bold uppercase">
                  <span>{LANE_NAMES[preSelectedNextLane]} Corridor</span>
                  <span className="bg-amber-950 px-1.5 py-0.5 rounded text-[9px] border border-amber-900/40 text-amber-300 font-mono">
                    INCOMING (Wave {wave + 1})
                  </span>
                </div>
                <p className="text-[10px] font-sans text-slate-400 leading-normal">
                  Our long-range sonar has picked up advanced tremors on this corridor. Reinforce defenses here immediately before the next wave arrives!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolve / Aftermath battle results cascading list */}
      {(phase === GamePhase.RESOLVE || phase === GamePhase.AFTERMATH) && (
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[360px] pr-1" id="battle-results-list">
          {Object.keys(battleResults).length === 0 ? (
            <div className="text-center py-12 font-mono text-xs text-slate-500">
              No battle reports compiled. Begin the resolve phase to process attacks.
            </div>
          ) : (
            Object.values(battleResults).map((result) => {
              const laneName = LANE_NAMES[result.lane];
              
              return (
                <div
                  key={`result-lane-${result.lane}`}
                  className={`border rounded-lg p-3 flex flex-col gap-2.5 transition-all ${
                    result.victory
                      ? "bg-emerald-950/20 border-emerald-500/20"
                      : "bg-red-950/25 border-red-500/25"
                  }`}
                  id={`battle-report-card-${result.lane}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-[11px] font-bold text-slate-300 uppercase">
                      {laneName} Corridor Battle
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                        result.victory
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}
                    >
                      {result.victory ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Securing Held
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Breached!
                        </>
                      )}
                    </span>
                  </div>

                  {/* Quick stats summary */}
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Initial Defenders: {result.defenderInitialCount}</span>
                    <span>Initial Attackers: {result.attackerInitialCount}</span>
                  </div>

                  {/* Duels log */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      {usePaired ? "Paired Duel Progression" : "Aggregate Mathematics"}
                    </span>

                    {result.duels.length === 0 ? (
                      <div className="flex items-start gap-1.5 bg-red-950/30 p-2 rounded text-[10.5px] font-mono text-red-400 leading-normal">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold">UNMANNED WALL BREACH:</span> No defender was deployed on this tile. Wall defense multiplier is 0x. Orcs breezed past and breached the line with zero effort!
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {result.duels.map((duel, dIdx) => (
                          <div
                            key={duel.id}
                            className="bg-slate-950/70 p-2 rounded border border-slate-850 text-[10px] font-mono"
                          >
                            {/* Duel participants */}
                            <div className="flex items-center justify-between text-slate-400 mb-1 font-semibold">
                              <span className="text-cyan-400">
                                Defender {duel.defenderShape} (HP {duel.defenderInitialStrength})
                              </span>
                              <span className="text-slate-500">vs</span>
                              <span className="text-red-400">
                                Attacker {duel.attackerShape} (HP {duel.attackerInitialStrength})
                              </span>
                            </div>

                            {/* Math calculation breakdown */}
                            <div className="text-[9px] text-slate-500 border-t border-slate-900/60 pt-1 mt-1 flex flex-col gap-0.5">
                              <div>
                                Attacker: {duel.attackerInitialStrength} * {RACE_LEAN.ORC.toFixed(1)} lean * {SHAPE_MATRIX[duel.attackerShape][duel.defenderShape]} shape = <span className="text-red-400 font-bold">{duel.attackerEffectiveStrength} eff</span>
                              </div>
                              <div>
                                Defender: {duel.defenderInitialStrength} * {RACE_LEAN.PLAYER.toFixed(1)} lean * {SHAPE_MATRIX[duel.defenderShape][duel.attackerShape]} shape {duel.defenderHasWall && "* 2.0x Wall"} = <span className="text-cyan-400 font-bold">{duel.defenderEffectiveStrength} eff</span>
                              </div>
                            </div>

                            {/* Duel result */}
                            <div className="mt-1 text-[9px] font-semibold text-slate-300 flex items-center justify-between bg-slate-900/40 px-1 py-0.5 rounded">
                              <span>Outcome:</span>
                              {duel.outcome === "defender_wins" && (
                                <span className="text-emerald-400">
                                  Defender Wins! Retains {duel.defenderRemainingStrength} HP
                                </span>
                              )}
                              {duel.outcome === "attacker_wins" && (
                                <span className="text-red-400">
                                  Attacker Wins! Retains {duel.attackerRemainingStrength} HP
                                </span>
                              )}
                              {duel.outcome === "both_die" && (
                                <span className="text-amber-500">Mutual Destruction</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Territory Fallout message */}
                  <div className="text-[10px] font-mono mt-1 pt-1.5 border-t border-slate-900 text-slate-400">
                    {result.victory ? (
                      <span className="text-emerald-400">
                        ✓ Tactical success. Corridors maintained. Frontier will advance outward!
                      </span>
                    ) : result.isBreach ? (
                      <span className="text-red-500 font-bold flex flex-col gap-1">
                        <span className="animate-pulse">⚠ CITADEL BREACH!</span>
                        <span className="text-[9px] font-normal text-slate-300 leading-normal">
                          The corridor was completely overrun. {result.livesLost} Orc(s) successfully breached the Citadel, deducting <strong className="text-red-400">{result.livesLost} Citadel Life/Lives</strong>.
                        </span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold">
                        ⚠ Frontier broken. Corridor retreated 1 segment inward!
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
