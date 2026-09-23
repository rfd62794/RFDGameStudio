import { RunState, DeckCard, RunNode, FLOOR_CONFIG } from '../types';
import { getEnemyIntent } from '../logic/combat';
import { generateBalancedMap } from '../logic/mapGraph';
import { shuffle, drawHand, buildEmberCardPool } from '../logic/deck';
import { ENEMY_POOL, EnemyInstance } from '../logic/enemies';

export function createRun(deckCardIds: string[], seed: number, currentFloor: number = 1, startingEssenceBonus: number = 0): RunState {
  const config = FLOOR_CONFIG[currentFloor] || FLOOR_CONFIG[1];
  const playerMaxHp = 25;
  const { nodes, balance } = generateBalancedMap(seed, config.numLayers, playerMaxHp, currentFloor);

  const initialLogs = [
    `Floor ${currentFloor} Run Initiated with a ${deckCardIds.length}-card deck.`,
    `Map generation validated: ${balance.netDamage} HP net damage (band [${balance.band[0]}-${balance.band[1]}] HP, ${balance.attempts} attempt(s)).`
  ];
  if (startingEssenceBonus > 0) {
    initialLogs.push(`🏦 Consumed Banked Essence (+${startingEssenceBonus} ESS). Available status consumed for this fresh start.`);
  }

  return {
    currentNodeId: nodes[0].id,
    currentFloor,
    playerHp: 25,
    playerMaxHp: 25,
    playerShield: 0,
    essence: startingEssenceBonus, // start of run unspent essence
    status: 'not_started',
    enemy: null,
    turnCount: 1,
    logs: initialLogs,
    combinationCounts: {},
    stabilizedCores: [],
    seed,
    deckState: { drawPile: [], hand: [], discard: [] },
    deckCardIds,
    culture: 'ember',
    nodes,
    boons: [],
    relics: [],
    usedRelicIds: [],
    visitedNodeIds: [],
    startingBankedBonus: startingEssenceBonus,
    giftSkippedCount: 0,
    lastMapBalance: balance
  };
}

export function enterActiveNode(runState: RunState, deckCardIds: string[]): RunState {
  const currentNode = runState.nodes.find(n => n.id === runState.currentNodeId);
  if (!currentNode) return runState;

  if (currentNode.type === 'fight' || currentNode.type === 'boss') {
    const enemyName = currentNode.enemyName || 'Unknown Threat';
    const enemyHp = currentNode.enemyHp || 15;
    const enemyTier = currentNode.enemyTier || (currentNode.type === 'boss' ? 'master' : 'basic');

    const cardsPool = buildEmberCardPool();
    const cards: DeckCard[] = [];
    deckCardIds.forEach((cardId, index) => {
      const cardInfo = cardsPool.find(c => c.id === cardId);
      if (cardInfo) {
        cards.push({
          id: `card_${index}_${Date.now()}_${Math.random()}`,
          cardId: cardInfo.id,
          name: cardInfo.name,
          el1: cardInfo.el1,
          el2: cardInfo.el2,
          component: cardInfo.component,
          relationType: cardInfo.relationType,
        });
      }
    });

    const shuffledDeck = shuffle(cards);
    const initialDeckState = drawHand({
      drawPile: shuffledDeck,
      hand: [],
      discard: []
    }, 5);

    const enemyDef = ENEMY_POOL.find(e => e.name === enemyName || enemyName.includes(e.name)) as EnemyInstance | undefined;

    return {
      ...runState,
      status: 'combat',
      playerShield: 0,
      enemy: {
        name: enemyName,
        hp: enemyHp,
        maxHp: enemyHp,
        dot: null,
        intent: getEnemyIntent(enemyName, 1),
        tier: enemyTier,
        secondaryType: enemyDef?.secondaryType,
        vulnerable: enemyDef?.vulnerable,
        resistant: enemyDef?.resistant,
        behaviorPattern: enemyDef?.behaviorPattern,
        behaviorTypeIds: enemyDef?.behaviorTypeIds,
      },
      turnCount: 1,
      deckState: initialDeckState,
      logs: [
        ...runState.logs,
        `----------------------------------------`,
        `Entering Node ${runState.currentNodeId}: Fight against ${enemyName}. Fresh ${cards.length}-card deck shuffled.`,
        `The enemy prepares: ${getEnemyIntent(enemyName, 1).description}.`
      ]
    };
  } else if (currentNode.type === 'restCraft') {
    return {
      ...runState,
      status: 'rest_craft',
      enemy: null,
      logs: [
        ...runState.logs,
        `----------------------------------------`,
        `Entering Node ${runState.currentNodeId}: Rest & Craft Stop.`
      ]
    };
  } else if (currentNode.type === 'treasure') {
    return {
      ...runState,
      status: 'treasure',
      enemy: null,
      logs: [
        ...runState.logs,
        `----------------------------------------`,
        `Entering Node ${runState.currentNodeId}: Treasure Stop.`
      ]
    };
  } else if (currentNode.type === 'store') {
    return {
      ...runState,
      status: 'store',
      enemy: null,
      logs: [
        ...runState.logs,
        `----------------------------------------`,
        `Entering Node ${runState.currentNodeId}: Store Room.`
      ]
    };
  } else if (currentNode.type === 'anomaly') {
    return {
      ...runState,
      status: 'anomaly',
      enemy: null,
      logs: [
        ...runState.logs,
        `----------------------------------------`,
        `Entering Node ${runState.currentNodeId}: Void Anomaly encounter.`
      ]
    };
  }

  return runState;
}

export function advanceNode(runState: RunState): RunState {
  const currentNode = runState.nodes.find(n => n.id === runState.currentNodeId);
  const visitedNodeIds = runState.visitedNodeIds || [];
  
  const nextVisited = visitedNodeIds.includes(runState.currentNodeId)
    ? visitedNodeIds
    : [...visitedNodeIds, runState.currentNodeId];

  if (currentNode && currentNode.type === 'boss') {
    // Reached past the last node -> Run Won!
    return {
      ...runState,
      status: 'victory',
      visitedNodeIds: nextVisited,
      logs: [
        ...runState.logs,
        `✨ STABILITY ACHIEVED! You completed all nodes of the Dissonance sequence.`
      ]
    };
  }

  return {
    ...runState,
    status: 'not_started', // Goes back to Map Phase to select next node
    visitedNodeIds: nextVisited,
    enemy: null,
    logs: [
      ...runState.logs,
      `Completed Node ${runState.currentNodeId}. Standing on navigation hub to select next branch.`
    ]
  };
}

export function selectBranch(runState: RunState, targetNodeId: string): RunState {
  return {
    ...runState,
    currentNodeId: targetNodeId,
    status: 'not_started',
    logs: [
      ...runState.logs,
      `Traveled to connected node ${targetNodeId}.`
    ]
  };
}

export function commitRunResults(runState: RunState, claimedRewards: string[]): { newlyUnlocked: string[], essenceGained: number } {
  if (runState.status === 'victory') {
    return {
      newlyUnlocked: claimedRewards,
      essenceGained: runState.essence
    };
  }
  return {
    newlyUnlocked: [],
    essenceGained: 0
  };
}
