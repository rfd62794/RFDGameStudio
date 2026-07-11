import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps } from '../../engine/types';
import type { BrewfieldGameState, ElementType, ComponentType } from './types';

import IntroScreen from './components/IntroScreen';
import GameOverScreen from './components/GameOverScreen';
import MapProgress from './components/MapProgress';
import EnemySection from './components/EnemySection';
import CauldronSection from './components/CauldronSection';
import PlayerSection from './components/PlayerSection';
import ForageNode from './components/ForageNode';
import RestNode from './components/RestNode';

function buildInitialState(session: {
  files: { data: Record<string, unknown> };
  executor: { call: (name: string, ...args: unknown[]) => unknown };
}): BrewfieldGameState {
  const data = session.files.data;
  const run = session.executor.call('init_run', data) as BrewfieldGameState;
  return session.executor.call('init_node', data, run, 1) as BrewfieldGameState;
}

export default function App({ session }: GameRendererProps) {
  const data = session.files.data;
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call } = useLuaCall(session);

  const [selectedSlot1, setSelectedSlot1] = useState<number | null>(null);
  const [selectedSlot2, setSelectedSlot2] = useState<number | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | null>(null);

  const resetCauldron = useCallback(() => {
    setSelectedSlot1(null);
    setSelectedSlot2(null);
    setSelectedComponent(null);
  }, []);

  const handleStart = useCallback(() => {
    const run = call('init_run', data) as BrewfieldGameState | null;
    if (!run) return;
    const next = call('init_node', data, run, 1) as BrewfieldGameState | null;
    if (!next) return;
    resetCauldron();
    setState(next);
  }, [call, data, resetCauldron, setState]);

  const handleSelectElement = useCallback((index: number) => {
    if (selectedSlot1 === index) {
      setSelectedSlot1(null);
    } else if (selectedSlot2 === index) {
      setSelectedSlot2(null);
    } else {
      if (selectedSlot1 === null) {
        setSelectedSlot1(index);
      } else if (selectedSlot2 === null) {
        setSelectedSlot2(index);
      } else {
        setSelectedSlot1(index);
      }
    }
  }, [selectedSlot1, selectedSlot2]);

  const handleRemoveElement = useCallback((slot: 1 | 2) => {
    if (slot === 1) setSelectedSlot1(null);
    else setSelectedSlot2(null);
  }, []);

  const handleSelectComponent = useCallback((component: ComponentType) => {
    setSelectedComponent((prev) => (prev === component ? null : component));
  }, []);

  const handleBrew = useCallback(() => {
    if (!state || !state.enemy) return;
    const el1 = selectedSlot1 !== null ? state.hand[selectedSlot1] : null;
    const el2 = selectedSlot2 !== null ? state.hand[selectedSlot2] : null;
    if (!selectedComponent) return;
    if (!el1 && !el2) return;

    const next = call(
      'resolve_turn',
      data,
      state,
      el1,
      el2,
      selectedComponent,
      state.currentTurn
    ) as BrewfieldGameState | null;
    if (!next) return;

    resetCauldron();
    setState(next);
  }, [state, selectedSlot1, selectedSlot2, selectedComponent, call, data, resetCauldron, setState]);

  const handleAdvance = useCallback(() => {
    if (!state) return;
    const advanced = call('advance_node', state) as BrewfieldGameState | null;
    if (!advanced) return;
    if (advanced.screen === 'game_over') {
      setState(advanced);
      return;
    }
    const next = call('init_node', data, advanced, advanced.currentNodeId) as BrewfieldGameState | null;
    if (!next) return;
    resetCauldron();
    setState(next);
  }, [state, call, data, resetCauldron, setState]);

  const handleForage = useCallback(
    (element: ElementType) => {
      if (!state) return;
      const picked = call('choose_forage', state, element) as BrewfieldGameState | null;
      if (!picked) return;
      const advanced = call('advance_node', picked) as BrewfieldGameState | null;
      if (!advanced) return;
      const next = call('init_node', data, advanced, advanced.currentNodeId) as BrewfieldGameState | null;
      if (!next) return;
      setState(next);
    },
    [state, call, data, setState]
  );

  const handleRestHeal = useCallback(() => {
    if (!state) return;
    const rested = call('rest_stoke_furnace', state) as BrewfieldGameState | null;
    if (!rested) return;
    const advanced = call('advance_node', rested) as BrewfieldGameState | null;
    if (!advanced) return;
    const next = call('init_node', data, advanced, advanced.currentNodeId) as BrewfieldGameState | null;
    if (!next) return;
    setState(next);
  }, [state, call, data, setState]);

  const handleRestClone = useCallback(
    (element: ElementType) => {
      if (!state) return;
      const rested = call('rest_synthesize_element', state, element) as BrewfieldGameState | null;
      if (!rested) return;
      const advanced = call('advance_node', rested) as BrewfieldGameState | null;
      if (!advanced) return;
      const next = call('init_node', data, advanced, advanced.currentNodeId) as BrewfieldGameState | null;
      if (!next) return;
      setState(next);
    },
    [state, call, data, setState]
  );

  if (!isInitialized || !state) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center font-mono text-sm">
        Loading Brewfield…
      </div>
    );
  }

  if (state.screen === 'intro') {
    return <IntroScreen onStartGame={handleStart} />;
  }

  if (state.screen === 'game_over') {
    return (
      <GameOverScreen
        won={!!state.runWon}
        stats={state.stats}
        onRestart={handleStart}
      />
    );
  }

  const activeNode = state.nodes.find((n) => n.id === state.currentNodeId);

  return (
    <div className="h-screen bg-stone-950 text-stone-200 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-stone-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-stone-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <header className="shrink-0 w-full bg-stone-950 border-b border-stone-900 p-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-lg">⚗️</span>
          <h1 className="text-lg font-serif font-extrabold tracking-widest text-stone-100">
            BREWFIELD
          </h1>
          <span className="text-[10px] font-mono text-stone-600 uppercase tracking-wider hidden sm:inline">
            Alchemical Battler
          </span>
        </div>
        <div className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
          Phase A · Shared Engine
        </div>
      </header>

      <div className="shrink-0">
        <MapProgress nodes={state.nodes} currentNodeId={state.currentNodeId} />
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 bg-stone-900/40 border border-stone-900/60 p-4 rounded-xl flex flex-col gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold block mb-1">
              Persistent Pool ({state.deck.length} Elements)
            </span>
            <div className="flex flex-wrap gap-1.5 py-1">
              {state.deck.map((el, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full text-[10px] font-bold font-mono flex items-center justify-center border uppercase select-none"
                  style={{
                    color: getElementColorInline(el),
                    borderColor: `${getElementColorInline(el)}30`,
                    backgroundColor: `${getElementColorInline(el)}10`,
                  }}
                >
                  {el[0]}
                </span>
              ))}
            </div>
            <span className="text-[9px] font-mono text-stone-500 leading-normal block mt-1.5">
              These elements are shuffled to form your draw pile at the start of each fight.
            </span>
          </div>

          <div className="border-t border-stone-900 pt-3">
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold block mb-1">
              Active Objective
            </span>
            {activeNode?.type === 'fight' ? (
              <div className="text-xs font-mono text-rose-400">
                ⚔️ Combat: Defeat the hostile {state.enemy?.name} to descend.
              </div>
            ) : activeNode?.type === 'forage' ? (
              <div className="text-xs font-mono text-amber-400">
                🌾 Exploration: Search the herbarium for compounds.
              </div>
            ) : (
              <div className="text-xs font-mono text-emerald-400">
                🔥 Camp: stoke furnace flames or clone an element.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeNode?.type === 'fight' && state.enemy && (
              <div key="combat" className="flex flex-col gap-6">
                <EnemySection enemy={state.enemy} />

                {state.combatOutcome ? (
                  <CombatOutcomeCard
                    outcome={state.combatOutcome}
                    isBoss={state.currentNodeId >= 9}
                    onAdvance={handleAdvance}
                  />
                ) : (
                  <>
                    <CauldronSection
                      element1={selectedSlot1 !== null ? state.hand[selectedSlot1] : null}
                      element2={selectedSlot2 !== null ? state.hand[selectedSlot2] : null}
                      component={selectedComponent}
                      residues={state.residues}
                      onRemoveElement={handleRemoveElement}
                      onRemoveComponent={() => setSelectedComponent(null)}
                      onBrew={handleBrew}
                      currentTurn={state.currentTurn}
                    />
                    <PlayerSection
                      player={state.player}
                      hand={state.hand}
                      selectedElements={[selectedSlot1, selectedSlot2]}
                      activeComponent={selectedComponent}
                      drawPileSize={state.drawPile.length}
                      discardPileSize={state.discardPile.length}
                      onSelectElement={handleSelectElement}
                      onSelectComponent={handleSelectComponent}
                    />
                  </>
                )}
              </div>
            )}

            {activeNode?.type === 'forage' && state.forageOptions && (
              <div key="forage">
                <ForageNode
                  options={state.forageOptions}
                  onSelectIngredient={handleForage}
                />
              </div>
            )}

            {activeNode?.type === 'rest' && (
              <div key="rest">
                <RestNode
                  playerHp={state.player.hp}
                  playerMaxHp={state.player.maxHp}
                  deck={state.deck}
                  onStokeFurnace={handleRestHeal}
                  onSynthesizeElement={handleRestClone}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        <Logbook logs={state.gameLogs} />
      </div>
    </div>
  );
}

function CombatOutcomeCard({
  outcome,
  isBoss,
  onAdvance,
}: {
  outcome: 'victory' | 'defeat';
  isBoss: boolean;
  onAdvance: () => void;
}) {
  const victory = outcome === 'victory';
  return (
    <div className="p-8 border border-stone-850 bg-stone-900 rounded-xl text-center shadow-xl flex flex-col items-center">
      <div
        className={`p-3 rounded-full border mb-4 ${
          victory
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/20'
            : 'bg-rose-950/40 text-rose-500 border-rose-800/20'
        }`}
      >
        {victory ? (
          <SparklesIcon className="w-12 h-12" />
        ) : (
          <HeartIcon className="w-12 h-12" />
        )}
      </div>
      <h2
        className={`text-2xl font-bold font-serif mb-1 ${
          victory ? 'text-emerald-400' : 'text-rose-500'
        }`}
      >
        {victory ? 'Chamber Purified!' : 'Cauldron Overheated'}
      </h2>
      <p className="text-stone-400 text-xs font-mono max-w-sm mb-6">
        {victory
          ? 'The hazardous element clouds dissipate. The corridor is clear.'
          : 'Your physical matrix dissolved inside the Cauldron Floors.'}
      </p>
      <button
        onClick={onAdvance}
        className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-sm tracking-widest rounded-xl border border-amber-400 flex items-center gap-2 transition-all"
        id="btn-advance"
      >
        {victory ? (isBoss ? 'VIEW RUN SUMMARY' : 'DESCEND DEEPER') : 'VIEW SUMMARY'}
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function Logbook({ logs }: { logs: { sender: 'player' | 'enemy' | 'field' | 'system'; turn: number; message: string }[] }) {
  return (
    <div className="lg:col-span-1 flex flex-col h-[500px] lg:h-[650px] bg-stone-900/40 border border-stone-900/60 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 border-b border-stone-900 bg-stone-950/60 flex items-center gap-1.5 text-stone-400 text-xs font-mono font-bold select-none">
        <ScrollIcon className="w-4 h-4 text-amber-500" />
        Alchemical Logbook
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono text-[10px] leading-relaxed select-text">
        {logs.length === 0 ? (
          <div className="text-stone-600 italic text-center py-12">No formula entries recorded yet.</div>
        ) : (
          [...logs].reverse().map((log, i) => {
            let senderColor = 'text-stone-500';
            let senderLabel = 'SYSTEM';
            if (log.sender === 'player') {
              senderColor = 'text-amber-400 font-bold';
              senderLabel = 'ALCHEMIST';
            } else if (log.sender === 'enemy') {
              senderColor = 'text-rose-400 font-bold';
              senderLabel = 'GUARDIAN';
            } else if (log.sender === 'field') {
              senderColor = 'text-cyan-400';
              senderLabel = 'SEDIMENT';
            }
            return (
              <div key={i} className="border-b border-stone-900 pb-2">
                <div className="flex items-center justify-between mb-0.5 text-[8px] text-stone-500">
                  <span className={senderColor}>[{senderLabel}]</span>
                  <span>TURN {log.turn}</span>
                </div>
                <p className="text-stone-300">{log.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import {
  Sparkles as SparklesIcon,
  Heart as HeartIcon,
  ArrowRight as ArrowRightIcon,
  Scroll as ScrollIcon,
} from 'lucide-react';

function getElementColorInline(el: ElementType): string {
  const map: Record<ElementType, string> = {
    fire: '#ef4444',
    water: '#38bdf8',
    earth: '#10b981',
    air: '#c084fc',
  };
  return map[el];
}
