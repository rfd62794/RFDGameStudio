import React from 'react';
import { RunState, BankedEssence, TypedBoon, Relic, FLOOR_CONFIG } from '../types';
import { generateReward, buildEmberCardPool, BOON_POOL, RELIC_POOL } from '../utils';
import { generateBalancedMap } from '../logic/mapGraph';

import TitlePhase from '../phases/TitlePhase';
import OpeningPhase from '../phases/OpeningPhase';
import RosterPhase from '../phases/RosterPhase';
import FloorChoicePhase from '../phases/FloorChoicePhase';
import DeckBuildPhase from '../phases/DeckBuildPhase';
import MapPhase from '../phases/MapPhase';
import CombatPhase from '../phases/CombatPhase';
import RestCraftPhase from '../phases/RestCraftPhase';
import RunEndPhase from '../phases/RunEndPhase';
import RewardPhase from '../phases/RewardPhase';
import TreasurePhase from '../phases/TreasurePhase';
import PassagePhase from '../phases/PassagePhase';
import StorePhase from '../phases/StorePhase';
import AnomalyPhase from '../phases/AnomalyPhase';
import DiscoveryReviewPhase from '../phases/DiscoveryReviewPhase';

type Phase = 'title' | 'opening' | 'roster' | 'floorChoice' | 'deckBuild' | 'combat' | 'restCraft' | 'map' | 'runEnd' | 'reward' | 'treasure' | 'store' | 'passage' | 'anomaly' | 'discoveryReview';

interface PhaseRouterProps {
  phase: Phase;
  setPhase: (phase: Phase) => void;
  runState: RunState | null;
  setRunState: React.Dispatch<React.SetStateAction<RunState | null>>;
  hasSave: boolean;
  unlockedCardIds: string[];
  deckCardIds: string[];
  globalCombinationCounts: Record<string, number>;
  highestFloorUnlocked: number;
  selectedFloor: number;
  setSelectedFloor: (floor: number) => void;
  bankedEssence: BankedEssence;
  updateBankedEssence: (val: number) => void;
  unlockCards: (ids: string[], counts?: Record<string, number>) => void;
  unlockFloor: (floor: number) => void;
  handleStartRun: (chosenFloor?: number) => void;
  handleEnterNode: () => void;
  handleTravelToNode: (targetNodeId: string) => void;
  handleAdvanceToNextNode: () => void;
  handleCommitResults: (claimedRewards: string[]) => void;
  bossRewards: string[] | null;
  setBossRewards: (rewards: string[] | null) => void;
  hasClaimedReward: boolean;
  setHasClaimedReward: (claimed: boolean) => void;
  discoveryReviewData: {
    newCardIds: string[];
    boonsAcquired: TypedBoon[];
    relicsAcquired: Relic[];
    essenceGained: number;
    isVictory: boolean;
  } | null;
  setDiscoveryReviewData: (data: any) => void;
  essence: number;
}

