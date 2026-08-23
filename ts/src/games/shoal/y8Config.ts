/**
 * Shoal's real Y8 portal configuration.
 *
 * Real, live credentials from Y8's developer dashboard:
 *   Game ID: 281135
 *   App ID:  6a8a38fd3daf0b765651b797
 *
 * These are public identifiers meant to ship in the client bundle —
 * they are NOT privileged secrets (Y8's own SDK snippet embeds them
 * directly in the page). They live here in Shoal's own config, not in
 * the shared portalAdapter, so the shared adapter stays game-agnostic.
 */
import type { Y8AdapterConfig } from '../../engine/shared/portalAdapter/adapters/y8';

export const SHOAL_Y8_CONFIG: Y8AdapterConfig = {
  appId: '6a8a38fd3daf0b765651b797',
  gameId: '281135',
  autoLogin: true,
  preloadAdBreaks: 'on',
  sound: 'on',
};
