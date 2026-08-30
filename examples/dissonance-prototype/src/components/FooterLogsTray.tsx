import React from 'react';
import { RunState } from '../types';

interface FooterLogsTrayProps {
  runState: RunState | null;
}

export default function FooterLogsTray({ runState }: FooterLogsTrayProps) {
  if (!runState) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 shadow-md" id="footer-logs-window">
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-wider">
        <span>Sequence Resonance Logs</span>
        <span>Active Link: Stable</span>
      </div>
      <div className="h-32 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[10px] text-slate-400 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {runState.logs.length === 0 ? (
          <span className="text-slate-600 italic">No events recorded. Waiting for interaction...</span>
        ) : (
          [...runState.logs].reverse().map((log, idx) => (
            <div key={idx} className="border-l border-slate-800 pl-2 py-0.5 leading-normal">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
