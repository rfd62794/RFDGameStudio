import React from 'react';
import { TurnLogEntry } from '../types';
import { 
  Terminal, 
  Flame, 
  Zap, 
  HelpCircle, 
  Volume2, 
  CornerDownRight, 
  StickyNote,
  AlertTriangle,
  Play
} from 'lucide-react';

interface GameLogProps {
  logs: TurnLogEntry[];
}

export default function GameLog({ logs }: GameLogProps) {
  // Take last 15 logs for display
  const recentLogs = [...logs].reverse().slice(0, 15);

  return (
    <div id="game-logs-and-rules" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Turn Activity Logs */}
      <div id="terminal-logs" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[280px] shadow-lg">
        <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
          <Terminal size={14} className="text-emerald-400" /> SYSTEM RESOLUTION LOGS
        </h4>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px] leading-relaxed">
          {recentLogs.length === 0 ? (
            <p className="text-slate-600 italic">No activity registered. Take a step to begin.</p>
          ) : (
            recentLogs.map(log => {
              let textClass = 'text-slate-300';
              let prefix = '•';

              if (log.type === 'player') {
                textClass = 'text-sky-300';
                prefix = '►';
              } else if (log.type === 'enemy') {
                textClass = 'text-red-400';
                prefix = '⚠';
              } else if (log.type === 'damage') {
                textClass = 'text-rose-500 font-bold';
                prefix = '⚡';
              } else if (log.type === 'success') {
                textClass = 'text-emerald-400 font-bold';
                prefix = '✔';
              } else if (log.type === 'system') {
                textClass = 'text-amber-400';
                prefix = '⚙';
              }

              return (
                <div key={log.id} className={`flex gap-1.5 items-start ${textClass}`}>
                  <span className="opacity-60 shrink-0">{prefix}</span>
                  <div>
                    <span className="text-[9px] text-slate-500 mr-1">T{log.turn}:</span>
                    <span>{log.text}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mechanics Reference Rules Guide */}
      <div id="mechanics-rules-reference" className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col h-[280px] overflow-y-auto shadow-lg text-slate-300">
        <h4 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
          <HelpCircle size={14} className="text-amber-400" /> UNIVERSAL PROPERTY RULES
        </h4>
        
        <p className="text-[10px] text-slate-400 font-mono mb-3 leading-relaxed">
          The simulation runs on property tags, not predefined item pairings.
        </p>

        <div className="space-y-3 text-[11px] font-mono">
          <div className="flex gap-2">
            <Flame size={14} className="text-orange-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-orange-400 uppercase text-[10px]">Heat + Flammable:</strong>
              <p className="text-[10px] text-slate-400">Heat ignites any Flammable object (Oil Spill, Curtains, Firecrackers). Burning objects spread Heat to neighbors every turn.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Zap size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-400 uppercase text-[10px]">Electric + Conductive:</strong>
              <p className="text-[10px] text-slate-400">Electricity (Battery) conducts instantly across connected Conductive tiles (Water, Metal Grate). Stuns guards & shocks player.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Volume2 size={14} className="text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-yellow-400 uppercase text-[10px]">Loud Sound Attraction:</strong>
              <p className="text-[10px] text-slate-400">Loud events (Siren, exploding Firecracker) attract guard attention. All guards turn their face/sightline towards the sound!</p>
            </div>
          </div>

          <div className="flex gap-2">
            <CornerDownRight size={14} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-400 uppercase text-[10px]">Reflective Redirection:</strong>
              <p className="text-[10px] text-slate-400">Reflective objects (Mirrors /, \) redirect guard sightlines and active shots at 90° angles based on their orientation.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <StickyNote size={14} className="text-amber-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 uppercase text-[10px]">Adhesive Immobilization:</strong>
              <p className="text-[10px] text-slate-400">Adhesive objects (Glue) stick and freeze whatever lands on them (Guards) for 3 turns. Stuck guards cannot act or face.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
