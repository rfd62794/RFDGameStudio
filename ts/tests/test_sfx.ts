import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SfxEngine, SFX_MIN_GAIN, gainEnvelope, sfx, BUILTIN_SFX_EVENTS } from '../src/engine/shared/sfx';
import type { SfxEventDef } from '../src/engine/shared/sfx';

/**
 * test_sfx
 *
 * Covers engine/shared/sfx: the shared procedural Web Audio engine
 * generalized from gladiator_arena's soundEffects.ts. jsdom provides no
 * AudioContext, so the tests stub it on window and assert on the
 * oscillator/gain/buffer parameters the engine actually programs.
 * Fresh SfxEngine instances keep tests isolated from the `sfx` singleton.
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

class FakeBuffer {
  constructor(public length: number) {}
  getChannelData = vi.fn(() => new Float32Array(this.length));
}

class FakeBufferSource {
  buffer: unknown = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeBiquadFilter {
  type = '';
  frequency = new FakeAudioParam();
  Q = new FakeAudioParam();
  connect = vi.fn();
}

const createdContexts: FakeAudioContext[] = [];

class FakeAudioContext {
  state = 'running';
  currentTime = 10;
  sampleRate = 8000;
  destination = { kind: 'destination' };
  resume = vi.fn(() => Promise.resolve());
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  sources: FakeBufferSource[] = [];
  filters: FakeBiquadFilter[] = [];
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
  createBuffer(_channels: number, length: number, _rate: number) {
    return new FakeBuffer(length);
  }
  createBufferSource() {
    const src = new FakeBufferSource();
    this.sources.push(src);
    return src;
  }
  createBiquadFilter() {
    const filter = new FakeBiquadFilter();
    this.filters.push(filter);
    return filter;
  }
}

function makeEngine(): SfxEngine {
  return new SfxEngine();
}

beforeEach(() => {
  createdContexts.length = 0;
  const w = window as unknown as Record<string, unknown>;
  w.AudioContext = FakeAudioContext;
});

afterEach(() => {
  const w = window as unknown as Record<string, unknown>;
  delete w.AudioContext;
  delete w.webkitAudioContext;
});

describe('shared sfx gainEnvelope', () => {
  it('starts at peak when there is no attack', () => {
    const env = gainEnvelope(0.2, 0, 0.18);
    expect(env.start).toBe(0.2);
    expect(env.peak).toBe(0.2);
    expect(env.attackEnd).toBe(0);
    expect(env.end).toBe(0.18);
  });

  it('starts at the floor and ramps to peak when attack > 0', () => {
    const env = gainEnvelope(0.3, 0.4, 0.6);
    expect(env.start).toBe(SFX_MIN_GAIN);
    expect(env.peak).toBe(0.3);
    expect(env.attackEnd).toBe(0.4);
    expect(env.end).toBe(0.6);
  });

  it('clamps peak into [MIN_GAIN, 1]', () => {
    expect(gainEnvelope(5, 0, 0.1).peak).toBe(1);
    expect(gainEnvelope(0, 0, 0.1).peak).toBe(SFX_MIN_GAIN);
  });

  it('clamps attack to the note duration and end to at least the attack', () => {
    const env = gainEnvelope(0.2, 0.5, 0.2);
    expect(env.attackEnd).toBe(0.2);
    expect(env.end).toBe(0.2);
  });
});

describe('shared sfx event registry', () => {
  it('ships the generic built-in events', () => {
    const engine = makeEngine();
    for (const name of ['click', 'confirm', 'hit', 'crit', 'coin', 'win', 'lose', 'pickup', 'blip', 'alert', 'error', 'cheer', 'splash', 'whoosh']) {
      expect(engine.has(name)).toBe(true);
    }
    expect(engine.listEvents()).toEqual(expect.arrayContaining(Object.keys(BUILTIN_SFX_EVENTS)));
  });

  it('register() adds a custom event that plays', () => {
    const engine = makeEngine();
    const def: SfxEventDef = [{ type: 'sine', from: 440, dur: 0.1, vol: 0.2 }];
    engine.register('custom_ping', def);
    expect(engine.has('custom_ping')).toBe(true);
    engine.unlock();
    engine.play('custom_ping');
    expect(createdContexts[0].oscillators).toHaveLength(1);
    expect(createdContexts[0].oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(440, 10);
  });

  it('play() of an unknown name is a silent no-op', () => {
    const engine = makeEngine();
    engine.unlock();
    expect(() => engine.play('does_not_exist')).not.toThrow();
    expect(createdContexts[0].oscillators).toHaveLength(0);
  });

  it('play() accepts an inline event def', () => {
    const engine = makeEngine();
    engine.unlock();
    engine.play([{ type: 'triangle', from: 300, dur: 0.1, vol: 0.1 }]);
    expect(createdContexts[0].oscillators).toHaveLength(1);
  });
});

describe('shared sfx mute / autoplay gate', () => {
  it('is muted by default — play creates no AudioContext and no nodes', () => {
    const engine = makeEngine();
    expect(engine.isMuted()).toBe(true);
    engine.play('hit');
    engine.play('coin');
    engine.play('win');
    expect(createdContexts).toHaveLength(0);
  });

  it('unlock() inside a gesture unmutes and allows playback', () => {
    const engine = makeEngine();
    engine.unlock();
    expect(engine.isMuted()).toBe(false);
    engine.play('hit');
    expect(createdContexts).toHaveLength(1);
    expect(createdContexts[0].oscillators).toHaveLength(1);
  });

  it('setMuted(true) silences the engine again without new contexts', () => {
    const engine = makeEngine();
    engine.unlock();
    engine.play('hit');
    expect(createdContexts).toHaveLength(1);
    engine.setMuted(true);
    engine.play('hit');
    expect(createdContexts[0].oscillators).toHaveLength(1);
  });

  it('autoUnlock() unmutes on the first pointerdown and stays unmuted', () => {
    const engine = makeEngine();
    engine.autoUnlock();
    expect(engine.isMuted()).toBe(true);
    window.dispatchEvent(new window.Event('pointerdown'));
    expect(engine.isMuted()).toBe(false);
    engine.play('blip');
    expect(createdContexts[0].oscillators).toHaveLength(1);
  });

  it('autoUnlock() also responds to keydown', () => {
    const engine = makeEngine();
    engine.autoUnlock();
    window.dispatchEvent(new window.Event('keydown'));
    expect(engine.isMuted()).toBe(false);
  });
});

describe('shared sfx AudioContext handling', () => {
  it('lazily creates one context and reuses it across plays', () => {
    const engine = makeEngine();
    engine.unlock();
    engine.play('hit');
    engine.play('coin');
    engine.play('lose');
    expect(createdContexts).toHaveLength(1);
  });

  it('falls back to webkitAudioContext when AudioContext is absent', () => {
    const w = window as unknown as Record<string, unknown>;
    w.AudioContext = undefined;
    w.webkitAudioContext = FakeAudioContext;
    const engine = makeEngine();
    engine.unlock();
    engine.play('hit');
    expect(createdContexts).toHaveLength(1);
  });

  it('resumes the context when its state is suspended', () => {
    const w = window as unknown as Record<string, unknown>;
    w.AudioContext = class extends FakeAudioContext {
      state = 'suspended';
    };
    const engine = makeEngine();
    engine.unlock();
    expect(createdContexts[0].resume).toHaveBeenCalled();
  });

  it('never throws when audio is entirely unavailable', () => {
    const w = window as unknown as Record<string, unknown>;
    delete w.AudioContext;
    delete w.webkitAudioContext;
    const engine = makeEngine();
    engine.unlock();
    expect(() => engine.play('hit')).not.toThrow();
    expect(createdContexts).toHaveLength(0);
  });
});

describe('shared sfx note scheduling', () => {
  it('hit programs a single descending triangle with an envelope decay', () => {
    const engine = makeEngine();
    engine.unlock();
    engine.play('hit');
    const ctx = createdContexts[0];
    expect(ctx.oscillators).toHaveLength(1);
    const osc = ctx.oscillators[0];
    expect(osc.type).toBe('triangle');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(180, 10);
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(30, 10.18);
    expect(osc.connect).toHaveBeenCalledWith(ctx.gains[0]);
    expect(ctx.gains[0].connect).toHaveBeenCalledWith(ctx.destination);
  });

  it('coin schedules three staggered sine notes', () => {
    const engine = makeEngine();
    engine.unlock();
    engine.play('coin');
    const ctx = createdContexts[0];
    expect(ctx.oscillators).toHaveLength(3);
    const freqs = [987, 1318, 1567];
    ctx.oscillators.forEach((osc, i) => {
      expect(osc.type).toBe('sine');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.08);
    });
  });

  it('noise events route through a buffer source and biquad filter', () => {
    const engine = makeEngine();
    engine.unlock();
    engine.play('splash');
    const ctx = createdContexts[0];
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.filters).toHaveLength(1);
    expect(ctx.filters[0].type).toBe('lowpass');
    expect(ctx.sources[0].connect).toHaveBeenCalledWith(ctx.filters[0]);
    expect(ctx.filters[0].connect).toHaveBeenCalledWith(ctx.gains[0]);
  });

  it('setVolume scales the programmed gain peak', () => {
    const engine = makeEngine();
    engine.unlock();
    engine.setVolume(0.5);
    engine.play('blip');
    const ctx = createdContexts[0];
    expect(ctx.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0.06, 10);
  });
});

describe('shared sfx singleton', () => {
  it('exports a ready-made engine instance', () => {
    expect(sfx).toBeInstanceOf(SfxEngine);
    expect(sfx.has('hit')).toBe(true);
  });
});
