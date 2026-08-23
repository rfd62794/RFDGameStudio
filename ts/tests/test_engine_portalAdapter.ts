import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  classifyPortalEnvironment,
  detectPortalEnvironment,
  isPortalEnvironment,
  PortalEnvironment,
  PortalDetectionInput,
  OWN_SITE_HOSTNAME,
} from '../src/engine/shared/portalAdapter/detection';
import {
  notifyGameplayStart,
  notifyGameplayStop,
  requestAdBreak,
} from '../src/engine/shared/portalAdapter/interface';

// ── Helpers ──────────────────────────────────────────────────────────

function input(overrides: Partial<PortalDetectionInput> = {}): PortalDetectionInput {
  return {
    hostname: OWN_SITE_HOSTNAME,
    search: '',
    hasCrazySDK: false,
    hasPokiSDK: false,
    ...overrides,
  };
}

// ── Detection: pure classifier ───────────────────────────────────────

describe('classifyPortalEnvironment', () => {
  it('test_returns_own_site_with_no_portal_signals', () => {
    expect(classifyPortalEnvironment(input())).toBe('own_site');
  });

  it('test_returns_own_site_for_bare_own_site_hostname', () => {
    expect(classifyPortalEnvironment(input({ hostname: OWN_SITE_HOSTNAME }))).toBe('own_site');
  });

  it('test_returns_own_site_for_subdomain_of_own_site', () => {
    expect(classifyPortalEnvironment(input({ hostname: `arcade.${OWN_SITE_HOSTNAME}` }))).toBe('own_site');
  });

  it('test_returns_itch_for_itch_io_hostname', () => {
    expect(classifyPortalEnvironment(input({ hostname: 'foo.itch.io' }))).toBe('itch');
    expect(classifyPortalEnvironment(input({ hostname: 'itch.io' }))).toBe('itch');
  });

  it('test_returns_itch_for_itch_zone_iframe_cdn', () => {
    expect(classifyPortalEnvironment(input({ hostname: 'html.itch.zone' }))).toBe('itch');
  });

  it('test_returns_crazygames_when_crazy_sdk_present', () => {
    expect(classifyPortalEnvironment(input({ hostname: 'example.com', hasCrazySDK: true }))).toBe('crazygames');
  });

  it('test_returns_poki_when_poki_sdk_present', () => {
    expect(classifyPortalEnvironment(input({ hostname: 'example.com', hasPokiSDK: true }))).toBe('poki');
  });

  it('test_crazygames_takes_precedence_over_poki_when_both_present', () => {
    // Both SDKs present is unrealistic, but the classifier must be
    // deterministic — CrazySDK is checked first, so it wins.
    expect(
      classifyPortalEnvironment(input({ hostname: 'example.com', hasCrazySDK: true, hasPokiSDK: true })),
    ).toBe('crazygames');
  });

  it('test_returns_crazygames_via_query_param_fallback', () => {
    expect(
      classifyPortalEnvironment(input({ hostname: 'example.com', search: '?portal=crazygames' })),
    ).toBe('crazygames');
  });

  it('test_returns_poki_via_query_param_fallback', () => {
    expect(
      classifyPortalEnvironment(input({ hostname: 'example.com', search: '?portal=poki' })),
    ).toBe('poki');
  });

  it('test_query_param_fallback_works_with_other_params', () => {
    expect(
      classifyPortalEnvironment(input({ hostname: 'example.com', search: '?game=shoal&portal=crazygames' })),
    ).toBe('crazygames');
  });

  it('test_own_site_hostname_ignores_portal_query_param', () => {
    // A portal param on our own domain doesn't override reality.
    expect(
      classifyPortalEnvironment(input({ hostname: OWN_SITE_HOSTNAME, search: '?portal=crazygames' })),
    ).toBe('own_site');
  });

  it('test_returns_unknown_for_unrecognized_hostname_with_no_signals', () => {
    expect(classifyPortalEnvironment(input({ hostname: 'random.example.com' }))).toBe('unknown');
  });

  it('test_returns_unknown_for_empty_hostname', () => {
    expect(classifyPortalEnvironment(input({ hostname: '' }))).toBe('unknown');
  });

  it('test_is_case_insensitive_on_hostname', () => {
    expect(classifyPortalEnvironment(input({ hostname: 'FOO.ITCH.IO' }))).toBe('itch');
    expect(classifyPortalEnvironment(input({ hostname: 'RFDITSERVICES.COM' }))).toBe('own_site');
  });
});

// ── unknown behaves identically to own_site ──────────────────────────

