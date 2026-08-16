import React, { useState } from 'react';
import {
  MessageSquareQuote,
  Scale,
  FileCheck,
  Search,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { FigureState, FigureId, Claim } from '../engine/types';
import { checkContradiction } from '../engine/contradiction';
import { checkContradictionAgainstKnown } from '../engine/gossip';
import { CLAIM_THEMES } from '../data/claimThemes';
import { EvidenceItem } from '../data/evidence';
import { COURT_FIGURES } from '../data/courtFigures';

interface MoveSelectorProps {
  selectedFigure: FigureState | null;
  playerEvidence: EvidenceItem[];
  allClaims: Claim[];
  onWhisper: (figureId: FigureId, themeId: string) => void;
  onAppeal: (figureId: FigureId) => void;
  onPresentEvidence: (figureId: FigureId, evidenceId: string) => void;
  onScout: () => void;
}

export const MoveSelector: React.FC<MoveSelectorProps> = ({
  selectedFigure,
  playerEvidence,
  allClaims,
  onWhisper,
  onAppeal,
  onPresentEvidence,
  onScout,
}) => {
  const [_whisperThemeId, setWhisperThemeId] = useState<string | null>(null);

  const selectedFigureMeta = selectedFigure
    ? COURT_FIGURES[selectedFigure.id]
    : null;

  // Available themes for the selected figure
  const figureThemes = selectedFigure
    ? CLAIM_THEMES.filter((t) => t.figureId === selectedFigure.id)
    : [];

  // Find matching evidence for the selected figure
  const matchingEvidence = selectedFigure
    ? playerEvidence.find((e) => e.relevantFigureId === selectedFigure.id)
    : null;

  // Handler for whisper commit
  const handleWhisperCommit = (themeId: string) => {
    if (!selectedFigure) return;
    onWhisper(selectedFigure.id, themeId);
    setWhisperThemeId(null);
  };

  return (
    <section className="space-y-4 bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <h2 className="font-serif font-bold text-base text-amber-200 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Choose Your Action</span>
        </h2>
        {selectedFigureMeta ? (
          <span className="text-xs text-stone-300 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700 font-serif">
            Targeting: <strong className="text-amber-300">{selectedFigureMeta.name}</strong> ({selectedFigureMeta.domain})
          </span>
        ) : (
          <span className="text-xs text-stone-500 italic">
            Select a Council Figure above to unlock figure-directed moves
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. WHISPER ACTION */}
        <div
          id="action-whisper-card"
          className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
            !selectedFigure
              ? 'border-stone-800/40 bg-stone-950/40 opacity-60'
              : 'border-stone-700/80 bg-stone-950/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-stone-100 font-serif font-semibold text-sm">
                <MessageSquareQuote className="w-4 h-4 text-amber-400" />
                <span>Whisper a Claim</span>
              </div>
              <span className="text-xs font-serif px-2.5 py-0.5 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded font-medium">
                Audacious Sway
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              Make an audacious courtly claim. Powerful sway, but risks permanent exposure if it contradicts your previous statements across the Court.
            </p>

            {/* Theme choices with LIVE contradiction preview */}
            {selectedFigure && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] text-stone-400 font-mono block">
                  Select Theme to Whisper:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {figureThemes.map((theme) => {
                    const isContradiction =
                      checkContradiction(
                        selectedFigure.mostRecentClaim,
                        theme.id,
                        CLAIM_THEMES
                      ) ||
                      checkContradictionAgainstKnown(
                        allClaims,
                        theme.id,
                        CLAIM_THEMES
                      );

                    return (
                      <button
                        key={theme.id}
                        id={`whisper-theme-${theme.id}`}
                        onClick={() => handleWhisperCommit(theme.id)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          isContradiction
                            ? 'bg-rose-950/30 hover:bg-rose-950/50 border-rose-800/80 text-rose-200'
                            : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-200 hover:text-amber-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-serif font-semibold flex items-center gap-1.5">
                            <span>{theme.label}</span>
                          </div>
                          {isContradiction ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>⚠️ Contradicts a known claim in Court!</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-sans">
                              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>Safe statement</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!selectedFigure && (
            <p className="text-[11px] text-stone-500 italic mt-3">
              Requires selecting a Council Figure.
            </p>
          )}
        </div>

        {/* 2. APPEAL ACTION */}
        <div
          id="action-appeal-card"
          className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
            !selectedFigure
              ? 'border-stone-800/40 bg-stone-950/40 opacity-60'
              : 'border-stone-700/80 bg-stone-950/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-stone-100 font-serif font-semibold text-sm">
                <Scale className="w-4 h-4 text-sky-400" />
                <span>Formal Appeal</span>
              </div>
              <span className="text-xs font-serif px-2.5 py-0.5 bg-sky-950/60 border border-sky-800/60 text-sky-300 rounded font-medium">
                Measured Sway
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Plead your case through conventional decorum. Safe and consistent, with zero risk of contradiction.
            </p>
          </div>

          <button
            id="appeal-submit-btn"
            disabled={!selectedFigure}
            onClick={() => selectedFigure && onAppeal(selectedFigure.id)}
            className={`w-full py-2.5 px-4 rounded-lg font-serif text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedFigure
                ? 'bg-sky-950 hover:bg-sky-900 border border-sky-700/80 text-sky-200 cursor-pointer shadow-sm'
                : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>
              {selectedFigure ? `Appeal to ${selectedFigureMeta?.name}` : 'Select a figure to Appeal'}
            </span>
          </button>
        </div>

        {/* 3. PRESENT EVIDENCE */}
        <div
          id="action-evidence-card"
          className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
            !selectedFigure || !matchingEvidence
              ? 'border-stone-800/40 bg-stone-950/40 opacity-60'
              : 'border-stone-700/80 bg-stone-950/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-stone-100 font-serif font-semibold text-sm">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Present Evidence</span>
              </div>
              <span className="text-xs font-serif px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded font-medium">
                Decisive Sway
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              Offer incontrovertible proof relevant to this figure’s domain. Consumes the evidence item.
            </p>

            {matchingEvidence && (
              <div className="p-3 bg-stone-900 border border-emerald-800/40 rounded-lg text-xs space-y-1 mb-3">
                <div className="font-serif font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{matchingEvidence.name}</span>
                </div>
                <p className="text-[11px] text-stone-400 italic">
                  "{matchingEvidence.flavor}"
                </p>
              </div>
            )}
          </div>

          <button
            id="present-evidence-btn"
            disabled={!selectedFigure || !matchingEvidence}
            onClick={() =>
              selectedFigure &&
              matchingEvidence &&
              onPresentEvidence(selectedFigure.id, matchingEvidence.id)
            }
            className={`w-full py-2.5 px-4 rounded-lg font-serif text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedFigure && matchingEvidence
                ? 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-200 cursor-pointer shadow-sm'
                : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>
              {matchingEvidence
                ? `Present to ${selectedFigureMeta?.name}`
                : selectedFigure
                ? 'No matching evidence held'
                : 'Select figure to present'}
            </span>
          </button>
        </div>

        {/* 4. SCOUT ACTION */}
        <div
          id="action-scout-card"
          className="border border-stone-700/80 bg-stone-950/80 rounded-xl p-4 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-stone-100 font-serif font-semibold text-sm">
                <Search className="w-4 h-4 text-purple-400" />
                <span>Scout for Evidence</span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 bg-purple-950/60 border border-purple-800/60 text-purple-300 rounded">
                Acquire Item
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              Dispatch agents into the archives and barracks to unearth domain documents. Yields proof for future presentation.
            </p>

            {/* Currently held items counter */}
            <div className="text-xs text-stone-400 bg-stone-900/60 border border-stone-800 rounded-lg p-2 mb-3 flex items-center justify-between">
              <span>Held Evidence:</span>
              <span className="font-mono text-stone-200 font-semibold">
                {playerEvidence.length} item{playerEvidence.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <button
            id="scout-evidence-btn"
            onClick={onScout}
            className="w-full py-2.5 px-4 rounded-lg font-serif text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-purple-950 hover:bg-purple-900 border border-purple-700/80 text-purple-200 cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Scout Archives (1 Turn)</span>
          </button>
        </div>
      </div>
    </section>
  );
};
