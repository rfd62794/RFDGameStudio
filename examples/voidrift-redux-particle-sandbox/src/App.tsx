import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BuildingCategory,
  BuildingDef,
  BuildingInstance,
  ContainerType,
  MaterialType,
  MATERIAL_DEFS,
  PipeDirection,
  PipeRouteState,
  ProcessorType,
  RECONSTRUCTION_ENTITIES,
  ReconstructionEntity,
  TilePos,
} from './types';
import { CellularGrid, GRID_HEIGHT, GRID_WIDTH, ASTEROID_ZONE_HEIGHT } from './simulation/grid';
import {
  BuildingManager,
  computeRoute,
  computeSegmentDirection,
  TILES_X,
  TILES_Y,
  updatePipeFlowParticles,
} from './simulation/buildings';
import { AsteroidManager } from './simulation/asteroids';
import { GameRenderer, RenderOptions } from './simulation/renderer';
import { BUILDING_DEFS, BUILDING_TILE } from './simulation/buildingDefs';
import { Header } from './components/Header';
import { BuildPanel, ToolMode } from './components/BuildPanel';
import { FilterPopup } from './components/FilterPopup';
import { ReconstructionCatalog } from './components/ReconstructionCatalog';
import { InspectPanel } from './components/InspectPanel';
import { HelpModal } from './components/HelpModal';
import { ZoomIn, ZoomOut, Maximize2, Sparkles, Award, Hammer } from 'lucide-react';

