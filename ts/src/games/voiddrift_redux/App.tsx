import React, { useEffect, useRef, useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { VoidDriftEngine } from './simulation/engine';
import { Header } from './components/Header';
import { OrbitalCanvas } from './components/OrbitalCanvas';
import { SmelterPanel } from './components/SmelterPanel';
import { FSMInspector } from './components/FSMInspector';
import { DetectionRadarPanel } from './components/DetectionRadarPanel';
import { DispatchLogPanel } from './components/DispatchLogPanel';
import { SignalStrip } from './components/SignalStrip';
import { SimulationControlsPanel } from './components/SimulationControlsPanel';
import { PassFailDiagnosticsModal } from './components/PassFailDiagnosticsModal';
import { SimulationConfig, SimulationStats } from './types';

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
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
    <div id="voiddrift-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar with Live KPI Stream */}
      <Header
        stats={stats}
        onOpenDiagnostics={() => setIsModalOpen(true)}
      />

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

      {/* Pass/Fail Telemetry Diagnostics Modal */}
      <PassFailDiagnosticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stats={stats}
      />

      {/* ECHO Signal Strip - Persistent Operational Voice Stream */}
      <SignalStrip logs={engine.logs} />
    </div>
  );
}
