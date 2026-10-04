import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BuildingDef,
  BuildingInstance,
  MaterialType,
  PipeDirection,
  PipeRouteState,
  RECONSTRUCTION_ENTITIES,
  ReconstructionEntity,
} from './types';
import { CellularGrid, GRID_HEIGHT, GRID_WIDTH } from './simulation/grid';
import { BuildingManager, computeRoute } from './simulation/buildings';
import { AsteroidManager } from './simulation/asteroids';
import { GameRenderer } from './simulation/renderer';
import { BUILDING_DEFS } from './simulation/buildingDefs';
import { Header } from './components/Header';
import { BuildPanel, ToolMode } from './components/BuildPanel';
import { FilterPopup } from './components/FilterPopup';
import { ReconstructionCatalog } from './components/ReconstructionCatalog';
import { InspectPanel } from './components/InspectPanel';
import { HelpModal } from './components/HelpModal';
import { getTierGoal } from './components/buildPanelHelpers';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import { useCanvasInput } from './hooks/useCanvasInput';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { ZoomIn, ZoomOut, Maximize2, Sparkles, Award, Hammer } from 'lucide-react';

export type AppProps = GameRendererProps & { onRestart?: () => void };

export default function App({ onRestart }: AppProps) {
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

  useSimulationLoop({
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
  });

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel } =
    useCanvasInput({
      canvasRef,
      gridRef,
      buildingMgrRef,
      pipeRouteStateRef,
      isPanningRef,
      isPaintingRef,
      panStartRef,
      pan,
      zoom,
      setPan,
      setZoom,
      setHoverCell,
      clampPan,
      toolMode,
      selectedDef,
      setSelectedDef,
      pipeDirection,
      brushMaterial,
      brushSize,
      freeBuild,
      structuralSolidAvailable,
      selectedBuilding,
      setSelectedBuilding,
      setFilterPopupPos,
    });

  // Step 1 Tick (when paused)
  const handleStepSim = () => {
    const grid = gridRef.current;
    const bMgr = buildingMgrRef.current;
    const aMgr = asteroidMgrRef.current;
    grid.step();
    bMgr.step(grid, 1 / 60);
    aMgr.step(grid, 1 / 60);
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
    buildingMgrRef.current.updateFilter(selectedBuilding.id.toString(), socketId, material, allow);
    setFilterVersion((v) => v + 1);
  };

  const handleResetFilterDefaults = () => {
    if (!selectedBuilding) return;
    buildingMgrRef.current.resetFilterToDefaults(selectedBuilding.id.toString());
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
    gridRef.current.clearAll();
    buildingMgrRef.current.clearAll();
    setStoredCounts({});
    setSelectedBuilding(null);
    setFilterPopupPos(null);
  };

  const handleResetView = () => {
    updateCanvasDimensions(true);
  };

  return (
    <GameShell
      gameLabel="VoidRift Particle Sandbox"
      gameId="voidrift_particle_sandbox"
      phase="PARTICLE SANDBOX"
      className="bg-[#070913] text-slate-200 font-sans"
      mainClassName="game-shell-main--scrollable"
    >
      <div className="flex flex-col w-full h-full bg-[#070913] overflow-hidden select-none text-slate-200">
        {/* Top Header */}
        <Header
          currentTier={currentTier}
          tierGoalProgress={getTierGoal(currentTier, storedCounts)}
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
          onRestart={onRestart}
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
    </GameShell>
  );
}
