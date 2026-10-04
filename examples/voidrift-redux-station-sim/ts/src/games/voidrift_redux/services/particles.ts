export interface Particle {
  id: number;
  x: number; // relative to slot bounding box (0-1)
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1, decrements each tick
  size: number; // px
  opacity: number;
  color: string;
  behavior: 'drift' | 'settle' | 'pulse' | 'float';
  baseSize?: number;
  elapsedTime?: number;
  isEmissive?: boolean;
  corrosive?: boolean;
  maxLife?: number;
  baseVy?: number;
  baseVx?: number;
}

export interface ParticleSlot {
  slotId: string;
  particles: Particle[];
  fillRatio: number; // 0-1, from simulation state
}

let particleIdCounter = 1;

export function spawnParticle(
  behavior: Particle['behavior'],
  color: string,
  options?: { isEmissive?: boolean; corrosive?: boolean; size?: number }
): Particle {
  const id = particleIdCounter++;
  const baseSize = options?.size ?? (behavior === 'pulse' ? 5 : 3.5);

  switch (behavior) {
    case 'drift': {
      const vx = (Math.random() - 0.5) * 0.6; // +/- 0.3
      const vy = -0.25 - Math.random() * 0.25; // negative (upward)
      return {
        id,
        x: 0.1 + Math.random() * 0.8,
        y: 0.5 + Math.random() * 0.45,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        life: 1.0,
        maxLife: 2 + Math.random() * 2, // 2-4 seconds
        size: baseSize,
        baseSize,
        opacity: options?.isEmissive ? 0.95 : 0.85,
        color,
        behavior: 'drift',
        elapsedTime: 0,
        isEmissive: options?.isEmissive,
      };
    }

    case 'settle': {
      const vx = (Math.random() - 0.5) * 0.2; // +/- 0.1
      const vy = 0.25 + Math.random() * 0.25; // positive (downward)
      return {
        id,
        x: 0.1 + Math.random() * 0.8,
        y: Math.random() * 0.4,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        life: 1.0,
        maxLife: 1000, // persistent
        size: baseSize,
        baseSize,
        opacity: options?.isEmissive ? 0.95 : 0.85,
        color,
        behavior: 'settle',
        elapsedTime: 0,
        isEmissive: options?.isEmissive,
        corrosive: options?.corrosive,
      };
    }

    case 'pulse': {
      return {
        id,
        x: 0.2 + Math.random() * 0.6,
        y: 0.2 + Math.random() * 0.6,
        vx: 0,
        vy: 0,
        baseVx: 0,
        baseVy: 0,
        life: 1.0,
        maxLife: 1000, // persistent
        size: baseSize,
        baseSize,
        opacity: options?.isEmissive ? 0.95 : 0.85,
        color,
        behavior: 'pulse',
        elapsedTime: 0,
        isEmissive: options?.isEmissive,
      };
    }

    case 'float':
    default: {
      const vx = (Math.random() - 0.5) * 0.3; // +/- 0.15
      const vy = (Math.random() - 0.5) * 0.3; // +/- 0.15
      return {
        id,
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.8,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        life: 1.0,
        maxLife: 5 + Math.random() * 5, // 5-10 seconds
        size: baseSize,
        baseSize,
        opacity: options?.isEmissive ? 0.95 : 0.8,
        color,
        behavior: 'float',
        elapsedTime: 0,
        isEmissive: options?.isEmissive,
      };
    }
  }
}

