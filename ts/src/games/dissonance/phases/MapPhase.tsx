import { Swords, Flame, Gem, Store, Zap, Crown, ArrowRight } from 'lucide-react';
import type { RunNode, RunState } from '../types';

interface MapPhaseProps {
  run: RunState;
  onEnterCurrentNode: () => void;
  onSelectBranch: (targetNodeId: string) => void;
}

const NODE_ICONS: Record<RunNode['type'], typeof Swords> = {
  fight: Swords,
  restCraft: Flame,
  treasure: Gem,
  store: Store,
  anomaly: Zap,
  boss: Crown,
};

export default function MapPhase({ run, onEnterCurrentNode, onSelectBranch }: MapPhaseProps) {
  const currentNode = run.nodes.find((n) => n.id === run.currentNodeId);
  const alreadyVisited = run.visitedNodeIds.includes(run.currentNodeId);
  const branchOptions = alreadyVisited ? (currentNode?.connectsTo ?? []) : [];

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative max-w-5xl mx-auto my-4"
      id="viewport-map-phase"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-100 tracking-wider uppercase">
          Floor {run.currentFloor} — {run.nodes.length} Nodes
        </h2>
        <span className="text-xs font-mono text-slate-500">
          HP {run.playerHp}/{run.playerMaxHp} · Essence {run.essence}
        </span>
      </div>

      {run.lastMapBalance && (
        <div className="text-[10px] font-mono text-slate-500 bg-slate-950/60 border border-slate-800 rounded-lg p-2">
          Map generation validated: {run.lastMapBalance.netDamage} HP net damage
          (band [{run.lastMapBalance.band[0]}-{run.lastMapBalance.band[1]}] HP,
          {' '}{run.lastMapBalance.attempts} attempt(s)).
        </div>
      )}

      <div className="relative w-full overflow-x-auto py-4" id="map-node-graph">
        <svg width="100%" height="260" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 pointer-events-none">
          {run.nodes.flatMap((n) =>
            (n.connectsTo ?? []).map((targetId) => {
              const target = run.nodes.find((t) => t.id === targetId);
              if (!target || n.x === undefined || target.x === undefined) return null;
              return (
                <line
                  key={`${n.id}-${targetId}`}
                  x1={n.x} y1={n.y} x2={target.x} y2={target.y}
                  stroke="#3f3f5f" strokeWidth={0.4}
                />
              );
            })
          )}
        </svg>
        <div className="relative w-full h-64">
          {run.nodes.map((n) => {
            const Icon = NODE_ICONS[n.type];
            const isCurrent = n.id === run.currentNodeId;
            const isVisited = run.visitedNodeIds.includes(n.id);
            const isSelectable = branchOptions.includes(n.id);
            return (
              <button
                key={n.id}
                disabled={!isSelectable}
                onClick={() => isSelectable && onSelectBranch(n.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/30'
                    : isSelectable
                    ? 'bg-slate-800 border-amber-500/60 text-amber-300 hover:bg-slate-700 cursor-pointer'
                    : isVisited
                    ? 'bg-slate-800/50 border-slate-700 text-slate-600'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
                id={`map-node-${n.id}`}
                title={n.type === 'fight' || n.type === 'boss' ? n.enemyName : n.type}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {!alreadyVisited && currentNode && (
        <button
          onClick={onEnterCurrentNode}
          className="w-full max-w-md mx-auto py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer"
          id="map-enter-node-btn"
        >
          <span>
            Enter {currentNode.type === 'fight' || currentNode.type === 'boss'
              ? `Fight: ${currentNode.enemyName}`
              : currentNode.type}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {alreadyVisited && branchOptions.length > 0 && (
        <p className="text-xs font-mono text-slate-400 text-center">
          Select a connected node above to travel there.
        </p>
      )}
    </div>
  );
}
