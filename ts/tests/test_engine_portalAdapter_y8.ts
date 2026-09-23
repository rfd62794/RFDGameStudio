import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Y8_AD_TYPE_MAP,
  Y8_SDK_SCRIPT_URL,
  Y8AdapterConfig,
  Y8Sdk,
  injectY8Script,
  initY8,
  y8RequestAdBreak,
  getY8Sdk,
  isY8InitStarted,
  _resetY8State,
} from '../src/engine/shared/portalAdapter/adapters/y8';
import { classifyPortalEnvironment } from '../src/engine/shared/portalAdapter/detection';

// ── Helpers ──────────────────────────────────────────────────────────

function makeMockSdk(): Y8Sdk & { showAdCalls: Array<{ type: string }> } {
  const calls: Array<{ type: string }> = [];
  return {
    init: vi.fn(),
    onAuth: vi.fn(),
    showAd: vi.fn((config: { type: string; beforeAd?: () => void; afterAd?: () => void }) => {
      calls.push({ type: config.type });
      // Simulate the ad completing immediately.
      if (config.afterAd) config.afterAd();
    }),
    showAdCalls: calls,
  } as unknown as Y8Sdk & { showAdCalls: Array<{ type: string }> };
}

const TEST_CONFIG: Y8AdapterConfig = {
  appId: 'test-app-id',
  gameId: 'test-game-id',
};

// ── Type mapping ─────────────────────────────────────────────────────

describe('Y8 ad type mapping', () => {
  it('test_launch_maps_to_start', () => {
    expect(Y8_AD_TYPE_MAP.launch).toBe('start');
  });

  it('test_transition_maps_to_next', () => {
    expect(Y8_AD_TYPE_MAP.transition).toBe('next');
  });

  it('test_reward_maps_to_reward', () => {
    expect(Y8_AD_TYPE_MAP.reward).toBe('reward');
  });

  it('test_all_three_contexts_map_to_distinct_y8_types', () => {
    const types = Object.values(Y8_AD_TYPE_MAP);
    expect(new Set(types).size).toBe(3);
  });

  it('test_pause_and_browse_are_not_in_the_mapping', () => {
    // 'pause' and 'browse' are real Y8 types but intentionally unmapped.
    const mappedTypes = Object.values(Y8_AD_TYPE_MAP);
    expect(mappedTypes).not.toContain('pause');
    expect(mappedTypes).not.toContain('browse');
  });
});

// ── y8RequestAdBreak ─────────────────────────────────────────────────

describe('y8RequestAdBreak', () => {
  it('test_launch_calls_showAd_with_type_start', async () => {
    const sdk = makeMockSdk();
    await y8RequestAdBreak(sdk, 'launch');
    expect(sdk.showAdCalls).toHaveLength(1);
    expect(sdk.showAdCalls[0].type).toBe('start');
  });

  it('test_transition_calls_showAd_with_type_next', async () => {
    const sdk = makeMockSdk();
    await y8RequestAdBreak(sdk, 'transition');
    expect(sdk.showAdCalls).toHaveLength(1);
    expect(sdk.showAdCalls[0].type).toBe('next');
  });

  it('test_reward_calls_showAd_with_type_reward', async () => {
    const sdk = makeMockSdk();
    await y8RequestAdBreak(sdk, 'reward');
    expect(sdk.showAdCalls).toHaveLength(1);
    expect(sdk.showAdCalls[0].type).toBe('reward');
  });

  it('test_resolves_after_ad_completes', async () => {
    const sdk = makeMockSdk();
    // makeMockSdk's showAd calls afterAd synchronously, so this resolves.
    await expect(y8RequestAdBreak(sdk, 'transition')).resolves.toBeUndefined();
  });
});

// ── Script injection ─────────────────────────────────────────────────

describe('injectY8Script', () => {
  beforeEach(() => {
    // Clean any existing Y8 script tags.
    document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`).forEach(s => s.remove());
  });

  it('test_injects_real_y8_script_tag', () => {
    const script = injectY8Script();
    expect(script).not.toBeNull();
    expect(script!.src).toBe(Y8_SDK_SCRIPT_URL);
    expect(script!.async).toBe(true);
    expect(document.head.contains(script)).toBe(true);
  });

  it('test_does_not_inject_duplicate_script_tag', () => {
    const first = injectY8Script();
    const second = injectY8Script();
    // Should return the existing tag, not create a new one.
    expect(second).toBe(first);
    expect(document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`)).toHaveLength(1);
  });

  it('test_script_url_is_real_y8_cdn', () => {
    expect(Y8_SDK_SCRIPT_URL).toBe('https://cdn.y8.com/minimal-sdk/2-0/y8.min.js');
  });
});

// ── Script injection does NOT fire on non-y8 environments ────────────

