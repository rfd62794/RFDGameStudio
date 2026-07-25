import { Flame, Package, ArrowRight } from 'lucide-react';
import type { RunState } from '../types';

interface RestCraftPhaseProps {
  run: RunState;
  onRest: () => void;
  onAttachment: () => void;
  onContinue: () => void;
}

export default function RestCraftPhase({ run, onRest, onAttachment, onContinue }: RestCraftPhaseProps) {
  // Real backend guard: restCraftResolvedNodeId is set by apply_rest/apply_attachment
  // in Lua, not just disabled client-side.
  const resolved = run.restCraftResolvedNodeId === run.currentNodeId;

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 flex flex-col items-center text-center gap-6 shadow-2xl max-w-2xl mx-auto my-4"
      id="viewport-rest-craft-phase"
    >
      <h2 className="text-2xl font-black text-slate-100 tracking-wider">REST &amp; CRAFT STOP</h2>
      <p className="text-xs font-mono text-slate-500">HP {run.playerHp}/{run.playerMaxHp}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <button
          onClick={onRest}
          disabled={resolved}
          className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all flex flex-col items-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          id="rest-craft-rest-btn"
        >
          <Flame className="w-6 h-6 text-emerald-400" />
          <span className="text-sm font-bold text-slate-100">Rest (+40% Max HP)</span>
        </button>

        <button
          onClick={onAttachment}
          disabled={resolved}
          className="p-5 rounded-xl border border-sky-500/40 bg-sky-950/20 hover:bg-sky-950/40 transition-all flex flex-col items-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          id="rest-craft-attachment-btn"
        >
          <Package className="w-6 h-6 text-sky-400" />
          <span className="text-sm font-bold text-slate-100">Attachment (Peek/Gift/Treasure)</span>
        </button>
      </div>

      {run.lastAttachmentOutcome && (
        <p className="text-xs font-mono text-sky-300">Attachment resolved: {run.lastAttachmentOutcome}</p>
      )}

      {resolved && (
        <button
          onClick={onContinue}
          className="w-full max-w-md py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer"
          id="rest-craft-continue-btn"
        >
          <span>Continue — Return to Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
