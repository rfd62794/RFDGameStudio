/**
 * Portal adapter interface — the permanent public API games call.
 *
 * Safe to call unconditionally from any game, any environment. Each
 * function checks the real detected environment and either calls the
 * relevant portal's real SDK function or does nothing.
 *
 * ⚠️ RULE: The function signatures locked here are the real, permanent
 * public interface. Later phases fill in real SDK calls BEHIND them;
 * they do not change the shape games call.
 */

import { detectPortalEnvironment, isPortalEnvironment } from './detection';
import { getY8Sdk, y8RequestAdBreak } from './adapters/y8';
import type { AdBreakContext } from './adapters/y8';

export type { AdBreakContext } from './adapters/y8';

/**
 * Signal that gameplay has started (first input, resume from pause).
 * Safe no-op when no portal is detected.
 */
export function notifyGameplayStart(): void {
  const env = detectPortalEnvironment();
  if (!isPortalEnvironment(env)) return;
  // Y8: no direct gameplayStart equivalent in the documented SDK —
  // Y8's session model uses ad breaks, not start/stop pairs. This
  // is a no-op for Y8. Other portals (Poki, CrazyGames) will dispatch
  // here in their respective phases.
}

/**
 * Signal that gameplay has stopped (pause, menu, break, focus loss).
 * Safe no-op when no portal is detected.
 */
export function notifyGameplayStop(): void {
  const env = detectPortalEnvironment();
  if (!isPortalEnvironment(env)) return;
  // Y8: no direct gameplayStop equivalent — same as notifyGameplayStart.
  // Other portals will dispatch here in their respective phases.
}

/**
 * Request an ad break. Resolves immediately when no portal is detected.
 *
 * The optional `context` parameter ('launch' | 'transition' | 'reward')
 * lets the caller specify the ad's semantic purpose. The Y8 adapter
 * maps this to Y8's real ad type ('start' | 'next' | 'reward'). Other
 * portals ignore what they don't need — the parameter is optional and
 * defaults to 'transition' (the most common natural break).
 *
 * This function is safe to call before any portal SDK has initialized —
 * it resolves immediately if no portal environment is detected. When a
 * portal IS detected but the SDK hasn't been initialized yet (Phase 3's
 * responsibility), it also resolves immediately — the caller never blocks.
 */
export function requestAdBreak(context: AdBreakContext = 'transition'): Promise<void> {
  const env = detectPortalEnvironment();
  if (!isPortalEnvironment(env)) {
    return Promise.resolve();
  }
  // Y8: dispatch to the Y8 adapter if the SDK is initialized. If init
  // hasn't completed yet (Phase 3's responsibility), resolve immediately
  // — the caller never blocks on an uninitialized SDK.
  if (env === 'y8') {
    // The Y8 adapter's getY8Sdk() returns null if init hasn't completed,
    // in which case we resolve immediately (safe no-op).
    const sdk = getY8Sdk();
    if (!sdk) {
      return Promise.resolve();
    }
    return y8RequestAdBreak(sdk, context);
  }
  // Other portals (Poki, CrazyGames): will dispatch here in their
  // respective phases. No-op for now.
  return Promise.resolve();
}
