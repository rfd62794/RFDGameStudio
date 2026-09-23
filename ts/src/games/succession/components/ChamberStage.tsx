import React from 'react';
import {
  Search,
  Compass,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Eye,
  Flame,
  Radio,
} from 'lucide-react';
import { FigureState, FigureId } from '../engine/types';
import { EvidenceItem } from '../data/evidence';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIM_THEMES } from '../data/claimThemes';
import { getFigureQualitativeStanding } from '../utils/favorTiers';
import { TickerEntry } from '../types/gameState';
import { getTelegraphedRivalRumors, getRivalThreatForFigure } from '../utils/telegraphedRumors';

interface ChamberStageProps {
  figures: FigureState[];
  playerEvidence: EvidenceItem[];
  ticker: TickerEntry[];
  onRequestAudience: (figureId: FigureId) => void;
  onScout: () => void;
}

export const ChamberStage: React.FC<ChamberStageProps> = ({
  figures,
  playerEvidence,
  ticker,
  onRequestAudience,
  onScout,
}) => {
  const telegraphedRumors = getTelegraphedRivalRumors(figures, ticker);

  return (
    <div className="space-y-6">
      {/* Overview Intro Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-900/70 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] font-serif uppercase tracking-wider mb-2">
            The Regicide of King Aldous IV — 24-Hour Interregnum
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 flex items-center gap-2">
            <span>The Grand Chamber</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl leading-relaxed">
            The Three High Councilors hold the throne in balance. Each conceals private vulnerabilities, political demands, and unsolved inquiries regarding the King’s demise.
          </p>
        </div>

        {/* Global Action: Dispatch Scouts */}
        <div className="shrink-0 w-full sm:w-auto relative z-10">
          <button
            id="chamber-scout-button"
            onClick={onScout}
            className="w-full sm:w-auto px-5 py-3.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-600/70 text-purple-200 font-serif font-semibold text-xs rounded-xl shadow-lg shadow-purple-950/40 hover:shadow-purple-900/50 transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-bold">Dispatch Scouts to Archives</div>
              <div className="text-[10px] text-purple-300/80 font-sans font-normal">
                Held Artifacts: {playerEvidence.length} items
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Telegraphed Rival Intent / Spymaster Rumors Banner */}
      {telegraphedRumors.length > 0 && (
        <div
          id="court-spies-telegraph-banner"
          className="bg-stone-950/80 border border-amber-900/50 rounded-xl p-4 sm:p-5 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
            <div className="flex items-center gap-2 text-amber-400 font-serif text-xs font-semibold uppercase tracking-wider">
              <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Court Intelligence: Telegraphed Rival Movements</span>
            </div>
            <span className="text-[11px] text-stone-500 font-serif">
              Intercept or outmaneuver this hour
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {telegraphedRumors.map((rumor, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  rumor.isUrgent
                    ? 'bg-rose-950/30 border-rose-700/60 text-rose-200'
                    : 'bg-stone-900/60 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold flex items-center gap-1.5">
                    {rumor.isUrgent ? (
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className={rumor.isUrgent ? 'text-rose-300' : 'text-amber-300'}>
                      {rumor.headline}
                    </span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-serif border ${
                      rumor.isUrgent
                        ? 'bg-rose-900/50 border-rose-600 text-rose-300'
                        : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                    }`}
                  >
                    {rumor.badgeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  {rumor.flavor}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 Council Figure Cards with Mystery Dossiers & Threat Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-stone-300 text-sm tracking-wide flex items-center gap-2">
            <span>The High Council Dossier</span>
          </h3>
          <span className="text-xs text-stone-500 font-serif">
            Select a Councilor to enter private audience
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {figures.map((figure) => {
            const meta = COURT_FIGURES[figure.id];
            const isExposed = figure.exposedAgainst.includes('player');
            const standing = getFigureQualitativeStanding(figure);
            const lastClaimTheme = figure.mostRecentClaim
              ? CLAIM_THEMES.find((t) => t.id === figure.mostRecentClaim!.themeId)
              : null;
            const isPlayerLeading = standing.leaderId === 'player';
            const threat = getRivalThreatForFigure(figure.id, figures, ticker);

            return (
              <div
                key={figure.id}
                id={`chamber-figure-card-${figure.id}`}
                className={`bg-stone-900/80 border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 relative ${
                  isExposed
                    ? 'border-rose-900/60 bg-rose-950/10'
                    : 'border-stone-800 hover:border-amber-700/60 shadow-lg'
                }`}
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-serif font-bold text-stone-100 text-lg">
                        {meta.name}
                      </h4>
                      <p className="text-xs text-stone-400">{meta.title}</p>
                    </div>
                    <span className="text-[11px] font-serif px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400 shrink-0">
                      {meta.domain}
                    </span>
                  </div>

                  {/* Exposure badge */}
                  {isExposed && (
                    <div className="mb-3 px-3 py-1.5 bg-rose-950/80 border border-rose-600/60 rounded-lg flex items-center gap-2 text-rose-300 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Caught Lying — Will NOT back you!</span>
                    </div>
                  )}

                  {/* Active Rival Threat Badge if targeted this hour */}
                  {!isExposed && threat && (
                    <div
                      className={`mb-3 px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                        threat.moveType === 'slander'
                          ? 'bg-rose-950/50 border-rose-600/70 text-rose-300'
                          : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                      }`}
                    >
                      {threat.moveType === 'slander' ? (
                        <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="text-[11px] font-serif">
                        <strong>{threat.rivalName}</strong> is {threat.moveType === 'slander' ? 'scheming slander here!' : 'courting this domain!'}
                      </span>
                    </div>
                  )}

                  {/* Qualitative Disposition Badge & Breakdown */}
                  <div className="bg-stone-950/80 border border-stone-800/80 rounded-lg p-3 space-y-2 mb-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-serif flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-stone-500" />
                        <span>Disposition</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-serif border ${
                          isExposed
                            ? 'text-rose-400 bg-rose-950/40 border-rose-800/60'
                            : standing.tier === 'Uncommitted / Even'
                            ? 'text-stone-300 bg-stone-900 border-stone-700/60'
                            : isPlayerLeading
                            ? 'text-emerald-300 bg-emerald-950/50 border-emerald-600/60'
                            : 'text-indigo-300 bg-indigo-950/50 border-indigo-700/60'
                        }`}
                      >
                        {isExposed ? 'Disqualified' : standing.label}
                      </span>
                    </div>

                    {/* Claimant Breakdown */}
                    <div className="pt-2 border-t border-stone-800/60 space-y-1 text-xs">
                      {standing.claimantStandings.map((c) => (
                        <div key={c.claimantId} className="flex items-center justify-between text-[11px]">
                          <span className={c.isPlayer ? 'text-amber-300 font-medium' : 'text-stone-400'}>
                            {c.name}:
                          </span>
                          <span className={c.isPlayer ? 'text-stone-200 font-medium' : 'text-stone-400'}>
                            {c.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mystery Dossier: Vulnerability & Demand */}
                  <div className="space-y-2 mb-3.5 text-xs">
                    <div className="p-2.5 bg-stone-950/60 border border-stone-800/70 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-serif text-[11px] font-semibold uppercase tracking-wider">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span>Private Vulnerability</span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-snug">
                        {meta.agenda}
                      </p>
                    </div>

                    <div className="p-2.5 bg-stone-950/60 border border-stone-800/70 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-sky-400 font-serif text-[11px] font-semibold uppercase tracking-wider">
                        <KeyRound className="w-3.5 h-3.5 text-sky-500" />
                        <span>Throne Demand</span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-snug">
                        {meta.demand}
                      </p>
                    </div>

                    <div className="p-2.5 bg-stone-950/60 border border-purple-900/40 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-400 font-serif text-[11px] font-semibold uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                        <span>Active Inquiry</span>
                      </div>
                      <p className="text-[11px] text-stone-400 italic leading-snug">
                        "{meta.mysteryInquiry}"
                      </p>
                    </div>
                  </div>

                  {/* Last told claim */}
                  <div className="flex items-center gap-2 text-xs text-stone-400 mb-4 pb-2 border-b border-stone-800/60">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="text-stone-500 text-[11px]">Last claim:</span>
                    <span className="italic text-stone-300 text-[11px] truncate">
                      {lastClaimTheme ? lastClaimTheme.label : 'None recorded'}
                    </span>
                  </div>
                </div>

                {/* Audience Button */}
                <button
                  id={`request-audience-${figure.id}`}
                  onClick={() => onRequestAudience(figure.id)}
                  className="w-full py-2.5 px-4 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 border border-stone-700 hover:border-amber-500 text-stone-200 font-serif font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-md"
                >
                  <span>Request Audience with {meta.name.split(' ')[1] || meta.name}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