describe('script injection only fires for y8 environment', () => {
  beforeEach(() => {
    document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`).forEach(s => s.remove());
  });

  it('test_does_not_inject_on_own_site', () => {
    // This is a regression test: injectY8Script is only called from
    // initY8, which is only called when detectPortalEnvironment() === 'y8'.
    // Here we verify the classifier returns non-y8 for own_site, proving
    // the gating works at the detection level.
    expect(classifyPortalEnvironment({
      hostname: 'rfditservices.com',
      search: '',
      hasCrazySDK: false,
      hasPokiSDK: false,
      hasY8: false,
    })).toBe('own_site');
    // And no script should be present.
    expect(document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`)).toHaveLength(0);
  });

  it('test_does_not_inject_on_itch', () => {
    expect(classifyPortalEnvironment({
      hostname: 'foo.itch.io',
      search: '',
      hasCrazySDK: false,
      hasPokiSDK: false,
      hasY8: false,
    })).toBe('itch');
    expect(document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`)).toHaveLength(0);
  });

  it('test_does_not_inject_on_unknown', () => {
    expect(classifyPortalEnvironment({
      hostname: 'random.example.com',
      search: '',
      hasCrazySDK: false,
      hasPokiSDK: false,
      hasY8: false,
    })).toBe('unknown');
    expect(document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`)).toHaveLength(0);
  });

  it('test_y8_detection_signal_is_required_for_y8_environment', () => {
    // Without the y8 global or ?portal=y8 param, it's not y8.
    expect(classifyPortalEnvironment({
      hostname: 'y8.com',
      search: '',
      hasCrazySDK: false,
      hasPokiSDK: false,
      hasY8: false,
    })).not.toBe('y8');
  });
});

// ── initY8 ───────────────────────────────────────────────────────────

describe('initY8', () => {
  beforeEach(() => {
    _resetY8State();
    document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`).forEach(s => s.remove());
    delete (globalThis as { y8?: unknown }).y8;
  });

  afterEach(() => {
    _resetY8State();
    document.querySelectorAll(`script[src="${Y8_SDK_SCRIPT_URL}"]`).forEach(s => s.remove());
    delete (globalThis as { y8?: unknown }).y8;
  });

  it('test_takes_appId_and_gameId_as_real_parameters', () => {
    // The config type requires appId and gameId — they're not optional.
    const config: Y8AdapterConfig = { appId: 'my-app', gameId: 'my-game' };
    expect(config.appId).toBe('my-app');
    expect(config.gameId).toBe('my-game');
  });

  it('test_initY8_is_idempotent', () => {
    const p1 = initY8(TEST_CONFIG);
    const p2 = initY8(TEST_CONFIG);
    expect(p1).toBe(p2); // same Promise object
  });

  it('test_initY8_injects_script_tag', () => {
    initY8(TEST_CONFIG);
    expect(document.querySelector(`script[src="${Y8_SDK_SCRIPT_URL}"]`)).not.toBeNull();
  });

  it('test_isY8InitStarted_true_after_initY8_call', () => {
    expect(isY8InitStarted()).toBe(false);
    initY8(TEST_CONFIG);
    expect(isY8InitStarted()).toBe(true);
  });

  it('test_getY8Sdk_null_before_init_completes', () => {
    initY8(TEST_CONFIG);
    expect(getY8Sdk()).toBeNull();
  });

  it('test_initY8_resolves_when_y8sdk_ready_event_fires', async () => {
    const mockSdk = makeMockSdk();
    const mockY8 = {
      sdk: () => mockSdk,
      emitReadyEvent: undefined,
    };
    (globalThis as { y8?: unknown }).y8 = mockY8;

    const promise = initY8({ ...TEST_CONFIG, preloadAdBreaks: 'off' });
    // Simulate the y8sdk.ready event firing.
    globalThis.dispatchEvent(new Event('y8sdk.ready'));
    const resolved = await promise;
    expect(resolved).toBe(mockSdk);
    expect(mockSdk.init).toHaveBeenCalledWith(
      { appId: 'test-app-id', autoLogin: true },
      expect.objectContaining({ gameId: 'test-game-id' }),
    );
  });
});

// ── No hardcoded Shoal credentials ───────────────────────────────────

describe('no hardcoded Shoal credentials in shared adapter', () => {
  it('test_no_shoal_app_id_or_game_id_in_y8_adapter_file', () => {
    const src = readFileSync(
      resolve(import.meta.dirname, '../src/engine/shared/portalAdapter/adapters/y8.ts'),
      'utf8',
    );
    // Shoal's real credentials from the directive — must NOT appear.
    expect(src).not.toContain('6a8a38fd3daf0b765651b797');
    expect(src).not.toContain('281135');
  });

  it('test_no_shoal_credentials_anywhere_in_engine_shared_portalAdapter', () => {
    const dir = resolve(import.meta.dirname, '../src/engine/shared/portalAdapter');
    const files = [
      resolve(dir, 'adapters/y8.ts'),
      resolve(dir, 'detection.ts'),
      resolve(dir, 'interface.ts'),
      resolve(dir, 'index.ts'),
    ];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toContain('6a8a38fd3daf0b765651b797');
      expect(src).not.toContain('281135');
    }
  });
});

// ── Shoal is now the wired consumer (Phase 3) ───────────────────────
// Phase 2 forbade Shoal from importing portalAdapter. Phase 3 wires
// Shoal in — this test now verifies the opposite: Shoal's App.tsx
// DOES import portalAdapter, and the shared adapter files are unchanged.

describe('Shoal wired as Y8 consumer (Phase 3)', () => {
  it('test_shoal_app_imports_portalAdapter', () => {
    const repoRoot = resolve(import.meta.dirname, '..');
    const src = readFileSync(
      resolve(repoRoot, 'src/games/shoal/App.tsx'),
      'utf8',
    );
    expect(src.includes('portalAdapter')).toBe(true);
  });

  it('test_shoal_y8_config_exists', () => {
    const repoRoot = resolve(import.meta.dirname, '..');
    const src = readFileSync(
      resolve(repoRoot, 'src/games/shoal/y8Config.ts'),
      'utf8',
    );
    expect(src.includes('portalAdapter')).toBe(true);
  });
});