export default function PhaseRouter({
  phase,
  setPhase,
  runState,
  setRunState,
  hasSave,
  unlockedCardIds,
  deckCardIds,
  globalCombinationCounts,
  highestFloorUnlocked,
  selectedFloor,
  setSelectedFloor,
  bankedEssence,
  updateBankedEssence,
  unlockCards,
  unlockFloor,
  handleStartRun,
  handleEnterNode,
  handleTravelToNode,
  handleAdvanceToNextNode,
  handleCommitResults,
  bossRewards,
  setBossRewards,
  hasClaimedReward,
  setHasClaimedReward,
  discoveryReviewData,
  setDiscoveryReviewData,
  essence
}: PhaseRouterProps) {
  return (
    <main className="w-full flex flex-col gap-6" id="gameplay-main-workspace">
      {phase === 'title' && (
        <TitlePhase
          hasSave={hasSave}
          onNewRun={() => {
            const isFreshSave = unlockedCardIds.length === 0;
            setPhase(isFreshSave ? 'opening' : 'floorChoice');
          }}
          onContinue={() => {
            if (runState) {
              setPhase('map');
            } else {
              setPhase('floorChoice');
            }
          }}
          onCodex={() => setPhase('roster')}
          onSettings={() => {}}
          bankedEssence={bankedEssence}
        />
      )}

      {phase === 'opening' && (
        <OpeningPhase 
          unlockCards={unlockCards}
          onComplete={() => setPhase('floorChoice')}
        />
      )}

      {phase === 'roster' && (
        <RosterPhase 
          unlockedCardIds={unlockedCardIds}
          deckCardIds={deckCardIds}
          globalCombinationCounts={globalCombinationCounts}
          runState={runState}
          onDone={() => setPhase('floorChoice')}
        />
      )}

      {phase === 'floorChoice' && (
        <FloorChoicePhase 
          unlockedCardIds={unlockedCardIds}
          highestFloorUnlocked={highestFloorUnlocked}
          selectedFloor={selectedFloor}
          onSelectFloor={setSelectedFloor}
          onConfirmFloor={() => {
            const isFirstEverRun = unlockedCardIds.length === 4;
            if (isFirstEverRun) {
              handleStartRun(selectedFloor);
            } else {
              setPhase('deckBuild');
            }
          }}
          onBack={() => setPhase('roster')}
          bankedEssence={bankedEssence}
        />
      )}

      {phase === 'deckBuild' && (
        <DeckBuildPhase 
          selectedFloor={selectedFloor}
          unlockedCardIds={unlockedCardIds}
          deckCardIds={deckCardIds}
          unlockCards={unlockCards}
          onStartRun={handleStartRun}
          onBack={() => setPhase('floorChoice')}
          bankedEssence={bankedEssence}
        />
      )}

      {phase === 'map' && runState && (
        <MapPhase 
          runState={runState}
          onEnterNode={handleEnterNode}
          onTravelToNode={handleTravelToNode}
        />
      )}

      {phase === 'combat' && runState && (
        <CombatPhase 
          runState={runState}
          setRunState={setRunState}
          onFightWon={(isBoss) => {
            if (isBoss) {
              if (runState.currentFloor === highestFloorUnlocked) {
                unlockFloor(highestFloorUnlocked + 1);
              }
              const { slots: rewards } = generateReward(unlockedCardIds, runState.enemy?.tier ?? 'master');
              if (rewards.length === 0) {
                setBossRewards(null);
                setHasClaimedReward(true);
              } else {
                setBossRewards(rewards);
                setHasClaimedReward(false);
              }
              setRunState(prev => prev ? { ...prev, status: 'victory' } : null);
              setPhase('passage');
            } else {
              setPhase('reward');
            }
          }}
          onDone={(won) => {
            if (won) {
              setPhase('map');
            } else {
              setPhase('runEnd');
            }
          }}
        />
      )}

      {phase === 'reward' && runState && (
        <RewardPhase 
          unlockedCardIds={unlockedCardIds}
          heldBoonIds={runState.boons.map(b => b.id)}
          heldRelicIds={runState.relics || []}
          enemyTier={runState.enemy?.tier ?? 'basic'}
          playerMaxHp={runState.playerMaxHp}
          onRewardClaimed={(choice) => {
            if (choice.kind === 'card' && choice.cardId) {
              unlockCards([choice.cardId]);
              setRunState(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  logs: [...prev.logs, `🎁 Unlocked & Discovered Card: ${choice.cardId}`]
                };
              });
            } else if (choice.kind === 'benefit' && choice.boonId) {
              const boonObj = BOON_POOL.find(b => b.id === choice.boonId);
              if (boonObj) {
                setRunState(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    boons: [...prev.boons, boonObj],
                    logs: [...prev.logs, `✨ Acquired Harmonic Benefit: ${boonObj.id}`]
                  };
                });
              }
            } else if (choice.kind === 'heal' && choice.healAmount) {
              setRunState(prev => {
                if (!prev) return null;
                const nextHp = Math.min(prev.playerMaxHp, prev.playerHp + choice.healAmount!);
                return {
                  ...prev,
                  playerHp: nextHp,
                  logs: [...prev.logs, `💚 Restored +${choice.healAmount} HP via Reward selection (HP: ${nextHp}/${prev.playerMaxHp}).`]
                };
              });
            } else if (choice.kind === 'relic' && choice.relicId) {
              const relicObj = RELIC_POOL.find(r => r.id === choice.relicId);
              setRunState(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  relics: [...(prev.relics || []), choice.relicId!],
                  logs: [...prev.logs, `🔮 Acquired Rare Relic Upgrade: ${relicObj ? relicObj.name : choice.relicId}`]
                };
              });
            }
            handleAdvanceToNextNode();
          }}
        />
      )}

      {phase === 'treasure' && runState && (
        <TreasurePhase 
          runState={runState}
          onCollect={(choice) => {
            setRunState(prev => {
              if (!prev) return null;
              if (choice.type === 'essence') {
                return {
                  ...prev,
                  essence: prev.essence + choice.value,
                  logs: [...prev.logs, `💰 Merged anomalous cache reserves. Added +${choice.value} Run Essence.`]
                };
              } else {
                const relic = RELIC_POOL.find(r => r.id === choice.relicId);
                let echoLog = '';
                if (choice.relicId === 'echos_insight') {
                  const pool = buildEmberCardPool();
                  const lockedCards = pool.filter(c => !unlockedCardIds.includes(c.id));
                  if (lockedCards.length > 0) {
                    const randomCard = lockedCards[Math.floor(Math.random() * lockedCards.length)];
                    unlockCards([randomCard.id]);
                    echoLog = ` 🔮 Echo's Insight unlocked & discovered Card "${randomCard.name}" permanently!`;
                  }
                }
                return {
                  ...prev,
                  relics: [...(prev.relics || []), choice.relicId],
                  logs: [...prev.logs, `💎 Calibrated Anomalous Relic construct: "${relic ? relic.name : choice.relicId}" integrated successfully.${echoLog}`]
                };
              }
            });
            handleAdvanceToNextNode();
          }}
        />
      )}

      {phase === 'restCraft' && runState && (
        <RestCraftPhase 
          runState={runState}
          setRunState={setRunState}
          unlockedCardIds={unlockedCardIds}
          unlockCards={unlockCards}
          onDone={() => handleAdvanceToNextNode()}
        />
      )}

      {phase === 'store' && runState && (
        <StorePhase 
          runState={runState}
          setRunState={setRunState}
          onDone={() => handleAdvanceToNextNode()}
        />
      )}

      {phase === 'anomaly' && runState && (
        <AnomalyPhase
          runState={runState}
          setRunState={setRunState}
          unlockedCardIds={unlockedCardIds}
          unlockCards={unlockCards}
          onDone={() => handleAdvanceToNextNode()}
        />
      )}

      {phase === 'passage' && runState && (
        <PassagePhase 
          runState={runState}
          onProceed={(newBanked, remainingEssence) => {
            if (newBanked) {
              updateBankedEssence(newBanked.amount);
            }

            if (runState.currentFloor >= 5) {
              setPhase('runEnd');
              return;
            }

            const nextFloor = runState.currentFloor + 1;
            unlockFloor(nextFloor);

            const seed = Math.floor(Math.random() * 1000000);
            const nextConfig = FLOOR_CONFIG[nextFloor] || FLOOR_CONFIG[1];
            const { nodes: nextNodes, balance } = generateBalancedMap(seed, nextConfig.numLayers, runState.playerMaxHp, nextFloor);

            setRunState(prev => {
              if (!prev) return null;
              return {
                ...prev,
                currentFloor: nextFloor,
                currentNodeId: nextNodes[0].id,
                nodes: nextNodes,
                essence: remainingEssence !== undefined ? remainingEssence : prev.essence,
                seed,
                lastMapBalance: balance,
                logs: [
                  ...prev.logs,
                  `----------------------------------------`,
                  `Advanced to Floor ${nextFloor} (${nextConfig.numLayers} Layers). Seed: ${seed}. Map balance validated (${balance.netDamage} HP net damage, ${balance.attempts} attempt(s)).`
                ]
              };
            });
            setPhase('deckBuild');
          }}
        />
      )}

      {phase === 'runEnd' && runState && (
        <RunEndPhase 
          runState={runState}
          bossRewards={bossRewards}
          hasClaimedReward={hasClaimedReward}
          onCommitResults={handleCommitResults}
          totalPersistentEssence={essence}
        />
      )}

      {phase === 'discoveryReview' && (
        <DiscoveryReviewPhase 
          newCardIds={discoveryReviewData?.newCardIds || []}
          boonsAcquired={discoveryReviewData?.boonsAcquired || []}
          relicsAcquired={discoveryReviewData?.relicsAcquired || []}
          essenceGained={discoveryReviewData?.essenceGained || 0}
          isVictory={discoveryReviewData?.isVictory || false}
          onDone={() => {
            setRunState(null);
            setBossRewards(null);
            setHasClaimedReward(false);
            setDiscoveryReviewData(null);
            setPhase('roster');
          }}
        />
      )}
    </main>
  );
}
