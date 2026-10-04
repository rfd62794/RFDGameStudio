import React from 'react';
import { AlertCircle, FileText, ShieldAlert } from 'lucide-react';

interface AlertQueueProps {
  hasPendingEvent: boolean;
  pendingEventTitle?: string;
  pendingOrdersCount: number;
  activeCombatsCount: number;
}

export default function AlertQueue({
  hasPendingEvent,
  pendingEventTitle,
  pendingOrdersCount,
  activeCombatsCount
}: AlertQueueProps) {
  const hasAlerts = hasPendingEvent || pendingOrdersCount > 0 || activeCombatsCount > 0;

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-3 flex flex-col gap-2 shadow-[2px_2px_0px_0px_#141414]" id="alert-queue">
      <div className="flex items-center gap-1.5 border-b border-[#141414]/20 pb-1">
        <span className="font-sans font-black text-[10px] uppercase tracking-wider text-[#141414] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#141414]" />
          <span>Operations Action Queue</span>
        </span>
      </div>

      {!hasAlerts ? (
        <div className="bg-emerald-50 border border-emerald-400 p-2 flex items-center gap-1.5 text-emerald-800 text-[9px] font-mono shadow-[1px_1px_0px_0px_#141414]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-bold uppercase tracking-tight">NOMINAL:</span>
          <span>Perimeter secure. Ready for next Epoch.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {/* 1. Monthly conflicts about to force resolution - RED */}
          {activeCombatsCount > 0 && (
            <div className="bg-red-50 border border-red-500 p-2 flex items-center justify-between gap-1 text-red-900 text-[9px] font-mono shadow-[1px_1px_0px_0px_#141414] animate-pulse">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <div>
                  <span className="font-black uppercase text-red-700 tracking-tight block">RED ALERT: CONFLICT</span>
                  <span className="text-[8px] text-[#141414]/80">{activeCombatsCount} Month-End combat(s) pending</span>
                </div>
              </div>
              <span className="text-[7px] bg-red-600 text-white font-bold px-1 py-0.2 uppercase font-sans shrink-0">
                IMMEDIATE
              </span>
            </div>
          )}

          {/* 2. Pending Daily Dilemma Event - AMBER */}
          {hasPendingEvent && (
            <div className="bg-amber-50 border border-amber-500 p-2 flex items-center justify-between gap-1 text-amber-900 text-[9px] font-mono shadow-[1px_1px_0px_0px_#141414]">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-black uppercase text-amber-700 tracking-tight block">AMBER ALERT: DILEMMA</span>
                  <span className="text-[8px] text-[#141414]/80 font-bold truncate max-w-[120px] block">"{pendingEventTitle || 'Active Event'}"</span>
                </div>
              </div>
              <span className="text-[7px] bg-amber-500 text-black font-bold px-1 py-0.2 uppercase font-sans shrink-0">
                PENDING
              </span>
            </div>
          )}

          {/* 3. Territories needing Weekly Planning order - BLUE */}
          {pendingOrdersCount > 0 && (
            <div className="bg-cyan-50 border border-cyan-500 p-2 flex items-center justify-between gap-1 text-cyan-900 text-[9px] font-mono shadow-[1px_1px_0px_0px_#141414]">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <div>
                  <span className="font-black uppercase text-cyan-700 tracking-tight block">ROUTINE ACTION</span>
                  <span className="text-[8px] text-[#141414]/80">{pendingOrdersCount} Sector directive(s) missing</span>
                </div>
              </div>
              <span className="text-[7px] bg-cyan-500 text-white font-bold px-1 py-0.2 uppercase font-sans shrink-0">
                PLANNING
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
