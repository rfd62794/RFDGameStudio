/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ElementType, 
  ComponentType, 
  ResidueStatus, 
  BrewResult, 
  EnemyState, 
  PlayerState, 
  RunNode, 
  GameLog, 
  RunStats 
} from './types';
import { 
  solveBrew, 
  updateResidueField, 
  generateRunNodes, 
  instantiateEnemy, 
  getEnemyIntent,
  getElementColor,
  getComponentColor
} from './gameLogic';
import IntroScreen from './components/IntroScreen';
import MapProgress from './components/MapProgress';
import EnemySection from './components/EnemySection';
import CauldronSection from './components/CauldronSection';
import PlayerSection from './components/PlayerSection';
import ForageNode from './components/ForageNode';
import RestNode from './components/RestNode';
import GameOverScreen from './components/GameOverScreen';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Scroll, ArrowRight, Heart, Shield, RefreshCw } from 'lucide-react';

const INITIAL_DECK: ElementType[] = [
  'fire', 'fire', 
  'water', 'water', 
  'earth', 'earth', 
  'air', 'air'
];

export default function App() {
  // Top-Level Screen State
  const [screen, setScreen] = useState<'intro' | 'run' | 'game_over'>('intro');
  const [runWon, setRunWon] = useState(false);

  // Persistent Run State
  const [nodes, setNodes] = useState<RunNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<number>(1);
  const [deck, setDeck] = useState<ElementType[]>(INITIAL_DECK);
  const [stats, setStats] = useState<RunStats>({
    enemiesDefeated: 0,
    totalDamageDealt: 0,
    totalShieldGained: 0,
    totalHealed: 0,
    brewsCreated: 0,
    volatileFails: 0,
    volatileSuccesses: 0
  });

  // Combat State
  const [player, setPlayer] = useState<PlayerState>({
    hp: 20,
    maxHp: 20,
    shield: 0,
    dodgeCharges: 0,
    retaliateCharges: 0,
    decayingShield: 0,
    burnDebuff: 0
  });
  const [enemy, setEnemy] = useState<EnemyState | null>(null);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [residues, setResidues] = useState<ResidueStatus[]>([]);
  const [drawPile, setDrawPile] = useState<ElementType[]>([]);
  const [hand, setHand] = useState<ElementType[]>([]);
  const [discardPile, setDiscardPile] = useState<ElementType[]>([]);
  
  // Cauldron Selection Slots (References indices in hand)
  const [elSlot1, setElSlot1] = useState<number | null>(null);
  const [elSlot2, setElSlot2] = useState<number | null>(null);
  const [activeComponent, setActiveComponent] = useState<ComponentType | null>(null);

  // Forage Options (3 random elements)
  const [forageOptions, setForageOptions] = useState<ElementType[]>([]);

  // Alchemical Game Logbook
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);

  // Soundless visual flash states
  const [isCombatTransitioning, setIsCombatTransitioning] = useState(false);
  const [combatOutcome, setCombatOutcome] = useState<'victory' | 'defeat' | null>(null);

  // Initialize nodes on mount
  useEffect(() => {
    setNodes(generateRunNodes());
  }, []);

  const addLog = (sender: 'player' | 'enemy' | 'field' | 'system', message: string) => {
    const newLog: GameLog = {
      id: Math.random().toString(),
      turn: currentTurn,
      sender,
      message
    };
    setGameLogs(prev => [newLog, ...prev]);
  };

  const handleStartGame = () => {
    setDeck(INITIAL_DECK);
    setNodes(generateRunNodes());
    setCurrentNodeId(1);
    setStats({
      enemiesDefeated: 0,
      totalDamageDealt: 0,
      totalShieldGained: 0,
      totalHealed: 0,
      brewsCreated: 0,
      volatileFails: 0,
      volatileSuccesses: 0
    });
    setScreen('run');
    initNode(1, INITIAL_DECK);
  };

  /**
   * Initializes state depending on the type of active Node (Fight, Forage, Rest).
   */
  const initNode = (nodeId: number, currentDeck: ElementType[]) => {
    const node = generateRunNodes().find(n => n.id === nodeId);
    if (!node) return;

    setElSlot1(null);
    setElSlot2(null);
    setActiveComponent(null);
    setCombatOutcome(null);

    if (node.type === 'fight' && node.enemyArchetype) {
      // 1. Initialize Player Fights
      setPlayer(prev => ({
        ...prev,
        shield: 0,
        dodgeCharges: 0,
        retaliateCharges: 0,
        decayingShield: 0,
        burnDebuff: 0
      }));
      
      const freshEnemy = instantiateEnemy(node.enemyArchetype, 1);
      setEnemy(freshEnemy);
      setCurrentTurn(1);
      setResidues([]);
      
      // Deck setup
      const shuffledDeck = [...currentDeck].sort(() => Math.random() - 0.5);
      const startingHand = shuffledDeck.slice(0, 5);
      const remainingDraw = shuffledDeck.slice(5);

      setHand(startingHand);
      setDrawPile(remainingDraw);
      setDiscardPile([]);
      
      setGameLogs([]);
      // Force initial render of logs
      const startLog: GameLog = {
        id: 'start',
        turn: 1,
        sender: 'system',
        message: `Entered ${node.name}. A hostile ${freshEnemy.name} Blocks your descent!`
      };
      setGameLogs([startLog]);
    } 
    
    else if (node.type === 'forage') {
      // 2. Setup 3 random ingredient choices
      const pool: ElementType[] = ['fire', 'water', 'earth', 'air'];
      const randomChoices = Array.from({ length: 3 }, () => pool[Math.floor(Math.random() * pool.length)]);
      setForageOptions(randomChoices);
    }
  };

  // Cauldron interactions
  const handleSelectElement = (cardIndex: number) => {
    if (elSlot1 === cardIndex) {
      setElSlot1(null);
    } else if (elSlot2 === cardIndex) {
      setElSlot2(null);
    } else {
      if (elSlot1 === null) {
        setElSlot1(cardIndex);
      } else if (elSlot2 === null) {
        setElSlot2(cardIndex);
      } else {
        // Swap slot 1 out
        setElSlot1(cardIndex);
      }
    }
  };

  const handleRemoveElement = (slot: 1 | 2) => {
    if (slot === 1) setElSlot1(null);
    if (slot === 2) setElSlot2(null);
  };

  const handleSelectComponent = (comp: ComponentType) => {
    setActiveComponent(comp === activeComponent ? null : comp);
  };

  const handleRemoveComponent = () => {
    setActiveComponent(null);
  };

  /**
   * Main game turn resolution engine. 
   * Triggers alchemical calculation, logs results, modifies combat states, and advances turns.
   */
  const handleBrew = () => {
    if (!enemy || !activeComponent) return;
    if (elSlot1 === null && elSlot2 === null) return;

    // 1. Gather selected elements
    const element1 = elSlot1 !== null ? hand[elSlot1] : null;
    const element2 = elSlot2 !== null ? hand[elSlot2] : null;

    // Solve brew metrics deterministic client-side
    const brew = solveBrew(element1, element2, activeComponent, currentTurn);

    // Track statistics
    setStats(prev => ({
      ...prev,
      brewsCreated: prev.brewsCreated + 1,
      totalDamageDealt: prev.totalDamageDealt + brew.damage,
      totalShieldGained: prev.totalShieldGained + brew.shield,
      totalHealed: prev.totalHealed + brew.heal,
      volatileSuccesses: prev.volatileSuccesses + (brew.combination === 'opposed' && brew.damage > 3 ? 1 : 0),
      volatileFails: prev.volatileFails + (brew.combination === 'opposed' && brew.damage <= 3 ? 1 : 0)
    }));

    // Update Player Stats
    let nextPlayerHp = Math.min(player.maxHp, player.hp + brew.heal);
    let nextPlayerShield = player.shield + brew.shield;
    let nextPlayerDodge = player.dodgeCharges + brew.dodgeGranted;
    let nextPlayerRetaliate = player.retaliateCharges + brew.retaliateDamage;
    let nextPlayerDecaying = player.decayingShield + brew.decayingShield;
    let nextPlayerBurn = brew.cauterize ? 0 : player.burnDebuff;

    // Apply Shield-Strip on Enemy if Water Blight is active
    let nextEnemyShield = brew.stripBuffs ? 0 : enemy.shield;

    // Apply Damage to Enemy HP / Shield
    let dmgToApply = brew.damage;
    if (nextEnemyShield > 0 && dmgToApply > 0) {
      if (nextEnemyShield >= dmgToApply) {
        nextEnemyShield -= dmgToApply;
        dmgToApply = 0;
      } else {
        dmgToApply -= nextEnemyShield;
        nextEnemyShield = 0;
      }
    }
    let nextEnemyHp = Math.max(0, enemy.hp - dmgToApply);

    // Apply Special Blight trigger: Air Blight forces active residue DoTs to tick immediately
    if (brew.ticksActiveDoTs && residues.length > 0) {
      const isWindswept = residues.some(r => r.tag === 'windswept');
      const factor = isWindswept ? 2 : 1;
      
      residues.forEach(res => {
        if (res.tag === 'burning') {
          const tickDmg = res.level * 2 * factor;
          if (nextEnemyShield >= tickDmg) {
            nextEnemyShield -= tickDmg;
          } else {
            nextEnemyHp = Math.max(0, nextEnemyHp - (tickDmg - nextEnemyShield));
            nextEnemyShield = 0;
          }
          addLog('field', `Air draft spread! Burning residue flared immediately, dealing ${tickDmg} DMG!`);
        }
      });
    }

    addLog('player', `Brewed: ${brew.name}. ${brew.description}`);

    // Update Residue Field (Opposed pair blocks residue placement)
    const isVolatile = brew.combination === 'opposed';
    const resultantElement = brew.primaryElement;
    const { updated: nextResidues, log: residueLog } = updateResidueField(
      residues, 
      resultantElement, 
      isVolatile
    );
    setResidues(nextResidues);
    if (residueLog) {
      addLog('field', residueLog);
    }

    // Check if Enemy is defeated
    if (nextEnemyHp <= 0) {
      setEnemy({
        ...enemy,
        hp: 0,
        shield: 0,
        intent: { action: 'special', value: 0, description: 'Purified' }
      });
      setCombatOutcome('victory');
      addLog('system', `Victory! Cleansed the ${enemy.name}.`);
      setStats(prev => ({ ...prev, enemiesDefeated: prev.enemiesDefeated + 1 }));
      return;
    }

    // --- ENEMY TURN SOLVER ---
    // If enemy survives, they resolve their telegraphed move!
    let enemyActionDesc = enemy.intent.description;
    let finalEnemyDmg = enemy.intent.value;

    let nextEnemyShieldPostAction = nextEnemyShield;
    let nextEnemyHpPostAction = nextEnemyHp;

    if (enemy.intent.action === 'attack' || enemy.intent.action === 'special') {
      // Check Evasion (Dodge charges)
      let dodged = false;
      if (nextPlayerDodge > 0) {
        const coinFlip = Math.random() < 0.5;
        if (coinFlip) {
          dodged = true;
          addLog('player', `Evasion Success! Dodged the entire attack cleanly.`);
        } else {
          addLog('player', `Evasion FAILED! The attack lands through the fog.`);
        }
        nextPlayerDodge = Math.max(0, nextPlayerDodge - 1);
      }

      if (!dodged && finalEnemyDmg > 0) {
        // Apply damage to Player Shield
        if (nextPlayerShield >= finalEnemyDmg) {
          nextPlayerShield -= finalEnemyDmg;
          addLog('enemy', `${enemy.name} used ${enemyActionDesc}: Fully blocked by your Ward shield.`);
        } else {
          const penetrativeDmg = finalEnemyDmg - nextPlayerShield;
          nextPlayerShield = 0;
          nextPlayerHp = Math.max(0, nextPlayerHp - penetrativeDmg);
          addLog('enemy', `${enemy.name} used ${enemyActionDesc}: Deals ${penetrativeDmg} DMG directly to your vital pool.`);
        }

        // Apply Retaliation Damage back (Fire Ward)
        if (nextPlayerRetaliate > 0) {
          nextEnemyHpPostAction = Math.max(0, nextEnemyHp - nextPlayerRetaliate);
          addLog('player', `Retaliatory flames rebound, dealing ${nextPlayerRetaliate} DMG back to ${enemy.name}!`);
          nextPlayerRetaliate = Math.max(0, nextPlayerRetaliate - 1);
        }

        // Apply Molten intent Burn debuff
        if (enemy.archetype === 'molten_ashling' && enemy.intent.description.includes('Burn')) {
          nextPlayerBurn += 1;
          addLog('enemy', `Molten embers cling to you: Applied 1 Burn debuff stack.`);
        }
      }
    } 
    
    else if (enemy.intent.action === 'defend') {
      nextEnemyShieldPostAction += enemy.intent.value;
      addLog('enemy', `${enemy.name} used ${enemyActionDesc}: Stacked defense shields.`);
    } 
    
    else if (enemy.intent.action === 'heal') {
      nextEnemyHpPostAction = Math.min(enemy.maxHp, nextEnemyHp + enemy.intent.value);
      addLog('enemy', `${enemy.name} used ${enemyActionDesc}: Re-bonded shattered stone cores.`);
    }

    // Check if player died during enemy turn
    if (nextPlayerHp <= 0) {
      setPlayer(prev => ({ ...prev, hp: 0 }));
      setCombatOutcome('defeat');
      addLog('system', `Your physical form dissolved... Run failed.`);
      return;
    }

    // --- TURN MAINTENANCE (START OF PLAYER'S NEXT TURN) ---
    const nextTurnNum = currentTurn + 1;
    
    // 1. Apply Residue Field damage/debuffs
    const isWindswept = nextResidues.some(r => r.tag === 'windswept');
    const factor = isWindswept ? 2 : 1;
    let soakAttackReduction = 0;

    nextResidues.forEach(res => {
      if (res.tag === 'burning') {
        const burnDmg = res.level * 2 * factor;
        if (nextEnemyShieldPostAction >= burnDmg) {
          nextEnemyShieldPostAction -= burnDmg;
        } else {
          nextEnemyHpPostAction = Math.max(0, nextEnemyHpPostAction - (burnDmg - nextEnemyShieldPostAction));
          nextEnemyShieldPostAction = 0;
        }
        addLog('field', `Residue Tick: Cauldron heat deals ${burnDmg} Burn DMG to ${enemy.name}!`);
      } 
      
      else if (res.tag === 'soaked') {
        soakAttackReduction = res.level * 1 * factor;
        addLog('field', `Residue Tick: Cold steam reduces ${enemy.name}'s next attack intents by -${soakAttackReduction} DMG.`);
      }
    });

    // Apply Player Burn debuff tick
    if (nextPlayerBurn > 0) {
      nextPlayerHp = Math.max(0, nextPlayerHp - nextPlayerBurn);
      addLog('system', `Toxic Burn: Taken ${nextPlayerBurn} DMG from clinging embers.`);
      if (nextPlayerHp <= 0) {
        setPlayer(prev => ({ ...prev, hp: 0 }));
        setCombatOutcome('defeat');
        return;
      }
    }

    // Check again if enemy died from residue tick
    if (nextEnemyHpPostAction <= 0) {
      setEnemy({
        ...enemy,
        hp: 0,
        shield: 0,
        intent: { action: 'special', value: 0, description: 'Purified' }
      });
      setCombatOutcome('victory');
      addLog('system', `Victory! Residue fields dissolved the ${enemy.name}.`);
      setStats(prev => ({ ...prev, enemiesDefeated: prev.enemiesDefeated + 1 }));
      return;
    }

    // 2. Decay standard shield, apply Earth decaying shield carryover
    let nextTurnShield = nextPlayerDecaying;
    if (nextTurnShield > 0) {
      addLog('player', `Earth core stability: carried over ${nextTurnShield} shield to next turn.`);
    }

    // 3. Decay active residues (Fortified Earth persists longest)
    const decayedResidues: ResidueStatus[] = nextResidues.map(res => {
      if (res.tag === 'fortified') {
        // Fortified decays only every second turn
        if (nextTurnNum % 2 === 0) {
          return { tag: res.tag, level: Math.max(0, res.level - 1) };
        }
        return res;
      }
      return { tag: res.tag, level: Math.max(0, res.level - 1) };
    }).filter(res => res.level > 0);

    // 4. Draw Next Hand (from drawPile, recycling discardPile if needed)
    // Consumed elements from hand: move to discard
    const consumedIndices = [elSlot1, elSlot2].filter((v): v is number => v !== null);
    
    // Create new discard pool containing ALL elements from hand
    const newDiscardList = [...discardPile, ...hand];
    
    // Shuffle discard back into draw pile if draw pile runs low
    let nextDrawPile = [...drawPile];
    let nextDiscardPile = newDiscardList;

    if (nextDrawPile.length < 5) {
      const shuffledDiscard = [...nextDiscardPile].sort(() => Math.random() - 0.5);
      nextDrawPile = [...nextDrawPile, ...shuffledDiscard];
      nextDiscardPile = [];
      addLog('system', `Shuffling discard pile back into the cauldron.`);
    }

    const nextHand = nextDrawPile.slice(0, 5);
    const finalDrawPile = nextDrawPile.slice(5);

    // 5. Compute Telegraphed Next Move for Enemy (Apply soak / weak debuffs)
    const rawIntent = getEnemyIntent(enemy.archetype, nextTurnNum);
    let finalIntentValue = rawIntent.value;

    if (rawIntent.action === 'attack' || rawIntent.action === 'special') {
      finalIntentValue = Math.max(0, rawIntent.value - soakAttackReduction - (brew.weaknessStacks));
    }

    const telegraphedIntent = {
      ...rawIntent,
      value: finalIntentValue,
      description: rawIntent.action === 'attack' 
        ? `${rawIntent.description.split('(')[0]} (${finalIntentValue} DMG)` 
        : rawIntent.description
    };

    // Update state bundles
    setPlayer({
      hp: nextPlayerHp,
      maxHp: player.maxHp,
      shield: nextTurnShield,
      dodgeCharges: nextPlayerDodge,
      retaliateCharges: nextPlayerRetaliate,
      decayingShield: 0,
      burnDebuff: nextPlayerBurn
    });

    setEnemy({
      ...enemy,
      hp: nextEnemyHpPostAction,
      shield: nextEnemyShieldPostAction,
      intent: telegraphedIntent
    });

    setResidues(decayedResidues);
    setHand(nextHand);
    setDrawPile(finalDrawPile);
    setDiscardPile(nextDiscardPile);
    setCurrentTurn(nextTurnNum);

    // Reset cauldron slots
    setElSlot1(null);
    setElSlot2(null);
    setActiveComponent(null);

    addLog('system', `Turn ${nextTurnNum} Begins. Draw hand refilled.`);
  };

  /**
   * Finishes fight nodes, advancing either to a Forage/Rest node or triggers ending.
   */
  const handleAdvanceDescent = () => {
    const nextId = currentNodeId + 1;
    if (nextId > 9) {
      // Completed last node (Boss)
      setRunWon(true);
      setScreen('game_over');
    } else {
      setCurrentNodeId(nextId);
      initNode(nextId, deck);
    }
  };

  /**
   * Forage choice picked - add to persistent run deck and descend.
   */
  const handleSelectForageIngredient = (element: ElementType) => {
    const updatedDeck = [...deck, element];
    setDeck(updatedDeck);
    
    const nextId = currentNodeId + 1;
    setCurrentNodeId(nextId);
    initNode(nextId, updatedDeck);
  };

  /**
   * Rest option 1 picked: Restore HP and advance.
   */
  const handleStokeFurnace = () => {
    const healAmount = 12;
    setPlayer(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healAmount),
      burnDebuff: 0 // fully purge poisons
    }));
    
    const nextId = currentNodeId + 1;
    setCurrentNodeId(nextId);
    initNode(nextId, deck);
  };

  /**
   * Rest option 2 picked: Clone card and advance.
   */
  const handleSynthesizeElement = (element: ElementType) => {
    const updatedDeck = [...deck, element];
    setDeck(updatedDeck);
    
    const nextId = currentNodeId + 1;
    setCurrentNodeId(nextId);
    initNode(nextId, updatedDeck);
  };

  const handleRestartGame = () => {
    setScreen('intro');
  };

  // Render Screens
  if (screen === 'intro') {
    return <IntroScreen onStartGame={handleStartGame} />;
  }

  if (screen === 'game_over') {
    return (
      <GameOverScreen 
        won={runWon} 
        stats={stats} 
        onRestart={handleRestartGame} 
      />
    );
  }

  const activeNode = nodes.find(n => n.id === currentNodeId);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-stone-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-stone-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* 1. Map Progress Top Bar */}
      <MapProgress nodes={nodes} currentNodeId={currentNodeId} />

      {/* 2. Primary Layout Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: Map quick summary / Player permanent stats deck count */}
        <div className="lg:col-span-1 bg-stone-900/40 border border-stone-900/60 p-4 rounded-xl flex flex-col gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold block mb-1">
              Persistent Pool ({deck.length} Elements)
            </span>
            <div className="flex flex-wrap gap-1.5 py-1">
              {deck.map((el, i) => (
                <span 
                  key={i} 
                  className="w-5 h-5 rounded-full text-[10px] font-bold font-mono flex items-center justify-center border uppercase select-none"
                  style={{ color: getElementColor(el), borderColor: `${getElementColor(el)}30`, backgroundColor: `${getElementColor(el)}10` }}
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
                ⚔️ Combat: Defeat the hostile {enemy?.name} to descend.
              </div>
            ) : activeNode?.type === 'forage' ? (
              <div className="text-xs font-mono text-amber-400">
                🌾 Exploration: Search the herbarium for compounds.
              </div>
            ) : (
              <div className="text-xs font-mono text-emerald-400">
                🔥 Camp:stoke furnace flames or clone an element.
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Central workspace */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeNode?.type === 'fight' && enemy && (
              <motion.div 
                key="combat"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                {/* Enemy Readout */}
                <EnemySection enemy={enemy} />

                {/* Main Cauldron Interaction */}
                {combatOutcome === null ? (
                  <>
                    <CauldronSection
                      element1={elSlot1 !== null ? hand[elSlot1] : null}
                      element2={elSlot2 !== null ? hand[elSlot2] : null}
                      component={activeComponent}
                      residues={residues}
                      onRemoveElement={handleRemoveElement}
                      onRemoveComponent={handleRemoveComponent}
                      onBrew={handleBrew}
                      currentTurn={currentTurn}
                    />

                    {/* Player controls */}
                    <PlayerSection
                      player={player}
                      hand={hand}
                      selectedElements={[elSlot1, elSlot2]}
                      activeComponent={activeComponent}
                      drawPileSize={drawPile.length}
                      discardPileSize={discardPile.length}
                      onSelectElement={handleSelectElement}
                      onSelectComponent={handleSelectComponent}
                    />
                  </>
                ) : (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-8 border border-stone-850 bg-stone-900 rounded-xl text-center shadow-xl flex flex-col items-center"
                    id="combat-victory-card"
                  >
                    {combatOutcome === 'victory' ? (
                      <>
                        <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-full border border-emerald-800/20 mb-4 animate-bounce">
                          <Sparkles className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold font-serif text-emerald-400 mb-1">
                          Chamber Purified!
                        </h2>
                        <p className="text-stone-400 text-xs font-mono max-w-sm mb-6">
                          The hazardous element clouds dissipate. The corridor is clear.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAdvanceDescent}
                          className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-sm tracking-widest rounded-xl border border-amber-400 flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                          id="btn-advance"
                        >
                          DESCEND DEEPER <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-rose-950/40 text-rose-500 rounded-full border border-rose-800/20 mb-4">
                          <Heart className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold font-serif text-rose-500 mb-1">
                          Cauldron Overheated
                        </h2>
                        <p className="text-stone-400 text-xs font-mono max-w-sm mb-6">
                          Your physical matrix dissolved inside the Cauldron Floors.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setScreen('game_over')}
                          className="px-8 py-3.5 bg-rose-800 hover:bg-rose-700 text-stone-100 font-extrabold text-sm tracking-widest rounded-xl border border-rose-600 cursor-pointer shadow-lg transition-all"
                          id="btn-game-over-direct"
                        >
                          VIEW SUMMARY STATE
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeNode?.type === 'forage' && (
              <motion.div 
                key="forage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <ForageNode 
                  options={forageOptions} 
                  onSelectIngredient={handleSelectForageIngredient} 
                />
              </motion.div>
            )}

            {activeNode?.type === 'rest' && (
              <motion.div 
                key="rest"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <RestNode
                  playerHp={player.hp}
                  playerMaxHp={player.maxHp}
                  deck={deck}
                  onStokeFurnace={handleStokeFurnace}
                  onSynthesizeElement={handleSynthesizeElement}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: The Scrolling Alchemical Logbook (Combats only) */}
        <div className="lg:col-span-1 flex flex-col h-[500px] lg:h-[650px] bg-stone-900/40 border border-stone-900/60 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-stone-900 bg-stone-950/60 flex items-center gap-1.5 text-stone-400 text-xs font-mono font-bold select-none">
            <Scroll className="w-4 h-4 text-amber-500" />
            Alchemical Logbook
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono text-[10px] leading-relaxed select-text scrollbar-thin">
            {activeNode?.type === 'fight' ? (
              gameLogs.length > 0 ? (
                gameLogs.map((log) => {
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
                    <div key={log.id} className="border-b border-stone-900 pb-2">
                      <div className="flex items-center justify-between mb-0.5 text-[8px] text-stone-500">
                        <span className={senderColor}>
                          [{senderLabel}]
                        </span>
                        <span>TURN {log.turn}</span>
                      </div>
                      <p className="text-stone-300">
                        {log.message}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-stone-600 italic text-center py-12">
                  No formula entries recorded yet.
                </div>
              )
            ) : (
              <div className="text-stone-500 italic text-center py-12 px-4 leading-normal">
                Exploratory phase active. The logbook remains quiet until the next cauldron guardian approaches.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
