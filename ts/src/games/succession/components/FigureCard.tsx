import React from 'react';
import { Crown, Sparkles, Shield, AlertTriangle, MessageSquare, Compass } from 'lucide-react';
import { FigureState, FigureId } from '../engine/types';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIM_THEMES } from '../data/claimThemes';
import { getFigureQualitativeStanding, FavorTier } from '../utils/favorTiers';

interface FigureCardProps {
  figure: FigureState;
  isSelected: boolean;
  onSelect: (id: FigureId) => void;
}

export const FigureCard: React.FC<FigureCardProps> = ({
  figure,
  isSelected,
  onSelect,
}) => {
  const meta = COURT_FIGURES[figure.id];
  const isExposed = figure.exposedAgainst.includes('player');

  // Find theme label for most recent claim
  const lastClaimTheme = figure.mostRecentClaim
    ? CLAIM_THEMES.find((t) => t.id === figure.mostRecentClaim!.themeId)
    : null;

  // Determine Icon
  const getIcon = () => {
    switch (meta.avatarIcon) {
      case 'Crown':
        return <Crown className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Shield':
        return <Shield className="w-5 h-5" />;
      default:
        return <Crown className="w-5 h-5" />;
    }
  };

  // Compute qualitative standing (fog-of-war)
  const standing = getFigureQualitativeStanding(figure);
  const isPlayerLeading = standing.leaderId === 'player';

  // Get color for overall standing badge
  const getStandingColor = () => {
    if (isExposed) return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
    if (standing.tier === 'Uncommitted / Even') return 'text-stone-300 bg-stone-900 border-stone-700/60';
    if (isPlayerLeading) {
      if (standing.tier === 'Unyielding Backing') return 'text-amber-300 bg-amber-950/60 border-amber-500/70 font-bold';
      if (standing.tier === 'Decisive Favor') return 'text-emerald-300 bg-emerald-950/50 border-emerald-600/60';
      return 'text-emerald-400 bg-emerald-950/30 border-emerald-700/50';
    }
    // Rival leading
    if (standing.leaderId === 'aldric') return 'text-indigo-300 bg-indigo-950/50 border-indigo-700/60';
    return 'text-purple-300 bg-purple-950/50 border-purple-700/60';
  };

  // Helper for claimant tier dot & text styling
  const getClaimantStyle = (claimantId: string, tier: string) => {
    if (claimantId === 'player') {
      if (tier === 'Unyielding Backing' || tier === 'Decisive Favor') return 'text-amber-300 font-semibold';
      if (tier === 'Slight Lean') return 'text-emerald-300 font-medium';
      return 'text-stone-300';
    }
    if (claimantId === 'aldric') {
      if (tier === 'Unyielding Backing' || tier === 'Decisive Favor') return 'text-indigo-300 font-semibold';
      return 'text-stone-400';
    }
    if (claimantId === 'vivienne') {
      if (tier === 'Unyielding Backing' || tier === 'Decisive Favor') return 'text-purple-300 font-semibold';
      return 'text-stone-400';
    }
    return 'text-stone-400';
  };

  return (
    <div
      id={`figure-card-${figure.id}`}
      onClick={() => onSelect(figure.id)}
      className={`group relative rounded-xl p-5 border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
        isSelected
          ? 'bg-stone-900 border-amber-500/80 shadow-xl shadow-amber-950/40 ring-2 ring-amber-500/30'
          : 'bg-stone-900/60 hover:bg-stone-900/90 border-stone-800/80 hover:border-stone-700'
      } ${isExposed ? 'border-rose-900/60 bg-rose-950/10' : ''}`}
    >
      {/* Top Header info */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                isSelected
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-400 group-hover:text-amber-400'
              }`}
            >
              {getIcon()}
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-base group-hover:text-amber-200 transition-colors">
                {meta.name}
              </h3>
              <p className="text-xs text-stone-400 font-sans">{meta.title}</p>
            </div>
          </div>

          {/* Selected indicator */}
          <div
            className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
              isSelected
                ? 'border-amber-400 bg-amber-400 text-stone-950'
                : 'border-stone-700 bg-stone-950/50'
            }`}
          >
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
          </div>
        </div>

        {/* Permanent Exposure Warning Badge */}
        {isExposed && (
          <div
            id={`exposure-badge-${figure.id}`}
            className="mb-3 px-3 py-1.5 bg-rose-950/80 border border-rose-600/60 rounded-lg flex items-center gap-2 text-rose-300 text-xs font-semibold animate-pulse"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Caught Lying — Will NOT back you at Verdict!</span>
          </div>
        )}

        {/* Domain description */}
        <p className="text-xs text-stone-400 mb-4 line-clamp-2 leading-relaxed">
          {meta.description}
        </p>

        {/* Qualitative Standing Box (Fog-of-War) */}
        <div className="space-y-2.5 mb-4 bg-stone-950/80 border border-stone-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 font-serif flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-stone-500" />
              <span>Council Disposition</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-serif border ${getStandingColor()}`}
            >
              {isExposed ? 'Disqualified' : standing.label}
            </span>
          </div>

          {/* Qualitative 4-Segment Disposition Gauge */}
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-1.5 h-2">
              <div
                className={`rounded-sm transition-all duration-300 ${
                  standing.tier === 'Uncommitted / Even'
                    ? 'bg-stone-500'
                    : standing.tier === 'Slight Lean'
                    ? isPlayerLeading
                      ? 'bg-emerald-600'
                      : 'bg-indigo-600'
                    : isPlayerLeading
                    ? 'bg-emerald-700'
                    : 'bg-indigo-700'
                }`}
                title="Tier 1: Uncommitted / Even"
              />
              <div
                className={`rounded-sm transition-all duration-300 ${
                  standing.tier === 'Slight Lean'
                    ? isPlayerLeading
                      ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                    : standing.tier === 'Decisive Favor' || standing.tier === 'Unyielding Backing'
                    ? isPlayerLeading
                      ? 'bg-emerald-600'
                      : 'bg-indigo-600'
                    : 'bg-stone-800'
                }`}
                title="Tier 2: Slight Lean"
              />
              <div
                className={`rounded-sm transition-all duration-300 ${
                  standing.tier === 'Decisive Favor'
                    ? isPlayerLeading
                      ? 'bg-emerald-400'
                      : 'bg-indigo-400'
                    : standing.tier === 'Unyielding Backing'
                    ? isPlayerLeading
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                    : 'bg-stone-800'
                }`}
                title="Tier 3: Decisive Favor"
              />
              <div
                className={`rounded-sm transition-all duration-300 ${
                  standing.tier === 'Unyielding Backing'
                    ? isPlayerLeading
                      ? 'bg-amber-400 shadow-sm shadow-amber-500/50'
                      : 'bg-indigo-400 shadow-sm shadow-indigo-500/50'
                    : 'bg-stone-800'
                }`}
                title="Tier 4: Unyielding Backing"
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 font-sans px-0.5">
              <span>Even</span>
              <span>Slight</span>
              <span>Decisive</span>
              <span>Unyielding</span>
            </div>
          </div>

          {/* Claimant Standing Breakdown (Qualitative, no numbers) */}
          <div className="pt-2 border-t border-stone-800/60 space-y-1 text-xs">
            {standing.claimantStandings.map((c) => (
              <div key={c.claimantId} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      c.claimantId === 'player'
                        ? 'bg-amber-500'
                        : c.claimantId === 'aldric'
                        ? 'bg-indigo-500'
                        : 'bg-purple-500'
                    }`}
                  />
                  <span className={c.isPlayer ? 'text-stone-200 font-medium' : 'text-stone-400'}>
                    {c.name}:
                  </span>
                </div>
                <span className={getClaimantStyle(c.claimantId, c.tier)}>
                  {c.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Most Recent Claim Memory */}
      <div className="pt-2 border-t border-stone-800/80 flex items-center gap-2 text-xs">
        <MessageSquare className="w-3.5 h-3.5 text-stone-500 shrink-0" />
        <span className="text-stone-400">Last told:</span>
        {lastClaimTheme ? (
          <span className="text-amber-300/90 font-serif font-medium bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded text-[11px]">
            {lastClaimTheme.label}
          </span>
        ) : (
          <span className="text-stone-500 italic text-[11px]">No claims made yet</span>
        )}
      </div>
    </div>
  );
};
