/**
 * SlimeWorld (God-Game) - Main Application
 * Phase: SectorZone Soil Upgrade Pass + Monument Construction (ADR 002 Engine)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AspectId,
  MONUMENT_BASE_FOCUS,
  ResourceLedger,
  SectorZone,
  SoilType,
  TileState,
  WorldState,
} from './types';
import {
  attempt_construct_monument,
  create_initial_world,
  resolve_tick,
  soil_upgrade_target,
} from './engine/slimeEngine';
import { SimulationHeader } from './components/SimulationHeader';
import { RingVisualizer } from './components/RingVisualizer';
import { InspectorPanel } from './components/InspectorPanel';
import { EventLog } from './components/EventLog';
import { TestRunnerModal } from './components/TestRunnerModal';

export default function App() {
  const [world, setWorld] = useState<WorldState>(() => create_initial_world());
  const [selectedTileIdx, setSelectedTileIdx] = useState<number>(0);
  const [selectedSectorId, setSelectedSectorId] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

  // Keep selected sector synced when tile selection changes
  const handleSelectTile = (idx: number) => {
    setSelectedTileIdx(idx);
    setSelectedSectorId(Math.floor(idx / 4));
  };

  const handleSelectSector = (id: number) => {
    setSelectedSectorId(id);
    setSelectedTileIdx(id * 4);
  };

  // Step Simulation
  const handleStepTick = (count: number = 1) => {
    setWorld((prev) => {
      let current = prev;
      for (let i = 0; i < count; i++) {
        current = resolve_tick(current);
      }
      return current;
    });
  };

  // Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(150, 1000 / speed);
    const interval = setInterval(() => {
      setWorld((prev) => resolve_tick(prev));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  // Construct Monument
  const handleConstructMonument = (sectorId: number) => {
    setWorld((prev) => {
      const sector = prev.sectors[sectorId];
      if (!sector) return prev;

      const newLedger = { ...prev.settlement_ledger };
      const newSector: SectorZone = {
        ...sector,
        tile_indices: [...sector.tile_indices] as [number, number, number, number],
        structure: { ...sector.structure },
      };

      const success = attempt_construct_monument(newSector, newLedger);
      if (!success) return prev;

      const newSectors = [...prev.sectors];
      newSectors[sectorId] = newSector;

      const newLogs = [
        {
          id: `log-mon-${prev.current_tick}-${Date.now()}`,
          tick: prev.current_tick,
          type: 'monument_built' as const,
          message: `🏛️ Constructed celestial Monument in Sector ${sectorId}! Imparts +${MONUMENT_BASE_FOCUS} Focus to planetary balance.`,
          sector_id: sectorId,
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        sectors: newSectors,
        settlement_ledger: newLedger,
        logs: newLogs,
      };
    });
  };

  // Infuse Element
  const handleInfuseElement = (tileIdx: number, elementIdx: number, delta: number) => {
    setWorld((prev) => {
      const newTiles = [...prev.tiles];
      const targetTile = newTiles[tileIdx];
      if (!targetTile) return prev;

      const newTiers = [...targetTile.tiers] as [number, number, number, number];
      newTiers[elementIdx] = Math.max(0, Math.min(10, newTiers[elementIdx] + delta));

      // Elemental perturbation resets stability
      newTiles[tileIdx] = {
        ...targetTile,
        tiers: newTiers,
        ticks_stable: 0,
      };

      return {
        ...prev,
        tiles: newTiles,
        logs: [
          {
            id: `log-inf-${Date.now()}`,
            tick: prev.current_tick,
            type: 'perturbation' as const,
            message: `Infused element delta on Tile ${tileIdx}. Stability reset to 0.`,
            tile_id: tileIdx,
          },
          ...prev.logs,
        ],
      };
    });
  };

  // Perturb Tile (Demonstrably resets ticks_stable to 0)
  const handlePerturbTile = (tileIdx: number) => {
    handleInfuseElement(tileIdx, 2, 1); // +1 Fire
  };

  // Bless Tile Stability (+5 ticks)
  const handleBlessTileStability = (tileIdx: number, ticks: number) => {
    setWorld((prev) => {
      const newTiles = [...prev.tiles];
      const targetTile = newTiles[tileIdx];
      if (!targetTile) return prev;

      newTiles[tileIdx] = {
        ...targetTile,
        ticks_stable: targetTile.ticks_stable + ticks,
      };

      return {
        ...prev,
        tiles: newTiles,
        logs: [
          {
            id: `log-bless-${Date.now()}`,
            tick: prev.current_tick,
            type: 'stability' as const,
            message: `Blessed Tile ${tileIdx} with +${ticks} stability ticks (now ${newTiles[tileIdx].ticks_stable}t).`,
            tile_id: tileIdx,
          },
          ...prev.logs,
        ],
      };
    });
  };

  // Change Sector Soil (e.g. Volcanic Rupture)
  const handleSetSectorSoil = (sectorId: number, soil: SoilType) => {
    setWorld((prev) => {
      const newSectors = [...prev.sectors];
      const sector = newSectors[sectorId];
      if (!sector) return prev;

      newSectors[sectorId] = {
        ...sector,
        soil_profile: soil,
      };

      return {
        ...prev,
        sectors: newSectors,
        logs: [
          {
            id: `log-soil-${Date.now()}`,
            tick: prev.current_tick,
            type: 'info' as const,
            message: `Sector ${sectorId} soil altered to ${soil}.`,
            sector_id: sectorId,
          },
          ...prev.logs,
        ],
      };
    });
  };

  const handleResetWorld = () => {
    setIsPlaying(false);
    setWorld(create_initial_world());
    setSelectedTileIdx(0);
    setSelectedSectorId(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation & Simulation HUD */}
      <SimulationHeader
        currentTick={world.current_tick}
        isPlaying={isPlaying}
        speed={speed}
        ledger={world.settlement_ledger}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepTick={handleStepTick}
        onSetSpeed={setSpeed}
        onResetWorld={handleResetWorld}
        onOpenTests={() => setIsTestModalOpen(true)}
      />

      {/* Main God-Game Canvas Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 32-Tile Ring Visualizer & Event Stream (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <RingVisualizer
            tiles={world.tiles}
            sectors={world.sectors}
            selectedTileIdx={selectedTileIdx}
            selectedSectorId={selectedSectorId}
            settlement={world.settlement}
            onSelectTile={handleSelectTile}
            onSelectSector={handleSelectSector}
          />

          <EventLog logs={world.logs} />
        </div>

        {/* Right Column: Sector & Tile Inspector + Divine Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <InspectorPanel
            selectedTileIdx={selectedTileIdx}
            selectedSectorId={selectedSectorId}
            tiles={world.tiles}
            sectors={world.sectors}
            settlementLedger={world.settlement_ledger}
            settlement={world.settlement}
            onConstructMonument={handleConstructMonument}
            onInfuseElement={handleInfuseElement}
            onPerturbTile={handlePerturbTile}
            onBlessTileStability={handleBlessTileStability}
            onSetSectorSoil={handleSetSectorSoil}
            onSelectTile={handleSelectTile}
          />
        </div>
      </main>

      {/* Verification & Test Suite Modal */}
      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}