export default function App() {
  // Canvas Container & Simulation Engine Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<CellularGrid>(new CellularGrid());
  const buildingMgrRef = useRef<BuildingManager>(new BuildingManager());
  const asteroidMgrRef = useRef<AsteroidManager>(new AsteroidManager());
  const rendererRef = useRef<GameRenderer>(new GameRenderer());

  // Simulation State
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [currentTier, setCurrentTier] = useState<number>(1);
  const [storedCounts, setStoredCounts] = useState<Record<number, number>>({});
  const [asteroidEnabled, setAsteroidEnabled] = useState<boolean>(true);
  const [structuralSolidAvailable, setStructuralSolidAvailable] = useState<number>(30); // 30 reserve starting allowance
  const [freeBuild, setFreeBuild] = useState<boolean>(false);

  // Tools & Selection
  const [toolMode, setToolMode] = useState<ToolMode>('BUILD');
  const [selectedDef, setSelectedDef] = useState<BuildingDef | null>(
    BUILDING_DEFS.find((b) => b.id === 'collector_dust') || null
  );
  const [pipeDirection, setPipeDirection] = useState<PipeDirection>('DOWN');
  const [brushMaterial, setBrushMaterial] = useState<MaterialType>(MaterialType.DUST);
  const [brushSize, setBrushSize] = useState<number>(2);

  // Material Filter Popup State
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInstance | null>(null);
  const [filterPopupPos, setFilterPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [filterVersion, setFilterVersion] = useState<number>(0);

  // Hover and Viewport Transform (Pan & Zoom)
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState<number>(3.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);
  const isPaintingRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pipeRouteStateRef = useRef<PipeRouteState>({ mode: 'idle' });

  // Tier 4 View Toggle
  const [tier4View, setTier4View] = useState<'BUILD' | 'RECONSTRUCTION'>('BUILD');

  // Tier 4 Reconstruction State
  const [reconstructionEntities, setReconstructionEntities] = useState<ReconstructionEntity[]>(
    RECONSTRUCTION_ENTITIES
  );
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Pan clamping helper: guarantees at least 20% of grid remains visible on screen
  const clampPan = useCallback(
    (px: number, py: number, currentZoom: number, cWidth: number, cHeight: number) => {
      const gridW = GRID_WIDTH * currentZoom;
      const gridH = GRID_HEIGHT * currentZoom;
      const minX = -gridW * 0.8;
      const maxX = cWidth - gridW * 0.2;
      const minY = -gridH * 0.8;
      const maxY = cHeight - gridH * 0.2;
      return {
        x: Math.max(minX, Math.min(maxX, px)),
        y: Math.max(minY, Math.min(maxY, py)),
      };
    },
    []
  );

  // Dynamic canvas resizing: fills container dynamically on load and window resize
  const updateCanvasDimensions = useCallback(
    (centerGrid: boolean = false) => {
      if (!containerRef.current || !canvasRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      if (width <= 0 || height <= 0) return;

      canvasRef.current.width = width;
      canvasRef.current.height = height;

      // Default cell render size calculation based on available viewport
      const defaultCellSize = Math.max(
        1,
        Math.min(
          Math.floor(width / GRID_WIDTH),
          Math.floor(height / GRID_HEIGHT)
        )
      );

      if (centerGrid) {
        const initialZoom = defaultCellSize;
        const initialPanX = Math.round((width - GRID_WIDTH * initialZoom) / 2);
        const initialPanY = Math.round((height - GRID_HEIGHT * initialZoom) / 2);
        setZoom(initialZoom);
        setPan({ x: initialPanX, y: initialPanY });
      }
    },
    []
  );

  // Initial setup: Place sample starter factory on tile grid & center view dynamically
  useEffect(() => {
    const grid = gridRef.current;
    const bMgr = buildingMgrRef.current;

    // Starter setup: Collector -> Pipe -> Compressor -> Solid Bin
    // Collector: 2x2 at tile (19, 4) -> spans CA (152..168, 32..48)
    const collectorDef = BUILDING_DEFS.find((b) => b.id === 'collector_dust')!;
    bMgr.placeBuilding(grid, collectorDef, 19, 4);

    // Pipes connecting downward
    const pipeDef = BUILDING_DEFS.find((b) => b.id === 'pipe')!;
    bMgr.placeBuilding(grid, pipeDef, 19, 6, 'DOWN');
    bMgr.placeBuilding(grid, pipeDef, 19, 7, 'DOWN');

    // Compressor: 3x3 at tile (19, 8)
    const compressorDef = BUILDING_DEFS.find((b) => b.id === 'processor_compressor')!;
    bMgr.placeBuilding(grid, compressorDef, 19, 8);

    // Pipes from compressor to solid container
    bMgr.placeBuilding(grid, pipeDef, 19, 11, 'DOWN');
    bMgr.placeBuilding(grid, pipeDef, 19, 12, 'DOWN');

    // Solid Bin: 2x3 at tile (19, 13)
    const solidBinDef = BUILDING_DEFS.find((b) => b.id === 'container_solid')!;
    bMgr.placeBuilding(grid, solidBinDef, 19, 13);

    // Perform initial dynamic sizing and viewport centering
    updateCanvasDimensions(true);

    const handleResize = () => {
      updateCanvasDimensions(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasDimensions]);

  // Sync Tier goals & progress
  const getTierGoal = useCallback(() => {
    if (currentTier === 1) {
      return {
        targetMat: MaterialType.STRUCTURAL_SOLID,
        goal: 100,
        current: storedCounts[MaterialType.STRUCTURAL_SOLID] || 0,
        title: 'Accumulate 100 Structural Solid in Solid Bins',
      };
    }
    if (currentTier === 2) {
      return {
        targetMat: MaterialType.VOID_CRYSTAL,
        goal: 80,
        current: storedCounts[MaterialType.VOID_CRYSTAL] || 0,
        title: 'Accumulate 80 Void Crystals in Solid Bins',
      };
    }
    if (currentTier === 3) {
      return {
        targetMat: MaterialType.LUMINITE,
        goal: 20,
        current: storedCounts[MaterialType.LUMINITE] || 0,
        title: 'Accumulate 20 Luminite in Solid Bins',
      };
    }
    return {
      targetMat: MaterialType.LUMINITE,
      goal: 20,
      current: 20,
      title: 'Tier 4: Reconstruction Active',
    };
  }, [currentTier, storedCounts]);

  // Main Simulation & Render Loop
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
    simSpeed,
    currentTier,
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

  // Step 1 Tick (when paused)
  const handleStepSim = () => {
    const grid = gridRef.current;
    const bMgr = buildingMgrRef.current;
    const aMgr = asteroidMgrRef.current;
    grid.step();
    bMgr.step(grid, 1 / 60);
    aMgr.step(grid, 1 / 60);
  };

  // Convert screen mouse coordinates to grid cell coordinates
  const screenToGrid = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const gridX = Math.floor((screenX - pan.x) / zoom);
    const gridY = Math.floor((screenY - pan.y) / zoom);

    if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
      return { x: gridX, y: gridY };
    }
    return null;
  };

  // Canvas Mouse & Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle click or Alt + Left click: Pan view
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    // Right Click: If drawing route, cancel. If building is selected, cancel placement. Otherwise, demolish structure.
    if (e.button === 2) {
      e.preventDefault();
      if (pipeRouteStateRef.current.mode === 'drawing') {
        pipeRouteStateRef.current = { mode: 'idle' };
        return;
      }
      if (selectedDef !== null) {
        setSelectedDef(null);
        return;
      }
      const coords = screenToGrid(e.clientX, e.clientY);
      if (coords) {
        const tileX = Math.floor(coords.x / BUILDING_TILE);
        const tileY = Math.floor(coords.y / BUILDING_TILE);
        buildingMgrRef.current.removeBuildingOrPipe(gridRef.current, tileX, tileY);
      }
      return;
    }

    // Left Click Action
    if (e.button === 0) {
      const coords = screenToGrid(e.clientX, e.clientY);
      if (!coords) return;

      if (toolMode === 'BUILD' && selectedDef?.category === BuildingCategory.PIPE) {
        const tileX = Math.floor(coords.x / BUILDING_TILE);
        const tileY = Math.floor(coords.y / BUILDING_TILE);
        const tilePos = { tx: tileX, ty: tileY };
        const initialRoute = computeRoute(tilePos, tilePos, true, buildingMgrRef.current);
        pipeRouteStateRef.current = {
          mode: 'drawing',
          startTile: tilePos,
          currentTile: tilePos,
          route: initialRoute,
          horizontalFirst: true,
          valid: initialRoute.length > 0,
        };
        return;
      }

      isPaintingRef.current = true;
      executeActionAt(coords.x, coords.y, e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      const canvas = canvasRef.current;
      const cWidth = canvas?.width || 960;
      const cHeight = canvas?.height || 600;

      const rawPanX = e.clientX - panStartRef.current.x;
      const rawPanY = e.clientY - panStartRef.current.y;
      const clamped = clampPan(rawPanX, rawPanY, zoom, cWidth, cHeight);
      setPan(clamped);
      return;
    }

    const coords = screenToGrid(e.clientX, e.clientY);
    setHoverCell(coords);

    if (pipeRouteStateRef.current.mode === 'drawing' && coords) {
      const curTile = {
        tx: Math.floor(coords.x / BUILDING_TILE),
        ty: Math.floor(coords.y / BUILDING_TILE),
      };
      pipeRouteStateRef.current.currentTile = curTile;
      const route = computeRoute(
        pipeRouteStateRef.current.startTile,
        curTile,
        pipeRouteStateRef.current.horizontalFirst,
        buildingMgrRef.current
      );
      pipeRouteStateRef.current.route = route;
      pipeRouteStateRef.current.valid = route.length > 0;
      return;
    }

    if (isPaintingRef.current && coords) {
      executeActionAt(coords.x, coords.y, e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    isPaintingRef.current = false;

    if (pipeRouteStateRef.current.mode === 'drawing') {
      const state = pipeRouteStateRef.current;
      pipeRouteStateRef.current = { mode: 'idle' };

      if (state.valid && state.route.length > 0 && selectedDef) {
        const totalCost = state.route.length * (selectedDef.cost || 1);
        if (freeBuild || structuralSolidAvailable >= totalCost) {
          buildingMgrRef.current.placePipeRoute(gridRef.current, state.route, pipeDirection);
          if (!freeBuild) {
            buildingMgrRef.current.consumeMaterialFromContainers(
              MaterialType.STRUCTURAL_SOLID,
              totalCost
            );
          }
        }
      }
    }
  };

  const handleMouseLeave = () => {
    isPanningRef.current = false;
    isPaintingRef.current = false;
    setHoverCell(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;

    const defaultCellSize = Math.max(
      1,
      Math.min(
        Math.floor(cWidth / GRID_WIDTH),
        Math.floor(cHeight / GRID_HEIGHT)
      )
    );

    const minZoom = Math.max(1.0, 0.5 * defaultCellSize);
    const maxZoom = 8.0 * defaultCellSize;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * zoomFactor));

    // Anchor zoom relative to mouse cursor
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rawPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const rawPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    const clamped = clampPan(rawPanX, rawPanY, newZoom, cWidth, cHeight);

    setZoom(newZoom);
    setPan(clamped);
  };

  const executeActionAt = (
    caX: number,
    caY: number,
    screenClientX?: number,
    screenClientY?: number
  ) => {
    const grid = gridRef.current;
    const bMgr = buildingMgrRef.current;

    const tileX = Math.floor(caX / BUILDING_TILE);
    const tileY = Math.floor(caY / BUILDING_TILE);

    if (toolMode === 'DEMOLISH') {
      bMgr.removeBuildingOrPipe(grid, tileX, tileY);
      if (selectedBuilding && (selectedBuilding.tileX === tileX || selectedBuilding.tileY === tileY)) {
        setSelectedBuilding(null);
        setFilterPopupPos(null);
      }
      return;
    }

    if (toolMode === 'PAINT') {
      const radius = brushSize;
      for (let dy = -radius + 1; dy < radius; dy++) {
        for (let dx = -radius + 1; dx < radius; dx++) {
          if (dx * dx + dy * dy < radius * radius) {
            const tx = caX + dx;
            const ty = caY + dy;
            if (grid.isInBounds(tx, ty) && grid.structureFlags[grid.getIndex(tx, ty)] !== 1) {
              grid.setCell(tx, ty, brushMaterial);
            }
          }
        }
      }
      return;
    }

    if (toolMode === 'BUILD') {
      if (selectedDef) {
        // Placement check
        const check = bMgr.canPlaceBuilding(grid, selectedDef, tileX, tileY);
        if (!check.valid) return;

        // Resource cost check
        if (!freeBuild && structuralSolidAvailable < selectedDef.cost) {
          return;
        }

        const placed = bMgr.placeBuilding(grid, selectedDef, tileX, tileY, pipeDirection);
        if (
          placed !== null ||
          selectedDef.category === BuildingCategory.PIPE ||
          selectedDef.category === BuildingCategory.WALL
        ) {
          if (!freeBuild) {
            bMgr.consumeMaterialFromContainers(MaterialType.STRUCTURAL_SOLID, selectedDef.cost);
          }
        }
      } else {
        // No building selected -> Click on placed building opens Filter Popup
        const clickedBuilding = bMgr.getBuildingAt(tileX, tileY);
        if (clickedBuilding) {
          setSelectedBuilding(clickedBuilding);
          // Calculate screen position anchored at top-right of building
          const canvas = canvasRef.current;
          const rect = canvas?.getBoundingClientRect();
          const screenX = (rect?.left || 0) + pan.x + (clickedBuilding.tileX + clickedBuilding.tileW) * BUILDING_TILE * zoom;
          const screenY = (rect?.top || 0) + pan.y + clickedBuilding.tileY * BUILDING_TILE * zoom;
          setFilterPopupPos({
            x: screenClientX !== undefined ? screenClientX + 15 : screenX + 10,
            y: screenClientY !== undefined ? screenClientY - 20 : screenY,
          });
        } else {
          // Clicked empty cell -> Deselect
          setSelectedBuilding(null);
          setFilterPopupPos(null);
        }
      }
    }
  };

  // Keyboard Shortcuts (ESC to cancel placement, Space to pause, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (pipeRouteStateRef.current.mode === 'drawing') {
          pipeRouteStateRef.current = { mode: 'idle' };
        } else if (selectedDef !== null) {
          setSelectedDef(null);
        } else if (selectedBuilding !== null) {
          setSelectedBuilding(null);
          setFilterPopupPos(null);
        }
      } else if (e.key.toLowerCase() === 'r') {
        if (pipeRouteStateRef.current.mode === 'drawing') {
          e.preventDefault();
          pipeRouteStateRef.current.horizontalFirst = !pipeRouteStateRef.current.horizontalFirst;
          const route = computeRoute(
            pipeRouteStateRef.current.startTile,
            pipeRouteStateRef.current.currentTile,
            pipeRouteStateRef.current.horizontalFirst,
            buildingMgrRef.current
          );
          pipeRouteStateRef.current.route = route;
          pipeRouteStateRef.current.valid = route.length > 0;
        } else {
          setPipeDirection((prev) => {
            switch (prev) {
              case 'DOWN':
                return 'LEFT';
              case 'LEFT':
                return 'UP';
              case 'UP':
                return 'RIGHT';
              case 'RIGHT':
                return 'DOWN';
              default:
                return 'DOWN';
            }
          });
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        setSimSpeed((prev) => (prev === 0 ? 1 : 0));
      } else if (e.key === '1') {
        setSimSpeed(1);
      } else if (e.key === '2') {
        setSimSpeed(2);
      } else if (e.key === '3' || e.key === '5') {
        setSimSpeed(5);
      } else if (e.key.toLowerCase() === 'b') {
        setToolMode('BUILD');
      } else if (e.key.toLowerCase() === 'm') {
        setToolMode('PAINT');
        setSelectedDef(null);
      } else if (e.key.toLowerCase() === 'd') {
        setToolMode('DEMOLISH');
        setSelectedDef(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDef, selectedBuilding]);

  // Material Filter Handler Callbacks
  const handleUpdateFilter = (socketId: string, material: MaterialType, allow: boolean) => {
    if (!selectedBuilding) return;
    buildingMgrRef.current.setFilterAllowed(selectedBuilding.id, socketId, material, allow);
    setFilterVersion((v) => v + 1);
  };

  const handleResetFilterDefaults = () => {
    if (!selectedBuilding) return;
    buildingMgrRef.current.resetFilter(selectedBuilding.id);
    setFilterVersion((v) => v + 1);
  };

  // Handle Reconstruction in Tier 4
  const handleReconstruct = (entityId: string) => {
    const entity = reconstructionEntities.find((e) => e.id === entityId);
    if (!entity || entity.reconstructed) return;

    const bMgr = buildingMgrRef.current;
    let canAfford = true;

    for (const [matStr, reqAmt] of Object.entries(entity.requirements)) {
      const mat = Number(matStr) as MaterialType;
      if (bMgr.getMaterialTotalInContainers(mat) < reqAmt) {
        canAfford = false;
        break;
      }
    }

    if (!canAfford) return;

    // Consume materials
    for (const [matStr, reqAmt] of Object.entries(entity.requirements)) {
      const mat = Number(matStr) as MaterialType;
      bMgr.consumeMaterialFromContainers(mat, reqAmt);
    }

    // Mark reconstructed
    const updated = reconstructionEntities.map((e) =>
      e.id === entityId ? { ...e, reconstructed: true, reconstructedAt: Date.now() } : e
    );
    setReconstructionEntities(updated);

    // Particle burst in impact zone
    asteroidMgrRef.current.spawnMeteorShower(gridRef.current, 60);

    // Check Victory
    const allRestored = updated.every((e) => e.reconstructed);
    if (allRestored) {
      setHasWon(true);
      setIsVictoryModalOpen(true);
    }
  };

  const handleResetGrid = () => {
    if (window.confirm('Reset the simulation sandbox and clear all materials and structures?')) {
      gridRef.current.clearAll();
      buildingMgrRef.current.clearAll();
      setStoredCounts({});
      setSelectedBuilding(null);
      setFilterPopupPos(null);
    }
  };

  const handleResetView = () => {
    updateCanvasDimensions(true);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#070913] overflow-hidden select-none font-sans text-slate-200">
      {/* Top Header */}
      <Header
        currentTier={currentTier}
        tierGoalProgress={getTierGoal()}
        storedCounts={storedCounts}
        simSpeed={simSpeed}
        onSetSimSpeed={setSimSpeed}
        onStepSim={handleStepSim}
        asteroidEnabled={asteroidEnabled}
        onToggleAsteroids={() => {
          const next = !asteroidEnabled;
          setAsteroidEnabled(next);
          asteroidMgrRef.current.config.enabled = next;
        }}
        onTriggerMeteorShower={() => asteroidMgrRef.current.spawnMeteorShower(gridRef.current, 50)}
        onResetGrid={handleResetGrid}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Sandbox Area: Dynamic Viewport + Right Build Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Dynamic Canvas Viewport */}
        <div
          ref={containerRef}
          className="flex-1 relative bg-[#04060c] overflow-hidden flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleWheel}
            className="w-full h-full cursor-crosshair block"
          />

          {/* Real-time Cell & Building Inspector Tooltip */}
          <InspectPanel
            hoverCell={hoverCell}
            grid={gridRef.current}
            buildingMgr={buildingMgrRef.current}
          />

          {/* Zoom & Viewport Controls Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-[#0c101d]/90 backdrop-blur p-1 rounded-xl border border-slate-800 shadow-xl z-10">
            <button
              id="btn-zoom-in"
              onClick={() => {
                const canvas = canvasRef.current;
                const cWidth = canvas?.width || 960;
                const cHeight = canvas?.height || 600;
                const newZoom = Math.min(24.0, zoom + 1.0);
                const clamped = clampPan(pan.x, pan.y, newZoom, cWidth, cHeight);
                setZoom(newZoom);
                setPan(clamped);
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="btn-zoom-out"
              onClick={() => {
                const canvas = canvasRef.current;
                const cWidth = canvas?.width || 960;
                const cHeight = canvas?.height || 600;
                const newZoom = Math.max(1.0, zoom - 1.0);
                const clamped = clampPan(pan.x, pan.y, newZoom, cWidth, cHeight);
                setZoom(newZoom);
                setPan(clamped);
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="btn-center-viewport"
              onClick={handleResetView}
              className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
              title="Center Viewport"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Impact Zone Label Badge */}
          <div className="absolute top-3 left-3 pointer-events-none bg-cyan-950/70 border border-cyan-700/50 text-cyan-300 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider shadow-lg">
            ASTEROID IMPACT ZONE (TOP 20%)
          </div>

          {/* Material Routing Filter Popup */}
          {selectedBuilding && filterPopupPos && (
            <FilterPopup
              building={selectedBuilding}
              position={filterPopupPos}
              onUpdateFilter={handleUpdateFilter}
              onResetDefaults={handleResetFilterDefaults}
              onClose={() => {
                setSelectedBuilding(null);
                setFilterPopupPos(null);
              }}
            />
          )}
        </div>

        {/* Right Sidebar (320px wide) */}
        <div className="w-80 h-full flex flex-col relative z-20">
          {/* If Tier 4: Show navigation tab bar to switch between Construction and Cosmic Reconstruction */}
          {currentTier === 4 && (
            <div className="flex bg-[#080b15] border-l border-b border-[#1f293d] p-1 gap-1">
              <button
                id="tab-tier4-build"
                onClick={() => setTier4View('BUILD')}
                className={`flex-1 py-1 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tier4View === 'BUILD'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                Build System
              </button>
              <button
                id="tab-tier4-reconstruct"
                onClick={() => setTier4View('RECONSTRUCTION')}
                className={`flex-1 py-1 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tier4View === 'RECONSTRUCTION'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold shadow'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Reconstruction
              </button>
            </div>
          )}

          {currentTier === 4 && tier4View === 'RECONSTRUCTION' ? (
            <ReconstructionCatalog
              entities={reconstructionEntities}
              storedCounts={storedCounts}
              onReconstruct={handleReconstruct}
              isCompleted={hasWon}
            />
          ) : (
            <BuildPanel
              currentTier={currentTier}
              storedCounts={storedCounts}
              toolMode={toolMode}
              onSetToolMode={setToolMode}
              selectedDef={selectedDef}
              onSelectBuildingDef={setSelectedDef}
              pipeDirection={pipeDirection}
              onSetPipeDirection={setPipeDirection}
              brushMaterial={brushMaterial}
              onSetBrushMaterial={setBrushMaterial}
              brushSize={brushSize}
              onSetBrushSize={setBrushSize}
              structuralSolidAvailable={structuralSolidAvailable}
              freeBuild={freeBuild}
              onToggleFreeBuild={() => setFreeBuild((f) => !f)}
            />
          )}
        </div>
      </div>

      {/* Victory Modal */}
      {isVictoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#11192e] to-[#0a0f1d] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 text-center shadow-2xl shadow-amber-500/20 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/40 animate-bounce">
              <Award className="w-8 h-8 text-slate-950" />
            </div>

            <h2 className="text-xl font-bold text-amber-300 tracking-wide">
              RECONSTRUCTION COMPLETE
            </h2>

            <p className="text-sm font-serif italic text-amber-100/90 leading-relaxed bg-[#0b101f] p-4 rounded-xl border border-amber-500/30">
              "The first things exist again. The universe remembers."
            </p>

            <p className="text-xs text-slate-300 leading-relaxed">
              All five primeval constructs have been resurrected through complete automation loops,
              reactions, and refining conduits. You may continue freely experimenting with infinite
              cellular automata physics in the sandbox.
            </p>

            <button
              id="btn-continue-endless"
              onClick={() => setIsVictoryModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 transition cursor-pointer"
            >
              Continue Endless Sandbox
            </button>
          </div>
        </div>
      )}

      {/* Field Manual & Reaction Codex Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
