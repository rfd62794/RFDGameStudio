import React, { useState } from 'react';
import { DefenseForce, TerritoryCell, UnitState } from '../types';
import { ARCHETYPES } from '../data/archetypes';
import { ChessIcon, RankBadge } from '../components/ChessIcon';
import { UnitCard as SharedUnitCard } from '../components/UnitCard';
import { calculateSynergies } from '../utils/combatEngine';
import { soundFx } from '../utils/audio';
import {
  Shield,
  Crown,
  Lock,
  Trash2,
  Zap,
  Swords,
  ShieldAlert,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';

interface ForcesScreenProps {
  units: UnitState[];
  defenseForces?: DefenseForce[];
  maxSquadSize: number;
  kingUnitId: string | null;
  squadOutflowThisTurn?: Record<string, number>;
  cells?: TerritoryCell[];
  onToggleSquadSlot: (unitId: string) => void;
  onToggleEscort: (unitId: string) => void;
  onSellUnit: (unitId: string) => void;
  onTransferUnit?: (unitId: string, targetSquadId: string | null) => boolean;
  onAssignSteward?: (unitId: string, dfId: string) => void;
  onRecallSteward?: (dfId: string) => void;
}

export function ForcesScreen({
  units,
  defenseForces = [],
  maxSquadSize,
  kingUnitId,
  squadOutflowThisTurn = {},
  cells = [],
  onToggleSquadSlot,
  onToggleEscort,
  onSellUnit,
  onTransferUnit,
  onAssignSteward,
  onRecallSteward,
}: ForcesScreenProps) {
  // Local state for selecting which squad/force to view and manage ('all' | 'forward' | df.id)
  const [selectedSquadId, setSelectedSquadId] = useState<string>('all');
  const [transferringUnitId, setTransferringUnitId] = useState<string | null>(null);
  const [assigningStewardDfId, setAssigningStewardDfId] = useState<string | null>(null);

  // Helper to get units for a specific squadId
  const getSquadUnits = (squadId: string) => {
    if (squadId === 'forward') {
      return units.filter(
        (u) => u.squadId === 'forward' || (u.squadSlot !== null && u.squadSlot !== undefined && (!u.squadId || u.squadId === 'forward'))
      );
    }
    const df = defenseForces.find((d) => d.id === squadId);
    if (df) {
      return df.units || [];
    }
    return units.filter((u) => u.squadId === squadId);
  };

  const forwardUnits = getSquadUnits('forward');
  const benchUnits = units.filter(
    (u) => (u.squadSlot === null || u.squadSlot === undefined) && (!u.squadId || u.squadId === 'bench')
  );

  const totalDefenseUnits = defenseForces.reduce((acc, df) => acc + (df.units?.length || 0), 0);
  const totalUnitsCount = forwardUnits.length + totalDefenseUnits + benchUnits.length;

  const selectedForceUnits = selectedSquadId === 'all' ? [] : getSquadUnits(selectedSquadId);
  const activeSynergies = calculateSynergies(selectedForceUnits);

  const activeSquadOutflow = squadOutflowThisTurn[selectedSquadId] || 0;
  const isTransferCapped = activeSquadOutflow >= 1;

  const selectedForceName =
    selectedSquadId === 'all'
      ? 'All Squads Overview'
      : selectedSquadId === 'forward'
      ? 'Forward Vanguard Squad'
      : defenseForces.find((df) => df.id === selectedSquadId)?.name || 'Defense Force';

  return (
    <div className="flex flex-col gap-6">
      {/* FORCES SELECTOR PANEL */}
      <section className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif flex items-center gap-2">
              <Swords className="w-4 h-4" /> War Command Forces ({1 + defenseForces.length} Active Squads)
            </h2>
            <p className="text-[11px] text-zinc-400">
              Review and manage all active forces, defend garrisons, transfer troops, or assign escorts.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Active View: <strong className="text-amber-300">{selectedForceName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* ALL SQUADS OVERVIEW CARD */}
          <div
            onClick={() => setSelectedSquadId('all')}
            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              selectedSquadId === 'all'
                ? 'bg-purple-950/50 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
                : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-200 font-serif flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" /> All Squads Overview
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-600/30">
                  {totalUnitsCount} Total
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">Review all forward, defending, and bench units at once.</p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-zinc-500 flex justify-between items-center border-t border-zinc-800/80 pt-1.5">
              <span>Hotkey [0 / `]</span>
              <span className="text-purple-300 font-bold">{1 + defenseForces.length} Squads</span>
            </div>
          </div>

          {/* Forward Vanguard Force Card */}
          <div
            onClick={() => setSelectedSquadId('forward')}
            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              selectedSquadId === 'forward'
                ? 'bg-amber-950/50 border-amber-500 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-200 font-serif flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5 text-amber-400" /> Forward Squad
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-600/30">
                  {forwardUnits.length}/{maxSquadSize}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">Primary offensive taskforce for field battles.</p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-zinc-500 flex justify-between items-center border-t border-zinc-800/80 pt-1.5">
              <span>Hotkey [1]</span>
              {(squadOutflowThisTurn['forward'] || 0) >= 1 && (
                <span className="text-rose-400 font-bold">1/1 Outflow Used</span>
              )}
            </div>
          </div>

          {/* Defense Forces List */}
          {defenseForces.map((df, idx) => {
            const dfUnits = df.units || [];
            const isSelected = selectedSquadId === df.id;
            const outflow = squadOutflowThisTurn[df.id] || 0;
            const targetCell = cells.find((c) => c.id === df.cellId);
            const loyalty = df.loyalty ?? 100;
            const loyaltyColor =
              loyalty > 70
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/60'
                : loyalty > 30
                ? 'text-amber-400 border-amber-500/30 bg-amber-950/60'
                : 'text-rose-400 border-rose-500/30 bg-rose-950/60';
            const barBg = loyalty > 70 ? 'bg-emerald-500' : loyalty > 30 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div
                key={df.id}
                onClick={() => setSelectedSquadId(df.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/50 border-blue-500 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/50'
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-200 font-serif flex items-center gap-1 truncate">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {df.name}
                    </span>
                    <span className="text-[10px] font-mono text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-600/30">
                      {dfUnits.length}/{maxSquadSize}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 gap-2">
                    <span className="truncate">Stationed at {targetCell?.name || 'District Cell'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${loyaltyColor}`}>
                        Loyalty {loyalty}%
                      </span>
                      <span className="text-[10px] font-mono text-zinc-300 bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-800">
                        Allegiance {targetCell?.publicOpinion ?? 50}%
                      </span>
                    </div>
                  </div>
                  {/* Loyalty progress bar */}
                  <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden border border-zinc-800">
                    <div className={`h-full transition-all duration-300 ${barBg}`} style={{ width: `${loyalty}%` }} />
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-zinc-500 flex justify-between items-center border-t border-zinc-800/80 pt-1.5">
                  <span>Hotkey [{idx + 2}]</span>
                  {outflow >= 1 && <span className="text-rose-400 font-bold">1/1 Outflow Used</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ALL SQUADS OVERVIEW MODE */}
      {selectedSquadId === 'all' ? (
        <div className="space-y-6">
          {/* FORWARD VANGUARD SECTION */}
          <section className="bg-zinc-900/90 border border-amber-500/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-serif">
                  Forward Vanguard Squad ({forwardUnits.length}/{maxSquadSize})
                </h2>
              </div>
              <span className="text-xs font-mono text-amber-400">Primary Offensive Squad</span>
            </div>

            {forwardUnits.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-500 text-xs">
                Forward squad is currently empty. Assign units from the bench or transfer from a defending squad.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {forwardUnits.map((unit) => (
                  <UnitCard
                    key={`fwd_${unit.id}`}
                    unit={unit}
                    isKing={unit.id === kingUnitId || unit.isKing}
                    isInSquad={true}
                    isTransferCapped={(squadOutflowThisTurn['forward'] || 0) >= 1}
                    isTransferring={transferringUnitId === unit.id}
                    defenseForces={defenseForces}
                    currentSquadId="forward"
                    maxSquadSize={maxSquadSize}
                    forwardUnitsCount={forwardUnits.length}
                    onToggleSquad={() => onToggleSquadSlot(unit.id)}
                    onSell={() => onSellUnit(unit.id)}
                    onToggleEscort={() => onToggleEscort(unit.id)}
                    onStartTransfer={() => setTransferringUnitId(transferringUnitId === unit.id ? null : unit.id)}
                    onCompleteTransfer={(targetSquadId) => {
                      if (onTransferUnit) {
                        const success = onTransferUnit(unit.id, targetSquadId);
                        if (success) soundFx.playBuy();
                      }
                      setTransferringUnitId(null);
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* DEFENDING SQUADS SECTIONS */}
          {defenseForces.map((df) => {
            const dfUnits = df.units || [];
            const targetCell = cells.find((c) => c.id === df.cellId);
            const dfSynergies = calculateSynergies(dfUnits);
            const loyalty = df.loyalty ?? 100;
            const loyaltyColor =
              loyalty > 70
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/60'
                : loyalty > 30
                ? 'text-amber-400 border-amber-500/30 bg-amber-950/60'
                : 'text-rose-400 border-rose-500/30 bg-rose-950/60';

            return (
              <section key={df.id} className="bg-zinc-900/90 border border-blue-500/40 rounded-2xl p-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between mb-3 border-b border-zinc-800 pb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldAlert className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-blue-200 font-serif">
                      {df.name} ({dfUnits.length}/{maxSquadSize})
                    </h2>
                    <span className="text-xs text-blue-300 font-mono bg-blue-950/80 px-2 py-0.5 rounded border border-blue-600/30">
                      Stationed at {targetCell?.name || 'Exposed Border'}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${loyaltyColor}`}>
                      Loyalty: {loyalty}%
                    </span>
                    <span className="text-xs font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      Allegiance: {targetCell?.publicOpinion ?? 50}%
                    </span>
                  </div>

                  {/* Active Synergies summary for this DF */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {dfSynergies.filter((s) => s.isActive).map((s) => (
                      <span key={s.type} className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded">
                        ⚡ {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Permanent Leader & Steward Status Bar */}
                {(() => {
                  const autoGenLeader = targetCell?.autoGenLeaderUnit || dfUnits.find((u) => u.id === df.autoGenLeaderId);
                  const stewardUnit = dfUnits.find((u) => u.id === df.stewardUnitId);

                  return (
                    <>
                      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-zinc-400">District Permanent Leader:</span>
                          {autoGenLeader ? (
                            <span className="text-amber-300 font-bold">
                              {autoGenLeader.name} ({autoGenLeader.archetype.toUpperCase()}, {autoGenLeader.rank}, {autoGenLeader.zodiac})
                            </span>
                          ) : (
                            <span className="text-zinc-500 italic">District Warden</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-zinc-400">Assigned Steward:</span>
                          {stewardUnit ? (
                            <div className="flex items-center gap-2">
                              <span className="text-blue-300 font-bold">
                                {stewardUnit.name} ({stewardUnit.archetype.toUpperCase()})
                              </span>
                              <button
                                onClick={() => onRecallSteward?.(df.id)}
                                className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/40 rounded text-[10px] font-sans font-semibold"
                              >
                                Recall Steward
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 italic">Unassigned</span>
                              {benchUnits.length > 0 && (
                                <button
                                  onClick={() => setAssigningStewardDfId(assigningStewardDfId === df.id ? null : df.id)}
                                  className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 rounded text-[10px] font-sans font-semibold"
                                >
                                  Assign Steward...
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {assigningStewardDfId === df.id && (
                        <div className="p-3 bg-zinc-950 border border-amber-500/50 rounded-xl mb-3 space-y-2 text-xs font-mono">
                          <div className="text-amber-400 font-bold">Select Roster Unit to Assign as Steward to {df.name}:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {benchUnits.map((bu) => (
                              <button
                                key={bu.id}
                                onClick={() => {
                                  if (onAssignSteward) {
                                    onAssignSteward(bu.id, df.id);
                                  } else if (onTransferUnit) {
                                    onTransferUnit(bu.id, df.id);
                                  }
                                  setAssigningStewardDfId(null);
                                }}
                                className="p-2 bg-zinc-900 hover:bg-amber-950/60 border border-zinc-800 hover:border-amber-500/50 rounded flex items-center justify-between text-left text-zinc-200"
                              >
                                <span>{bu.name} ({bu.archetype})</span>
                                <span className="text-amber-400 font-bold">Assign →</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {dfUnits.length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-500 text-xs">
                    No defending units stationed in this district cell.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {dfUnits.map((unit) => (
                      <UnitCard
                        key={`df_${df.id}_${unit.id}`}
                        unit={unit}
                        isKing={unit.id === df.kingUnitId || unit.isKing}
                        isInSquad={true}
                        isTransferCapped={(squadOutflowThisTurn[df.id] || 0) >= 1}
                        isTransferring={transferringUnitId === unit.id}
                        defenseForces={defenseForces}
                        currentSquadId={df.id}
                        maxSquadSize={maxSquadSize}
                        forwardUnitsCount={forwardUnits.length}
                        onToggleSquad={() => onToggleSquadSlot(unit.id)}
                        onSell={() => onSellUnit(unit.id)}
                        onToggleEscort={() => onToggleEscort(unit.id)}
                        onStartTransfer={() => setTransferringUnitId(transferringUnitId === unit.id ? null : unit.id)}
                        onCompleteTransfer={(targetSquadId) => {
                          if (onTransferUnit) {
                            const success = onTransferUnit(unit.id, targetSquadId);
                            if (success) soundFx.playBuy();
                          }
                          setTransferringUnitId(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {/* RESERVE BENCH SECTION */}
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-serif mb-3">
              Reserve Bench ({benchUnits.length})
            </h2>

            {benchUnits.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-zinc-800 bg-zinc-950/30 text-zinc-600 text-xs">
                Reserve bench is empty.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {benchUnits.map((unit) => (
                  <UnitCard
                    key={`all_bench_${unit.id}`}
                    unit={unit}
                    isKing={unit.id === kingUnitId || unit.isKing}
                    isInSquad={false}
                    isTransferCapped={false}
                    isTransferring={transferringUnitId === unit.id}
                    defenseForces={defenseForces}
                    currentSquadId="bench"
                    maxSquadSize={maxSquadSize}
                    forwardUnitsCount={forwardUnits.length}
                    onToggleSquad={() => onToggleSquadSlot(unit.id)}
                    onSell={() => onSellUnit(unit.id)}
                    onToggleEscort={() => onToggleEscort(unit.id)}
                    onStartTransfer={() => setTransferringUnitId(transferringUnitId === unit.id ? null : unit.id)}
                    onCompleteTransfer={(targetSquadId) => {
                      if (onTransferUnit) {
                        const success = onTransferUnit(unit.id, targetSquadId);
                        if (success) soundFx.playBuy();
                      }
                      setTransferringUnitId(null);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* SINGLE SQUAD FOCUSED VIEW */
        <>
          {/* SYNERGIES & CAPACITY PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Synergies */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Active Synergies
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">({selectedForceName})</span>
                </h2>
                <div className="space-y-2">
                  {activeSynergies.map((s) => (
                    <div
                      key={s.type}
                      className={`p-2 rounded-lg border text-xs transition ${
                        s.isActive
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : 'bg-zinc-950/50 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span>{s.name}</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-zinc-800">
                          {s.currentCount}/{s.countNeeded}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Capacity Overview & Outflow Warnings */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-serif flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" /> Force Capacity & Outflow
                  </h2>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {selectedForceUnits.length}/{maxSquadSize} Units
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Each force has a transfer outflow cap of <strong>1 unit per turn</strong> to enforce strategic positioning.
                </p>

                {isTransferCapped && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-600/40 rounded-lg text-xs text-rose-300 font-mono">
                    ⚠️ Outflow Cap Reached: 1 unit has already transferred out from this squad this turn.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE FORCE UNITS SECTION */}
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-serif flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" /> {selectedForceName} ({selectedForceUnits.length}/{maxSquadSize})
              </h2>
              {isTransferCapped && (
                <span className="text-xs text-rose-400 font-mono font-bold bg-rose-950 px-2 py-0.5 rounded border border-rose-600/40">
                  Transfer Cap Reached (1/1 Outbound used)
                </span>
              )}
            </div>

            {selectedForceUnits.length === 0 ? (
              <div className="p-8 text-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-500">
                <p className="text-xs">No units assigned to {selectedForceName}. Assign units from the Reserve Bench or transfer from another force.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {selectedForceUnits.map((unit) => {
                  const dfKingId = defenseForces.find((df) => df.id === selectedSquadId)?.kingUnitId;
                  return (
                    <UnitCard
                      key={`selected_${selectedSquadId}_${unit.id}`}
                      unit={unit}
                      isKing={unit.id === kingUnitId || unit.id === dfKingId || unit.isKing}
                      isInSquad={true}
                      isTransferCapped={isTransferCapped}
                      isTransferring={transferringUnitId === unit.id}
                      defenseForces={defenseForces}
                      currentSquadId={selectedSquadId}
                      maxSquadSize={maxSquadSize}
                      forwardUnitsCount={forwardUnits.length}
                      onToggleSquad={() => onToggleSquadSlot(unit.id)}
                      onSell={() => onSellUnit(unit.id)}
                      onToggleEscort={() => onToggleEscort(unit.id)}
                      onStartTransfer={() => setTransferringUnitId(transferringUnitId === unit.id ? null : unit.id)}
                      onCompleteTransfer={(targetSquadId) => {
                        if (onTransferUnit) {
                          const success = onTransferUnit(unit.id, targetSquadId);
                          if (success) soundFx.playBuy();
                        }
                        setTransferringUnitId(null);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* BENCH / RESERVE SECTION */}
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-serif mb-3">
              Reserve Bench ({benchUnits.length})
            </h2>

            {benchUnits.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-zinc-800 bg-zinc-950/30 text-zinc-600 text-xs">
                Reserve bench is empty.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {benchUnits.map((unit) => (
                  <UnitCard
                    key={`focused_bench_${unit.id}`}
                    unit={unit}
                    isKing={unit.id === kingUnitId || unit.isKing}
                    isInSquad={false}
                    isTransferCapped={false}
                    isTransferring={transferringUnitId === unit.id}
                    defenseForces={defenseForces}
                    currentSquadId="bench"
                    maxSquadSize={maxSquadSize}
                    forwardUnitsCount={forwardUnits.length}
                    onToggleSquad={() => onToggleSquadSlot(unit.id)}
                    onSell={() => onSellUnit(unit.id)}
                    onToggleEscort={() => onToggleEscort(unit.id)}
                    onStartTransfer={() => setTransferringUnitId(transferringUnitId === unit.id ? null : unit.id)}
                    onCompleteTransfer={(targetSquadId) => {
                      if (onTransferUnit) {
                        const success = onTransferUnit(unit.id, targetSquadId);
                        if (success) soundFx.playBuy();
                      }
                      setTransferringUnitId(null);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// UnitCard component inside ForcesScreen
const UnitCard: React.FC<{
  unit: UnitState;
  isKing: boolean;
  isInSquad: boolean;
  isTransferCapped: boolean;
  isTransferring: boolean;
  defenseForces: DefenseForce[];
  currentSquadId: string;
  maxSquadSize: number;
  forwardUnitsCount: number;
  onToggleSquad: () => void;
  onSell: () => void;
  onToggleEscort: () => void;
  onStartTransfer: () => void;
  onCompleteTransfer: (targetSquadId: string | null) => void;
}> = ({
  unit,
  isKing,
  isInSquad,
  isTransferCapped,
  isTransferring,
  defenseForces,
  currentSquadId,
  maxSquadSize,
  forwardUnitsCount,
  onToggleSquad,
  onSell,
  onToggleEscort,
  onStartTransfer,
  onCompleteTransfer,
}) => {
  const info = ARCHETYPES[unit.archetype];
  const [confirmingBenchKing, setConfirmingBenchKing] = useState(false);
  const [confirmingTransferKingBench, setConfirmingTransferKingBench] = useState(false);

  const handleToggleSquadClick = () => {
    if (isInSquad) {
      if (isKing) {
        if (!confirmingBenchKing) {
          setConfirmingBenchKing(true);
          return;
        }
      }
      setConfirmingBenchKing(false);
      onToggleSquad();
    } else {
      // Assigning from bench/roster: trigger squad selection menu
      onStartTransfer();
    }
  };

  const handleTransferToBenchClick = () => {
    if (isInSquad && isKing) {
      if (!confirmingTransferKingBench) {
        setConfirmingTransferKingBench(true);
        return;
      }
    }
    setConfirmingTransferKingBench(false);
    onCompleteTransfer(null);
  };

  // Compute target squads with available space
  const isForwardAvailable = currentSquadId !== 'forward' && forwardUnitsCount < maxSquadSize;
  const availableDefenseForces = defenseForces.filter(
    (df) => df.id !== currentSquadId && (df.units?.length || 0) < maxSquadSize
  );
  const hasAnySquadSpace = isForwardAvailable || availableDefenseForces.length > 0;

  return (
    <SharedUnitCard
      unit={unit}
      isKing={isKing}
      className={
        isKing
          ? 'bg-gradient-to-b from-amber-950/70 to-zinc-950 ring-1 ring-amber-500/50'
          : unit.hasHonorScar
          ? 'bg-gradient-to-b from-rose-950/50 to-zinc-950'
          : ''
      }
    >
      <div>
        {/* Permanence Lock Indicator */}
        {unit.isPermanent && (
          <div
            className="text-blue-400 bg-blue-950/80 border border-blue-500/40 p-1 rounded-md text-[10px] flex items-center gap-1 mb-2"
            title="PERMANENT VETERAN: Cannot be sold or rerolled away"
          >
            <Lock className="w-3 h-3" />
            <span>Permanent Veteran</span>
          </div>
        )}

        {/* Honor Scar Alert */}
        {unit.hasHonorScar && (
          <div className="bg-rose-950/60 border border-rose-600/40 rounded p-1.5 text-[10px] text-rose-300 font-medium mb-2 flex items-center gap-1">
            <ChessIcon type="scar" className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Honor Scar (+30% ATK on Headquarters reclamation)</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-900/80 p-1.5 rounded text-[10px] font-mono mb-2 text-zinc-300">
          <div>HP: <span className="text-emerald-400 font-bold">{unit.stats.hp}</span></div>
          <div>ATK: <span className="text-rose-400 font-bold">{unit.stats.atk}</span></div>
          <div>DEF: <span className="text-blue-400 font-bold">{unit.stats.def}</span></div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="space-y-1.5 mt-2">
        {/* Knight Escort Toggle */}
        {unit.archetype === 'knight' && isInSquad && (
          <button
            onClick={onToggleEscort}
            className={`w-full py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition border ${
              unit.isEscort
                ? 'bg-blue-600 border-blue-400 text-zinc-100 shadow-sm'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            {unit.isEscort ? 'Escort Assigned' : 'Assign Escort'}
          </button>
        )}

        {/* Transfer Button */}
        {isInSquad && (
          <button
            onClick={() => {
              setConfirmingBenchKing(false);
              setConfirmingTransferKingBench(false);
              onStartTransfer();
            }}
            disabled={isTransferCapped && !isTransferring}
            className="w-full py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition border bg-amber-950/60 hover:bg-amber-900/80 border-amber-500/40 text-amber-200 disabled:opacity-40"
          >
            <ArrowRightLeft className="w-3 h-3" />
            {isTransferring ? 'Cancel Transfer' : 'Transfer Unit'}
          </button>
        )}

        {/* Transfer Submenu Overlay */}
        {isTransferring && (
          <div className="p-2 bg-zinc-900 border border-amber-500/50 rounded-lg space-y-1 text-[10px] font-mono animate-fade-in">
            <span className="text-amber-400 font-bold block mb-1">
              {isInSquad ? 'Select Destination:' : 'Assign to Squad:'}
            </span>

            {/* Show Forward Squad only if it has space */}
            {isForwardAvailable && (
              <button
                onClick={() => {
                  setConfirmingTransferKingBench(false);
                  onCompleteTransfer('forward');
                }}
                className="w-full text-left p-1 bg-zinc-950 hover:bg-amber-950/60 rounded text-amber-200 flex items-center justify-between"
              >
                <span>→ Forward Squad</span>
                <span className="text-[9px] text-zinc-400 font-mono">({forwardUnitsCount}/{maxSquadSize})</span>
              </button>
            )}

            {/* Show Defense Forces with space */}
            {availableDefenseForces.map((df) => (
              <button
                key={df.id}
                onClick={() => {
                  setConfirmingTransferKingBench(false);
                  onCompleteTransfer(df.id);
                }}
                className="w-full text-left p-1 bg-zinc-950 hover:bg-blue-950/60 rounded text-blue-200 flex items-center justify-between"
              >
                <span className="truncate">→ {df.name}</span>
                <span className="text-[9px] text-zinc-400 font-mono">({df.units?.length || 0}/{maxSquadSize})</span>
              </button>
            ))}

            {/* Warning if no squad has space */}
            {!hasAnySquadSpace && (
              <div className="p-1.5 bg-rose-950/80 border border-rose-600/50 rounded text-[9px] text-rose-300">
                ⚠️ All Squads Full ({maxSquadSize}/{maxSquadSize}). Upgrade capacity or bench a unit.
              </div>
            )}

            {/* Reserve Bench option for in-squad units */}
            {isInSquad && (
              <button
                onClick={handleTransferToBenchClick}
                className={`w-full text-left p-1.5 rounded transition flex items-center justify-between ${
                  confirmingTransferKingBench
                    ? 'bg-rose-950 border border-rose-500 text-rose-200 font-bold'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                <span>{confirmingTransferKingBench ? '⚠️ Confirm Bench Leader (Pass Leadership)' : '→ Reserve Bench'}</span>
              </button>
            )}

            {/* Cancel option */}
            <button
              onClick={onStartTransfer}
              className="w-full text-center p-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 rounded text-[9px] mt-1"
            >
              Cancel
            </button>
          </div>
        )}

        {/* King Dethrone Warning Alert */}
        {confirmingBenchKing && (
          <div className="p-2 bg-amber-950/90 border border-amber-500/80 rounded-lg text-[10px] text-amber-200 font-medium space-y-1 animate-fade-in">
            <div className="flex items-center gap-1 font-bold text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Oust & Bench Leader?</span>
            </div>
            <p className="text-[9px] text-zinc-300 leading-tight">
              Cell leadership will pass to the next highest ranking unit in this district.
            </p>
          </div>
        )}

        {/* Move Squad / Bench Button */}
        <button
          onClick={handleToggleSquadClick}
          className={`w-full py-1.5 px-2 rounded text-xs font-bold transition border ${
            confirmingBenchKing
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-zinc-950 border-amber-400 shadow-md font-black uppercase tracking-wider'
              : isInSquad
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              : hasAnySquadSpace
              ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 border-amber-500'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
          }`}
        >
          {confirmingBenchKing
            ? '⚠️ Confirm Bench Leader'
            : isInSquad
            ? isKing
              ? 'Bench Leader...'
              : 'Move to Bench'
            : isTransferring
            ? 'Cancel Assign'
            : hasAnySquadSpace
            ? 'Assign to Squad...'
            : `All Squads Full (${maxSquadSize}/${maxSquadSize})`}
        </button>

        {/* Sell Button (Only if not Permanent and not King!) */}
        {!unit.isPermanent && !isKing && (
          <button
            onClick={onSell}
            className="w-full py-1 px-2 rounded text-[10px] font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Sell (+1g)
          </button>
        )}
      </div>
    </SharedUnitCard>
  );
};
