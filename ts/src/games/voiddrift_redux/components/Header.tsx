import React from 'react';
import { SimulationStats } from '../types';
import { ShieldCheck, Zap, Anchor, Layers, Clock, Cpu, Flame } from 'lucide-react';

interface HeaderProps {
  stats: SimulationStats;
  onOpenDiagnostics: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, onOpenDiagnostics }) => {
  return (
    <header id="voiddrift-main-header" className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
      {/* Title & Phase Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-mono font-bold text-lg shadow-[0_0_10px_rgba(236,72,153,0.3)]">
          VD
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            VoidDrift Core Loop
            <span className="text-[10px] bg-pink-950/80 text-pink-300 border border-pink-800 px-2 py-0.5 rounded font-mono shadow-sm">
              PHASE 4: GAS-BEARING BRANCH & BREAKER TIER
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Gas Core Branching • Mk II Breaker In-Place Drill • Burst Fragments & Hauler Retrieval
          </p>
        </div>
      </div>

      {/* Live KPIs */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        {/* Metal Harvested */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Metal
          </span>
          <span className="text-xs font-bold text-amber-400">{stats.resources?.Metal || 0} MT</span>
        </div>

        {/* Raw Aluminum */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Anchor className="w-3 h-3 text-purple-400" /> Raw Al
          </span>
          <span className="text-xs font-bold text-purple-300">{stats.resources?.RawAluminum || 0} MT</span>
        </div>

        {/* Refined Aluminum */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> Refined Al
          </span>
          <span className="text-xs font-bold text-cyan-300">{stats.resources?.Aluminum || 0} MT</span>
        </div>

        {/* H3 Gas */}
        <div className="bg-slate-950 border border-pink-900/60 rounded-lg px-2.5 py-1 flex flex-col items-start shadow-[0_0_8px_rgba(236,72,153,0.15)]">
          <span className="text-[9px] text-pink-400 uppercase tracking-wider flex items-center gap-1 font-bold">
            <Flame className="w-3 h-3 text-pink-400" /> H3 Gas
          </span>
          <span className="text-xs font-bold text-pink-300">{stats.resources?.H3Gas || 0} MT</span>
        </div>

        {/* Closed Loops */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start hidden md:flex">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Mining Loops
          </span>
          <span className="text-xs font-bold text-slate-200">{stats.closedLoopsCompleted}</span>
        </div>

        {/* Successful Tugs */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Anchor className="w-3 h-3 text-purple-400" /> Ring 2 Tugs
          </span>
          <span className="text-xs font-bold text-purple-300">{stats.successfulTugsCompleted}</span>
        </div>

        {/* Avg Cycle Time */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start hidden sm:flex">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" /> Avg Loop
          </span>
          <span className="text-xs font-bold text-emerald-300">{stats.avgCycleTimeSec}s</span>
        </div>

        {/* Boundary Diagnostics Button */}
        <button
          id="open-diagnostics-btn"
          onClick={onOpenDiagnostics}
          className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-2 transition ${
            stats.boundaryTelemetry.isBoundaryValid && stats.boundaryTelemetry.ring2GatedMiningValid
              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-rose-950/50 border-rose-500/60 text-rose-300 hover:bg-rose-900/50 animate-pulse'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Pass/Fail Telemetry
        </button>
      </div>
    </header>
  );
};
