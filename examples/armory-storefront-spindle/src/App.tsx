import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { 
  ToolMode, 
  CardinalDirection, 
  RawPartId 
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
  const [selectedDirection, setSelectedDirection] = useState<CardinalDirection>('E');
  const [selectedSpawnerPart, setSelectedSpawnerPart] = useState<RawPartId>('chassis');
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>({ x: 2, y: 2 });
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Unlocked parts derived from upgrades
  const isSpecOpsUnlocked = state.upgrades.some(u => u.id === 'tech_specops' && u.purchased);
  const isPrecisionUnlocked = state.upgrades.some(u => u.id === 'tech_precision' && u.purchased);
  const unlockedParts: RawPartId[] = ['chassis', 'barrel', 'magazine'];
  if (isSpecOpsUnlocked) unlockedParts.push('stock');
  if (isPrecisionUnlocked) unlockedParts.push('optic');

  // Simulation Tick Loop
  useEffect(() => {
    if (!state.isRunning) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, state.tickRateMs);

    return () => clearInterval(interval);
  }, [state.isRunning, state.tickRateMs]);

  // Rotate Direction
  const handleRotateDirection = useCallback(() => {
    setSelectedDirection((prev) => {
      switch (prev) {
        case 'N': return 'E';
        case 'E': return 'S';
        case 'S': return 'W';
        case 'W': return 'N';
      }
    });
  }, []);

  // Keyboard Shortcuts (Space for Play/Pause, R for rotate, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or modal
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
        setToolMode('fitter');
      } else if (e.key === '3') {
        setToolMode('packer');
      } else if (e.key === '4') {
        setToolMode('spawner');
      } else if (e.key === '5') {
        setToolMode('trash');
      } else if (e.key === '6') {
        setToolMode('clear');
      } else if (e.key === '7' || e.key === 'i' || e.key === 'I') {
        setToolMode('inspect');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isRunning, handleRotateDirection]);

  // Tile Interaction Handlers
  const handleTileClick = (x: number, y: number) => {
    setSelectedTile({ x, y });

    if (toolMode === 'inspect') {
      return;
    }

    if (toolMode === 'clear') {
      dispatch({ type: 'CLEAR_TILE', x, y });
      return;
    }

    dispatch({
      type: 'PLACE_TILE',
      x,
      y,
      tileType: toolMode,
      direction: selectedDirection,
      spawnerPart: toolMode === 'spawner' ? selectedSpawnerPart : undefined,
    });
  };

  const handleTileRightClick = (x: number, y: number, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedTile({ x, y });
    dispatch({ type: 'ROTATE_TILE', x, y });
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
        onLoadPreset={(presetId) => dispatch({ type: 'LOAD_PRESET', presetId })}
        onReset={() => dispatch({ type: 'RESET_GAME' })}
        onOpenRecipes={() => setIsRecipeModalOpen(true)}
      />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Storefront Shelf, AI Customer Queue, Hoppers, R&D Tech */}
        <StorefrontPanel
          state={state}
          onBuyPart={(partId, qty) => dispatch({ type: 'BUY_PART', partId, quantity: qty })}
          onBuyUpgrade={(upgradeId) => dispatch({ type: 'BUY_UPGRADE', upgradeId })}
        />

        {/* Right Side: Declarative SVG Workshop Conveyor Grid & Toolbar */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Workshop Grid Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-auto bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <SvgWorkshopGrid
              state={state}
              toolMode={toolMode}
              selectedDirection={selectedDirection}
              selectedSpawnerPart={selectedSpawnerPart}
              selectedTile={selectedTile}
              onTileClick={handleTileClick}
              onTileRightClick={handleTileRightClick}
              onSelectTile={setSelectedTile}
            />
          </div>

          {/* Bottom Machine Placement Toolbar */}
          <Toolbar
            toolMode={toolMode}
            selectedDirection={selectedDirection}
            selectedSpawnerPart={selectedSpawnerPart}
            unlockedParts={unlockedParts}
            onSelectTool={setToolMode}
            onSelectDirection={setSelectedDirection}
            onRotateDirection={handleRotateDirection}
            onSelectSpawnerPart={setSelectedSpawnerPart}
            onClearAll={() => dispatch({ type: 'CLEAR_ALL_TILES' })}
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
