import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sound } from '../src/games/shoal/utils/sound';
import { detectReefEvents } from '../src/games/shoal/utils/reefEvents';
import type { RenderState } from '../src/games/shoal/types';

/**
 * test_shoal_chrome_polish
 *
 * Covers the Shoal polish pass (Polish_Shoal_Chrome_Directive):
 * shared TitleScreen menu with a How to Play entry, the OnboardingGate
 * first-run primer, the local Web Audio engine + render-state event
 * wiring, and the extinction EndStateScreen. Component wiring is
 * asserted at source level per suite convention (test_horse_racing_polish);
 * the event detector is a pure function and gets real unit tests.
 */

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/shoal/App.tsx'),
  'utf8'
);
const titleSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/shoal/components/TitleScreen.tsx'),
  'utf8'
);
const primerSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/shoal/components/ReefPrimer.tsx'),
  'utf8'
);

function mkRs(over: {
  fish?: number;
  sharks?: number;
  algaeNodules?: number;
  chunks?: number;
  cores?: number;
}): RenderState {
  return {
    world: { width: 1200, height: 800 },
    fish: [],
    sharks: [],
    algae: Array.from({ length: over.cores ?? 0 }, (_, i) => ({
      id: `core_${i}`,
      x: 0,
      depth: 0,
      nodules: [],
    })),
    chunks: [],
    stats: {
      fish_count: over.fish ?? 0,
      shark_count: over.sharks ?? 0,
      algae_count: over.algaeNodules ?? 0,
      chunk_count: over.chunks ?? 0,
      seed: 42,
    },
    events: [],
    tick_count: 0,
  };
}

describe('Shoal polish — title screen', () => {
  it('is built on the shared ui/components TitleScreen', () => {
    expect(titleSource).toContain("from '../../../ui/components'");
    expect(titleSource).toContain('TitleScreen as SharedTitleScreen');
    expect(titleSource).toContain('menuItems');
  });

  it('has a Start entry and a How to Play entry point', () => {
    expect(titleSource).toContain("id: 'shoal-start-reef'");
    expect(titleSource).toContain("label: 'How to Play'");
    expect(titleSource).toContain('onHowToPlay');
    expect(appSource).toContain('onHowToPlay');
    expect(appSource).toContain('triggerPrimer()');
  });

  it('keeps the scenario picker, seed options, and live reef preview', () => {
    expect(titleSource).toContain('OptionSelectGroup');
    expect(titleSource).toContain('ReefPreview');
    expect(titleSource).toContain('Random Seed');
    expect(titleSource).toContain("Today's Reef");
  });

  it('threads the chosen scenario config into initGame (not dead session writes)', () => {
    expect(appSource).toContain('pendingStartConfig');
    expect(appSource).toContain('initialFish: cfg.initial_fish');
    expect(appSource).toContain('initialSharks: cfg.initial_sharks');
    expect(appSource).toContain('initialAlgaeHubs: cfg.initial_algae_hubs');
    expect(appSource).not.toContain('spawn.initial_fish =');
  });
});

