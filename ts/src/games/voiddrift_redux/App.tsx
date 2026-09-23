import { useEffect, useRef, useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { VoidDriftEngine } from './simulation/engine';
import { OrbitalCanvas } from './components/OrbitalCanvas';
import { SmelterPanel } from './components/SmelterPanel';
import { FSMInspector } from './components/FSMInspector';
import { DetectionRadarPanel } from './components/DetectionRadarPanel';
import { DispatchLogPanel } from './components/DispatchLogPanel';
import { SignalStrip } from './components/SignalStrip';
import { SimulationControlsPanel } from './components/SimulationControlsPanel';
import { PassFailDiagnosticsModal } from './components/PassFailDiagnosticsModal';
import { SimulationConfig, SimulationStats } from './types';
import { ShieldCheck, Zap, Anchor, Layers, Clock, Cpu, Flame } from 'lucide-react';

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const engineRef = useRef<VoidDriftEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new VoidDriftEngine();
  }

  const engine = engineRef.current;

  const [stats, setStats] = useState<SimulationStats>(engine.stats);
  const [config, setConfig] = useState<SimulationConfig>(engine.config);
  const [selectedAsteroidId, setSelectedAsteroidId] = useState<string | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Sync state periodically from engine for React UI
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...engine.stats });
    }, 100);
    return () => clearInterval(interval);
  }, [engine]);

  // Control Handlers
  const handleTogglePlayPause = () => {
    engine.stats.isRunning = !engine.stats.isRunning;
    setStats({ ...engine.stats });
  };

  const handleSetSimSpeed = (speed: number) => {
    engine.stats.simSpeed = speed;
    setStats({ ...engine.stats });
  };

  const handleResetSimulation = () => {
    engine.initWorld();
    setSelectedAsteroidId(null);
    setSelectedDroneId(null);
    setStats({ ...engine.stats });
  };

  const handleUpdateConfig = (newConfig: Partial<SimulationConfig>) => {
    engine.setConfig(newConfig);
    setConfig({ ...engine.config });
  };

  const handleUpdateFleet = (scouts: number, miners: number, haulers: number) => {
    engine.updateFleetSizes(scouts, miners, haulers);
    setConfig({ ...engine.config });
    setStats({ ...engine.stats });
  };

  const handleManualMiningDispatch = (droneId: string, asteroidId: string) => {
    engine.triggerManualMiningDispatch(droneId, asteroidId);
    setStats({ ...engine.stats });
  };

  const handleManualHaulerTug = (haulerId: string, asteroidId: string) => {
    engine.triggerManualHaulerTug(haulerId, asteroidId);
    setStats({ ...engine.stats });
  };

  const handleToggleMiningDroneTier = (droneId: string) => {
    engine.toggleMiningDroneTier(droneId);
    setStats({ ...engine.stats });
  };

  const handleStartSmelt = (inputAmount: number) => {
    engine.startSmeltAluminum(inputAmount);
    setStats({ ...engine.stats });
  };

  return (
    <>
      <GameShell
        gameLabel="VoidDrift Redux"
        gameId="voiddrift_redux"
        phase="PHASE 4: GAS-BEARING BRANCH & BREAKER TIER"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        className="bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950"
        mainClassName="game-shell-main--scrollable"
        headerExtra={
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-mono font-bold text-lg shadow-[0_0_10px_rgba(236,72,153,0.3)] shrink-0">
              VD
            </div>
            <button
              id="open-diagnostics-btn"
              onClick={() => setIsModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-2 transition shrink-0 ${
                stats.boundaryTelemetry.isBoundaryValid && stats.boundaryTelemetry.ring2GatedMiningValid
                  ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-rose-950/50 border-rose-500/60 text-rose-300 hover:bg-rose-900/50 animate-pulse'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Pass/Fail Telemetry
            </button>
            <span className="text-[11px] text-slate-400 font-mono hidden md:block">
              VoidDrift Core Loop — Gas Core Branching • Mk II Breaker In-Place Drill • Burst Fragments & Hauler Retrieval
            </span>
          </div>
        }
        statusArea={
          <div className="flex items-center gap-2.5 font-mono text-xs">
            {/* Metal Harvested */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Metal
              </span>
              <span className="text-xs font-bold text-amber-400">{stats.resources?.Metal || 0} MT</span>
            </div>

            {/* Raw Aluminum */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Anchor className="w-3 h-3 text-purple-400" /> Raw Al
              </span>
              <span className="text-xs font-bold text-purple-300">{stats.resources?.RawAluminum || 0} MT</span>
            </div>

            {/* Refined Aluminum */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" /> Refined Al
              </span>
              <span className="text-xs font-bold text-cyan-300">{stats.resources?.Aluminum || 0} MT</span>
            </div>

            {/* H3 Gas */}
            <div className="bg-slate-950 border border-pink-900/60 rounded-lg px-2.5 py-1 flex flex-col items-start shadow-[0_0_8px_rgba(236,72,153,0.15)]">
              <span className="text-[9px] text-pink-400 uppercase tracking-wider flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3 text-pink-400" /> H3 Gas
              </span>
              <span className="text-xs font-bold text-pink-300">{stats.resources?.H3Gas || 0} MT</span>
            </div>

            {/* Closed Loops */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex-col items-start hidden md:flex">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" /> Mining Loops
              </span>
              <span className="text-xs font-bold text-slate-200">{stats.closedLoopsCompleted}</span>
            </div>

            {/* Successful Tugs */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col items-start">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Anchor className="w-3 h-3 text-purple-400" /> Ring 2 Tugs
              </span>
              <span className="text-xs font-bold text-purple-300">{stats.successfulTugsCompleted}</span>
            </div>

            {/* Avg Cycle Time */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex-col items-start hidden sm:flex">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> Avg Loop
              </span>
              <span className="text-xs font-bold text-emerald-300">{stats.avgCycleTimeSec}s</span>
            </div>
          </div>
        }
        footer={<SignalStrip logs={engine.logs} />}
      >
        {/* Main Workspace Layout */}
        <main className="flex-1 p-3 md:p-5 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Orbital Canvas & Simulation Parameter Tuning (7 cols) */}
          <section id="canvas-section" className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex-1 min-h-[520px]">
              <OrbitalCanvas
                engine={engine}
                selectedAsteroidId={selectedAsteroidId}
                selectedDroneId={selectedDroneId}
                onSelectAsteroid={setSelectedAsteroidId}
                onSelectDrone={setSelectedDroneId}
                config={config}
                onUpdateConfig={handleUpdateConfig}
              />
            </div>

            <SimulationControlsPanel
              config={config}
              stats={stats}
              onUpdateConfig={handleUpdateConfig}
              onUpdateFleet={handleUpdateFleet}
              onTogglePlayPause={handleTogglePlayPause}
              onSetSimSpeed={handleSetSimSpeed}
              onResetSimulation={handleResetSimulation}
            />
          </section>

          {/* Right Column: Resource Smelting Panel, FSM Inspector, Detection Radar Queue & Terminal Logs (5 cols) */}
          <section id="telemetry-section" className="lg:col-span-5 flex flex-col gap-4">
            {/* Multi-Resource Storage & Smelting Foundation */}
            <SmelterPanel
              stats={stats}
              onStartSmelt={handleStartSmelt}
            />

            {/* FSM Inspector for both Mining Fleet and Tug Hauler Fleet */}
            <FSMInspector
              miningDrones={engine.miningDrones}
              haulers={engine.haulers}
              selectedDroneId={selectedDroneId}
              onSelectDrone={setSelectedDroneId}
              onToggleDroneTier={handleToggleMiningDroneTier}
            />

            {/* Target Queue & Manual Dispatch Panel */}
            <DetectionRadarPanel
              asteroids={engine.asteroids}
              miningDrones={engine.miningDrones}
              haulers={engine.haulers}
              selectedAsteroidId={selectedAsteroidId}
              onSelectAsteroid={setSelectedAsteroidId}
              onManualMiningDispatch={handleManualMiningDispatch}
              onManualHaulerTug={handleManualHaulerTug}
              ring1OuterRadius={config.ring1OuterRadius}
            />

            {/* Realtime Terminal Activity Log */}
            <DispatchLogPanel logs={engine.logs} />
          </section>
        </main>
      </GameShell>

      {/* Pass/Fail Telemetry Diagnostics Modal */}
      <PassFailDiagnosticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stats={stats}
      />
    </>
  );
}
