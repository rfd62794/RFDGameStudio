import { useCallback, useEffect, useState } from 'react';
import { GameShell } from '../../components';
import { useLuaCall } from '../../hooks';
import type { GameRendererProps } from '../../engine/types';
import type { AppPhase, CombatTurnResult, DeckCard, OpeningPackItem, RewardSlot, RunState } from './types';

import TitlePhase from './phases/TitlePhase';
import OpeningPhase from './phases/OpeningPhase';
import FloorChoicePhase from './phases/FloorChoicePhase';
import DeckBuildPhase from './phases/DeckBuildPhase';
import MapPhase from './phases/MapPhase';
import CombatPhase from './phases/CombatPhase';
import RewardPhase from './phases/RewardPhase';
import RestCraftPhase from './phases/RestCraftPhase';

const UNLOCKED_KEY = 'dissonance_unlocked_cards';
const SAVED_RUN_KEY = 'dissonance_saved_run';

function loadUnlockedCards(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function loadSavedRun(): RunState | null {
  try {
    const raw = localStorage.getItem(SAVED_RUN_KEY);
    return raw ? (JSON.parse(raw) as RunState) : null;
  } catch {
    return null;
  }
}

export default function App({ session }: GameRendererProps) {
  const data = session.files.data as Record<string, unknown>;
  const { call } = useLuaCall(session);

  const [appPhase, setAppPhase] = useState<AppPhase>('title');
  const [unlockedCardIds, setUnlockedCardIds] = useState<string[]>(loadUnlockedCards);
  const [savedRun] = useState<RunState | null>(loadSavedRun);
  const [run, setRun] = useState<RunState | null>(null);
  const [openingPack, setOpeningPack] = useState<OpeningPackItem[] | null>(null);
  const [pendingFloor, setPendingFloor] = useState(1);
  const [rewardSlots, setRewardSlots] = useState<RewardSlot[] | null>(null);

  useEffect(() => {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlockedCardIds));
  }, [unlockedCardIds]);

  useEffect(() => {
    if (run && run.status !== 'victory' && run.status !== 'game_over') {
      localStorage.setItem(SAVED_RUN_KEY, JSON.stringify(run));
    } else if (run && (run.status === 'victory' || run.status === 'game_over')) {
      localStorage.removeItem(SAVED_RUN_KEY);
    }
  }, [run]);

  const returnToTitle = useCallback(() => {
    setRun(null);
    setAppPhase('title');
  }, []);

  const handleNewRun = useCallback(() => {
    if (unlockedCardIds.length === 0) {
      const pack = call('generate_opening_pack', data) as OpeningPackItem[] | null;
      if (!pack) return;
      setOpeningPack(pack);
      setAppPhase('opening');
    } else {
      setAppPhase('floorChoice');
    }
  }, [unlockedCardIds, call, data]);

  const handleContinue = useCallback(() => {
    if (!savedRun) return;
    setRun(savedRun);
    setAppPhase('run');
  }, [savedRun]);

  const handleOpeningComplete = useCallback(() => {
    if (!openingPack) return;
    const cardIds = openingPack.map((p) => p.cardId);
    setUnlockedCardIds(cardIds);
    const seed = Math.floor(Math.random() * 1_000_000);
    const newRun = call('create_run', cardIds, seed, 1, 0, data) as RunState | null;
    if (!newRun) return;
    setRun(newRun);
    setOpeningPack(null);
    setAppPhase('run');
  }, [openingPack, call, data]);

  const handleFloorChosen = useCallback((floor: number) => {
    setPendingFloor(floor);
    setAppPhase('deckBuild');
  }, []);

  const handleDeckConfirm = useCallback((selectedIds: string[]) => {
    const seed = Math.floor(Math.random() * 1_000_000);
    const newRun = call('create_run', selectedIds, seed, pendingFloor, 0, data) as RunState | null;
    if (!newRun) return;
    setRun(newRun);
    setAppPhase('run');
  }, [call, data, pendingFloor]);

  const handleEnterCurrentNode = useCallback(() => {
    if (!run) return;
    const next = call('enter_active_node', run, run.deckCardIds, data) as RunState | null;
    if (!next) return;
    setRun(next);
  }, [run, call, data]);

  const handleSelectBranch = useCallback((targetNodeId: string) => {
    if (!run) return;
    const moved = call('select_branch', run, targetNodeId) as RunState | null;
    if (!moved) return;
    const entered = call('enter_active_node', moved, moved.deckCardIds, data) as RunState | null;
    if (!entered) return;
    setRun(entered);
  }, [run, call, data]);

  const handlePlayCard = useCallback((card: DeckCard) => {
    if (!run) return;
    const result = call('resolve_combat_turn', run, card, data) as CombatTurnResult | null;
    if (!result) return;
    setRun(result.nextState);
    if (result.fightWon === true) {
      const tier = result.nextState.enemy?.tier ?? 'basic';
      const slots = call(
        'generate_fixed_reward',
        result.nextState.playerMaxHp,
        result.nextState.deckCardIds,
        result.nextState.boons.map((b) => b.id),
        result.nextState.relics,
        tier,
        data
      ) as RewardSlot[] | null;
      if (slots) setRewardSlots(slots);
    }
  }, [run, call, data]);

  const handleClaimAllRewards = useCallback(() => {
    if (!run || !rewardSlots) return;
    let cur = run;
    const newlyUnlocked: string[] = [];
    for (const slot of rewardSlots) {
      const applied = call('apply_reward_slot', cur, slot, data) as RunState | null;
      if (applied) cur = applied;
      if (slot.kind === 'card' && slot.cardId) newlyUnlocked.push(slot.cardId);
    }
    if (newlyUnlocked.length > 0) {
      setUnlockedCardIds((prev) => Array.from(new Set([...prev, ...newlyUnlocked])));
    }
    const advanced = call('advance_node', cur) as RunState | null;
    if (advanced) setRun(advanced);
    setRewardSlots(null);
  }, [run, rewardSlots, call, data]);

  const isPreBoss = useCallback(() => {
    if (!run) return false;
    const node = run.nodes.find((n) => n.id === run.currentNodeId);
    return node?.connectsTo?.includes('boss') ?? false;
  }, [run]);

  const handleRest = useCallback(() => {
    if (!run) return;
    const next = call('apply_rest', run) as RunState | null;
    if (next) setRun(next);
  }, [run, call]);

  const handleAttachment = useCallback(() => {
    if (!run) return;
    const next = call('apply_attachment', run, data, isPreBoss()) as RunState | null;
    if (next) setRun(next);
  }, [run, call, data, isPreBoss]);

  const handleRestCraftContinue = useCallback(() => {
    if (!run) return;
    const advanced = call('advance_node', run) as RunState | null;
    if (advanced) setRun(advanced);
  }, [run, call]);

  const handleSkipUnbuiltNode = useCallback(() => {
    if (!run) return;
    const advanced = call('advance_node', run) as RunState | null;
    if (advanced) setRun(advanced);
  }, [run, call]);

  const statusArea = run ? (
    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
      Floor {run.currentFloor} · Turn {run.turnCount}
    </span>
  ) : undefined;

  return (
    <GameShell gameLabel="Dissonance Depths" gameId="dissonance" phase="Renderer Phase A" statusArea={statusArea}>
      <div className="h-full overflow-y-auto bg-slate-950 p-4">
        {appPhase === 'title' && (
          <TitlePhase hasSave={savedRun !== null} onNewRun={handleNewRun} onContinue={handleContinue} />
        )}

        {appPhase === 'opening' && openingPack && (
          <OpeningPhase pack={openingPack} onComplete={handleOpeningComplete} />
        )}

        {appPhase === 'floorChoice' && (
          <FloorChoicePhase
            floorFlavor={(data.floor_flavor as Record<string, { name: string; description: string }>) ?? {}}
            onChoose={handleFloorChosen}
          />
        )}

        {appPhase === 'deckBuild' && (
          <DeckBuildPhase
            unlockedCardIds={unlockedCardIds}
            cardPool={(call('build_card_pool', data) as DeckCard[] | null) ?? []}
            deckSize={((data.run as { deck_size?: number } | undefined)?.deck_size) ?? 8}
            onConfirm={handleDeckConfirm}
          />
        )}

        {appPhase === 'run' && run && run.status === 'not_started' && (
          <MapPhase run={run} onEnterCurrentNode={handleEnterCurrentNode} onSelectBranch={handleSelectBranch} />
        )}

        {appPhase === 'run' && run && run.status === 'combat' && !rewardSlots && (
          <CombatPhase run={run} onPlayCard={handlePlayCard} />
        )}

        {appPhase === 'run' && run && run.status === 'reward' && rewardSlots && (
          <RewardPhase slots={rewardSlots} onClaimAll={handleClaimAllRewards} />
        )}

        {appPhase === 'run' && run && run.status === 'rest_craft' && (
          <RestCraftPhase
            run={run}
            onRest={handleRest}
            onAttachment={handleAttachment}
            onContinue={handleRestCraftContinue}
          />
        )}

        {appPhase === 'run' && run && (run.status === 'treasure' || run.status === 'store' || run.status === 'anomaly') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 max-w-lg mx-auto my-4 text-center" id={`viewport-${run.status}-stub`}>
            <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wider">{run.status} — Not Yet Built</h2>
            <p className="text-xs font-mono text-slate-500">
              This room type is real (generated by Lua map generation) but its phase component is
              explicitly deferred to a second pass per the renderer directive's time-boxing.
            </p>
            <button
              onClick={handleSkipUnbuiltNode}
              className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl uppercase tracking-wider cursor-pointer"
              id="skip-unbuilt-node-btn"
            >
              Continue to Map
            </button>
          </div>
        )}

        {appPhase === 'run' && run && (run.status === 'victory' || run.status === 'game_over') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 max-w-lg mx-auto my-4 text-center">
            <h2 className={`text-2xl font-black tracking-wider ${run.status === 'victory' ? 'text-emerald-400' : 'text-rose-500'}`}>
              {run.status === 'victory' ? 'STABILITY ACHIEVED' : 'RUN FAILED'}
            </h2>
            <p className="text-xs font-mono text-slate-500">Final Essence: {run.essence}</p>
            <button
              onClick={returnToTitle}
              className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
              id="run-end-return-title-btn"
            >
              Return to Title
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