describe('Shoal polish — first-run tutorial', () => {
  it('gates the primer via the shared OnboardingGate + persisted flag', () => {
    expect(appSource).toContain('useOnboardingGate');
    expect(appSource).toContain("'shoal_tutorial_seen'");
    expect(appSource).toContain('loadSave<boolean>(TUTORIAL_SEEN_KEY)');
    expect(appSource).toContain('writeSave(TUTORIAL_SEEN_KEY, true)');
  });

  it('renders 3-5 teaching lines covering food drops and shark pressure', () => {
    expect(primerSource).toContain('data-testid="shoal-reef-primer"');
    const lineCount = (primerSource.match(/text: '/g) ?? []).length;
    expect(lineCount).toBeGreaterThanOrEqual(3);
    expect(lineCount).toBeLessThanOrEqual(5);
    expect(primerSource).toContain('Spawn Algae');
    expect(primerSource).toContain('Shark');
  });
});

describe('Shoal polish — reef event detection (pure diff)', () => {
  it('emits nothing when state is unchanged', () => {
    expect(detectReefEvents(mkRs({ fish: 10, sharks: 2 }), mkRs({ fish: 10, sharks: 2 }))).toEqual([]);
  });

  it('fish loss is a strike; shark loss is a shark_loss', () => {
    const events = detectReefEvents(mkRs({ fish: 10, sharks: 3 }), mkRs({ fish: 9, sharks: 2 }));
    expect(events).toContain('strike');
    expect(events).toContain('shark_loss');
  });

  it('a grazed nodule is a feed event', () => {
    const events = detectReefEvents(
      mkRs({ algaeNodules: 20, cores: 2 }),
      mkRs({ algaeNodules: 19, cores: 2 })
    );
    expect(events).toContain('feed');
  });

  it('a chunk taken without a new core is a feed event', () => {
    const events = detectReefEvents(
      mkRs({ chunks: 3, cores: 2 }),
      mkRs({ chunks: 2, cores: 2 })
    );
    expect(events).toContain('feed');
    expect(events).not.toContain('core_bloom');
  });

  it('a chunk decomposing into a new core is a bloom, not a meal', () => {
    const events = detectReefEvents(
      mkRs({ chunks: 3, cores: 2 }),
      mkRs({ chunks: 2, cores: 3 })
    );
    expect(events).toContain('core_bloom');
    expect(events).not.toContain('feed');
  });

  it('a starved-out core is a collapse', () => {
    const events = detectReefEvents(mkRs({ cores: 3 }), mkRs({ cores: 2 }));
    expect(events).toContain('core_collapse');
  });

  it('extinction fires only on the transition to zero life', () => {
    const dying = detectReefEvents(mkRs({ fish: 1 }), mkRs({ fish: 0 }));
    expect(dying).toContain('extinction');
    // No event when the reef was already empty or still has life.
    expect(detectReefEvents(mkRs({}), mkRs({}))).not.toContain('extinction');
    expect(
      detectReefEvents(mkRs({ fish: 5, sharks: 1 }), mkRs({ fish: 5, sharks: 0 }))
    ).not.toContain('extinction');
  });
});

// jsdom provides no AudioContext — stub it and assert on the oscillator
// and gain parameters the engine actually programs.
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

describe('Shoal polish — sound engine', () => {
  it('enabled flag round-trips through setEnabled/isSoundEnabled', () => {
    sound.setEnabled(false);
    expect(sound.isSoundEnabled()).toBe(false);
    sound.setEnabled(true);
    expect(sound.isSoundEnabled()).toBe(true);
  });

  it('play methods create no AudioContext and no nodes when muted', () => {
    sound.setEnabled(false);
    sound.unlock();
    sound.playSpawn();
    sound.playNibble();
    sound.playStrike();
    sound.playBoundary();
    sound.playReefEnd();
    sound.playUiConfirm();
    expect(createdContexts).toHaveLength(0);
  });

  it('lazily creates one context and reuses it across calls', () => {
    sound.playNibble();
    sound.playStrike();
    expect(createdContexts).toHaveLength(1);
  });

  it('falls back to webkitAudioContext when AudioContext is absent', () => {
    const w = window as unknown as Record<string, unknown>;
    w.AudioContext = undefined;
    w.webkitAudioContext = FakeAudioContext;
    sound.playNibble();
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

  it('no-ops safely when audio is entirely unavailable', () => {
    const w = window as unknown as Record<string, unknown>;
    delete w.AudioContext;
    delete w.webkitAudioContext;
    expect(() => {
      sound.unlock();
      sound.playSpawn();
      sound.playNibble();
      sound.playStrike(true);
      sound.playBoundary(true);
      sound.playReefEnd();
      sound.playUiConfirm();
    }).not.toThrow();
    expect(createdContexts).toHaveLength(0);
  });

  it('playNibble is a soft rising sine blip', () => {
    sound.playNibble();
    const ctx = createdContexts[0];
    expect(ctx.oscillators).toHaveLength(1);
    const osc = ctx.oscillators[0];
    expect(osc.type).toBe('sine');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(560, 10);
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(760, 10.06);
  });

  it('playStrike is a descending sawtooth; heavy variant starts lower', () => {
    sound.playStrike();
    const osc = createdContexts[0].oscillators[0];
    expect(osc.type).toBe('sawtooth');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(220, 10);
    resetEngine();
    sound.playStrike(true);
    const heavy = createdContexts[0].oscillators[0];
    expect(heavy.frequency.setValueAtTime).toHaveBeenCalledWith(140, 10);
  });

  it('playBoundary descends on collapse and rises on bloom', () => {
    sound.playBoundary(true);
    const collapse = createdContexts[0].oscillators[0];
    expect(collapse.frequency.setValueAtTime).toHaveBeenCalledWith(330, 10);
    expect(collapse.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(220, 10.25);
    resetEngine();
    sound.playBoundary(false);
    const bloom = createdContexts[0].oscillators[0];
    expect(bloom.frequency.setValueAtTime).toHaveBeenCalledWith(262, 10);
    expect(bloom.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(392, 10.25);
  });

  it('playReefEnd is a 3-note descending sting staggered 160ms', () => {
    sound.playReefEnd();
    const ctx = createdContexts[0];
    expect(ctx.oscillators).toHaveLength(3);
    const freqs = [392.0, 311.13, 261.63];
    ctx.oscillators.forEach((osc, i) => {
      expect(osc.type).toBe('triangle');
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(freqs[i], 10 + i * 0.16);
    });
  });

  it('App wires event sounds to the render-state diff and a mute toggle', () => {
    expect(appSource).toContain("import { sound } from './utils/sound'");
    expect(appSource).toContain("from './utils/reefEvents'");
    expect(appSource).toContain('sound.unlock()');
    expect(appSource).toContain('sound.playNibble()');
    expect(appSource).toContain('sound.playStrike(');
    expect(appSource).toContain('sound.playBoundary(');
    expect(appSource).toContain('sound.playReefEnd()');
    expect(appSource).toContain('sound.playSpawn()');
    expect(appSource).toContain('shoal-sound-toggle');
    expect(appSource).toContain('sound.setEnabled(');
  });
});

describe('Shoal polish — end state', () => {
  it('shows the shared EndStateScreen on total extinction', () => {
    expect(appSource).toContain('EndStateScreen');
    expect(appSource).toContain('The Reef Went Silent');
    expect(appSource).toContain('reefEnded');
    expect(appSource).toContain('Seed a New Reef');
  });
});
