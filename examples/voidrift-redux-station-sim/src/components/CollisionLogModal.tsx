import React from 'react';
import { CollisionEventLog } from '../types';
import { ShieldAlert, X, Wrench, Layers, CheckCircle2 } from 'lucide-react';

interface Props {
  logs: CollisionEventLog[];
  onClose: () => void;
  onResolveAll: () => void;
}

export const CollisionLogModal: React.FC<Props> = ({ logs, onClose, onResolveAll }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="collision-logs-dialog"
        className="w-full max-w-xl bg-[#090e1c] border border-red-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Asteroid Collision Incident Reports
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Gravitational drift kinetic impacts on station hull
              </p>
            </div>
          </div>

          <button
            id="btn-close-collision-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No recent collision events recorded. Hull integrity is stable.
            </div>
          ) : (
            logs.map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString();
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-red-300">
                        Impact on {log.moduleName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Grid ({log.modulePos.x}, {log.modulePos.y}) • {timeStr}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
                      -{log.damage} HP
                    </span>
                  </div>

                  {log.compoundLoss && (
                    <div className="text-[11px] text-amber-400 font-mono bg-amber-950/30 p-1.5 rounded border border-amber-500/30">
                      Containment leak: -{log.compoundLoss.amount} units of {log.compoundLoss.name}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>Hull Plating absorbs 50% damage</span>
                    <span className="text-cyan-400">Debris field salvaged for Dust</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Equip <strong className="text-slate-200">Hull Binder</strong> to accelerate auto-repair speed.
          </span>

          <button
            id="btn-resolve-all-collisions"
            onClick={onResolveAll}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
