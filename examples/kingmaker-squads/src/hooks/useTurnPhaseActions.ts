import React from 'react';
import { DeclaredAction, DefenseForce, FactionId, GameState, TerritoryCell, UnitState } from '../types';
import { generateAIDeclaration, generateAIResponse } from '../utils/aiOpponent';
import { soundFx } from '../utils/audio';
import { createUnit } from '../data/archetypes';
import { simulateCombat } from '../utils/combatEngine';
import { recalculateCellExposures, evaluateDefenseForceLifecycle } from '../utils/crownLogic';
import { processDefenseForceLoyalty } from '../utils/loyaltyLogic';

export function useTurnPhaseActions(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  handleEngageBattle: (cellId: string) => void
) {
  // Scout Cell
  const handleScoutCell = (cellId: string) => {
    if (gameState.gold < 1) return;
    soundFx.playSpellChime();

    const updatedCells = gameState.cells.map((c) => {
      if (c.id === cellId) {
        return { ...c, scouted: true };
      }
      return c;
    });

    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - 1,
      cells: updatedCells,
    }));
  };

  // Player Declaration
  const handleDeclareAction = (targetCellId: string, intent: 'attack' | 'reinforce') => {
    const squadUnits = gameState.units.filter((u) => u.squadSlot !== null && u.squadSlot !== undefined);
    const newDecl: DeclaredAction = {
      id: `decl_player_${Date.now()}`,
      factionId: 'player',
      actionIntent: intent,
      targetCellId,
      assignedUnits: squadUnits,
      isResponse: false,
    };

    soundFx.playSpellChime();

    setGameState((prev) => ({
      ...prev,
      declaredActions: [...prev.declaredActions.filter((a) => a.factionId !== 'player'), newDecl],
    }));
  };

  // Transition to Response Phase with AI Declarations
  const handleProceedToResponsePhase = () => {
    const aiFactions: FactionId[] = gameState.turnOrder.filter((f) => f !== 'player');
    const newAIDeclarations: DeclaredAction[] = [];

    // First recalculate cell exposures
    const updatedCells = recalculateCellExposures(gameState.cells);

    // Filter reserve bench units for auto-formation (excluding king units)
    const benchUnits = gameState.units.filter(
      (u) => !u.isKing && (u.squadSlot === null || u.squadSlot === undefined) && (!u.squadId || u.squadId === 'bench')
    );

    // Evaluate defense force proposals and auto-formation
    const lifecycleResult = evaluateDefenseForceLifecycle(updatedCells, gameState.defenseForces || [], benchUnits);

    const remainingUnits = gameState.units.filter(
      (u) => !(lifecycleResult.usedUnitIds || []).includes(u.id)
    );

    aiFactions.forEach((factionId) => {
      const aiDecl = generateAIDeclaration(factionId, updatedCells);
      if (aiDecl) newAIDeclarations.push(aiDecl);
    });

    const allDeclarations = [...gameState.declaredActions, ...newAIDeclarations];

    // Evaluate Loyalty erosion and Force breaking under threat
    const loyaltyResult = processDefenseForceLoyalty(
      lifecycleResult.updatedDefenseForces,
      updatedCells,
      allDeclarations
    );

    const firstBroken = loyaltyResult.brokenForces.length > 0 ? loyaltyResult.brokenForces[0] : null;

    soundFx.playWarHorn();

    setGameState((prev) => ({
      ...prev,
      cells: loyaltyResult.updatedCells,
      gamePhase: 'pre_turn_response',
      declaredActions: allDeclarations,
      proposedDefenseRelocation: lifecycleResult.proposal,
      defenseForces: loyaltyResult.updatedDefenseForces,
      units: remainingUnits,
      lastBrokenForceEvent: firstBroken
        ? {
            forceName: firstBroken.forceName,
            cellName: firstBroken.cellName,
            occupyingFaction: firstBroken.occupyingFaction,
          }
        : prev.lastBrokenForceEvent,
    }));
  };

  // Player Response in Response Window
  const handleRespondAction = (targetCellId: string) => {
    if (gameState.gold < gameState.reinforcementPenaltyGold) return;

    soundFx.playBuy();

    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - prev.reinforcementPenaltyGold,
    }));
  };

  // Proceed to Combat Resolution
  const handleProceedToCombat = () => {
    const aiFactions: FactionId[] = gameState.turnOrder.filter((f) => f !== 'player');
    const newAIResponses: DeclaredAction[] = [];

    aiFactions.forEach((factionId) => {
      const resp = generateAIResponse(factionId, gameState.declaredActions, gameState.cells);
      if (resp) newAIResponses.push(resp);
    });

    // Determine target cell for combat (player's declared attack or selected cell)
    const playerDecl = gameState.declaredActions.find((a) => a.factionId === 'player' && a.actionIntent === 'attack');
    const targetCellId = playerDecl ? playerDecl.targetCellId : gameState.selectedCellId || gameState.cells[0].id;

    handleEngageBattle(targetCellId);
  };

  // Accept suggested defense relocation proposal
  // Note: relocation MUST NEVER trigger settling/coronation!
  const handleAcceptRelocationProposal = () => {
    const prop = gameState.proposedDefenseRelocation;
    if (!prop) return;

    const updatedDefenseForces = (gameState.defenseForces || []).map((df) => {
      if (df.id === prop.fromDefenseForceId) {
        return {
          ...df,
          cellId: prop.toCellId,
          loyalty: 100, // Relocation reinforces the position and restores loyalty!
        };
      }
      return df;
    });

    const updatedCells = gameState.cells.map((c) => {
      if (c.id === prop.toCellId) {
        return { ...c, assignedDefenseForceId: prop.fromDefenseForceId };
      }
      return c;
    });

    soundFx.playBuy();

    // Explicit Guard: King state and kingSettlingTurns remain UNCHANGED
    setGameState((prev) => ({
      ...prev,
      defenseForces: updatedDefenseForces,
      cells: updatedCells,
      proposedDefenseRelocation: null,
    }));
  };

  // Reject suggested defense relocation proposal
  const handleRejectRelocationProposal = () => {
    setGameState((prev) => {
      if (!prev.proposedDefenseRelocation) {
        return { ...prev, proposedDefenseRelocation: null };
      }
      const gapCellId = prev.proposedDefenseRelocation.toCellId;
      const gapCell = prev.cells.find((c) => c.id === gapCellId);
      if (!gapCell) {
        return { ...prev, proposedDefenseRelocation: null };
      }
      const benchUnits = prev.units.filter(
        (u) => !u.isKing && (u.squadSlot === null || u.squadSlot === undefined) && (!u.squadId || u.squadId === 'bench')
      );
      // Force the auto-formation path for exactly this one cell, bypassing
      // the single-gap relocation-proposal branch (the proposal was already
      // rejected -- do not re-propose, form a garrison directly this time).
      const fallback = evaluateDefenseForceLifecycle(
        [gapCell],
        [],
        benchUnits
      );
      const remainingUnits = prev.units.filter((u) => !(fallback.usedUnitIds || []).includes(u.id));
      return {
        ...prev,
        proposedDefenseRelocation: null,
        defenseForces: [...prev.defenseForces, ...fallback.updatedDefenseForces],
        units: remainingUnits,
      };
    });
  };

  // Called from PlacementView after player confirms tactical formation
  const handleConfirmPlacementAndStartCombat = (placements: { unit: UnitState; position: { x: number; y: number } }[]) => {
    const activeCell = gameState.cells.find((c) => c.id === gameState.activeCombatCellId);
    if (!activeCell) return;

    const squadUnits = placements.map((p) => p.unit);
    const enemySquad = activeCell.enemyUnits || [
      createUnit('pawn', 'Garrison Pawn I'),
      createUnit('pawn', 'Garrison Pawn II'),
    ];

    const result = simulateCombat(squadUnits, enemySquad, activeCell.hasKing);

    setGameState((prev) => ({
      ...prev,
      gamePhase: 'combat',
      combatResult: result,
    }));
  };

  return {
    handleScoutCell,
    handleDeclareAction,
    handleProceedToResponsePhase,
    handleRespondAction,
    handleProceedToCombat,
    handleAcceptRelocationProposal,
    handleRejectRelocationProposal,
    handleConfirmPlacementAndStartCombat,
  };
}
