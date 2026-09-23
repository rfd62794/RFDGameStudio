/**
 * @file src/components/SituationPanel.tsx
 * Visible Situation Queue & Manager Commitment Panel for player responses
 * and active repair status tracking.
 */

import React from 'react';
import { KitchenState } from '../types';
import { respondToSituation, getAvailableAttention } from '../scoring/taskSelection';
import { Wrench, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { STATION_CONFIGS, SITUATION_ESCALATION_INTERVAL_SECONDS } from '../data';

interface SituationPanelProps {
  state: KitchenState;
  onUpdate?: () => void;
}

export const SituationPanel: React.FC<SituationPanelProps> = ({ state, onUpdate }) => {
  const queue = state.situationQueue || [];
  const activeRepair = state.committedRepairTask;
  const availableAttention = getAvailableAttention(state.manager);

  if (queue.length === 0 && !activeRepair) {
    return null;
  }

  const handleResponse = (situationId: string, response: boolean) => {
    respondToSituation(state, situationId, response);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="font-bold text-slate-100 text-sm">
            Situations & Equipment Maintenance
          </h3>
        </div>
        <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
          <span>Attention Pool:</span>
          <span className={availableAttention > 0 ? 'text-amber-400 font-bold' : 'text-slate-500 font-bold'}>
            {availableAttention} / 3
          </span>
        </div>
      </div>

      {/* Active Committed Manager Repair Task */}
      {activeRepair && activeRepair.remainingSeconds > 0 && (
        <div className="bg-amber-950/40 border border-amber-600/60 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Wrench className="w-4 h-4 text-amber-400 animate-spin" />
              <span>
                Manager Repairing {STATION_CONFIGS[activeRepair.stationId]?.name || activeRepair.stationId} (Stage {activeRepair.stage})
              </span>
            </div>
            <span className="font-mono text-amber-400 font-bold">
              {Math.ceil(activeRepair.remainingSeconds)}s remaining
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-amber-800/40">
            <div
              className="bg-amber-500 h-full transition-all duration-200"
              style={{
                width: `${Math.max(0, Math.min(100, ((activeRepair.totalDuration - activeRepair.remainingSeconds) / activeRepair.totalDuration) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Pending Situation Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((sit) => {
            const stationConfig = STATION_CONFIGS[sit.stationId];
            const stationName = stationConfig?.name || sit.stationId;
            const nextEscalationSeconds = Math.max(
              0,
              SITUATION_ESCALATION_INTERVAL_SECONDS - (sit.elapsedSeconds % SITUATION_ESCALATION_INTERVAL_SECONDS)
            );

            const isStage3 = sit.stage >= 3;
            const isStage2 = sit.stage === 2;

            const badgeColor = isStage3
              ? 'bg-rose-950 text-rose-300 border-rose-700'
              : isStage2
              ? 'bg-amber-950 text-amber-300 border-amber-700'
              : 'bg-yellow-950 text-yellow-300 border-yellow-700';

            const stageLabel = isStage3 ? 'Stage 3 — Broken (Unusable)' : isStage2 ? 'Stage 2 — Struggling' : 'Stage 1 — Worn';

            return (
              <div
                key={sit.id}
                className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{stationName} Equipment Degraded</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badgeColor}`}>
                      {stageLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {isStage3
                        ? 'At maximum severity — repair required to restore station usability'
                        : `Escalates in ${Math.ceil(nextEscalationSeconds)}s if ignored`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleResponse(sit.id, true)}
                    disabled={availableAttention <= 0}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      availableAttention > 0
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                    title={availableAttention > 0 ? 'Spend 1 Attention to repair equipment' : 'Insufficient Attention'}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Check In (1 Attn)</span>
                  </button>

                  <button
                    onClick={() => handleResponse(sit.id, false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 transition cursor-pointer"
                    title="Defer resolution — situation remains queued and continues escalating over time"
                  >
                    <span>Defer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
