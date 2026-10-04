import React from 'react';
import { GameState, UnitState, UnitArchetype } from '../types';
import { createUnit } from '../data/archetypes';
import { soundFx } from '../utils/audio';
import { enforceCoronation } from '../utils/crownLogic';

export function generateShopPool(count: number = 4): UnitState[] {
  const archetypes: UnitArchetype[] = ['pawn', 'pawn', 'knight', 'bishop', 'rook', 'queen'];
  const pool: UnitState[] = [];
  for (let i = 0; i < count; i++) {
    const randType = archetypes[Math.floor(Math.random() * archetypes.length)];
    pool.push(createUnit(randType));
  }
  return pool;
}

export function useShopActions(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  // Buy Unit
  const handleBuyUnit = (unit: UnitState) => {
    if (gameState.gold < unit.cost) return;

    soundFx.playBuy();

    const squadCount = gameState.units.filter((u) => u.squadSlot !== null && u.squadSlot !== undefined).length;
    const isSquadAvailable = squadCount < gameState.maxSquadSize;

    const boughtUnit: UnitState = {
      ...unit,
      squadSlot: isSquadAvailable ? squadCount : null,
      squadId: isSquadAvailable ? 'forward' : null,
      isKing: false,
    };

    const newUnits = [...gameState.units, boughtUnit];
    const newPool = gameState.shopPool.filter((u) => u.id !== unit.id);

    // Coronation runs only on Capital roster (bench / non-forward units)
    const capitalUnits = newUnits.filter((u) => u.squadId !== 'forward' && (u.squadSlot === null || u.squadSlot === undefined));
    const coronationRes = enforceCoronation(capitalUnits, gameState.kingSettlingTurns);

    const finalUnits = newUnits.map((u) => {
      const match = coronationRes.updatedUnits.find((c) => c.id === u.id);
      return match || u;
    });

    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - unit.cost,
      units: finalUnits,
      kingUnitId: coronationRes.newKingId || prev.kingUnitId,
      shopPool: newPool,
    }));
  };

  // Sell Unit
  const handleSellUnit = (unitId: string) => {
    let unit = gameState.units.find((u) => u.id === unitId);
    let sourceDfId: string | null = null;

    if (!unit) {
      for (const df of gameState.defenseForces || []) {
        const found = df.units.find((u) => u.id === unitId);
        if (found) {
          unit = found;
          sourceDfId = df.id;
          break;
        }
      }
    }

    if (!unit || unit.isPermanent || unit.isKing) return;

    soundFx.playReroll();

    if (sourceDfId) {
      const updatedDefenseForces = (gameState.defenseForces || []).map((df) => {
        if (df.id === sourceDfId) {
          return {
            ...df,
            units: df.units.filter((u) => u.id !== unitId),
          };
        }
        return df;
      });

      setGameState((prev) => ({
        ...prev,
        gold: prev.gold + 1,
        defenseForces: updatedDefenseForces,
      }));
    } else {
      const newUnits = gameState.units.filter((u) => u.id !== unitId);
      const capitalUnits = newUnits.filter((u) => u.squadId !== 'forward' && (u.squadSlot === null || u.squadSlot === undefined));
      const coronationRes = enforceCoronation(capitalUnits, gameState.kingSettlingTurns, 'Former King sold; throne reclaimed.');

      const finalUnits = newUnits.map((u) => {
        const match = coronationRes.updatedUnits.find((c) => c.id === u.id);
        return match || u;
      });

      setGameState((prev) => ({
        ...prev,
        gold: prev.gold + 1,
        units: finalUnits,
        kingUnitId: coronationRes.newKingId,
      }));
    }
  };

  // Reroll Shop
  const handleRerollShop = () => {
    if (gameState.gold < gameState.rerollCost) return;
    soundFx.playReroll();
    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - prev.rerollCost,
      shopPool: generateShopPool(4),
    }));
  };

  // Upgrade Shop / Squad Capacity
  const handleUpgradeShop = () => {
    if (gameState.gold < gameState.shopUpgradeCost || gameState.maxSquadSize >= 6) return;
    soundFx.playBuy();
    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - prev.shopUpgradeCost,
      maxSquadSize: prev.maxSquadSize + 1,
      shopLevel: prev.shopLevel + 1,
      shopUpgradeCost: prev.shopUpgradeCost + 8,
    }));
  };

  // Toggle Squad Slot
  const handleToggleSquadSlot = (unitId: string) => {
    // Check if unit is in a Defense Force
    const sourceDf = (gameState.defenseForces || []).find((df) => df.units.some((u) => u.id === unitId));

    if (sourceDf) {
      const unitToMove = sourceDf.units.find((u) => u.id === unitId)!;
      const isWasKing = unitToMove.isKing || unitId === sourceDf.kingUnitId;
      const movedUnit: UnitState = { ...unitToMove, squadId: null, squadSlot: null, isKing: false };

      const remainingUnits = sourceDf.units.filter((u) => u.id !== unitId);
      let finalDfUnits = remainingUnits;
      let newKingId = sourceDf.kingUnitId;

      if (isWasKing && remainingUnits.length > 0) {
        const coronationRes = enforceCoronation(
          remainingUnits,
          sourceDf.settlingTurnsLeft,
          `King ${unitToMove.name} benched. Successor crowned for ${sourceDf.name}.`
        );
        finalDfUnits = coronationRes.updatedUnits;
        newKingId = coronationRes.newKingId || '';
      } else if (isWasKing) {
        newKingId = '';
      }

      const updatedDefenseForces = gameState.defenseForces.map((df) => {
        if (df.id === sourceDf.id) {
          return { ...df, units: finalDfUnits, kingUnitId: newKingId };
        }
        return df;
      });

      setGameState((prev) => ({
        ...prev,
        units: [...prev.units, movedUnit],
        defenseForces: updatedDefenseForces,
      }));
      return;
    }

    const squadUnits = gameState.units.filter((u) => u.squadSlot !== null && u.squadSlot !== undefined);
    const targetUnit = gameState.units.find((u) => u.id === unitId);
    if (!targetUnit) return;

    const isBenching = targetUnit.squadSlot !== null && targetUnit.squadSlot !== undefined;
    const isWasKing = targetUnit.isKing || targetUnit.id === gameState.kingUnitId;

    let updated = gameState.units.map((u) => {
      if (u.id === unitId) {
        if (isBenching) {
          return { ...u, squadSlot: null, isEscort: false, isKing: false };
        } else {
          if (squadUnits.length < gameState.maxSquadSize) {
            return { ...u, squadSlot: squadUnits.length, squadId: 'forward' };
          }
        }
      }
      return u;
    });

    if (isBenching && isWasKing) {
      const activeMainUnits = updated.filter((u) => u.squadSlot !== null && u.squadSlot !== undefined);
      if (activeMainUnits.length > 0) {
        const coronationRes = enforceCoronation(
          activeMainUnits,
          gameState.kingSettlingTurns,
          `Capital King ${targetUnit.name} benched. Successor crowned.`
        );
        updated = updated.map((u) => {
          const crowned = coronationRes.updatedUnits.find((cu) => cu.id === u.id);
          return crowned || u;
        });
      }
    }

    setGameState((prev) => ({ ...prev, units: updated }));
  };

  // Toggle Knight Escort
  const handleToggleEscort = (unitId: string) => {
    const mainMatch = gameState.units.some((u) => u.id === unitId);

    if (mainMatch) {
      const updated = gameState.units.map((u) => {
        if (u.id === unitId && u.archetype === 'knight') {
          return { ...u, isEscort: !u.isEscort };
        }
        return u;
      });
      setGameState((prev) => ({ ...prev, units: updated }));
    } else {
      const updatedDefenseForces = (gameState.defenseForces || []).map((df) => ({
        ...df,
        units: df.units.map((u) => (u.id === unitId && u.archetype === 'knight' ? { ...u, isEscort: !u.isEscort } : u)),
      }));
      setGameState((prev) => ({ ...prev, defenseForces: updatedDefenseForces }));
    }
  };

  // Transfer Unit with 1-unit outflow cap per squad per turn
  const handleTransferUnit = (unitId: string, targetSquadId: string | null): boolean => {
    let unit: UnitState | null = gameState.units.find((u) => u.id === unitId) || null;
    let sourceSquadId = 'bench';

    if (unit) {
      sourceSquadId = unit.squadId || (unit.squadSlot !== null && unit.squadSlot !== undefined ? 'forward' : 'bench');
    } else {
      for (const df of gameState.defenseForces || []) {
        const found = df.units.find((u) => u.id === unitId);
        if (found) {
          unit = found;
          sourceSquadId = df.id;
          break;
        }
      }
    }

    if (!unit) return false;

    // If unit is leaving a real squad, check 1-unit outflow cap
    if (sourceSquadId !== 'bench' && sourceSquadId !== targetSquadId) {
      const outflow = gameState.squadOutflowThisTurn[sourceSquadId] || 0;
      if (outflow >= 1) {
        return false; // Transfer capped: squad already lost 1 unit this turn!
      }
    }

    // Check target squad capacity (Max Squad Size applies to ALL squads!)
    if (targetSquadId !== null && targetSquadId !== 'bench' && sourceSquadId !== targetSquadId) {
      if (targetSquadId === 'forward') {
        const currentForwardCount = gameState.units.filter(
          (u) => u.squadSlot !== null && u.squadSlot !== undefined && u.id !== unitId
        ).length;
        if (currentForwardCount >= gameState.maxSquadSize) {
          return false; // Target squad is full!
        }
      } else {
        const targetDf = (gameState.defenseForces || []).find((df) => df.id === targetSquadId);
        if (targetDf) {
          const currentDfCount = targetDf.units.filter((u) => u.id !== unitId).length;
          if (currentDfCount >= gameState.maxSquadSize) {
            return false; // Target squad is full!
          }
        }
      }
    }

    const movedUnit: UnitState = {
      ...unit,
      squadId: targetSquadId === 'forward' ? 'forward' : targetSquadId && targetSquadId !== 'bench' ? targetSquadId : null,
      squadSlot: targetSquadId === 'forward' ? gameState.units.filter((u) => u.squadSlot !== null).length : null,
      isKing: false,
    };

    // Remove unit from original location and handle succession if a King is transferred to bench
    const isBenching = targetSquadId === 'bench' || targetSquadId === null;
    const isWasKing = unit.isKing || unit.id === gameState.kingUnitId;

    let newMainUnits = gameState.units.filter((u) => u.id !== unitId);
    let newDefenseForces = (gameState.defenseForces || []).map((df) => ({
      ...df,
      units: df.units.filter((u) => u.id !== unitId),
    }));

    if (isBenching && isWasKing && sourceSquadId !== 'bench') {
      if (sourceSquadId !== 'forward') {
        const sourceDf = (gameState.defenseForces || []).find((df) => df.id === sourceSquadId);
        if (sourceDf) {
          const remainingDfUnits = sourceDf.units.filter((u) => u.id !== unitId);
          if (remainingDfUnits.length > 0) {
            const coronationRes = enforceCoronation(
              remainingDfUnits,
              sourceDf.settlingTurnsLeft,
              `King ${unit.name} benched. Successor crowned for ${sourceDf.name}.`
            );
            newDefenseForces = newDefenseForces.map((df) => {
              if (df.id === sourceSquadId) {
                return { ...df, units: coronationRes.updatedUnits, kingUnitId: coronationRes.newKingId || '' };
              }
              return df;
            });
          }
        }
      } else {
        const activeMainUnits = newMainUnits.filter((u) => u.squadSlot !== null && u.squadSlot !== undefined);
        if (activeMainUnits.length > 0) {
          const coronationRes = enforceCoronation(
            activeMainUnits,
            gameState.kingSettlingTurns,
            `Capital King ${unit.name} benched. Successor crowned.`
          );
          newMainUnits = newMainUnits.map((u) => {
            const crowned = coronationRes.updatedUnits.find((cu) => cu.id === u.id);
            return crowned || u;
          });
        }
      }
    }

    // Add unit to target location
    if (targetSquadId === 'forward' || targetSquadId === 'bench' || targetSquadId === null) {
      newMainUnits.push(movedUnit);
    } else {
      newDefenseForces = newDefenseForces.map((df) => {
        if (df.id === targetSquadId) {
          return {
            ...df,
            stewardUnitId: movedUnit.id,
            units: [...df.units.filter((u) => u.id !== movedUnit.id), movedUnit],
            loyalty: 100, // Reinforcement restores Loyalty!
          };
        }
        return df;
      });
    }

    const newOutflow = {
      ...gameState.squadOutflowThisTurn,
      ...(sourceSquadId !== 'bench' && sourceSquadId !== targetSquadId
        ? { [sourceSquadId]: (gameState.squadOutflowThisTurn[sourceSquadId] || 0) + 1 }
        : {}),
    };

    setGameState((prev) => ({
      ...prev,
      units: newMainUnits,
      defenseForces: newDefenseForces,
      squadOutflowThisTurn: newOutflow,
    }));

    return true;
  };

  const handleAssignSteward = (unitId: string, dfId: string) => {
    const unit = gameState.units.find((u) => u.id === unitId);
    if (!unit) return;

    const newUnits = gameState.units.filter((u) => u.id !== unitId);
    const updatedDFs = (gameState.defenseForces || []).map((df) => {
      if (df.id === dfId) {
        const existingUnitsWithoutUnit = df.units.filter((u) => u.id !== unitId);
        return {
          ...df,
          stewardUnitId: unit.id,
          units: [...existingUnitsWithoutUnit, { ...unit, squadId: dfId, squadSlot: null }],
          loyalty: 100,
        };
      }
      return df;
    });

    setGameState((prev) => ({
      ...prev,
      units: newUnits,
      defenseForces: updatedDFs,
    }));
  };

  const handleRecallSteward = (dfId: string) => {
    const df = (gameState.defenseForces || []).find((d) => d.id === dfId);
    if (!df || !df.stewardUnitId) return;

    const stewardUnit = df.units.find((u) => u.id === df.stewardUnitId);
    const remainingUnits = df.units.filter((u) => u.id !== df.stewardUnitId);

    const updatedDFs = (gameState.defenseForces || []).map((d) => {
      if (d.id === dfId) {
        return {
          ...d,
          stewardUnitId: null,
          units: remainingUnits,
        };
      }
      return d;
    });

    const newRoster = stewardUnit
      ? [...gameState.units, { ...stewardUnit, squadId: null, squadSlot: null }]
      : gameState.units;

    setGameState((prev) => ({
      ...prev,
      units: newRoster,
      defenseForces: updatedDFs,
    }));
  };

  return {
    handleBuyUnit,
    handleSellUnit,
    handleRerollShop,
    handleUpgradeShop,
    handleToggleSquadSlot,
    handleToggleEscort,
    handleTransferUnit,
    handleAssignSteward,
    handleRecallSteward,
  };
}
