import React, { useState, useMemo } from 'react';
import { Hammer, Heart, Gem, Gift } from 'lucide-react';
import { RunState, REST_OR_WEIGHTS, RunNode } from '../types';
import { BOON_POOL, buildEmberCardPool, RELIC_POOL } from '../utils';
import RestOrAttachment from '../components/RestOrAttachment';
import RoomResolvePanel from '../components/RoomResolvePanel';

interface RestCraftPhaseProps {
  runState: RunState;
  setRunState: React.Dispatch<React.SetStateAction<RunState | null>>;
  unlockedCardIds?: string[];
  unlockCards?: (ids: string[]) => void;
  onDone: () => void;
}

export default function RestCraftPhase({
  runState,
  setRunState,
  unlockedCardIds = [],
  unlockCards,
  onDone
}: RestCraftPhaseProps) {
  const [message, setMessage] = useState<string>('');
  const [actionTakenSummary, setActionTakenSummary] = useState<string>('');
  const [hasActedThisRoom, setHasActedThisRoom] = useState<boolean>(false);
  const [hasRested, setHasRested] = useState<boolean>(false);
  const [hasAttachmentUsed, setHasAttachmentUsed] = useState<boolean>(false);
  const [peekNodes, setPeekNodes] = useState<RunNode[] | null>(null);

  // Identify guaranteed pre-boss Rest node
  const isPreBossNode = useMemo(() => {
    const curr = runState.nodes.find(n => n.id === runState.currentNodeId);
    if (!curr) return false;
    return curr.connectsTo.some(targetId =>
      runState.nodes.find(n => n.id === targetId)?.type === 'boss'
    );
  }, [runState.nodes, runState.currentNodeId]);

  const isRestDisabled = isPreBossNode ? hasRested : hasActedThisRoom;
  const isAttachmentDisabled = isPreBossNode ? hasAttachmentUsed : hasActedThisRoom;
  const isResolved = isPreBossNode ? (hasRested || hasAttachmentUsed) : hasActedThisRoom;

  // Roll ONE option (peek | gift | treasure)
  const rolledAttachment = useMemo(() => {
    let hash = runState.seed;
    const key = `${runState.currentNodeId}_rest_or_roll`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
    }
    const rand = ((hash * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    if (isPreBossNode) {
      if (runState.relics?.includes('loaded_ledger')) {
        const floor = runState.currentFloor || 1;
        const weights = REST_OR_WEIGHTS[floor] || REST_OR_WEIGHTS[1];
        return weights.gift >= weights.treasure ? 'gift' : 'treasure';
      }
      return rand < 0.5 ? 'gift' : 'treasure';
    }

    const floor = runState.currentFloor || 1;
    const weights = REST_OR_WEIGHTS[floor] || REST_OR_WEIGHTS[1];

    if (runState.relics?.includes('loaded_ledger')) {
      let favorite: 'peek' | 'gift' | 'treasure' = 'peek';
      if (weights.gift > weights.peek && weights.gift >= weights.treasure) {
        favorite = 'gift';
      } else if (weights.treasure > weights.peek && weights.treasure >= weights.gift) {
        favorite = 'treasure';
      }
      return favorite;
    }

    if (rand < weights.peek) return 'peek';
    if (rand < weights.peek + weights.gift) return 'gift';
    return 'treasure';
  }, [runState.seed, runState.currentNodeId, runState.currentFloor, runState.relics, isPreBossNode]);

  const healAmount = Math.round(runState.playerMaxHp * 0.4);

  const handleRest = () => {
    if (isRestDisabled) return;
    if (isPreBossNode) {
      setHasRested(true);
    } else {
      setHasActedThisRoom(true);
    }

    setRunState(prev => {
      if (!prev) return null;
      const amount = Math.round(prev.playerMaxHp * 0.4);
      const nextHp = Math.min(prev.playerMaxHp, prev.playerHp + amount);
      const wasGiftSkipped = rolledAttachment === 'gift';
      const newSkippedCount = wasGiftSkipped ? (prev.giftSkippedCount || 0) + 1 : (prev.giftSkippedCount || 0);

      const skipLog = wasGiftSkipped 
        ? ` (Declined Gift — Cumulative skip count increased to ${newSkippedCount})`
        : '';

      return {
        ...prev,
        playerHp: nextHp,
        giftSkippedCount: newSkippedCount,
        logs: [
          ...prev.logs,
          `💚 Rested. Re-aligned frequency and recovered +${amount} HP (Health: ${nextHp}/${prev.playerMaxHp})${skipLog}.`
        ]
      };
    });

    if (rolledAttachment === 'gift') {
      const updatedSkips = (runState.giftSkippedCount || 0) + 1;
      const msg = `Healed +${healAmount} HP! (Declined Gift — Cumulative skip count now ${updatedSkips})`;
      setMessage(msg);
      setActionTakenSummary(msg);
    } else {
      const msg = `Healed +${healAmount} HP successfully!`;
      setMessage(msg);
      setActionTakenSummary(msg);
    }
  };

  const getPeekPreview = (currentNode: RunNode, allNodes: RunNode[]): RunNode[] => {
    const parts = currentNode.id.split('_');
    if (parts.length >= 2 && parts[0] === 'node') {
      const currentLayer = parseInt(parts[1], 10);
      const nextLayer = currentLayer + 1;
      const nextNodes = allNodes.filter(n => n.id.startsWith(`node_${nextLayer}_`));
      if (nextNodes.length > 0) return nextNodes;
      const boss = allNodes.find(n => n.id === 'boss');
      if (boss) return [boss];
    }
    return allNodes.filter(n => currentNode.connectsTo?.includes(n.id));
  };

  const handlePeekAction = () => {
    if (isAttachmentDisabled) return;
    if (isPreBossNode) {
      setHasAttachmentUsed(true);
    } else {
      setHasActedThisRoom(true);
    }

    const currNode = runState.nodes.find(n => n.id === runState.currentNodeId) || runState.nodes[0];
    const preview = getPeekPreview(currNode, runState.nodes);
    setPeekNodes(preview);

    setRunState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        logs: [
          ...prev.logs,
          `👁️ Peek Oracle Scan: Scanned next layer map nodes across all 3 lanes (${preview.length} lane(s) revealed).`
        ]
      };
    });
    const msg = `Peek Scan Complete: Revealed all 3 lanes for the next layer!`;
    setMessage(msg);
    setActionTakenSummary(msg);
  };

  const giftDetails = useMemo(() => {
    const skippedCount = runState.giftSkippedCount || 0;
    const tierOrder: Array<'basic' | 'advanced' | 'elite' | 'master'> = ['basic', 'advanced', 'elite', 'master'];
    const baseTier: 'basic' | 'advanced' | 'elite' | 'master' = 
      runState.currentFloor === 1 ? 'basic' : 
      runState.currentFloor === 2 ? 'advanced' : 
      runState.currentFloor === 3 ? 'elite' : 'master';

    const bump = Math.floor(skippedCount / 2);
    const bumpedIndex = Math.min(tierOrder.indexOf(baseTier) + bump, tierOrder.length - 1);
    const effectiveTier = tierOrder[bumpedIndex];

    let hash = runState.seed;
    const key = `${runState.currentNodeId}_gift_type_roll`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
    }
    const rand = ((hash * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const kind: 'card' | 'boon' = rand < 0.5 ? 'card' : 'boon';

    if (kind === 'card') {
      const relationByTier = { basic: 'single', advanced: 'same', elite: 'adjacent', master: 'opposed' };
      const cardPool = buildEmberCardPool();
      const targetRelation = relationByTier[effectiveTier];
      const eligible = cardPool.filter(c => c.relationType === targetRelation && !unlockedCardIds.includes(c.id));
      const chosenCard = eligible.length > 0 
        ? eligible[Math.floor(rand * eligible.length)] 
        : cardPool.filter(c => c.relationType === targetRelation)[0] || cardPool[0];

      return { kind: 'card' as const, effectiveTier, bump, skippedCount, card: chosenCard };
    } else {
      const boonPool = BOON_POOL.filter(b => b.tier === effectiveTier && !runState.boons.some(hb => hb.id === b.id));
      const unownedBoons = BOON_POOL.filter(b => !runState.boons.some(hb => hb.id === b.id));
      const chosenBoon = boonPool.length > 0 
        ? boonPool[Math.floor(rand * boonPool.length)] 
        : unownedBoons.length > 0
        ? unownedBoons[Math.floor(rand * unownedBoons.length)]
        : BOON_POOL[0];

      return { kind: 'boon' as const, effectiveTier, bump, skippedCount, boon: chosenBoon };
    }
  }, [runState.giftSkippedCount, runState.currentFloor, runState.seed, runState.currentNodeId, unlockedCardIds, runState.boons]);

  const handleClaimGift = () => {
    if (isAttachmentDisabled) return;
    if (isPreBossNode) {
      setHasAttachmentUsed(true);
    } else {
      setHasActedThisRoom(true);
    }

    if (giftDetails.kind === 'card' && giftDetails.card) {
      const cardId = giftDetails.card.id;
      if (unlockCards) unlockCards([cardId]);

      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          giftSkippedCount: 0,
          logs: [
            ...prev.logs,
            `🎁 Gift Claimed: Unlocked & Discovered Card "${giftDetails.card?.name}" (${giftDetails.effectiveTier} Tier). Skip count reset to 0.`
          ]
        };
      });
      const msg = `Claimed Gift Card: "${giftDetails.card.name}"! Skip count reset to 0.`;
      setMessage(msg);
      setActionTakenSummary(msg);
    } else if (giftDetails.kind === 'boon' && giftDetails.boon) {
      const boon = giftDetails.boon;
      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          giftSkippedCount: 0,
          boons: [...prev.boons, boon],
          logs: [
            ...prev.logs,
            `🎁 Gift Claimed: Acquired Benefit Boon "${boon.targetId.toUpperCase()}" (${giftDetails.effectiveTier} Tier). Skip count reset to 0.`
          ]
        };
      });
      const msg = `Claimed Gift Benefit: ${boon.targetId.toUpperCase()} Boon! Skip count reset to 0.`;
      setMessage(msg);
      setActionTakenSummary(msg);
    }
  };

  const treasureDetails = useMemo(() => {
    const tier: 'basic' | 'advanced' | 'elite' | 'master' = 
      runState.currentFloor === 1 ? 'basic' : 
      runState.currentFloor === 2 ? 'advanced' : 
      runState.currentFloor === 3 ? 'elite' : 'master';

    let hash = runState.seed;
    const key = `${runState.currentNodeId}_treasure_roll`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
    }
    const rand = ((hash * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    const roll: 'relic' | 'boon' = rand < 0.5 ? 'relic' : 'boon';
    if (roll === 'relic') {
      const eligibleRelics = RELIC_POOL.filter(r => !runState.relics.includes(r.id));
      if (eligibleRelics.length > 0) {
        const relic = eligibleRelics[Math.floor(rand * eligibleRelics.length)];
        return { kind: 'relic' as const, relic };
      }
    }

    const eligibleBoons = BOON_POOL.filter(b => b.tier === tier && !runState.boons.some(hb => hb.id === b.id));
    const unownedBoons = BOON_POOL.filter(b => !runState.boons.some(hb => hb.id === b.id));
    const boon = eligibleBoons.length > 0 
      ? eligibleBoons[Math.floor(rand * eligibleBoons.length)] 
      : unownedBoons.length > 0
      ? unownedBoons[Math.floor(rand * unownedBoons.length)]
      : BOON_POOL[0];
    return { kind: 'boon' as const, boon };
  }, [runState.seed, runState.currentNodeId, runState.currentFloor, runState.relics, runState.boons]);

  const handleClaimTreasure = () => {
    if (isAttachmentDisabled) return;
    if (isPreBossNode) {
      setHasAttachmentUsed(true);
    } else {
      setHasActedThisRoom(true);
    }

    if (treasureDetails.kind === 'relic' && treasureDetails.relic) {
      const relic = treasureDetails.relic;
      let echoLog = '';
      if (relic.id === 'echos_insight') {
        const pool = buildEmberCardPool();
        const lockedCards = pool.filter(c => !unlockedCardIds.includes(c.id));
        if (lockedCards.length > 0) {
          const randomCard = lockedCards[Math.floor(Math.random() * lockedCards.length)];
          if (unlockCards) unlockCards([randomCard.id]);
          echoLog = ` (Echo's Insight unlocked & discovered Card "${randomCard.name}")`;
        }
      }
      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          relics: [...prev.relics, relic.id],
          logs: [
            ...prev.logs,
            `💎 Rest Stop Treasure Offer: Acquired Relic "${relic.name}".${echoLog}`
          ]
        };
      });
      const msg = `Acquired Relic: "${relic.name}"!${echoLog}`;
      setMessage(msg);
      setActionTakenSummary(msg);
    } else if (treasureDetails.kind === 'boon' && treasureDetails.boon) {
      const boon = treasureDetails.boon;
      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          boons: [...prev.boons, boon],
          logs: [
            ...prev.logs,
            `💎 Rest Stop Treasure Offer: Acquired Benefit Boon "${boon.targetId.toUpperCase()}".`
          ]
        };
      });
      const msg = `Acquired Benefit: ${boon.targetId.toUpperCase()} Boon!`;
      setMessage(msg);
      setActionTakenSummary(msg);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-rest-craft">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none rounded-2xl" />
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <span className={`text-[10px] font-mono uppercase tracking-widest block font-bold ${isPreBossNode ? 'text-amber-400' : 'text-sky-400'}`}>
          {isPreBossNode ? '⚡ PRE-BOSS SANCTUARY (REST AND ATTACHMENT BOTH AVAILABLE)' : 'REST OR ATTACHMENT (MUTUALLY EXCLUSIVE — 1 CHOICE)'}
        </span>
        <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-1">
          <Hammer className="text-sky-400 w-6 h-6" />
          {isPreBossNode ? 'Pre-Boss Sanctuary Haven' : 'Resonant Rest & Attachment Stop'} (Floor {runState.currentFloor})
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isPreBossNode 
            ? `Guaranteed pre-boss sanctuary: You may apply Rest Alignment (+${healAmount} HP) AND utilize this floor's attachment option.` 
            : 'Choose wisely: Rest to restore HP OR utilize this floor\'s attachment option. Selecting one closes the room.'}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 border border-slate-800/60 rounded-xl font-mono text-xs">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Integrity Status</span>
            <span className="text-slate-200 font-bold">{runState.playerHp} / {runState.playerMaxHp} HP</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-500" />
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Active Run Essence</span>
            <span className="text-amber-400 font-bold">{runState.essence} ESSENCE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Gift Skips (Cumulative)</span>
            <span className="text-amber-300 font-bold">{runState.giftSkippedCount || 0} Skips (+{Math.floor((runState.giftSkippedCount || 0) / 2)} Tier)</span>
          </div>
        </div>
      </div>

      {/* MESSAGE BANNER */}
      {message && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl font-mono flex items-center gap-2 animate-fade-in" id="rest-message-banner">
          <span className="text-sky-400 font-bold">💡</span>
          <span>{message}</span>
        </div>
      )}

      {/* Rest Or Dual Column Layout */}
      <RestOrAttachment
        rolledAttachment={rolledAttachment}
        healAmount={healAmount}
        isRestDisabled={isRestDisabled}
        isAttachmentDisabled={isAttachmentDisabled}
        isPreBossNode={isPreBossNode}
        peekNodes={peekNodes}
        giftDetails={giftDetails}
        treasureDetails={treasureDetails}
        handleRest={handleRest}
        handlePeekAction={handlePeekAction}
        handleClaimGift={handleClaimGift}
        handleClaimTreasure={handleClaimTreasure}
      />

      {/* RESOLUTION PANEL & EXIT ACTION */}
      <RoomResolvePanel
        isResolved={isResolved}
        actionTakenSummary={actionTakenSummary}
        message={message}
        onDone={onDone}
      />
    </div>
  );
}
