import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sound } from '../src/games/slither_rogue/utils/sound';

/**
 * test_slither_rogue_sound
 *
 * Covers utils/sound.ts: the local procedural Web Audio engine that
 * follows the gladiator_arena SoundEngine pattern. jsdom provides no
 * AudioContext, so the tests stub it on window and assert on the
 * oscillator/gain parameters the engine actually programs.
 */

class FakeAudioParam {
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeOscillator {
  type = '';
  frequency = new FakeAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain {
  gain = new FakeAudioParam();
  connect = vi.fn();
}

const createdContexts: FakeAudioContext[] = [];

class FakeAudioContext {
  state = 'running';
  currentTime = 10;
  destination = { kind: 'destination' };
  resume = vi.fn(() => Promise.resolve());
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  constructor() {
    createdContexts.push(this);
  }
  createOscillator() {
    const osc = new FakeOscillator();
    this.oscillators.push(osc);
    return osc;
  }
  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
}

// The engine caches its AudioContext privately; reset between tests so
// each test controls which context factory is installed.
function resetEngine() {
  (sound as unknown as { ctx: unknown }).ctx = null;
  createdContexts.length = 0;
}

beforeEach(() => {
  resetEngine();
  sound.setEnabled(true);
  const w = window as unknown as Record<string, unknown>;
  w.AudioContext = FakeAudioContext;
});

afterEach(() => {
  const w = window as unknown as Record<string, unknown>;
  delete w.AudioContext;
  delete w.webkitAudioContext;
  sound.setEnabled(true);
});

describe('slither_rogue utils/sound', () => {
  describe('enabled flag', () => {
    it('round-trips through setEnabled/isSoundEnabled', () => {
      sound.setEnabled(false);
      expect(sound.isSoundEnabled()).toBe(false);
      sound.setEnabled(true);
      expect(sound.isSoundEnabled()).toBe(true);
    });
  });

  describe('mute gate', () => {
    it('play methods create no AudioContext and no nodes when muted', () => {
      sound.setEnabled(false);
      sound.unlock();
      sound.playEat();
      sound.playEat(true);
      sound.playSteal();
      sound.playStolen();
      sound.playShieldBreak();
      sound.playEvolveOffer();
      sound.playEvolve();
      sound.playGameOver();
      sound.playUiConfirm();
      expect(createdContexts).toHaveLength(0);
    });
  });

  describe('AudioContext acquisition', () => {
    it('lazily creates one context and reuses it across calls', () => {
      sound.playEat();
      sound.playEat();
      sound.playGameOver();
      expect(createdContexts).toHaveLength(1);
    });

    it('falls back to webkitAudioContext when AudioContext is absent', () => {
      const w = window as unknown as Record<string, unknown>;
      w.AudioContext = undefined;
      w.webkitAudioContext = FakeAudioContext;
      sound.playEat();
      expect(createdContexts).toHaveLength(1);
    });

    it('resumes the context when its state is suspended', () => {
      const w = window as unknown as Record<string, unknown>;
      w.AudioContext = class extends FakeAudioContext {
        state = 'suspended';
      };
      sound.unlock();
      expect(createdContexts[0].resume).toHaveBeenCalled();
    });

    it('creates no context when AudioContext is entirely absent', () => {
      const w = window as unknown as Record<string, unknown>;
      delete w.AudioContext;
      expect(() => sound.playEat()).not.toThrow();
      expect(createdContexts).toHaveLength(0);
    });
  });

  describe('playEat', () => {
    it('plays one rising sine blip for a normal fruit', () => {
      sound.playEat(false);
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(1);
      const osc = ctx.oscillators[0];
      expect(osc.type).toBe('sine');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(480, 10);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(720, 10.09);
      expect(osc.connect).toHaveBeenCalledWith(ctx.gains[0]);
      expect(ctx.gains[0].connect).toHaveBeenCalledWith(ctx.destination);
    });

    it('adds a second sparkle note for a golden fruit', () => {
      sound.playEat(true);
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(2);
      expect(ctx.oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(960, 10.07);
    });
  });

  describe('playStolen / playSteal', () => {
    it('playStolen is a descending sawtooth hurt sting', () => {
      sound.playStolen();
      const osc = createdContexts[0].oscillators[0];
      expect(osc.type).toBe('sawtooth');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(200, 10);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(70, 10.22);
    });

    it('playSteal is a rising triangle confirmation', () => {
      sound.playSteal();
      const osc = createdContexts[0].oscillators[0];
      expect(osc.type).toBe('triangle');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(260, 10);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(520, 10.15);
    });
  });

  describe('playEvolve / playGameOver', () => {
    it('playEvolve is a 3-note ascending sine arpeggio staggered 80ms', () => {
      sound.playEvolve();
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(3);
      const freqs = [523.25, 659.25, 783.99];
      ctx.oscillators.forEach((osc, i) => {
        expect(osc.type).toBe('sine');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.08);
      });
    });

    it('playGameOver is a 3-note descending triangle sting staggered 160ms', () => {
      sound.playGameOver();
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(3);
      const freqs = [392.0, 311.13, 261.63];
      ctx.oscillators.forEach((osc, i) => {
        expect(osc.type).toBe('triangle');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.16);
      });
    });
  });
});
