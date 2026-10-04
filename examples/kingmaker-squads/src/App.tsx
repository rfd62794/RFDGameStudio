/**
 * KingMaker Squads - Main Application Phase Router
 */

import React, { useState, useEffect } from 'react';
import { GameState, UnitState, DefenseForce } from './types';
import { createUnit } from './data/archetypes';
import { generateProceduralCity } from './utils/cityGeneration/cityGenerator';
import { HeaderBar } from './components/HeaderBar';
import { CoronationBanner } from './components/CoronationBanner';
import { BrokenForceBanner } from './components/BrokenForceBanner';
import { RelocationProposalBanner } from './components/RelocationProposalBanner';
import { ShopPhaseLayout } from './screens/ShopPhaseLayout';
import { MapPhaseLayout } from './screens/MapPhaseLayout';
import { PlacementView } from './components/PlacementView';
import { VictoryScreen } from './screens/VictoryScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { CombatPlaybackModal } from './components/CombatPlaybackModal';
import { CodexModal } from './components/CodexModal';
import { soundFx } from './utils/audio';
import { useShopActions } from './hooks/useShopActions';
import { useTurnPhaseActions } from './hooks/useTurnPhaseActions';
import { recalculateCellExposures, evaluateDefenseForceLifecycle } from './utils/crownLogic';
import { useCombatResolution } from './hooks/useCombatResolution';

import { OpeningSequence } from './screens/OpeningSequence';
import { NewGameScreen } from './screens/NewGameScreen';
import { DEFAULT_TURN_ORDER } from './data/factions';

