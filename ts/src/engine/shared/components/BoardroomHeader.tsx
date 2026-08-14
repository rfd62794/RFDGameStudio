import React from 'react';
import type { GameDate, Corporation, MapCell } from '../componentTypes';
import { Play, Pause, FastForward, Briefcase, Calendar, Flag, HelpCircle, Award } from 'lucide-react';

interface BoardroomHeaderProps {
  date: GameDate;
  playerCorp: Corporation;
  controlledCellsCount: number;
  totalCellsCount: number;
  isSimulating: boolean;
  simulationSpeed: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onNextDay: () => void;
  onResetGame: () => void;
  showHelp: () => void;
  corporations: Corporation[];
  cells: MapCell[];
}

export default function BoardroomHeader({
  date,
  playerCorp,
  controlledCellsCount,
  totalCellsCount,
  isSimulating,
  simulationSpeed,
  onTogglePlay,
  onSetSpeed,
  onNextDay,
  onResetGame,
  showHelp,
  corporations,
  cells
}: BoardroomHeaderProps) {
  // Calculate market share percentage
  const sharePercentage = Math.round((controlledCellsCount / totalCellsCount) * 100);

  // Calculate standings of all corporations
  const sortedCorps = corporations.map(corp => {
    const count = cells.filter(c => c.ownerId === corp.id).length;
    return {
      ...corp,
      controlledCount: count
    };
  }).sort((a, b) => {
    if (b.controlledCount !== a.controlledCount) {
      return b.controlledCount - a.controlledCount;
    }
    return b.treasury - a.treasury;
  });

  const playerRank = sortedCorps.findIndex(c => c.id === playerCorp.id) + 1;

  return (
    <header className="bg-[#1a1a2e] border-b-2 border-amber-600/40 p-4 text-amber-50 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 select-none" id="boardroom-header">
      {/* Brand & Temporal Cadence Widget */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Title */}
        <div className="border border-amber-600/40 bg-[#0f0f1a] px-3 py-1.5 shrink-0">
          <span className="font-serif italic text-[10px] uppercase tracking-widest text-amber-400/60 block mb-0.5">EXECUTIVE TERMINAL</span>
          <h1 className="text-xl font-sans font-bold tracking-tighter uppercase leading-none text-amber-200 flex items-baseline gap-1.5">
            PLANET OF <span className="font-mono font-light text-amber-100/70">GREED</span>
          </h1>
        </div>
        
        {/* Visual Temporal Cadence Indicator (Containment Progress) */}
        <div className="flex flex-col gap-1 border border-amber-600/40 bg-[#0f0f1a] p-2 text-xs font-mono min-w-[280px]">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-amber-400/60 font-bold">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-400" /> Epoch Progress</span>
            <span className="font-bold text-amber-200 bg-amber-900/30 px-1">Y{date.year} · Month {date.month}</span>
          </div>
          {/* Months of Year progress (12 tick marks) */}
          <div className="grid grid-cols-12 gap-0.5 h-2 bg-[#1a1a2e] border border-amber-900/30 p-0.5" title={`Month ${date.month} of 12`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-full transition-all duration-300 ${
                  i + 1 < date.month 
                    ? 'bg-amber-700/60' 
                    : i + 1 === date.month 
                      ? 'bg-amber-400 animate-pulse' 
                      : 'bg-amber-900/20'
                }`}
              />
            ))}
          </div>
          {/* Containment subdivisions (Week inside Month, Day inside Week) */}
          <div className="flex items-center justify-between gap-3 mt-1 text-[9px] text-amber-100/80">
            <div className="flex items-center gap-1">
              <span className="text-amber-100/50 font-bold uppercase text-[8px]">Week:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-3.5 text-center text-[7.5px] font-bold border border-amber-700/40 flex items-center justify-center transition-all ${
                      i + 1 === date.week 
                        ? 'bg-amber-400 text-[#1a1a2e] font-black' 
                        : i + 1 < date.week 
                          ? 'bg-amber-900/40 text-amber-100/60' 
                          : 'bg-[#0f0f1a] text-amber-100/30'
                    }`}
                  >
                    W{i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-100/50 font-bold uppercase text-[8px]">Day:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2.5 h-2.5 border border-amber-700/40 flex items-center justify-center transition-all ${
                      i + 1 === date.day 
                        ? 'bg-amber-400' 
                        : i + 1 < date.day 
                          ? 'bg-amber-700/50' 
                          : 'bg-[#0f0f1a]'
                    }`}
                    title={`Day ${i + 1} of 7`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Speed & Advanced Timeline Controls */}
      <div className="flex items-center justify-center bg-[#0f0f1a] border border-amber-600/40 p-1.5 gap-2 max-w-xs mx-auto xl:mx-0 shrink-0">
        <button
          onClick={onTogglePlay}
          className={`p-1.5 border border-amber-600/40 transition cursor-pointer ${
            isSimulating 
              ? 'bg-amber-400 text-[#1a1a2e] hover:bg-amber-500' 
              : 'bg-emerald-600 text-amber-50 hover:bg-emerald-500'
          }`}
          title={isSimulating ? "Pause Simulation" : "Start Auto-Simulation"}
          id="btn-play-pause"
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="h-5 w-[1px] bg-amber-700/40"></div>

        {/* Speed Controls */}
        <button
          onClick={() => onSetSpeed(1)}
          className={`px-2 py-0.5 text-xs font-mono border transition cursor-pointer ${
            simulationSpeed === 1 && isSimulating
              ? 'bg-amber-600 text-[#1a1a2e] font-black border-amber-400'
              : 'border-transparent text-amber-100/50 hover:text-amber-100'
          }`}
          title="Normal Speed"
          id="btn-speed-1x"
        >
          1x
        </button>
        <button
          onClick={() => onSetSpeed(2)}
          className={`px-2 py-0.5 text-xs font-mono border transition cursor-pointer ${
            simulationSpeed === 2 && isSimulating
              ? 'bg-amber-600 text-[#1a1a2e] font-black border-amber-400'
              : 'border-transparent text-amber-100/50 hover:text-amber-100'
          }`}
          title="Fast Speed"
          id="btn-speed-2x"
        >
          2x
        </button>
        <button
          onClick={() => onSetSpeed(4)}
          className={`px-2 py-0.5 text-xs font-mono border transition cursor-pointer ${
            simulationSpeed === 4 && isSimulating
              ? 'bg-amber-600 text-[#1a1a2e] font-black border-amber-400'
              : 'border-transparent text-amber-100/50 hover:text-amber-100'
          }`}
          title="Turbo Speed"
          id="btn-speed-4x"
        >
          4x
        </button>

        <div className="h-5 w-[1px] bg-amber-700/40"></div>

        <button
          onClick={onNextDay}
          disabled={isSimulating}
          className="p-1 text-amber-100/50 hover:text-amber-100 disabled:opacity-30 transition cursor-pointer"
          title="Manual Advance 1 Day"
          id="btn-next-day"
        >
          <FastForward className="w-4 h-4" />
        </button>
      </div>

      {/* Corporation Standings & Status Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-end">
        {/* Live Standings Panel */}
        <div className="bg-[#0f0f1a] border border-amber-600/40 p-2 flex flex-col gap-1 font-mono text-[9px] min-w-[280px]">
          <div className="flex justify-between items-center border-b border-amber-700/30 pb-0.5">
            <span className="flex items-center gap-1 font-bold text-[11px] uppercase" style={{ color: playerCorp.color }}>
              <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: playerCorp.color }}></span>
              {playerCorp.name}
            </span>
            <span className="bg-amber-600 text-[#1a1a2e] font-mono px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider" data-testid="rank-display">
              RANK #{playerRank} / {corporations.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-amber-100/50 font-serif italic block text-[7.5px] uppercase leading-none">TREASURY</span>
                <span className="font-black text-emerald-400 text-xs">${playerCorp.treasury.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-amber-100/50 font-serif italic block text-[7.5px] uppercase leading-none">MARKET SHARE</span>
                <span className="font-black text-amber-100 text-xs">
                  {controlledCellsCount}/{totalCellsCount} <span className="text-[9px] font-normal opacity-60">({sharePercentage}%)</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5" data-testid="fragment-counter">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div>
                <span className="text-amber-100/50 font-serif italic block text-[7.5px] uppercase leading-none">FRAGMENTS</span>
                <span className="font-black text-amber-400 text-xs">{playerCorp.fragments?.length ?? 0}/6</span>
              </div>
            </div>
          </div>
          <div className="text-[7.5px] border-t border-amber-700/30 pt-1 flex items-center gap-1 font-mono text-amber-100/70 overflow-hidden">
            <span className="font-bold uppercase shrink-0 text-amber-100/40 text-[7px]">Rivals:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {sortedCorps.map((c) => (
                <span 
                  key={c.id} 
                  className={`px-1 py-0.2 border flex items-center gap-0.5 text-[7px] ${
                    c.isPlayer 
                      ? 'border-amber-400 bg-amber-600 text-[#1a1a2e] font-bold' 
                      : 'border-amber-800/40 bg-[#1a1a2e]/50 text-amber-100/80'
                  }`}
                >
                  <span className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: c.color }}></span>
                  <span>{c.name.split(' ')[0]}:</span>
                  <span className="font-bold">{c.controlledCount}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex gap-2 shrink-0 md:flex-col xl:flex-row justify-center">
          <button
            onClick={showHelp}
            className="p-2 bg-[#0f0f1a] hover:bg-[#1a1a2e] text-amber-200 border border-amber-600/40 transition cursor-pointer"
            title="Instructional Dossier"
            id="btn-help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onResetGame}
            className="px-2.5 py-1 text-xs font-mono bg-red-700 hover:bg-red-600 text-amber-50 border border-red-500/60 transition cursor-pointer font-bold uppercase tracking-wider"
            title="Restart Campaign"
            id="btn-reset"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
