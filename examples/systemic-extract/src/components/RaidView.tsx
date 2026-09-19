/**
 * Raid View Component (Phase 10: Pragmatic Segregation)
 * Renders the active 50x50 Bevy-style ECS simulation on an HTML5 canvas.
 * Refactored to modular architecture:
 * - 60Hz loop, canvas lifecycle, and input listeners decoupled into useRaidSimulation hook
 * - View split into discrete presentation components:
 *   - RaidHUD: operative HP, overclock gauge, carried scrap, sector stability, sector badge, and hardpoint status
 *   - RaidBossBanners: Reality Collapse and Apex Echo boss health HUD
 *   - RaidCombatTicker: floating combat damage, breach, and extraction ticker
 *   - RaidHotbar: action bar for ordnance, tools, and weapon switching
 *   - RaidVirtualDpad: tactile on-screen controls
 *   - RaidHelpModal: anomalous physics and tactical guidelines
 *   - RaidResolutionModal: extraction/KIA mission resolution summary
 */

import React from 'react';
import { useRaidSimulation } from '../hooks/useRaidSimulation';
import { SectorId, WeaponId, DungeonZoneId } from '../types';
import {
  Compass,
  DoorOpen,
  Home,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { RaidHUD } from './raid/RaidHUD';
import { RaidBossBanners } from './raid/RaidBossBanners';
import { RaidCombatTicker } from './raid/RaidCombatTicker';
import { RaidHotbar } from './raid/RaidHotbar';
import { RaidVirtualDpad } from './raid/RaidVirtualDpad';
import { RaidHelpModal } from './raid/RaidHelpModal';
import { RaidResolutionModal } from './raid/RaidResolutionModal';
import { BuildModeDock } from './BuildModeDock';

interface RaidViewProps {
  initialCharges: number;
  initialMedkits: number;
  initialFlares: number;
  initialLures?: number;
  sectorId?: SectorId;
  hasHazmatSuit?: boolean;
  equippedWeapon?: WeaponId;
  unlockedWeapons?: WeaponId[];
  onEndRaid: () => void;
  onOpenInspector: () => void;
}

export const RaidView: React.FC<RaidViewProps> = ({
  initialCharges,
  initialMedkits,
  initialFlares,
  initialLures = 0,
  sectorId = 'sector_01' as SectorId,
  hasHazmatSuit = false,
  equippedWeapon = 'kinetic_scattergun' as WeaponId,
  unlockedWeapons = ['kinetic_scattergun'] as WeaponId[],
  onEndRaid,
  onOpenInspector,
}) => {
  const {
    containerRef,
    canvasRef,
    chargesLeft,
    medkitsLeft,
    flaresLeft,
    luresLeft,
    gasVialsLeft,
    activeWeapon,
    playerHp,
    playerMaxHp,
    scrapCollected,
    bankedScrap,
    isInsideSanctuary,
    currentZoneName,
    currentMapType,
    activeDungeonId,
    nearbyDungeonGate,
    isBuildMode,
    selectedBlueprintId,
    unlockedBlueprints,
    activeBuffs,
    extractionTimer,
    combatLogs,
    selectedTool,
    setSelectedTool,
    isMuted,
    toggleMute,
    showHelp,
    setShowHelp,
    dimensionalStability,
    realityCollapseActive,
    collapseRingDepth,
    raidDuration,
    overclockStacks,
    overclockTimer,
    apexBossActive,
    apexHp,
    raidFinished,
    extractSummary,
    handleDeployToDungeon,
    handleReturnToOverworld,
    handleExtractNow,
    handleMove,
    handlePlantCharge,
    handleIgniteFlare,
    handleDeployGas,
    handleUseMedkit,
    handleDeployLure,
    handleToggleWeapon,
    handleToggleBuildMode,
    handleSelectBlueprint,
    handleCanvasMouseMove,
    handleCanvasWheel,
    handleCanvasClick,
    handleConfirmEndRaid,
  } = useRaidSimulation({
    initialCharges,
    initialMedkits,
    initialFlares,
    initialLures,
    sectorId,
    hasHazmatSuit,
    equippedWeapon,
    unlockedWeapons,
    onEndRaid,
  });

  return (
    <div
      id="raid-viewport-container"
      ref={containerRef}
      className="relative w-full h-screen bg-[#090d13] overflow-hidden select-none"
    >
      {/* 2D Simulation Canvas */}
      <canvas
        id="raid-game-canvas"
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
        onWheel={handleCanvasWheel}
        className="w-full h-full cursor-crosshair block"
      />

      {/* TOP HUD BAR */}
      <RaidHUD
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        overclockStacks={overclockStacks}
        overclockTimer={overclockTimer}
        scrapCollected={scrapCollected}
        bankedScrap={bankedScrap}
        isInsideSanctuary={isInsideSanctuary}
        currentZoneName={currentZoneName}
        currentMapType={currentMapType}
        onExtractNow={handleExtractNow}
        realityCollapseActive={realityCollapseActive}
        dimensionalStability={dimensionalStability}
        collapseRingDepth={collapseRingDepth}
        raidDuration={raidDuration}
        sectorId={sectorId}
        hasHazmatSuit={hasHazmatSuit}
        activeWeapon={activeWeapon}
        extractionTimer={extractionTimer}
        isMuted={isMuted}
        onToggleWeapon={handleToggleWeapon}
        onOpenInspector={onOpenInspector}
        onToggleMute={toggleMute}
        onOpenHelp={() => setShowHelp(true)}
      />

      {/* OVERWORLD: GATE PROXIMITY DEPLOYMENT POPUP */}
      {nearbyDungeonGate && currentMapType === 'overworld' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#0f172a]/95 backdrop-blur border-2 border-[#38bdf8] px-5 py-3 rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.4)] flex items-center gap-4 animate-bounce">
          <div className="w-10 h-10 rounded-lg bg-[#0284c7]/30 border border-[#38bdf8] flex items-center justify-center text-[#38bdf8]">
            <DoorOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#38bdf8] font-bold tracking-widest uppercase">
              CARDINAL GATEWAY DETECTED
            </div>
            <div className="text-sm font-mono font-black text-white">
              {nearbyDungeonGate.name}
            </div>
          </div>
          <button
            onClick={() => handleDeployToDungeon(nearbyDungeonGate.dungeonId)}
            className="bg-sky-500 hover:bg-sky-400 text-black font-mono font-black px-4 py-2 rounded-lg transition cursor-pointer text-xs flex items-center gap-1.5 shadow-lg"
          >
            DEPLOY [E]
          </button>
        </div>
      )}

      {/* DUNGEON: ACTIVE EXPEDITION BANNER */}
      {currentMapType === 'dungeon' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#1c1917]/90 backdrop-blur border border-rose-500/60 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <div className="text-xs font-mono text-white">
            <span className="text-rose-400 font-bold">DUNGEON EXPEDITION:</span> Enemy & Treasure Zones Active.
            {extractionTimer > 0 ? (
              <span className="ml-1 text-emerald-400 font-bold">
                EXTRACTING: {extractionTimer.toFixed(1)}s / 5.0s
              </span>
            ) : (
              <span className="ml-1 text-slate-300">
                Tether Pad at Center (100, 100).
              </span>
            )}
          </div>
          <button
            onClick={handleExtractNow}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs px-3 py-1 rounded transition cursor-pointer flex items-center gap-1 shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            EXTRACT
          </button>
        </div>
      )}

      {/* OVERWORLD: CARDINAL DUNGEON EXPEDITIONS CONSOLE (COLLAPSIBLE TACTICAL DOCK) */}
      {currentMapType === 'overworld' && (
        <div className="absolute top-20 right-4 z-20 bg-[#0b1320]/90 backdrop-blur border border-[#1e293b] p-3 rounded-xl shadow-2xl max-w-xs hidden xl:block">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2 border-b border-slate-700/60 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>CARDINAL EXPEDITION GATES</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-600/40 px-1.5 py-0.5 rounded">
              OVERWORLD SAFE
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            {/* North Gate */}
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-sky-500/50 transition">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-sky-950 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-[10px]">
                  N
                </span>
                <div>
                  <div className="text-white font-bold">Robotics Labs</div>
                  <div className="text-[9px] text-slate-400">North Point (100, 68)</div>
                </div>
              </div>
              <button
                onClick={() => handleDeployToDungeon('nw_robotics')}
                className="bg-sky-600/30 hover:bg-sky-500 text-sky-300 hover:text-black border border-sky-500/50 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
              >
                DEPLOY
              </button>
            </div>

            {/* East Gate */}
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px]">
                  E
                </span>
                <div>
                  <div className="text-white font-bold">Bio-Containment</div>
                  <div className="text-[9px] text-slate-400">East Point (132, 100)</div>
                </div>
              </div>
              <button
                onClick={() => handleDeployToDungeon('ne_biolab')}
                className="bg-emerald-600/30 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/50 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
              >
                DEPLOY
              </button>
            </div>

            {/* South Gate */}
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-[10px]">
                  S
                </span>
                <div>
                  <div className="text-white font-bold">Volatile Foundry</div>
                  <div className="text-[9px] text-slate-400">South Point (100, 132)</div>
                </div>
              </div>
              <button
                onClick={() => handleDeployToDungeon('sw_foundry')}
                className="bg-amber-600/30 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
              >
                DEPLOY
              </button>
            </div>

            {/* West Gate */}
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-purple-950 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-[10px]">
                  W
                </span>
                <div>
                  <div className="text-white font-bold">The Reality Tear</div>
                  <div className="text-[9px] text-slate-400">West Point (68, 100)</div>
                </div>
              </div>
              <button
                onClick={() => handleDeployToDungeon('se_void')}
                className="bg-purple-600/30 hover:bg-purple-500 text-purple-300 hover:text-black border border-purple-500/50 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
              >
                DEPLOY
              </button>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
            <span className="text-sky-400 font-bold">Sanctuary Layout:</span> Operative Home at Center (100, 100), Corner Specialist Facilities at NW, NE, SW, SE.
          </div>
        </div>
      )}

      {/* EMERGENCY COLLAPSE & APEX BOSS BANNERS */}
      <RaidBossBanners
        realityCollapseActive={realityCollapseActive}
        collapseRingDepth={collapseRingDepth}
        apexBossActive={apexBossActive}
        apexHp={apexHp}
      />

      {/* COMBAT & SYSTEMIC EVENT TICKER */}
      <RaidCombatTicker combatLogs={combatLogs} />

      {/* ACTION HOTBAR */}
      <RaidHotbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        chargesLeft={chargesLeft}
        flaresLeft={flaresLeft}
        gasVialsLeft={gasVialsLeft}
        medkitsLeft={medkitsLeft}
        luresLeft={luresLeft}
        realityCollapseActive={realityCollapseActive}
        activeWeapon={activeWeapon}
        currentMapType={currentMapType}
        onPlantCharge={handlePlantCharge}
        onIgniteFlare={handleIgniteFlare}
        onDeployGas={handleDeployGas}
        onUseMedkit={handleUseMedkit}
        onDeployLure={handleDeployLure}
        onToggleWeapon={handleToggleWeapon}
      />

      {/* BASE EXPANSION & OPERATIONAL BUFFS DOCK (ADR 011) */}
      <BuildModeDock
        isBuildMode={isBuildMode}
        selectedBlueprintId={selectedBlueprintId}
        unlockedBlueprints={unlockedBlueprints}
        bankedScrap={bankedScrap}
        scrapCollected={scrapCollected}
        isInsideSanctuary={isInsideSanctuary}
        activeBuffs={activeBuffs}
        onToggleBuildMode={handleToggleBuildMode}
        onSelectBlueprint={handleSelectBlueprint}
      />

      {/* VIRTUAL D-PAD CONTROLS */}
      <RaidVirtualDpad onMove={handleMove} />

      {/* INSTRUCTIONS MODAL POPUP */}
      <RaidHelpModal showHelp={showHelp} onClose={() => setShowHelp(false)} />

      {/* EXTRACTION / KIA RESULT MODAL */}
      <RaidResolutionModal
        raidFinished={raidFinished}
        extractSummary={extractSummary}
        onConfirmEndRaid={handleConfirmEndRaid}
      />
    </div>
  );
};
