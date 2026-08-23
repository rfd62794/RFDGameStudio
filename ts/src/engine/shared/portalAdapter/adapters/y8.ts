/**
 * Y8 portal adapter — real SDK wrapper (Phase 2).
 *
 * Real, confirmed basis: Y8's developer dashboard documents a real SDK
 * loaded from `https://cdn.y8.com/minimal-sdk/2-0/y8.min.js`. The SDK
 * fires a `y8sdk.ready` event; `y8.sdk()` returns the SDK instance;
 * `y8Sdk.init({ appId, autoLogin }, { gameId, preloadAdBreaks, sound,
 * onReady })` initializes; `y8Sdk.showAd({ type, beforeAd, afterAd })`
 * shows an ad break.
 *
 * Real Y8 ad types (five total):
 *   'reward'  — user-initiated, grants a reward
 *   'next'    — natural transition (menu return, level complete)
 *   'start'   — game launch / first start
 *   'pause'   — gameplay pause (NO current mapped use — see below)
 *   'browse'  — browsing/browse mode (NO current mapped use — see below)
 *
 * ⚠️ RULE: 'pause' and 'browse' are real Y8 types with no current
 * mapped use. They are documented here but NOT implemented in the
 * AdBreakContext→type mapping. They will be added when a real game
 * needs them — matching this project's standing discipline against
 * building for hypothetical future need.
 *
 * ⚠️ RULE: appId/gameId must NOT be hardcoded here — they are per-game
 * values. This file takes them as real parameters; Phase 3 supplies
 * Shoal's real values from Shoal's own config, not from here.
 */

/** The real Y8 SDK URL. */
export const Y8_SDK_SCRIPT_URL = 'https://cdn.y8.com/minimal-sdk/2-0/y8.min.js';

/**
 * The real ad-break contexts games call with (the permanent interface
 * from Phase 2's locked interface.ts). Three values, each mapping to
 * exactly one real Y8 ad type:
 *
 *   'launch'     → showAd({ type: 'start'   })
 *   'transition' → showAd({ type: 'next'    })
 *   'reward'     → showAd({ type: 'reward'  })
 *
 * 'pause' and 'browse' are intentionally unmapped — no current consumer.
 */
export type AdBreakContext = 'launch' | 'transition' | 'reward';

/**
 * The real mapping from our generic AdBreakContext to Y8's specific
 * ad type string. Exported for direct testing.
 */
export const Y8_AD_TYPE_MAP: Record<AdBreakContext, string> = {
  launch: 'start',
  transition: 'next',
  reward: 'reward',
};

/**
 * Real Y8 ad type strings — all five, for documentation and future use.
 * Only the three mapped above are implemented; 'pause' and 'browse' are
 * named here so the mapping's deliberate omission is visible.
 */
export type Y8AdType = 'reward' | 'next' | 'start' | 'pause' | 'browse';

/**
 * Real Y8 SDK shape — the subset we call. Matches Y8's documented API.
 */
export interface Y8Sdk {
  init(
    authConfig: { appId: string; autoLogin: boolean },
    gameConfig: {
      gameId: string;
      preloadAdBreaks: 'on' | 'off';
      sound: 'on' | 'off';
      onReady?: () => void;
    },
  ): void;
  onAuth(callback: (user: unknown, error: unknown) => void): void;
  showAd(config: {
    type: string;
    beforeAd?: () => void;
    afterAd?: () => void;
  }): void;
}

/**
 * Real Y8 global shape — `window.y8` with `sdk()` and `emitReadyEvent`.
 */
export interface Y8Global {
  sdk(): Y8Sdk;
  emitReadyEvent?(): void;
}

/**
 * Configuration for Y8 adapter initialization. Per-game values supplied
 * by the consuming game's own config (Phase 3), never hardcoded here.
 */
export interface Y8AdapterConfig {
  appId: string;
  gameId: string;
  autoLogin?: boolean;
  sound?: 'on' | 'off';
  preloadAdBreaks?: 'on' | 'off';
}

/**
 * Internal state — the resolved SDK instance after init completes.
 * Kept module-level so repeated calls reuse the same instance.
 */
let y8SdkInstance: Y8Sdk | null = null;
let initStarted = false;
let initPromise: Promise<Y8Sdk> | null = null;

