import React, { useState, useEffect } from 'react';
import { CellCombatState, Corporation, GameDate } from '../types';
import { Swords, RefreshCw, ChevronRight, Play, FastForward } from 'lucide-react';

interface CombatResolutionViewProps {
  combats: CellCombatState[];
  corporations: Corporation[];
  date: GameDate;
  onConcludeCombats: (results: { [cellId: number]: CellCombatState }) => void;
}

export default function CombatResolutionView({
  combats,
  corporations,
  date,
  onConcludeCombats
}: CombatResolutionViewProps) {
  const [currentCombatIndex, setCurrentCombatIndex] = useState<number>(0);
  const [resolvedCombats, setResolvedCombats] = useState<{ [cellId: number]: CellCombatState }>({});
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [isAutoPlayingRound, setIsAutoPlayingRound] = useState<boolean>(false);

  const activeCombat = combats[currentCombatIndex];

  // Auto-resolve any unvisited combats if the user chooses or skips
  useEffect(() => {
    // Reset round index on combat cell change
    setCurrentRoundIdx(0);
    setIsAutoPlayingRound(false);
  }, [currentCombatIndex]);

  // Handle auto-playing rounds
  useEffect(() => {
    let timer: any;
    if (isAutoPlayingRound && activeCombat) {
      if (currentRoundIdx < activeCombat.roundsLog.length - 1) {
        timer = setTimeout(() => {
          setCurrentRoundIdx(prev => prev + 1);
        }, 800); // 800ms per round tick
      } else {
        setIsAutoPlayingRound(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoPlayingRound, currentRoundIdx, activeCombat]);

  if (!activeCombat) {
    return (
      <div className="bg-[#D4D3D0] border-4 border-[#141414] shadow-[4px_4px_0px_0px_#141414] p-8 max-w-xl mx-auto text-center flex flex-col items-center justify-center min-h-[300px] select-none text-[#141414]">
        <Swords className="w-12 h-12 text-[#141414] mb-4 animate-pulse" />
        <h3 className="font-sans font-black text-xl text-[#141414] uppercase tracking-tight mb-2">No Active Engagements</h3>
        <p className="text-xs font-serif italic text-[#141414]/85 leading-relaxed">No planetary cells are contested this month. Perimeter borders are stable.</p>
        <button
          onClick={() => onConcludeCombats({})}
          className="mt-5 bg-[#141414] hover:bg-[#141414]/90 text-white border-2 border-[#141414] px-5 py-2 rounded-none text-xs font-black font-mono transition shadow-[2px_2px_0px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer uppercase tracking-widest"
        >
          Resume Boardroom Command
        </button>
      </div>
    );
  }

  const getCorp = (corpId: string | null) => {
    return corporations.find(c => c.id === corpId);
  };

  const handleNextCombat = () => {
    // Mark current as resolved
    setResolvedCombats(prev => ({
      ...prev,
      [activeCombat.cellId]: activeCombat
    }));

    if (currentCombatIndex < combats.length - 1) {
      setCurrentCombatIndex(prev => prev + 1);
    } else {
      // Conclude all combats
      const finalResolved = {
        ...resolvedCombats,
        [activeCombat.cellId]: activeCombat
      };
      onConcludeCombats(finalResolved);
    }
  };

  const handleAutoResolveAll = () => {
    // Immediately mark all as resolved
    const allResolved: { [cellId: number]: CellCombatState } = { ...resolvedCombats };
    for (const c of combats) {
      allResolved[c.cellId] = c;
    }
    onConcludeCombats(allResolved);
  };

  const currentRound = activeCombat.roundsLog[currentRoundIdx];
  const totalRounds = activeCombat.roundsLog.length;
  const isLastRound = currentRoundIdx === totalRounds - 1;

  // Render a list of participants at the top of the combat screen
  const participants = Object.keys(activeCombat.initialUnits);

  return (
    <div className="bg-[#E4E3E0] p-6 border-4 border-[#141414] shadow-[6px_6px_0px_0px_#141414] flex flex-col gap-5 max-w-4xl mx-auto select-none w-full" id="combat-resolver-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#141414]/20 pb-4 gap-3 text-[#141414]">
        <div className="flex items-center gap-3">
          <div className="bg-red-200 p-2.5 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414] shrink-0">
            <Swords className="w-6 h-6 text-[#141414] shrink-0" />
          </div>
          <div>
            <span className="font-serif italic text-[11px] text-[#141414]/70 font-bold uppercase tracking-widest block leading-none mb-1">
              Month-End Combat Engagements · {currentCombatIndex + 1} of {combats.length} Sector Conflicts
            </span>
            <h2 className="text-2xl font-sans font-black text-[#141414] uppercase tracking-tight">
              Tactical Battle in {activeCombat.cellName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoResolveAll}
            className="px-3.5 py-1.5 text-xs font-black font-sans uppercase tracking-wider bg-white hover:bg-[#D4D3D0] border-2 border-[#141414] text-[#141414] transition shadow-[2px_2px_0px_0px_#141414] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            Auto-Resolve All
          </button>
          <div className="text-xs font-mono font-bold bg-white border-2 border-[#141414] px-3 py-1.5 text-[#141414] shrink-0 shadow-[2px_2px_0px_0px_#141414]">
            Year {date.year} · Month {date.month}
          </div>
        </div>
      </div>

      {/* Main Grid: Left is starting composition and results, Right is round simulation logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column (4/12): Participants & Final Victor Status */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#D4D3D0] border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_#141414] flex flex-col gap-3">
            <span className="font-serif italic text-[11px] text-[#141414]/70 uppercase font-black leading-none mb-1">Engagement Forces</span>
            
            <div className="flex flex-col gap-2.5">
              {participants.map(corpId => {
                const corp = getCorp(corpId);
                const initUnits = activeCombat.initialUnits[corpId];
                const activeUnits = currentRound ? currentRound.survivingUnits[corpId] : initUnits;

                if (!corp) return null;

                return (
                  <div key={corpId} className="bg-white p-3 border border-[#141414] flex flex-col gap-2 shadow-[1px_1px_0px_0px_#141414] text-[#141414]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-xs uppercase tracking-tight flex items-center gap-1.5" style={{ color: corp.color }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: corp.color }}></span>
                        {corp.name} {corp.isPlayer && <span className="text-[9px] text-cyan-700 border border-[#141414] px-1 bg-cyan-100 font-bold uppercase ml-1">Player</span>}
                      </span>
                      <span className="font-mono font-bold text-[#141414]/80">
                        Total: {activeUnits.circle + activeUnits.square + activeUnits.triangle} 
                        <span className="text-[10px] text-[#141414]/50 font-normal"> (Init: {initUnits.circle + initUnits.square + initUnits.triangle})</span>
                      </span>
                    </div>

                    {/* Unit counts bar */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                      <div className="bg-[#E4E3E0]/60 border border-[#141414]/40 p-1 text-center font-bold font-mono">
                        <span className="text-[#141414]/65 block text-[9px] font-serif uppercase italic leading-none mb-0.5">● Circle</span>
                        <span className="font-black text-xs text-[#141414]">{activeUnits.circle}</span>
                      </div>
                      <div className="bg-[#E4E3E0]/60 border border-[#141414]/40 p-1 text-center font-bold font-mono">
                        <span className="text-[#141414]/65 block text-[9px] font-serif uppercase italic leading-none mb-0.5">■ Square</span>
                        <span className="font-black text-xs text-[#141414]">{activeUnits.square}</span>
                      </div>
                      <div className="bg-[#E4E3E0]/60 border border-[#141414]/40 p-1 text-center font-bold font-mono">
                        <span className="text-[#141414]/65 block text-[9px] font-serif uppercase italic leading-none mb-0.5">▲ Tri</span>
                        <span className="font-black text-xs text-[#141414]">{activeUnits.triangle}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Victory Board */}
          <div className="flex-1 bg-white border-2 border-[#141414] p-4 flex flex-col justify-center items-center text-center gap-3 min-h-[160px] shadow-[2px_2px_0px_0px_#141414]">
            {isLastRound ? (
              (() => {
                const victor = getCorp(activeCombat.victorId);
                return (
                  <>
                    <span className="font-serif italic text-[11px] text-[#141414]/70 uppercase tracking-widest font-bold block leading-none">CONCLUDED RESULT</span>
                    {victor ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">🏆</span>
                        <span className="text-xl font-black uppercase font-sans" style={{ color: victor.color }}>
                          {victor.name} Wins!
                        </span>
                        <span className="text-xs text-[#141414]/70 font-mono font-bold">
                          Surviving Garrison: {activeCombat.finalUnits[victor.id].circle + activeCombat.finalUnits[victor.id].square + activeCombat.finalUnits[victor.id].triangle} Units
                        </span>
                        {activeCombat.fortificationsLost > 0 && (
                          <span className="text-red-700 bg-red-100 border border-red-200 px-2 py-1 text-[10px] font-mono font-bold mt-1 max-w-xs leading-snug">
                            🛡️ Defensive Shield Level Decreased by {activeCombat.fortificationsLost} due to bombardment.
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-red-600">
                        <span className="text-lg font-black uppercase tracking-tight">MUTUAL DESTRUCTION</span>
                        <span className="text-xs text-[#141414]/70 font-serif italic max-w-[200px]">All military personnel terminated. Cell remains unheld.</span>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#141414]/60 font-mono">
                <RefreshCw className="w-8 h-8 text-[#141414]/50 animate-spin" />
                <span className="text-[10px] text-[#141414]/85 font-mono font-bold uppercase">TENTATIVE RESOLUTION RUNNING</span>
                <span className="text-[10px] text-[#141414]/50 font-serif italic max-w-xs leading-normal">Simulate remaining rounds to finalize ownership of {activeCombat.cellName}.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7/12): Round Simulator Logger */}
        <div className="lg:col-span-7 bg-[#D4D3D0] border-2 border-[#141414] p-4 flex flex-col gap-3 h-[420px] shadow-[2px_2px_0px_0px_#141414]">
          {/* Controls for playback */}
          <div className="flex justify-between items-center border-b border-[#141414]/20 pb-2.5 text-[#141414]">
            <div className="flex items-center gap-1.5">
              <span className="font-serif italic text-[10px] uppercase font-bold text-[#141414]/60">Chronological Logs</span>
              <span className="text-xs bg-white border border-[#141414] px-2 py-0.5 font-mono font-black shadow-[1px_1px_0px_0px_#141414] ml-1.5">
                Round {currentRoundIdx + 1} / {totalRounds}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Prev Round */}
              <button
                disabled={currentRoundIdx === 0}
                onClick={() => {
                  setIsAutoPlayingRound(false);
                  setCurrentRoundIdx(p => p - 1);
                }}
                className="px-2 py-1 text-[10px] font-mono font-bold bg-white border border-[#141414] text-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30 cursor-pointer shadow-[1px_1px_0px_0px_#141414]"
              >
                Prev
              </button>
              
              {/* Auto Play */}
              <button
                disabled={isLastRound}
                onClick={() => setIsAutoPlayingRound(!isAutoPlayingRound)}
                className={`px-3 py-1 text-[10px] font-mono font-bold border border-[#141414] flex items-center gap-1 cursor-pointer transition shadow-[1px_1px_0px_0px_#141414] ${
                  isAutoPlayingRound 
                    ? 'bg-amber-300 text-[#141414]' 
                    : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                }`}
              >
                <Play className="w-3 h-3" /> {isAutoPlayingRound ? 'Pause' : 'Auto Play'}
              </button>

              {/* Next Round */}
              <button
                disabled={isLastRound}
                onClick={() => {
                  setIsAutoPlayingRound(false);
                  setCurrentRoundIdx(p => p + 1);
                }}
                className="px-2 py-1 text-[10px] font-mono font-bold bg-white border border-[#141414] text-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30 cursor-pointer shadow-[1px_1px_0px_0px_#141414]"
              >
                Next
              </button>

              {/* Fast Forward to End */}
              <button
                disabled={isLastRound}
                onClick={() => {
                  setIsAutoPlayingRound(false);
                  setCurrentRoundIdx(totalRounds - 1);
                }}
                className="px-2 py-1 text-[10px] font-mono font-bold bg-red-100 border border-[#141414] text-red-700 hover:bg-red-200 cursor-pointer shadow-[1px_1px_0px_0px_#141414]"
                title="Fast Forward to Victory"
              >
                <FastForward className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Current Round Log text box */}
          <div className="flex-1 bg-white border border-[#141414] p-3 overflow-y-auto font-mono text-[10px] text-[#141414] leading-relaxed flex flex-col gap-1.5 h-full">
            {currentRound ? (
              currentRound.message.split('\n').map((line, lidx) => {
                let textClass = 'text-[#141414]/80';
                if (line.includes('[Combat Hit]')) textClass = 'text-red-700 font-bold';
                if (line.includes('[Fortification Shield]')) textClass = 'text-sky-700 font-bold';
                if (line.includes('[Deflected]')) textClass = 'text-[#141414]/40 font-serif italic';

                return (
                  <div key={lidx} className="p-1 border-b border-[#141414]/10">
                    <span className={textClass}>{line}</span>
                  </div>
                );
              })
            ) : (
              <span className="text-[#141414]/40 text-center py-20 font-serif italic">Click Play or Step to start log playback.</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Resolution submission */}
      <div className="border-t-2 border-[#141414]/20 pt-4 flex justify-between items-center text-[#141414] gap-4">
        <p className="text-[10px] font-mono text-[#141414]/60 font-bold leading-relaxed max-w-[70%]">
          ALL TACTICAL COMBAT IS EVALUATED WITH STRICT EQUALIZED LEAN AND RPS WEAPONS ADVANTAGE.
        </p>

        <button
          disabled={!isLastRound}
          onClick={handleNextCombat}
          className={`px-6 py-2.5 rounded-none text-xs font-black font-sans uppercase tracking-widest flex items-center gap-1.5 transition ${
            isLastRound
              ? 'bg-[#141414] hover:bg-[#141414]/90 text-white border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414] cursor-pointer'
              : 'bg-[#141414]/20 text-[#141414]/40 border-2 border-[#141414]/20 cursor-not-allowed opacity-50'
          }`}
          id="btn-conclude-battle"
        >
          {currentCombatIndex < combats.length - 1 ? 'Next Contested Sector' : 'Conclude Monthly Battles'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
