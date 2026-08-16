import React, { useState } from 'react';
import {
  ArrowLeft,
  Crown,
  Sparkles,
  Shield,
  AlertTriangle,
  Compass,
  MessageSquareQuote,
  Scale,
  FileCheck,
  ShieldAlert,
  KeyRound,
  HelpCircle,
  CheckCircle2,
  Lock,

  Radio,
  Check,
  Activity,
  Zap,
  BookOpen,
  Gavel,
  Eye,
} from 'lucide-react';
import {
  FigureState,
  FigureId,
  Claim,
  PlayerOriginId,
  ClaimTheme,
  IndictmentTriad,
  SuspectId,
  MethodId,
  MotiveId,
} from '../engine/types';
import { EvidenceItem } from '../data/evidence';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIM_THEMES } from '../data/claimThemes';
import { checkContradictionAgainstKnown } from '../engine/gossip';
import { getFigureQualitativeStanding } from '../utils/favorTiers';
import { TickerEntry } from '../types/gameState';
import { DOMAIN_RIPPLE_CONFLICTS } from '../data/gameConstants';
import {
  SUSPECTS,
  METHODS,
  MOTIVES,
  getDiscoveredCluesFromEvidence,
  getDiscoveredTriadOptions,
} from '../engine/deduction';

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
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(CLAIM_THEMES[0].id);
  const [hoveredThemeId, setHoveredThemeId] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(
    playerEvidence.length > 0 ? playerEvidence[0].id : ''
  );

  // Indictment Triad State
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectId>('chancellor');
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('forged_seal');
  const [selectedMotive, setSelectedMotive] = useState<MotiveId>('treasury_embezzlement');
  const [activeDeductionTab, setActiveDeductionTab] = useState<'suspect' | 'method' | 'motive'>('suspect');

  // Sync selected evidence if inventory changes
  React.useEffect(() => {
    if (playerEvidence.length > 0 && !playerEvidence.some((e) => e.id === selectedEvidenceId)) {
      setSelectedEvidenceId(playerEvidence[0].id);
    }
  }, [playerEvidence, selectedEvidenceId]);

  const meta = COURT_FIGURES[figure.id];
  const isExposed = figure.exposedAgainst.includes('player');
  const standing = getFigureQualitativeStanding(figure);

  // Discovered clues & discovered triad choices
  const discoveredClues = getDiscoveredCluesFromEvidence(playerEvidence);
  const discoveredOptions = getDiscoveredTriadOptions(playerEvidence);

  // Active theme evaluated for expression / preview
  const activeThemeId = hoveredThemeId || selectedThemeId;
  const activeTheme = CLAIM_THEMES.find((t) => t.id === activeThemeId) || CLAIM_THEMES[0];

  // Disgraced Knight friction check: Archbishop requires 1 formal Appeal before Whispers unlock
  const isArchbishopWhisperLocked =
    playerOrigin === 'disgraced_knight' &&
    figure.id === 'archbishop' &&
    !ticker.some(
      (t) => t.claimantId === 'player' && t.figureId === 'archbishop' && t.moveType === 'appeal'
    );

  // Contradiction detection for active preview theme against allClaims
  const isThemeContradiction = (themeId: string) =>
    checkContradictionAgainstKnown(allClaims, themeId, CLAIM_THEMES);

  const isCurrentSelectionContradiction = isThemeContradiction(selectedThemeId);
  const isActivePreviewContradiction = isThemeContradiction(activeThemeId);

  // Domain ripple conflict info
  const domainConflict = DOMAIN_RIPPLE_CONFLICTS[figure.id];
  const opposingFigureMeta = domainConflict ? COURT_FIGURES[domainConflict.targetFigureId] : null;

  // Selected evidence item object
  const selectedEvidence = playerEvidence.find((e) => e.id === selectedEvidenceId);
  const isEvidenceMatchingFigure = selectedEvidence?.relevantFigureId === figure.id;

  // Selected Triad objects
  const currentSuspectMeta = SUSPECTS.find((s) => s.id === selectedSuspect)!;
  const currentMethodMeta = METHODS.find((m) => m.id === selectedMethod)!;
  const currentMotiveMeta = MOTIVES.find((m) => m.id === selectedMotive)!;

  // Dynamic emotional / facial reaction cues for the active theme
  const getDynamicReactionCue = (figureId: FigureId, theme: ClaimTheme, isContradict: boolean) => {
    if (isContradict) {
      if (figureId === 'chancellor') {
        return {
          mood: 'Alarmed Suspicion',
          moodColor: 'text-rose-400',
          borderColor: 'border-rose-700/80',
          bgColor: 'bg-rose-950/40',
          quote:
            'Hector’s eyes narrow sharply as his hand twitches over his signet. "You gave a conflicting pedigree earlier! Do you take the Council for fools?"',
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
          'Brand’s jaw locks tight as iron. "A turncoat who alters his oaths cannot command a vanguard. We do not tolerate liars in the garrison."',
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
          'Brand scoffs under his breath. "Silk coats and grandfather crests won’t hold the breached ramparts when foreign lances arrive."',
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

  const handleDeliverIndictmentClick = () => {
    onDeliverIndictment(figure.id, {
      suspect: selectedSuspect,
      method: selectedMethod,
      motive: selectedMotive,
    });
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

      {/* Main Persuasion Approaches */}
      <div className="space-y-6">
        {/* Section 1: Tactile Statement Cards for Whispers */}
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
                      onClick={() => setSelectedThemeId(theme.id)}
                      onMouseEnter={() => setHoveredThemeId(theme.id)}
                      onMouseLeave={() => setHoveredThemeId(null)}
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
                      You previously swore an opposing narrative to another Councilor. Delivering this statement will immediately catch you in a lie, awarding <strong>0 favor</strong> and <strong>permanently disqualifying</strong> this Councilor’s final vote!
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
                      <strong>Zero-Sum Repercussion:</strong> Elevating {meta.name.split(' ')[1]}’s estate creates a slight friction (-4 favor) with <strong>{opposingFigureMeta.name}</strong>.
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

        {/* Section 2: Formal Appeal & Evidence Presentation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Action 2: Formal Appeal Card */}
          <div
            id="audience-action-appeal"
            className="bg-stone-900/80 border border-stone-800 hover:border-sky-700/70 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
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

                <span className="text-[11px] font-serif px-2 py-0.5 bg-sky-950/60 border border-sky-800/60 text-sky-300 rounded font-medium shrink-0">
                  {playerOrigin === 'disgraced_knight' && figure.id === 'commander'
                    ? '+50% Knight Perk'
                    : 'Zero-Risk'}
                </span>
              </div>

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

          {/* Action 3: Present Domain Evidence Card */}
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
        </div>

        {/* Section 3: The Clue Triad Case Notebook & Deliver Indictment Engine (ADR-014) */}
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
                ⚠️ <strong>Trial Rule:</strong> If this triad accurately resolves {meta.name}’s secret inquiry, you earn <strong>+40 Favor</strong> and an unshakeable endorsement. If flawed, you will be caught in <strong>Malicious Fabrication (Perjury)</strong> and permanently lose their backing!
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
      </div>
    </div>
  );
};
