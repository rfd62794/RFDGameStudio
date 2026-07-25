import { Sparkles, Play, RotateCcw } from 'lucide-react';

interface TitlePhaseProps {
  hasSave: boolean;
  onNewRun: () => void;
  onContinue: () => void;
}

export default function TitlePhase({ hasSave, onNewRun, onContinue }: TitlePhaseProps) {
  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 flex flex-col items-center text-center gap-8 shadow-2xl relative max-w-2xl mx-auto my-4 overflow-hidden"
      id="viewport-title-phase"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-slate-900/40 to-slate-950 pointer-events-none rounded-2xl" />

      <div className="relative z-10 flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-500/40 rounded-full text-[10px] font-mono text-amber-400 uppercase tracking-widest">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Card-Combination Roguelike</span>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-100 tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent drop-shadow-md">
          DISSONANCE
        </h1>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-1" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 max-w-lg leading-relaxed text-slate-300">
        <p className="text-sm text-slate-300 font-medium">
          A card-combination roguelike. Descend the floors of a dying station, floor by floor, run by run.
        </p>
        <p className="italic text-slate-400 text-xs bg-slate-950/60 border-l-2 border-amber-500/60 p-3.5 rounded-r-xl text-left shadow-inner">
          "Please piece me back together, every floor costs us something."
        </p>
      </div>

      <nav className="relative z-10 flex flex-col gap-3 w-full max-w-xs mt-2" id="title-navigation-menu">
        <button
          onClick={onNewRun}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer"
          id="title-new-run-btn"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          New Run
        </button>

        {hasSave && (
          <button
            onClick={onContinue}
            className="w-full py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold border border-amber-500/40 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer"
            id="title-continue-btn"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Continue
          </button>
        )}
      </nav>
    </div>
  );
}
