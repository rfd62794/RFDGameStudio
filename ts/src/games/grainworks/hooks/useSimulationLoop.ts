import { useEffect, RefObject, MutableRefObject } from 'react';
import {
  BuildingDef,
  BuildingInstance,
  MaterialType,
  PipeDirection,
  PipeRouteState,
  TilePos,
} from '../types';
import { CellularGrid } from '../simulation/grid';
import { BuildingManager, computeRoute, updatePipeFlowParticles } from '../simulation/buildings';
import { AsteroidManager } from '../simulation/asteroids';
import { GameRenderer, RenderOptions } from '../simulation/renderer';
import { ToolMode } from '../components/BuildPanel';

interface SimLoopParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  gridRef: MutableRefObject<CellularGrid>;
  buildingMgrRef: MutableRefObject<BuildingManager>;
  asteroidMgrRef: MutableRefObject<AsteroidManager>;
  rendererRef: MutableRefObject<GameRenderer>;
  pipeRouteStateRef: MutableRefObject<PipeRouteState>;
  simSpeed: number;
  currentTier: number;
  setCurrentTier: (tier: number) => void;
  setStoredCounts: (counts: Record<number, number>) => void;
  setStructuralSolidAvailable: (n: number) => void;
  hoverCell: { x: number; y: number } | null;
  toolMode: ToolMode;
  selectedDef: BuildingDef | null;
  selectedBuilding: BuildingInstance | null;
  pipeDirection: PipeDirection;
  brushMaterial: MaterialType;
  brushSize: number;
  zoom: number;
  pan: { x: number; y: number };
  structuralSolidAvailable: number;
  freeBuild: boolean;
  filterVersion: number;
}

// Main Simulation & Render Loop
export function useSimulationLoop(p: SimLoopParams) {
  const {
    canvasRef,
    gridRef,
    buildingMgrRef,
    asteroidMgrRef,
    rendererRef,
    pipeRouteStateRef,
    simSpeed,
    currentTier,
    setCurrentTier,
    setStoredCounts,
    setStructuralSolidAvailable,
    hoverCell,
    toolMode,
    selectedDef,
    selectedBuilding,
    pipeDirection,
    brushMaterial,
    brushSize,
    zoom,
    pan,
    structuralSolidAvailable,
    freeBuild,
    filterVersion,
  } = p;

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let statsAccumulator = 0;

    const tick = (currentTime: number) => {
      const dtMs = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;
      const dtSec = dtMs / 1000;

      const grid = gridRef.current;
      const bMgr = buildingMgrRef.current;
      const aMgr = asteroidMgrRef.current;
      const renderer = rendererRef.current;

      // Run simulation ticks based on speed multiplier
      if (simSpeed > 0) {
        for (let i = 0; i < simSpeed; i++) {
          grid.step();
          bMgr.step(grid, dtSec);
          aMgr.step(grid, dtSec);
        }
      }

      // Update Inventory stats & Tier Progression checks (~4 times per second)
      statsAccumulator += dtSec;
      if (statsAccumulator >= 0.25) {
        statsAccumulator = 0;

        const counts: Record<number, number> = {};
        for (let m = 0; m <= 11; m++) {
          counts[m] = bMgr.getMaterialTotalInContainers(m as MaterialType);
        }
        setStoredCounts(counts);

        // Update Structural Solid balance available for building
        const storedSolid = counts[MaterialType.STRUCTURAL_SOLID] || 0;
        setStructuralSolidAvailable(storedSolid + 30); // 30 reserve starting allowance

        // Check Tier progression unlocks
        if (currentTier === 1 && storedSolid >= 100) {
          setCurrentTier(2);
          aMgr.setTier(2);
        } else if (currentTier === 2 && (counts[MaterialType.VOID_CRYSTAL] || 0) >= 80) {
          setCurrentTier(3);
          aMgr.setTier(3);
        } else if (currentTier === 3 && (counts[MaterialType.LUMINITE] || 0) >= 20) {
          setCurrentTier(4);
          aMgr.setTier(4);
        }
      }

      // Update pipe flow particles (purely cosmetic rendering state)
      for (const pipe of bMgr.pipes.values()) {
        updatePipeFlowParticles(pipe, dtSec);
      }

      // Render to dynamic main Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const routeState = pipeRouteStateRef.current;
          let altRoute: TilePos[] | null = null;
          if (routeState.mode === 'drawing') {
            altRoute = computeRoute(
              routeState.startTile,
              routeState.currentTile,
              !routeState.horizontalFirst,
              bMgr
            );
          }

          const options: RenderOptions = {
            showZoneBoundary: true,
            showPipeArrows: true,
            showBuildingLabels: true,
            hoverCell,
            selectedDef: toolMode === 'BUILD' ? selectedDef : null,
            selectedBuildingId: selectedBuilding ? selectedBuilding.id.toString() : null,
            pipeDirection,
            brushMaterial: toolMode === 'PAINT' ? brushMaterial : null,
            brushSize,
            zoom,
            panX: pan.x,
            panY: pan.y,
            structuralSolidAvailable,
            freeBuild,
            pipeRouteState: routeState,
            alternateRoute: altRoute,
          };

          renderer.render(
            ctx,
            canvas.width,
            canvas.height,
            grid,
            bMgr,
            currentTime,
            options
          );
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    canvasRef,
    gridRef,
    buildingMgrRef,
    asteroidMgrRef,
    rendererRef,
    pipeRouteStateRef,
    simSpeed,
    currentTier,
    setCurrentTier,
    setStoredCounts,
    setStructuralSolidAvailable,
    toolMode,
    selectedDef,
    selectedBuilding,
    pipeDirection,
    brushMaterial,
    brushSize,
    hoverCell,
    zoom,
    pan,
    structuralSolidAvailable,
    freeBuild,
    filterVersion,
  ]);
}
