import React from 'react';

export interface CombatLogEntry {
  id: string;
  text: string;
  type?: 'damage' | 'fire' | 'breach' | 'explosion' | 'extract' | 'info';
}

interface RaidCombatTickerProps {
  combatLogs: CombatLogEntry[];
}

export const RaidCombatTicker: React.FC<RaidCombatTickerProps> = ({ combatLogs }) => {
  return (
    <div
      id="raid-combat-log"
      className="absolute bottom-20 sm:bottom-4 left-3 sm:left-4 max-w-xs sm:max-w-sm w-full pointer-events-none space-y-1 z-10 hidden sm:block"
    >
      {combatLogs.map((log) => (
        <div
          key={log.id}
          className={`text-xs font-mono px-2.5 py-1 rounded backdrop-blur border text-white/90 shadow transition-all duration-300 ${
            log.type === 'damage'
              ? 'bg-[#7f1d1d]/80 border-[#ef4444]/40 text-[#fca5a5]'
              : log.type === 'fire'
              ? 'bg-[#9a3412]/80 border-[#f97316]/40 text-[#fed7aa]'
              : log.type === 'breach' || log.type === 'explosion'
              ? 'bg-[#854d0e]/80 border-[#eab308]/40 text-[#fef08a]'
              : log.type === 'extract'
              ? 'bg-[#065f46]/90 border-[#10b981]/50 text-[#a7f3d0]'
              : 'bg-[#1e293b]/80 border-[#475569]/40 text-[#cbd5e1]'
          }`}
        >
          {log.text}
        </div>
      ))}
    </div>
  );
};
