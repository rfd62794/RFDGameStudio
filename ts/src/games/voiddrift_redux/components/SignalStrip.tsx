import React, { useEffect, useRef } from 'react';
import { DispatchLog } from '../types';
import { Radio, Terminal } from 'lucide-react';

interface SignalStripProps {
  logs: DispatchLog[];
}

export const SignalStrip: React.FC<SignalStripProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top of list (newest first)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const recentLogs = logs.slice(0, 15);

  return (
    <div
      id="echo-signal-strip"
      className="h-16 w-full bg-slate-950/95 border-t border-[#00CC66]/40 text-[#00CC66] font-mono text-xs flex items-center px-4 gap-3 z-30 shadow-[0_-4px_20px_rgba(0,204,102,0.1)] backdrop-blur-md shrink-0 select-none"
    >
      {/* ECHO Terminal Header Badge */}
      <div className="flex items-center gap-2 border-r border-[#00CC66]/30 pr-4 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[#00CC66] animate-pulse shadow-[0_0_8px_#00CC66]" />
        <span className="font-bold tracking-widest text-xs text-[#00CC66] flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          ECHO
        </span>
      </div>

      {/* Real-time Message Stream (showing 3 line scroll window) */}
      <div
        ref={scrollRef}
        className="flex-1 h-12 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-[#00CC66]/20 pr-2 flex flex-col justify-start"
      >
        {recentLogs.length === 0 ? (
          <div className="text-[#00CC66]/50 text-[11px] leading-4 flex items-center gap-2 py-1">
            <Radio className="w-3 h-3 animate-spin text-[#00CC66]/40" />
            STANDBY // LISTENING FOR TELEMETRY SIGNALS...
          </div>
        ) : (
          recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-2 text-[11px] leading-4 hover:bg-[#00CC66]/10 px-1 rounded transition-colors"
            >
              <span className="text-[#00CC66]/60 text-[10px] shrink-0 font-semibold">
                [{log.timestamp}]
              </span>
              <span className="text-white/80 font-bold shrink-0">
                {log.droneName}:
              </span>
              <span className="text-[#00CC66] tracking-wide font-medium truncate">
                {log.details}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Live Operational Status Indicator */}
      <div className="hidden sm:flex items-center gap-2 border-l border-[#00CC66]/30 pl-4 text-[10px] text-[#00CC66]/70 shrink-0 uppercase tracking-wider font-semibold">
        <span>VOICE LINK: ACTIVE</span>
      </div>
    </div>
  );
};
