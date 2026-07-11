import { useCallback, useMemo, useState } from 'react';
import {
  Heart,
  Flame,
  Droplets,
  Mountain,
  Wind,
  Sword,
  ShieldAlert,
  Bandage,
  Skull,
  ArrowRight,
  Sparkles,
  Scroll,
} from 'lucide-react';
import { GameShell } from '../../components';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps } from '../../engine/types';
import type {
  BrewfieldGameState,
  ElementType,
  ComponentType,
  EnemyState,
  PlayerState,
  RunNode,
} from './types';

const ELEMENT_ICONS: Record<ElementType, typeof Flame> = {
  fire: Flame,
  water: Droplets,
  earth: Mountain,
  air: Wind,
};

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#ef4444',
  water: '#38bdf8',
  earth: '#10b981',
  air: '#c084fc',
};

const COMPONENT_ICONS: Record<ComponentType, typeof Sword> = {
  strike: Sword,
  ward: ShieldAlert,
  mend: Bandage,
  blight: Skull,
};

const COMPONENT_COLORS: Record<ComponentType, string> = {
  strike: '#f43f5e',
  ward: '#3b82f6',
  mend: '#10b981',
  blight: '#d946ef',
};

function buildInitialState(session: { files: { data: Record<string, unknown> }; executor: { call: (name: string, ...args: unknown[]) => unknown } }): BrewfieldGameState {
  const data = session.files.data;
  const run = session.executor.call('init_run', data) as BrewfieldGameState;
  return session.executor.call('init_node', data, run, 1) as BrewfieldGameState;
}

function getNode(state: BrewfieldGameState): RunNode | undefined {
  return state.nodes.find(n => n.id === state.currentNodeId);
}

function getElementIcon(el: ElementType) {
  const Icon = ELEMENT_ICONS[el];
  return <Icon size={14} style={{ color: ELEMENT_COLORS[el] }} />;
}

function StatBadge({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-900/60 border border-stone-800 px-2 py-1 rounded">
      <span className="text-stone-500">{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}

function PlayerReadout({ player }: { player: PlayerState }) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatBadge label="HP" value={`${player.hp}/${player.maxHp}`} color="#f87171" />
      <StatBadge label="Shield" value={player.shield} color="#60a5fa" />
      {player.dodgeCharges > 0 && <StatBadge label="Dodge" value={player.dodgeCharges} color="#c084fc" />}
      {player.retaliateCharges > 0 && <StatBadge label="Retaliate" value={player.retaliateCharges} color="#f97316" />}
      {player.decayingShield > 0 && <StatBadge label="Carry Shield" value={player.decayingShield} color="#a3e635" />}
      {player.burnDebuff > 0 && <StatBadge label="Burn" value={player.burnDebuff} color="#ef4444" />}
    </div>
  );
}

function EnemyReadout({ enemy }: { enemy: EnemyState }) {
  return (
    <div className="border border-stone-800 bg-stone-900/60 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-stone-200">{enemy.name}</span>
        <span className="text-xs font-mono text-stone-500">{enemy.archetype}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <StatBadge label="HP" value={`${enemy.hp}/${enemy.maxHp}`} color="#f87171" />
        <StatBadge label="Shield" value={enemy.shield} color="#60a5fa" />
      </div>
      <div className="text-xs font-mono bg-stone-950 border border-stone-800 p-2 rounded">
        <span className="text-rose-400">Next:</span>{' '}
        {enemy.intent.description} ({enemy.intent.value} {enemy.intent.action === 'attack' || enemy.intent.action === 'special' ? 'DMG' : enemy.intent.action === 'defend' ? 'shield' : 'HP'})
      </div>
    </div>
  );
}