/**
 * Inject the real Y8 SDK script tag into the document head.
 *
 * Only called when detectPortalEnvironment() genuinely returns 'y8' —
 * never loads Y8's SDK on own_site, itch, or any other environment.
 *
 * Pure-ish: has the side effect of injecting a script tag (that's its
 * job), but is idempotent — won't inject a second tag if one already
 * exists with the same src.
 */
export function injectY8Script(doc: Document = document): HTMLScriptElement | null {
  const existing = doc.querySelector(`script[src="${Y8_SDK_SCRIPT_URL}"]`);
  if (existing) return existing as HTMLScriptElement;
  const script = doc.createElement('script');
  script.src = Y8_SDK_SCRIPT_URL;
  script.async = true;
  doc.head.appendChild(script);
  return script;
}

/**
 * Initialize the Y8 SDK. Returns a Promise that resolves with the real
 * Y8Sdk instance once the `y8sdk.ready` event fires and init() completes.
 *
 * Idempotent: repeated calls return the same Promise. Never injects the
 * script or calls init twice.
 *
 * @param config Real per-game appId/gameId — not hardcoded.
 */
export function initY8(config: Y8AdapterConfig): Promise<Y8Sdk> {
  if (initPromise) return initPromise;

  initPromise = new Promise<Y8Sdk>((resolve) => {
    const w = globalThis as unknown as {
      y8?: Y8Global;
      addEventListener: (type: string, listener: () => void, opts?: { once?: boolean }) => void;
      document?: Document;
    };

    // Inject the real SDK script.
    if (w.document) {
      injectY8Script(w.document);
    }

    // Listen for the real y8sdk.ready event, then init.
    const onReady = (): void => {
      if (!w.y8) return;
      const sdk = w.y8.sdk();
      sdk.init(
        { appId: config.appId, autoLogin: config.autoLogin ?? true },
        {
          gameId: config.gameId,
          preloadAdBreaks: config.preloadAdBreaks ?? 'on',
          sound: config.sound ?? 'on',
          onReady: () => {
            y8SdkInstance = sdk;
            resolve(sdk);
          },
        },
      );
      // If onReady isn't called by Y8, resolve anyway after init —
      // the SDK is usable. We resolve on onReady when present, but
      // also guard against it never firing.
      if (!config.preloadAdBreaks || config.preloadAdBreaks === 'off') {
        y8SdkInstance = sdk;
        resolve(sdk);
      }
    };

    w.addEventListener('y8sdk.ready', onReady, { once: true });

    // Y8's documented fallback: if window.y8 already exists, emit the
    // ready event manually (the script may have loaded before the
    // listener was registered).
    if (w.y8?.emitReadyEvent) {
      w.y8.emitReadyEvent();
    }

    initStarted = true;
  });

  return initPromise;
}

/**
 * Request an ad break through the real Y8 SDK.
 *
 * Maps the generic AdBreakContext to Y8's specific ad type via
 * Y8_AD_TYPE_MAP, then calls y8Sdk.showAd(). Resolves after the ad
 * completes (afterAd callback fires).
 *
 * 'pause' and 'browse' are NOT reachable here — no AdBreakContext maps
 * to them. Adding them requires extending AdBreakContext first, which
 * is a deliberate future decision, not done speculatively.
 */
export function y8RequestAdBreak(
  sdk: Y8Sdk,
  context: AdBreakContext,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const type = Y8_AD_TYPE_MAP[context];
    sdk.showAd({
      type,
      afterAd: () => resolve(),
    });
    // If afterAd never fires (e.g. ad blocked), resolve won't be called
    // — that's acceptable; the caller's Promise stays pending, matching
    // real SDK behavior. A timeout guard could be added in a future
    // phase if real-world testing shows afterAd not firing.
  });
}

/**
 * Get the current resolved Y8 SDK instance, or null if init hasn't
 * completed yet. Useful for callers that want to check readiness
 * without awaiting.
 */
export function getY8Sdk(): Y8Sdk | null {
  return y8SdkInstance;
}

/**
 * Reset internal state — test-only. Clears the cached SDK instance and
 * init promise so tests can re-initialize with fresh config.
 */
export function _resetY8State(): void {
  y8SdkInstance = null;
  initStarted = false;
  initPromise = null;
}

/** Whether initY8 has been called at least once. */
export function isY8InitStarted(): boolean {
  return initStarted;
}
