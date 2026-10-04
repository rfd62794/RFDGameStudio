import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from '../services/simulation';
import { MODULE_BLUEPRINTS } from '../data/recipes';
import { soundEngine } from '../services/audio';
import { Bot, FlaskConical, Wind, Droplets, Boxes, Layers, Zap, Radio, Shield, Rocket, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Props {
  gameState: GameState;
  onSelectModule: (moduleId: string | null) => void;
  onPlaceModule: (x: number, y: number) => void;
  onCancelPlacement: () => void;
  onTractorBottle: (bottleId: string) => void;
}

export const CosmicCanvas: React.FC<Props> = ({
  gameState,
  onSelectModule,
  onPlaceModule,
  onCancelPlacement,
  onTractorBottle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan and zoom state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverGrid, setHoverGrid] = useState<{ x: number; y: number } | null>(null);

  const TILE_SIZE = 56;

  // Render loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;

      // Handle canvas resize
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      }

      const cx = canvas.width / 2 + pan.x;
      const cy = canvas.height / 2 + pan.y;

      // 1. Clear & Background
      ctx.save();
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Deep space starfield
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5 + time * 2) % canvas.width);
        const sy = ((i * 269.3) % canvas.height);
        const sRadius = (i % 3 === 0) ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Black Hole Event Horizon in Background Corner (Off-center cosmic anchor)
      const bhX = cx - 380 * zoom;
      const bhY = cy - 320 * zoom;
      const bhRadius = 90 * zoom;

      // Accretion disk glow
      const gradAccretion = ctx.createRadialGradient(bhX, bhY, bhRadius * 0.8, bhX, bhY, bhRadius * 3.2);
      gradAccretion.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
      gradAccretion.addColorStop(0.3, 'rgba(99, 102, 241, 0.2)');
      gradAccretion.addColorStop(0.7, 'rgba(56, 189, 248, 0.08)');
      gradAccretion.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradAccretion;
      ctx.beginPath();
      ctx.arc(bhX, bhY, bhRadius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Accretion ring rotation
      ctx.save();
      ctx.translate(bhX, bhY);
      ctx.rotate(time * 0.4);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.6)';
      ctx.lineWidth = 3 * zoom;
      ctx.beginPath();
      ctx.ellipse(0, 0, bhRadius * 1.8, bhRadius * 0.6, Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
      ctx.lineWidth = 1.5 * zoom;
      ctx.beginPath();
      ctx.ellipse(0, 0, bhRadius * 2.2, bhRadius * 0.75, -Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Singularity core (absolute black)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(bhX, bhY, bhRadius, 0, Math.PI * 2);
      ctx.fill();

      // Photon sphere rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5 * zoom;
      ctx.beginPath();
      ctx.arc(bhX, bhY, bhRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. World Transform for Station & Game Objects
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);

      // Render Conduits between adjacent station modules
      const modMap = new Map<string, typeof gameState.modules[0]>();
      gameState.modules.forEach((m) => modMap.set(`${m.x},${m.y}`, m));

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 4;
      gameState.modules.forEach((m) => {
        const right = modMap.get(`${m.x + 1},${m.y}`);
        if (right) {
          ctx.beginPath();
          ctx.moveTo(m.x * TILE_SIZE, m.y * TILE_SIZE);
          ctx.lineTo(right.x * TILE_SIZE, right.y * TILE_SIZE);
          ctx.stroke();

          // Flowing pulse particle
          const pulseOffset = (time * 1.5) % 1;
          const px = m.x * TILE_SIZE + (right.x - m.x) * TILE_SIZE * pulseOffset;
          const py = m.y * TILE_SIZE + (right.y - m.y) * TILE_SIZE * pulseOffset;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        const down = modMap.get(`${m.x},${m.y + 1}`);
        if (down) {
          ctx.beginPath();
          ctx.moveTo(m.x * TILE_SIZE, m.y * TILE_SIZE);
          ctx.lineTo(down.x * TILE_SIZE, down.y * TILE_SIZE);
          ctx.stroke();

          const pulseOffset = (time * 1.5 + 0.5) % 1;
          const px = m.x * TILE_SIZE + (down.x - m.x) * TILE_SIZE * pulseOffset;
          const py = m.y * TILE_SIZE + (down.y - m.y) * TILE_SIZE * pulseOffset;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. Render Station Modules
      gameState.modules.forEach((mod) => {
        const mx = mod.x * TILE_SIZE;
        const my = mod.y * TILE_SIZE;
        const isSelected = gameState.selectedModuleId === mod.id;
        const bp = MODULE_BLUEPRINTS[mod.type];

        // Module Box
        const pad = 3;
        const size = TILE_SIZE - pad * 2;

        ctx.save();
        ctx.translate(mx - size / 2, my - size / 2);

        // Fill background
        ctx.fillStyle = mod.type === 'hull_plating' ? '#334155' : '#0f172a';
        ctx.fillRect(0, 0, size, size);

        // Border & Status
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        if (mod.warning) {
          ctx.strokeStyle = '#ef4444';
        } else if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
        } else if (!mod.isPowered) {
          ctx.strokeStyle = '#64748b';
        } else {
          ctx.strokeStyle = '#1e293b';
        }
        ctx.strokeRect(0, 0, size, size);

        // Inner accent header
        let accentColor = '#38bdf8';
        if (mod.type === 'containment_gas') accentColor = '#38bdf8';
        if (mod.type === 'containment_liquid') accentColor = '#10b981';
        if (mod.type === 'containment_solid') accentColor = '#fbbf24';
        if (mod.type === 'containment_dust') accentColor = '#94a3b8';
        if (mod.type === 'power_cell') accentColor = '#facc15';
        if (mod.type === 'processing_chamber') accentColor = '#a855f7';
        if (mod.type === 'signal_array') accentColor = '#60a5fa';

        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, size, 3);

        // Fill Gauge for Containment Modules
        if (mod.containerSlotId) {
          const slot = gameState.containerSlots.find((s) => s.id === mod.containerSlotId);
          if (slot) {
            const fillRatio = slot.amount / slot.capacity;
            const fillH = (size - 6) * fillRatio;
            ctx.fillStyle = `${accentColor}25`;
            ctx.fillRect(2, size - 2 - fillH, size - 4, fillH);
          }
        }

        // Processing Progress Bar on Chamber
        if (mod.type === 'processing_chamber' && mod.processingProgress && mod.processingProgress > 0) {
          const barW = (size - 8) * (mod.processingProgress / 100);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(4, size - 5, barW, 2.5);
        }

        // Health Bar if damaged
        if (mod.health < mod.maxHealth) {
          const hpRatio = mod.health / mod.maxHealth;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(2, size - 3, (size - 4) * hpRatio, 2);
        }

        ctx.restore();
      });

      // 5. Render Build Mode Preview Ghost
      if (gameState.buildingTypeToPlace && hoverGrid) {
        const gx = hoverGrid.x * TILE_SIZE;
        const gy = hoverGrid.y * TILE_SIZE;
        const exists = gameState.modules.some((m) => m.x === hoverGrid.x && m.y === hoverGrid.y);

        ctx.save();
        ctx.translate(gx - (TILE_SIZE - 6) / 2, gy - (TILE_SIZE - 6) / 2);
        ctx.strokeStyle = exists ? '#ef4444' : '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(0, 0, TILE_SIZE - 6, TILE_SIZE - 6);
        ctx.fillStyle = exists ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
        ctx.fillRect(0, 0, TILE_SIZE - 6, TILE_SIZE - 6);
        ctx.restore();
      }

      // 6. Render Drifting Asteroids
      gameState.asteroids.forEach((ast) => {
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rotation);

        // Collision trajectory warning line
        if (ast.collisionWarning) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-ast.x * 0.8, -ast.y * 0.8);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Asteroid Body (Procedural Polygon)
        ctx.beginPath();
        const numPoints = ast.shapePoints.length;
        for (let i = 0; i < numPoints; i++) {
          const theta = (i / numPoints) * Math.PI * 2;
          const r = ast.radius * ast.shapePoints[i];
          const px = Math.cos(theta) * r;
          const py = Math.sin(theta) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = ast.color;
        ctx.fill();
        ctx.strokeStyle = ast.collisionWarning ? '#ef4444' : '#475569';
        ctx.lineWidth = ast.collisionWarning ? 2 : 1;
        ctx.stroke();

        // Ore veins
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(ast.radius * 0.2, -ast.radius * 0.2, ast.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Remaining Ore Ring
        ctx.rotate(-ast.rotation); // un-rotate for UI text/gauge
        const oreRatio = ast.currentOre / ast.totalOre;
        ctx.strokeStyle = ast.tier === 1 ? '#38bdf8' : ast.tier === 2 ? '#c084fc' : '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, ast.radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * oreRatio);
        ctx.stroke();

        ctx.restore();
      });

      // 7. Render Signal Bottles
      gameState.signalBottles.forEach((bottle) => {
        if (bottle.status !== 'drifting') return;

        ctx.save();
        ctx.translate(bottle.worldX, bottle.worldY);

        // Glowing trail
        ctx.fillStyle = 'rgba(96, 165, 250, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Capsule Body
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(-4, -8, 8, 16);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-4, -8, 8, 16);

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 8. Render Autonomous Mining Drones & Lasers
      gameState.drones.forEach((drone) => {
        ctx.save();
        ctx.translate(drone.x, drone.y);

        // Laser beam if mining
        if (drone.state === 'mining' && drone.targetAsteroidId) {
          const ast = gameState.asteroids.find((a) => a.id === drone.targetAsteroidId);
          if (ast) {
            const dx = ast.x - drone.x;
            const dy = ast.y - drone.y;

            // Pulse laser
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2 + Math.sin(time * 20) * 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(dx, dy);
            ctx.stroke();

            // Laser core white
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(dx, dy);
            ctx.stroke();

            // Spark particles at target
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(dx + (Math.random() - 0.5) * 6, dy + (Math.random() - 0.5) * 6, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Drone Hull
        const heading = Math.atan2(drone.vy, drone.vx) || 0;
        ctx.rotate(heading);

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(-5, -4);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cargo glow if hauling
        const totalCargo =
          drone.cargo.dust +
          Object.values(drone.cargo.compounds).reduce((s: number, v: number) => s + v, 0);
        if (totalCargo > 0) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(-2, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, pan, zoom, hoverGrid]);

  // Pointer Handlers for Pan, Zoom, and Grid Interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.width / 2 + pan.x;
    const cy = rect.height / 2 + pan.y;
    const worldX = (e.clientX - rect.left - cx) / zoom;
    const worldY = (e.clientY - rect.top - cy) / zoom;

    const gridX = Math.round(worldX / TILE_SIZE);
    const gridY = Math.round(worldY / TILE_SIZE);
    setHoverGrid({ x: gridX, y: gridY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    // If mouse didn't drag far, treat as click
    const dist = Math.hypot(e.clientX - dragStart.x - pan.x, e.clientY - dragStart.y - pan.y);
    if (dist < 5) {
      handleCanvasClick(e);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.width / 2 + pan.x;
    const cy = rect.height / 2 + pan.y;
    const worldX = (e.clientX - rect.left - cx) / zoom;
    const worldY = (e.clientY - rect.top - cy) / zoom;

    // 1. If in build mode, place module!
    if (gameState.buildingTypeToPlace) {
      const gx = Math.round(worldX / TILE_SIZE);
      const gy = Math.round(worldY / TILE_SIZE);
      onPlaceModule(gx, gy);
      return;
    }

    // 2. Check if clicked a drifting signal bottle to tractor-beam it!
    const clickedBottle = gameState.signalBottles.find((b) => {
      if (b.status !== 'drifting') return false;
      return Math.hypot(b.worldX - worldX, b.worldY - worldY) < 25;
    });

    if (clickedBottle) {
      onTractorBottle(clickedBottle.id);
      soundEngine.playBottleChime();
      return;
    }

    // 3. Check if clicked a station module
    const gx = Math.round(worldX / TILE_SIZE);
    const gy = Math.round(worldY / TILE_SIZE);
    const clickedMod = gameState.modules.find((m) => m.x === gx && m.y === gy);

    if (clickedMod) {
      onSelectModule(clickedMod.id);
      soundEngine.playBuildClink();
    } else {
      onSelectModule(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.001;
    const newZoom = Math.min(2.2, Math.max(0.45, zoom + zoomDelta));
    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      id="cosmic-canvas-container"
      className="relative w-full h-full min-h-[420px] bg-[#060913] select-none overflow-hidden cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Build Placement Overlay Banner */}
      {gameState.buildingTypeToPlace && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-xl px-4 py-2 flex items-center gap-3 shadow-xl z-20">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs text-cyan-200 font-medium tracking-wide">
            Placing {MODULE_BLUEPRINTS[gameState.buildingTypeToPlace]?.name} — Click grid to place
          </span>
          <button
            id="btn-cancel-placement"
            onClick={(e) => {
              e.stopPropagation();
              onCancelPlacement();
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Canvas Viewport Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-lg z-10">
        <button
          id="btn-zoom-in"
          onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => setZoom((z) => Math.max(0.45, z - 0.2))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-view"
          onClick={resetView}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Center Station View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Sandustry Aesthetic Overlay Indicators */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1 z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>SINGULARITY PROXIMITY // RAD 0.84 AU</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          AUTONOMOUS MINERS: {gameState.drones.length} | ASTEROIDS IN SECTOR: {gameState.asteroids.length}
        </div>
      </div>
    </div>
  );
};
