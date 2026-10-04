import React, { useEffect, useRef } from 'react';
import { GameState } from '../types';
import {
  Particle,
  ParticleSlot,
  spawnParticle,
  tickSlot,
  tickParticle,
  isParticleDead,
  spawnEventParticles,
} from '../services/particles';
import { getMaterialProfile } from '../data/materialColors';
import { INITIAL_RECIPES } from '../data/recipes';

interface MaterialCanvasProps {
  gameStateRef: React.MutableRefObject<GameState>;
  width: number;
  height: number;
}

export const MaterialCanvas: React.FC<MaterialCanvasProps> = ({ gameStateRef, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleSlotsRef = useRef<Map<string, ParticleSlot>>(new Map());
  const eventParticlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(performance.now());
  const fpsMonitorRef = useRef<number[]>([]);

  // Particle count budgets
  const slotBudgetRef = useRef<number>(80);
  const totalBudgetRef = useRef<number>(400);

  // Tracking past state to detect events without deep clone
  const prevBreachedSlotsRef = useRef<Set<string>>(new Set());
  const prevCollisionCountRef = useRef<number>(0);
  const prevDroneCargoRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (timestamp: number) => {
      // 1. Compute dt capped at 50ms (0.05s) to prevent spiral-of-death
      const rawDt = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      // 2. FPS Governor with 60-frame rolling window
      const instantFps = 1 / dt;
      fpsMonitorRef.current.push(instantFps);
      if (fpsMonitorRef.current.length > 60) {
        fpsMonitorRef.current.shift();
      }
      const avgFps =
        fpsMonitorRef.current.reduce((sum, f) => sum + f, 0) / fpsMonitorRef.current.length;

      if (avgFps < 30) {
        slotBudgetRef.current = Math.max(20, Math.floor(slotBudgetRef.current * 0.9));
        totalBudgetRef.current = Math.max(100, Math.floor(totalBudgetRef.current * 0.9));
      } else if (avgFps > 55 && slotBudgetRef.current < 80) {
        slotBudgetRef.current = Math.min(80, Math.ceil(slotBudgetRef.current * 1.05));
        totalBudgetRef.current = Math.min(400, Math.ceil(totalBudgetRef.current * 1.05));
      }

      const gameState = gameStateRef.current;
      if (!gameState) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Container DOM Element Positions relative to canvas parent
      const canvasParent = canvas.parentElement;
      const parentRect = canvasParent?.getBoundingClientRect();

      const moduleElements: HTMLElement[] = canvasParent
        ? (Array.from(canvasParent.querySelectorAll('[data-module-id]')) as HTMLElement[])
        : [];
      const moduleBoundsMap = new Map<string, { x: number; y: number; width: number; height: number }>();

      if (parentRect) {
        for (const el of moduleElements) {
          const modId = el.getAttribute('data-module-id');
          if (modId) {
            const rect = el.getBoundingClientRect();
            moduleBoundsMap.set(modId, {
              x: rect.left - parentRect.left,
              y: rect.top - parentRect.top,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      }

      // 3. Sync particle slots to container slots
      const currentSlots = gameState.containerSlots || [];
      const activeSlotIds = new Set<string>();

      // Track total active particles to respect total budget
      let totalActiveParticles = 0;
      for (const slot of particleSlotsRef.current.values()) {
        totalActiveParticles += slot.particles.length;
      }

      for (const slot of currentSlots) {
        activeSlotIds.add(slot.id);
        let pSlot = particleSlotsRef.current.get(slot.id);
        const fillRatio = slot.capacity > 0 ? Math.min(1.0, slot.amount / slot.capacity) : 0;

        if (!pSlot) {
          pSlot = {
            slotId: slot.id,
            particles: [],
            fillRatio,
          };
          particleSlotsRef.current.set(slot.id, pSlot);
        } else {
          pSlot.fillRatio = fillRatio;
        }

        const profile = getMaterialProfile(slot.compoundId || slot.stateType);
        const targetCount =
          fillRatio > 0 ? Math.max(6, Math.floor(fillRatio * slotBudgetRef.current)) : 0;

        // Spawn particles if below target and within total budget
        if (pSlot.particles.length < targetCount && totalActiveParticles < totalBudgetRef.current) {
          const spawnCount = Math.min(
            targetCount - pSlot.particles.length,
            Math.max(1, Math.floor(10 * dt * 10))
          );
          for (let i = 0; i < spawnCount; i++) {
            const color =
              Math.random() > 0.3 ? profile.primaryColor : profile.secondaryColor;
            const newParticle = spawnParticle(profile.particleBehavior, color, {
              isEmissive: profile.emissive,
              corrosive: slot.compoundId === 'mineral_slurry' || slot.compoundId === 'acidic_ether',
            });
            pSlot.particles.push(newParticle);
            totalActiveParticles++;
          }
        }

        // Tick slot particles
        const ticked = tickSlot(pSlot, dt, slotBudgetRef.current);
        particleSlotsRef.current.set(slot.id, ticked);

        // 4. Check for breach event
        if (slot.isBreached && !prevBreachedSlotsRef.current.has(slot.id)) {
          const bounds = slot.moduleId ? moduleBoundsMap.get(slot.moduleId) : null;
          const originX = bounds ? (bounds.x + bounds.width / 2) / (width || 1) : 0.5;
          const originY = bounds ? (bounds.y + bounds.height / 2) / (height || 1) : 0.5;
          const breachParticles = spawnEventParticles('breach', { x: originX, y: originY }, profile.primaryColor, 30);
          eventParticlesRef.current.push(...breachParticles);
        }
      }

      // Cleanup removed slots
      particleSlotsRef.current.forEach((_, key) => {
        if (!activeSlotIds.has(key)) {
          particleSlotsRef.current.delete(key);
        }
      });

      // Update breached tracking
      prevBreachedSlotsRef.current = new Set(
        currentSlots.filter((s) => s.isBreached).map((s) => s.id)
      );

      // Check collision impact events
      if (gameState.collisionLogs && gameState.collisionLogs.length > prevCollisionCountRef.current) {
        const latestLog = gameState.collisionLogs[gameState.collisionLogs.length - 1];
        if (latestLog) {
          const mod = gameState.modules.find((m) => m.x === latestLog.modulePos.x && m.y === latestLog.modulePos.y);
          const bounds = mod ? moduleBoundsMap.get(mod.id) : null;
          const originX = bounds ? (bounds.x + bounds.width / 2) / (width || 1) : 0.5;
          const originY = bounds ? (bounds.y + bounds.height / 2) / (height || 1) : 0.5;
          const impactParticles = spawnEventParticles('impact', { x: originX, y: originY }, '#c8c0b8', 25);
          eventParticlesRef.current.push(...impactParticles);
        }
        prevCollisionCountRef.current = gameState.collisionLogs.length;
      }

      // Check drone cargo docking events
      for (const drone of gameState.drones || []) {
        const prevCargo = prevDroneCargoRef.current.get(drone.id) || 0;
        const currentCargo =
          drone.cargo.dust +
          Object.values(drone.cargo.compounds).reduce((a: number, b: number) => a + b, 0);
        if (prevCargo > 5 && currentCargo === 0 && drone.assignedBayId) {
          // Cargo deposited
          const bounds = moduleBoundsMap.get(drone.assignedBayId);
          if (bounds) {
            const dockParticles = spawnEventParticles(
              'dock',
              { x: (bounds.x + bounds.width / 2) / (width || 1), y: (bounds.y + bounds.height / 2) / (height || 1) },
              '#00d4ff',
              16
            );
            eventParticlesRef.current.push(...dockParticles);
          }
        }
        prevDroneCargoRef.current.set(drone.id, currentCargo);
      }

      // Tick event particles
      eventParticlesRef.current = eventParticlesRef.current
        .map((p) => tickParticle(p, dt, 0.5))
        .filter((p) => !isParticleDead(p));

      // 5. Clear Canvas and Render
      ctx.clearRect(0, 0, width, height);

      // Render Synthesis Flow Lines
      const processingChambers = (gameState.modules || []).filter(
        (m) => m.type === 'processing_chamber' && m.isPowered && (m.processingProgress || 0) > 0
      );

      for (const chamber of processingChambers) {
        const chamberBounds = moduleBoundsMap.get(chamber.id);
        if (!chamberBounds) continue;

        const recipe = chamber.activeRecipeId
          ? INITIAL_RECIPES.find((r) => r.id === chamber.activeRecipeId)
          : null;
        if (!recipe) continue;

        const chamberCenterX = chamberBounds.x + chamberBounds.width / 2;
        const chamberCenterY = chamberBounds.y + chamberBounds.height / 2;

        for (const input of recipe.inputs) {
          // Find container slot with this compound
          const inputSlot = gameState.containerSlots.find((s) => s.compoundId === input.compoundId);
          if (inputSlot && inputSlot.moduleId) {
            const inputBounds = moduleBoundsMap.get(inputSlot.moduleId);
            if (inputBounds) {
              const inputCenterX = inputBounds.x + inputBounds.width / 2;
              const inputCenterY = inputBounds.y + inputBounds.height / 2;
              const midX = (inputCenterX + chamberCenterX) / 2;

              ctx.save();
              const profile = getMaterialProfile(input.compoundId);
              ctx.strokeStyle = profile.primaryColor;
              ctx.globalAlpha = Math.min(0.9, Math.max(0.2, (chamber.processingProgress || 0) / 100));
              ctx.lineWidth = 2.5;
              ctx.setLineDash([6, 6]);
              ctx.lineDashOffset = -performance.now() * 0.04;
              ctx.shadowBlur = 8;
              ctx.shadowColor = profile.primaryColor;

              ctx.beginPath();
              ctx.moveTo(inputCenterX, inputCenterY);
              ctx.bezierCurveTo(midX, inputCenterY, midX, chamberCenterY, chamberCenterX, chamberCenterY);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }

      // Render Slot Particles inside their Module Cards
      for (const slot of currentSlots) {
        const pSlot = particleSlotsRef.current.get(slot.id);
        if (!pSlot || pSlot.particles.length === 0) continue;

        const bounds = slot.moduleId ? moduleBoundsMap.get(slot.moduleId) : null;
        if (!bounds) continue;

        // Container pod interior area (slightly padded inside the card)
        const innerX = bounds.x + 12;
        const innerY = bounds.y + bounds.height * 0.45;
        const innerW = Math.max(20, bounds.width - 24);
        const innerH = Math.max(20, bounds.height * 0.45);

        for (const p of pSlot.particles) {
          const px = innerX + p.x * innerW;
          const py = innerY + p.y * innerH;
          const pSize = p.size || 3.5;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.isEmissive) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
          }

          ctx.beginPath();
          ctx.arc(px, py, pSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Render Event Particles (in full screen coordinate space)
      for (const p of eventParticlesRef.current) {
        const px = p.x * width;
        const py = p.y * height;
        const pSize = p.size || 4;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        ctx.arc(px, py, pSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [width, height, gameStateRef]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="material-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
};

