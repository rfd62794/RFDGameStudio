/**
 * Canvas Renderer for Systemic Extract
 * High-performance 2D top-down renderer featuring:
 * - Camera tracking & smooth lerp
 * - Tactical grid rendering (Reinforced concrete, Destructible wood, Floors)
 * - Dynamic Fire hazards with animated heat glow
 * - Line-of-sight & tactical lighting
 * - Entities (Player, Security Guards with alert states, Breaching Charges with fuses)
 * - Floating damage numbers, particles, and minimap radar
 */

import { Simulation } from './simulation';
import { HazardState, Faction } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from './map';
import { STRUCTURE_BLUEPRINTS } from './blueprints';
import { BuildSystem } from './systems/build-system';

const TILE_SIZE = 36; // Base pixel size per tile

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sim: Simulation;

  // Camera coordinates in world pixel space
  public cameraX: number = 0;
  public cameraY: number = 0;
  public zoom: number = 1.0;

  // Track hover tile for targeting breaching charges / flares
  public hoverTile: { x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement, sim: Simulation) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.sim = sim;

    const playerPos = sim.world.gridPositions.get(sim.playerEntityId);
    if (playerPos) {
      this.cameraX = playerPos.x * TILE_SIZE + TILE_SIZE / 2;
      this.cameraY = playerPos.y * TILE_SIZE + TILE_SIZE / 2;
    }
  }

  public setSimulation(sim: Simulation) {
    this.sim = sim;
  }

  public render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (!ctx || width === 0 || height === 0) return;

    // 1. Update Camera Position (lerp toward player)
    const playerVisual = this.sim.world.visuals.get(this.sim.playerEntityId);
    if (playerVisual) {
      const targetCamX = playerVisual.renderX * TILE_SIZE + TILE_SIZE / 2;
      const targetCamY = playerVisual.renderY * TILE_SIZE + TILE_SIZE / 2;
      this.cameraX += (targetCamX - this.cameraX) * 0.15;
      this.cameraY += (targetCamY - this.cameraY) * 0.15;
    }

    // 2. Clear canvas with dark tactical void
    ctx.fillStyle = '#090d13';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center camera on screen
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // Calculate visible tile range
    const viewLeft = Math.floor((this.cameraX - width / (2 * this.zoom)) / TILE_SIZE) - 1;
    const viewRight = Math.ceil((this.cameraX + width / (2 * this.zoom)) / TILE_SIZE) + 1;
    const viewTop = Math.floor((this.cameraY - height / (2 * this.zoom)) / TILE_SIZE) - 1;
    const viewBottom = Math.ceil((this.cameraY + height / (2 * this.zoom)) / TILE_SIZE) + 1;

    const startX = Math.max(0, viewLeft);
    const endX = Math.min(MAP_WIDTH - 1, viewRight);
    const startY = Math.max(0, viewTop);
    const endY = Math.min(MAP_HEIGHT - 1, viewBottom);

    const now = performance.now() / 1000;
    const playerPos = this.sim.world.gridPositions.get(this.sim.playerEntityId);

    // ----------------------------------------------------
    // LAYER 1: Ground Floors & Extraction Pads
    // ----------------------------------------------------
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const tile = this.sim.tiles[y]?.[x];
        if (!tile) continue;

        // Zone-specific floor tint
        if (tile.isPlayerHome) {
          // Player Home at Center: comfortable high-tech cyber-slate
          ctx.fillStyle = (x + y) % 2 === 0 ? '#112238' : '#162e4a';
        } else if (tile.zoneType === 'sanctuary') {
          // Sanctuary clean reinforced high-tech tiles
          ctx.fillStyle = (x + y) % 2 === 0 ? '#0b192c' : '#0e2238';
        } else if (tile.zoneType === 'dungeon') {
          if (tile.dungeonId === 'nw_robotics') {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#131b26' : '#182332'; // industrial slate
          } else if (tile.dungeonId === 'ne_biolab') {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#0b1e17' : '#0f291f'; // mossy biolab
          } else if (tile.dungeonId === 'sw_foundry') {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#24140d' : '#2d1a10'; // foundry ember
          } else {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#1b0c26' : '#221030'; // void violet
          }
        } else {
          // Safe Overworld Concourse
          ctx.fillStyle = (x + y) % 2 === 0 ? '#0d1520' : '#101a26';
        }
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Tile grid outline
        ctx.strokeStyle = tile.isPlayerHome
          ? '#0284c7'
          : tile.zoneType === 'sanctuary'
          ? '#163857'
          : '#1b2432';
        ctx.lineWidth = tile.isPlayerHome ? 1.2 : 1;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Dungeon Entrance gate threshold marker (Cardinal Deploy Pads)
        if (tile.isDungeonEntrance) {
          const pulse = (Math.sin(now * 3.5 + x + y) + 1) * 0.5;
          let gateColor = '#38bdf8';
          if (tile.dungeonTargetId === 'ne_biolab') gateColor = '#10b981';
          else if (tile.dungeonTargetId === 'sw_foundry') gateColor = '#f59e0b';
          else if (tile.dungeonTargetId === 'se_void') gateColor = '#a855f7';

          ctx.fillStyle = `${gateColor}22`;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = gateColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

          // Render Cardinal Gate Core Beacons & Labels
          const isGateCenter =
            (x === 100 && y === 68) ||
            (x === 132 && y === 100) ||
            (x === 100 && y === 132) ||
            (x === 68 && y === 100);

          if (isGateCenter) {
            const cx = px + TILE_SIZE / 2;
            const cy = py + TILE_SIZE / 2;
            const beaconPulse = (Math.sin(now * 4) + 1) * 0.5;

            ctx.strokeStyle = gateColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, 32 + beaconPulse * 14, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = gateColor;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();

            // Label above gate
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(tile.dungeonName || 'DUNGEON ZONE', cx, cy - 38);
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = gateColor;
            ctx.fillText('STAND TO DEPLOY [E]', cx, cy + 48);
          }
        }

        // Overworld Player Home Center Marker
        if (this.sim.currentMapType === 'overworld' && x === 100 && y === 100) {
          const cx = px + TILE_SIZE / 2;
          const cy = py + TILE_SIZE / 2;
          const homePulse = (Math.sin(now * 3) + 1) * 0.5;

          // Holographic Core Rings
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + homePulse * 0.5})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 26 + homePulse * 10, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#bae6fd';
          ctx.fillText('PLAYER HOME // SANCTUARY CORE', cx, cy - 36);
          ctx.font = '9px monospace';
          ctx.fillStyle = '#7dd3fc';
          ctx.fillText('HEALTH REGEN & SCRAP AUTO-BANK', cx, cy + 44);
        }

        // Extraction Zone Pad (in Dungeon)
        if (tile.isExtraction) {
          const pulse = (Math.sin(now * 4) + 1) * 0.5;
          ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + pulse * 0.15})`;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Diagonal warning stripes
          ctx.beginPath();
          ctx.moveTo(px + 4, py + TILE_SIZE - 4);
          ctx.lineTo(px + TILE_SIZE - 4, py + 4);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.stroke();

          // Central Extraction Beacon (at 100, 100)
          if (x === 100 && y === 100) {
            const beaconPulse = (Math.sin(now * 5) + 1) * 0.5;
            const cx = px + TILE_SIZE / 2;
            const cy = py + TILE_SIZE / 2;

            ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + beaconPulse * 0.4})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 28 + beaconPulse * 16, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.stroke();

            // Diamond core anchor
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 8);
            ctx.lineTo(cx + 8, cy);
            ctx.lineTo(cx, cy + 8);
            ctx.lineTo(cx - 8, cy);
            ctx.closePath();
            ctx.fill();

            // Tactical designation typography
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#a7f3d0';
            ctx.fillText('EXTRACTION TETHER POINT', cx, cy - 34);
            ctx.fillStyle = '#6ee7b7';
            ctx.fillText('STAND 5s TO SECURE LOOT & RETURN', cx, cy + 42);
          }
        }
      }
    }

    // ----------------------------------------------------
    // LAYER 2: Scrap Loot Caches
    // ----------------------------------------------------
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = this.sim.tiles[y]?.[x];
        if (!tile) continue;
        if (tile.lootEntityId !== null) {
          const loot = this.sim.world.loots.get(tile.lootEntityId);
          const px = x * TILE_SIZE + TILE_SIZE / 2;
          const py = y * TILE_SIZE + TILE_SIZE / 2;
          const pulse = Math.sin(now * 5 + x + y) * 2;

          ctx.save();
          if (loot && loot.itemId) {
            // High-value tagged salvage container (Abiotic Factor style anomalous tech)
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#9333ea';
            ctx.fillRect(px - 7 - pulse * 0.2, py - 7 - pulse * 0.2, 14 + pulse * 0.4, 14 + pulse * 0.4);
            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(px - 7 - pulse * 0.2, py - 7 - pulse * 0.2, 14 + pulse * 0.4, 14 + pulse * 0.4);

            // Core chip indicator
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(px - 3, py - 3, 6, 6);
          } else {
            // Standard Scrap Pile
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#d97706';
            ctx.fillRect(px - 6 - pulse * 0.2, py - 6 - pulse * 0.2, 12 + pulse * 0.4, 12 + pulse * 0.4);

            // High-tech gear symbol
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    // ----------------------------------------------------
    // LAYER 2.5: Built Megabase Facilities (ADR 011)
    // ----------------------------------------------------
    for (const [, struct] of this.sim.world.structures.entries()) {
      const sx = struct.originX * TILE_SIZE;
      const sy = struct.originY * TILE_SIZE;
      const sw = struct.width * TILE_SIZE;
      const sh = struct.height * TILE_SIZE;

      ctx.save();
      // Foundation pad
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx + 2, sy + 2, sw - 4, sh - 4);
      ctx.strokeStyle = struct.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 2, sy + 2, sw - 4, sh - 4);

      // High-tech hazard boundary
      ctx.strokeStyle = struct.accentColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 6, sy + 6, sw - 12, sh - 12);

      const scx = sx + sw / 2;
      const scy = sy + sh / 2;

      if (struct.buffType === 'damage') {
        // Munitions Forge
        const firePulse = (Math.sin(now * 8) + 1) * 0.5;
        ctx.fillStyle = `rgba(249, 115, 22, ${0.3 + firePulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(scx, scy, 22 + firePulse * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(scx - 14, scy - 14, 28, 28);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(scx - 8, scy - 8, 16, 16);
      } else if (struct.buffType === 'regen') {
        // Hydroponic Biolab
        const bioPulse = (Math.sin(now * 4) + 1) * 0.5;
        ctx.fillStyle = `rgba(16, 185, 129, ${0.25 + bioPulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(scx, scy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#059669';
        ctx.fillRect(scx - 16, scy - 16, 32, 32);
        ctx.fillStyle = '#6ee7b7';
        ctx.beginPath();
        ctx.arc(scx, scy, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (struct.buffType === 'armor') {
        // Armory Depot
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(scx - 16, scy - 16, 32, 32);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(scx - 12, scy - 12, 24, 24);
      } else {
        // Dimensional Relay
        ctx.save();
        ctx.translate(scx, scy);
        ctx.rotate(-now * 2);
        ctx.fillStyle = '#9333ea';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.restore();
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(scx, scy, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nameplate banner
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(struct.name.toUpperCase(), scx, sy + 18);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = struct.accentColor;
      let buffText = '';
      if (struct.buffType === 'damage') buffText = `+${Math.round(struct.buffValue * 100)}% DMG`;
      if (struct.buffType === 'regen') buffText = `+${struct.buffValue} HP/S REGEN`;
      if (struct.buffType === 'armor') buffText = `+${struct.buffValue} DEFENSE`;
      if (struct.buffType === 'speed') buffText = `+${Math.round(struct.buffValue * 100)}% SPEED`;
      ctx.fillText(buffText, scx, sy + sh - 10);

      ctx.restore();
    }

    // ----------------------------------------------------
    // LAYER 3: Walls (Reinforced vs Destructible Wood)
    // ----------------------------------------------------
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = this.sim.tiles[y]?.[x];
        if (!tile) continue;
        if (tile.wallEntityId !== null) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          const kind = this.sim.world.kinds.get(tile.wallEntityId);
          const visual = this.sim.world.visuals.get(tile.wallEntityId);
          const health = this.sim.world.healths.get(tile.wallEntityId);

          if (kind === 'ReinforcedWall') {
            // Reinforced Concrete / Steel Border
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Steel beveled edge
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Industrial cross bolts
            ctx.fillStyle = '#475569';
            ctx.fillRect(px + 4, py + 4, 3, 3);
            ctx.fillRect(px + TILE_SIZE - 7, py + 4, 3, 3);
            ctx.fillRect(px + 4, py + TILE_SIZE - 7, 3, 3);
            ctx.fillRect(px + TILE_SIZE - 7, py + TILE_SIZE - 7, 3, 3);
          } else if (kind === 'DestructibleWall') {
            // Anomalous Biomass Partition or Quantum Crystalline Barrier
            const isFlashing = visual && visual.flashTime > 0;
            const isCrystalline = visual?.colorOverride === '#0e7490';
            ctx.fillStyle = isFlashing ? '#fca5a5' : (visual?.colorOverride || '#78350f');
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            if (isCrystalline) {
              // High-tech quantum circuit lattice
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 1.2;
              ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              ctx.beginPath();
              ctx.moveTo(px + 6, py + TILE_SIZE / 2);
              ctx.lineTo(px + TILE_SIZE - 6, py + TILE_SIZE / 2);
              ctx.moveTo(px + TILE_SIZE / 2, py + 6);
              ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE - 6);
              ctx.stroke();
            } else {
              // Biomass / Organic Resin lines
              ctx.strokeStyle = '#451a03';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(px, py + TILE_SIZE * 0.33);
              ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE * 0.33);
              ctx.moveTo(px, py + TILE_SIZE * 0.66);
              ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE * 0.66);
              ctx.stroke();
            }

            // Wall Health Bar if damaged
            if (health && health.current < health.max) {
              const hpPct = Math.max(0, health.current / health.max);
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              ctx.fillRect(px + 3, py + 2, TILE_SIZE - 6, 4);
              ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
              ctx.fillRect(px + 3, py + 2, (TILE_SIZE - 6) * hpPct, 4);
            }
          }
        }
      }
    }

    // ----------------------------------------------------
    // LAYER 4: Fire Hazards & Chemistry State
    // "ONE HAZARD: Fire (spreads 1 tile per second, damages wooden walls and entities)"
    // ----------------------------------------------------
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = this.sim.tiles[y]?.[x];
        if (!tile) continue;
        if (tile.hazard === HazardState.Fire) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;

          // Animated fire flames
          const flicker = Math.sin(now * 12 + x * 3 + y * 7) * 0.15;
          const grad = ctx.createRadialGradient(
            px + TILE_SIZE / 2,
            py + TILE_SIZE / 2,
            4,
            px + TILE_SIZE / 2,
            py + TILE_SIZE / 2,
            TILE_SIZE * 0.7
          );
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');  // Bright yellow core
          grad.addColorStop(0.4, 'rgba(249, 115, 22, 0.8)'); // Orange blaze
          grad.addColorStop(0.8, 'rgba(220, 38, 38, 0.6)');  // Deep red
          grad.addColorStop(1, 'rgba(153, 27, 27, 0)');      // Smoke falloff

          ctx.fillStyle = grad;
          ctx.fillRect(px - 2, py - 2, TILE_SIZE + 4, TILE_SIZE + 4);

          // Dynamic flame tongue
          ctx.fillStyle = 'rgba(254, 215, 170, 0.85)';
          ctx.beginPath();
          ctx.arc(
            px + TILE_SIZE / 2 + Math.sin(now * 8 + x) * 4,
            py + TILE_SIZE * 0.4 + flicker * 6,
            4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (tile.hazard === HazardState.PoisonGas) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;

          // Animated toxic volatile aerosol mist (ADR 003)
          const driftX = Math.sin(now * 2.5 + y * 2) * 4;
          const driftY = Math.cos(now * 2.0 + x * 2) * 3;
          const pulse = Math.sin(now * 3 + x + y) * 0.15;

          const grad = ctx.createRadialGradient(
            px + TILE_SIZE / 2 + driftX,
            py + TILE_SIZE / 2 + driftY,
            2,
            px + TILE_SIZE / 2,
            py + TILE_SIZE / 2,
            TILE_SIZE * 0.85
          );
          grad.addColorStop(0, 'rgba(190, 242, 100, 0.7)'); // Lime chartreuse vapor core
          grad.addColorStop(0.4, 'rgba(132, 204, 22, 0.5)'); // Toxic olive green
          grad.addColorStop(0.8, 'rgba(77, 124, 15, 0.3)');  // Outer edge
          grad.addColorStop(1, 'rgba(20, 83, 45, 0)');

          ctx.fillStyle = grad;
          ctx.fillRect(px - 3, py - 3, TILE_SIZE + 6, TILE_SIZE + 6);

          // Volatile particle cloud
          ctx.fillStyle = 'rgba(217, 249, 157, 0.55)';
          ctx.beginPath();
          ctx.arc(
            px + TILE_SIZE * 0.5 + driftX,
            py + TILE_SIZE * 0.5 + driftY,
            3 + pulse * 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // ----------------------------------------------------
    // LAYER 5: Active Breaching Charges (C4)
    // ----------------------------------------------------
    for (const [id, explosive] of this.sim.world.explosives.entries()) {
      const pos = this.sim.world.gridPositions.get(id);
      const visual = this.sim.world.visuals.get(id);
      if (pos && visual) {
        const px = visual.renderX * TILE_SIZE + TILE_SIZE / 2;
        const py = visual.renderY * TILE_SIZE + TILE_SIZE / 2;

        ctx.save();
        // C4 block
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 8, py - 6, 16, 12);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 8, py - 6, 16, 12);

        // Blinking red detonation LED
        const isBlinking = visual.flashTime > 0 || Math.sin(now * 15) > 0;
        ctx.fillStyle = isBlinking ? '#ef4444' : '#7f1d1d';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = isBlinking ? 8 : 0;
        ctx.beginPath();
        ctx.arc(px, py - 1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Fuse countdown text
        ctx.shadowBlur = 0;
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText(`${explosive.fuseTime.toFixed(1)}s`, px, py + 15);
        ctx.restore();
      }
    }

    // ----------------------------------------------------
    // LAYER 5.5: Hive Spawner Nodes & Resonance Sparks
    // ----------------------------------------------------
    // Render Resonance Sparks (floating sub-space energy crystals)
    for (const [id, pos] of this.sim.world.gridPositions.entries()) {
      if (this.sim.world.kinds.get(id) === 'ResonanceSpark') {
        const px = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const py = pos.y * TILE_SIZE + TILE_SIZE / 2 + Math.sin(now * 6 + id) * 3;

        ctx.save();
        // Radiant sub-space pulse
        const pulse = (Math.sin(now * 8) + 1) * 0.5;
        ctx.fillStyle = `rgba(6, 182, 212, ${0.2 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(px, py, 14 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();

        // Crystal rhombus
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(now * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#cffafe';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // White core spark
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
        ctx.restore();
      }
    }

    // Render Hive Blobs (Pulsing Biomass Spawner Nodes)
    for (const [id, spawner] of this.sim.world.spawners.entries()) {
      const pos = this.sim.world.gridPositions.get(id);
      const health = this.sim.world.healths.get(id);
      const visual = this.sim.world.visuals.get(id);
      if (pos && health) {
        const px = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const py = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(now * 4 + id) * 2.5;

        ctx.save();
        // Biological creep base
        ctx.fillStyle = 'rgba(131, 24, 67, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 18 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Undulating organic tendrils
        ctx.strokeStyle = '#9d174d';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 + Math.sin(now * 3 + i) * 0.2;
          const reach = 16 + Math.sin(now * 5 + i * 2) * 4;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + Math.cos(angle) * reach, py + Math.sin(angle) * reach);
          ctx.stroke();
        }

        // Central pulsing flesh mass
        const isFlashing = visual && visual.flashTime > 0;
        const grad = ctx.createRadialGradient(px, py, 2, px, py, 13 + pulse);
        grad.addColorStop(0, isFlashing ? '#ffffff' : '#f43f5e');
        grad.addColorStop(0.6, '#be185d');
        grad.addColorStop(1, '#831843');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 12 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Bioluminescent pustules (glowing yellow/chartreuse spores)
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 6;
        for (let j = 0; j < 4; j++) {
          const pustuleAngle = (j * Math.PI) / 2 + now;
          const dist = 6 + Math.sin(now * 3 + j) * 2;
          ctx.beginPath();
          ctx.arc(
            px + Math.cos(pustuleAngle) * dist,
            py + Math.sin(pustuleAngle) * dist,
            2.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Hive Node Health & Status
        const hpPct = Math.max(0, health.current / health.max);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(px - 16, py - 22, 32, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#f43f5e' : '#e11d48';
        ctx.fillRect(px - 16, py - 22, 32 * hpPct, 4);

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fda4af';
        ctx.textAlign = 'center';
        ctx.fillText(`HIVE [${spawner.activeSpawnIds.length}/${spawner.maxActive}]`, px, py - 26);
        ctx.restore();
      }
    }

    // ----------------------------------------------------
    // LAYER 6: Entities (Security Guards, Crawlers, Apex Echo & Mech Player)
    // ----------------------------------------------------
    for (const [id, ai] of this.sim.world.aiComponents.entries()) {
      const visual = this.sim.world.visuals.get(id);
      const health = this.sim.world.healths.get(id);
      const kind = this.sim.world.kinds.get(id);
      if (!visual || !health) continue;

      const px = visual.renderX * TILE_SIZE + TILE_SIZE / 2;
      const py = visual.renderY * TILE_SIZE + TILE_SIZE / 2;

      if (kind === 'ApexEcho') {
        // ====================================================================
        // THE APEX ECHO (3:00 Reality Collapse Boss Titan)
        // ====================================================================
        ctx.save();
        const violentJitterX = Math.sin(now * 45 + id) * 3;
        const violentJitterY = Math.cos(now * 40 + id) * 2;

        // Shadow / Sub-space rift
        ctx.fillStyle = 'rgba(88, 28, 135, 0.6)';
        ctx.beginPath();
        ctx.ellipse(px, py + 14, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chromatic split (Cyan and Red ghosts)
        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.beginPath();
        ctx.arc(px + violentJitterX - 4, py + violentJitterY, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.beginPath();
        ctx.arc(px + violentJitterX + 4, py + violentJitterY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Singularity core (Deep obsidian void with violet corona)
        const isFlashing = visual.flashTime > 0;
        const apexGrad = ctx.createRadialGradient(
          px + violentJitterX,
          py + violentJitterY,
          3,
          px + violentJitterX,
          py + violentJitterY,
          18
        );
        apexGrad.addColorStop(0, isFlashing ? '#ffffff' : '#030712');
        apexGrad.addColorStop(0.5, '#581c87');
        apexGrad.addColorStop(1, '#a855f7');
        ctx.fillStyle = apexGrad;
        ctx.beginPath();
        ctx.arc(px + violentJitterX, py + violentJitterY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting geometric debris shards
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        for (let s = 0; s < 4; s++) {
          const sAngle = now * 3 + (s * Math.PI) / 2;
          const sx = px + violentJitterX + Math.cos(sAngle) * 24;
          const sy = py + violentJitterY + Math.sin(sAngle) * 24;
          ctx.strokeRect(sx - 3, sy - 3, 6, 6);
        }

        // Boss Health Bar & Title Banner
        const hpPct = Math.max(0, health.current / health.max);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(px - 36, py - 36, 72, 8);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(px - 36, py - 36, 72 * hpPct, 8);
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 36, py - 36, 72, 8);

        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f3e8ff';
        ctx.textAlign = 'center';
        ctx.fillText(`APEX ECHO // [${Math.round(health.current)}/1500]`, px, py - 42);
        ctx.restore();
      } else if (kind === 'Crawler') {
        // ====================================================================
        // RESONANCE CRAWLER (Fast Skittering Bio-Threat)
        // ====================================================================
        ctx.save();
        const twitchX = Math.sin(now * 30 + id) * 1.5;
        const isFlashing = visual.flashTime > 0;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(px, py + 6, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 6 Spiny chitinous legs
        ctx.strokeStyle = isFlashing ? '#ffffff' : '#be185d';
        ctx.lineWidth = 1.5;
        for (let l = 0; l < 6; l++) {
          const side = l < 3 ? -1 : 1;
          const legIndex = l % 3;
          const legY = py - 4 + legIndex * 4;
          const legReach = 10 + Math.sin(now * 25 + l) * 2;
          ctx.beginPath();
          ctx.moveTo(px + side * 4, legY);
          ctx.lineTo(px + side * legReach, legY + (legIndex - 1) * 3);
          ctx.stroke();
        }

        // Chitin carapace
        ctx.fillStyle = isFlashing ? '#ffffff' : '#ec4899';
        ctx.beginPath();
        ctx.ellipse(px + twitchX, py, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Twin crimson optical dots
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + twitchX - 3, py - 6, 2, 2);
        ctx.fillRect(px + twitchX + 1, py - 6, 2, 2);

        // Crawler HP bar
        const hpPct = Math.max(0, health.current / health.max);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(px - 10, py - 14, 20, 3);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(px - 10, py - 14, 20 * hpPct, 3);
        ctx.restore();
      } else {
        // ====================================================================
        // ECHO PATROL GUARD (198X Cassette-Futurist Time-Loop Patrol)
        // ====================================================================
        ctx.save();
        const jitter = Math.sin(now * 30 + id) * 1.5;

        // Guard shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(px, py + 10, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chromatic RGB displacement silhouette (Red & Cyan ghosts)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(px - jitter, py, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.arc(px + jitter, py, 11, 0, Math.PI * 2);
        ctx.fill();

        // Tactical armored chassis
        const isFlashing = visual.flashTime > 0;
        ctx.fillStyle = isFlashing ? '#ffffff' : '#1e3a8a';
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.fill();

        // Interlaced CRT scanlines slicing guard body
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 9, py - 6, 18, 2);
        ctx.fillRect(px - 10, py - 1, 20, 2);
        ctx.fillRect(px - 9, py + 4, 18, 2);

        // Monolithic cybernetic visor slit
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fillRect(px - 7, py - 3, 14, 4);
        ctx.shadowBlur = 0;

        // Stun weapon
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(px + 7, py - 8, 3, 10);

        // Diegetic state tag
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        if (ai.state === 'chase') {
          ctx.fillStyle = '#ef4444';
          ctx.fillText('! ALERT', px, py - 16);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 19, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('LOOP-01', px, py - 16);
        }

        // Health bar
        const hpPct = Math.max(0, health.current / health.max);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(px - 14, py - 24, 28, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#3b82f6' : '#ef4444';
        ctx.fillRect(px - 14, py - 24, 28 * hpPct, 4);
        ctx.restore();
      }
    }

    // ========================================================================
    // SANCTUARY CORE TERMINAL & RESIDENTS (ADR 011)
    // ========================================================================
    // 1. Faraday Sanctuary Core
    for (const [id, kind] of this.sim.world.kinds.entries()) {
      if (kind === 'SanctuaryCore') {
        const visual = this.sim.world.visuals.get(id);
        if (visual) {
          const px = visual.renderX * TILE_SIZE + TILE_SIZE / 2;
          const py = visual.renderY * TILE_SIZE + TILE_SIZE / 2;
          const pulse = (Math.sin(now * 4) + 1) * 0.5;

          ctx.save();
          // Radiating magnetic flux rings
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 28 + pulse * 8, 0, Math.PI * 2);
          ctx.stroke();

          // Rotating polygon core
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(now * 1.5);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-12, -12, 24, 24);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(-12, -12, 24, 24);
          ctx.restore();

          // Luminous central node
          ctx.fillStyle = '#f0f9ff';
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.fillText('FARADAY CORE TERMINAL', px, py - 32);
          ctx.fillStyle = '#34d399';
          ctx.fillText('AUTO-DEPOSIT & REPAIR MATRIX', px, py - 22);
          ctx.restore();
        }
      }
    }

    // 2. Specialists / Rescued Residents
    for (const [id, res] of this.sim.world.residents.entries()) {
      const visual = this.sim.world.visuals.get(id);
      if (!visual) continue;
      const px = visual.renderX * TILE_SIZE + TILE_SIZE / 2;
      const py = visual.renderY * TILE_SIZE + TILE_SIZE / 2;

      ctx.save();
      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(px, py + 10, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specialist Silhouette
      ctx.fillStyle = res.color;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Visor
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px + Math.cos(visual.facingAngle) * 4, py + Math.sin(visual.facingAngle) * 4, 3, 0, Math.PI * 2);
      ctx.fill();

      if (!res.isRescued && !res.isFollowing) {
        // Distress beacon rings pulsing outwards
        const pulse = (Math.sin(now * 5 + id) + 1) * 0.5;
        ctx.strokeStyle = res.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 14 + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText(`[DISTRESS] ${res.name}`, px, py - 18);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(res.title, px, py - 8);
      } else if (res.isFollowing) {
        // Tether beam to player
        if (playerVisual) {
          const plx = playerVisual.renderX * TILE_SIZE + TILE_SIZE / 2;
          const ply = playerVisual.renderY * TILE_SIZE + TILE_SIZE / 2;
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(plx, ply);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#34d399';
        ctx.textAlign = 'center';
        ctx.fillText(`[ESCORTING] ${res.name}`, px, py - 16);
      } else {
        // Rescued in Sanctuary
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText(`[SPECIALIST] ${res.name}`, px, py - 16);
        ctx.fillStyle = '#64748b';
        ctx.fillText(res.title, px, py - 7);
      }
      ctx.restore();
    }

    // ========================================================================
    // PLAYER: LEAD-SHIELDED MECH RIG (Procedural Chassis & Overclock)
    // ========================================================================
    if (playerVisual) {
      const px = playerVisual.renderX * TILE_SIZE + TILE_SIZE / 2;
      const py = playerVisual.renderY * TILE_SIZE + TILE_SIZE / 2;
      const stacks = this.sim.overclockStacks;

      ctx.save();
      // Heavy chassis shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(px, py + 12, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Extraction ring indicator & progress arc
      const currentTile = playerPos
        ? this.sim.tiles[Math.floor(playerPos.y)]?.[Math.floor(playerPos.x)]
        : null;
      const isExtracting = (currentTile && currentTile.isExtraction) || this.sim.extractionTimer > 0;
      if (isExtracting) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, 22 + Math.sin(now * 6) * 3, 0, Math.PI * 2);
        ctx.stroke();

        // Evac Stabilization progress ring
        const progress = Math.min(1, this.sim.extractionTimer / this.sim.EXTRACTION_REQUIRED_TIME);
        if (progress > 0) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(px, py, 28, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
          ctx.stroke();

          // Progress percentage
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#a7f3d0';
          ctx.fillText(`${Math.round(progress * 100)}%`, px, py - 32);
        }
      }

      // Overclock Aura (High-voltage resonance arcs & vibrating shield)
      if (stacks > 0) {
        const auraColor = stacks >= 5 ? '#f43f5e' : '#06b6d4';
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 18 + stacks * 0.8 + Math.sin(now * 15) * 2, 0, Math.PI * 2);
        ctx.stroke();

        // High-voltage crackling spark vectors
        for (let k = 0; k < Math.min(6, stacks); k++) {
          const kAngle = (k * Math.PI) / 3 + now * 5;
          const kDist = 16 + Math.random() * 6;
          ctx.fillStyle = auraColor;
          ctx.fillRect(
            px + Math.cos(kAngle) * kDist - 1.5,
            py + Math.sin(kAngle) * kDist - 1.5,
            3,
            3
          );
        }
      }

      // Directional Headlight Cone (Industrial searchlight beam)
      const beamGrad = ctx.createRadialGradient(px, py, 6, px, py + 26, 45);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, 45, Math.PI * 0.25, Math.PI * 0.75);
      ctx.closePath();
      ctx.fill();

      // Heavy Lead Armor Hull (Angular chassis)
      const isFlashing = playerVisual.flashTime > 0;
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.fillRect(px - 11, py - 11, 22, 22);

      // Lead-plated bevels
      ctx.strokeStyle = stacks >= 5 ? '#f43f5e' : stacks > 0 ? '#06b6d4' : '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 11, py - 11, 22, 22);

      // Dual Shoulder Pauldrons with Hazard Stripes
      // Left shoulder
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 15, py - 9, 4, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 15, py - 5, 4, 3);

      // Right shoulder
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + 11, py - 9, 4, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 11, py - 5, 4, 3);

      // Rear Twin Exhaust Ports
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 7, py - 14, 4, 3);
      ctx.fillRect(px + 3, py - 14, 4, 3);

      // Cybernetic Visor Slit
      ctx.fillStyle = stacks >= 5 ? '#f43f5e' : stacks > 0 ? '#22d3ee' : '#10b981';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillRect(px - 7, py - 2, 14, 4);
      ctx.shadowBlur = 0;

      // Diegetic Overclock Badge overhead
      if (stacks > 0) {
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = stacks >= 5 ? '#f43f5e' : '#06b6d4';
        ctx.textAlign = 'center';
        ctx.fillText(`OVERCLOCK x${stacks} (+${stacks * 10} DMG)`, px, py - 32);
      }

      // Player Health Bar
      const playerHealth = this.sim.world.healths.get(this.sim.playerEntityId);
      if (playerHealth) {
        const hpPct = Math.max(0, playerHealth.current / playerHealth.max);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(px - 16, py - 24, 32, 5);
        ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(px - 16, py - 24, 32 * hpPct, 5);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 16, py - 24, 32, 5);
      }
      ctx.restore();
    }

    // ----------------------------------------------------
    // LAYER 6.5: Autonomous Projectiles (ADR 007 & ADR 008 DIVERT Engine)
    // ----------------------------------------------------
    for (const [projId, proj] of this.sim.world.projectiles.entries()) {
      if (!proj.isActive) continue;

      const visual = this.sim.world.visuals.get(projId);
      const px = (visual ? visual.renderX : proj.currentX) * TILE_SIZE;
      const py = (visual ? visual.renderY : proj.currentY) * TILE_SIZE;

      ctx.save();
      if (proj.isHostile) {
        // ====================================================================
        // ADR 008: HOSTILE FIRE (Distinct Crimson & Singularity Purple)
        // ====================================================================
        if (proj.element === 'plasma' || proj.sourceEntityId === this.sim.apexEntityId) {
          // Singularity Purple / Violet Lance (Apex Boss & Sector 02 Elite)
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(px, py, 5.0, 0, Math.PI * 2);
          ctx.fill();

          // Blinding magenta core
          ctx.fillStyle = '#fdf4ff';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Violet tachyon tracer
          const tailX = px - Math.cos(visual?.facingAngle || 0) * 14;
          const tailY = py - Math.sin(visual?.facingAngle || 0) * 14;
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(px, py);
          ctx.stroke();
        } else {
          // Threat Crimson Tracer (Echo Guard Sub-Space Carbine)
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.arc(px, py, 4.0, 0, Math.PI * 2);
          ctx.fill();

          // Hot white-red spark core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // High-visibility ruby laser tracer
          const tailX = px - Math.cos(visual?.facingAngle || 0) * 11;
          const tailY = py - Math.sin(visual?.facingAngle || 0) * 11;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      } else if (proj.element === 'plasma') {
        // Player: Radiant Cyan / Teal Plasma Bolt with Ion Corona
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // White-hot plasma core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();

        // Ion tracer tail
        const tailX = px - Math.cos(visual?.facingAngle || 0) * 12;
        const tailY = py - Math.sin(visual?.facingAngle || 0) * 12;
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(px, py);
        ctx.stroke();
      } else {
        // Player: High-velocity Kinetic Tungsten Slug with Golden Tracer
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Tracer line
        const tailX = px - Math.cos(visual?.facingAngle || 0) * 9;
        const tailY = py - Math.sin(visual?.facingAngle || 0) * 9;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ----------------------------------------------------
    // LAYER 7: Particles (Flames, Blasts, Rubble, Sparks)
    // ----------------------------------------------------
    for (const p of this.sim.particles) {
      const px = p.x * TILE_SIZE;
      const py = p.y * TILE_SIZE;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'blast') {
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + p.life * 2), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'flame') {
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    // ----------------------------------------------------
    // LAYER 8: Target Hover Reticle & Build Mode Hologram (ADR 011)
    // ----------------------------------------------------
    if (this.sim.isBuildMode && this.hoverTile) {
      const originX = this.hoverTile.x - 1;
      const originY = this.hoverTile.y - 1;
      const bp = STRUCTURE_BLUEPRINTS[this.sim.selectedBlueprintId];
      const totalScrap = this.sim.bankedScrap + this.sim.scrapCollectedInRaid;
      const check = bp
        ? BuildSystem.canPlaceStructure(
            bp.id,
            originX,
            originY,
            this.sim.world,
            this.sim.tiles,
            totalScrap
          )
        : { valid: false, reason: 'Unknown blueprint' };

      const hx = originX * TILE_SIZE;
      const hy = originY * TILE_SIZE;
      const hw = 3 * TILE_SIZE;
      const hh = 3 * TILE_SIZE;

      ctx.save();
      // Holographic fill
      ctx.fillStyle = check.valid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(hx, hy, hw, hh);

      // Outer projector boundary
      ctx.strokeStyle = check.valid ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(hx, hy, hw, hh);

      // 3x3 internal projection cells
      ctx.lineWidth = 1;
      ctx.strokeStyle = check.valid ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)';
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + i * TILE_SIZE, hy);
        ctx.lineTo(hx + i * TILE_SIZE, hy + hh);
        ctx.moveTo(hx, hy + i * TILE_SIZE);
        ctx.lineTo(hx + hw, hy + i * TILE_SIZE);
        ctx.stroke();
      }

      // Corner technical brackets
      ctx.strokeStyle = check.valid ? '#34d399' : '#f87171';
      ctx.lineWidth = 3;
      const bLen = 10;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(hx, hy + bLen);
      ctx.lineTo(hx, hy);
      ctx.lineTo(hx + bLen, hy);
      // Top-right
      ctx.moveTo(hx + hw - bLen, hy);
      ctx.lineTo(hx + hw, hy);
      ctx.lineTo(hx + hw, hy + bLen);
      // Bottom-left
      ctx.moveTo(hx, hy + hh - bLen);
      ctx.lineTo(hx, hy + hh);
      ctx.lineTo(hx + bLen, hy + hh);
      // Bottom-right
      ctx.moveTo(hx + hw - bLen, hy + hh);
      ctx.lineTo(hx + hw, hy + hh);
      ctx.lineTo(hx + hw, hy + hh - bLen);
      ctx.stroke();

      // Top label banner
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = check.valid ? '#34d399' : '#f87171';
      ctx.fillText(
        `HOLOGRAM // ${bp?.name.toUpperCase() || 'FACILITY'} [${bp?.cost || 0} SCRAP]`,
        hx + hw / 2,
        hy - 12
      );

      // Bottom warning banner if invalid
      if (!check.valid && check.reason) {
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText(check.reason, hx + hw / 2, hy + hh + 16);
      }
      ctx.restore();
    } else if (this.hoverTile) {
      const hx = this.hoverTile.x * TILE_SIZE;
      const hy = this.hoverTile.y * TILE_SIZE;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 2, hy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }

    ctx.restore();

    // ----------------------------------------------------
    // LAYER 8.5: CRT Surveillance Glitch & Phosphor Scanlines
    // (Rendered in screen coordinates over entire canvas)
    // ----------------------------------------------------
    ctx.save();
    // 1. Phosphor scanline overlay (subtle dark lines every 3px)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let sy = 0; sy < height; sy += 3) {
      ctx.fillRect(0, sy, width, 1.2);
    }

    // 2. Occasional horizontal tracking glitch slice
    const glitchTick = Math.sin(now * 8) * Math.cos(now * 14);
    if (glitchTick > 0.85) {
      const sliceY = (Math.abs(Math.sin(now * 11)) * height) % height;
      const sliceHeight = 12 + Math.random() * 16;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(0, sliceY, width, sliceHeight);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(4, sliceY, width, sliceHeight);
    }

    // 3. Cassette-Futurist HUD Watermark (Diegetic 198X monitor header)
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.textAlign = 'left';
    ctx.fillText('REC ● 198X // SECTOR-04 RECON // LEAD-MECH RIG v2.4', 16, 20);

    // Vignette CRT curvature shadow at screen edges
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.45,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // ----------------------------------------------------
    // LAYER 9: UI OVERLAYS & MINIMAP RADAR
    // ----------------------------------------------------
    this.renderMinimap(ctx, width, height);
  }

  private renderMinimap(ctx: CanvasRenderingContext2D, screenW: number, screenH: number) {
    const mapSize = 140;
    const padding = 16;
    const mx = screenW - mapSize - padding;
    const my = padding + 40;
    const now = performance.now() / 1000;

    ctx.save();
    // Radar background
    ctx.fillStyle = 'rgba(11, 17, 26, 0.92)';
    ctx.fillRect(mx, my, mapSize, mapSize);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mx, my, mapSize, mapSize);

    const scale = mapSize / MAP_WIDTH;

    if (this.sim.currentMapType === 'overworld') {
      // 1. Sanctuary outer perimeter box (64..136)
      const sancX = mx + 64 * scale;
      const sancY = my + 64 * scale;
      const sancSize = 72 * scale;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.fillRect(sancX, sancY, sancSize, sancSize);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(sancX, sancY, sancSize, sancSize);

      // 2. Player Home at Center (93..107)
      const homeX = mx + 93 * scale;
      const homeY = my + 93 * scale;
      const homeSize = 14 * scale;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(homeX, homeY, homeSize, homeSize);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(homeX, homeY, homeSize, homeSize);

      // 3. Central Core Pulse
      const corePulse = (Math.sin(now * 5) + 1) * 0.5;
      ctx.fillStyle = `rgba(56, 189, 248, ${0.7 + corePulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(mx + 100 * scale, my + 100 * scale, 3 + corePulse * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Draw 4 Cardinal Direction Dungeon Gates (N, E, S, W)
      const gates = [
        { label: 'N', x: 100, y: 68, color: '#38bdf8' },
        { label: 'E', x: 132, y: 100, color: '#10b981' },
        { label: 'S', x: 100, y: 132, color: '#f59e0b' },
        { label: 'W', x: 68, y: 100, color: '#a855f7' },
      ];
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const g of gates) {
        const gx = mx + g.x * scale;
        const gy = my + g.y * scale;
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(gx, gy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(g.label, gx, gy);
      }

      // 5. Draw 4 Corner Facilities
      const cornerFacilities = [
        { x: 82, y: 82, color: '#f97316' }, // NW Vance
        { x: 118, y: 82, color: '#10b981' }, // NE Rostova
        { x: 82, y: 118, color: '#06b6d4' }, // SW Kane
        { x: 118, y: 118, color: '#a855f7' }, // SE Thorne
      ];
      for (const cf of cornerFacilities) {
        ctx.fillStyle = cf.color;
        ctx.fillRect(mx + cf.x * scale - 2, my + cf.y * scale - 2, 4, 4);
      }
    } else {
      // DUNGEON MODE RADAR
      // 1. Extraction pad indicator at (100, 100)
      const extX = mx + 100 * scale;
      const extY = my + 100 * scale;
      const extPulse = (Math.sin(now * 6) + 1) * 0.5;
      ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + extPulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(extX, extY, 5 + extPulse * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Draw Hostiles on radar
      for (const [id, ai] of this.sim.world.aiComponents.entries()) {
        const pos = this.sim.world.gridPositions.get(id);
        const kind = this.sim.world.kinds.get(id);
        if (pos) {
          if (kind === 'ApexEcho') {
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.arc(mx + pos.x * scale, my + pos.y * scale, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (kind === 'Crawler') {
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(mx + pos.x * scale, my + pos.y * scale, 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = ai.state === 'chase' ? '#ef4444' : '#f97316';
            ctx.beginPath();
            ctx.arc(mx + pos.x * scale, my + pos.y * scale, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Common radar elements: Built Structures
    for (const [, struct] of this.sim.world.structures.entries()) {
      ctx.fillStyle = struct.color;
      ctx.fillRect(
        mx + struct.originX * scale,
        my + struct.originY * scale,
        struct.width * scale,
        struct.height * scale
      );
    }

    // Draw Player on radar
    const playerPos = this.sim.world.gridPositions.get(this.sim.playerEntityId);
    if (playerPos) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(mx + playerPos.x * scale, my + playerPos.y * scale, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Radar sweep line
    const scanY = (performance.now() / 20) % mapSize;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.fillRect(mx, my + scanY, mapSize, 2);

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = this.sim.currentMapType === 'overworld' ? '#38bdf8' : '#f43f5e';
    ctx.fillText(
      this.sim.currentMapType === 'overworld'
        ? 'OVERWORLD SANCTUARY [SECURE]'
        : `DUNGEON: ${this.sim.biomeProfile.name.toUpperCase()}`,
      mx + 4,
      my - 6
    );
    ctx.restore();
  }

  public screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Invert canvas transform
    const worldX = (screenX - width / 2) / this.zoom + this.cameraX;
    const worldY = (screenY - height / 2) / this.zoom + this.cameraY;

    const gx = Math.floor(worldX / TILE_SIZE);
    const gy = Math.floor(worldY / TILE_SIZE);

    return { x: gx, y: gy };
  }
}
