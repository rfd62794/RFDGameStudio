import React, { useState } from 'react';
import {
  ArrowLeft,
  Crown,
  Sparkles,
  Shield,
  AlertTriangle,
  Compass,
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Activity,
  Zap,
  Scale,
  Swords,
  ChevronDown,
} from 'lucide-react';
import {
  FigureState,
  FigureId,
  Claim,
  PlayerOriginId,
  ClaimTheme,
  IndictmentTriad,
  ClaimantId,
} from '../engine/types';
import { EvidenceItem } from '../data/evidence';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIM_THEMES } from '../data/claimThemes';
import { CLAIMANTS } from '../data/claimants';
import { RIVAL_SLANDER_PENALTY } from '../data/gameConstants';
import { checkContradictionAgainstKnown } from '../engine/gossip';
import { getFigureQualitativeStanding } from '../utils/favorTiers';
import { TickerEntry } from '../types/gameState';
import { ApproachId, nextExpandedApproach } from '../utils/approachDisclosure';
import { WhisperPanel } from './WhisperPanel';
import { EvidencePanel } from './EvidencePanel';
import { IndictmentPanel } from './IndictmentPanel';

interface AudienceStageProps {
  figure: FigureState;
  playerEvidence: EvidenceItem[];
  allClaims: Claim[];
  playerOrigin: PlayerOriginId;
  ticker: TickerEntry[];
  onBackToChamber: () => void;
  onWhisper: (figureId: FigureId, themeId: string) => void;
  onAppeal: (figureId: FigureId) => void;
  onPresentEvidence: (figureId: FigureId, evidenceId: string) => void;
  onDeliverIndictment: (figureId: FigureId, triad: IndictmentTriad) => void;
  onDiscredit: (figureId: FigureId, targetRivalId: ClaimantId) => void;
}

