// @vitest-environment node
// new: ts/tests/test_kingmaker_armed_confirm.ts
import { describe, it, expect } from 'vitest';
import { ARM_WINDOW_MS, pressArmed, armedLabel } from '../../examples/kingmaker-squads/src/utils/armedConfirm';

describe('test_kingmaker_armed_confirm', () => {
  it('ARM_WINDOW_MS is 3000', () => {
    expect(ARM_WINDOW_MS).toBe(3000);
  });

  it('pressArmed(false) arms without confirming', () => {
    expect(pressArmed(false)).toEqual({ armed: true, confirmed: false });
  });

  it('pressArmed(true) disarms and confirms', () => {
    expect(pressArmed(true)).toEqual({ armed: false, confirmed: true });
  });

  it('two presses in a row from disarmed end confirmed', () => {
    const first = pressArmed(false);
    const second = pressArmed(first.armed);
    expect(second.confirmed).toBe(true);
    expect(second.armed).toBe(false);
  });

  it('armedLabel returns the idle label when disarmed', () => {
    expect(armedLabel(false, 'Restart', 'Confirm restart?')).toBe('Restart');
  });

  it('armedLabel returns the confirm label when armed', () => {
    expect(armedLabel(true, 'Restart', 'Confirm restart?')).toBe('Confirm restart?');
  });
});
