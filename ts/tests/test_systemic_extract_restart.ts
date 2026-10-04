/**
 * test_systemic_extract_restart.ts — systemic_extract NEW RUN control tests.
 *
 * Guards the two-press restart guard in
 * examples/systemic-extract/src/game/restart-confirm.ts: a press from
 * idle arms without restarting, a second press restarts and returns to
 * idle, a timeout disarms, and a press after a timeout arms again.
 * The guard backs the visible Restart / New Run control that remounts
 * RaidView through a fresh React key, returning the player to the
 * sanctuary overworld without a page reload.
 *
 * The second group is a source-text guard, not a render test: the
 * example's React 19 build cannot be rendered under the studio's
 * React 18 vitest, so the wiring (key={runId}, onNewRun, the button
 * label) is asserted by reading the three edited files directly.
 *
 * <!-- new: ts/tests/test_systemic_extract_restart.ts -->
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nextRestartPrompt } from '../../examples/systemic-extract/src/game/restart-confirm';

function exampleSrc(rel: string): string {
  return readFileSync(
    resolve(import.meta.dirname, '../../examples/systemic-extract/src', rel),
    'utf8',
  );
}

describe('nextRestartPrompt', () => {
  it('a. press from idle arms without restarting', () => {
    expect(nextRestartPrompt('idle', 'press')).toEqual({ state: 'armed', restart: false });
  });

  it('b. a second press restarts and returns to idle', () => {
    const armed = nextRestartPrompt('idle', 'press');
    expect(nextRestartPrompt(armed.state, 'press')).toEqual({ state: 'idle', restart: true });
  });

  it('c. timeout disarms from either state', () => {
    expect(nextRestartPrompt('armed', 'timeout')).toEqual({ state: 'idle', restart: false });
    expect(nextRestartPrompt('idle', 'timeout')).toEqual({ state: 'idle', restart: false });
  });

  it('d. a press after a timeout arms again (does not restart)', () => {
    const disarmed = nextRestartPrompt('armed', 'timeout');
    expect(nextRestartPrompt(disarmed.state, 'press')).toEqual({ state: 'armed', restart: false });
  });
});

describe('systemic_extract restart wiring', () => {
  it('e. GameViewport remounts RaidView via key={runId}; startNewRun serves both callbacks', () => {
    const src = exampleSrc('components/GameViewport.tsx');
    expect(src).toMatch(/key=\{runId\}/);
    expect(src).toMatch(/onNewRun=\{startNewRun\}/);
    expect(src).toMatch(/onEndRaid=\{startNewRun\}/);
    expect(src).not.toMatch(/handleEndRaid/);
  });

  it('f. RaidHUD renders RaidRestartButton', () => {
    expect(exampleSrc('components/raid/RaidHUD.tsx')).toMatch(/RaidRestartButton/);
  });

  it('g. RaidResolutionModal reads START NEW RUN, not RETURN TO HIDEOUT', () => {
    const src = exampleSrc('components/raid/RaidResolutionModal.tsx');
    expect(src).toMatch(/START NEW RUN/);
    expect(src).not.toMatch(/RETURN TO HIDEOUT/);
  });
});
