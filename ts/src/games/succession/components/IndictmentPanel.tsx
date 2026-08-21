import React, { useState } from 'react';
import {
  Gavel,
  Eye,
  KeyRound,
  HelpCircle,
  Check,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { FigureId, FigureState, IndictmentTriad, SuspectId, MethodId, MotiveId } from '../engine/types';
import { COURT_FIGURES } from '../data/courtFigures';
import { EvidenceItem } from '../data/evidence';
import {
  SUSPECTS,
  METHODS,
  MOTIVES,
  getDiscoveredCluesFromEvidence,
  getDiscoveredTriadOptions,
} from '../engine/deduction';

interface IndictmentPanelProps {
  figure: FigureState;
  playerEvidence: EvidenceItem[];
  onDeliverIndictment: (figureId: FigureId, triad: IndictmentTriad) => void;
}

export const IndictmentPanel: React.FC<IndictmentPanelProps> = ({
  figure,
  playerEvidence,
  onDeliverIndictment,
}) => {
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectId>('chancellor');
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('forged_seal');
  const [selectedMotive, setSelectedMotive] = useState<MotiveId>('treasury_embezzlement');
  const [activeDeductionTab, setActiveDeductionTab] = useState<'suspect' | 'method' | 'motive'>('suspect');

  const meta = COURT_FIGURES[figure.id];
  const discoveredClues = getDiscoveredCluesFromEvidence(playerEvidence);
  const discoveredOptions = getDiscoveredTriadOptions(playerEvidence);

  const currentSuspectMeta = SUSPECTS.find((s) => s.id === selectedSuspect)!;
  const currentMethodMeta = METHODS.find((m) => m.id === selectedMethod)!;
  const currentMotiveMeta = MOTIVES.find((m) => m.id === selectedMotive)!;

  const handleDeliverIndictmentClick = () => {
    onDeliverIndictment(figure.id, {
      suspect: selectedSuspect,
      method: selectedMethod,
      motive: selectedMotive,
    });
  };

  return (
    <div
      id="audience-indictment-section"
      className="bg-stone-900/90 border border-purple-900/60 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-600/70 flex items-center justify-center text-purple-300">
            <Gavel className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-stone-100 text-sm sm:text-base">
                Approach 4: Deliver Regicide Indictment (Case Notebook)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800/80">
                ADR-014 Engine
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Triangulate <strong>[Conspirator]</strong> × <strong>[Method]</strong> × <strong>[Motive]</strong> to formally indict the conspiracy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-serif px-2.5 py-1 bg-purple-950/80 border border-purple-800 text-purple-200 rounded-lg shrink-0 font-medium">
            Decisive Proof (+40) | High Stakes Perjury Risk
          </span>
        </div>
      </div>

      {/* Active Case Notebook Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveDeductionTab('suspect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeDeductionTab === 'suspect'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-700'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>1. Conspirator (Who)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDeductionTab('method')}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeDeductionTab === 'method'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-700'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>2. Method / Weapon (How)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDeductionTab('motive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeDeductionTab === 'motive'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-700'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>3. Motive (Why)</span>
            </button>
          </div>

          <div className="text-[11px] font-serif text-stone-400 hidden sm:flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>{discoveredClues.length} Archival Clues Discovered</span>
          </div>
        </div>

        {/* Tab 1: Suspect Selection */}
        {activeDeductionTab === 'suspect' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUSPECTS.map((suspect) => {
              const isSelected = selectedSuspect === suspect.id;
              const isDiscovered = discoveredOptions.suspects.has(suspect.id);

              return (
                <button
                  key={suspect.id}
                  id={`indictment-suspect-${suspect.id}`}
                  type="button"
                  onClick={() => setSelectedSuspect(suspect.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500 shadow-md ring-1 ring-purple-500'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-500 text-stone-950 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-xs text-stone-100">
                        {suspect.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-serif block">
                      {suspect.title}
                    </span>
                    <p className="text-[11px] text-stone-400 leading-snug pt-1">
                      {suspect.description}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
                    {isDiscovered ? (
                      <span className="text-purple-300 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Archival Clue in Vault
                      </span>
                    ) : (
                      <span className="text-stone-500">Unconfirmed Theory</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Method Selection */}
        {activeDeductionTab === 'method' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {METHODS.map((method) => {
              const isSelected = selectedMethod === method.id;
              const isDiscovered = discoveredOptions.methods.has(method.id);

              return (
                <button
                  key={method.id}
                  id={`indictment-method-${method.id}`}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500 shadow-md ring-1 ring-purple-500'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-500 text-stone-950 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="font-serif font-bold text-xs text-stone-100 block">
                      {method.label}
                    </span>
                    <p className="text-[11px] text-stone-400 leading-snug pt-1">
                      {method.description}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
                    {isDiscovered ? (
                      <span className="text-purple-300 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Discovered in Archive
                      </span>
                    ) : (
                      <span className="text-stone-500">Unconfirmed Theory</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Motive Selection */}
        {activeDeductionTab === 'motive' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOTIVES.map((motive) => {
              const isSelected = selectedMotive === motive.id;
              const isDiscovered = discoveredOptions.motives.has(motive.id);

              return (
                <button
                  key={motive.id}
                  id={`indictment-motive-${motive.id}`}
                  type="button"
                  onClick={() => setSelectedMotive(motive.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500 shadow-md ring-1 ring-purple-500'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-500 text-stone-950 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="font-serif font-bold text-xs text-stone-100 block">
                      {motive.label}
                    </span>
                    <p className="text-[11px] text-stone-400 leading-snug pt-1">
                      {motive.description}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
                    {isDiscovered ? (
                      <span className="text-purple-300 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Discovered in Archive
                      </span>
                    ) : (
                      <span className="text-stone-500">Unconfirmed Theory</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Triad Formulation Docket Preview */}
        <div
          id="indictment-docket-summary"
          className="p-4 bg-stone-950/80 border border-purple-900/60 rounded-xl space-y-2.5"
        >
          <div className="flex items-center justify-between text-xs text-purple-300 font-serif">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <Gavel className="w-4 h-4 text-purple-400" />
              <span>Draft Formal Indictment Statement:</span>
            </span>
            <span className="text-stone-400 italic">
              Accusing before {meta.name.split(' ')[1]}
            </span>
          </div>

          <div className="p-3 bg-stone-900/90 border border-stone-800 rounded-lg text-xs leading-relaxed font-serif">
            "We formally indict{' '}
            <strong className="text-purple-300 underline decoration-purple-500">
              {currentSuspectMeta.name} ({currentSuspectMeta.title})
            </strong>
            , demonstrating that treason was executed via{' '}
            <strong className="text-amber-300 underline decoration-amber-500">
              {currentMethodMeta.label}
            </strong>{' '}
            to achieve{' '}
            <strong className="text-sky-300 underline decoration-sky-500">
              {currentMotiveMeta.label}
            </strong>
            ."
          </div>

          <p className="text-[11px] text-stone-400">
            ⚠️ <strong>Trial Rule:</strong> If this triad accurately resolves {meta.name}'s secret inquiry, you earn <strong>+40 Favor</strong> and an unshakeable endorsement. If flawed, you will be caught in <strong>Malicious Fabrication (Perjury)</strong> and permanently lose their backing!
          </p>
        </div>

        {/* Deliver Indictment Execution Button */}
        <button
          id="audience-execute-indictment-button"
          type="button"
          onClick={handleDeliverIndictmentClick}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-serif font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 cursor-pointer"
        >
          <Gavel className="w-4 h-4" />
          <span>
            Deliver Triad Indictment to {meta.name.split(' ')[1]} (+40 / Perjury Risk)
          </span>
        </button>
      </div>
    </div>
  );
};