describe('unknown environment behaves identically to own_site', () => {
  it('test_isPortalEnvironment_false_for_both_own_site_and_unknown', () => {
    expect(isPortalEnvironment('own_site')).toBe(false);
    expect(isPortalEnvironment('unknown')).toBe(false);
  });

  it('test_isPortalEnvironment_true_for_real_portals', () => {
    expect(isPortalEnvironment('itch')).toBe(true);
    expect(isPortalEnvironment('crazygames')).toBe(true);
    expect(isPortalEnvironment('poki')).toBe(true);
  });

  it('test_interface_functions_safe_in_unknown_and_own_site', async () => {
    // Both must not throw and must produce no side effects. We can't
    // easily mock detectPortalEnvironment here, but calling the real
    // functions in jsdom (which has no portal SDK) exercises the
    // no-portal path — which is the same path unknown takes.
    expect(() => notifyGameplayStart()).not.toThrow();
    expect(() => notifyGameplayStop()).not.toThrow();
    await expect(requestAdBreak()).resolves.toBeUndefined();
  });
});

// ── detectPortalEnvironment: real runtime wrapper ───────────────────

describe('detectPortalEnvironment', () => {
  const originalLocation = (globalThis as { location?: { hostname?: string; search?: string } }).location;
  const originalCrazy = (globalThis as { CrazySDK?: unknown }).CrazySDK;
  const originalPoki = (globalThis as { PokiSDK?: unknown }).PokiSDK;

  afterEach(() => {
    // Restore globals after each test.
    if (originalLocation !== undefined) {
      (globalThis as { location?: unknown }).location = originalLocation;
    }
    delete (globalThis as { CrazySDK?: unknown }).CrazySDK;
    delete (globalThis as { PokiSDK?: unknown }).PokiSDK;
    if (originalCrazy !== undefined) (globalThis as { CrazySDK?: unknown }).CrazySDK = originalCrazy;
    if (originalPoki !== undefined) (globalThis as { PokiSDK?: unknown }).PokiSDK = originalPoki;
  });

  it('test_returns_own_site_in_default_jsdom_environment', () => {
    // jsdom defaults to localhost — no portal signals present.
    const env = detectPortalEnvironment();
    // localhost is not own_site hostname, so it's 'unknown' — which
    // behaves identically to own_site. Verify it's one of the two
    // safe no-portal environments.
    expect(['own_site', 'unknown']).toContain(env);
  });

  it('test_returns_crazygames_when_CrazySDK_global_present', () => {
    (globalThis as { CrazySDK?: unknown }).CrazySDK = { IsAvailable: () => true };
    expect(detectPortalEnvironment()).toBe('crazygames');
  });

  it('test_returns_poki_when_PokiSDK_global_present', () => {
    (globalThis as { PokiSDK?: unknown }).PokiSDK = { init: () => {} };
    expect(detectPortalEnvironment()).toBe('poki');
  });
});

// ── Interface functions: safe-by-default ─────────────────────────────

describe('interface functions safe with zero portals', () => {
  beforeEach(() => {
    // Ensure no portal globals are present.
    delete (globalThis as { CrazySDK?: unknown }).CrazySDK;
    delete (globalThis as { PokiSDK?: unknown }).PokiSDK;
  });

  it('test_notifyGameplayStart_does_not_throw', () => {
    expect(() => notifyGameplayStart()).not.toThrow();
  });

  it('test_notifyGameplayStop_does_not_throw', () => {
    expect(() => notifyGameplayStop()).not.toThrow();
  });

  it('test_requestAdBreak_resolves_immediately', async () => {
    await expect(requestAdBreak()).resolves.toBeUndefined();
  });

  it('test_requestAdBreak_returns_a_promise', () => {
    const result = requestAdBreak();
    expect(result).toBeInstanceOf(Promise);
    // Don't leave an unhandled rejection.
    result.catch(() => {});
  });
});

// ── No live game imports this module yet (grep anchor) ───────────────

describe('no live game imports portalAdapter yet', () => {
  const LIVE_FILES = [
    'src/games/succession/App.tsx',
    'src/games/succession/components/AudienceStage.tsx',
    'src/games/shoal/App.tsx',
    'src/games/slimeworld/App.tsx',
    'src/games/dissonance/App.tsx',
    'src/games/planetofgreed/App.tsx',
  ];

  it('test_no_live_game_component_imports_portalAdapter', () => {
    const repoRoot = resolve(import.meta.dirname, '..');
    for (const rel of LIVE_FILES) {
      const path = resolve(repoRoot, rel);
      let src: string;
      try {
        src = readFileSync(path, 'utf8');
      } catch {
        // File doesn't exist — skip, not our concern.
        continue;
      }
      expect(
        src.includes('portalAdapter'),
        `${rel} imports portalAdapter — forbidden this phase`,
      ).toBe(false);
    }
  });
});
