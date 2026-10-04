import React, { useEffect, useRef, useState } from 'react';
import { Simulation } from './simulation';
import { CanvasRenderer } from './render';
import { Play, Pause, FastForward, RotateCcw, Sparkles, ShieldCheck, Activity, Bug } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-3 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AntSim Redux
            </h1>
            <p className="text-xs text-slate-400">Drop food and watch the colony find it</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 min-w-0 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {(
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Canvas View Area (3 Cols) */}
            <div className="lg:col-span-3 min-w-0 flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="w-full h-[320px] sm:h-[540px] cursor-crosshair block"
                />

                {/* Overlay Hint */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Click canvas to place new Food Cluster</span>
                </div>
              </div>

              {/* Sim Controls Bar */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
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

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
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
                  <ShieldCheck className="w-4 h-4" /> How the ants decide
                </span>
                <p className="leading-relaxed">
                  Ants head straight for food they can sense. Otherwise they follow the strongest scent trail. Trails fade over time, so one path never takes over.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