const STORAGE_KEY = 'kingmaker_squads_save_v2';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = createInitialGameState();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validTurnOrder =
          Array.isArray(parsed.turnOrder) &&
          parsed.turnOrder.length === DEFAULT_TURN_ORDER.length &&
          parsed.turnOrder.every((id: string) => DEFAULT_TURN_ORDER.includes(id as any))
            ? parsed.turnOrder
            : initial.turnOrder;
        return {
          ...initial,
          ...parsed,
          declaredActions: parsed.declaredActions || [],
          turnOrder: validTurnOrder,
          units: parsed.units || initial.units,
          cells: parsed.cells || initial.cells,
          battleLogs: parsed.battleLogs || [],
        };
      } catch (e) {
        console.error('Failed to parse saved game', e);
      }
    }
    return initial;
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showNewGameScreen, setShowNewGameScreen] = useState(true);
  const [showOpeningSequence, setShowOpeningSequence] = useState(false);

  const hasSaveData = typeof window !== 'undefined' && !!localStorage.getItem(STORAGE_KEY);

  const handleStartNewCampaign = () => {
    const freshState = createInitialGameState();
    setGameState(freshState);
    setShowNewGameScreen(false);
    setShowOpeningSequence(true);
  };

  const handleContinueCampaign = () => {
    setShowNewGameScreen(false);
    setShowOpeningSequence(false);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  function createInitialGameState(): GameState {
    const rawCells = generateProceduralCity();
    const marshOutline = rawCells.marshOutline || [];
    const emberCells = rawCells.filter((c) => c.houseId === 'ember' || c.owner === 'player');
    const computedCells = recalculateCellExposures(emberCells);

    const capitalCell = computedCells.find((c) => c.owner === 'player' && (c.type === 'capital' || c.id === 'cell_capital')) || computedCells[0];
    const hovelLeader = capitalCell.autoGenLeaderUnit || createUnit('rook', 'The Hovel Warden', 'veteran');

    const hovelForce: DefenseForce = {
      id: `df_${capitalCell.id}`,
      cellId: capitalCell.id,
      name: `${capitalCell.name} Garrison`,
      units: [hovelLeader],
      autoGenLeaderId: hovelLeader.id,
      stewardUnitId: null,
      kingUnitId: hovelLeader.id,
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const initialUnits: UnitState[] = [
      createUnit('knight', 'Sir Cassian', 'recruit'),
      createUnit('pawn', 'Grim Pawn I', 'recruit'),
      createUnit('rook', 'Aethelgard Bastion', 'veteran'),
      createUnit('bishop', 'Alden', 'recruit'),
    ];

    // Forward Vanguard Squad
    initialUnits[0].squadSlot = 0;
    initialUnits[0].squadId = 'forward';

    initialUnits[1].squadSlot = 1;
    initialUnits[1].squadId = 'forward';

    // Reserve Bench (available for Steward assignment or Vanguard expansion)
    initialUnits[2].squadSlot = null;
    initialUnits[2].squadId = null;

    initialUnits[3].squadSlot = null;
    initialUnits[3].squadId = null;

    const benchUnits = initialUnits.filter(
      (u) => (u.squadSlot === null || u.squadSlot === undefined) && (!u.squadId || u.squadId === 'bench')
    );
    const initialLifecycle = evaluateDefenseForceLifecycle(computedCells, [hovelForce], benchUnits);

    return {
      turn: 1,
      gold: 12,
      shopLevel: 1,
      shopUpgradeCost: 10,
      rerollCost: 2,
      maxSquadSize: 3,
      units: initialUnits,
      shopPool: [
        createUnit('pawn'),
        createUnit('knight'),
        createUnit('bishop'),
        createUnit('pawn'),
      ],
      cells: computedCells,
      kingUnitId: hovelLeader.id,
      commanderUnitId: initialUnits[0].id,
      kingSettlingTurns: 0,
      hasEscortAssigned: false,
      battleLogs: [],
      selectedCellId: computedCells[1]?.id || 'cell_east_plains',
      gamePhase: 'shop',
      combatResult: null,
      activeCombatCellId: null,
      declaredActions: [],
      turnOrder: DEFAULT_TURN_ORDER,
      reinforcementPenaltyGold: 2,
      defenseForces: initialLifecycle.updatedDefenseForces,
      squadOutflowThisTurn: {},
      proposedDefenseRelocation: initialLifecycle.proposal,
      lastCoronationEvent: null,
      marshOutline,
    };
  }

  const handleEngageBattle = (cellId: string) => {
    const targetCell = gameState.cells.find((c) => c.id === cellId);
    if (!targetCell) return;

    const squadUnits = gameState.units.filter((u) => u.squadSlot !== null && u.squadSlot !== undefined);
    if (squadUnits.length === 0) return;

    setGameState((prev) => ({
      ...prev,
      gamePhase: 'placement',
      activeCombatCellId: cellId,
    }));
  };

  const shopActions = useShopActions(gameState, setGameState);
  const turnPhaseActions = useTurnPhaseActions(gameState, setGameState, handleEngageBattle);
  const { handleCloseCombat } = useCombatResolution(gameState, setGameState);

  const playerTerritories = (gameState.cells || []).filter((c) => c.owner === 'player').length;
  const territoryPercent = gameState.cells?.length ? Math.round((playerTerritories / gameState.cells.length) * 100) : 0;
  const allPlayerUnits = [
    ...(gameState.units || []),
    ...(gameState.defenseForces || []).flatMap((df) => df.units || []),
  ];
  const kingUnit = allPlayerUnits.find((u) => u.id === gameState.kingUnitId) || null;
  const hasEscort = allPlayerUnits.some((u) => u.archetype === 'knight' && u.isEscort && u.squadSlot !== null);
  const squadUnits = (gameState.units || []).filter((u) => u.squadSlot !== null && u.squadSlot !== undefined);

  if (showNewGameScreen) {
    return (
      <NewGameScreen
        hasSaveData={hasSaveData}
        onNewGame={handleStartNewCampaign}
        onContinue={handleContinueCampaign}
      />
    );
  }

  if (showOpeningSequence) {
    return (
      <OpeningSequence
        startingUnits={gameState.units}
        cells={gameState.cells}
        onComplete={() => setShowOpeningSequence(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      <HeaderBar
        turn={gameState.turn}
        gold={gameState.gold}
        territoryPercent={territoryPercent}
        kingUnit={kingUnit}
        kingSettlingTurns={gameState.kingSettlingTurns}
        hasEscort={hasEscort}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(soundFx.toggleMute())}
        onOpenCodex={() => setShowCodex(true)}
        onRestartGame={() => setShowNewGameScreen(true)}
      />

      <CoronationBanner
        event={gameState.lastCoronationEvent}
        onDismiss={() => setGameState((prev) => ({ ...prev, lastCoronationEvent: null }))}
      />

      <BrokenForceBanner
        event={gameState.lastBrokenForceEvent}
        onDismiss={() => setGameState((prev) => ({ ...prev, lastBrokenForceEvent: null }))}
      />

      <RelocationProposalBanner
        proposal={gameState.proposedDefenseRelocation}
        onAccept={turnPhaseActions.handleAcceptRelocationProposal}
        onReject={turnPhaseActions.handleRejectRelocationProposal}
      />

      <main className="flex-1 py-4">
        {gameState.gamePhase === 'shop' && (
          <ShopPhaseLayout
            gold={gameState.gold}
            shopLevel={gameState.shopLevel}
            shopUpgradeCost={gameState.shopUpgradeCost}
            rerollCost={gameState.rerollCost}
            maxSquadSize={gameState.maxSquadSize}
            units={gameState.units}
            shopPool={gameState.shopPool}
            kingUnitId={gameState.kingUnitId}
            defenseForces={gameState.defenseForces}
            squadOutflowThisTurn={gameState.squadOutflowThisTurn}
            cells={gameState.cells}
            onBuyUnit={shopActions.handleBuyUnit}
            onSellUnit={shopActions.handleSellUnit}
            onRerollShop={shopActions.handleRerollShop}
            onUpgradeShop={shopActions.handleUpgradeShop}
            onToggleSquadSlot={shopActions.handleToggleSquadSlot}
            onToggleEscort={shopActions.handleToggleEscort}
            onTransferUnit={shopActions.handleTransferUnit}
            onAssignSteward={shopActions.handleAssignSteward}
            onRecallSteward={shopActions.handleRecallSteward}
            onProceedToMap={() => setGameState((prev) => ({ ...prev, gamePhase: 'pre_turn_declaration' }))}
          />
        )}

        {(gameState.gamePhase === 'map' ||
          gameState.gamePhase === 'pre_turn_declaration' ||
          gameState.gamePhase === 'pre_turn_response') && (
          <MapPhaseLayout
            gamePhase={gameState.gamePhase}
            cells={gameState.cells}
            selectedCellId={gameState.selectedCellId}
            gold={gameState.gold}
            squadUnits={squadUnits}
            kingUnit={kingUnit}
            kingSettlingTurns={gameState.kingSettlingTurns}
            declaredActions={gameState.declaredActions}
            turnOrder={gameState.turnOrder}
            reinforcementPenaltyGold={gameState.reinforcementPenaltyGold}
            defenseForces={gameState.defenseForces}
            marshOutline={gameState.marshOutline}
            onSelectCell={(cellId) => setGameState((prev) => ({ ...prev, selectedCellId: cellId }))}
            onScoutCell={turnPhaseActions.handleScoutCell}
            onEngageBattle={handleEngageBattle}
            onDeclareAction={turnPhaseActions.handleDeclareAction}
            onRespondAction={turnPhaseActions.handleRespondAction}
            onProceedToResponsePhase={turnPhaseActions.handleProceedToResponsePhase}
            onProceedToCombat={turnPhaseActions.handleProceedToCombat}
            onBackToShop={() => setGameState((prev) => ({ ...prev, gamePhase: 'shop' }))}
          />
        )}

        {gameState.gamePhase === 'placement' && gameState.activeCombatCellId && (
          <PlacementView
            playerUnits={squadUnits}
            enemyUnits={
              gameState.cells.find((c) => c.id === gameState.activeCombatCellId)?.enemyUnits || [
                createUnit('pawn', 'District Guard I'),
                createUnit('pawn', 'District Guard II'),
              ]
            }
            cellName={gameState.cells.find((c) => c.id === gameState.activeCombatCellId)?.name || 'Contested Cell'}
            onConfirmPlacement={turnPhaseActions.handleConfirmPlacementAndStartCombat}
            onCancel={() => setGameState((prev) => ({ ...prev, gamePhase: 'map' }))}
          />
        )}

        {gameState.gamePhase === 'victory' && (
          <VictoryScreen onRestart={() => setGameState(createInitialGameState())} />
        )}

        {gameState.gamePhase === 'game_over' && (
          <GameOverScreen onRestart={() => setGameState(createInitialGameState())} />
        )}
      </main>

      {gameState.gamePhase === 'combat' && gameState.combatResult && gameState.activeCombatCellId && (
        <CombatPlaybackModal
          result={gameState.combatResult}
          cellName={gameState.cells.find((c) => c.id === gameState.activeCombatCellId)?.name || 'Contested Cell'}
          onClose={handleCloseCombat}
        />
      )}

      {showCodex && <CodexModal onClose={() => setShowCodex(false)} />}
    </div>
  );
}
