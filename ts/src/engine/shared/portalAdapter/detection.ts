/**
 * Portal environment detection — pure functions.
 *
 * Real, confirmed technical basis (not invented): Poki and CrazyGames
 * both require a gameplayStart()/gameplayStop() session pair plus an
 * ad-break call. CrazyGames requires runtime detection via
 * CrazySDK.IsAvailable plus a query-param fallback for iframed cases —
 * confirming the same build must know which environment it's in before
 * calling anything.
 *
 * Design: the core classification logic is a pure function of an
 * explicit environment snapshot (PortalDetectionInput), fully testable
 * without a real browser. The exported detectPortalEnvironment() is a
 * thin wrapper that reads the real runtime globals and delegates.
 *
 * ⚠️ RULE: `unknown` must behave identically to `own_site` — safe,
 * silent no-op. Never assume a portal is present; only ever confirm one
 * via a real, positive detection signal.
 */

export type PortalEnvironment =
  | 'own_site' // rfditservices.com — the default, no portal present
  | 'itch' // detected via itch's known iframe/hostname pattern
  | 'crazygames' // detected via CrazySDK presence or query-param fallback
  | 'poki' // detected via PokiSDK presence or query-param fallback
  | 'y8' // detected via window.y8 presence or y8sdk.ready event / query-param fallback
  | 'unknown'; // anything else — treated identically to own_site

/**
 * A real snapshot of the signals detection reads. Passed explicitly to
 * the pure classifier so tests don't need to mock browser globals.
 */
export interface PortalDetectionInput {
  hostname: string;
  search: string; // query string, e.g. "?portal=crazygames"
  hasCrazySDK: boolean; // window.CrazySDK !== undefined
  hasPokiSDK: boolean; // window.PokiSDK !== undefined
  hasY8: boolean; // window.y8 !== undefined (Y8 SDK global)
}

/** The studio's own domain — the default environment. */
export const OWN_SITE_HOSTNAME = 'rfditservices.com';

/**
 * Parse a query string into a key→value map. Pure.
 */
function parseQuery(search: string): Map<string, string> {
  const params = new Map<string, string>();
  const q = search.startsWith('?') ? search.slice(1) : search;
  if (!q) return params;
  for (const pair of q.split('&')) {
    const eq = pair.indexOf('=');
    if (eq < 0) {
      params.set(decodeURIComponent(pair), '');
    } else {
      params.set(
        decodeURIComponent(pair.slice(0, eq)),
        decodeURIComponent(pair.slice(eq + 1)),
      );
    }
  }
  return params;
}

/**
 * Pure classifier. Given a real environment snapshot, returns the
 * detected portal environment. No side effects, no global access.
 *
 * Detection order is deliberate:
 *   1. own_site hostname → own_site (the default, checked first so a
 *      portal query-param on our own domain doesn't override reality)
 *   2. itch hostname pattern → itch
 *   3. CrazySDK global present → crazygames
 *   4. PokiSDK global present → poki
 *   5. Y8 global present (window.y8) → y8
 *   6. query-param fallback (?portal=crazygames|poki|y8) → that portal
 *   7. anything else → unknown (behaves identically to own_site)
 */
export function classifyPortalEnvironment(input: PortalDetectionInput): PortalEnvironment {
  const host = input.hostname.toLowerCase();

  // 1. Own site — checked first so portal params on our domain are ignored.
  if (host === OWN_SITE_HOSTNAME || host.endsWith('.' + OWN_SITE_HOSTNAME)) {
    return 'own_site';
  }

  // 2. itch.io — hostname-based (itch iframes run on *.itch.io or *.itch.zone)
  if (host === 'itch.io' || host.endsWith('.itch.io') || host.endsWith('.itch.zone')) {
    return 'itch';
  }

  // 3, 4 & 5. SDK presence — the primary signal for CrazyGames, Poki, and Y8.
  if (input.hasCrazySDK) {
    return 'crazygames';
  }
  if (input.hasPokiSDK) {
    return 'poki';
  }
  if (input.hasY8) {
    return 'y8';
  }

  // 6. Query-param fallback — for iframed cases where the SDK hasn't
  //    loaded yet or is inaccessible from the iframe's origin.
  const params = parseQuery(input.search);
  const portalParam = params.get('portal');
  if (portalParam === 'crazygames') {
    return 'crazygames';
  }
  if (portalParam === 'poki') {
    return 'poki';
  }
  if (portalParam === 'y8') {
    return 'y8';
  }

  // 7. Unknown — behaves identically to own_site (safe, silent no-op).
  return 'unknown';
}

/**
 * Read the real runtime environment and return the detected portal.
 *
 * Safe to call in any JS environment (browser, Node, jsdom). When
 * window/location are unavailable (e.g. SSR or Node), returns 'unknown'.
 */
export function detectPortalEnvironment(): PortalEnvironment {
  const w = globalThis as unknown as {
    location?: { hostname?: string; search?: string };
    CrazySDK?: unknown;
    PokiSDK?: unknown;
    y8?: unknown;
  };
  const loc = w.location;
  return classifyPortalEnvironment({
    hostname: loc?.hostname ?? '',
    search: loc?.search ?? '',
    hasCrazySDK: w.CrazySDK !== undefined && w.CrazySDK !== null,
    hasPokiSDK: w.PokiSDK !== undefined && w.PokiSDK !== null,
    hasY8: w.y8 !== undefined && w.y8 !== null,
  });
}

/**
 * Whether the detected environment is a portal that requires the
 * gameplayStart/Stop + ad-break protocol. Pure.
 *
 * own_site and unknown do NOT require it (no portal present).
 * itch, crazygames, and poki DO require it.
 */
export function isPortalEnvironment(env: PortalEnvironment): boolean {
  return env === 'itch' || env === 'crazygames' || env === 'poki' || env === 'y8';
}
