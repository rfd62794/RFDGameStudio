// new: ts/tests/test_succession_parked_features.ts
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULT_PARKED_FEATURES,
  getParkedFeatures,
  isParked,
  resetParkedFeatures,
  setParkedFeatures,
} from '../src/games/succession/parkedFeatures';
import {
  createInitialGameState,
  discreditFigure,
  deliverIndictmentTo,
  whisperTo,
} from '../src/games/succession/utils/gameOrchestration';
import { CLAIM_THEMES } from '../src/games/succession/data/claimThemes';
import { estimateSessionMinutes } from '../src/games/succession/utils/sessionTiming';
import { TOTAL_SEGMENTS } from '../src/games/succession/data/gameConstants';
import type { GameState } from '../src/games/succession/types/gameState';

afterEach(() => resetParkedFeatures());

function commanderFavor(state: GameState): number {
  return state.figures.find((f) => f.id === 'commander')!.favor.player;
}

function withCommanderFavor(state: GameState, favor: number): GameState {
  return {
    ...state,
    figures: state.figures.map((f) =>
      f.id === 'commander' ? { ...f, favor: { ...f.favor, player: favor } } : f
    ),
  };
}

describe('parkedFeatures flag', () => {
  it('nothing is parked by default, so shipped behaviour is unchanged', () => {
    expect(DEFAULT_PARKED_FEATURES).toEqual({ discredit: false, indictment: false, domainRipple: false });
    expect(getParkedFeatures()).toEqual(DEFAULT_PARKED_FEATURES);
  });

  it('setParkedFeatures merges and resetParkedFeatures restores the defaults', () => {
    setParkedFeatures({ discredit: true });
    expect(isParked('discredit')).toBe(true);
    expect(isParked('indictment')).toBe(false);
    resetParkedFeatures();
    expect(getParkedFeatures()).toEqual(DEFAULT_PARKED_FEATURES);
  });
});

describe('parked features in the orchestration (code kept, behaviour gated)', () => {
  it('a parked discredit leaves the state untouched; unparked it changes it', () => {
    const state = createInitialGameState('bastard_scion');
    expect(discreditFigure(state, 'chancellor', 'aldric')).not.toBe(state);
    setParkedFeatures({ discredit: true });
    expect(discreditFigure(state, 'chancellor', 'aldric')).toBe(state);
  });

  it('a parked indictment leaves the state untouched', () => {
    const state = createInitialGameState('bastard_scion');
    setParkedFeatures({ indictment: true });
    const triad = { suspect: 'x', method: 'y', motive: 'z' } as never;
    expect(deliverIndictmentTo(state, 'chancellor', triad)).toBe(state);
  });

  it('domain ripple friction costs the opposing councilor favor, and parking it removes the cost', () => {
    const theme = CLAIM_THEMES.find((t) => t.figureId === 'chancellor')!;
    const base = withCommanderFavor(createInitialGameState('merchant_banker'), 10);
    const withRipple = whisperTo(base, 'chancellor', theme.id);
    expect(commanderFavor(withRipple)).toBeLessThan(10);
    setParkedFeatures({ domainRipple: true });
    const withoutRipple = whisperTo(base, 'chancellor', theme.id);
    expect(commanderFavor(withoutRipple)).toBe(10);
  });
});

describe('estimateSessionMinutes (assumption-based, not a measurement)', () => {
  it('uses the real segment count and orders fast < typical < slow', () => {
    const e = estimateSessionMinutes();
    expect(e.segments).toBe(TOTAL_SEGMENTS);
    expect(e.fastMinutes).toBeLessThan(e.typicalMinutes);
    expect(e.typicalMinutes).toBeLessThan(e.slowMinutes);
  });

  it('with the stated assumptions an 8-segment run is 5.2 / 8.5 / 14.5 minutes', () => {
    const e = estimateSessionMinutes(8);
    expect([e.fastMinutes, e.typicalMinutes, e.slowMinutes]).toEqual([5.2, 8.5, 14.5]);
  });
});
