import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface RoomResolvePanelProps {
  isResolved: boolean;
  actionTakenSummary: string;
  message: string;
  onDone: () => void;
}

export default function RoomResolvePanel({
  isResolved,
  actionTakenSummary,
  message,
  onDone
}: RoomResolvePanelProps) {
  if (isResolved) {
    return (
      <div 
        className="resolve-panel mt-2 p-5 bg-slate-950/90 border border-emerald-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl animate-fade-in"
        id="resolve-panel"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">Room Action Resolved</span>
            <p className="text-xs font-mono text-slate-200 mt-0.5">
              {actionTakenSummary || message || "Sanctuary frequency re-aligned."}
            </p>
          </div>
        </div>
        <button
          onClick={onDone}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-display transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
          id="continue-to-map-btn"
        >
          <span>Continue to Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end pt-2 border-t border-slate-800/60" id="skip-room-container">
      <button
        onClick={onDone}
        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
        id="leave-room-btn"
      >
        <span>Skip / Leave Room & Continue to Map</span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}