export default function App({ session }: GameRendererProps) {
  const data = session.files.data;
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);
  const [selectedSlot1, setSelectedSlot1] = useState<number | null>(null);
  const [selectedSlot2, setSelectedSlot2] = useState<number | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | null>(null);

  const node = state ? getNode(state) : undefined;

  const handleStart = useCallback(() => {
    if (!state) return;
    const run = call('init_run', data) as BrewfieldGameState | null;
    if (!run) return;
    const next = call('init_node', data, run, 1) as BrewfieldGameState | null;
    if (!next) return;
    setState(next);
  }, [state, call, data, setState]);

  const handleBrew = useCallback(() => {
    if (!state || !node || node.type !== 'fight' || !state.enemy) return;
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

    setSelectedSlot1(null);
    setSelectedSlot2(null);
    setSelectedComponent(null);
    setState(next);
  }, [state, node, selectedSlot1, selectedSlot2, selectedComponent, call, data, setState]);

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
    setState(next);
  }, [state, call, data, setState]);

  const handleForage = useCallback((element: ElementType) => {
    if (!state) return;
    const picked = call('choose_forage', state, element) as BrewfieldGameState | null;
    if (!picked) return;
    const advanced = call('advance_node', picked) as BrewfieldGameState | null;
    if (!advanced) return;
    const next = call('init_node', data, advanced, advanced.currentNodeId) as BrewfieldGameState | null;
    if (!next) return;
    setState(next);
  }, [state, call, data, setState]);

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

  const handleRestClone = useCallback((element: ElementType) => {
    if (!state) return;
    const rested = call('rest_synthesize_element', state, element) as BrewfieldGameState | null;
    if (!rested) return;
    const advanced = call('advance_node', rested) as BrewfieldGameState | null;
    if (!advanced) return;
    const next = call('init_node', data, advanced, advanced.currentNodeId) as BrewfieldGameState | null;
    if (!next) return;
    setState(next);
  }, [state, call, data, setState]);

  const handleSelectElement = useCallback((index: number) => {
    setSelectedSlot1(prev1 => {
      if (prev1 === index) return null;
      return prev1;
    });
    setSelectedSlot2(prev2 => {
      if (prev2 === index) return null;
      return prev2;
    });
    setSelectedSlot1(prev1 => {
      if (prev1 === null || prev1 === index) {
        setSelectedSlot2(prev2 => {
          if (prev2 === index) return null;
          return prev2;
        });
        return index;
      }
      return prev1;
    });
  }, []);

  const handleSelectComponent = useCallback((component: ComponentType) => {
    setSelectedComponent(prev => (prev === component ? null : component));
  }, []);

  const statusArea = useMemo(() => {
    if (!state) return null;
    const activeNode = getNode(state);
    return (
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-stone-400">Node {state.currentNodeId}/9</span>
        {activeNode && (
          <span className="text-stone-300">{activeNode.name}</span>
        )}
        <span className="text-stone-500">Turn {state.currentTurn}</span>
        {error && <span className="text-rose-400">{error}</span>}
      </div>
    );
  }, [state, error]);

  if (!isInitialized || !state) {
    return <div className="p-4 text-stone-300">Loading Brewfield…</div>;
  }

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">Brewfield</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Turn-based potions-brewing roguelike. Element × Component combinations,
            a living Residue field, and a deck-based Element economy.
          </p>
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg"
          >
            Begin Descent
          </button>
        </div>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <h1 className={`text-4xl font-bold ${state.runWon ? 'text-emerald-400' : 'text-rose-500'}`}>
            {state.runWon ? 'Cauldron Cleansed' : 'Run Failed'}
          </h1>
          <div className="text-sm font-mono text-stone-400 space-y-1">
            <p>Enemies defeated: {state.stats.enemiesDefeated}</p>
            <p>Brews created: {state.stats.brewsCreated}</p>
            <p>Total damage: {state.stats.totalDamageDealt}</p>
          </div>
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameShell
      gameLabel="BREWFIELD"
      gameId="brewfield"
      phase="PHASE A"
      statusArea={statusArea}
      footer={
        <div className="text-xs text-stone-500 font-mono">
          Element × Component brewing with a living Residue field. Defeat all 9 nodes to cleanse the cauldron.
        </div>
      }
    >
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {/* Left column — persistent deck + objective */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">
              Persistent Pool ({state.deck.length})
            </h3>
            <div className="flex flex-wrap gap-1">
              {state.deck.map((el, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border"
                  style={{
                    color: ELEMENT_COLORS[el],
                    borderColor: `${ELEMENT_COLORS[el]}40`,
                    backgroundColor: `${ELEMENT_COLORS[el]}10`,
                  }}
                >
                  {el[0]}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">
              Objective
            </h3>
            {node?.type === 'fight' && (
              <p className="text-xs font-mono text-rose-400">
                ⚔️ Combat: Defeat {state.enemy?.name}.
              </p>
            )}
            {node?.type === 'forage' && (
              <p className="text-xs font-mono text-amber-400">
                🌾 Forage: Choose an ingredient.
              </p>
            )}
            {node?.type === 'rest' && (
              <p className="text-xs font-mono text-emerald-400">
                🔥 Rest: Heal or clone an element.
              </p>
            )}
          </div>

          <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">
              Piles
            </h3>
            <div className="text-xs font-mono text-stone-400 space-y-1">
              <div>Draw: {state.drawPile.length}</div>
              <div>Discard: {state.discardPile.length}</div>
              <div>Hand: {state.hand.length}</div>
            </div>
          </div>
        </div>

        {/* Center column — combat / forage / rest */}
        <div className="lg:col-span-2 space-y-4">
          {node?.type === 'fight' && state.enemy && (
            <>
              <EnemyReadout enemy={state.enemy} />

              {state.combatOutcome ? (
                <div className="border border-stone-800 bg-stone-900/80 rounded-lg p-6 text-center space-y-4">
                  {state.combatOutcome === 'victory' ? (
                    <>
                      <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
                      <h2 className="text-xl font-bold text-emerald-400">Chamber Purified!</h2>
                    </>
                  ) : (
                    <>
                      <Heart className="w-10 h-10 text-rose-500 mx-auto" />
                      <h2 className="text-xl font-bold text-rose-500">Cauldron Overheated</h2>
                    </>
                  )}
                  <button
                    onClick={handleAdvance}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg flex items-center gap-2 mx-auto"
                  >
                    {state.currentNodeId >= 9 ? 'View Summary' : 'Descend Deeper'} <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Cauldron */}
                  <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-4 space-y-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">
                      Cauldron
                    </h3>

                    <div className="flex items-center gap-3">
                      {[selectedSlot1, selectedSlot2].map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (idx === 0) setSelectedSlot1(null);
                            else setSelectedSlot2(null);
                          }}
                          className="w-14 h-14 rounded-lg border border-stone-700 bg-stone-950 flex items-center justify-center"
                        >
                          {slot !== null && state.hand[slot] ? (
                            getElementIcon(state.hand[slot])
                          ) : (
                            <span className="text-stone-600 text-xs">{idx + 1}</span>
                          )}
                        </button>
                      ))}
                      <span className="text-xs text-stone-500">← click slots to clear</span>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">
                        Component
                      </div>
                      <div className="flex gap-2">
                        {(['strike', 'ward', 'mend', 'blight'] as ComponentType[]).map(comp => {
                          const Icon = COMPONENT_ICONS[comp];
                          return (
                            <button
                              key={comp}
                              onClick={() => handleSelectComponent(comp)}
                              className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                                selectedComponent === comp
                                  ? 'bg-stone-800 border-stone-500'
                                  : 'border-stone-700 hover:border-stone-600'
                              }`}
                              style={{ color: COMPONENT_COLORS[comp] }}
                            >
                              <Icon size={14} />
                              {comp}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleBrew}
                      disabled={!selectedComponent || (selectedSlot1 === null && selectedSlot2 === null)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold rounded-lg"
                    >
                      Brew
                    </button>

                    {state.residues.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {state.residues.map((res, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-1 rounded border"
                            style={{
                              color: ELEMENT_COLORS[getElementForResidue(res.tag)],
                              borderColor: `${ELEMENT_COLORS[getElementForResidue(res.tag)]}40`,
                            }}
                          >
                            {res.tag} L{res.level}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hand */}
                  <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">
                      Hand ({state.hand.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {state.hand.map((el, idx) => {
                        const selected = selectedSlot1 === idx || selectedSlot2 === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectElement(idx)}
                            className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                              selected
                                ? 'bg-stone-800 border-stone-500'
                                : 'border-stone-700 hover:border-stone-600'
                            }`}
                            style={{ color: ELEMENT_COLORS[el] }}
                          >
                            {getElementIcon(el)} {el}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Player */}
                  <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">
                      Alchemist
                    </h3>
                    <PlayerReadout player={state.player} />
                  </div>
                </>
              )}
            </>
          )}

          {node?.type === 'forage' && state.forageOptions && (
            <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-6 text-center space-y-4">
              <h2 className="text-xl font-bold">Shattered Herbarium</h2>
              <p className="text-sm text-stone-400">Choose one ingredient to add to your persistent pool.</p>
              <div className="flex justify-center gap-3">
                {state.forageOptions.map((el, i) => (
                  <button
                    key={i}
                    onClick={() => handleForage(el)}
                    className="px-5 py-3 rounded-lg border border-stone-700 hover:border-stone-500 text-sm font-mono flex items-center gap-2"
                    style={{ color: ELEMENT_COLORS[el] }}
                  >
                    {getElementIcon(el)} {el}
                  </button>
                ))}
              </div>
            </div>
          )}

          {node?.type === 'rest' && (
            <div className="border border-stone-800 bg-stone-900/40 rounded-lg p-6 text-center space-y-4">
              <h2 className="text-xl font-bold">Rest Site</h2>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleRestHeal}
                  className="px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-stone-100 text-sm font-bold"
                >
                  Stoke Furnace (+12 HP)
                </button>
                <button
                  onClick={() => handleRestClone('fire')}
                  className="px-5 py-3 rounded-lg border border-stone-700 hover:border-stone-500 text-stone-300 text-sm font-mono"
                >
                  Clone Fire
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column — logbook */}
        <div className="lg:col-span-1 border border-stone-800 bg-stone-900/40 rounded-lg flex flex-col h-[500px]">
          <div className="p-3 border-b border-stone-800 flex items-center gap-2 text-stone-400 text-xs font-mono font-bold">
            <Scroll size={14} className="text-amber-500" />
            Alchemical Logbook
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px]">
            {state.gameLogs.length === 0 && (
              <div className="text-stone-600 italic text-center py-8">No entries yet.</div>
            )}
            {[...state.gameLogs].reverse().map((log, i) => {
              let color = 'text-stone-500';
              let label = 'SYS';
              if (log.sender === 'player') { color = 'text-amber-400'; label = 'ALC'; }
              if (log.sender === 'enemy') { color = 'text-rose-400'; label = 'FOE'; }
              if (log.sender === 'field') { color = 'text-cyan-400'; label = 'FLD'; }
              return (
                <div key={i} className="border-b border-stone-800 pb-1.5">
                  <div className="flex justify-between text-[8px] text-stone-600">
                    <span className={color}>[{label}]</span>
                    <span>T{log.turn}</span>
                  </div>
                  <p className="text-stone-300 leading-tight">{log.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GameShell>
  );
}

function getElementForResidue(tag: string): ElementType {
  const map: Record<string, ElementType> = {
    burning: 'fire',
    soaked: 'water',
    fortified: 'earth',
    windswept: 'air',
  };
  return map[tag] ?? 'fire';
}
