import { Simulation } from './simulation';
import { Ant, Chamber, Colony, Egg, FoodNode, Nest, Queen } from './types';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
  }

  public render(sim: Simulation, showPheromones: boolean = true): void {
    const { width, height } = sim.config;
    const ctx = this.ctx;

    // Ensure canvas dimensions match simulation dimensions
    if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
    }

    // Lane boundaries: Opposition (0-200), Shared Foraging (200-600), Player (600-800)
    const oppBoundaryY = 200;
    const playerBoundaryY = 600;

    // 1a. Draw Opposition Nest Region (y: 0 - 200, Subterranean Earth)
    ctx.fillStyle = '#18110d';
    ctx.fillRect(0, 0, width, oppBoundaryY);

    // Subtle Crimson / Rose tint overlay for Opposition Nest Territory
    ctx.fillStyle = 'rgba(159, 18, 57, 0.08)';
    ctx.fillRect(0, 0, width, oppBoundaryY);

    // Grid lines for Opposition Nest
    ctx.strokeStyle = '#2a1d17';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, oppBoundaryY);
      ctx.stroke();
    }
    for (let y = 0; y < oppBoundaryY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 1b. Draw Shared Foraging Region (y: 200 - 600, Surface Slate)
    ctx.fillStyle = '#0f172a'; // Tailwind slate-900
    ctx.fillRect(0, oppBoundaryY, width, playerBoundaryY - oppBoundaryY);

    // Grid lines for Shared Foraging
    ctx.strokeStyle = '#1e293b'; // Tailwind slate-800
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, oppBoundaryY);
      ctx.lineTo(x, playerBoundaryY);
      ctx.stroke();
    }
    for (let y = oppBoundaryY; y < playerBoundaryY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 1c. Draw Player Nest Region (y: 600 - 800, Subterranean Earth)
    ctx.fillStyle = '#1c130e';
    ctx.fillRect(0, playerBoundaryY, width, height - playerBoundaryY);

    // Subtle Amber tint overlay for Player Nest Territory
    ctx.fillStyle = 'rgba(180, 83, 9, 0.08)';
    ctx.fillRect(0, playerBoundaryY, width, height - playerBoundaryY);

    // Grid lines for Player Nest
    ctx.strokeStyle = '#2d1f18';
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, playerBoundaryY);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = playerBoundaryY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 1d. Horizon Boundary Lines
    // Opposition Territory Horizon (y = 200)
    ctx.strokeStyle = '#9f1239'; // Crimson rose horizon
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, oppBoundaryY);
    ctx.lineTo(width, oppBoundaryY);
    ctx.stroke();

    // Player Territory Horizon (y = 600)
    ctx.strokeStyle = '#78350f'; // Earthy amber horizon
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, playerBoundaryY);
    ctx.lineTo(width, playerBoundaryY);
    ctx.stroke();

    // 2. Draw Per-Colony Structures (Tunnels, Chambers, Queen, Eggs, Pheromones, Nests)
    for (const colony of sim.colonies) {
      // Tunnels & Waypoints
      this.drawTunnels(ctx, sim, colony);

      // Underground Chambers
      for (const chamber of colony.chambers) {
        this.drawChamber(ctx, chamber, colony);
      }

      // Queen Entity in Royal Chamber
      this.drawQueen(ctx, colony);

      // Eggs in Colony
      this.drawEggs(ctx, colony);

      // Pheromone Trail Overlay
      if (showPheromones) {
        this.drawPheromoneGrid(ctx, colony);
      }

      // Nest Mound & Entrance
      this.drawNest(ctx, colony);
    }

    // 3. Draw Shared Food Nodes
    for (const food of sim.foodNodes) {
      this.drawFoodNode(ctx, food);
    }

    // 4. Draw Ants per Colony with Faction Styling
    for (const colony of sim.colonies) {
      for (const ant of colony.ants) {
        this.drawAnt(ctx, ant, colony.id);
      }
    }
  }

  private drawTunnels(ctx: CanvasRenderingContext2D, sim: Simulation, colony: Colony): void {
    ctx.save();
    const target = sim.config.tunnelDigTarget !== undefined ? sim.config.tunnelDigTarget : 40;
    const progressFrac = Math.min(1.0, Math.max(0, (colony.nest.tunnelDugProgress || 0) / target));

    for (const tunnel of colony.tunnels) {
      if (tunnel.waypoints.length < 2) continue;

      let pointsToDraw = tunnel.waypoints;
      const isExitTunnel = (tunnel.chamberAId === 0 && tunnel.chamberBId === 1) || (tunnel.chamberAId === 1 && tunnel.chamberBId === 0);

      if (isExitTunnel && !colony.nest.tunnelDug) {
        // Draw unexcavated guide line along proposed tunnel path
        ctx.strokeStyle = colony.id === 0 ? 'rgba(161, 98, 7, 0.3)' : 'rgba(225, 29, 72, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tunnel.waypoints[0].x, tunnel.waypoints[0].y);
        for (let i = 1; i < tunnel.waypoints.length; i++) {
          ctx.lineTo(tunnel.waypoints[i].x, tunnel.waypoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Get actual excavated portion from Storage up to current dig face
        pointsToDraw = sim.getExcavatedTunnelWaypoints(progressFrac, colony);
      }

      if (pointsToDraw.length < 2) continue;

      // Draw carved tunnel passage
      ctx.strokeStyle = '#3d2b22';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);
      for (let i = 1; i < pointsToDraw.length; i++) {
        ctx.lineTo(pointsToDraw[i].x, pointsToDraw[i].y);
      }
      ctx.stroke();

      // Inner tunnel pathway
      ctx.strokeStyle = '#523a2d';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Dashed guide line
      ctx.strokeStyle = colony.id === 0 ? '#a16207' : '#e11d48';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  private drawChamber(ctx: CanvasRenderingContext2D, chamber: Chamber, colony: Colony): void {
    ctx.save();
    const halfW = chamber.width / 2;
    const halfH = chamber.height / 2;
    const x = chamber.x - halfW;
    const y = chamber.y - halfH;

    // Chamber background fill (Cavernous earth)
    ctx.fillStyle = '#2b1c14';
    ctx.beginPath();
    ctx.roundRect(x, y, chamber.width, chamber.height, 14);
    ctx.fill();

    // Chamber border accent
    const borderAccent = chamber.chamberType === 'storage'
      ? '#f59e0b' // Amber
      : chamber.chamberType === 'nursery'
      ? '#38bdf8' // Sky blue
      : (colony.id === 0 ? '#e11d48' : '#a855f7'); // Rose for Player, Royal purple for Opposition

    ctx.strokeStyle = borderAccent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nursery egg/pupae cots visual indicator
    if (chamber.chamberType === 'nursery') {
      ctx.fillStyle = '#bae6fd'; // Sky blue egg color
      const eggPositions = [
        { x: chamber.x - 22, y: chamber.y - 12 },
        { x: chamber.x - 14, y: chamber.y - 15 },
        { x: chamber.x + 16, y: chamber.y - 12 },
        { x: chamber.x + 24, y: chamber.y - 15 },
        { x: chamber.x - 20, y: chamber.y + 12 },
        { x: chamber.x + 18, y: chamber.y + 12 },
      ];
      for (const pos of eggPositions) {
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, 3.5, 2.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Chamber Label
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(chamber.name.toUpperCase(), chamber.x, y + 6);

    ctx.restore();
  }

  private drawQueen(ctx: CanvasRenderingContext2D, colony: Colony): void {
    if (!colony.queen) return;
    const queen = colony.queen;
    ctx.save();
    ctx.translate(queen.x, queen.y);

    if (queen.isDead) {
      // Grayed out dead queen marker
      ctx.fillStyle = '#4b5563'; // Muted dark gray abdomen
      ctx.beginPath();
      ctx.ellipse(-8, 0, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Thorax & Head
      ctx.fillStyle = '#6b7280';
      ctx.beginPath();
      ctx.ellipse(3, 0, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(10, 0, 4.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dead label
      ctx.fillStyle = '#f87171'; // Red text
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('QUEEN (DEAD)', 0, queen.radius + 2);

      ctx.restore();
      return;
    }

    // Subtle regal aura glow
    const auraGradient = ctx.createRadialGradient(0, 0, 4, 0, 0, queen.radius + 12);
    if (colony.id === 0) {
      auraGradient.addColorStop(0, 'rgba(168, 85, 247, 0.6)'); // Royal purple glow
      auraGradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.2)');
      auraGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
    } else {
      auraGradient.addColorStop(0, 'rgba(225, 29, 72, 0.6)'); // Crimson red glow
      auraGradient.addColorStop(0.7, 'rgba(225, 29, 72, 0.2)');
      auraGradient.addColorStop(1, 'rgba(225, 29, 72, 0)');
    }

    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, 0, queen.radius + 12, 0, Math.PI * 2);
    ctx.fill();

    // Queen Large Abdomen
    ctx.fillStyle = colony.id === 0 ? '#7e22ce' : '#881337'; // Deep purple / Deep crimson
    ctx.beginPath();
    ctx.ellipse(-8, 0, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b'; // Gold accent border
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Queen Thorax
    ctx.fillStyle = colony.id === 0 ? '#a855f7' : '#e11d48';
    ctx.beginPath();
    ctx.ellipse(3, 0, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Queen Head
    ctx.fillStyle = colony.id === 0 ? '#c084fc' : '#fb7185';
    ctx.beginPath();
    ctx.ellipse(10, 0, 4.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold Crown points on head
    ctx.fillStyle = '#fef08a'; // Bright gold
    ctx.beginPath();
    ctx.arc(12, -3.5, 1.8, 0, Math.PI * 2);
    ctx.arc(14, 0, 1.8, 0, Math.PI * 2);
    ctx.arc(12, 3.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Queen label
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const hp = Math.round(queen.queenHealth * 100);
    ctx.fillText(`QUEEN (${hp}% HP)`, 0, queen.radius + 2);

    ctx.restore();
  }

  private drawEggs(ctx: CanvasRenderingContext2D, colony: Colony): void {
    if (!colony.eggs || colony.eggs.length === 0) return;

    ctx.save();
    for (const egg of colony.eggs) {
      if (egg.state === 'carried') continue; // carried eggs drawn on ant
      const care = egg.careLevel ?? 1.0;
      if (egg.isRoyalCandidate) {
        // Royal Candidate Egg - Bright Gold Glow & Crown Tint
        ctx.fillStyle = '#fbbf24'; // Rich gold fill
        ctx.strokeStyle = '#a855f7'; // Purple royal accent border
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(egg.x, egg.y, 6, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (care < 0.5) {
        ctx.fillStyle = '#fef3c7'; // Dim amber-tinted egg fill
        ctx.strokeStyle = '#f59e0b'; // Amber warning border for neglected egg
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(egg.x, egg.y, 4, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#f0f9ff'; // Sky-white egg fill
        ctx.strokeStyle = colony.id === 0 ? '#38bdf8' : '#f43f5e'; // Sky blue border vs Rose border
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(egg.x, egg.y, 4, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawPheromoneGrid(ctx: CanvasRenderingContext2D, colony: Colony): void {
    const grid = colony.pheromones;
    const cs = grid.cellSize;

    ctx.save();
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const idx = grid.getIndex(c, r);
        const val = grid.grid[idx];
        if (val > 0.01) {
          const x = c * cs;
          const y = r * cs;
          const alpha = Math.min(0.65, val * 0.7);
          if (colony.id === 0) {
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`; // Emerald 500 glow for Player
          } else {
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`; // Crimson 500 glow for Opposition
          }
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }
    ctx.restore();
  }

  private drawFoodNode(ctx: CanvasRenderingContext2D, food: FoodNode): void {
    if (food.quantity <= 0) return;

    const ratio = food.quantity / food.maxQuantity;
    const radius = 12 + ratio * 16;

    ctx.save();

    // Outer glow
    const gradient = ctx.createRadialGradient(food.x, food.y, 2, food.x, food.y, radius + 8);
    gradient.addColorStop(0, 'rgba(52, 211, 153, 0.9)'); // Emerald 400
    gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.4)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(food.x, food.y, radius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Core node circle
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Quantity text
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(food.quantity)}`, food.x, food.y);

    ctx.restore();
  }

  private drawNest(ctx: CanvasRenderingContext2D, colony: Colony): void {
    const { nest, id } = colony;
    ctx.save();

    // Outer mound ring
    ctx.fillStyle = id === 0 ? 'rgba(217, 119, 6, 0.2)' : 'rgba(225, 29, 72, 0.2)'; // Amber vs Rose shadow
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nest.radius + 10, 0, Math.PI * 2);
    ctx.fill();

    // Nest rim
    ctx.fillStyle = id === 0 ? '#78350f' : '#881337'; // Dark amber vs Dark crimson
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nest.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = id === 0 ? '#f59e0b' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Nest entrance hole
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nest.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Nest labels
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const labelY = id === 0 ? nest.y - nest.radius - 8 : nest.y + nest.radius + 18;
    const storeY = id === 0 ? nest.y + nest.radius + 14 : nest.y - nest.radius - 8;

    ctx.fillText(`ENTRANCE (${id === 0 ? 'PLAYER' : 'OPPOSITION'})`, nest.x, labelY);

    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = id === 0 ? '#fcd34d' : '#fda4af';
    ctx.fillText(`Food Store: ${Math.floor(nest.foodStore)}`, nest.x, storeY);

    ctx.restore();
  }

  private drawAnt(ctx: CanvasRenderingContext2D, ant: Ant, colonyId: number): void {
    ctx.save();
    ctx.translate(ant.x, ant.y);

    // Calculate heading angle from velocity vector
    const angle = Math.atan2(ant.vy, ant.vx);
    ctx.rotate(angle);

    if (colonyId === 0) {
      // --- PLAYER FACTION: CLEAR (Translucent Translucent Glow) ---
      // Translucent fill alpha
      ctx.globalAlpha = 0.60;

      // Glow radiates through translucent body (set shadow before fill)
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.7)'; // Sky blue glow

      const bodyColor = ant.currentAction === 'forage_direct'
        ? '#38bdf8' // Sky blue when directly targeting food
        : ant.currentAction === 'follow_trail'
        ? '#a855f7' // Purple when following trail
        : '#f3f4f6'; // Clean light gray/white default

      ctx.fillStyle = bodyColor;

      // Abdomen
      ctx.beginPath();
      ctx.ellipse(-4, 0, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thorax
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(3.5, 0, 2, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow & opacity for legs & cargo
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;

      // Legs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -3); ctx.lineTo(-2, 3);
      ctx.moveTo(0, -3.5); ctx.lineTo(0, 3.5);
      ctx.moveTo(2, -3); ctx.lineTo(2, 3);
      ctx.stroke();

    } else {
      // --- OPPOSITION FACTION: OPAQUE (Solid Near-Black with Outer Edge Glow) ---
      // Faction identity overrides action-based tinting for opposition

      // Pass 1: Outer Edge Glow (Stroke paths with bright shadow & no fill)
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(244, 63, 94, 0.9)'; // Bright rose/crimson edge glow
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.ellipse(-4, 0, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(0, 0, 2.5, 1.8, 0, 0, Math.PI * 2);
      ctx.ellipse(3.5, 0, 2, 1.8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pass 2: Solid Opaque Core (Fill on top with shadowBlur = 0 to confine glow to edge silhouette)
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#09090b'; // Solid near-black

      ctx.beginPath();
      ctx.ellipse(-4, 0, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(0, 0, 2.5, 1.8, 0, 0, Math.PI * 2);
      ctx.ellipse(3.5, 0, 2, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -3); ctx.lineTo(-2, 3);
      ctx.moveTo(0, -3.5); ctx.lineTo(0, 3.5);
      ctx.moveTo(2, -3); ctx.lineTo(2, 3);
      ctx.stroke();
    }

    // Carrying food or egg cargo indicator
    if (ant.carryingFood) {
      ctx.fillStyle = '#34d399'; // Bright emerald food grain
      ctx.beginPath();
      ctx.arc(6, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.stroke();
    } else if (ant.carryingEgg) {
      ctx.fillStyle = '#f0f9ff'; // Sky white egg particle
      ctx.beginPath();
      ctx.ellipse(6, 0, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colonyId === 0 ? '#0284c7' : '#e11d48';
      ctx.stroke();
    }

    ctx.restore();
  }
}
