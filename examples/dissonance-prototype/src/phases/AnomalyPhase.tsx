import React, { useState, useMemo } from 'react';
import { RunState, AnomalyEvent } from '../types';
import { BOON_POOL, buildEmberCardPool } from '../utils';
import { Sparkles, Zap, Heart, Shield, ArrowRight, CheckCircle2, ShieldAlert, Award, Gem, Flame } from 'lucide-react';

interface AnomalyPhaseProps {
  runState: RunState;
  setRunState: React.Dispatch<React.SetStateAction<RunState | null>>;
  unlockedCardIds: string[];
  unlockCards: (newCardIds: string[]) => void;
  onDone: () => void;
}

interface EventConfig {
  id: AnomalyEvent;
  name: string;
  tagline: string;
  description: string;
  actionLabel: string;
  actionCostText: string;
  actionRewardText: string;
  declineLabel: string;
}

const EVENT_CONFIGS: Record<AnomalyEvent, EventConfig> = {
  echos_fragment: {
    id: 'echos_fragment',
    name: "Echo's Fragment",
    tagline: 'Risk & Discovery',
    description: 'A crystalline resonance from an ancient cycle hums in the void. Listening opens your mind to undiscovered combination cards at the cost of vital energy.',
    actionLabel: 'Attune to Fragment',
    actionCostText: 'Takes 4 HP damage',
    actionRewardText: 'Unlocks & discovers 1 random Card permanently',
    declineLabel: 'Walk Away Safely'
  },
  unstable_residue: {
    id: 'unstable_residue',
    name: 'Unstable Residue',
    tagline: 'Risk & Economy',
    description: 'Concentrated Void-Essence pools in a fractured rift. Absorbing the energy yields rich Essence reserves, but burns through physical shields.',
    actionLabel: 'Absorb Essence Pool',
    actionCostText: 'Takes 4 HP damage',
    actionRewardText: 'Grants +15 Run Essence immediately',
    declineLabel: 'Leave Residue Untouched'
  },
  corrupted_cache: {
    id: 'corrupted_cache',
    name: 'Corrupted Cache',
    tagline: 'Combat Recovery & Cache',
    description: 'An old supply construct guarded by weakened residual Ashlings. Emitting a cleanser pulse bypasses combat and yields a guaranteed card discovery.',
    actionLabel: 'Trigger Cleanser Pulse',
    actionCostText: 'Takes 2 HP feedback damage',
    actionRewardText: 'Purifies cache and discovers 1 new Card',
    declineLabel: 'Bypass Cache Safely'
  },
  the_bargain: {
    id: 'the_bargain',
    name: 'The Bargain',
    tagline: 'Resonance Market Offer',
    description: 'A shadowy Void Merchant offers an immediate, discounted elemental boon in exchange for raw Essence reserves.',
    actionLabel: 'Strike Bargain',
    actionCostText: 'Spends 10 Run Essence',
    actionRewardText: 'Acquires 1 random Basic or Advanced Boon',
    declineLabel: 'Decline Offer'
  },
  silent_choir: {
    id: 'silent_choir',
    name: 'Silent Choir',
    tagline: 'Sanctuary Foreshadowing',
    description: 'Ethereal voices echo through the quiet passage. Standing in alignment heals your core and permanently bolsters your max health for this run.',
    actionLabel: 'Receive Choir Blessing',
    actionCostText: 'No Cost (0 Essence / 0 HP)',
    actionRewardText: 'Grants +4 Max HP & +4 HP heal',
    declineLabel: 'Proceed Quietly'
  }
};