export const AudienceStage: React.FC<AudienceStageProps> = ({
  figure,
  playerEvidence,
  allClaims,
  playerOrigin,
  ticker,
  onBackToChamber,
  onWhisper,
  onAppeal,
  onPresentEvidence,
  onDeliverIndictment,
  onDiscredit,
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(CLAIM_THEMES[0].id);
  const [hoveredThemeId, setHoveredThemeId] = useState<string | null>(null);
  const rivalIds: ClaimantId[] = ['aldric', 'vivienne'];
  const [selectedRivalId, setSelectedRivalId] = useState<ClaimantId>('aldric');

  // Progressive disclosure (ADR-006): all five approaches are collapsed
  // by default. Delegates to nextExpandedApproach (utils/approachDisclosure.ts)
  // — the same real function exercised end-to-end in
  // tests/test_succession_progressiveDisclosure.ts — so only one
  // approach is ever expanded at a time, never a reimplementation that
  // could silently diverge.
  const [expandedApproach, setExpandedApproach] = useState<ApproachId | null>(null);
  const toggleApproach = (id: ApproachId) =>
    setExpandedApproach((prev) => nextExpandedApproach(prev, id));

  const meta = COURT_FIGURES[figure.id];
  const isExposed = figure.exposedAgainst.includes('player');
  const standing = getFigureQualitativeStanding(figure);

  const activeThemeId = hoveredThemeId || selectedThemeId;
  const activeTheme = CLAIM_THEMES.find((t) => t.id === activeThemeId) || CLAIM_THEMES[0];
  const isActivePreviewContradiction = checkContradictionAgainstKnown(allClaims, activeThemeId, CLAIM_THEMES);

  const getDynamicReactionCue = (figureId: FigureId, theme: ClaimTheme, isContradict: boolean) => {
    if (isContradict) {
      if (figureId === 'chancellor') {
        return {
          mood: 'Alarmed Suspicion',
          moodColor: 'text-rose-400',
          borderColor: 'border-rose-700/80',
          bgColor: 'bg-rose-950/40',
          quote:
            `Hector's eyes narrow sharply as his hand twitches over his signet. "You gave a conflicting pedigree earlier! Do you take the Council for fools?"`,
        };
      }
      if (figureId === 'archbishop') {
        return {
          mood: 'Condemnatory Wrath',
          moodColor: 'text-rose-400',
          borderColor: 'border-rose-700/80',
          bgColor: 'bg-rose-950/40',
          quote:
            'Valerius grips his sanctified crosier, eyes flashing with anger. "The Cathedral brooks no false tongues! Your perjury is laid bare before God!"',
        };
      }
      return {
        mood: 'Hostile Vigilance',
        moodColor: 'text-rose-400',
        borderColor: 'border-rose-700/80',
        bgColor: 'bg-rose-950/40',
        quote:
          `Brand's jaw locks tight as iron. "A turncoat who alters his oaths cannot command a vanguard. We do not tolerate liars in the garrison."`,
      };
    }

    if (figureId === 'chancellor') {
      if (theme.id.includes('pedigree') || theme.id.includes('charter') || theme.id.includes('noble')) {
        return {
          mood: 'Prideful & Flattered',
          moodColor: 'text-amber-300',
          borderColor: 'border-amber-700/70',
          bgColor: 'bg-amber-950/30',
          quote:
            'Hector straightens his ermine mantle, visibly pleased. "A claimant who reveres ancestral lineage and the high estates understands the true order of the realm."',
        };
      }
      if (theme.id.includes('common') || theme.id.includes('secular')) {
        return {
          mood: 'Arrogant Disdain',
          moodColor: 'text-stone-400',
          borderColor: 'border-stone-700',
          bgColor: 'bg-stone-900/60',
          quote:
            'Hector curls his lip in aristocratic distaste. "Base bloodlines and mercantile bartering belong in the gutter, not on the sovereign throne."',
        };
      }
      return {
        mood: 'Calculating Interest',
        moodColor: 'text-sky-300',
        borderColor: 'border-sky-800/70',
        bgColor: 'bg-sky-950/20',
        quote:
          'Hector taps his ledger thoughtfully. "An intriguing proposition, provided the royal treasury and crown revenues are safeguarded."',
      };
    }

    if (figureId === 'archbishop') {
      if (theme.id.includes('pious') || theme.id.includes('sacred') || theme.id.includes('holy')) {
        return {
          mood: 'Pious Affirmation',
          moodColor: 'text-sky-300',
          borderColor: 'border-sky-600/70',
          bgColor: 'bg-sky-950/30',
          quote:
            'Valerius lowers his silver rosary and bows his head in benediction. "The heavens favor those who honor holy rites and defend the holy church."',
        };
      }
      if (theme.id.includes('noble') || theme.id.includes('pedigree')) {
        return {
          mood: 'Stern Moral Scrutiny',
          moodColor: 'text-stone-400',
          borderColor: 'border-stone-700',
          bgColor: 'bg-stone-900/60',
          quote:
            'Valerius gazes past you with solemn detachment. "Worldly titles wither like chaff. Only righteousness endures beyond the grave."',
        };
      }
      return {
        mood: 'Guarded Caution',
        moodColor: 'text-amber-300',
        borderColor: 'border-amber-800/70',
        bgColor: 'bg-amber-950/20',
        quote:
          'Valerius murmurs a soft prayer under his breath. "We will weigh your devotion carefully before the high altars."',
      };
    }

    // Commander
    if (theme.id.includes('valor') || theme.id.includes('military') || theme.id.includes('iron') || theme.id.includes('war')) {
      return {
        mood: 'Resolute Respect',
        moodColor: 'text-emerald-300',
        borderColor: 'border-emerald-600/70',
        bgColor: 'bg-emerald-950/30',
        quote:
          'Brand rests his gauntlet heavily upon his broadsword pommel, nodding. "A leader who respects garrison discipline and martial grit has my full attention."',
      };
    }
    if (theme.id.includes('noble') || theme.id.includes('pedigree')) {
      return {
        mood: 'Dismissive Bluntness',
        moodColor: 'text-stone-400',
        borderColor: 'border-stone-700',
        bgColor: 'bg-stone-900/60',
        quote:
          `Brand scoffs under his breath. "Silk coats and grandfather crests won't hold the breached ramparts when foreign lances arrive."`,
      };
    }
    return {
      mood: 'Pragmatic Assessment',
      moodColor: 'text-amber-300',
      borderColor: 'border-amber-800/70',
      bgColor: 'bg-amber-950/20',
      quote:
        'Brand crosses his scarred arms, evaluating your posture. "Talk is cheap in the court. The soldiers will judge you by your resolve."',
    };
  };

  const reaction = getDynamicReactionCue(figure.id, activeTheme, isActivePreviewContradiction);

  const getIcon = () => {
    switch (meta.avatarIcon) {
      case 'Crown':
        return <Crown className="w-6 h-6 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-sky-400" />;
      case 'Shield':
        return <Shield className="w-6 h-6 text-emerald-400" />;
      default:
        return <Crown className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-chamber-button"
          onClick={onBackToChamber}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/80 rounded-lg text-xs font-serif text-stone-300 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Step Back to Grand Chamber</span>
        </button>

        <div className="text-xs text-stone-400 font-serif flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>1-on-1 Private Antechamber</span>
        </div>
      </div>

      {/* Hero Figure Header & Live Dynamic Facial Cue Panel */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-stone-950 border border-stone-700 flex items-center justify-center shrink-0">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  {meta.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded text-xs font-serif bg-stone-950 border border-stone-700 text-stone-300">
                  {meta.title}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-xl leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>

          {/* Current Qualitative Standing */}
          <div className="shrink-0 bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-1.5 w-full sm:w-auto min-w-[200px]">
            <div className="flex items-center justify-between text-xs text-stone-400 font-serif">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-stone-500" />
                <span>Disposition:</span>
              </span>
              <strong className={isExposed ? 'text-rose-400' : standing.leaderId === 'player' ? 'text-amber-300' : 'text-stone-300'}>
                {isExposed ? 'Disqualified' : standing.label}
              </strong>
            </div>

            <div className="text-[11px] text-stone-500 border-t border-stone-800/80 pt-1.5 flex items-center justify-between">
              <span>Domain:</span>
              <span className="text-stone-400 font-serif">{meta.domain}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Emotional Expression & Facial Cue Box */}
        <div
          id="councilor-dynamic-reaction-box"
          className={`p-4 rounded-xl border transition-all duration-200 ${reaction.bgColor} ${reaction.borderColor}`}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-800/60">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${reaction.moodColor}`} />
              <span className="text-[11px] font-serif uppercase tracking-wider text-stone-400">
                Councilor Live Reaction Cue:
              </span>
              <span className={`text-xs font-serif font-bold ${reaction.moodColor}`}>
                [{reaction.mood}]
              </span>
            </div>
            <span className="text-[11px] text-stone-400 font-serif italic">
              Previewing: {activeTheme.label}
            </span>
          </div>
          <p className="text-xs text-stone-200 font-serif italic leading-relaxed">
            {reaction.quote}
          </p>
        </div>

        {/* Caught Lying Alert */}
        {isExposed && (
          <div className="p-3 bg-rose-950/80 border border-rose-600/60 rounded-xl flex items-center gap-3 text-rose-300 text-xs font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              <strong>Lies Exposed:</strong> You were caught making contradictory claims. This Council member will NOT back you under any circumstances at the final verdict, unless you produce an irrefutable Indictment Solution!
            </span>
          </div>
        )}

        {/* Deep Mystery Dossier Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-stone-800/80">
          <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-serif text-[11px] font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Private Vulnerability</span>
            </div>
            <p className="text-xs text-stone-300 leading-snug">
              {meta.agenda}
            </p>
          </div>

          <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-serif text-[11px] font-semibold uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-sky-500" />
              <span>Throne Demand</span>
            </div>
            <p className="text-xs text-stone-300 leading-snug">
              {meta.demand}
            </p>
          </div>

          <div className="p-3 bg-purple-950/20 border border-purple-900/60 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-purple-300 font-serif text-[11px] font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>Active Inquiry</span>
            </div>
            <p className="text-xs text-purple-200 italic leading-snug">
              "{meta.mysteryInquiry}"
            </p>
          </div>
        </div>
      </div>

      {/* Main Persuasion Approaches — collapsed by default, expand-on-select, */}
      {/* only one open at a time (ADR-006 progressive disclosure) */}
      <div className="space-y-6">
        {/* Section 1: Whisper Panel */}
        <WhisperPanel
          figure={figure}
          allClaims={allClaims}
          ticker={ticker}
          playerOrigin={playerOrigin}
          selectedThemeId={selectedThemeId}
          onSelectTheme={setSelectedThemeId}
          onHoverTheme={setHoveredThemeId}
          onWhisper={onWhisper}
          isExpanded={expandedApproach === 'whisper'}
          onToggle={() => toggleApproach('whisper')}
        />

        {/* Action 2: Formal Appeal Card (inline — no local state beyond expand) */}
        <div
          id="audience-action-appeal"
          className="bg-stone-900/80 border border-stone-800 hover:border-sky-700/70 rounded-2xl p-5 sm:p-6 space-y-4 transition-all"
        >
          <button
            id="audience-approach-toggle-appeal"
            type="button"
            onClick={() => toggleApproach('appeal')}
            aria-expanded={expandedApproach === 'appeal'}
            className={`w-full flex items-center justify-between gap-3 pb-3 text-left cursor-pointer ${
              expandedApproach === 'appeal' ? 'border-b border-stone-800' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-600/70 flex items-center justify-center text-sky-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-100 text-sm">
                  Approach 2: Formal Diplomatic Appeal
                </h3>
                <p className="text-[11px] text-stone-400">
                  Open, dignified petition before the assembled Council
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] font-serif px-2 py-0.5 bg-sky-950/60 border border-sky-800/60 text-sky-300 rounded font-medium">
                {playerOrigin === 'disgraced_knight' && figure.id === 'commander'
                  ? '+50% Knight Perk'
                  : 'Zero-Risk'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform ${
                  expandedApproach === 'appeal' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {expandedApproach === 'appeal' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-300 leading-relaxed">
                Deliver an open, measured address on the Council floor. Steady, dignified, and 100% free of contradiction traps and domain friction.
              </p>

              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-xs text-stone-400 space-y-1">
                <div className="font-serif text-stone-200 font-medium">
                  {playerOrigin === 'disgraced_knight' && figure.id === 'commander'
                    ? 'Iron Knight Synergy:'
                    : 'Guaranteed Tactical Outcome:'}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {playerOrigin === 'disgraced_knight' && figure.id === 'commander'
                    ? 'Grants +12 favor (+50% bonus) when appealing to your fellow Commander, and produces no ripple friction.'
                    : 'Earns a reliable +8 favor without planting claims or provoking opposing faction jealousy.'}
                </p>
              </div>

              <button
                id="audience-execute-appeal-button"
                type="button"
                onClick={() => onAppeal(figure.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-stone-950 font-serif font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-950/50"
              >
                <Scale className="w-4 h-4" />
                <span>
                  {playerOrigin === 'disgraced_knight' && figure.id === 'commander'
                    ? 'Deliver Commander Appeal (+12 Favor)'
                    : 'Deliver Formal Council Appeal (+8 Favor)'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Action 3: Evidence Panel */}
        <EvidencePanel
          figure={figure}
          playerEvidence={playerEvidence}
          onPresentEvidence={onPresentEvidence}
          isExpanded={expandedApproach === 'evidence'}
          onToggle={() => toggleApproach('evidence')}
        />

        {/* Section 4: Indictment Panel */}
        <IndictmentPanel
          figure={figure}
          playerEvidence={playerEvidence}
          onDeliverIndictment={onDeliverIndictment}
          isExpanded={expandedApproach === 'indictment'}
          onToggle={() => toggleApproach('indictment')}
        />

        {/* Section 5: Discredit a Rival */}
        <div
          id="audience-action-discredit"
          className="bg-stone-900/80 border border-stone-800 hover:border-rose-700/60 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <button
            id="audience-approach-toggle-discredit"
            type="button"
            onClick={() => toggleApproach('discredit')}
            aria-expanded={expandedApproach === 'discredit'}
            className={`w-full flex items-center justify-between gap-3 pb-3 text-left cursor-pointer ${
              expandedApproach === 'discredit' ? 'border-b border-stone-800' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-700/70 flex items-center justify-center text-rose-400">
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-100 text-sm">
                  Approach 5: Discredit a Rival
                </h3>
                <p className="text-[11px] text-stone-400">
                  Spend your turn to directly damage a rival's standing here — no favor gained for you.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] font-serif px-2 py-0.5 bg-rose-950/60 border border-rose-800/60 text-rose-300 rounded font-medium">
                -{RIVAL_SLANDER_PENALTY} Rival Favor
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform ${
                  expandedApproach === 'discredit' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {expandedApproach === 'discredit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {rivalIds.map((rivalId) => {
                  const rival = CLAIMANTS[rivalId];
                  const isSelected = rivalId === selectedRivalId;
                  return (
                    <button
                      key={rivalId}
                      id={`discredit-target-${rivalId}`}
                      type="button"
                      onClick={() => setSelectedRivalId(rivalId)}
                      className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="font-serif font-bold text-xs text-stone-100">{rival.name}</div>
                      <div className="text-[11px] text-stone-400">
                        Current favor here: {figure.favor[rivalId]}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                id="audience-execute-discredit-button"
                type="button"
                onClick={() => onDiscredit(figure.id, selectedRivalId)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-serif font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-950/50"
              >
                <Swords className="w-4 h-4" />
                <span>Discredit {CLAIMANTS[selectedRivalId].name} (-{RIVAL_SLANDER_PENALTY} Favor)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
