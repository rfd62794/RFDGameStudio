import React, { useState } from 'react';
import { usePersistentProgress } from './state/persistentProgress';
import { createRun, enterActiveNode, advanceNode, commitRunResults, selectBranch } from './state/runState';
import { generateReward, RELIC_POOL } from './utils';
import { RunState, TypedBoon, Relic } from './types';
import StatsHeader from './components/StatsHeader';
import PersistentMenu from './components/PersistentMenu';
import TopSystemBar from './components/TopSystemBar';
import DiagnosticsOverlay from './components/DiagnosticsOverlay';
import FooterLogsTray from './components/FooterLogsTray';
import PhaseRouter from './components/PhaseRouter';

type Phase = 'title' | 'opening' | 'roster' | 'floorChoice' | 'deckBuild' | 'combat' | 'restCraft' | 'map' | 'runEnd' | 'reward' | 'treasure' | 'store' | 'passage' | 'anomaly' | 'discoveryReview';

export default function App() {
  const {
    essence,
    unlockedCardIds,
    deckCardIds,
    globalCombinationCounts,
    highestFloorUnlocked,
    bankedEssence,
    updateBankedEssence,
    consumeBankedEssence,
    unlockCards,
    gainEssence,
    unlockFloor,
    resetAll
  } = usePersistentProgress();

  const [phase, setPhase] = useState<Phase>('title');
  const [runState, setRunState] = useState<RunState | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [unlockedCardsBeforeRun, setUnlockedCardsBeforeRun] = useState<string[]>([]);
  const [discoveryReviewData, setDiscoveryReviewData] = useState<{
    newCardIds: string[];
    boonsAcquired: TypedBoon[];
    relicsAcquired: Relic[];
    essenceGained: number;
    isVictory: boolean;
  } | null>(null);

  // Check if saved progress exists for "Continue" button
  const hasSave = Boolean(
    runState !== null ||
    highestFloorUnlocked > 1 ||
    essence > 0 ||
    bankedEssence.available ||
    unlockedCardIds.length > 2
  );

  // Rewards state
  const [bossRewards, setBossRewards] = useState<string[] | null>(null);
  const [hasClaimedReward, setHasClaimedReward] = useState<boolean>(false);

  // Toggle debug panel
  const [showDebug, setShowDebug] = useState<boolean>(false);

  const handleStartRun = (chosenFloor: number = selectedFloor) => {
    setSelectedFloor(chosenFloor);
    setUnlockedCardsBeforeRun([...unlockedCardIds]);
    const seed = Math.floor(Math.random() * 1000000);
    let bankedBonus = 0;
    if (chosenFloor === 1) {
      bankedBonus = consumeBankedEssence();
    }
    const freshRun = createRun(deckCardIds, seed, chosenFloor, bankedBonus);
    setRunState(freshRun);
    setBossRewards(null);
    setHasClaimedReward(false);
    setPhase('map');
  };

  const handleEnterNode = () => {
    if (!runState) return;
    const currentNode = runState.nodes.find(n => n.id === runState.currentNodeId);
    if (!currentNode) return;

    const nextState = enterActiveNode(runState, deckCardIds);
    setRunState(nextState);

    if (currentNode.type === 'fight' || currentNode.type === 'boss') {
      setPhase('combat');
    } else if (currentNode.type === 'restCraft') {
      setPhase('restCraft');
    } else if (currentNode.type === 'treasure') {
      setPhase('treasure');
    } else if (currentNode.type === 'store') {
      setPhase('store');
    } else if (currentNode.type === 'anomaly') {
      setPhase('anomaly');
    }
  };

  const handleTravelToNode = (targetNodeId: string) => {
    if (!runState) return;
    const nextState = selectBranch(runState, targetNodeId);
    setRunState(nextState);
  };

  const handleAdvanceToNextNode = () => {
    if (!runState) return;

    const nextState = advanceNode(runState);
    setBossRewards(null);
    setHasClaimedReward(false);

    if (nextState.status === 'victory' || nextState.status === 'game_over') {
      if (nextState.status === 'victory') {
        const { slots: rewards } = generateReward(unlockedCardIds, nextState.enemy?.tier ?? 'master');
        if (rewards.length === 0) {
          setBossRewards(null);
          setHasClaimedReward(true);
        } else {
          setBossRewards(rewards);
          setHasClaimedReward(false);
        }
      }
      setRunState(nextState);
      setPhase('runEnd');
    } else {
      setRunState(nextState);
      setPhase('map');
    }
  };

  const handleCommitResults = (claimedRewards: string[]) => {
    if (!runState) return;

    if (runState.status === 'victory' && runState.currentFloor === highestFloorUnlocked) {
      unlockFloor(highestFloorUnlocked + 1);
    }

    const { newlyUnlocked, essenceGained } = commitRunResults(runState, claimedRewards);

    unlockCards(newlyUnlocked, runState.combinationCounts);
    gainEssence(essenceGained);

    const newCardsInRun = Array.from(new Set([
      ...newlyUnlocked,
      ...unlockedCardIds.filter(id => !unlockedCardsBeforeRun.includes(id))
    ]));

    setDiscoveryReviewData({
      newCardIds: newCardsInRun,
      boonsAcquired: runState.boons || [],
      relicsAcquired: (runState.relics || []).map(rId => RELIC_POOL.find(r => r.id === rId)).filter((r): r is Relic => r !== undefined),
      essenceGained,
      isVictory: runState.status === 'victory'
    });

    setPhase('discoveryReview');
  };

  const handleBypassCheat = () => {
    gainEssence(100);
    if (runState) {
      setRunState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          essence: prev.essence + 50,
          logs: [...prev.logs, "🧪 CHEAT: Activated bypass portal. +100 Banked Essence and +50 Run Essence granted."]
        };
      });
    }
  };

  const handleWipeBypass = () => {
    resetAll();
    window.location.reload();
  };

  const handleReturnToTitle = () => {
    setRunState(null);
    setBossRewards(null);
    setHasClaimedReward(false);
    setPhase('title');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 antialiased selection:bg-amber-500 selection:text-black relative">
      <PersistentMenu
        currentPhase={phase}
        runState={runState}
        onReturnToTitle={handleReturnToTitle}
      />

      <div className="max-w-5xl mx-auto flex flex-col gap-6" id="dissonance-root-container">
        <TopSystemBar
          essence={essence}
          showDebug={showDebug}
          onToggleDebug={() => setShowDebug(!showDebug)}
        />

        {showDebug && (
          <DiagnosticsOverlay
            runState={runState}
            highestFloorUnlocked={highestFloorUnlocked}
            onClose={() => setShowDebug(false)}
            onUnlockFloor={unlockFloor}
            onBypassCheat={handleBypassCheat}
            onWipeBypass={handleWipeBypass}
          />
        )}

        <StatsHeader persistentEssence={essence} runState={runState} bankedEssence={bankedEssence} />

        <PhaseRouter
          phase={phase}
          setPhase={setPhase}
          runState={runState}
          setRunState={setRunState}
          hasSave={hasSave}
          unlockedCardIds={unlockedCardIds}
          deckCardIds={deckCardIds}
          globalCombinationCounts={globalCombinationCounts}
          highestFloorUnlocked={highestFloorUnlocked}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          bankedEssence={bankedEssence}
          updateBankedEssence={updateBankedEssence}
          unlockCards={unlockCards}
          unlockFloor={unlockFloor}
          handleStartRun={handleStartRun}
          handleEnterNode={handleEnterNode}
          handleTravelToNode={handleTravelToNode}
          handleAdvanceToNextNode={handleAdvanceToNextNode}
          handleCommitResults={handleCommitResults}
          bossRewards={bossRewards}
          setBossRewards={setBossRewards}
          hasClaimedReward={hasClaimedReward}
          setHasClaimedReward={setHasClaimedReward}
          discoveryReviewData={discoveryReviewData}
          setDiscoveryReviewData={setDiscoveryReviewData}
          essence={essence}
        />

        <FooterLogsTray runState={runState} />
      </div>
    </div>
  );
}
