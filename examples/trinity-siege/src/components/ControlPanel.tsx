/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Unit,
  UnitShape,
  COST_UNIT,
  COST_WALL,
  LANE_NAMES,
  GamePhase,
} from "../types";
import { Shield, Users, ArrowRight, Trash2, Coins, AlertTriangle, Heart } from "lucide-react";

interface ControlPanelProps {
  gold: number;
  wave: number;
  lives: number;
  phase: GamePhase;
  selectedLane: number | null;
  selectedSegment: number | null;
  units: Unit[];
  walls: Record<string, boolean>;
  frontiers: Record<number, number>;
  claiming: Record<number, number | null>;
  onBuyUnit: (shape: UnitShape) => void;
  onBuyWall: () => void;
  onDismantleWall: () => void;
  onDisbandUnit: (unitId: string) => void;
  movingUnitId: string | null;
  onStartMoveUnit: (unitId: string) => void;
  onCompleteMoveUnit: (lane: number, segment: number) => void;
  onCancelMoveUnit: () => void;
  onNextPhase: () => void;
  incomePreview: number;
  unmannedWallsCount: number;
}

export default function ControlPanel({
  gold,
  wave,
  lives,
  phase,
  selectedLane,
  selectedSegment,
  units,
  walls,
  frontiers,
  claiming,
  onBuyUnit,
  onBuyWall,
  onDismantleWall,
  onDisbandUnit,
  movingUnitId,
  onStartMoveUnit,
  onCompleteMoveUnit,
  onCancelMoveUnit,
  onNextPhase,
  incomePreview,
  unmannedWallsCount,
}: ControlPanelProps) {
  
  const tileKey = selectedLane !== null && selectedSegment !== null ? `${selectedLane}-${selectedSegment}` : null;
  const tileHasWall = tileKey ? !!walls[tileKey] : false;
  const tileUnits = selectedLane !== null && selectedSegment !== null
    ? units.filter(u => u.lane === selectedLane && u.segment === selectedSegment)
    : [];

  const isClaimingSegment = selectedLane !== null && selectedSegment !== null && claiming[selectedLane] === selectedSegment;

  const canAffordUnit = gold >= COST_UNIT;
  const canAffordWall = gold >= COST_WALL;

  return (
    <div className="flex flex-col gap-4 w-full bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow-lg" id="control-panel">
      {/* Top Banner: Status Indicators */}
      <div className="grid grid-cols-3 gap-2" id="status-dashboard">
        <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">Gold</span>
            <span className="font-mono text-xs font-bold text-amber-400 flex items-baseline gap-0.5 truncate">
              {gold}g
              <span className="text-[8px] text-emerald-400 font-medium">+{incomePreview}g</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">Wave</span>
            <span className="font-mono text-xs font-bold text-cyan-400 truncate">
              {wave}<span className="text-[9px] text-slate-500 font-normal">/5</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <Heart className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" />
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">Citadel HP</span>
            <span className="font-mono text-xs font-bold text-red-500 truncate">
              {lives}<span className="text-[9px] text-slate-500 font-normal">/15</span>
            </span>
          </div>
        </div>
      </div>

      {/* Unmanned Wall Warnings */}
      {unmannedWallsCount > 0 && phase === GamePhase.ALLOCATE && (
        <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg text-red-400 animate-pulse" id="unmanned-wall-warning">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] font-mono leading-tight">
            <span className="font-bold">CRITICAL WARNING:</span> {unmannedWallsCount} unmanned wall(s) detected. An unmanned wall provides <span className="underline">zero defense</span> and is breached instantly!
          </div>
        </div>
      )}

      {/* Main phase instructions */}
      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800" id="phase-instructions">
        <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Phase: {phase}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 uppercase font-bold tracking-tight">Active</span>
        </h3>
        <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
          {phase === GamePhase.FORECAST && "Scan the tactical map. Outer red wedges outline incoming Orc shapes. Check their weaknesses and formulate your defense plan."}
          {phase === GamePhase.ALLOCATE && "Select owned wedges on the sonar map. Spend gold on Units or Walls, or relocate existing soldiers to guard weak corridors."}
          {phase === GamePhase.RESOLVE && "The siege is underway! Observe the paired duels resolving on the battle ring below. All active battles must resolve."}
          {phase === GamePhase.AFTERMATH && "Victory or fallbacks applied. Held forward territories generate extra taxes. Refit your defenses for the next assault."}
        </p>
      </div>

      {/* Target Tile Deployments */}
      <div className="flex-1 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800" id="tile-actions">
        {selectedLane !== null && selectedSegment !== null ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-tight">
                {LANE_NAMES[selectedLane]} Segment {selectedSegment}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Frontier limit: Seg {frontiers[selectedLane]}
              </span>
            </div>

            {/* If moving a unit, display complete action */}
            {movingUnitId !== null ? (
              <div className="flex flex-col gap-2 bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-lg">
                <span className="text-[11px] font-mono text-cyan-300">
                  Relocating unit to this position...
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onCompleteMoveUnit(selectedLane, selectedSegment)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs py-1.5 px-3 rounded font-bold transition-all"
                  >
                    Confirm Move
                  </button>
                  <button
                    onClick={onCancelMoveUnit}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono text-xs py-1.5 px-3 rounded transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : phase === GamePhase.ALLOCATE ? (
              <>
                {isClaimingSegment ? (
                  <div className="flex flex-col gap-2.5 bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-lg text-cyan-400">
                    <span className="text-[10.5px] font-mono uppercase tracking-wider font-bold">📡 Claiming Beachhead</span>
                    <p className="text-[10px] font-sans text-slate-400 leading-normal">
                      This segment is currently under claim. You cannot recruit troops or construct walls here yet. You must keep a player unit garrisoned here (by moving an existing defender here) to secure it at aftermath!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Build Options */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Construct defensive wall</span>
                      {tileHasWall ? (
                        <div className="flex items-center justify-between bg-amber-950/20 border border-amber-500/20 px-3 py-2 rounded-lg">
                          <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" /> Wall built on tile
                          </span>
                          <button
                            onClick={onDismantleWall}
                            className="text-red-400 hover:text-red-300 text-[10px] font-mono underline"
                            title="Dismantle wall (no refund)"
                          >
                            Dismantle
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={onBuyWall}
                          disabled={!canAffordWall}
                          className={`w-full py-2 px-3 rounded font-mono text-xs font-bold transition-all flex items-center justify-between ${
                            canAffordWall
                              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md shadow-amber-500/10"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4" /> Build Defensive Wall
                          </span>
                          <span>8 Gold</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Recruit Soldiers</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Circle Unit */}
                        <button
                          onClick={() => onBuyUnit(UnitShape.CIRCLE)}
                          disabled={!canAffordUnit}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded border transition-all ${
                            canAffordUnit
                              ? "bg-slate-900 hover:bg-slate-800 border-cyan-800 text-cyan-300 cursor-pointer"
                              : "bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed"
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-cyan-400 mb-1"></span>
                          <span className="text-[10px] font-mono font-bold leading-tight">Vanguard</span>
                          <span className="text-[8px] font-mono text-slate-400 mt-0.5">5 Gold</span>
                        </button>

                        {/* Square Unit */}
                        <button
                          onClick={() => onBuyUnit(UnitShape.SQUARE)}
                          disabled={!canAffordUnit}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded border transition-all ${
                            canAffordUnit
                              ? "bg-slate-900 hover:bg-slate-800 border-cyan-800 text-cyan-300 cursor-pointer"
                              : "bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed"
                          }`}
                        >
                          <span className="w-3 h-3 border border-cyan-400 mb-1"></span>
                          <span className="text-[10px] font-mono font-bold leading-tight">Phalanx</span>
                          <span className="text-[8px] font-mono text-slate-400 mt-0.5">5 Gold</span>
                        </button>

                        {/* Triangle Unit */}
                        <button
                          onClick={() => onBuyUnit(UnitShape.TRIANGLE)}
                          disabled={!canAffordUnit}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded border transition-all ${
                            canAffordUnit
                              ? "bg-slate-900 hover:bg-slate-800 border-cyan-800 text-cyan-300 cursor-pointer"
                              : "bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed"
                          }`}
                        >
                          <span className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-cyan-400 mb-1"></span>
                          <span className="text-[10px] font-mono font-bold leading-tight">Skirmisher</span>
                          <span className="text-[8px] font-mono text-slate-400 mt-0.5">5 Gold</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Garrison List */}
                <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-900 pt-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Garrisoned Troops ({tileUnits.length})</span>
                    <span className="text-[9px] text-slate-600 lowercase font-normal">click to move or disband</span>
                  </span>

                  {tileUnits.length > 0 ? (
                    <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {tileUnits.map((unit) => (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            {unit.shape === UnitShape.CIRCLE && <span className="w-2.5 h-2.5 rounded-full border border-cyan-400"></span>}
                            {unit.shape === UnitShape.SQUARE && <span className="w-2.5 h-2.5 border border-cyan-400"></span>}
                            {unit.shape === UnitShape.TRIANGLE && <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-cyan-400"></span>}
                            <span className="font-mono text-[11px] font-semibold text-slate-300 uppercase">
                              {unit.shape} ({unit.currentStrength} HP)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onStartMoveUnit(unit.id)}
                              className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 hover:bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-900"
                            >
                              Move
                            </button>
                            <button
                              onClick={() => onDisbandUnit(unit.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Disband Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-slate-600 py-2 text-center border border-dashed border-slate-800/80 rounded">
                      Empty segment garrison.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6 font-mono text-[11px] text-slate-500">
                Troop recruitment and wall construction is only permitted during the <span className="text-amber-500 font-bold uppercase">Allocate</span> phase.
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Users className="w-8 h-8 text-slate-700 mb-2" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              No segment selected
            </span>
            <p className="text-[10px] font-sans text-slate-500 max-w-[200px] leading-relaxed">
              Click on an owned sector segment (within the bright borders) on the tactical map to deploy troops, construct walls, or relocate defenses.
            </p>
          </div>
        )}
      </div>

      {/* Next Phase Call to Action Button */}
      <button
        onClick={onNextPhase}
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 transition-all active:scale-[0.98]"
        id="phase-trigger-button"
      >
        {phase === GamePhase.FORECAST && "Initialize Deployment Phase"}
        {phase === GamePhase.ALLOCATE && "Lock In Defenses & Resolve Battles"}
        {phase === GamePhase.RESOLVE && "Proceed to Aftermath Evaluation"}
        {phase === GamePhase.AFTERMATH && "Collect gold & Advance Wave"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
