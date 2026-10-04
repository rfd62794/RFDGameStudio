// new: ts/tests/test_dissonance_run_controls.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isRunInProgress } from '../src/games/dissonance/utils/runControls';

const runEndPhaseSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/dissonance/phases/RunEndPhase.tsx'),
  'utf-8'
);
const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/dissonance/App.tsx'),
  'utf-8'
);
const abandonButtonSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/dissonance/components/AbandonRunButton.tsx'),
  'utf-8'
);

describe('isRunInProgress', () => {
  it.each(['not_started', 'combat', 'reward', 'rest_craft', 'treasure', 'store', 'anomaly'])(
    'returns true for in-progress status %s',
    (status) => {
      expect(isRunInProgress(status)).toBe(true);
    }
  );

  it.each(['victory', 'game_over', 'bogus_status'])(
    'returns false for ended/unknown status %s',
    (status) => {
      expect(isRunInProgress(status)).toBe(false);
    }
  );
});

describe('run-end and abandon controls are wired', () => {
  it('RunEndPhase offers New Run and Return to Title', () => {
    expect(runEndPhaseSource).toContain('restartLabel="New Run"');
    expect(runEndPhaseSource).toContain('Return to Title');
  });

  it('App wires abandon and new-run-from-end handlers and refreshes the saved run', () => {
    expect(appSource).toContain('AbandonRunButton');
    expect(appSource).toContain('handleAbandon');
    expect(appSource).toContain('handleNewRunFromEnd');
    expect(appSource).toContain('setSavedRun');
  });

  it('AbandonRunButton carries its stable id', () => {
    expect(abandonButtonSource).toContain('dissonance-abandon-run');
  });
});
