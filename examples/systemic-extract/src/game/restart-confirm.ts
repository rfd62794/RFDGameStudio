/**
 * restart-confirm.ts — two-press guard for the NEW RUN control.
 *
 * A single accidental click must not throw away a raid: the first press
 * arms the prompt, only a second press (before the timeout) restarts.
 *
 * <!-- new: examples/systemic-extract/src/game/restart-confirm.ts -->
 */

export type RestartPrompt = 'idle' | 'armed';
export type RestartEvent = 'press' | 'timeout';

export function nextRestartPrompt(
  state: RestartPrompt,
  event: RestartEvent,
): { state: RestartPrompt; restart: boolean } {
  if (event === 'timeout') {
    return { state: 'idle', restart: false };
  }
  if (state === 'armed') {
    return { state: 'idle', restart: true };
  }
  return { state: 'armed', restart: false };
}
