import React, { useState, useEffect, useRef } from 'react';
import {
  BuildingCategory,
  BuildingDef,
  MaterialType,
  MATERIAL_DEFS,
  PipeDirection,
} from '../types';
import { BUILDING_DEFS } from '../simulation/buildingDefs';
import { getGoalData, renderCardGraphic } from './buildPanelHelpers';
import { unlockedDefs } from './buildPanelVisibility';
import {
  ArrowDownToLine,
  Box,
  Workflow,
  Cpu,
  Paintbrush,
  Move,
  Trash2,
  Lock,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';

export type ToolMode = 'BUILD' | 'DEMOLISH' | 'PAINT' | 'PAN';
export type BuildCategoryTab = 'COLLECTORS' | 'CONTAINERS' | 'PIPES' | 'PROCESSORS' | 'MATERIALS';

interface BuildPanelProps {
  currentTier: number;
  storedCounts: Record<number, number>;
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  selectedDef: BuildingDef | null;
  onSelectBuildingDef: (def: BuildingDef | null) => void;
  pipeDirection: PipeDirection;
  onSetPipeDirection: (dir: PipeDirection) => void;
  brushMaterial: MaterialType;
  onSetBrushMaterial: (mat: MaterialType) => void;
  brushSize: number;
  onSetBrushSize: (size: number) => void;
  structuralSolidAvailable: number;
  freeBuild: boolean;
  onToggleFreeBuild: () => void;
}

export const BuildPanel: React.FC<BuildPanelProps> = ({
  currentTier,
  storedCounts,
  toolMode,
  onSetToolMode,
  selectedDef,
  onSelectBuildingDef,
  pipeDirection,
  onSetPipeDirection,
  brushMaterial,
  onSetBrushMaterial,
  brushSize,
  onSetBrushSize,
  structuralSolidAvailable,
  freeBuild,
}) => {
  // Category Tab State
  const [activeTab, setActiveTab] = useState<BuildCategoryTab>('COLLECTORS');

  // Tier Unlock Flash Animation State
  const prevTierRef = useRef<number>(currentTier);
  const [unlockBanner, setUnlockBanner] = useState<{
    tier: number;
    show: boolean;
  } | null>(null);

  useEffect(() => {
    if (currentTier > prevTierRef.current) {
      const unlockedTier = prevTierRef.current;
      setUnlockBanner({
        tier: unlockedTier,
        show: true,
      });

      const timer = setTimeout(() => {
        setUnlockBanner(null);
      }, 3000);

      prevTierRef.current = currentTier;
      return () => clearTimeout(timer);
    }
    prevTierRef.current = currentTier;
  }, [currentTier]);

  // Keep tab in sync with toolMode
  const handleSelectTab = (tab: BuildCategoryTab) => {
    setActiveTab(tab);
    if (tab === 'MATERIALS') {
      onSetToolMode('PAINT');
      onSelectBuildingDef(null);
    } else {
      onSetToolMode('BUILD');
    }
  };

  // Group definitions by category
  const available = unlockedDefs(BUILDING_DEFS, currentTier);
  const collectors = available.filter((b) => b.category === BuildingCategory.COLLECTOR);
  const containers = available.filter((b) => b.category === BuildingCategory.CONTAINER);
  const conduits = available.filter(
    (b) => b.category === BuildingCategory.PIPE || b.category === BuildingCategory.WALL
  );
  const processors = available.filter((b) => b.category === BuildingCategory.PROCESSOR);
  const materialsList = Object.values(MATERIAL_DEFS);

  const goalData = getGoalData(currentTier, storedCounts);

  // Render items based on active tab
  const getActiveTabItems = () => {
    switch (activeTab) {
      case 'COLLECTORS':
        return collectors;
      case 'CONTAINERS':
        return containers;
      case 'PIPES':
        return conduits;
      case 'PROCESSORS':
        return processors;
      default:
        return [];
    }
  };

  const currentItems = getActiveTabItems();

  return (
    <div className="w-full md:w-80 bg-[#0c101d] border-t md:border-t-0 md:border-l border-[#1f293d] flex flex-col h-full overflow-hidden text-xs text-slate-300 select-none shadow-2xl z-20">
      {/* 3A: Current Goal Bar (60px height) */}
      <div className="h-[60px] min-h-[60px] px-3 py-2 bg-[#090d18] border-b border-[#1f293d] flex flex-col justify-center relative overflow-hidden">
        {unlockBanner && unlockBanner.show ? (
          <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-950/80 to-cyan-950/80 border border-emerald-500/60 p-1.5 rounded-lg text-emerald-300 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="font-semibold text-[11px] leading-tight">
              ✓ Tier {unlockBanner.tier} Unlocked — Tier {unlockBanner.tier + 1} items available
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                {goalData.tierLabel}
              </span>
              <span className="text-slate-400">
                {goalData.materialName}:{' '}
                <strong className="text-slate-100 font-mono">
                  {goalData.current}/{goalData.target}
                </strong>
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-[#161d2e] h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${goalData.pct}%`,
                  backgroundColor: goalData.color,
                  boxShadow: `0 0 8px ${goalData.color}80`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Body: Vertical Category Tabs (Left 40px) + Item Grid (Right 280px) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Category Tab Strip (40px) */}
        <div className="w-10 min-w-[40px] bg-[#080b15] border-r border-[#1a2336] flex flex-col items-center py-2 gap-2">
          {/* Collectors Tab */}
          <button
            onClick={() => handleSelectTab('COLLECTORS')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              activeTab === 'COLLECTORS'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Collectors (2×2 Intake Funnels)"
          >
            <ArrowDownToLine className="w-4 h-4" />
          </button>

          {/* Containers Tab */}
          <button
            onClick={() => handleSelectTab('CONTAINERS')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              activeTab === 'CONTAINERS'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Containers (Gas Tanks, Liquid Flasks, Solid Bins, Dust Hoppers)"
          >
            <Box className="w-4 h-4" />
          </button>

          {/* Pipes / Conduits Tab */}
          <button
            onClick={() => handleSelectTab('PIPES')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              activeTab === 'PIPES'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Pipes & Structural Walls"
          >
            <Workflow className="w-4 h-4" />
          </button>

          {/* Processors Tab */}
          <button
            onClick={() => handleSelectTab('PROCESSORS')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              activeTab === 'PROCESSORS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Processors (Compressor, Condenser, Separator, Plasma Forge, Catalyst)"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* Visual Divider */}
          <div className="w-6 h-px bg-slate-800 my-1" />

          {/* Materials / Painter Tab (Visually Distinct) */}
          <button
            onClick={() => handleSelectTab('MATERIALS')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition border ${
              activeTab === 'MATERIALS'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/40'
                : 'text-indigo-400/80 border-indigo-900/50 hover:text-indigo-300 hover:bg-indigo-950/50'
            }`}
            title="Sandbox Material Painter (M)"
          >
            <Paintbrush className="w-4 h-4" />
          </button>

          {/* Pan Mode Button (touch devices have no middle-click or Alt-drag) */}
          <button
            id="tool-pan"
            onClick={() => {
              onSetToolMode(toolMode === 'PAN' ? 'BUILD' : 'PAN');
              onSelectBuildingDef(null);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              toolMode === 'PAN'
                ? 'bg-slate-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Move the view: drag to pan"
          >
            <Move className="w-4 h-4" />
          </button>

          {/* Demolish Mode Button */}
          <div className="mt-auto flex flex-col items-center gap-1.5">
            <button
              onClick={() => {
                if (toolMode === 'DEMOLISH') {
                  onSetToolMode('BUILD');
                } else {
                  onSetToolMode('DEMOLISH');
                  onSelectBuildingDef(null);
                }
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                toolMode === 'DEMOLISH'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
                  : 'text-rose-400/70 hover:text-rose-300 hover:bg-rose-950/40'
              }`}
              title="Demolish Mode (D / Right Click on structure)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Item Grid (280px wide) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c101d]">
          {/* Category Header & Currency Info */}
          <div className="px-3 py-2 bg-[#0e1424] border-b border-[#1b253b] flex items-center justify-between">
            <span className="font-semibold text-slate-200 text-[11px] tracking-wide uppercase">
              {activeTab === 'COLLECTORS' && 'Collectors'}
              {activeTab === 'CONTAINERS' && 'Containers'}
              {activeTab === 'PIPES' && 'Transport & Walls'}
              {activeTab === 'PROCESSORS' && 'Processors'}
              {activeTab === 'MATERIALS' && 'Material Painter'}
            </span>

            {/* Structural Solid Currency / Free Build toggle */}
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-slate-400">Solid:</span>
              <span
                className={`font-bold ${
                  structuralSolidAvailable > 0 || freeBuild ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {freeBuild ? '∞' : `⬡ ${structuralSolidAvailable}`}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
            {activeTab !== 'MATERIALS' && (
              <>
                {/* Pipe Direction Controls (shown if Pipe category active and pipe selected) */}
                {activeTab === 'PIPES' && selectedDef?.category === BuildingCategory.PIPE && (
                  <div className="bg-[#121929] p-2 rounded-lg border border-cyan-500/30 mb-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1 text-[10px]">
                        <Workflow className="w-3 h-3" />
                        Flow Direction
                      </span>
                      <span className="text-[9px] text-slate-400">5 units/s</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['UP', 'DOWN', 'LEFT', 'RIGHT'] as PipeDirection[]).map((dir) => {
                        const isSelected = pipeDirection === dir;
                        return (
                          <button
                            key={dir}
                            onClick={() => onSetPipeDirection(dir)}
                            className={`py-1 flex flex-col items-center justify-center rounded border font-mono text-[9px] transition ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                                : 'bg-[#182236] text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {dir === 'UP' && <ArrowUp className="w-3.5 h-3.5" />}
                            {dir === 'DOWN' && <ArrowDown className="w-3.5 h-3.5" />}
                            {dir === 'LEFT' && <ArrowLeft className="w-3.5 h-3.5" />}
                            {dir === 'RIGHT' && <ArrowRight className="w-3.5 h-3.5" />}
                            <span>{dir}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2-Column Sims-Style Card Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {currentItems.map((def) => {
                    const isLocked = def.unlockedAtTier > currentTier;
                    const isSelected = selectedDef?.id === def.id;
                    const canAfford = freeBuild || structuralSolidAvailable >= def.cost;

                    return (
                      <button
                        key={def.id}
                        disabled={isLocked}
                        onClick={() => {
                          if (isSelected) {
                            onSelectBuildingDef(null);
                          } else {
                            onSetToolMode('BUILD');
                            onSelectBuildingDef(def);
                          }
                        }}
                        title={
                          isLocked
                            ? `Unlocks at Tier ${def.unlockedAtTier}`
                            : `${def.name} — ${def.description}`
                        }
                        className={`h-20 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer ${
                          isLocked
                            ? 'opacity-40 bg-[#0f1422] border-slate-800 cursor-not-allowed'
                            : isSelected
                            ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/50'
                            : 'bg-[#121828] border-[#222d46] hover:border-slate-500 hover:bg-[#151c30]'
                        }`}
                      >
                        {/* Top half: Preview graphic and Tier badge */}
                        <div className="flex items-start justify-between relative">
                          <div className="flex-1">{renderCardGraphic(def)}</div>

                          {/* Tier Badge */}
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ml-1 shrink-0 ${
                              def.unlockedAtTier === 1
                                ? 'bg-slate-800 text-cyan-300 border-cyan-800/60'
                                : def.unlockedAtTier === 2
                                ? 'bg-purple-950 text-purple-300 border-purple-800/60'
                                : 'bg-amber-950 text-amber-300 border-amber-800/60'
                            }`}
                          >
                            T{def.unlockedAtTier}
                          </span>
                        </div>

                        {/* Bottom Row: Item Name and Cost */}
                        <div className="flex items-end justify-between gap-1 pt-1">
                          <span className="font-semibold text-[10px] text-slate-100 truncate max-w-[70px]">
                            {def.name}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-semibold shrink-0 ${
                              canAfford ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ⬡ {def.cost}
                          </span>
                        </div>

                        {/* Locked Overlay Icon */}
                        {isLocked && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-amber-400 gap-0.5">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span className="text-[9px] font-mono text-amber-300">
                              Tier {def.unlockedAtTier}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Materials Painter Tab Content */}
            {activeTab === 'MATERIALS' && (
              <div className="space-y-3">
                {/* Brush Size */}
                <div className="bg-[#121929] p-2 rounded-lg border border-[#232f48]">
                  <span className="font-semibold text-indigo-300 text-[10px] block mb-1">
                    Brush Radius
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 4, 7].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => onSetBrushSize(sz)}
                        className={`flex-1 py-1 rounded border font-mono text-[10px] transition ${
                          brushSize === sz
                            ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                            : 'bg-[#182236] text-slate-400 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material Palette Grid */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Material
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {materialsList.map((mat) => {
                      const isSelected = brushMaterial === mat.id;
                      return (
                        <button
                          key={mat.id}
                          onClick={() => {
                            onSetToolMode('PAINT');
                            onSetBrushMaterial(mat.id);
                          }}
                          className={`p-2 text-left rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-sm'
                              : 'bg-[#131a2c] border-[#222d46] hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/40"
                            style={{ backgroundColor: mat.color }}
                          />
                          <div className="overflow-hidden">
                            <div className="font-semibold text-[10px] truncate">{mat.name}</div>
                            <div className="text-[8px] text-slate-400 truncate">
                              {mat.isSolid
                                ? 'Solid'
                                : mat.isLiquid
                                ? 'Liquid'
                                : mat.isGas
                                ? 'Gas'
                                : 'Void'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Placement Bar (Bottom 40px) */}
          <div className="h-10 px-3 bg-[#080b15] border-t border-[#1a2336] flex items-center justify-between text-[11px]">
            {selectedDef ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    onClick={() => onSelectBuildingDef(null)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-950/60 px-1.5 py-0.5 rounded border border-slate-700 transition"
                    title="Cancel Placement (ESC / Right-Click)"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel (ESC)</span>
                  </button>
                  <span className="text-cyan-300 font-semibold truncate">
                    Placing: {selectedDef.name}
                  </span>
                </div>
                <span className="font-mono text-slate-300 shrink-0 font-bold">
                  Cost: ⬡ {selectedDef.cost}
                </span>
              </div>
            ) : (
              <div className="text-slate-500 italic text-[10px]">
                {toolMode === 'PAINT'
                  ? 'Paint Mode: Click and drag on canvas'
                  : toolMode === 'DEMOLISH'
                  ? 'Demolish Mode: Click to dismantle'
                  : toolMode === 'PAN'
                  ? 'Move Mode: drag to move the view'
                  : 'Select an item to place →'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
