/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpeechEngine } from '../src/engine/shared/voiceRecognition/speechEngine';

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = '';
  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }
}

function makeHandlers() {
  return {
    onTranscript: vi.fn(),
    onError: vi.fn(),
    onEnd: vi.fn(),
  };
}

// Mirrors the browser SpeechRecognitionEvent shape the engine consumes:
// results[i].isFinal and results[i][0].transcript, iterated from resultIndex.
function speechResultEvent(
  parts: Array<{ transcript: string; isFinal: boolean }>,
  resultIndex = 0,
) {
  return {
    resultIndex,
    results: parts.map((p) => ({ isFinal: p.isFinal, 0: { transcript: p.transcript } })),
  };
}

describe('SpeechEngine (shared voiceRecognition)', () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    (window as any).SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  describe('isSupported', () => {
    it('returns false when the browser exposes no speech recognition API', () => {
      delete (window as any).SpeechRecognition;
      expect(new SpeechEngine().isSupported()).toBe(false);
    });

    it('returns true when window.SpeechRecognition exists', () => {
      expect(new SpeechEngine().isSupported()).toBe(true);
    });

    it('returns true when only webkitSpeechRecognition exists', () => {
      delete (window as any).SpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;
      expect(new SpeechEngine().isSupported()).toBe(true);
    });
  });

  describe('startListening — unsupported browser', () => {
    it('reports an error instead of throwing', () => {
      delete (window as any).SpeechRecognition;
      const handlers = makeHandlers();
      new SpeechEngine().startListening(handlers);
      expect(handlers.onError).toHaveBeenCalledWith(
        'Speech recognition is not supported in this browser.',
      );
      expect(handlers.onTranscript).not.toHaveBeenCalled();
    });
  });

  describe('startListening — configuration', () => {
    it('applies default options (en-US, continuous, interim results) and starts', () => {
      new SpeechEngine().startListening(makeHandlers());
      const rec = MockSpeechRecognition.instances[0];
      expect(rec.lang).toBe('en-US');
      expect(rec.continuous).toBe(true);
      expect(rec.interimResults).toBe(true);
      expect(rec.start).toHaveBeenCalledTimes(1);
    });

    it('honours caller-supplied options', () => {
      new SpeechEngine({ lang: 'fr-FR', continuous: false, interimResults: false })
        .startListening(makeHandlers());
      const rec = MockSpeechRecognition.instances[0];
      expect(rec.lang).toBe('fr-FR');
      expect(rec.continuous).toBe(false);
      expect(rec.interimResults).toBe(false);
    });

    it('falls back to webkitSpeechRecognition when SpeechRecognition is absent', () => {
      delete (window as any).SpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;
      new SpeechEngine().startListening(makeHandlers());
      expect(MockSpeechRecognition.instances).toHaveLength(1);
      expect(MockSpeechRecognition.instances[0].start).toHaveBeenCalledTimes(1);
    });
  });

  describe('listening lifecycle', () => {
    it('reports isListening true after onstart and false after onend', () => {
      const engine = new SpeechEngine();
      const handlers = makeHandlers();
      engine.startListening(handlers);
      expect(engine.getIsListening()).toBe(false);

      const rec = MockSpeechRecognition.instances[0];
      rec.onstart!();
      expect(engine.getIsListening()).toBe(true);

      rec.onend!();
      expect(engine.getIsListening()).toBe(false);
      expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('onresult — transcript routing', () => {
    it('emits trimmed final transcripts with isFinal=true', () => {
      const handlers = makeHandlers();
      new SpeechEngine().startListening(handlers);
      MockSpeechRecognition.instances[0].onresult!(
        speechResultEvent([{ transcript: '  hello world  ', isFinal: true }]),
      );
      expect(handlers.onTranscript).toHaveBeenCalledWith('hello world', true);
    });

    it('emits interim transcripts with isFinal=false', () => {
      const handlers = makeHandlers();
      new SpeechEngine().startListening(handlers);
      MockSpeechRecognition.instances[0].onresult!(
        speechResultEvent([{ transcript: 'hel', isFinal: false }]),
      );
      expect(handlers.onTranscript).toHaveBeenCalledWith('hel', false);
    });

    it('concatenates final parts and drops interim parts when both arrive in one event', () => {
      const handlers = makeHandlers();
      new SpeechEngine().startListening(handlers);
      MockSpeechRecognition.instances[0].onresult!(
        speechResultEvent([
          { transcript: 'first ', isFinal: true },
          { transcript: 'second', isFinal: true },
          { transcript: 'still going', isFinal: false },
        ]),
      );
      expect(handlers.onTranscript).toHaveBeenCalledWith('first second', true);
    });

    it('skips results before resultIndex', () => {
      const handlers = makeHandlers();
      new SpeechEngine().startListening(handlers);
      MockSpeechRecognition.instances[0].onresult!(
        speechResultEvent(
          [
            { transcript: 'old ', isFinal: true },
            { transcript: 'new', isFinal: true },
          ],
          1,
        ),
      );
      expect(handlers.onTranscript).toHaveBeenCalledWith('new', true);
    });
  });

  describe('onerror — failure-mode mapping', () => {
    it.each(['not-allowed', 'service-not-allowed'])(
      'maps %s to the microphone-permission message',
      (code) => {
        const handlers = makeHandlers();
        new SpeechEngine().startListening(handlers);
        MockSpeechRecognition.instances[0].onerror!({ error: code });
        expect(handlers.onError).toHaveBeenCalledWith(
          'Microphone access is blocked. Check browser permissions.',
        );
      },
    );

    it('maps no-speech to the retry message', () => {
      const handlers = makeHandlers();
      new SpeechEngine().startListening(handlers);
      MockSpeechRecognition.instances[0].onerror!({ error: 'no-speech' });
      expect(handlers.onError).toHaveBeenCalledWith(
        'No speech detected. Please try speaking again.',
      );
    });

    it('maps any other error to the generic message', () => {
      const handlers = makeHandlers();
      new SpeechEngine().startListening(handlers);
      MockSpeechRecognition.instances[0].onerror!({ error: 'audio-capture' });
      expect(handlers.onError).toHaveBeenCalledWith(
        'Speech recognition error. Please try again.',
      );
    });

    it('clears isListening on error', () => {
      const engine = new SpeechEngine();
      engine.startListening(makeHandlers());
      const rec = MockSpeechRecognition.instances[0];
      rec.onstart!();
      rec.onerror!({ error: 'network' });
      expect(engine.getIsListening()).toBe(false);
    });
  });

  describe('stopListening', () => {
    it('stops an active recognition and clears isListening', () => {
      const engine = new SpeechEngine();
      engine.startListening(makeHandlers());
      const rec = MockSpeechRecognition.instances[0];
      rec.onstart!();

      engine.stopListening();
      expect(rec.stop).toHaveBeenCalledTimes(1);
      expect(engine.getIsListening()).toBe(false);
    });

    it('does nothing when the recognition never started', () => {
      const engine = new SpeechEngine();
      engine.startListening(makeHandlers());
      engine.stopListening();
      expect(MockSpeechRecognition.instances[0].stop).not.toHaveBeenCalled();
    });

    it('does nothing when no recognition exists', () => {
      expect(() => new SpeechEngine().stopListening()).not.toThrow();
    });

    it('swallows errors thrown by stop()', () => {
      const engine = new SpeechEngine();
      engine.startListening(makeHandlers());
      const rec = MockSpeechRecognition.instances[0];
      rec.stop.mockImplementation(() => {
        throw new Error('boom');
      });
      rec.onstart!();

      expect(() => engine.stopListening()).not.toThrow();
      expect(engine.getIsListening()).toBe(false);
    });
  });

  describe('restarting', () => {
    it('aborts the previous recognition before starting a new one', () => {
      const engine = new SpeechEngine();
      engine.startListening(makeHandlers());
      const first = MockSpeechRecognition.instances[0];

      engine.startListening(makeHandlers());
      expect(first.abort).toHaveBeenCalledTimes(1);
      expect(MockSpeechRecognition.instances).toHaveLength(2);
      expect(MockSpeechRecognition.instances[1].start).toHaveBeenCalledTimes(1);
    });
  });

  describe('startup failure', () => {
    it('reports mic failure when recognition construction throws', () => {
      (window as any).SpeechRecognition = class {
        constructor() {
          throw new Error('no mic');
        }
      };
      const engine = new SpeechEngine();
      const handlers = makeHandlers();
      engine.startListening(handlers);
      expect(handlers.onError).toHaveBeenCalledWith(
        'Microphone failed to start. Check hardware and permissions.',
      );
      expect(engine.getIsListening()).toBe(false);
    });

    it('reports mic failure when recognition.start() throws', () => {
      (window as any).SpeechRecognition = class extends MockSpeechRecognition {
        override start = vi.fn(() => {
          throw new Error('start failed');
        });
      };
      const engine = new SpeechEngine();
      const handlers = makeHandlers();
      engine.startListening(handlers);
      expect(handlers.onError).toHaveBeenCalledWith(
        'Microphone failed to start. Check hardware and permissions.',
      );
      expect(engine.getIsListening()).toBe(false);
    });
  });
});
