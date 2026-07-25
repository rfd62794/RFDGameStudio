import { Lock, ArrowRight } from 'lucide-react';

interface FloorFlavor {
  name: string;
  description: string;
}

interface FloorChoicePhaseProps {
  floorFlavor: Record<string, FloorFlavor>;
  onChoose: (floor: number) => void;
}

// Only Floor 1 is selectable for real: floors 2-5 are gated in data.yaml by
// minRoster/maxDeckSize thresholds against a meta-progression roster system
// that was never ported (no BankedEssence/roster state exists yet). Showing
// them as clickable would be fake gating, so they are honestly locked.
export default function FloorChoicePhase({ floorFlavor, onChoose }: FloorChoicePhaseProps) {
  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 flex flex-col items-center text-center gap-6 shadow-2xl max-w-3xl mx-auto my-4"
      id="viewport-floor-choice-phase"
    >
      <h2 className="text-2xl md:text-3xl font-black text-slate-100 tracking-wider">
        SELECT DESCENT FLOOR
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {[1, 2, 3, 4, 5].map((floor) => {
          const flavor = floorFlavor[String(floor)];
          const locked = floor !== 1;
          return (
            <button
              key={floor}
              disabled={locked}
              onClick={() => !locked && onChoose(floor)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                locked
                  ? 'bg-slate-950/60 border-slate-800/60 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800/80 border-amber-500/40 hover:border-amber-400 cursor-pointer'
              }`}
              id={`floor-choice-${floor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
                  Floor {floor}{flavor ? ` — ${flavor.name}` : ''}
                </span>
                {locked ? <Lock className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              {flavor && <p className="text-xs text-slate-400">{flavor.description}</p>}
              {locked && (
                <span className="text-[10px] text-slate-600 mt-1">
                  Requires meta-progression roster gating (not yet ported).
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