export default function AnomalyPhase({
  runState,
  setRunState,
  unlockedCardIds,
  unlockCards,
  onDone
}: AnomalyPhaseProps) {
  const [resolved, setResolved] = useState(false);
  const [outcomeSummary, setOutcomeSummary] = useState<string | null>(null);

  // Deterministically select event for this node
  const activeEvent = useMemo<EventConfig>(() => {
    const events: AnomalyEvent[] = [
      'echos_fragment',
      'unstable_residue',
      'corrupted_cache',
      'the_bargain',
      'silent_choir'
    ];
    let hash = runState.seed;
    const key = `${runState.currentNodeId}_anomaly_event`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
    }
    const idx = hash % events.length;
    return EVENT_CONFIGS[events[idx]];
  }, [runState.seed, runState.currentNodeId]);

  const handleAccept = () => {
    if (resolved) return;

    if (activeEvent.id === 'echos_fragment') {
      const damage = 4;
      const pool = buildEmberCardPool();
      const lockedCards = pool.filter(c => !unlockedCardIds.includes(c.id));
      let discoveredCardName = 'Ancient Card';

      if (lockedCards.length > 0) {
        const randomCard = lockedCards[Math.floor(Math.random() * lockedCards.length)];
        unlockCards([randomCard.id]);
        discoveredCardName = randomCard.name;
      }

      const nextHp = Math.max(1, runState.playerHp - damage);
      const logMsg = `🔮 Echo's Fragment: Paid 4 HP (HP: ${nextHp}/${runState.playerMaxHp}). Discovered Card "${discoveredCardName}" permanently!`;

      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playerHp: nextHp,
          logs: [...prev.logs, logMsg]
        };
      });

      const summary = `Attuned to Echo's Fragment: Paid 4 HP, discovered "${discoveredCardName}"!`;
      setOutcomeSummary(summary);
      setResolved(true);
    } else if (activeEvent.id === 'unstable_residue') {
      const damage = 4;
      const essenceGain = 15;
      const nextHp = Math.max(1, runState.playerHp - damage);
      const nextEssence = runState.essence + essenceGain;
      const logMsg = `⚡ Unstable Residue: Absorbed residue for +15 Essence (HP: ${nextHp}/${runState.playerMaxHp}, ESS: ${nextEssence}).`;

      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playerHp: nextHp,
          essence: nextEssence,
          logs: [...prev.logs, logMsg]
        };
      });

      const summary = `Absorbed Unstable Residue: Paid 4 HP, gained +15 Essence!`;
      setOutcomeSummary(summary);
      setResolved(true);
    } else if (activeEvent.id === 'corrupted_cache') {
      const damage = 2;
      const pool = buildEmberCardPool();
      const lockedCards = pool.filter(c => !unlockedCardIds.includes(c.id));
      let discoveredCardName = 'Purified Card';

      if (lockedCards.length > 0) {
        const randomCard = lockedCards[Math.floor(Math.random() * lockedCards.length)];
        unlockCards([randomCard.id]);
        discoveredCardName = randomCard.name;
      }

      const nextHp = Math.max(1, runState.playerHp - damage);
      const logMsg = `💥 Corrupted Cache: Cleansed cache for 2 HP damage. Discovered Card "${discoveredCardName}".`;

      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playerHp: nextHp,
          logs: [...prev.logs, logMsg]
        };
      });

      const summary = `Cleansed Corrupted Cache: Took 2 HP feedback damage, discovered "${discoveredCardName}"!`;
      setOutcomeSummary(summary);
      setResolved(true);
    } else if (activeEvent.id === 'the_bargain') {
      const cost = 10;
      if (runState.essence < cost) return;

      const eligibleBoons = BOON_POOL.filter(b => 
        (b.tier === 'basic' || b.tier === 'advanced') && 
        !runState.boons.some(hb => hb.id === b.id)
      );
      const unownedBoons = BOON_POOL.filter(b => !runState.boons.some(hb => hb.id === b.id));

      const boon = eligibleBoons.length > 0
        ? eligibleBoons[Math.floor(Math.random() * eligibleBoons.length)]
        : unownedBoons.length > 0
        ? unownedBoons[Math.floor(Math.random() * unownedBoons.length)]
        : BOON_POOL[0];

      const nextEssence = runState.essence - cost;
      const logMsg = `🤝 The Bargain: Spent 10 Essence. Acquired Boon "${boon.id.toUpperCase()}" (${boon.tier} tier).`;

      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          essence: nextEssence,
          boons: [...prev.boons, boon],
          logs: [...prev.logs, logMsg]
        };
      });

      const summary = `Struck Bargain: Spent 10 Essence, acquired Boon "${boon.id.toUpperCase()}"!`;
      setOutcomeSummary(summary);
      setResolved(true);
    } else if (activeEvent.id === 'silent_choir') {
      const hpGain = 4;
      const nextMaxHp = runState.playerMaxHp + hpGain;
      const nextHp = runState.playerHp + hpGain;
      const logMsg = `🕊️ Silent Choir: Received blessing (+4 Max HP, HP: ${nextHp}/${nextMaxHp}).`;

      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playerMaxHp: nextMaxHp,
          playerHp: nextHp,
          logs: [...prev.logs, logMsg]
        };
      });

      const summary = `Received Silent Choir's Blessing: +4 Max HP & +4 HP heal!`;
      setOutcomeSummary(summary);
      setResolved(true);
    }
  };

  const handleDecline = () => {
    if (resolved) return;
    const logMsg = `🚪 Anomaly Zone: Safely bypassed "${activeEvent.name}".`;
    setRunState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        logs: [...prev.logs, logMsg]
      };
    });
    setOutcomeSummary(`Bypassed ${activeEvent.name} safely.`);
    setResolved(true);
  };

  const canAffordBargain = activeEvent.id !== 'the_bargain' || runState.essence >= 10;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6" id="anomaly-phase-container">
      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900/90 border border-purple-500/30 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-purple-950/80 border border-purple-500/40 rounded-2xl text-purple-400">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
              Void Anomaly Zone • {activeEvent.tagline}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-100 mt-0.5">
              {activeEvent.name}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 text-rose-400">
            <Heart className="w-4 h-4" />
            <span>{runState.playerHp}/{runState.playerMaxHp} HP</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Gem className="w-4 h-4" />
            <span>{runState.essence} ESS</span>
          </div>
        </div>
      </div>

      {/* EVENT CONTENT CARD */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col gap-6 shadow-xl" id="anomaly-event-card">
        <p className="text-sm text-slate-300 leading-relaxed font-sans bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          {activeEvent.description}
        </p>

        {!resolved ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION A: ACTION */}
            <button
              onClick={handleAccept}
              disabled={!canAffordBargain}
              className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden ${
                canAffordBargain
                  ? 'bg-purple-950/30 hover:bg-purple-900/40 border-purple-500/40 hover:border-purple-400 shadow-lg group'
                  : 'bg-slate-950/50 border-slate-800 opacity-50 cursor-not-allowed'
              }`}
              id="anomaly-accept-btn"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    {activeEvent.actionLabel}
                  </span>
                </div>
                <div className="text-xs font-mono text-rose-400 font-semibold mb-1">
                  Cost: {activeEvent.actionCostText}
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">
                  Reward: {activeEvent.actionRewardText}
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-mono text-purple-400 group-hover:text-purple-300 font-bold gap-1 mt-2">
                <span>Intervene</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* OPTION B: DECLINE / WALK AWAY */}
            <button
              onClick={handleDecline}
              className="p-5 bg-slate-950/40 hover:bg-slate-850/60 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all flex flex-col justify-between gap-4 cursor-pointer group"
              id="anomaly-decline-btn"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-400" />
                    {activeEvent.declineLabel}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 mb-1">
                  Cost: 0 Essence / 0 HP
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Result: Maintain current status & proceed
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-mono text-slate-400 group-hover:text-slate-300 font-bold gap-1 mt-2">
                <span>Pass Safely</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        ) : (
          /* RESOLVED SUMMARY PANEL */
          <div className="p-5 bg-slate-950/90 border border-emerald-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl animate-fade-in" id="anomaly-resolved-panel">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">
                  Anomaly Resolved
                </span>
                <p className="text-xs font-mono text-slate-200 mt-0.5">
                  {outcomeSummary}
                </p>
              </div>
            </div>
            <button
              onClick={onDone}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-display transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
              id="anomaly-continue-btn"
            >
              <span>Continue to Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
