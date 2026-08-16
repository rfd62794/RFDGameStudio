import React from 'react';
import {
  Crown,
  Trophy,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Shield,
  Scale,
  BookOpen,
  Scroll,
  Quote,
  Flame,
  Building,
  Swords,
  Coins,
} from 'lucide-react';
import { GameState } from '../types/gameState';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIMANTS } from '../data/claimants';
import { PLAYER_ORIGINS } from '../data/origins';
import { getEpilogue } from '../data/epilogues';

interface VerdictScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
}

export const VerdictScreen: React.FC<VerdictScreenProps> = ({
  gameState,
  onPlayAgain,
}) => {
  const { verdict, figures, playerOrigin } = gameState;

  if (!verdict) {
    return null;
  }

  const overallWinnerData = verdict.overallWinner
    ? CLAIMANTS[verdict.overallWinner]
    : null;
  const isPlayerWinner = verdict.overallWinner === 'player';
  const originData = PLAYER_ORIGINS.find((o) => o.id === playerOrigin) || PLAYER_ORIGINS[0];
  const epilogue = getEpilogue(verdict, playerOrigin);

  // Helper for figure icon
  const getFigureIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-sky-400" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      default:
        return <Crown className="w-4 h-4 text-amber-400" />;
    }
  };

  const getOriginIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'Coins':
        return <Coins className="w-4 h-4 text-amber-300" />;
      default:
        return <Crown className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full border border-stone-800 bg-stone-900/90 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-sm">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 mb-1 shadow-inner">
            {isPlayerWinner ? (
              <Trophy className="w-8 h-8 text-amber-300" />
            ) : overallWinnerData ? (
              <Crown className="w-8 h-8 text-indigo-400" />
            ) : (
              <Scale className="w-8 h-8 text-stone-400" />
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-950 border border-stone-800 text-xs font-serif text-amber-300">
            {getOriginIcon(originData.icon)}
            <span>Your Origin: {originData.name} ({originData.subtitle})</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-200">
            Midnight’s Verdict & Council Autopsy
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm font-serif italic">
            The 24-Hour Interregnum concludes. The High Council has sealed their judgment.
          </p>
        </div>

        {/* Overall Verdict Banner */}
        <div
          id="verdict-overall-banner"
          className={`rounded-2xl p-6 sm:p-7 border text-center space-y-3 ${
            isPlayerWinner
              ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50'
              : overallWinnerData
              ? 'bg-indigo-950/40 border-indigo-700/60 shadow-lg shadow-indigo-950/50'
              : 'bg-stone-900 border-stone-700 shadow-lg'
          }`}
        >
          {isPlayerWinner ? (
            <>
              <div className="inline-block text-xs font-mono tracking-widest text-amber-400 uppercase font-bold px-3 py-1 bg-amber-950/80 border border-amber-800 rounded-full">
                {epilogue.title}
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-200">
                You Ascend to the Throne
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
                {verdict.isMajority
                  ? 'Through a commanding majority of the High Estates, the realm unites under your banner. Long live the new Monarch!'
                  : 'In a fractured court deadlock, your unwavering consistency and minimal exposure won over the council. The realm is yours.'}
              </p>
              <div className="text-xs text-amber-300/90 font-serif pt-1">
                <strong>Ruling Coalition:</strong> {epilogue.coalitionDescription}
              </div>
            </>
          ) : overallWinnerData ? (
            <>
              <div className="inline-block text-xs font-mono tracking-widest text-indigo-300 uppercase font-bold px-3 py-1 bg-indigo-950/80 border border-indigo-800 rounded-full">
                {epilogue.title}
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-indigo-200">
                {overallWinnerData.name} Takes the Crown
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
                {verdict.isMajority
                  ? `${overallWinnerData.name} secured the decisive majority of the Council of Three, securing sovereign rule.`
                  : `In a deeply contested deadlock, ${overallWinnerData.name} broke through to claim the kingdom.`}
              </p>
              <div className="text-xs text-indigo-300/90 font-serif pt-1">
                <strong>Ascendant Faction:</strong> {epilogue.coalitionDescription}
              </div>
            </>
          ) : (
            <>
              <div className="inline-block text-xs font-mono tracking-widest text-stone-400 uppercase font-bold px-3 py-1 bg-stone-950 border border-stone-800 rounded-full">
                {epilogue.title}
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-200">
                The Throne Sits Empty
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
                A perfect impasse. The three figures remain locked without consensus, and the realm slips into a regency interregnum.
              </p>
            </>
          )}
        </div>

        {/* Narrative Chronicler Autopsy & Origin Epilogue */}
        <div
          id="verdict-chronicler-epilogue"
          className="bg-stone-950/90 border border-amber-900/60 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm sm:text-base">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Historical Chronicler of the Interregnum</span>
            </div>
            <span className="text-[11px] font-serif px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
              {epilogue.chapterTitle}
            </span>
          </div>

          {/* Main Chronicle Text */}
          <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-stone-300 font-serif">
            <p className="first-letter:text-2xl first-letter:font-bold first-letter:text-amber-400 first-letter:mr-1 first-letter:float-left">
              {epilogue.chronicleText}
            </p>
            <div className="p-3.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-1.5 mt-2">
              <div className="flex items-center gap-2 text-amber-400 font-serif text-xs font-semibold uppercase tracking-wider">
                <Scroll className="w-4 h-4 text-amber-500" />
                <span>Origin Autopsy: Fate of the {originData.name}</span>
              </div>
              <p className="text-xs text-stone-300 italic leading-relaxed">
                "{epilogue.originFlavor}"
              </p>
            </div>
          </div>
        </div>

        {/* Councilor Post-Mortem Remarks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h3 className="font-serif font-semibold text-stone-200 text-sm flex items-center gap-2">
              <Quote className="w-4 h-4 text-amber-400" />
              <span>Councilor Post-Mortem Statements</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-serif">
              Final individual votes & testimonies
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {figures.map((figure) => {
              const meta = COURT_FIGURES[figure.id];
              const winnerId = verdict.perFigureWinner[figure.id];
              const winnerData = winnerId ? CLAIMANTS[winnerId] : null;
              const isPlayerExposed = figure.exposedAgainst.includes('player');
              const postMortem = epilogue.postMortems.find((p) => p.figureId === figure.id);

              // Identify if player had highest favor but was disqualified
              const playerHadTopFavor =
                figure.favor.player > figure.favor.aldric &&
                figure.favor.player > figure.favor.vivienne;
              const wasDisqualified = isPlayerExposed && playerHadTopFavor;

              return (
                <div
                  key={figure.id}
                  id={`verdict-figure-${figure.id}`}
                  className={`bg-stone-950 border rounded-xl p-4 space-y-3 flex flex-col justify-between transition-all ${
                    winnerId === 'player'
                      ? 'border-amber-700/60 bg-amber-950/10'
                      : isPlayerExposed
                      ? 'border-rose-900/60 bg-rose-950/10'
                      : 'border-stone-800'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-stone-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        {getFigureIcon(meta.avatarIcon)}
                        <div>
                          <h4 className="font-serif font-bold text-stone-100 text-sm">
                            {meta.name}
                          </h4>
                          <p className="text-[11px] text-stone-400">{meta.domain}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-serif px-2 py-0.5 rounded border uppercase tracking-wider ${
                          winnerId === 'player'
                            ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                            : winnerId
                            ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400'
                        }`}
                      >
                        {winnerId === 'player' ? 'Player Vote' : winnerId ? `${winnerId} Vote` : 'Deadlock'}
                      </span>
                    </div>

                    {/* Post-Mortem Quote */}
                    {postMortem && (
                      <div className="p-2.5 bg-stone-900/60 border border-stone-800/70 rounded-lg">
                        <p className="text-[11px] text-stone-300 italic leading-snug">
                          {postMortem.quote}
                        </p>
                      </div>
                    )}

                    {/* Endorsement Result */}
                    <div className="pt-1 text-xs">
                      <span className="text-[11px] text-stone-500 font-mono block">
                        Official Endorsement:
                      </span>
                      {winnerData ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {winnerData.isPlayer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          )}
                          <span
                            className={`font-serif font-bold text-sm ${
                              winnerData.isPlayer ? 'text-amber-300' : 'text-stone-200'
                            }`}
                          >
                            {winnerData.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-500 italic">No Winner (Deadlock)</span>
                      )}

                      {/* Disqualification / Reason tag */}
                      {wasDisqualified ? (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Disqualified — caught contradicting!</span>
                        </p>
                      ) : isPlayerExposed ? (
                        <p className="text-[11px] text-rose-400/80 mt-1">
                          (Player exposed for contradiction)
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Final Favor Tally */}
                  <div className="bg-stone-900/80 rounded-lg p-2.5 border border-stone-800 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>You:</span>
                      </span>
                      <strong className="text-amber-300">{figure.favor.player}</strong>
                    </div>
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Aldric:</span>
                      </span>
                      <strong className="text-stone-300">{figure.favor.aldric}</strong>
                    </div>
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <span>Vivienne:</span>
                      </span>
                      <strong className="text-stone-300">{figure.favor.vivienne}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Play Again */}
        <div className="pt-4 flex justify-center">
          <button
            id="play-again-btn"
            onClick={onPlayAgain}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-serif font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-amber-950/50 flex items-center gap-2.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>

      </div>
    </div>
  );
};
