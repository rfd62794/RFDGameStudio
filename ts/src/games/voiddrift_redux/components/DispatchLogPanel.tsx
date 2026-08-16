import React from 'react';
import { DispatchLog } from '../types';
import { Terminal } from 'lucide-react';

interface DispatchLogPanelProps {
  logs: DispatchLog[];
}

export const DispatchLogPanel: React.FC<DispatchLogPanelProps> = ({ logs }) => {
  const getActionBadge = (action: DispatchLog['action']) => {
    switch (action) {
      case 'INITIALIZE':
        return <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">INIT</span>;
      case 'DETECTED':
        return <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">DETECT</span>;
      case 'DISPATCHED':
        return <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">DISPATCH</span>;
      case 'ARRIVED':
        return <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800">ARRIVED</span>;
      case 'MINING_COMPLETE':
        return <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">HARVEST</span>;
      case 'DEPOSITED':
        return <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-bold">DEPOSIT</span>;
      case 'LATCHED':
        return <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 font-bold">LATCH</span>;
      case 'TUGGING':
        return <span className="text-[10px] bg-purple-950 text-purple-200 px-1.5 py-0.5 rounded border border-purple-700">TUGGING</span>;
      case 'RELEASED':
        return <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700 font-bold">RELEASE</span>;
      case 'DOCKED':
        return <span className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">DOCKED</span>;
      default:
        return <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{action}</span>;
    }
  };

  return (
    <div id="dispatch-log-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-100 uppercase">
            Realtime Dispatch Activity Stream
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Showing last {logs.length} logs
        </span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-2 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3 hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-500">{log.timestamp}</span>
              {getActionBadge(log.action)}
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
              <span className="font-bold text-slate-200 shrink-0">{log.droneName}:</span>
              <span className="text-slate-400 truncate">{log.details}</span>
            </div>

            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
              {log.targetId}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
