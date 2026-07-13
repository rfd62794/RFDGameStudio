import React from 'react';
import { Corporation, GameDate, MapCell } from '../types';

interface AnnualReportViewProps {
  corporations: Corporation[];
  cells: MapCell[];
  date: GameDate;
  campaignOver: boolean;
  onResetGame: () => void;
  onContinuePostGame?: () => void; // Optional to let them play forever
}

export default function AnnualReportView({
  corporations,
  cells,
  date,
  campaignOver,
  onResetGame,
  onContinuePostGame
}: AnnualReportViewProps) {
  // Sort corporations by controlled cells count
  const getCellCount = (corpId: string) => {
    return cells.filter(c => c.ownerId === corpId).length;
  };

  const getGarrisonCount = (corpId: string) => {
    let total = 0;
    cells.forEach(c => {
      if (c.ownerId === corpId) {
        total += c.units.circle + c.units.square + c.units.triangle;
      }
    });
    return total;
  };

  const scoreboard = [...corporations].sort((a, b) => {
    const aCells = getCellCount(a.id);
    const bCells = getCellCount(b.id);
    if (bCells !== aCells) return bCells - aCells;
    return b.treasury - a.treasury; // tie breaker: cash
  });

  const playerRank = scoreboard.findIndex(c => c.isPlayer) + 1;
  const playerCorp = corporations.find(c => c.isPlayer)!;
  const playerCells = getCellCount(playerCorp.id);

  // Win/Loss evaluations
  const isPlayerEliminated = playerCells === 0;
  const hasWonCampaign = campaignOver && playerRank === 1 && !isPlayerEliminated;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none overflow-y-auto animate-fade-in" id="annual-report-panel">
      <div className="bg-[#E4E3E0] border-4 border-[#141414] max-w-2xl w-full p-6 shadow-[6px_6px_0px_0px_#141414] flex flex-col gap-5 text-[#141414]">
        
        {/* Slide Title */}
        <div className="border-b-2 border-[#141414]/20 pb-4 text-center">
          <span className="font-serif italic text-[11px] text-[#141414]/70 font-bold uppercase tracking-widest block leading-none mb-1">
            {campaignOver ? 'FINAL CONQUEST STANDING' : `ANNUAL REVIEW // AUDIT EPOCH ${date.year - 1}`}
          </span>
          <h1 className="text-2xl font-sans font-black text-[#141414] tracking-tight uppercase">
            {campaignOver ? 'Campaign Performance Audit' : 'Board of Directors Audit Report'}
          </h1>
          <p className="text-xs text-[#141414]/60 font-serif italic mt-1">
            Planet Discovery Recon · Final Territory Grid Valuation metrics.
          </p>
        </div>

        {/* Campaign Conclusion Banner */}
        {campaignOver && (
          <div className={`p-4 border-2 shadow-[2px_2px_0px_0px_#141414] text-center ${
            hasWonCampaign 
              ? 'bg-emerald-100 border-[#141414] text-emerald-900' 
              : 'bg-red-100 border-[#141414] text-red-900'
          }`}>
            <h2 className="text-lg font-black uppercase font-sans tracking-tight">
              {hasWonCampaign ? '🏆 Perimeter Conquest Secured' : '⚠️ Operational Demotion Issued'}
            </h2>
            <p className="text-xs font-mono font-semibold mt-1.5 leading-relaxed text-[#141414]/90">
              {hasWonCampaign 
                ? `Vanguard Conglomerate has seized a dominant market share of ${Math.round((playerCells/cells.length)*100)}% on Planet Grid Alpha. Apex executives approve the dividend payout.`
                : isPlayerEliminated 
                  ? 'Vanguard Conglomerate was completely wiped out from the surface of the planet. All assets liquidating.'
                  : `Vanguard Conglomerate finished in Rank #${playerRank} of 5. Rival entities achieved superior territorial synergy. Directors have voted to terminate your command.`
              }
            </p>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Column: Player Performance breakdown */}
          <div className="bg-white p-4 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414] flex flex-col gap-3">
            <span className="font-serif italic text-[11px] text-[#141414]/70 uppercase font-bold leading-none">Vanguard Performance Metrics</span>
            
            <div className="flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#141414]/10">
                <span className="text-[#141414]/60">Corporate Standing Rank:</span>
                <span className="font-black text-[#141414] text-sm">#{playerRank} of 5</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#141414]/10">
                <span className="text-[#141414]/60">Controlled Sectors:</span>
                <span className="font-bold text-[#141414]">{playerCells} / {cells.length}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#141414]/10">
                <span className="text-[#141414]/60">Active Troop Garrison:</span>
                <span className="font-bold text-[#141414]">{getGarrisonCount(playerCorp.id)} Units</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#141414]/10">
                <span className="text-[#141414]/60">Liquid Financial Valuation:</span>
                <span className="font-black text-emerald-700">${playerCorp.treasury.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Scoreboard */}
          <div className="bg-white p-4 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414] flex flex-col gap-2">
            <span className="font-serif italic text-[11px] text-[#141414]/70 uppercase font-bold leading-none mb-1">Planetary Market Share Index</span>
            
            <div className="flex flex-col gap-2">
              {scoreboard.map((corp, idx) => {
                const cCount = getCellCount(corp.id);
                const gCount = getGarrisonCount(corp.id);
                const isPlayer = corp.isPlayer;

                return (
                  <div 
                    key={corp.id} 
                    className={`flex items-center justify-between p-2 text-xs font-mono border-2 transition ${
                      isPlayer 
                        ? 'bg-cyan-100 border-cyan-800 text-[#141414]' 
                        : 'bg-[#E4E3E0]/40 border-[#141414]/20 text-[#141414]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#141414]/50 w-3 text-right">#{idx + 1}</span>
                      <span className="w-2.5 h-2.5 rounded-full border border-[#141414]/30" style={{ backgroundColor: corp.color }}></span>
                      <span className="font-black text-[#141414] truncate max-w-[120px]" style={isPlayer ? { color: corp.color } : undefined}>
                        {corp.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[#141414]/75">
                      <span title="Controlled Sectors" className="font-bold text-[#141414]">
                        📁 {cCount}
                      </span>
                      <span title="Military Units">
                        🟢 {gCount}
                      </span>
                      <span title="Financial Treasury" className="text-emerald-700 font-black w-16 text-right">
                        ${Math.round(corp.treasury / 1000)}k
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2.5 pt-2.5 border-t-2 border-[#141414]/20">
          <button
            onClick={onResetGame}
            className="w-full bg-red-400 hover:bg-red-500 text-[#141414] font-black border-2 border-[#141414] py-2.5 rounded-none text-xs font-mono uppercase tracking-widest transition shadow-[2px_2px_0px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            id="btn-restart-campaign"
          >
            Restart Land Grab Campaign
          </button>
          
          {campaignOver && !isPlayerEliminated && onContinuePostGame && (
            <button
              onClick={onContinuePostGame}
              className="w-full bg-white hover:bg-[#D4D3D0] text-[#141414] font-bold border-2 border-[#141414] py-2.5 rounded-none text-xs font-mono uppercase tracking-wider transition shadow-[2px_2px_0px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
            >
              Continue Playing Sandbox Mode
            </button>
          )}
        </div>

        {/* Small boardroom text */}
        <p className="text-[9px] text-[#141414]/50 font-mono text-center font-bold uppercase mt-1">
          CONFIDENTIAL REPORT // SHARE PRICE VALUE INDEX CALCULATED IN REALTIME ACROSS FIVE RIVAL CONGLOMERATES.
        </p>

      </div>
    </div>
  );
}
