import React from 'react';
import { GameDate, Corporation, MapCell } from '../types';
import { Play, Pause, FastForward, Briefcase, Calendar, Flag, HelpCircle } from 'lucide-react';

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
    <header className="bg-[#E4E3E0] border-b-4 border-[#141414] p-4 text-[#141414] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 select-none" id="boardroom-header">
      {/* Brand & Temporal Cadence Widget */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Title */}
        <div className="border-2 border-[#141414] bg-white/60 px-3 py-1.5 shadow-[2px_2px_0px_0px_#141414] shrink-0">
          <span className="font-serif italic text-[10px] uppercase tracking-widest text-[#141414]/60 block mb-0.5">COMM-NET INTEL</span>
          <h1 className="text-xl font-sans font-black tracking-tighter uppercase leading-none text-[#141414] flex items-baseline gap-1.5">
            CORP<span className="font-mono font-light text-[#141414]/80">WORLD</span>
            <span className="text-[8px] bg-[#141414] text-[#E4E3E0] font-mono px-1 py-0.2 font-bold tracking-wider">v2.0-MVP</span>
          </h1>
        </div>
        
        {/* Visual Temporal Cadence Indicator (Containment Progress) */}
        <div className="flex flex-col gap-1 border-2 border-[#141414] bg-white p-2 text-xs font-mono shadow-[2px_2px_0px_0px_#141414] min-w-[280px]">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-[#141414]/60 font-black">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#141414]" /> Epoch Progress</span>
            <span className="font-bold text-[#141414] bg-[#141414]/10 px-1">Y{date.year} · Month {date.month}</span>
          </div>
          {/* Months of Year progress (12 tick marks) */}
          <div className="grid grid-cols-12 gap-0.5 h-2 bg-[#E4E3E0] border border-[#141414]/30 p-0.5" title={`Month ${date.month} of 12`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-full transition-all duration-300 ${
                  i + 1 < date.month 
                    ? 'bg-[#141414]/65' 
                    : i + 1 === date.month 
                      ? 'bg-amber-400 animate-pulse' 
                      : 'bg-[#141414]/10'
                }`}
              />
            ))}
          </div>
          {/* Containment subdivisions (Week inside Month, Day inside Week) */}
          <div className="flex items-center justify-between gap-3 mt-1 text-[9px] text-[#141414]/80">
            <div className="flex items-center gap-1">
              <span className="text-[#141414]/50 font-bold uppercase text-[8px]">Week:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-3.5 text-center text-[7.5px] font-bold border border-[#141414] flex items-center justify-center transition-all ${
                      i + 1 === date.week 
                        ? 'bg-amber-400 text-[#141414] font-black' 
                        : i + 1 < date.week 
                          ? 'bg-[#141414]/20 text-[#141414]/60' 
                          : 'bg-white text-[#141414]/30'
                    }`}
                  >
                    W{i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#141414]/50 font-bold uppercase text-[8px]">Day:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2.5 h-2.5 border border-[#141414] flex items-center justify-center transition-all ${
                      i + 1 === date.day 
                        ? 'bg-[#141414]' 
                        : i + 1 < date.day 
                          ? 'bg-[#141414]/45' 
                          : 'bg-white'
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
      <div className="flex items-center justify-center bg-[#D4D3D0] border-2 border-[#141414] p-1.5 gap-2 max-w-xs mx-auto xl:mx-0 shadow-[2px_2px_0px_0px_#141414] shrink-0">
        <button
          onClick={onTogglePlay}
          className={`p-1.5 border-2 border-[#141414] transition cursor-pointer ${
            isSimulating 
              ? 'bg-amber-400 text-[#141414] hover:bg-amber-500' 
              : 'bg-emerald-400 text-[#141414] hover:bg-emerald-500'
          }`}
          title={isSimulating ? "Pause Simulation" : "Start Auto-Simulation"}
          id="btn-play-pause"
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="h-5 w-[1px] bg-[#141414]/40"></div>

        {/* Speed Controls */}
        <button
          onClick={() => onSetSpeed(1)}
          className={`px-2 py-0.5 text-xs font-mono border transition cursor-pointer ${
            simulationSpeed === 1 && isSimulating
              ? 'bg-[#141414] text-[#E4E3E0] font-black border-[#141414]'
              : 'border-transparent text-[#141414]/70 hover:text-[#141414]'
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
              ? 'bg-[#141414] text-[#E4E3E0] font-black border-[#141414]'
              : 'border-transparent text-[#141414]/70 hover:text-[#141414]'
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
              ? 'bg-[#141414] text-[#E4E3E0] font-black border-[#141414]'
              : 'border-transparent text-[#141414]/70 hover:text-[#141414]'
          }`}
          title="Turbo Speed"
          id="btn-speed-4x"
        >
          4x
        </button>

        <div className="h-5 w-[1px] bg-[#141414]/40"></div>

        <button
          onClick={onNextDay}
          disabled={isSimulating}
          className="p-1 text-[#141414]/70 hover:text-[#141414] disabled:opacity-30 transition cursor-pointer"
          title="Manual Advance 1 Day"
          id="btn-next-day"
        >
          <FastForward className="w-4 h-4" />
        </button>
      </div>

      {/* Football Manager-style Corporation Standings & Status Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-end">
        {/* Live Standings Panel */}
        <div className="bg-white border-2 border-[#141414] p-2 flex flex-col gap-1 shadow-[2px_2px_0px_0px_#141414] font-mono text-[9px] min-w-[280px]">
          <div className="flex justify-between items-center border-b border-[#141414]/10 pb-0.5">
            <span className="flex items-center gap-1 font-black text-[11px] uppercase" style={{ color: playerCorp.color }}>
              <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: playerCorp.color }}></span>
              {playerCorp.name}
            </span>
            <span className="bg-[#141414] text-white font-mono px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider">
              RANK #{playerRank} / 5
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[#141414]/50 font-serif italic block text-[7.5px] uppercase leading-none">TREASURY</span>
                <span className="font-black text-emerald-700 text-xs">${playerCorp.treasury.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <div>
                <span className="text-[#141414]/50 font-serif italic block text-[7.5px] uppercase leading-none">MARKET SHARE</span>
                <span className="font-black text-[#141414] text-xs">
                  {controlledCellsCount}/{totalCellsCount} <span className="text-[9px] font-normal opacity-60">({sharePercentage}%)</span>
                </span>
              </div>
            </div>
          </div>
          <div className="text-[7.5px] border-t border-[#141414]/10 pt-1 flex items-center gap-1 font-mono text-[#141414]/75 overflow-hidden">
            <span className="font-black uppercase shrink-0 text-[#141414]/40 text-[7px]">Rivals:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {sortedCorps.map((c) => (
                <span 
                  key={c.id} 
                  className={`px-1 py-0.2 border flex items-center gap-0.5 text-[7px] ${
                    c.isPlayer 
                      ? 'border-[#141414] bg-[#141414] text-white font-bold' 
                      : 'border-[#141414]/20 bg-[#E4E3E0]/30 text-[#141414]/90'
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
            className="p-2 bg-white hover:bg-[#D4D3D0] text-[#141414] border-2 border-[#141414] transition cursor-pointer shadow-[2px_2px_0px_0px_#141414]"
            title="Instructional Dossier"
            id="btn-help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onResetGame}
            className="px-2.5 py-1 text-xs font-mono bg-red-400 hover:bg-red-500 text-[#141414] border-2 border-[#141414] transition cursor-pointer font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#141414]"
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
