import React, { useState } from 'react';
import { Crown, Sparkles, Shield, Coins, ScrollText, ArrowRight, Check, AlertCircle, Award } from 'lucide-react';
import { PlayerOriginId } from '../engine/types';
import { PLAYER_ORIGINS } from '../data/origins';

interface TitleScreenProps {
  onBegin: (originId: PlayerOriginId) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onBegin }) => {
  const [selectedOriginId, setSelectedOriginId] = useState<PlayerOriginId>('bastard_scion');

  const selectedOrigin = PLAYER_ORIGINS.find((o) => o.id === selectedOriginId) || PLAYER_ORIGINS[0];

  const getOriginIcon = (iconName: string, active: boolean) => {
    const className = `w-5 h-5 ${active ? 'text-amber-300' : 'text-stone-400'}`;
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Coins':
        return <Coins className={className} />;
      default:
        return <Crown className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-amber-900 selection:text-amber-100">
      <div className="max-w-3xl w-full border border-stone-800 bg-stone-900/90 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm space-y-7">
        
        {/* Crest / Header Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Crown className="w-8 h-8" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="text-center space-y-2.5">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-amber-200 tracking-wide">
            SUCCESSION
          </h1>
          <p className="text-stone-400 text-sm sm:text-base font-serif italic max-w-lg mx-auto">
            The King has passed without an heir. Eight hours remain until Midnight’s Verdict.
          </p>
        </div>

        {/* Lineage & Origin Selection Carousel / Cards */}
        <div className="space-y-3.5 bg-stone-950/80 border border-amber-900/40 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-serif font-semibold text-sm sm:text-base">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Select Your Lineage Origin</span>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
              Run Modifier
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {PLAYER_ORIGINS.map((origin) => {
              const isSelected = origin.id === selectedOriginId;
              return (
                <button
                  key={origin.id}
                  id={`origin-select-${origin.id}`}
                  type="button"
                  onClick={() => setSelectedOriginId(origin.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40'
                      : 'bg-stone-900/70 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-900/60' : 'bg-stone-950'}`}>
                        {getOriginIcon(origin.icon, isSelected)}
                      </div>
                      <div className="font-serif font-bold text-xs sm:text-sm text-stone-100">
                        {origin.name}
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-400/90 font-serif italic">
                      {origin.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Breakdown for Selected Origin */}
          <div
            id="selected-origin-details"
            className="p-4 bg-stone-900/90 border border-stone-800 rounded-xl space-y-2.5 text-xs transition-all"
          >
            <p className="text-stone-300 italic text-xs leading-relaxed">
              "{selectedOrigin.description}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 border-t border-stone-800/80">
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/40 rounded-lg space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block flex items-center gap-1">
                  <Check className="w-3 h-3" /> Strategic Advantage
                </span>
                <p className="text-emerald-200 font-sans text-xs">
                  {selectedOrigin.strategicAdvantage}
                </p>
              </div>

              <div className="p-2.5 bg-rose-950/20 border border-rose-800/40 rounded-lg space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold block flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Inherent Friction
                </span>
                <p className="text-rose-200 font-sans text-xs">
                  {selectedOrigin.inherentFriction}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Premise & Council Context Card */}
        <div className="space-y-4 bg-stone-950/70 border border-stone-800/80 rounded-xl p-5 sm:p-6 text-sm text-stone-300 leading-relaxed font-sans">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-semibold text-base border-b border-stone-800 pb-2">
            <ScrollText className="w-4 h-4" />
            <span>The Rules of the Court</span>
          </div>
          <p className="text-xs sm:text-sm">
            Three key figures hold the realm’s destiny in their hands: the <strong className="text-stone-100">Chancellor</strong>, the <strong className="text-stone-100">Archbishop</strong>, and the <strong className="text-stone-100">Commander</strong>. Two rival claimants—Lord Aldric and Lady Vivienne—seek to buy, flatter, and slander their way onto the throne.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-serif text-xs font-semibold">
                <Crown className="w-3.5 h-3.5" /> Chancellor
              </div>
              <p className="text-[11px] text-stone-400">High Estates & Lineage</p>
            </div>
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 font-serif text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Archbishop
              </div>
              <p className="text-[11px] text-stone-400">Sacred Order & Piety</p>
            </div>
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-serif text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" /> Commander
              </div>
              <p className="text-[11px] text-stone-400">Iron Gate & Loyalty</p>
            </div>
          </div>
        </div>

        {/* Begin Button */}
        <div className="pt-2 flex justify-center">
          <button
            id="begin-claim-btn"
            type="button"
            onClick={() => onBegin(selectedOriginId)}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-serif font-bold text-base rounded-xl transition-all duration-200 shadow-lg shadow-amber-950/50 flex items-center justify-center gap-3 group cursor-pointer"
          >
            <span>Begin Your Claim as {selectedOrigin.name}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </div>
  );
};
