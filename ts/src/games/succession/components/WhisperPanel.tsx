import React from 'react';
import {
  AlertTriangle,
  MessageSquareQuote,
  Check,
  Radio,
  Lock,
} from 'lucide-react';
import { FigureId, FigureState, Claim } from '../engine/types';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIM_THEMES } from '../data/claimThemes';
import { checkContradictionAgainstKnown } from '../engine/gossip';
import { DOMAIN_RIPPLE_CONFLICTS } from '../data/gameConstants';
import { TickerEntry } from '../types/gameState';
import { PlayerOriginId } from '../engine/types';

interface WhisperPanelProps {
  figure: FigureState;
  allClaims: Claim[];
  ticker: TickerEntry[];
  playerOrigin: PlayerOriginId;
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onHoverTheme: (themeId: string | null) => void;
  onWhisper: (figureId: FigureId, themeId: string) => void;
}

export const WhisperPanel: React.FC<WhisperPanelProps> = ({
  figure,
  allClaims,
  ticker,
  playerOrigin,
  selectedThemeId,
  onSelectTheme,
  onHoverTheme,
  onWhisper,
}) => {
  const meta = COURT_FIGURES[figure.id];

  const isArchbishopWhisperLocked =
    playerOrigin === 'disgraced_knight' &&
    figure.id === 'archbishop' &&
    !ticker.some(
      (t) => t.claimantId === 'player' && t.figureId === 'archbishop' && t.moveType === 'appeal'
    );

  const isThemeContradiction = (themeId: string) =>
    checkContradictionAgainstKnown(allClaims, themeId, CLAIM_THEMES);

  const isCurrentSelectionContradiction = isThemeContradiction(selectedThemeId);

  const domainConflict = DOMAIN_RIPPLE_CONFLICTS[figure.id];
  const opposingFigureMeta = domainConflict ? COURT_FIGURES[domainConflict.targetFigureId] : null;

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/70 flex items-center justify-center text-amber-400">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-stone-100 text-sm sm:text-base">
              Approach 1: Whisper Secret Narrative Claim
            </h3>
            <p className="text-xs text-stone-400">
              Select a statement card to plant in private. Hover over cards to gauge {meta.name.split(' ')[1]}’s reaction.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-serif px-2.5 py-1 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded-lg shrink-0 font-medium">
          High Sway (+20) | Zero-Sum Faction Friction (-4)
        </span>
      </div>

      {isArchbishopWhisperLocked ? (
        <div className="p-4 bg-stone-950/80 border border-amber-900/40 rounded-xl text-xs text-stone-300 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-serif font-semibold text-sm">
            <Lock className="w-4 h-4" />
            <span>Locked by Disgraced Iron Knight Origin</span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
            Due to your disgraced martial past, Archbishop Valerius requires <strong>1 formal Appeal</strong> before granting private audience for whispered claims. Use Approach 2 below to deliver your appeal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Interactive Tactile Statement Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CLAIM_THEMES.map((theme) => {
              const isSelected = theme.id === selectedThemeId;
              const isContradict = isThemeContradiction(theme.id);
              const themeTargetFigure = COURT_FIGURES[theme.figureId];

              return (
                <button
                  key={theme.id}
                  id={`whisper-theme-card-${theme.id}`}
                  type="button"
                  onClick={() => onSelectTheme(theme.id)}
                  onMouseEnter={() => onHoverTheme(theme.id)}
                  onMouseLeave={() => onHoverTheme(null)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 relative flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? isContradict
                        ? 'bg-rose-950/50 border-rose-500 shadow-md ring-1 ring-rose-500'
                        : 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/60'
                      : isContradict
                      ? 'bg-stone-950/70 border-rose-900/50 hover:border-rose-700/80 hover:bg-rose-950/20'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="space-y-1.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-serif px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          theme.figureId === figure.id
                            ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400'
                        }`}
                      >
                        {themeTargetFigure.name.split(' ')[1]} Domain
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-100 group-hover:text-amber-200 transition-colors">
                      "{theme.label}"
                    </h4>
                  </div>

                  {/* Card Bottom: Contradiction warning or projection */}
                  <div className="pt-2.5 mt-2 border-t border-stone-800/60">
                    {isContradict ? (
                      <div className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Contradicts prior claim!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span className="text-amber-400/90 font-serif">+20 Favor</span>
                        {opposingFigureMeta && (
                          <span className="text-stone-500 font-serif">
                            -4 {opposingFigureMeta.name.split(' ')[1]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Contradiction Alert if Selected Card is a Contradiction */}
          {isCurrentSelectionContradiction && (
            <div
              id="audience-whisper-contradiction-warning"
              className="p-3 bg-rose-950/90 border border-rose-600 rounded-xl text-rose-200 text-xs flex items-start gap-3 animate-pulse"
            >
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-semibold block text-rose-100">
                  ⚠️ Contradiction Trap: Cross-Examination Risk!
                </strong>
                <p className="text-[11px] text-rose-300 leading-relaxed">
                  You previously swore an opposing narrative to another Councilor. Delivering this statement will immediately catch you in a lie, awarding <strong>0 favor</strong> and <strong>permanently disqualifying</strong> this Councilor's final vote!
                </p>
              </div>
            </div>
          )}

          {/* Domain Ripple Friction Notice */}
          {!isCurrentSelectionContradiction && opposingFigureMeta && (
            <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl text-xs text-stone-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  <strong>Zero-Sum Repercussion:</strong> Elevating {meta.name.split(' ')[1]}'s estate creates a slight friction (-4 favor) with <strong>{opposingFigureMeta.name}</strong>.
                </span>
              </div>
            </div>
          )}

          {/* Commit Whisper Button */}
          <div className="pt-1">
            <button
              id="audience-execute-whisper-button"
              type="button"
              onClick={() => onWhisper(figure.id, selectedThemeId)}
              className={`w-full py-3 px-6 rounded-xl font-serif font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isCurrentSelectionContradiction
                  ? 'bg-rose-700 hover:bg-rose-600 text-white cursor-pointer shadow-rose-950/50'
                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-amber-950/50 cursor-pointer'
              }`}
            >
              <MessageSquareQuote className="w-4 h-4" />
              <span>
                {isCurrentSelectionContradiction
                  ? `Commit Whisper: "${CLAIM_THEMES.find((t) => t.id === selectedThemeId)?.label}" (Face Exposure)`
                  : `Commit Whisper: "${CLAIM_THEMES.find((t) => t.id === selectedThemeId)?.label}" (+20)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
