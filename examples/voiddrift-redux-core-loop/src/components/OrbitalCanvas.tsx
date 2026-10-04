import React, { useEffect, useRef, useState } from 'react';
import { Asteroid, Drone, Fragment, Scout, SimulationConfig, Vector2D } from '../types';
import { VoidDriftEngine } from '../simulation/engine';
import { Eye, Layers, Radar, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface OrbitalCanvasProps {
  engine: VoidDriftEngine;
  selectedAsteroidId: string | null;
  selectedDroneId: string | null;
  onSelectAsteroid: (id: string | null) => void;
  onSelectDrone: (id: string | null) => void;
  config: SimulationConfig;
  onUpdateConfig: (cfg: Partial<SimulationConfig>) => void;
}

export const OrbitalCanvas: React.FC<OrbitalCanvasProps> = ({
  engine,
  selectedAsteroidId,
  selectedDroneId,
  onSelectAsteroid,
  onSelectDrone,
  config,
  onUpdateConfig,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [zoom, setZoom] = useState<number>(1.0);

  // Resize observer to maintain responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Wheel listener for scroll zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      setZoom((prevZoom) => {
        const nextZoom = prevZoom * zoomFactor;
        return Math.min(Math.max(nextZoom, 0.35), 3.0);
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Update Engine simulation
      engine.update(dt);

      // Render Graphics
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Apply Zoom Transformation relative to Canvas Center
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX, -centerY);

      // Draw background space grid with gravitational lensed starfield
      drawSpaceBackground(ctx, canvas.width, canvas.height, centerX, centerY, currentTime);

      // Draw Ring Boundaries (Ring 1 & Ring 2) if enabled
      if (config.showBoundaryRadii) {
        drawRingBoundaries(
          ctx,
          centerX,
          centerY,
          config.ring1InnerRadius,
          config.ring1OuterRadius,
          config.ring2InnerRadius,
          config.ring2OuterRadius
        );
      }

      // Draw Central Command Hub
      drawCommandHub(ctx, centerX, centerY, currentTime);

      // Draw Asteroids (Ring 1 and Ring 2)
      for (const asteroid of engine.asteroids) {
        if (asteroid.isDepleted) continue;
        drawAsteroid(
          ctx,
          centerX + asteroid.x,
          centerY + asteroid.y,
          asteroid,
          selectedAsteroidId === asteroid.id
        );
      }

      // Draw Scattered Ore Fragments in Ring 2
      for (const fragment of engine.fragments) {
        drawFragment(ctx, centerX + fragment.x, centerY + fragment.y, fragment);
      }

      // Draw Scout Drones & Radar Scanner
      for (const scout of engine.scouts) {
        drawScout(
          ctx,
          centerX + scout.x,
          centerY + scout.y,
          scout,
          engine.asteroids,
          centerX,
          centerY,
          config.showRadarBeams
        );
      }

      // Draw Mining Drones
      for (const miner of engine.miningDrones) {
        drawMiningDrone(
          ctx,
          centerX + miner.x,
          centerY + miner.y,
          miner,
          centerX,
          centerY,
          selectedDroneId === miner.id,
          config.showStateLabels
        );
      }

      // Draw Tug Haulers
      for (const hauler of engine.haulers) {
        drawTugHauler(
          ctx,
          centerX + hauler.x,
          centerY + hauler.y,
          hauler,
          engine.asteroids,
          centerX,
          centerY,
          selectedDroneId === hauler.id,
          config.showStateLabels
        );
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, engine, selectedAsteroidId, selectedDroneId, config, zoom]);

  // Canvas Click Handler with Zoom compensation
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates (centered at hub)
    const clickX = (mouseX - canvas.width / 2) / zoom;
    const clickY = (mouseY - canvas.height / 2) / zoom;

    // Check hit on Asteroids
    let hitAsteroid: Asteroid | null = null;
    for (const asteroid of engine.asteroids) {
      if (asteroid.isDepleted) continue;
      const dist = Math.hypot(asteroid.x - clickX, asteroid.y - clickY);
      if (dist <= asteroid.size + 12) {
        hitAsteroid = asteroid;
        break;
      }
    }

    if (hitAsteroid) {
      onSelectAsteroid(hitAsteroid.id);
      engine.triggerManualDispatch(hitAsteroid.id);
      return;
    }

    // Check hit on Drones (Mining or Haulers)
    let hitDrone: Drone | null = null;
    const allDrones = [...engine.miningDrones, ...engine.haulers];
    for (const drone of allDrones) {
      const dist = Math.hypot(drone.x - clickX, drone.y - clickY);
      if (dist <= 20) {
        hitDrone = drone;
        break;
      }
    }

    if (hitDrone) {
      onSelectDrone(hitDrone.id);
      return;
    }

    // Clear selection on background click
    onSelectAsteroid(null);
    onSelectDrone(null);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.35));
  const handleResetZoom = () => setZoom(1.0);

  return (
    <div id="orbital-canvas-container" ref={containerRef} className="relative w-full h-full min-h-[520px] bg-slate-950 overflow-hidden flex flex-col justify-between">
      {/* HTML5 Canvas */}
      <canvas
        id="voiddrift-main-canvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-crosshair w-full h-full"
      />

      {/* Floating Canvas View Controls */}
      <div id="canvas-overlay-toolbar" className="relative z-10 p-3 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        {/* Left Badge */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 flex items-center gap-2 pointer-events-auto backdrop-blur shadow-md">
          <Radar className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>2-Ring Sector View • Scroll Wheel To Zoom</span>
        </div>

        {/* Right Toggle Buttons & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom Control Group */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-xs font-mono flex items-center gap-1 backdrop-blur shadow-md">
            <button
              id="zoom-out-btn"
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
              title="Zoom Out (Scroll Down)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="zoom-reset-btn"
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-[11px] font-bold text-cyan-400 bg-slate-950 border border-slate-800 rounded hover:border-slate-700 transition"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              id="zoom-in-btn"
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
              title="Zoom In (Scroll Up)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Visibility Toggles */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-xs font-mono flex items-center gap-1 backdrop-blur shadow-md">
            <button
              id="toggle-radar-beams-btn"
              onClick={() => onUpdateConfig({ showRadarBeams: !config.showRadarBeams })}
              className={`px-2 py-1 rounded text-[11px] flex items-center gap-1.5 transition ${
                config.showRadarBeams
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radar className="w-3.5 h-3.5" /> Radar
            </button>

            <button
              id="toggle-boundary-radii-btn"
              onClick={() => onUpdateConfig({ showBoundaryRadii: !config.showBoundaryRadii })}
              className={`px-2 py-1 rounded text-[11px] flex items-center gap-1.5 transition ${
                config.showBoundaryRadii
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Ring Bounds
            </button>

            <button
              id="toggle-fsm-labels-btn"
              onClick={() => onUpdateConfig({ showStateLabels: !config.showStateLabels })}
              className={`px-2 py-1 rounded text-[11px] flex items-center gap-1.5 transition ${
                config.showStateLabels
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> State Tags
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Instructions Footer */}
      <div id="canvas-footer-legend" className="relative z-10 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pointer-events-auto">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Scout
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Mk I Miner (Ring 1)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50"></span> Mk II Breaker (In-Place Gas Drill)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Tug Hauler
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-pink-950 border border-pink-400 shadow-[0_0_6px_rgba(236,72,153,0.5)]"></span> Gas Asteroid
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-amber-300 border border-amber-500"></span> Ore Fragment
          </span>
        </div>
        <div className="text-slate-500 hidden lg:block">
          Use mouse wheel / trackpad to zoom in or out
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Canvas Drawing Helper Functions & Lensed Starfield
// ----------------------------------------------------------------------

interface LensedStar {
  baseAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  baseAlpha: number;
  color: string;
}

const BACKGROUND_STARS: LensedStar[] = Array.from({ length: 160 }, (_, i) => {
  const angle = (i / 160) * Math.PI * 2 + Math.sin(i * 17.1) * 0.4;
  const radius = 50 + Math.pow((i / 160), 1.1) * 620;
  const speed = (0.015 + (i % 7) * 0.005) * (i % 2 === 0 ? 1 : -1);
  const size = 0.8 + (i % 4) * 0.4;
  const baseAlpha = 0.35 + (i % 6) * 0.1;
  const colors = ['#F8FAFC', '#93C5FD', '#FDE68A', '#F472B6', '#E2E8F0'];
  return {
    baseAngle: angle,
    orbitRadius: radius,
    orbitSpeed: speed,
    size,
    baseAlpha,
    color: colors[i % colors.length],
  };
});

function drawSpaceBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  currentTime: number
) {
  const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.7);
  bgGrad.addColorStop(0, '#0F172A');
  bgGrad.addColorStop(0.5, '#0B0F19');
  bgGrad.addColorStop(1, '#05070D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
  ctx.lineWidth = 1;

  const gridSize = 80;
  ctx.beginPath();
  for (let x = (cx % gridSize); x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = (cy % gridSize); y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Render Gravitationally Lensed Starfield
  // Bends starlight continuously around the central origin coordinate without drawing any discrete central object.
  const timeSec = currentTime * 0.001;
  for (const star of BACKGROUND_STARS) {
    const angle = star.baseAngle + star.orbitSpeed * timeSec;
    const rawX = star.orbitRadius * Math.cos(angle);
    const rawY = star.orbitRadius * Math.sin(angle);
    const dist = Math.hypot(rawX, rawY);

    if (dist < 10) continue;

    // Gravitational lensing math: Einstein deflection outwards/tangentially
    const radialAngle = Math.atan2(rawY, rawX);
    const deflection = 1200 / (dist + 120); // Deflection displacement in px
    const lensedX = cx + rawX + Math.cos(radialAngle) * deflection;
    const lensedY = cy + rawY + Math.sin(radialAngle) * deflection;

    // Tangential arc stretch (starlight curvature/smear close to pull zone)
    const smear = Math.max(0, (300 - dist) / 300) * 3.5;

    ctx.save();
    ctx.globalAlpha = star.baseAlpha;
    ctx.fillStyle = star.color;

    if (smear > 0.4) {
      // Draw subtle curved starlight arc aligned with tangential direction
      const tanAngle = radialAngle + Math.PI / 2;
      const arcLen = 1.5 + smear;
      ctx.beginPath();
      ctx.moveTo(
        lensedX - Math.cos(tanAngle) * arcLen,
        lensedY - Math.sin(tanAngle) * arcLen
      );
      ctx.lineTo(
        lensedX + Math.cos(tanAngle) * arcLen,
        lensedY + Math.sin(tanAngle) * arcLen
      );
      ctx.strokeStyle = star.color;
      ctx.lineWidth = star.size * 0.9;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(lensedX, lensedY, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawRingBoundaries(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r1Inner: number,
  r1Outer: number,
  r2Inner: number,
  r2Outer: number
) {
  ctx.save();

  // Ring 1 Band Fill
  ctx.beginPath();
  ctx.arc(cx, cy, r1Outer, 0, Math.PI * 2);
  ctx.arc(cx, cy, r1Inner, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(217, 119, 6, 0.03)';
  ctx.fill();

  // Ring 1 Borders
  ctx.beginPath();
  ctx.arc(cx, cy, r1Inner, 0, Math.PI * 2);
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r1Outer, 0, Math.PI * 2);
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ring 2 Band Fill
  ctx.beginPath();
  ctx.arc(cx, cy, r2Outer, 0, Math.PI * 2);
  ctx.arc(cx, cy, r2Inner, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(139, 92, 246, 0.03)';
  ctx.fill();

  // Ring 2 Borders
  ctx.beginPath();
  ctx.arc(cx, cy, r2Inner, 0, Math.PI * 2);
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r2Outer, 0, Math.PI * 2);
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ring Labels
  ctx.setLineDash([]);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(217, 119, 6, 0.7)';
  ctx.fillText('RING 1 (INNER METAL)', cx + r1Inner + 8, cy - 6);

  ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
  ctx.fillText('RING 2 (MEDIUM TUG ZONE)', cx + r2Inner + 8, cy - 6);

  ctx.restore();
}

function drawCommandHub(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) {
  ctx.save();

  const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 35);
  glow.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
  glow.addColorStop(0.6, 'rgba(6, 182, 212, 0.15)');
  glow.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  ctx.fill();

  const angle = (time / 1000) * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.strokeStyle = '#0891B2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(18 * Math.cos(a), 18 * Math.sin(a));
    ctx.lineTo(26 * Math.cos(a), 26 * Math.sin(a));
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#22D3EE';
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#06B6D4';
  ctx.fill();
  ctx.strokeStyle = '#CFFAFE';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#A5F3FC';
  ctx.textAlign = 'center';
  ctx.fillText('HUB COMMAND', cx, cy + 32);

  ctx.restore();
}

function drawFragment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frag: Fragment
) {
  ctx.save();
  ctx.translate(x, y);

  // Outer Shard Glow
  ctx.beginPath();
  ctx.arc(0, 0, frag.size + 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.fill();

  // Sharp Diamond Shard
  ctx.beginPath();
  ctx.moveTo(0, -frag.size);
  ctx.lineTo(frag.size * 0.7, 0);
  ctx.lineTo(0, frag.size);
  ctx.lineTo(-frag.size * 0.7, 0);
  ctx.closePath();

  ctx.fillStyle = '#D97706';
  ctx.fill();
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = '#FEF08A';
  ctx.textAlign = 'center';
  ctx.fillText(`${frag.amount}MT`, 0, frag.size + 9);

  ctx.restore();
}

function drawAsteroid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  asteroid: Asteroid,
  isSelected: boolean
) {
  const now = Date.now();
  const spawnAgeMs = asteroid.spawnTime ? now - asteroid.spawnTime : 1000;
  const MAT_DURATION_MS = 600; // 0.6s materialization fade/grow in place

  let matAlpha = 1;
  let matScale = 1;

  if (spawnAgeMs < MAT_DURATION_MS) {
    const p = Math.max(0, Math.min(1, spawnAgeMs / MAT_DURATION_MS));
    const easeP = 1 - Math.pow(1 - p, 3); // Smooth cubic ease-out
    matAlpha = easeP;
    matScale = 0.15 + 0.85 * easeP;
  }

  ctx.save();
  ctx.translate(x, y);

  if (matAlpha < 1) {
    ctx.globalAlpha = matAlpha;
    ctx.scale(matScale, matScale);

    // Coalescing in-place particle ring (no directional motion or origin drift)
    const ringR = asteroid.size * (1.6 - 0.6 * matAlpha);
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = (asteroid.gasAmount || 0) > 0 ? 'rgba(236, 72, 153, 0.6)' : asteroid.ring === 2 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const isRing2 = asteroid.ring === 2;
  const isGasBearing = (asteroid.gasAmount || 0) > 0;
  const isRawAluminum = asteroid.resourceType === 'RawAluminum' || isRing2;

  // Gas-Bearing Aura Effect
  if (isGasBearing) {
    const gasGlow = ctx.createRadialGradient(0, 0, asteroid.size * 0.5, 0, 0, asteroid.size + 14);
    gasGlow.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
    gasGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
    gasGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = gasGlow;
    ctx.beginPath();
    ctx.arc(0, 0, asteroid.size + 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.rotate(asteroid.rotation);

  // Selected or Targeted Highlight Reticle
  if (isSelected || asteroid.isTargeted) {
    ctx.beginPath();
    ctx.arc(0, 0, asteroid.size + 8, 0, Math.PI * 2);
    ctx.strokeStyle = isGasBearing ? '#EC4899' : isRawAluminum ? '#C084FC' : asteroid.isTargeted ? '#F59E0B' : '#00F0FF';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Detected Ring Glow
  if (asteroid.isDetected) {
    ctx.beginPath();
    ctx.arc(0, 0, asteroid.size + 4, 0, Math.PI * 2);
    ctx.strokeStyle = isGasBearing ? 'rgba(236, 72, 153, 0.8)' : isRawAluminum ? 'rgba(168, 85, 247, 0.7)' : 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Asteroid Rock Body (Jagged shape)
  ctx.beginPath();
  const numPoints = isRing2 ? 9 : 7;
  for (let i = 0; i < numPoints; i++) {
    const a = (i * Math.PI * 2) / numPoints;
    const r = asteroid.size * (0.85 + 0.3 * Math.sin(i * 2.5));
    const px = r * Math.cos(a);
    const py = r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = isGasBearing ? '#4A044E' : isRing2 ? '#2E1065' : isRawAluminum ? '#1E1B4B' : asteroid.isDetected ? '#334155' : '#1E293B';
  ctx.fill();
  ctx.strokeStyle = isGasBearing ? '#EC4899' : isRing2 ? '#A855F7' : isRawAluminum ? '#818CF8' : asteroid.isDetected ? '#D97706' : '#475569';
  ctx.lineWidth = isGasBearing ? 3 : isRing2 ? 2.5 : 2;
  ctx.stroke();

  // Mineral / Gas Core Glow
  if (isGasBearing) {
    ctx.beginPath();
    ctx.arc(0, 0, asteroid.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#F472B6';
    ctx.fill();
  } else if (asteroid.metalAmount > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, asteroid.size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = isRawAluminum ? '#C084FC' : '#F59E0B';
    ctx.fill();
  }

  ctx.restore();

  // Ore / Gas Badge
  if (isGasBearing) {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#F472B6';
    ctx.textAlign = 'center';
    ctx.fillText(`H3 GAS: ${asteroid.gasAmount}MT`, x, y + asteroid.size + 12);
  } else {
    const barW = isRing2 ? 32 : 24;
    const barH = 3;
    const pct = Math.max(0, asteroid.metalAmount / asteroid.maxMetal);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(x - barW / 2, y - asteroid.size - 10, barW, barH);
    ctx.fillStyle = isRawAluminum ? '#A855F7' : '#F59E0B';
    ctx.fillRect(x - barW / 2, y - asteroid.size - 10, barW * pct, barH);
  }
}

function drawScout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scout: Scout,
  asteroids: Asteroid[],
  cx: number,
  cy: number,
  showRadarSweep: boolean
) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, scout.scanRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  if (showRadarSweep) {
    const sweepGrad = ctx.createConicGradient(scout.scanAngle, x, y);
    sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    sweepGrad.addColorStop(0.15, 'rgba(6, 182, 212, 0.05)');
    sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.arc(x, y, scout.scanRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const ast of asteroids) {
    if (ast.isDepleted) continue;
    const dist = Math.hypot(ast.x - scout.x, ast.y - scout.y);
    if (dist <= scout.scanRadius) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cx + ast.x, cy + ast.y);
      ctx.strokeStyle = ast.ring === 2 ? 'rgba(168, 85, 247, 0.35)' : 'rgba(34, 211, 238, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.translate(x, y);
  const angle = scout.orbitAngle + Math.PI / 2;
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(7, 8);
  ctx.lineTo(-7, 8);
  ctx.closePath();

  ctx.fillStyle = '#06B6D4';
  ctx.fill();
  ctx.strokeStyle = '#CFFAFE';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#22D3EE';
  ctx.textAlign = 'center';
  ctx.fillText(scout.name, x, y - 14);

  ctx.restore();
}

function drawMiningDrone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  miner: Drone,
  cx: number,
  cy: number,
  isSelected: boolean,
  showLabel: boolean
) {
  ctx.save();

  if (miner.trail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(cx + miner.trail[0].x, cy + miner.trail[0].y);
    for (let i = 1; i < miner.trail.length; i++) {
      ctx.lineTo(cx + miner.trail[i].x, cy + miner.trail[i].y);
    }
    ctx.strokeStyle = miner.tier === 2 ? 'rgba(236, 72, 153, 0.3)' : 'rgba(245, 158, 11, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Mining / Drilling Laser Beam
  if (miner.state === 'Mining' && miner.targetPos) {
    const targetX = cx + miner.targetPos.x;
    const targetY = cy + miner.targetPos.y;
    const isBreaker = miner.tier === 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(targetX, targetY);
    ctx.strokeStyle = isBreaker ? '#EC4899' : '#F59E0B';
    ctx.lineWidth = isBreaker ? 3.5 : 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(targetX, targetY);
    ctx.strokeStyle = isBreaker ? 'rgba(56, 189, 248, 0.6)' : 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = isBreaker ? 8 : 6;
    ctx.stroke();

    if (isBreaker) {
      // Plasma spark sparks at target
      ctx.beginPath();
      ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#F472B6';
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(x, y);

  let angle = 0;
  if (miner.state === 'Traveling' && miner.targetPos) {
    angle = Math.atan2(cy + miner.targetPos.y - y, cx + miner.targetPos.x - x);
  } else if (miner.state === 'Returning') {
    angle = Math.atan2(cy - y, cx - x);
  }
  ctx.rotate(angle);

  if (miner.tier === 2) {
    // Breaker Mk II Heavy Dual-Prong Hull
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(4, 8);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(4, -8);
    ctx.closePath();

    ctx.fillStyle = miner.color;
    ctx.fill();
    ctx.strokeStyle = '#F472B6';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    // Breaker Drill Head
    ctx.beginPath();
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#38BDF8';
    ctx.fill();
  } else {
    // Standard Mk I Miner Hull
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, 7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -7);
    ctx.closePath();

    ctx.fillStyle = miner.color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
  }

  ctx.restore();

  if (showLabel) {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = miner.tier === 2 ? '#EC4899' : miner.state === 'Mining' ? '#F59E0B' : '#60A5FA';
    ctx.textAlign = 'center';
    ctx.fillText(`${miner.name} [${miner.state}]`, x, y - 14);
  }

  ctx.restore();
}

function drawTugHauler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hauler: Drone,
  asteroids: Asteroid[],
  cx: number,
  cy: number,
  isSelected: boolean,
  showLabel: boolean
) {
  ctx.save();

  // Draw Tow Cable / Energy Grapple Beam when Latched or Tugging!
  if (hauler.state === 'Latched' || hauler.state === 'Tugging') {
    let targetX: number | null = null;
    let targetY: number | null = null;

    if (hauler.targetAsteroidId) {
      const ast = asteroids.find((a) => a.id === hauler.targetAsteroidId);
      if (ast) {
        targetX = cx + ast.x;
        targetY = cy + ast.y;
      }
    } else if (hauler.targetPos) {
      targetX = cx + hauler.targetPos.x;
      targetY = cy + hauler.targetPos.y;
    }

    if (targetX !== null && targetY !== null) {
      // Heavy Tow Cable Line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pulsing Grapple Beam
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Energy Ring Nodes on tow cable
      for (let i = 1; i <= 3; i++) {
        const ratio = i / 4;
        const nx = x + (targetX - x) * ratio;
        const ny = y + (targetY - y) * ratio;
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#E9D5FF';
        ctx.fill();
      }
    }
  }

  ctx.save();
  ctx.translate(x, y);

  let angle = 0;
  if (hauler.state === 'Traveling' && hauler.targetPos) {
    angle = Math.atan2(cy + hauler.targetPos.y - y, cx + hauler.targetPos.x - x);
  } else if (hauler.state === 'Tugging') {
    angle = Math.atan2(cy - y, cx - x);
  } else if (hauler.state === 'Returning') {
    angle = Math.atan2(cy - y, cx - x);
  }
  ctx.rotate(angle);

  // Heavy Tug Hauler Ship Body
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-6, 9);
  ctx.lineTo(-10, 4);
  ctx.lineTo(-10, -4);
  ctx.lineTo(-6, -9);
  ctx.closePath();

  ctx.fillStyle = '#8B5CF6';
  ctx.fill();
  ctx.strokeStyle = '#E9D5FF';
  ctx.lineWidth = isSelected ? 2.5 : 1.5;
  ctx.stroke();

  // Heavy Tow Winch at Rear
  ctx.fillRect(-12, -3, 4, 6);

  ctx.restore();

  if (showLabel) {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = hauler.state === 'Tugging' ? '#C084FC' : '#A78BFA';
    ctx.textAlign = 'center';
    ctx.fillText(`${hauler.name} [${hauler.state}]`, x, y - 16);
  }

  ctx.restore();
}
