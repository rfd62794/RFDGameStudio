import { describe, it, expect } from 'vitest';
import {
  spawnParticle,
  tickParticle,
  isParticleDead,
  tickSlot,
  spawnEventParticles,
  Particle,
  ParticleSlot,
} from '../ts/src/games/voidrift_redux/services/particles';

describe('VoidRift Redux — Particle System Engine (Phase 2)', () => {
  it('1. spawnParticle gas returns particle with behavior: drift and negative vy', () => {
    const p = spawnParticle('drift', '#b3d9ff');
    expect(p.behavior).toBe('drift');
    expect(p.vy).toBeLessThan(0);
    expect(p.color).toBe('#b3d9ff');
  });

  it('2. spawnParticle liquid returns particle with behavior: settle and positive vy', () => {
    const p = spawnParticle('settle', '#c8a04a');
    expect(p.behavior).toBe('settle');
    expect(p.vy).toBeGreaterThan(0);
    expect(p.color).toBe('#c8a04a');
  });

  it('3. spawnParticle solid returns particle with behavior: pulse and zero velocity', () => {
    const p = spawnParticle('pulse', '#8aad8a');
    expect(p.behavior).toBe('pulse');
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
    expect(p.color).toBe('#8aad8a');
  });

  it('4. spawnParticle dust returns particle with behavior: float and small velocity', () => {
    const p = spawnParticle('float', '#c8c0b8');
    expect(p.behavior).toBe('float');
    expect(Math.abs(p.vx)).toBeLessThanOrEqual(0.2);
    expect(Math.abs(p.vy)).toBeLessThanOrEqual(0.2);
    expect(p.color).toBe('#c8c0b8');
  });

  it('5. tickParticle drift: high fillRatio (0.9) produces higher upward velocity than low fillRatio (0.1)', () => {
    const p: Particle = {
      id: 1,
      x: 0.5,
      y: 0.5,
      vx: 0,
      vy: -0.3,
      baseVy: -0.3,
      life: 1.0,
      size: 4,
      opacity: 1,
      color: '#b3d9ff',
      behavior: 'drift',
    };

    const tickedHigh = tickParticle(p, 0.1, 0.9);
    const tickedLow = tickParticle(p, 0.1, 0.1);

    // Upward velocity is negative, so higher upward speed means larger magnitude |vy| (more negative)
    expect(Math.abs(tickedHigh.vy)).toBeGreaterThan(Math.abs(tickedLow.vy));
    expect(tickedHigh.vy).toBeLessThan(tickedLow.vy);
  });

  it('6. tickParticle drift: particle near top wall (y < 0.05) scatters horizontally', () => {
    const p: Particle = {
      id: 2,
      x: 0.5,
      y: 0.03, // near top wall
      vx: 0.05,
      vy: -0.3,
      baseVy: -0.3,
      life: 1.0,
      size: 4,
      opacity: 1,
      color: '#b3d9ff',
      behavior: 'drift',
    };

    const ticked = tickParticle(p, 0.1, 0.5);
    expect(Math.abs(ticked.vx)).toBeGreaterThan(0.2);
  });

  it('7. tickParticle settle: particle above surface (y < 1 - fillRatio) has positive vy', () => {
    const fillRatio = 0.4; // surface is at y = 1 - 0.4 = 0.6
    const p: Particle = {
      id: 3,
      x: 0.5,
      y: 0.2, // above surface
      vx: 0.02,
      vy: 0.3,
      baseVy: 0.3,
      life: 1.0,
      size: 4,
      opacity: 1,
      color: '#c8a04a',
      behavior: 'settle',
    };

    const ticked = tickParticle(p, 0.1, fillRatio);
    expect(ticked.vy).toBeGreaterThan(0);
    expect(ticked.y).toBeGreaterThan(0.2);
  });

  it('8. tickParticle settle: particle at surface (y >= 1 - fillRatio) has zero vy', () => {
    const fillRatio = 0.4; // surface is at y = 0.6
    const p: Particle = {
      id: 4,
      x: 0.5,
      y: 0.6, // at surface
      vx: 0.02,
      vy: 0.3,
      baseVy: 0.3,
      life: 1.0,
      size: 4,
      opacity: 1,
      color: '#c8a04a',
      behavior: 'settle',
    };

    const ticked = tickParticle(p, 0.1, fillRatio);
    expect(ticked.vy).toBe(0);
  });

  it('9. tickParticle pulse: size oscillates — two ticks at different times produce different sizes', () => {
    const p: Particle = {
      id: 5,
      x: 0.5,
      y: 0.5,
      vx: 0,
      vy: 0,
      life: 1.0,
      size: 5,
      baseSize: 5,
      opacity: 1,
      color: '#8aad8a',
      behavior: 'pulse',
      elapsedTime: 0,
    };

    const ticked1 = tickParticle({ ...p }, 0.5, 0.5);
    const ticked2 = tickParticle({ ...p }, 1.5, 0.5);

    expect(ticked1.size).not.toBe(ticked2.size);
  });

  it('10. tickParticle float: velocity stays within ±0.2 cap after many ticks', () => {
    let p: Particle = {
      id: 6,
      x: 0.5,
      y: 0.5,
      vx: 0.1,
      vy: -0.1,
      life: 1.0,
      size: 4,
      opacity: 1,
      color: '#c8c0b8',
      behavior: 'float',
      elapsedTime: 0,
    };

    for (let i = 0; i < 200; i++) {
      p = tickParticle(p, 0.05, 0.5);
      expect(p.vx).toBeGreaterThanOrEqual(-0.2);
      expect(p.vx).toBeLessThanOrEqual(0.2);
      expect(p.vy).toBeGreaterThanOrEqual(-0.2);
      expect(p.vy).toBeLessThanOrEqual(0.2);
    }
  });

  it('11. isParticleDead returns true when life <= 0', () => {
    const p: Particle = {
      id: 7,
      x: 0.5,
      y: 0.5,
      vx: 0,
      vy: 0,
      life: 0,
      size: 4,
      opacity: 1,
      color: '#fff',
      behavior: 'drift',
    };
    expect(isParticleDead(p)).toBe(true);

    const pNegative = { ...p, life: -0.1 };
    expect(isParticleDead(pNegative)).toBe(true);
  });

  it('12. isParticleDead returns false when life > 0', () => {
    const p: Particle = {
      id: 8,
      x: 0.5,
      y: 0.5,
      vx: 0,
      vy: 0,
      life: 0.5,
      size: 4,
      opacity: 1,
      color: '#fff',
      behavior: 'drift',
    };
    expect(isParticleDead(p)).toBe(false);
  });

  it('13. tickSlot budget: removes oldest particles first when over budget', () => {
    const p1 = { ...spawnParticle('float', '#aaa'), id: 101 };
    const p2 = { ...spawnParticle('float', '#aaa'), id: 102 };
    const p3 = { ...spawnParticle('float', '#aaa'), id: 103 };
    const p4 = { ...spawnParticle('float', '#aaa'), id: 104 };

    const slot: ParticleSlot = {
      slotId: 'slot-1',
      particles: [p1, p2, p3, p4],
      fillRatio: 0.5,
    };

    const budget = 2;
    const result = tickSlot(slot, 0.05, budget);

    expect(result.particles.length).toBe(2);
    expect(result.particles.map((p) => p.id)).toEqual([103, 104]);
  });

  it('14. tickSlot budget: never exceeds budget after tick', () => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      ...spawnParticle('drift', '#b3d9ff'),
      id: 200 + i,
    }));

    const slot: ParticleSlot = {
      slotId: 'slot-test',
      particles,
      fillRatio: 0.8,
    };

    const budget = 20;
    const result = tickSlot(slot, 0.05, budget);
    expect(result.particles.length).toBeLessThanOrEqual(budget);
  });

  it('15. tickSlot fillRatio: updates slot fillRatio from provided value', () => {
    const slot: ParticleSlot = {
      slotId: 'slot-fill',
      particles: [spawnParticle('settle', '#c8a04a')],
      fillRatio: 0.75,
    };

    const result = tickSlot(slot, 0.05, 80);
    expect(result.fillRatio).toBe(0.75);
  });

  it('16. spawnEventParticles breach: returns exactly count particles', () => {
    const particles = spawnEventParticles('breach', { x: 0.5, y: 0.5 }, '#b3d9ff', 25);
    expect(particles.length).toBe(25);
  });

  it('17. spawnEventParticles breach: all particles originate near origin coordinates', () => {
    const origin = { x: 0.4, y: 0.6 };
    const particles = spawnEventParticles('breach', origin, '#6a3d9a', 30);
    for (const p of particles) {
      expect(Math.abs(p.x - origin.x)).toBeLessThan(0.1);
      expect(Math.abs(p.y - origin.y)).toBeLessThan(0.1);
    }
  });

  it('18. spawnEventParticles dock: returns particles with outward velocity vectors from origin', () => {
    const origin = { x: 0.5, y: 0.5 };
    const particles = spawnEventParticles('dock', origin, '#00d4ff', 15);
    expect(particles.length).toBe(15);
    for (const p of particles) {
      const speedSq = p.vx * p.vx + p.vy * p.vy;
      expect(speedSq).toBeGreaterThan(0.01);
    }
  });
});
