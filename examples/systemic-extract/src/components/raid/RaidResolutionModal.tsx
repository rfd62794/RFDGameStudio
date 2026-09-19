import React from 'react';

export interface ExtractSummary {
  scrap: number;
  walls: number;
  guards: number;
  duration: number;
  scavenged?: { id: string; name: string; count: number }[];
}

interface RaidResolutionModalProps {
  raidFinished: 'extracted' | 'kia' | null;
  extractSummary: ExtractSummary | null;
  onConfirmEndRaid: () => void;
}

export const RaidResolutionModal: React.FC<RaidResolutionModalProps> = ({
  raidFinished,
  extractSummary,
  onConfirmEndRaid,
}) => {
  if (!raidFinished || !extractSummary) return null;

  return (
    <div id="raid-resolution-modal" className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-[#334155] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
        <div className="space-y-2">
          <div
            className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase ${
              raidFinished === 'extracted'
                ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40'
                : 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40'
            }`}
          >
            {raidFinished === 'extracted' ? 'MISSION STATUS: EXTRACTED' : 'MISSION STATUS: KIA'}
          </div>
          <h2 className="text-2xl font-bold font-mono text-white">
            {raidFinished === 'extracted'
              ? 'EXTRACTION CONFIRMED'
              : 'OPERATIVE TERMINATED'}
          </h2>
          <p className="text-sm text-[#94a3b8]">
            {raidFinished === 'extracted'
              ? 'All recovered scrap and remaining munitions have been secured for delivery to the Hideout.'
              : 'Field signal lost. All unextracted scrap and equipped tactical charges were forfeited.'}
          </p>
        </div>

        {/* Raid Statistics Matrix */}
        <div className="grid grid-cols-2 gap-3 bg-[#1e293b]/70 border border-[#334155] p-4 rounded-xl font-mono text-left">
          <div>
            <span className="text-xs text-[#94a3b8] block">SCRAP SECURED</span>
            <span className={`text-lg font-bold ${raidFinished === 'extracted' ? 'text-[#fbbf24]' : 'text-[#94a3b8]'}`}>
              +{extractSummary.scrap} Scrap
            </span>
          </div>
          <div>
            <span className="text-xs text-[#94a3b8] block">WALLS BREACHED</span>
            <span className="text-lg font-bold text-white">
              {extractSummary.walls} Demolished
            </span>
          </div>
          <div>
            <span className="text-xs text-[#94a3b8] block">GUARDS NEUTRALIZED</span>
            <span className="text-lg font-bold text-[#38bdf8]">
              {extractSummary.guards} Security
            </span>
          </div>
          <div>
            <span className="text-xs text-[#94a3b8] block">RAID TIME</span>
            <span className="text-lg font-bold text-white">
              {extractSummary.duration}s Elapsed
            </span>
          </div>
        </div>

        {/* Scavenged Tagged Salvage Caches */}
        {extractSummary.scavenged && extractSummary.scavenged.length > 0 && (
          <div className="bg-[#1e293b]/70 border border-[#334155] p-3 rounded-xl text-left font-mono">
            <span className="text-xs text-[#c084fc] font-bold block mb-2 tracking-wider">
              TAGGED RESEARCH SALVAGE SECURED ({extractSummary.scavenged.length})
            </span>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {extractSummary.scavenged.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-[#0f172a] px-2.5 py-1.5 rounded border border-[#334155]"
                >
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-[#a855f7] font-bold">+{item.count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs font-mono text-[#64748b] bg-[#090d13] p-2 rounded border border-[#1e293b]">
          ENDPOINT DISPATCH: <code>POST /raid/extract</code> — Synchronizing with Hideout Database...
        </div>

        <button
          id="btn-return-hideout"
          onClick={onConfirmEndRaid}
          className={`w-full py-3 rounded-xl font-mono font-bold text-white shadow-lg transition cursor-pointer ${
            raidFinished === 'extracted'
              ? 'bg-[#10b981] hover:bg-[#059669]'
              : 'bg-[#3b82f6] hover:bg-[#2563eb]'
          }`}
        >
          RETURN TO HIDEOUT &amp; INJECT LOOT
        </button>
      </div>
    </div>
  );
};
