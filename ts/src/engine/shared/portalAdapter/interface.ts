/**
 * Portal adapter interface — the permanent public API games call.
 *
 * Safe to call unconditionally from any game, any environment. Each
 * function checks the real detected environment and either calls the
 * relevant portal's real SDK function (later phase) or does nothing
 * (this phase, always, since no SDK is wired in yet).
 *
 * ⚠️ RULE: The function signatures locked here are the real, permanent
 * public interface. Later phases fill in real SDK calls BEHIND them;
 * they do not change the shape games call. Get this right now.
 */

import { detectPortalEnvironment, isPortalEnvironment } from './detection';

/**
 * Signal that gameplay has started (first input, resume from pause).
 * Safe no-op when no portal is detected. This phase: always no-op.
 */
export function notifyGameplayStart(): void {
  const env = detectPortalEnvironment();
  if (!isPortalEnvironment(env)) return;
  // Later phase: dispatch to env-specific SDK (PokiSDK.gameplayStart(),
  // CrazySDK.gameplayStart(), itch's equivalent). No-op this phase.
}

/**
 * Signal that gameplay has stopped (pause, menu, break, focus loss).
 * Safe no-op when no portal is detected. This phase: always no-op.
 */
export function notifyGameplayStop(): void {
  const env = detectPortalEnvironment();
  if (!isPortalEnvironment(env)) return;
  // Later phase: dispatch to env-specific SDK. No-op this phase.
}

/**
 * Request an ad break. Resolves immediately when no portal is detected
 * or when no SDK is wired in (this phase: always resolves immediately).
 * Later phases will resolve after the real ad has finished playing.
 */
export function requestAdBreak(): Promise<void> {
  const env = detectPortalEnvironment();
  if (!isPortalEnvironment(env)) {
    return Promise.resolve();
  }
  // Later phase: call env-specific ad SDK and resolve on completion.
  // This phase: resolve immediately — no SDK wired in yet.
  return Promise.resolve();
}
