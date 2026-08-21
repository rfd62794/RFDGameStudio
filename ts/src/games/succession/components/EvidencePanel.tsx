import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2 } from 'lucide-react';
import { FigureId, FigureState } from '../engine/types';
import { EvidenceItem } from '../data/evidence';
import { COURT_FIGURES } from '../data/courtFigures';

interface EvidencePanelProps {
  figure: FigureState;
  playerEvidence: EvidenceItem[];
  onPresentEvidence: (figureId: FigureId, evidenceId: string) => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  figure,
  playerEvidence,
  onPresentEvidence,
}) => {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(
    playerEvidence.length > 0 ? playerEvidence[0].id : ''
  );

  useEffect(() => {
    if (playerEvidence.length > 0 && !playerEvidence.some((e) => e.id === selectedEvidenceId)) {
      setSelectedEvidenceId(playerEvidence[0].id);
    }
  }, [playerEvidence, selectedEvidenceId]);

  const meta = COURT_FIGURES[figure.id];
  const selectedEvidence = playerEvidence.find((e) => e.id === selectedEvidenceId);
  const isEvidenceMatchingFigure = selectedEvidence?.relevantFigureId === figure.id;

  return (
    <div
      id="audience-action-evidence"
      className={`bg-stone-900/80 border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all space-y-4 ${
        playerEvidence.length > 0
          ? isEvidenceMatchingFigure
            ? 'border-emerald-700/80 bg-emerald-950/10'
            : 'border-stone-800 hover:border-emerald-700/50'
          : 'border-stone-800/50 opacity-75'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/70 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-sm">
                Approach 3: Present Archival Evidence
              </h3>
              <p className="text-[11px] text-stone-400">
                Produce physical proof to resolve their active inquiry
              </p>
            </div>
          </div>

          <span className="text-[11px] font-serif px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded font-medium shrink-0">
            Decisive Leverage (+30)
          </span>
        </div>

        {playerEvidence.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <span className="block text-[11px] font-serif uppercase tracking-wider text-stone-400">
                Select Held Item:
              </span>

              <div className="space-y-2">
                {playerEvidence.map((item) => {
                  const isSelected = item.id === selectedEvidenceId;
                  const isMatch = item.relevantFigureId === figure.id;

                  return (
                    <div
                      key={item.id}
                      id={`evidence-card-${item.id}`}
                      onClick={() => setSelectedEvidenceId(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? isMatch
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'bg-stone-900 border-amber-600 ring-1 ring-amber-600/50'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-stone-100">
                          {item.name}
                        </span>
                        {isMatch ? (
                          <span className="text-[10px] text-emerald-400 font-serif flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Target Match (+30)
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-serif">
                            For {COURT_FIGURES[item.relevantFigureId].name.split(' ')[1]}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-400 italic">
                        "{item.flavor}"
                      </p>

                      <div className="text-[11px] text-stone-300 pt-1 border-t border-stone-800/80">
                        <strong className="text-emerald-400">Inquiry Resolved:</strong> {item.inquiryResolved}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-stone-950/60 border border-stone-800/80 rounded-xl text-xs text-stone-400 italic leading-relaxed">
            No archival artifacts held in inventory. Dispatch scouts to the palace archives from the Grand Chamber to uncover hidden physical leverage.
          </div>
        )}
      </div>

      <button
        id="audience-execute-evidence-button"
        type="button"
        disabled={playerEvidence.length === 0}
        onClick={() => onPresentEvidence(figure.id, selectedEvidenceId)}
        className={`w-full py-2.5 px-4 rounded-xl font-serif font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
          playerEvidence.length > 0
            ? isEvidenceMatchingFigure
              ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50 cursor-pointer'
              : 'bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer'
            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
        }`}
      >
        <FileCheck className="w-4 h-4" />
        <span>
          {isEvidenceMatchingFigure
            ? `Present Proof to ${meta.name.split(' ')[1]} (+30 Favor)`
            : 'Present Artifact'}
        </span>
      </button>
    </div>
  );
};
