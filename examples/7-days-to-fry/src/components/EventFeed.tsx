/**
 * @file src/components/EventFeed.tsx
 * Real-time event log feed for safety violations, customer abandonments, and staff meal actions.
 */

import React from 'react';
import { KitchenState } from '../types';
import { Activity, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface EventFeedProps {
  state: KitchenState;
}

export const EventFeed: React.FC<EventFeedProps> = ({ state }) => {
  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-3 shadow-lg flex flex-col h-[320px]">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Live Safety & Incident Feed
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {state.logEvents.length} events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {state.logEvents.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">
            No incidents recorded yet. Shift running smoothly...
          </div>
        ) : (
          state.logEvents.map((ev) => {
            const timeStr = `${Math.floor(ev.timestamp / 60)}:${(
              '0' + Math.floor(ev.timestamp % 60)
            ).slice(-2)}`;

            let bgColor = 'bg-slate-900/60 border-slate-700/50 text-slate-300';
            let icon = <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />;

            if (ev.type === 'violation') {
              bgColor = 'bg-red-950/40 border-red-800/60 text-red-200';
              icon = <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
            } else if (ev.type === 'warning') {
              bgColor = 'bg-amber-950/30 border-amber-800/50 text-amber-200';
              icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
            } else if (ev.type === 'success') {
              bgColor = 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200';
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
            }

            return (
              <div
                key={ev.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${bgColor}`}
              >
                <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50 mt-0.5">
                  {timeStr}
                </span>
                {icon}
                <span className="leading-snug">{ev.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
