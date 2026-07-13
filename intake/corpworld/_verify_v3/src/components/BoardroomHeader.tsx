import React from 'react';
import { GameDate, Corporation } from '../types';
import { Play, Pause, FastForward, Briefcase, Calendar, Shield, Flag, Award, HelpCircle } from 'lucide-react';

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
  showHelp
}: BoardroomHeaderProps) {
  // Calculate market share percentage
  const sharePercentage = Math.round((controlledCellsCount / totalCellsCount) * 100);

  return (
    <header className="bg-[#E4E3E0] border-b-4 border-[#141414] p-4 text-[#141414] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none" id="boardroom-header">
      {/* Brand & Campaign Date */}
      <div className="flex items-center gap-4">
        <div className="border-2 border-[#141414] bg-white/60 px-3 py-1.5 shadow-[2px_2px_0px_0px_#141414]">
          <span className="font-serif italic text-xs uppercase tracking-widest text-[#141414]/60 block mb-0.5">COMM-NET INTEL</span>
          <h1 className="text-2xl font-sans font-black tracking-tighter uppercase leading-none text-[#141414] flex items-baseline gap-1.5">
            CORP<span className="font-mono font-light text-[#141414]/80">WORLD</span>
            <span className="text-[10px] bg-[#141414] text-[#E4E3E0] font-mono px-1.5 py-0.5 font-bold tracking-wider">v2.0-MVP</span>
          </h1>
        </div>
        
        <div className="h-10 w-[2px] bg-[#141414]/40 hidden md:block"></div>

        {/* Timeline Status */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#141414]/80 shrink-0" />
          <div>
            <span className="text-[10px] text-[#141414]/60 uppercase tracking-widest block font-serif italic">Timeline Epoch</span>
            <span className="text-sm font-black text-[#141414] font-mono">
              Y{date.year} · M{date.month} · W{date.week} · D{date.day}
            </span>
          </div>
        </div>
      </div>

      {/* Simulation Timeline Controls */}
      <div className="flex items-center justify-center bg-[#D4D3D0] border-2 border-[#141414] p-1.5 gap-2 max-w-xs mx-auto md:mx-0 shadow-[2px_2px_0px_0px_#141414]">
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
          title="Normal Speed (1.5s / day)"
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
          title="Fast Speed (0.7s / day)"
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
          title="Turbo Speed (0.3s / day)"
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

      {/* Boardroom Financial & Territory Status */}
      <div className="flex items-center gap-4 justify-between md:justify-end">
        {/* Treasury */}
        <div className="flex items-center">
          <div className="bg-white/95 p-2 border-2 border-[#141414] flex items-center gap-2 shadow-[2px_2px_0px_0px_#141414]">
            <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="font-mono">
              <span className="text-[10px] text-[#141414]/60 uppercase block font-serif italic leading-none">Treasury</span>
              <span className="text-sm font-black text-emerald-700 leading-none block mt-0.5">
                ${playerCorp.treasury.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Market Share */}
        <div className="flex items-center">
          <div className="bg-white/95 p-2 border-2 border-[#141414] flex items-center gap-2 shadow-[2px_2px_0px_0px_#141414]">
            <Flag className="w-4 h-4 text-cyan-600 shrink-0" />
            <div className="font-mono">
              <span className="text-[10px] text-[#141414]/60 uppercase block font-serif italic leading-none">Market Share</span>
              <span className="text-sm font-black text-[#141414] leading-none block mt-0.5">
                {controlledCellsCount}/{totalCellsCount} <span className="text-xs font-normal opacity-60">({sharePercentage}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex gap-2">
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
            title="Restart the Land Grab Campaign"
            id="btn-reset"
          >
            Restart
          </button>
        </div>
      </div>
    </header>
  );
}
