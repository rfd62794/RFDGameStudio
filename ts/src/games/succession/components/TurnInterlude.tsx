import React from 'react';
import { ArrowRight, MessageSquareQuote, Scale, FileCheck, Search, AlertOctagon, Users, ShieldAlert, Sparkles, Gavel } from 'lucide-react';
import { TickerEntry, GameState } from '../types/gameState';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIMANTS } from '../data/claimants';
import { SEGMENT_LABELS } from '../data/segmentLabels';
import { getFigureQualitativeStanding } from '../utils/favorTiers';

interface TurnInterludeProps {
  gameState: GameState;
  completedSegment: number;
  onProceed: () => void;
}

export const TurnInterlude: React.FC<TurnInterludeProps> = ({
  gameState,
  completedSegment,
  onProceed,
}) => {
  // Extract ticker entries that occurred during the completed segment
  const segmentEntries = gameState.ticker.filter((t) => t.segment === completedSegment);
  const playerEntry = segmentEntries.find((t) => t.claimantId === 'player');
  const rivalEntries = segmentEntries.filter((t) => t.claimantId !== 'player');
  const slanderEntries = rivalEntries.filter((r) => r.moveType === 'slander');

  const currentSegmentLabel = SEGMENT_LABELS[completedSegment] || `Segment ${completedSegment}`;
  const nextSegmentLabel = SEGMENT_LABELS[gameState.segment] || `Segment ${gameState.segment}`;
  const isApproachingVerdict = gameState.phase === 'verdict' || gameState.segment > 8;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 text-center space-y-3 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-800/60 rounded-full text-amber-300 text-xs font-serif tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Turn Resolution — {currentSegmentLabel}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
          The Council Reacts
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
          Your maneuvers have shifted the atmosphere in the Grand Chamber, prompting immediate counter-moves from Lord Aldric and Lady Vivienne.
        </p>
      </div>

      {/* Slander Alert Banner if any rival executed slander */}
      {slanderEntries.length > 0 && (
        <div
          id="slander-alert-banner"
          className="p-4 bg-rose-950/60 border border-rose-700/80 rounded-xl flex items-start gap-3.5 text-rose-200 shadow-lg shadow-rose-950/40 animate-pulse"
        >
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-sm text-rose-100">
              Rival Counter-Espionage: Slander Detected!
            </h4>
            <p className="text-xs text-rose-300/90 leading-relaxed">
              {slanderEntries.map((s, idx) => {
                const rivalName = CLAIMANTS[s.claimantId]?.name;
                const figureName = s.figureId ? COURT_FIGURES[s.figureId]?.name : 'the Council';
                return (
                  <span key={idx} className="block">
                    • <strong>{rivalName}</strong> poisoned the ear of <strong>{figureName}</strong>, targeting your decisive lead and eroding <strong>10 favor points</strong>!
                  </span>
                );
              })}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Your Action Recap Card */}
        <div className="bg-stone-900/70 border border-amber-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-600 flex items-center justify-center text-amber-300 font-serif font-bold text-xs">
              You
            </div>
            <h3 className="font-serif font-semibold text-stone-200 text-sm">
              Your Maneuver
            </h3>
          </div>

          {playerEntry ? (
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                playerEntry.exposed
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-stone-950/80 border-stone-800 text-stone-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  {playerEntry.moveType === 'whisper' && <MessageSquareQuote className="w-4 h-4" />}
                  {playerEntry.moveType === 'appeal' && <Scale className="w-4 h-4" />}
                  {playerEntry.moveType === 'evidence' && <FileCheck className="w-4 h-4" />}
                  {playerEntry.moveType === 'scout' && <Search className="w-4 h-4" />}
                  {playerEntry.moveType === 'indictment' && <Gavel className="w-4 h-4 text-purple-400" />}
                  <span>{playerEntry.moveType}</span>
                </span>
                {playerEntry.exposed ? (
                  <span className="px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700 text-rose-300 text-[11px] font-bold">
                    Perjury Exposed!
                  </span>
                ) : playerEntry.moveType === 'indictment' ? (
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700 text-purple-200 text-[11px] font-serif font-bold">
                    Case Proved (+40)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] font-serif">
                    Delivered
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {playerEntry.moveType === 'scout' ? (
                  'You spent this hour scouring the palace records, successfully securing archival evidence.'
                ) : playerEntry.moveType === 'indictment' ? (
                  playerEntry.exposed ? (
                    <>
                      Your regicide accusation before{' '}
                      <strong className="text-rose-300">
                        {COURT_FIGURES[playerEntry.figureId!]?.name}
                      </strong>{' '}
                      failed the evidentiary test! Caught in fabricated testimony, you have{' '}
                      <strong className="text-rose-400">permanently lost their backing</strong>.
                    </>
                  ) : (
                    <>
                      You delivered an airtight Regicide Triad indictment to{' '}
                      <strong className="text-purple-300">
                        {COURT_FIGURES[playerEntry.figureId!]?.name}
                      </strong>
                      ! The truth was proved beyond reasonable doubt (+40 favor).
                    </>
                  )
                ) : playerEntry.moveType === 'evidence' ? (
                  <>
                    You formally presented domain evidence to{' '}
                    <strong className="text-emerald-300">
                      {COURT_FIGURES[playerEntry.figureId!]?.name}
                    </strong>
                    , leaving an indelible mark on their judgment.
                  </>
                ) : playerEntry.moveType === 'appeal' ? (
                  <>
                    You made a dignified, risk-free public appeal to{' '}
                    <strong className="text-sky-300">
                      {COURT_FIGURES[playerEntry.figureId!]?.name}
                    </strong>
                    .
                  </>
                ) : playerEntry.exposed ? (
                  <>
                    Your claim to{' '}
                    <strong className="text-rose-300">
                      {COURT_FIGURES[playerEntry.figureId!]?.name}
                    </strong>{' '}
                    directly contradicted an established court narrative. You have been caught in a falsehood and{' '}
                    <strong className="text-rose-400">permanently lost their backing</strong>.
                  </>
                ) : (
                  <>
                    You whispered a calculated claim to{' '}
                    <strong className="text-amber-300">
                      {COURT_FIGURES[playerEntry.figureId!]?.name}
                    </strong>
                    , shifting their disposition in your favor.
                  </>
                )}
              </p>
              {/* Zero-Sum Domain Ripple Reaction */}
              {playerEntry.ripple && (
                <div
                  id="interlude-domain-ripple-notice"
                  className="p-2.5 bg-amber-950/30 border border-amber-800/60 rounded-lg text-xs space-y-1 mt-2"
                >
                  <div className="flex items-center justify-between text-amber-300 font-serif text-[11px] font-semibold">
                    <span>Zero-Sum Domain Friction:</span>
                    <span className="text-amber-400">-{playerEntry.ripple.penalty} Favor ({COURT_FIGURES[playerEntry.ripple.targetFigureId].name.split(' ')[1]})</span>
                  </div>
                  <p className="text-[11px] text-stone-400 italic leading-snug">
                    "{playerEntry.ripple.reason}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic p-3">No player action recorded for this hour.</p>
          )}
        </div>

        {/* Rival Counter-Moves Card */}
        <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
            <Users className="w-4 h-4 text-stone-400" />
            <h3 className="font-serif font-semibold text-stone-200 text-sm">
              Rival Maneuvers
            </h3>
          </div>

          <div className="space-y-2.5">
            {rivalEntries.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3">The rivals made no overt moves this hour.</p>
            ) : (
              rivalEntries.map((rival) => {
                const claimant = CLAIMANTS[rival.claimantId];
                const figure = rival.figureId ? COURT_FIGURES[rival.figureId] : null;
                const isSlander = rival.moveType === 'slander';

                return (
                  <div
                    key={rival.claimantId}
                    className={`p-3 rounded-lg text-xs space-y-1.5 border transition-all ${
                      isSlander
                        ? 'bg-rose-950/40 border-rose-800/80 shadow-inner shadow-rose-950/50'
                        : 'bg-stone-950/80 border-stone-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rival.claimantId === 'aldric' ? 'bg-indigo-500' : 'bg-purple-500'
                          }`}
                        />
                        <strong className="text-stone-200 font-serif">
                          {claimant.name}
                        </strong>
                        <span className="text-[10px] text-stone-500">
                          ({claimant.title})
                        </span>
                      </div>
                      {isSlander ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-700/80 text-rose-300 text-[10px] font-serif font-bold">
                          Slander (-10)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700/60 text-stone-300 text-[10px] font-serif">
                          {rival.claimantId === 'aldric' ? 'The Opportunist' : 'The Disruptor'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-400 leading-relaxed">
                      {isSlander ? (
                        rival.claimantId === 'aldric' ? (
                          <>
                            <strong className="text-rose-300">Poisoned the ear</strong> of <strong className="text-stone-200">{figure?.name}</strong>, exploiting your absent presence to cast doubt on your claims and eroding your standing by <strong className="text-rose-400">10 favor</strong>.
                          </>
                        ) : (
                          <>
                            <strong className="text-rose-300">Aggressively slandered</strong> your legitimacy before <strong className="text-stone-200">{figure?.name}</strong>, dismantling your decisive lead by <strong className="text-rose-400">10 favor</strong>.
                          </>
                        )
                      ) : rival.claimantId === 'aldric' ? (
                        <>
                          Targeted <strong className="text-indigo-300">{figure?.name}</strong>, exploiting Council neglect with private overtures (+15 favor).
                        </>
                      ) : (
                        <>
                          Approached <strong className="text-purple-300">{figure?.name}</strong>, attempting to undermine competitive margins (+15 favor).
                        </>
                      )}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Council State Snapshot (Qualitative) */}
      <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-5 space-y-3">
        <h4 className="font-serif font-semibold text-stone-300 text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
          <span>Updated Council Dispositions</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {gameState.figures.map((fig) => {
            const meta = COURT_FIGURES[fig.id];
            const standing = getFigureQualitativeStanding(fig);
            const isExposed = fig.exposedAgainst.includes('player');

            return (
              <div
                key={fig.id}
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  isExposed
                    ? 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                    : 'bg-stone-950/70 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between font-serif font-semibold">
                  <span className="text-stone-200">{meta.name}</span>
                  {isExposed && (
                    <span className="text-[10px] text-rose-400 font-sans font-bold">Lies Exposed</span>
                  )}
                </div>
                <div className="text-[11px] font-sans text-stone-400 flex items-center justify-between">
                  <span>Disposition:</span>
                  <span className={isExposed ? 'text-rose-400 font-bold' : standing.leaderId === 'player' ? 'text-amber-300 font-medium' : 'text-stone-300'}>
                    {isExposed ? 'Disqualified' : standing.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action to proceed */}
      <div className="pt-2 flex justify-center">
        <button
          id="proceed-next-turn-button"
          onClick={onProceed}
          className="group px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-serif font-bold text-base rounded-xl shadow-xl shadow-amber-950/50 hover:shadow-amber-500/20 transition-all flex items-center gap-3 active:scale-[0.99] cursor-pointer"
        >
          <span>
            {isApproachingVerdict
              ? 'Convene the Council for Final Verdict'
              : `Proceed to ${nextSegmentLabel}`}
          </span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
