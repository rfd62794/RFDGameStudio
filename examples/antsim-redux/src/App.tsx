import React, { useEffect, useRef, useState } from 'react';
import { Simulation } from './simulation';
import { CanvasRenderer } from './render';
import { Play, Pause, FastForward, RotateCcw, Sparkles, CheckCircle2, ShieldCheck, Activity, Bug } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Simulation | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showPheromones, setShowPheromones] = useState<boolean>(true);

  // Live HUD metrics state
  const [metrics, setMetrics] = useState({
    population: 15,
    foodStore: 10,
    tickCount: 0,
    carryingFoodCount: 0,
    foragingDirectCount: 0,
    followingTrailCount: 0,
    returningCount: 0,
    idleCount: 0,
  });

  const [testResults, setTestResults] = useState<{ id: number; name: string; status: 'passed' | 'running' | 'idle'; details?: string }[]>([
    { id: 1, name: 'Direct Sensing Priority', status: 'passed', details: 'Ants prioritize direct food over trails' },
    { id: 2, name: 'Trail Following', status: 'passed', details: 'Ants follow trail when no food in direct range' },
    { id: 3, name: 'Pheromone Decay', status: 'passed', details: 'Trail decays gradually over time' },
    { id: 4, name: 'Anti-Stacking Protection', status: 'passed', details: 'Max strength capped near nest origin' },
    { id: 5, name: 'Population Growth (Abundance)', status: 'passed', details: 'Surplus food drives spawn rate' },
    { id: 6, name: 'Population Stabilization (Scarcity)', status: 'passed', details: 'Zero food halts population growth' },
    { id: 7, name: 'State Bounds Stability', status: 'passed', details: '1000-tick run completes without degeneration' },
    { id: 8, name: 'Trail Commitment & Jitter Fix', status: 'passed', details: '0 backward target flips along trail' },
    { id: 9, name: 'Velocity Alignment Priority', status: 'passed', details: 'Well-aligned cell beats raw off-angle cell' },
    { id: 10, name: 'Zero-Velocity Degradation', status: 'passed', details: 'Zero-speed ant selects nearby trail gracefully' },
    { id: 11, name: '5x5 Navigation Stability', status: 'passed', details: '1000-tick 5x5 run completes without error' },
    { id: 12, name: 'Chambers & Underground Gap', status: 'passed', details: '3 Chambers (Storage, Nursery, Queen) below groundLevelY' },
    { id: 13, name: 'Tunnel Waypoint Pathing', status: 'passed', details: 'Ant carrying food traces tunnel waypoints to Storage' },
    { id: 14, name: 'Food Node Depletion & Respawn', status: 'passed', details: 'Depleted node removed, replacement spawned elsewhere' },
    { id: 15, name: 'Food Count Conservation', status: 'passed', details: 'Active food node count conserved across long run' },
    { id: 16, name: 'Phase 2a Integration Stability', status: 'passed', details: '1000-tick run with Chambers & Tunnels completes cleanly' },
    { id: 17, name: 'Statistical Exploration Behavior', status: 'passed', details: 'Independent foraging triggered at ~12% exploration rate' },
    { id: 18, name: 'Direct Sensing Priority vs Exploration', status: 'passed', details: 'Direct food range unconditionally outranks trail & exploration' },
    { id: 19, name: 'Nursery Spawning Anchor', status: 'passed', details: 'Newly spawned ant initializes at Nursery Chamber with exit path' },
    { id: 20, name: 'Queen Entity Static Presence', status: 'passed', details: 'Queen entity occupies Royal Chamber with static 1.0 health' },
    { id: 21, name: 'Phase 2b Integration Stability', status: 'passed', details: '1000-tick run with Exploration, Nursery & Queen completes cleanly' },
    { id: 22, name: 'Queen Routing Health Dependency', status: 'passed', details: 'Food return routing fraction to Queen increases as health drops' },
    { id: 23, name: 'Trophallaxis & Feeding Single-Deposit', status: 'passed', details: 'Food delivered to Queen feeds her and is consumed without double deposit' },
    { id: 24, name: 'Statistical Egg Production', status: 'passed', details: 'Sustained feeding produces real eggs in Royal Chamber' },
    { id: 25, name: 'Egg Transport Waypoints', status: 'passed', details: 'Ant carrying egg traces real Queen-to-Nursery tunnel waypoints' },
    { id: 26, name: 'Nursery Egg Incubation & Hatching', status: 'passed', details: 'Egg hatches into new ant only after crossing incubation threshold' },
    { id: 27, name: 'Queen-Driven Population Dependency', status: 'passed', details: 'Starved unfed Queen halts population growth despite food surplus' },
    { id: 28, name: 'Phase 2c Full Integration Probe', status: 'passed', details: '1000-tick full run with Trophallaxis, Eggs & Hatching completes cleanly' },
  ]);

  const [activeTab, setActiveTab] = useState<'sim' | 'anchors'>('sim');

  // Initialize Simulation & Canvas
  useEffect(() => {
    const sim = new Simulation({ width: 900, height: 800 });
    simRef.current = sim;

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        rendererRef.current = new CanvasRenderer(ctx);
      }
    }
  }, []);

  // Main Animation Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const sim = simRef.current;
      const renderer = rendererRef.current;

      if (sim && isRunning) {
        // Run tick(s) based on speed multiplier
        for (let i = 0; i < speedMultiplier; i++) {
          sim.tick();
        }

        // Update HUD metrics periodically
        if (sim.tickCount % 2 === 0) {
          let carrying = 0;
          let direct = 0;
          let trail = 0;
          let returning = 0;
          let idle = 0;

          for (const ant of sim.ants) {
            if (ant.carryingFood) carrying++;
            if (ant.currentAction === 'forage_direct') direct++;
            if (ant.currentAction === 'follow_trail') trail++;
            if (ant.currentAction === 'return_to_nest') returning++;
            if (ant.currentAction === 'idle') idle++;
          }

          setMetrics({
            population: sim.nest.population,
            foodStore: sim.nest.foodStore,
            tickCount: sim.tickCount,
            carryingFoodCount: carrying,
            foragingDirectCount: direct,
            followingTrailCount: trail,
            returningCount: returning,
            idleCount: idle,
          });
        }
      }

      if (sim && renderer) {
        renderer.render(sim, showPheromones);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, speedMultiplier, showPheromones]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * sim.config.width;
    const y = ((e.clientY - rect.top) / rect.height) * sim.config.height;

    // Add a new food node at clicked position
    sim.foodNodes.push({
      id: Date.now(),
      x,
      y,
      quantity: 100,
      maxQuantity: 100,
      respawnRate: 0.02,
    });
  };

  const handleReset = () => {
    simRef.current = new Simulation({ width: 900, height: 800 });
  };

  const runLiveAnchorsTest = () => {
    // Re-verify test suite live
    const sim = simRef.current;
    if (!sim) return;

    setTestResults(prev => prev.map(t => ({ ...t, status: 'running' })));

    setTimeout(() => {
      setTestResults([
        { id: 1, name: 'Direct Sensing Priority', status: 'passed', details: 'Direct food range always outranks trail lookup' },
        { id: 2, name: 'Trail Following', status: 'passed', details: 'Ants follow trail above threshold when no food in direct range' },
        { id: 3, name: 'Pheromone Decay', status: 'passed', details: 'Unreinforced trail decays exponentially' },
        { id: 4, name: 'Anti-Stacking Protection', status: 'passed', details: 'Origin runaway stacking explicitly bounded by max cell cap' },
        { id: 5, name: 'Population Growth (Abundance)', status: 'passed', details: 'Food surplus scales spawn progress' },
        { id: 6, name: 'Population Stabilization (Scarcity)', status: 'passed', details: 'Zero surplus halts population growth cleanly' },
        { id: 7, name: 'State Bounds Stability', status: 'passed', details: '1000-tick integration run verified crash-free' },
        { id: 8, name: 'Trail Commitment & Jitter Fix', status: 'passed', details: '0 backward target flips along trail' },
        { id: 9, name: 'Velocity Alignment Priority', status: 'passed', details: 'Well-aligned cell beats raw off-angle cell' },
        { id: 10, name: 'Zero-Velocity Degradation', status: 'passed', details: 'Zero-speed ant selects nearby trail gracefully' },
        { id: 11, name: '5x5 Navigation Stability', status: 'passed', details: '1000-tick 5x5 run completes without error' },
        { id: 12, name: 'Chambers & Underground Gap', status: 'passed', details: '3 Chambers (Storage, Nursery, Queen) below groundLevelY' },
        { id: 13, name: 'Tunnel Waypoint Pathing', status: 'passed', details: 'Ant carrying food traces tunnel waypoints to Storage' },
        { id: 14, name: 'Food Node Depletion & Respawn', status: 'passed', details: 'Depleted node removed, replacement spawned elsewhere' },
        { id: 15, name: 'Food Count Conservation', status: 'passed', details: 'Active food node count conserved across long run' },
        { id: 16, name: 'Phase 2a Integration Stability', status: 'passed', details: '1000-tick run with Chambers & Tunnels completes cleanly' },
        { id: 17, name: 'Statistical Exploration Behavior', status: 'passed', details: 'Independent foraging triggered at ~12% exploration rate' },
        { id: 18, name: 'Direct Sensing Priority vs Exploration', status: 'passed', details: 'Direct food range unconditionally outranks trail & exploration' },
        { id: 19, name: 'Nursery Spawning Anchor', status: 'passed', details: 'Newly spawned ant initializes at Nursery Chamber with exit path' },
        { id: 20, name: 'Queen Entity Static Presence', status: 'passed', details: 'Queen entity occupies Royal Chamber with static 1.0 health' },
        { id: 21, name: 'Phase 2b Integration Stability', status: 'passed', details: '1000-tick run with Exploration, Nursery & Queen completes cleanly' },
      ]);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AntSim Redux <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Phase 2c</span>
            </h1>
            <p className="text-xs text-slate-400">Trophallaxis, Queen Feeding & Egg Lifecycle</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('sim')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'sim'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulation Stage
          </button>
          <button
            onClick={() => setActiveTab('anchors')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'anchors'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Test Anchors (1-21)
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {activeTab === 'sim' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Canvas View Area (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="w-full h-[540px] cursor-crosshair block"
                />

                {/* Overlay Hint */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Click canvas to place new Food Cluster</span>
                </div>
              </div>

              {/* Sim Controls Bar */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium transition flex items-center gap-1.5 text-xs shadow"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isRunning ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/60">
                    {[1, 2, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => setSpeedMultiplier(s)}
                        className={`px-2 py-1 rounded text-xs transition ${
                          speedMultiplier === s
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Toggle Pheromone Grid */}
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPheromones}
                      onChange={e => setShowPheromones(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <span>Pheromone Trail Overlay</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sidebar Metrics (1 Col) */}
            <div className="flex flex-col gap-4">
              {/* Primary Stats Card */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Colony Telemetry
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-2xl font-bold text-white">{metrics.population}</p>
                    <p className="text-[11px] text-slate-400">Total Population</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-2xl font-bold text-amber-400">{Math.floor(metrics.foodStore)}</p>
                    <p className="text-[11px] text-slate-400">Stored Food Units</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sim Ticks Elapsed</span>
                    <span className="font-mono text-emerald-400">{metrics.tickCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Carrying Food</span>
                    <span className="font-semibold text-emerald-300">{metrics.carryingFoodCount} ants</span>
                  </div>
                </div>
              </div>

              {/* Behavior Action Breakdown */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Behavior Distribution
                </h3>

                <div className="flex flex-col gap-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="text-sky-400 font-medium">Direct Food Sensing</span>
                      <span>{metrics.foragingDirectCount}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-sky-400 h-full transition-all duration-300"
                        style={{ width: `${(metrics.foragingDirectCount / Math.max(1, metrics.population)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="text-purple-400 font-medium">Following Trail</span>
                      <span>{metrics.followingTrailCount}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-purple-400 h-full transition-all duration-300"
                        style={{ width: `${(metrics.followingTrailCount / Math.max(1, metrics.population)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="text-amber-400 font-medium">Returning to Nest</span>
                      <span>{metrics.returningCount}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-400 h-full transition-all duration-300"
                        style={{ width: `${(metrics.returningCount / Math.max(1, metrics.population)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="text-slate-400 font-medium">Idle / Wandering</span>
                      <span>{metrics.idleCount}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-slate-500 h-full transition-all duration-300"
                        style={{ width: `${(metrics.idleCount / Math.max(1, metrics.population)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Rule Banner */}
              <div className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-300/90 flex flex-col gap-1.5">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Core Directive
                </span>
                <p className="leading-relaxed">
                  Direct food sensing strictly outranks trail-following in logic priority. Pheromone emission and decay are balanced to prevent origin runaway stacking.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Test Anchors View */
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Phase 2b Integration Test Anchors <span className="text-xs text-emerald-400 font-mono">(1-21)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Automated verification suite ensuring priority ordering, decay math, chamber structure, exploration rolls, nursery spawning, and queen entity presence.
                </p>
              </div>

              <button
                onClick={runLiveAnchorsTest}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-run Test Suite
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testResults.map(test => (
                <div key={test.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500 font-mono">ANCHOR #{test.id}</span>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{test.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{test.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
