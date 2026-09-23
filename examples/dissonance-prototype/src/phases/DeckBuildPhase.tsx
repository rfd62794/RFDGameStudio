import React, { useState } from 'react';
import { Layers, ArrowRight, Info, CheckCircle, Plus, ArrowLeft, ShieldAlert, Zap, Landmark } from 'lucide-react';
import { buildEmberCardPool, getElementColor, getElementIcon, previewCardEffect, computeDeckPowerLevel, computeCardPowerValue, POWER_LEVEL_CAP } from '../utils';
import { FLOOR_CONFIG, BankedEssence } from '../types';

interface DeckBuildPhaseProps {
  selectedFloor?: number;
  unlockedCardIds: string[];
  deckCardIds: string[];
  unlockCards: (ids: string[], runComboCounts?: Record<string, number>, newDeckCardIds?: string[]) => void;
  onStartRun: (selectedFloor: number) => void;
  onBack: () => void;
  bankedEssence?: BankedEssence;
}

export default function DeckBuildPhase({
  selectedFloor = 1,
  unlockedCardIds,
  deckCardIds,
  unlockCards,
  onStartRun,
  onBack,
  bankedEssence
}: DeckBuildPhaseProps) {
  const [deckMessage, setDeckMessage] = useState<string>('');

  const currentFloorConfig = FLOOR_CONFIG[selectedFloor] || FLOOR_CONFIG[1];
  const activeCap = currentFloorConfig.gateType === 'maxDeckSize' ? currentFloorConfig.gateValue : 12;
  const powerCap = POWER_LEVEL_CAP[selectedFloor];

  const currentDeckPower = Math.round(computeDeckPowerLevel(deckCardIds) * 10) / 10;
  const isPowerExceeded = powerCap !== null && currentDeckPower > powerCap;
  const isDeckSizeExceeded = deckCardIds.length > activeCap;

  const handleToggleDeckCard = (cardId: string) => {
    if (deckCardIds.includes(cardId)) {
      if (deckCardIds.length <= 2) {
        setDeckMessage("Your deck must contain at least 2 starter cards to play!");
        return;
      }
      const nextDeck = deckCardIds.filter(id => id !== cardId);
      unlockCards([], undefined, nextDeck);
      setDeckMessage("Removed card from active deck.");
    } else {
      if (deckCardIds.length >= activeCap) {
        setDeckMessage(`Your deck is full! Maximum size for Floor ${selectedFloor} is ${activeCap} cards.`);
        return;
      }
      if (!unlockedCardIds.includes(cardId)) {
        setDeckMessage("You must unlock this card in your roster first!");
        return;
      }
      const nextDeck = [...deckCardIds, cardId];
      unlockCards([], undefined, nextDeck);
      setDeckMessage("Added card to active deck.");
    }
  };

  const isDeckValid = deckCardIds.length >= 2 && !isDeckSizeExceeded && !isPowerExceeded;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-deck-build-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all border border-slate-800 cursor-pointer"
            title="Return to Floor Choice"
            id="deck-build-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Sequence Initialization • Step 2</span>
            <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-0.5">
              <Layers className="text-amber-400 w-6 h-6" />
              Frequency Deck Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure your active combat deck for Floor {selectedFloor}.
            </p>
          </div>
        </div>

        <button 
          onClick={() => isDeckValid && onStartRun(selectedFloor)}
          disabled={!isDeckValid}
          className={`px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2 uppercase tracking-wide text-xs shrink-0 cursor-pointer ${
            isDeckValid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-[0_4px_14px_rgba(16,185,129,0.2)]'
              : 'bg-slate-800 text-slate-600 border border-slate-750 cursor-not-allowed'
          }`}
          id="initiate-run-btn"
        >
          <span>Initiate Floor {selectedFloor} Run</span>
          <ArrowRight className="w-4 h-4 animate-bounce" />
        </button>
      </div>

      {/* TARGET FLOOR ALIGNMENT BANNER */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="target-floor-summary-banner">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-400 font-bold font-display text-lg">
            Floor {selectedFloor}
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-slate-200 block uppercase tracking-wider">
              Target Depth: {currentFloorConfig.numLayers} Layers Map
            </span>
            <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
              Deck Size Cap: <strong className="text-amber-400">{activeCap} Cards</strong> • Power Cap: <strong className="text-amber-400">{powerCap !== null ? `${powerCap.toFixed(1)} PWR` : 'Unlimited'}</strong>
            </span>
          </div>
        </div>

        {selectedFloor === 1 && bankedEssence && bankedEssence.available && bankedEssence.amount > 0 && (
          <div className="bg-amber-950/70 border border-amber-500/50 rounded-xl p-2.5 px-3 text-amber-300 font-mono text-xs flex items-center gap-2 shadow-md">
            <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Banked Bonus: <strong className="text-amber-200 font-bold">+{bankedEssence.amount} ESS</strong></span>
          </div>
        )}
      </div>

      {/* NOTIFICATION BANNER */}
      {deckMessage && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl font-mono flex items-center gap-2 animate-fade-in">
          <Info className="w-4.5 h-4.5 text-amber-500 shrink-0" />
          <span>{deckMessage}</span>
        </div>
      )}

      {/* ACTIVE DECK GRID */}
      <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/60">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 font-mono mb-4 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Your Active Combat Deck ({deckCardIds.length} / {activeCap})
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border ${
              isPowerExceeded
                ? 'bg-rose-950/60 text-rose-300 border-rose-800 animate-pulse'
                : powerCap !== null
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <Zap className="w-3 h-3 text-amber-400" />
              Power Level: {currentDeckPower.toFixed(1)}{powerCap !== null ? ` / Cap ${powerCap}` : ' (Uncapped)'}
            </span>
          </div>
          <span className="text-slate-500">Click a card to remove it</span>
        </div>

        {deckCardIds.length > activeCap && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Deck size exceeds Floor {selectedFloor} cap ({deckCardIds.length} / {activeCap}). Remove {deckCardIds.length - activeCap} card(s) to proceed.
            </span>
          </div>
        )}

        {isPowerExceeded && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2" id="power-cap-exceeded-banner">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              Deck Power Level ({currentDeckPower.toFixed(1)}) exceeds Floor {selectedFloor} Power Cap ({powerCap}). Remove high-power cards to proceed.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {deckCardIds.map((cardId, idx) => {
            const cardInfo = buildEmberCardPool().find(c => c.id === cardId);
            if (!cardInfo) return null;
            const pwrVal = computeCardPowerValue(cardInfo);

            return (
              <div 
                key={`deck-alignment-slot-${cardId}-${idx}`}
                onClick={() => handleToggleDeckCard(cardId)}
                className="cursor-pointer p-3 rounded-xl border border-amber-500/30 bg-amber-950/10 hover:border-rose-500/50 hover:bg-rose-950/10 transition-all text-left flex flex-col justify-between h-28 group"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono font-bold text-amber-400 uppercase tracking-wider">Slot {idx + 1}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] font-mono text-rose-400 uppercase transition-all">Remove</span>
                </div>
                <div className="overflow-hidden mt-1">
                  <span className="block text-xs font-bold text-slate-200 truncate capitalize">{cardInfo.name}</span>
                  <span className="text-[9px] font-mono font-bold text-amber-400 block mt-0.5 truncate">
                    {previewCardEffect(cardInfo).label}
                  </span>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[9px] font-mono text-slate-500 capitalize truncate">
                      {cardInfo.el1} {cardInfo.el2 ? `+ ${cardInfo.el2}` : 'Single'}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-300/90 shrink-0">
                      PWR {pwrVal.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {Array.from({ length: Math.max(0, activeCap - deckCardIds.length) }).map((_, idx) => (
            <div 
              key={`empty-deck-slot-${idx}`}
              className="p-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 flex flex-col items-center justify-center h-24 text-center text-slate-600"
            >
              <Plus className="w-4 h-4 opacity-30 mb-1" />
              <span className="text-[10px] font-mono uppercase">Empty Slot</span>
            </div>
          ))}
        </div>
      </div>

      {/* ROSTER CHOICES GRID */}
      <div className="border-t border-slate-800 pt-5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
          Select from Unlocked Roster:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
          {buildEmberCardPool()
            .filter(card => unlockedCardIds.includes(card.id))
            .map((card) => {
              const isInDeck = deckCardIds.includes(card.id);
              return (
                <div 
                  key={`deckbuild-roster-${card.id}`}
                  onClick={() => handleToggleDeckCard(card.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center gap-3 text-left ${
                    isInDeck 
                      ? 'border-amber-500 bg-amber-950/10' 
                      : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex gap-1 shrink-0 bg-slate-950 p-1 rounded border border-slate-800">
                      <span className={`p-0.5 rounded text-[10px] ${getElementColor(card.el1)}`}>
                        {getElementIcon(card.el1)}
                      </span>
                      {card.el2 && (
                        <span className={`p-0.5 rounded text-[10px] ${getElementColor(card.el2)}`}>
                          {getElementIcon(card.el2)}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <span className="block font-bold text-xs text-slate-200 truncate capitalize">
                        {card.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-amber-400 block mt-0.5 truncate">
                        {previewCardEffect(card).label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 capitalize block truncate">
                        {card.el1} {card.el2 ? `+ ${card.el2}` : 'Single'} • {card.component}
                      </span>
                    </div>
                  </div>
                  <button 
                    className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase ${
                      isInDeck ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isInDeck ? 'In Deck' : 'Add'}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
