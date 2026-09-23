/**
 * @file src/components/KitchenCanvas.tsx
 * Thin orchestrator canvas component rendering the 2D Kitchen floorplan and delegating
 * subsystem rendering to focused modules in src/components/canvas/.
 */

import React, { useEffect, useRef } from 'react';
import {
  KITCHEN_HEIGHT,
  KITCHEN_WIDTH,
  STAFF_AREA,
  STATION_CONFIGS,
  WARM_OUTLINE_COLOR,
  ZONE_PALETTE,
} from '../data';
import { unloadTruck } from '../stockEconomy';
import { investigateWorker } from '../scoring/taskSelection';
import { KitchenState, StationId } from '../types';
import { renderCustomers } from './canvas/renderCustomers';
import { renderHUD } from './canvas/renderHUD';
import { renderManager } from './canvas/renderManager';
import { renderWorkers } from './canvas/renderWorkers';

interface KitchenCanvasProps {
  state: KitchenState;
  onStartNextDay?: () => void;
}

function getZonePaletteForStation(id: StationId) {
  const config = STATION_CONFIGS[id];
  return ZONE_PALETTE[config.visualZone];
}

export const KitchenCanvas: React.FC<KitchenCanvasProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = KITCHEN_WIDTH / rect.width;
    const scaleY = KITCHEN_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (const w of state.workers) {
      const dx = clickX - w.x;
      const dy = clickY - w.y;
      if (
        Math.sqrt(dx * dx + dy * dy) < 35 ||
        (w.currentTask === 'corner_cut' && Math.abs(dx) < 30 && clickY >= w.y - 50 && clickY <= w.y + 20)
      ) {
        investigateWorker(state, w.id);
        return;
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, KITCHEN_WIDTH, KITCHEN_HEIGHT);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < KITCHEN_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, KITCHEN_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < KITCHEN_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(KITCHEN_WIDTH, y);
      ctx.stroke();
    }

    // Customer Zone / Kitchen Divider Line at x = 260
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(260, 0);
    ctx.lineTo(260, KITCHEN_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // 1. Draw Manager
    renderManager(ctx, state);

    // 2. Draw Machine Glyphs
    const drawMachineGlyph = (
      type: StationId | 'staff',
      cx: number,
      cy: number,
      color: string
    ) => {
      ctx.save();
      ctx.translate(cx, cy);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = WARM_OUTLINE_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let glyph = '⚙️';
      if (type === 'queue') glyph = '🛎️';
      else if (type === 'grill') glyph = '🔥';
      else if (type === 'assembly') glyph = '🍱';
      else if (type === 'fryer') glyph = '🍟';
      else if (type === 'window') glyph = '🛍️';
      else if (type === 'staff' || type === 'coffee') glyph = '☕';

      ctx.fillText(glyph, 0, 1);
      ctx.restore();
    };

    // Staff Area Floor Zone
    ctx.fillStyle = ZONE_PALETTE.support.fill;
    ctx.strokeStyle = ZONE_PALETTE.support.stroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(STAFF_AREA.x, STAFF_AREA.y, STAFF_AREA.width, STAFF_AREA.height, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ZONE_PALETTE.support.hex;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Staff Break & Meal Area', STAFF_AREA.x + STAFF_AREA.width / 2, STAFF_AREA.y + 16);
    drawMachineGlyph('staff', STAFF_AREA.x + STAFF_AREA.width / 2, STAFF_AREA.y + 44, ZONE_PALETTE.support.hex);

    // 3. Draw Stations
    for (const station of state.stations) {
      if (state.unlockedStations && state.unlockedStations[station.id] === false) {
        continue;
      }
      const config = STATION_CONFIGS[station.id];
      const isOccupied = station.occupiedBy !== null;
      const zone = getZonePaletteForStation(station.id);

      ctx.fillStyle = zone.fill;
      ctx.strokeStyle = isOccupied ? config.color : zone.stroke;
      ctx.lineWidth = isOccupied ? 2 : 1;

      ctx.beginPath();
      ctx.roundRect(station.x, station.y, station.width, station.height, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(config.name, station.x + station.width / 2, station.y + 14);

      // Batch Quality Bar & Numeric Percentage
      const quality = station.batchQuality ?? 100;
      let qColor = '#22c55e'; // green at 75%+
      if (quality < 40) {
        qColor = '#ef4444'; // red below 40%
      } else if (quality < 75) {
        qColor = '#f59e0b'; // amber 40-74%
      }

      // Quality percentage text (top-right of station box)
      ctx.fillStyle = qColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(quality)}%`, station.x + station.width - 6, station.y + 12);

      // Quality bar (above bottom order info)
      const barX = station.x + 10;
      const barY = station.y + station.height - 18;
      const barW = station.width - 20;
      const barH = 3;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = qColor;
      ctx.fillRect(barX, barY, barW * (Math.max(0, Math.min(100, quality)) / 100), barH);

      // Degradation Stage Indicator Badge & Border
      if (station.degradationStage && station.degradationStage > 0) {
        const stageColors = ['#f59e0b', '#f97316', '#ef4444'];
        const degColor = stageColors[Math.min(station.degradationStage - 1, 2)];

        ctx.strokeStyle = degColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(station.x, station.y, station.width, station.height, 10);
        ctx.stroke();

        ctx.fillStyle = degColor;
        ctx.beginPath();
        ctx.roundRect(station.x + 4, station.y + 4, 30, 12, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`STG ${station.degradationStage}`, station.x + 19, station.y + 12);
      }

      drawMachineGlyph(
        station.id,
        station.x + station.width / 2,
        station.y + station.height / 2 - 2,
        config.color
      );

      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      ctx.fillText(
        station.bufferCapacity > 0
          ? `Orders: ${station.orders.length}/${station.bufferCapacity}`
          : `Coffee Pot: ${state.coffeePotUnits.toFixed(1)}u`,
        station.x + station.width / 2,
        station.y + station.height - 8
      );

      if (isOccupied) {
        const occWorker = state.workers.find((w) => w.id === station.occupiedBy);
        if (occWorker) {
          ctx.fillStyle = occWorker.color;
          ctx.beginPath();
          ctx.arc(station.x + station.width - 10, station.y + 10, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const drawBurgerIcon = (x: number, y: number, complete: boolean) => {
        ctx.save();
        ctx.globalAlpha = complete ? 1.0 : 0.35;
        ctx.fillStyle = complete ? '#f59e0b' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(x, y - 2, 5, Math.PI, 0, false);
        ctx.fill();

        ctx.fillStyle = complete ? '#78350f' : '#475569';
        ctx.fillRect(x - 5, y - 1, 10, 2.5);

        ctx.fillStyle = complete ? '#d97706' : '#64748b';
        ctx.beginPath();
        ctx.roundRect(x - 4, y + 2, 8, 2.5, 1);
        ctx.fill();
        ctx.restore();
      };

      const drawFriesIcon = (x: number, y: number, complete: boolean) => {
        ctx.save();
        ctx.globalAlpha = complete ? 1.0 : 0.35;
        ctx.fillStyle = complete ? '#facc15' : '#cbd5e1';
        ctx.fillRect(x - 3, y - 6, 1.5, 5);
        ctx.fillRect(x - 0.75, y - 7, 1.5, 6);
        ctx.fillRect(x + 1.5, y - 5, 1.5, 4);

        ctx.fillStyle = complete ? '#ef4444' : '#64748b';
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 1);
        ctx.lineTo(x + 4, y - 1);
        ctx.lineTo(x + 3, y + 5);
        ctx.lineTo(x - 3, y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      station.orders.forEach((order, i) => {
        const slotX = station.x + 16 + (i % 4) * 22;
        const slotY = station.y + station.height + 14 + Math.floor(i / 4) * 18;

        if (order.wantsFries) {
          drawBurgerIcon(slotX - 6, slotY, order.burgerComplete);
          drawFriesIcon(slotX + 6, slotY, order.friesComplete);
        } else {
          drawBurgerIcon(slotX, slotY, order.burgerComplete);
        }
      });
    }

    // Pipeline Arrows connecting stations
    const queueStation = state.stations.find((s) => s.id === 'queue');
    const grillStation = state.stations.find((s) => s.id === 'grill');
    const assemblyStation = state.stations.find((s) => s.id === 'assembly');
    const windowStation = state.stations.find((s) => s.id === 'window');
    const fryerStation = state.stations.find((s) => s.id === 'fryer');

    const drawFlowArrow = (x1: number, y1: number, x2: number, y2: number, color = '#475569', isDashed = false) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (isDashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    if (queueStation && grillStation) {
      drawFlowArrow(
        queueStation.x + queueStation.width,
        queueStation.y + queueStation.height / 2,
        grillStation.x,
        grillStation.y + grillStation.height / 2
      );
    }

    if (grillStation && assemblyStation) {
      drawFlowArrow(
        grillStation.x + grillStation.width,
        grillStation.y + grillStation.height / 2,
        assemblyStation.x,
        assemblyStation.y + assemblyStation.height / 2
      );
    }

    if (assemblyStation && windowStation) {
      drawFlowArrow(
        assemblyStation.x,
        assemblyStation.y + assemblyStation.height,
        windowStation.x + windowStation.width / 2,
        windowStation.y
      );
    }

    if (fryerStation && state.unlockedStations?.fryer && windowStation) {
      drawFlowArrow(
        fryerStation.x + fryerStation.width / 2,
        fryerStation.y + fryerStation.height,
        windowStation.x + windowStation.width - 20,
        windowStation.y,
        '#eab308',
        true
      );
    }

    // Draw Messes on floor (single shared drawn shape, source-blind)
    if (state.messes) {
      for (const m of state.messes) {
        ctx.save();
        ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, 14, 10, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Draw Customers
    renderCustomers(ctx, state);

    // 5. Draw Workers
    renderWorkers(ctx, state.workers, state);

    // 6. Draw HUD overlay
    renderHUD(ctx, state);
  }, [state]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900">
      <canvas
        ref={canvasRef}
        width={KITCHEN_WIDTH}
        height={KITCHEN_HEIGHT}
        onClick={handleCanvasClick}
        className="w-full h-auto block cursor-pointer"
      />
    </div>
  );
};