export function tickParticle(p: Particle, dt: number, fillRatio: number): Particle {
  const elapsed = (p.elapsedTime || 0) + dt;

  switch (p.behavior) {
    case 'drift': {
      // Pressure effect: high fillRatio (> 0.8) yields 1.5x upward speed
      const baseUpwardVy = p.baseVy !== undefined ? p.baseVy : (p.vy !== 0 ? p.vy : -0.3);
      const pressureMultiplier = fillRatio > 0.8 ? 1.5 : Math.max(0.5, 0.6 + fillRatio * 0.4);
      let vy = baseUpwardVy * pressureMultiplier;

      // Top wall scatter: particle near top wall (y < 0.05) scatters horizontally
      let vx = p.vx;
      if (p.y < 0.05) {
        vx = Math.abs(p.vx) < 0.3 ? (p.vx >= 0 ? 0.35 : -0.35) : p.vx * 1.5;
        vy = Math.max(vy * 0.2, -0.05);
      }

      let nextX = p.x + vx * dt;
      let nextY = p.y + vy * dt;

      // Bounce/wrap at side boundaries
      if (nextX < 0.02) {
        nextX = 0.02;
        vx = Math.abs(vx);
      } else if (nextX > 0.98) {
        nextX = 0.98;
        vx = -Math.abs(vx);
      }

      const maxLife = p.maxLife || 3;
      const life = p.life - dt / maxLife;

      return {
        ...p,
        x: nextX,
        y: nextY,
        vx,
        vy,
        life,
        elapsedTime: elapsed,
      };
    }

    case 'settle': {
      const surfaceY = Math.max(0, 1 - fillRatio);
      let vy = 0;
      let nextY = p.y;
      let nextX = p.x + p.vx * dt;
      let nextVx = p.vx;

      if (p.y < surfaceY) {
        // Above surface: positive downward velocity
        const baseDownVy = p.baseVy !== undefined && p.baseVy > 0 ? p.baseVy : 0.3;
        vy = baseDownVy;
        nextY = Math.min(surfaceY, p.y + vy * dt);
        if (nextY >= surfaceY) {
          vy = 0;
        }
      } else {
        // At or below surface: settled
        vy = 0;
        nextY = Math.max(surfaceY, p.y);
      }

      // Lateral boundary bounce
      if (nextX < 0.02) {
        nextX = 0.02;
        nextVx = Math.abs(nextVx);
      } else if (nextX > 0.98) {
        nextX = 0.98;
        nextVx = -Math.abs(nextVx);
      }

      // Corrosive pulsing opacity on 2-second sine cycle
      let opacity = p.opacity;
      if (p.corrosive) {
        opacity = 0.8 + 0.2 * Math.sin(elapsed * Math.PI);
      }

      return {
        ...p,
        x: nextX,
        y: nextY,
        vx: nextVx,
        vy,
        elapsedTime: elapsed,
        opacity,
      };
    }

    case 'pulse': {
      // Position fixed at spawn
      const baseSize = p.baseSize || p.size || 5;
      // 3-second cycle
      const size = baseSize * (1.0 + 0.1 * Math.sin(elapsed * ((2 * Math.PI) / 3)));
      const baseOpacity = 0.85 + 0.15 * Math.sin(elapsed * ((2 * Math.PI) / 3));
      const opacity = p.isEmissive ? Math.min(1.0, baseOpacity + 0.15) : baseOpacity;

      return {
        ...p,
        size,
        opacity,
        elapsedTime: elapsed,
        vx: 0,
        vy: 0,
      };
    }

    case 'float':
    default: {
      // Deterministic pseudo-brownian motion
      const deltaVx = 0.05 * Math.sin((p.id || 1) * 1.7 + elapsed * 2.0);
      const deltaVy = 0.05 * Math.cos((p.id || 1) * 2.3 + elapsed * 1.8);

      let nextVx = p.vx + deltaVx * dt;
      let nextVy = p.vy + deltaVy * dt;

      // Cap at +/- 0.2
      nextVx = Math.max(-0.2, Math.min(0.2, nextVx));
      nextVy = Math.max(-0.2, Math.min(0.2, nextVy));

      let nextX = p.x + nextVx * dt;
      let nextY = p.y + nextVy * dt;

      // Bounce at slot boundaries
      if (nextX < 0.02) {
        nextX = 0.02;
        nextVx = Math.abs(nextVx);
      } else if (nextX > 0.98) {
        nextX = 0.98;
        nextVx = -Math.abs(nextVx);
      }
      if (nextY < 0.02) {
        nextY = 0.02;
        nextVy = Math.abs(nextVy);
      } else if (nextY > 0.98) {
        nextY = 0.98;
        nextVy = -Math.abs(nextVy);
      }

      const maxLife = p.maxLife || 7.5;
      const life = p.life - dt / maxLife;

      return {
        ...p,
        x: nextX,
        y: nextY,
        vx: nextVx,
        vy: nextVy,
        life,
        elapsedTime: elapsed,
      };
    }
  }
}

export function isParticleDead(p: Particle): boolean {
  return p.life <= 0;
}

export function tickSlot(slot: ParticleSlot, dt: number, budget: number): ParticleSlot {
  let particles = slot.particles;

  // Remove excess oldest-first before ticking
  if (particles.length > budget) {
    particles = particles.slice(particles.length - budget);
  }

  // Pure tick each particle and filter dead ones
  const updatedParticles = particles
    .map((p) => tickParticle(p, dt, slot.fillRatio))
    .filter((p) => !isParticleDead(p));

  // Enforce budget after tick
  const finalParticles =
    updatedParticles.length > budget
      ? updatedParticles.slice(updatedParticles.length - budget)
      : updatedParticles;

  return {
    ...slot,
    particles: finalParticles,
  };
}

export function spawnEventParticles(
  event: 'breach' | 'dock' | 'impact',
  origin: { x: number; y: number },
  color: string,
  count: number
): Particle[] {
  const result: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const id = particleIdCounter++;
    if (event === 'breach') {
      const angle = Math.random() * 2 * Math.PI;
      const speed = 0.3 + Math.random() * 0.5;
      result.push({
        id,
        x: origin.x + (Math.random() - 0.5) * 0.05,
        y: origin.y + (Math.random() - 0.5) * 0.05,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0 + Math.random() * 0.8,
        size: 3.5,
        baseSize: 3.5,
        opacity: 0.9,
        color,
        behavior: 'drift',
        elapsedTime: 0,
      });
    } else if (event === 'dock') {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.2;
      const speed = 0.25 + Math.random() * 0.35;
      result.push({
        id,
        x: origin.x + Math.cos(angle) * 0.02,
        y: origin.y + Math.sin(angle) * 0.02,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.2,
        size: 3.0,
        baseSize: 3.0,
        opacity: 0.9,
        color,
        behavior: 'float',
        elapsedTime: 0,
      });
    } else {
      // impact
      const angle = Math.random() * 2 * Math.PI;
      const speed = 0.3 + Math.random() * 0.4;
      result.push({
        id,
        x: origin.x + (Math.random() - 0.5) * 0.04,
        y: origin.y + (Math.random() - 0.5) * 0.04,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        size: 4.0,
        baseSize: 4.0,
        opacity: 0.85,
        color,
        behavior: 'float',
        elapsedTime: 0,
      });
    }
  }

  return result;
}
