import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { 
  ToolMode, 
  CardinalDirection, 
  RawPartId,
  WeaponId 
} from './types';
import { gameReducer, getInitialGameState } from './engine/gameReducer';
import { Header } from './components/Header';
import { StorefrontPanel } from './components/StorefrontPanel';
import { SvgWorkshopGrid } from './components/SvgWorkshopGrid';
import { Toolbar } from './components/Toolbar';
import { RecipeBookModal } from './components/RecipeBookModal';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialGameState);
  
  const [toolMode, setToolMode] = useState<ToolMode>('conveyor');
  const [direction, setDirection] = useState<CardinalDirection>('E');
  const [selectedSpawnerPart, setSelectedSpawnerPart] = useState<RawPartId>('chassis');
  const [selectedFilterPart, setSelectedFilterPart] = useState<RawPartId>('chassis');
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>({ x: 2, y: 2 });
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Unlocked parts derived from upgrades
  const isScattershotUnlocked = state.upgrades.some(u => u.id === 'tech_scattershot' && u.purchased);
  const isSpecOpsUnlocked = state.upgrades.some(u => u.id === 'tech_specops' && u.purchased);
  const isPrecisionUnlocked = state.upgrades.some(u => u.id === 'tech_precision' && u.purchased);
  
  const unlockedParts: RawPartId[] = ['chassis', 'magazine'];
  if (isScattershotUnlocked) unlockedParts.push('barrel');
  if (isSpecOpsUnlocked) unlockedParts.push('stock');
  if (isPrecisionUnlocked) unlockedParts.push('optic');

  // Simulation Tick Loop with Speed Multiplier
  useEffect(() => {
    if (!state.isRunning) return;

    const intervalTime = Math.max(50, state.tickRateMs / state.speed);
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [state.isRunning, state.tickRateMs, state.speed]);

  // Rotate Direction
  const handleRotateDirection = useCallback(() => {
    setDirection((prev) => {
      switch (prev) {
        case 'N': return 'E';
        case 'E': return 'S';
        case 'S': return 'W';
        case 'W': return 'N';
      }
    });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        dispatch({ type: 'SET_RUNNING', isRunning: !state.isRunning });
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRotateDirection();
      } else if (e.key === '1') {
        setToolMode('conveyor');
      } else if (e.key === '2') {
        setToolMode('splitter');
      } else if (e.key === '3') {
        setToolMode('merger');
      } else if (e.key === '4') {
        setToolMode('underground');
      } else if (e.key === '5') {
        setToolMode('fitter');
      } else if (e.key === '6') {
        setToolMode('packer');
      } else if (e.key === '7') {
        setToolMode('spawner');
      } else if (e.key === '8') {
        setToolMode('seller');
      } else if (e.key === '9') {
        setToolMode('lab');
      } else if (e.key === '0') {
        setToolMode('power_gen');
      } else if (e.key === 'i' || e.key === 'I') {
        setToolMode('inspect');
      } else if (e.key === 'x' || e.key === 'X') {
        setToolMode('clear');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isRunning, handleRotateDirection]);

  // Tile Interaction Handlers
  const handleTileClick = (x: number, y: number) => {
    const currentTile = state.grid[y]?.[x];
    setSelectedTile({ x, y });

    if (toolMode === 'inspect') {
      if (currentTile && currentTile.type !== 'empty') {
        dispatch({ type: 'TOGGLE_TILE_POWER', x, y });
      }
      return;
    }

    if (toolMode === 'clear') {
      dispatch({ type: 'CLEAR_TILE', x, y });
      return;
    }

    // Quick toggle on existing spawner when clicked with same part spawner tool
    if (toolMode === 'spawner' && currentTile && currentTile.type === 'spawner' && currentTile.spawnerPart === selectedSpawnerPart) {
      dispatch({ type: 'TOGGLE_TILE_POWER', x, y });
      return;
    }

    // Quick toggle on switch tile
    if (currentTile && currentTile.type === 'switch') {
      dispatch({ type: 'TOGGLE_SWITCH_TILE', x, y });
      return;
    }

    dispatch({
      type: 'PLACE_TILE',
      x,
      y,
      tileType: toolMode === 'underground' ? 'underground_entry' : toolMode,
      direction,
      spawnerPart: toolMode === 'spawner' ? selectedSpawnerPart : undefined,
      filterPart: toolMode === 'filter' ? selectedFilterPart : undefined,
    });
  };

  const handleDragPlaceConveyor = (prevX: number, prevY: number, nextX: number, nextY: number, dragDir: CardinalDirection) => {
    setSelectedTile({ x: nextX, y: nextY });
    dispatch({
      type: 'DRAG_PLACE_CONVEYOR',
      prevX,
      prevY,
      nextX,
      nextY,
      direction: dragDir,
    });
  };

  const handleTileRightClick = (x: number, y: number, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedTile({ x, y });
    dispatch({ type: 'CYCLE_TILE_DIRECTION', x, y });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Application Header */}
      <Header
        state={state}
        onTogglePlay={() => dispatch({ type: 'SET_RUNNING', isRunning: !state.isRunning })}
        onManualStep={() => dispatch({ type: 'TICK' })}
        onSetSpeed={(speed) => dispatch({ type: 'SET_SPEED', speed })}
        onToggleSound={() => dispatch({ type: 'TOGGLE_SOUND' })}
        onSwitchSector={(sectorId) => dispatch({ type: 'SWITCH_SECTOR', sectorId })}
        onUnlockSector={(sectorId) => dispatch({ type: 'UNLOCK_SECTOR', sectorId })}
        onLoadPreset={(presetId) => dispatch({ type: 'LOAD_PRESET', presetId })}
        onReset={() => dispatch({ type: 'CLEAR_ALL_TILES' })}
        onOpenRecipes={() => setIsRecipeModalOpen(true)}
      />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Storefront Shelf, AI Customer Queue, Hoppers, R&D Tech, Diagnostics */}
        <StorefrontPanel
          state={state}
          selectedTile={selectedTile}
          onBuyPart={(partId, qty) => dispatch({ type: 'BUY_PART', partId, quantity: qty })}
          onBuyUpgrade={(upgradeId) => dispatch({ type: 'BUY_UPGRADE', upgradeId })}
          onToggleTilePower={(x, y) => dispatch({ type: 'TOGGLE_TILE_POWER', x, y })}
          onRotateTile={(x, y) => dispatch({ type: 'ROTATE_TILE', x, y })}
          onUpgradeTier={(x, y) => dispatch({ type: 'UPGRADE_TILE_TIER', x, y })}
          onSetSpawnerPart={(x, y, part) => dispatch({ type: 'SET_SPAWNER_PART', x, y, partId: part })}
          onToggleSpawnerAutoBuy={(x, y) => dispatch({ type: 'TOGGLE_SPAWNER_AUTOBUY', x, y })}
          onSetFitterTarget={(x, y, recipe) => dispatch({ type: 'SET_FITTER_TARGET', x, y, recipeId: recipe })}
          onSetFilterPart={(x, y, part) => dispatch({ type: 'SET_FILTER_PART', x, y, part })}
        />

        {/* Right Side: Workshop Conveyor Grid & Build Toolbar */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Top Build Palette Toolbar */}
          <Toolbar
            toolMode={toolMode}
            onSetToolMode={setToolMode}
            direction={direction}
            onRotateDirection={handleRotateDirection}
            selectedSpawnerPart={selectedSpawnerPart}
            onSelectSpawnerPart={setSelectedSpawnerPart}
            selectedFilterPart={selectedFilterPart}
            onSelectFilterPart={setSelectedFilterPart}
            unlockedParts={unlockedParts}
            upgrades={state.upgrades}
            funds={state.funds}
          />

          {/* Blueprint Canvas Grid */}
          <SvgWorkshopGrid
            state={state}
            toolMode={toolMode}
            direction={direction}
            selectedSpawnerPart={selectedSpawnerPart}
            selectedFilterPart={selectedFilterPart}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            onTileRightClick={handleTileRightClick}
            onDragPlaceConveyor={handleDragPlaceConveyor}
            onClearTile={(x, y) => dispatch({ type: 'CLEAR_TILE', x, y })}
            onUpgradeTier={(x, y) => dispatch({ type: 'UPGRADE_TILE_TIER', x, y })}
          />
        </div>
      </div>

      {/* Weapons Schematic Codex Modal */}
      <RecipeBookModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        unlockedUpgrades={state.upgrades.filter(u => u.purchased).map(u => u.id)}
      />
    </div>
  );
}
