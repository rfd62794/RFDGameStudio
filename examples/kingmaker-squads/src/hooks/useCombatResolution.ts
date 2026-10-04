import React from 'react';
import { DefenseForce, FactionId, GameState, UnitState } from '../types';
import { enforceAICoronation, rotateTurnOrder } from '../utils/aiOpponent';
import { soundFx } from '../utils/audio';
import { generateShopPool } from './useShopActions';
import { enforceCoronation, recalculateCellExposures } from '../utils/crownLogic';

export function useCombatResolution(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  const handleCloseCombat = (
    playerSurvivors: UnitState[],
    dethronedUnit?: UnitState
  ) => {
    const activeCell = gameState.cells.find((c) => c.id === gameState.activeCombatCellId);
    if (!activeCell || !gameState.combatResult) return;

    const isWinner = gameState.combatResult.winner === 'player';

    // Process rank progression for survivors
    const updatedPlayerUnits = gameState.units.map((u) => {
      const survivorMatch = playerSurvivors.find((s) => s.id === u.id);
      if (survivorMatch) {
        let newRank = u.rank;
        let newIsPermanent = u.isPermanent;

        if (survivorMatch.survivalFights >= 7 && u.rank !== 'elite') {
          newRank = 'elite';
          newIsPermanent = true;
          soundFx.playCoronationHorn();
        } else if (survivorMatch.survivalFights >= 3 && u.rank === 'recruit') {
          newRank = 'veteran';
          newIsPermanent = true;
          soundFx.playBuy();
        }

        return {
          ...survivorMatch,
          rank: newRank,
          isPermanent: newIsPermanent,
        };
      }

      if (dethronedUnit && u.id === dethronedUnit.id) {
        return dethronedUnit;
      }

      return u;
    });

    const casualties = gameState.combatResult.playerCasualties;
    const casualtyIds = casualties.map((c) => c.id);

    let finalUnits = updatedPlayerUnits.filter((u) => !casualtyIds.includes(u.id));

    // Mandatory Coronation enforcement for Capital roster (non-forward units)
    const capitalUnits = finalUnits.filter((u) => u.squadId !== 'forward' && (u.squadSlot === null || u.squadSlot === undefined));
    const coronationRes = enforceCoronation(capitalUnits, gameState.kingSettlingTurns, 'Former King defeated in battle.');

    finalUnits = finalUnits.map((u) => {
      const match = coronationRes.updatedUnits.find((c) => c.id === u.id);
      return match || u;
    });

    // Update Defense Forces if defense force was fighting in this cell
    let updatedDefenseForces = (gameState.defenseForces || []).map((df) => {
      if (df.cellId === activeCell.id) {
        if (!isWinner) {
          return null; // Defense force defeated
        }
        // Update survivors in defense force
        const forceSurvivors = df.units.filter((u) => !casualtyIds.includes(u.id));
        const forceCoronationRes = enforceCoronation(forceSurvivors, df.settlingTurnsLeft || 0, 'Defense Force King fallen.');
        return {
          ...df,
          units: forceCoronationRes.updatedUnits,
          kingUnitId: forceCoronationRes.newKingId,
        };
      }
      return df;
    }).filter((df): df is typeof gameState.defenseForces[number] => df !== null);

    const isFirstTimeReclaim = isWinner && !activeCell.assignedDefenseForceId;

    if (isFirstTimeReclaim && activeCell.autoGenLeaderUnit) {
      const newForce: DefenseForce = {
        id: `df_${activeCell.id}`,
        cellId: activeCell.id,
        name: `${activeCell.name} Garrison`,
        units: [activeCell.autoGenLeaderUnit],
        autoGenLeaderId: activeCell.autoGenLeaderId,
        kingUnitId: null,
        settlingTurnsLeft: 0,
        loyalty: 55,
      };
      updatedDefenseForces.push(newForce);
    }

    // Update Territory Ownership
    let updatedCells = gameState.cells.map((cell) => {
      if (cell.id === activeCell.id) {
        return {
          ...cell,
          owner: isWinner ? ('player' as FactionId) : cell.owner,
          troopCount: isWinner ? playerSurvivors.length : cell.troopCount,
          scouted: true,
          enemyUnits: isWinner ? [] : cell.enemyUnits,
          assignedDefenseForceId: isFirstTimeReclaim ? `df_${activeCell.id}` : cell.assignedDefenseForceId,
          publicOpinion: isFirstTimeReclaim ? 55 : cell.publicOpinion,
        };
      }
      return cell;
    });

    // Enforce coronation for AI factions
    updatedCells = enforceAICoronation(updatedCells);
    updatedCells = recalculateCellExposures(updatedCells);

    // Rotate turn order for next round
    const nextTurnOrder = rotateTurnOrder(gameState.turnOrder);

    // Income calculation
    const playerTerritoriesCount = updatedCells.filter((c) => c.owner === 'player').length;
    const goldIncome = 5 + playerTerritoriesCount * 2;

    // Check Victory or Game Over
    // Game Over is ONLY triggered if player loses Capital / has no Capital King left & no units to crown
    const capitalCell = updatedCells.find((c) => c.type === 'capital');
    const capitalLost = capitalCell ? capitalCell.owner !== 'player' : false;
    const allConquered = updatedCells.every((c) => c.owner === 'player');
    const capitalKingDeadAndUnreplaceable = coronationRes.newKingId === null;
    const playerDefeated = capitalLost || (finalUnits.length === 0 && capitalKingDeadAndUnreplaceable);

    let nextPhase: 'shop' | 'pre_turn_declaration' | 'pre_turn_response' | 'map' | 'victory' | 'game_over' = 'shop';
    if (allConquered) nextPhase = 'victory';
    else if (playerDefeated) nextPhase = 'game_over';

    setGameState((prev) => ({
      ...prev,
      turn: prev.turn + 1,
      gold: prev.gold + goldIncome,
      units: finalUnits,
      cells: updatedCells,
      defenseForces: updatedDefenseForces,
      shopPool: generateShopPool(4),
      kingUnitId: coronationRes.newKingId || prev.kingUnitId,
      kingSettlingTurns: Math.max(0, prev.kingSettlingTurns - 1),
      lastCoronationEvent: coronationRes.coronationEvent,
      gamePhase: nextPhase,
      combatResult: null,
      activeCombatCellId: null,
      declaredActions: [],
      turnOrder: nextTurnOrder,
      squadOutflowThisTurn: {},
    }));
  };

  return { handleCloseCombat };
}
