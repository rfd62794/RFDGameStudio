import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audio } from '../src/games/early_learning_buddy/utils/audio';

/**
 * test_early_learning_buddy_audio
 *
 * Covers utils/audio.ts: the AudioEngine singleton that synthesizes
 * feedback sounds via Web Audio and speaks text via Web Speech.
 * jsdom provides neither AudioContext nor speechSynthesis, so the
 * tests stub both on window and assert on the oscillator/gain
 * parameters the engine actually programs.
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

const utterances: FakeUtterance[] = [];

class FakeUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  voice: { lang: string; name: string } | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
    utterances.push(this);
  }
}

function stubSpeech(
  voices: Array<{ lang: string; name: string }> = [],
  onSpeak?: (u: FakeUtterance) => void
) {
  const synth = {
    cancel: vi.fn(),
    speak: vi.fn((u: FakeUtterance) => {
      if (onSpeak) onSpeak(u);
      else u.onend?.();
    }),
    getVoices: vi.fn(() => voices),
  };
  const w = window as unknown as Record<string, unknown>;
  w.speechSynthesis = synth;
  w.SpeechSynthesisUtterance = FakeUtterance;
  (globalThis as Record<string, unknown>).SpeechSynthesisUtterance = FakeUtterance;
  return synth;
}

// The engine caches its AudioContext privately; reset between tests so
// each test controls which context factory is installed.
function resetEngine() {
  (audio as unknown as { ctx: unknown }).ctx = null;
  createdContexts.length = 0;
}

beforeEach(() => {
  resetEngine();
  utterances.length = 0;
  audio.setMuted(false);
  const w = window as unknown as Record<string, unknown>;
  w.AudioContext = FakeAudioContext;
});

afterEach(() => {
  const w = window as unknown as Record<string, unknown>;
  delete w.AudioContext;
  delete w.webkitAudioContext;
  delete w.speechSynthesis;
  delete w.SpeechSynthesisUtterance;
  delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance;
  audio.setMuted(false);
});

describe('early_learning_buddy utils/audio', () => {
  describe('mute flag', () => {
    it('round-trips through setMuted/getMuted', () => {
      audio.setMuted(true);
      expect(audio.getMuted()).toBe(true);
      audio.setMuted(false);
      expect(audio.getMuted()).toBe(false);
    });
  });

  describe('mute gate', () => {
    it('play methods create no AudioContext and no nodes when muted', () => {
      audio.setMuted(true);
      audio.playPopSound();
      audio.playSuccessChime();
      audio.playGentleRetrySound();
      audio.playUnlockFanfare();
      audio.playActionSound('roar');
      expect(createdContexts).toHaveLength(0);
    });
  });

  describe('AudioContext acquisition', () => {
    it('lazily creates one context and reuses it across calls', () => {
      audio.playPopSound();
      audio.playPopSound();
      expect(createdContexts).toHaveLength(1);
    });

    it('falls back to webkitAudioContext when AudioContext is absent', () => {
      const w = window as unknown as Record<string, unknown>;
      w.AudioContext = undefined;
      w.webkitAudioContext = FakeAudioContext;
      audio.playPopSound();
      expect(createdContexts).toHaveLength(1);
    });

    it('resumes the context when its state is suspended', () => {
      const w = window as unknown as Record<string, unknown>;
      w.AudioContext = class extends FakeAudioContext {
        state = 'suspended';
      };
      audio.playPopSound();
      expect(createdContexts[0].resume).toHaveBeenCalled();
    });
  });

  describe('playPopSound', () => {
    it('programs one sine osc ramping 600→1200 Hz over 50ms', () => {
      audio.playPopSound();
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(1);
      expect(ctx.gains).toHaveLength(1);
      const osc = ctx.oscillators[0];
      const gain = ctx.gains[0];
      expect(osc.type).toBe('sine');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(600, 10);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1200, 10.05);
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.15, 10);
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 10.05);
      expect(osc.connect).toHaveBeenCalledWith(gain);
      expect(gain.connect).toHaveBeenCalledWith(ctx.destination);
      expect(osc.start).toHaveBeenCalledWith(10);
      expect(osc.stop).toHaveBeenCalledWith(10.06);
    });
  });

  describe('playSuccessChime', () => {
    it('plays 4 triangle notes C5 E5 G5 C6 staggered 80ms', () => {
      audio.playSuccessChime();
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(4);
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      ctx.oscillators.forEach((osc, i) => {
        expect(osc.type).toBe('triangle');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.08);
        expect(osc.start).toHaveBeenCalledWith(10 + i * 0.08);
        expect(osc.stop).toHaveBeenCalledWith(10 + i * 0.08 + 0.35);
      });
    });
  });

  describe('playGentleRetrySound', () => {
    it('plays 2 sine notes G4→F4 staggered 120ms', () => {
      audio.playGentleRetrySound();
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(2);
      const freqs = [392.0, 349.23];
      ctx.oscillators.forEach((osc, i) => {
        expect(osc.type).toBe('sine');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.12);
        expect(osc.start).toHaveBeenCalledWith(10 + i * 0.12);
        expect(osc.stop).toHaveBeenCalledWith(10 + i * 0.12 + 0.3);
      });
    });
  });

  describe('playUnlockFanfare', () => {
    it('plays a 6-note sine arpeggio staggered 70ms', () => {
      audio.playUnlockFanfare();
      const ctx = createdContexts[0];
      expect(ctx.oscillators).toHaveLength(6);
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      ctx.oscillators.forEach((osc, i) => {
        expect(osc.type).toBe('sine');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.07);
        expect(osc.start).toHaveBeenCalledWith(10 + i * 0.07);
      });
    });
  });

  describe('playActionSound', () => {
    it('plays a single sawtooth growl for roar/dino/stomp actions', () => {
      for (const act of ['roar', 'dino', 'stomp']) {
        resetEngine();
        audio.playActionSound(act);
        const ctx = createdContexts[0];
        expect(ctx.oscillators).toHaveLength(1);
        const osc = ctx.oscillators[0];
        expect(osc.type).toBe('sawtooth');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(150, 10);
        expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(80, 10.4);
      }
    });

    it('matches action keywords case-insensitively', () => {
      audio.playActionSound('ROAR');
      expect(createdContexts[0].oscillators[0].type).toBe('sawtooth');
    });

    it('plays a 3-note square beep sequence for beep/bot/laser actions', () => {
      for (const act of ['beep', 'robot', 'laser']) {
        resetEngine();
        audio.playActionSound(act);
        const ctx = createdContexts[0];
        expect(ctx.oscillators).toHaveLength(3);
        const freqs = [880, 1320, 1760];
        ctx.oscillators.forEach((osc, i) => {
          expect(osc.type).toBe('square');
          expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.08);
        });
      }
    });

    it('plays a 4-note sine sparkle for any other action', () => {
      for (const act of ['sparkle', 'fly', 'dance', 'anything-else']) {
        resetEngine();
        audio.playActionSound(act);
        const ctx = createdContexts[0];
        expect(ctx.oscillators).toHaveLength(4);
        const freqs = [1046.5, 1318.5, 1567.9, 2093.0];
        ctx.oscillators.forEach((osc, i) => {
          expect(osc.type).toBe('sine');
          expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.05);
        });
      }
    });
  });

  describe('error fallback', () => {
    it('swallows an AudioContext constructor failure instead of throwing', () => {
      const w = window as unknown as Record<string, unknown>;
      w.AudioContext = class {
        constructor() {
          throw new Error('audio unavailable');
        }
      };
      expect(() => audio.playPopSound()).not.toThrow();
      expect(() => audio.playSuccessChime()).not.toThrow();
      expect(() => audio.playGentleRetrySound()).not.toThrow();
      expect(() => audio.playUnlockFanfare()).not.toThrow();
      expect(() => audio.playActionSound('roar')).not.toThrow();
    });
  });

  describe('stopSpeech', () => {
    it('cancels speechSynthesis when available', () => {
      const synth = stubSpeech();
      audio.stopSpeech();
      expect(synth.cancel).toHaveBeenCalled();
    });

    it('is a no-op when speechSynthesis is absent', () => {
      expect(() => audio.stopSpeech()).not.toThrow();
    });

    it('swallows a throwing cancel', () => {
      const synth = stubSpeech();
      synth.cancel.mockImplementation(() => {
        throw new Error('cancel failed');
      });
      expect(() => audio.stopSpeech()).not.toThrow();
    });
  });

  describe('speakText', () => {
    it('resolves immediately when muted without touching speechSynthesis', async () => {
      const synth = stubSpeech();
      audio.setMuted(true);
      await expect(audio.speakText('hello')).resolves.toBeUndefined();
      expect(synth.cancel).not.toHaveBeenCalled();
      expect(synth.speak).not.toHaveBeenCalled();
    });

    it('resolves immediately when speechSynthesis is absent', async () => {
      await expect(audio.speakText('hello')).resolves.toBeUndefined();
    });

    it('cancels pending speech then speaks with friendly defaults', async () => {
      const synth = stubSpeech();
      await audio.speakText('hello world');
      expect(synth.cancel).toHaveBeenCalled();
      expect(utterances).toHaveLength(1);
      expect(utterances[0].text).toBe('hello world');
      expect(utterances[0].rate).toBe(0.9);
      expect(utterances[0].pitch).toBe(1.1);
      expect(synth.speak).toHaveBeenCalledWith(utterances[0]);
    });

    it('honours a caller-supplied rate', async () => {
      stubSpeech();
      await audio.speakText('faster', 1.4);
      expect(utterances[0].rate).toBe(1.4);
    });

    it('resolves when the utterance ends with an error', async () => {
      stubSpeech([], (u) => u.onerror?.());
      await expect(audio.speakText('oops')).resolves.toBeUndefined();
    });

    it('resolves when speak() throws synchronously', async () => {
      const synth = stubSpeech();
      synth.speak.mockImplementation(() => {
        throw new Error('speak failed');
      });
      await expect(audio.speakText('oops')).resolves.toBeUndefined();
    });

    it('still speaks when the pre-cancel throws', async () => {
      const synth = stubSpeech();
      synth.cancel.mockImplementation(() => {
        throw new Error('cancel failed');
      });
      await audio.speakText('hello');
      expect(synth.speak).toHaveBeenCalled();
    });

    it('prefers a named natural English voice', async () => {
      stubSpeech([
        { lang: 'en-US', name: 'Microsoft David' },
        { lang: 'en-GB', name: 'Google UK English Female' },
      ]);
      await audio.speakText('hello');
      expect(utterances[0].voice?.name).toBe('Google UK English Female');
    });

    it('falls back to any English voice when no preferred name matches', async () => {
      stubSpeech([
        { lang: 'fr-FR', name: 'Amelie' },
        { lang: 'en-US', name: 'Microsoft David' },
      ]);
      await audio.speakText('hello');
      expect(utterances[0].voice?.name).toBe('Microsoft David');
    });

    it('leaves voice unset when no English voice exists', async () => {
      stubSpeech([{ lang: 'fr-FR', name: 'Amelie' }]);
      await audio.speakText('hello');
      expect(utterances[0].voice).toBeNull();
    });
  });
});
