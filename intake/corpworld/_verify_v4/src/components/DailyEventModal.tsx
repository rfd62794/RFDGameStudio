import React from 'react';
import { GameEvent, MapCell, Corporation, GameDate } from '../types';
import { AlertTriangle } from 'lucide-react';

interface DailyEventModalProps {
  event: GameEvent | null;
  cell: MapCell | undefined;
  playerCorp: Corporation;
  onSelectChoice: (choiceIdx: number) => void;
  date: GameDate;
}

export default function DailyEventModal({
  event,
  cell,
  playerCorp,
  onSelectChoice,
  date
}: DailyEventModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-fade-in" id="daily-event-modal">
      <div className="bg-[#E4E3E0] border-4 border-[#141414] max-w-lg w-full overflow-hidden shadow-[6px_6px_0px_0px_#141414] flex flex-col">
        {/* Urgent Header */}
        <div className="bg-red-400 border-b-4 border-[#141414] p-4 flex items-center gap-3 text-[#141414]">
          <AlertTriangle className="w-5 h-5 text-[#141414] shrink-0 animate-bounce" />
          <div className="flex-1">
            <span className="font-mono text-[9px] text-[#141414]/80 font-black uppercase tracking-widest block leading-none mb-1">BOARDROOM MEMORANDUM // PRIORITY DIRECTIVE</span>
            <h2 className="text-sm font-sans font-black uppercase tracking-tight">
              Action Required: {event.title}
            </h2>
          </div>
          <div className="font-mono text-[10px] text-[#141414] bg-white px-2 py-1 border-2 border-[#141414] shrink-0 font-bold shadow-[2px_2px_0px_0px_#141414]">
            Y{date.year} · M{date.month} · W{date.week} · D{date.day}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5 flex flex-col gap-4 text-[#141414]">
          <div className="p-3 bg-white border-2 border-[#141414] text-xs font-mono text-[#141414] leading-relaxed shadow-[2px_2px_0px_0px_#141414]">
            <span className="text-[10px] text-[#141414]/60 uppercase font-black font-serif italic block mb-1">
              Location Perimeter: {cell ? cell.name : 'Global Orbit'}
            </span>
            <p>{event.description}</p>
          </div>

          <div className="h-[2px] bg-[#141414]/20 w-full" />

          {/* Player Balance Check */}
          <div className="flex justify-between items-center text-xs font-mono bg-[#D4D3D0] px-3 py-2 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414]">
            <span className="text-[#141414]/70 font-bold uppercase text-[9px] font-sans">Corporate Liquid Balance:</span>
            <span className="text-emerald-700 font-black text-sm">${playerCorp.treasury.toLocaleString()}</span>
          </div>

          {/* Decisions Options */}
          <div className="flex flex-col gap-2.5">
            <span className="font-serif italic text-[11px] text-[#141414]/70 font-bold uppercase tracking-wider block">RESOLUTIONS MATRIX</span>
            
            {event.choices.map((choice, idx) => {
              // Check if player can afford this choice
              const canAffordCash = playerCorp.treasury >= choice.cost;
              const meetsUnitCost = !choice.unitsCost || (
                cell &&
                cell.units.circle >= (choice.unitsCost.circle || 0) &&
                cell.units.square >= (choice.unitsCost.square || 0) &&
                cell.units.triangle >= (choice.unitsCost.triangle || 0)
              );
              
              const isAvailable = canAffordCash && meetsUnitCost;

              return (
                <button
                  key={idx}
                  disabled={!isAvailable}
                  onClick={() => onSelectChoice(idx)}
                  className={`w-full p-3.5 border-2 text-left flex flex-row items-center justify-between gap-3 transition ${
                    isAvailable
                      ? 'bg-white hover:bg-[#D4D3D0] border-[#141414] text-[#141414] cursor-pointer shadow-[2px_2px_0px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5'
                      : 'bg-white/40 border-[#141414]/40 text-[#141414]/40 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex-1">
                    <span className={`text-xs font-black block mb-0.5 uppercase tracking-tight ${isAvailable ? 'text-[#141414]' : 'text-[#141414]/40'}`}>{choice.text}</span>
                    <span className={`text-[10px] font-serif italic block ${isAvailable ? 'text-[#141414]/70' : 'text-[#141414]/30'}`}>{choice.effectText}</span>
                  </div>
                  
                  {/* Cost badge */}
                  <div className="shrink-0 flex items-center gap-1.5 self-end md:self-center font-mono text-[10px] uppercase">
                    {choice.cost > 0 && (
                      <span className={`px-2 py-0.5 border-2 font-black text-[9px] shadow-[1px_1px_0px_0px_#141414] ${isAvailable ? 'text-red-700 bg-red-100 border-[#141414]' : 'text-red-700/40 bg-red-100/40 border-[#141414]/40'}`}>
                        -${choice.cost.toLocaleString()}
                      </span>
                    )}
                    {choice.unitsCost && (
                      <span className={`px-2 py-0.5 border-2 font-black text-[9px] shadow-[1px_1px_0px_0px_#141414] ${isAvailable ? 'text-amber-700 bg-amber-100 border-[#141414]' : 'text-amber-700/40 bg-amber-100/40 border-[#141414]/40'}`}>
                        -Units
                      </span>
                    )}
                    {choice.cost === 0 && !choice.unitsCost && (
                      <span className={`px-2 py-0.5 border-2 font-bold text-[9px] ${isAvailable ? 'text-[#141414]/60 bg-white border-[#141414]/40' : 'text-[#141414]/30 bg-white/20 border-[#141414]/20'}`}>
                        No Cost
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#D4D3D0] p-3 text-center border-t-2 border-[#141414]">
          <p className="text-[9px] text-[#141414]/60 font-mono font-bold uppercase">
            SECURE DIRECTIVE ENGINE // ALL ACTIONS FINALIZED UPON RESOLUTION SUBMISSION
          </p>
        </div>
      </div>
    </div>
  );
}
