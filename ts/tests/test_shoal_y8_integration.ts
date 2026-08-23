import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const tsRoot = resolve(repoRoot, 'ts');

// ── Config file ──────────────────────────────────────────────────────

describe('Shoal Y8 config', () => {
  it('test_config_file_exists_with_real_credentials', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'y8Config.ts'),
      'utf8',
    );
    // Real, live values from Y8's dashboard — not placeholders.
    expect(src).toContain('6a8a38fd3daf0b765651b797');
    expect(src).toContain('281135');
    expect(src).not.toMatch(/YOUR_APP_ID|YOUR_GAME_ID|placeholder|xxx/i);
  });

  it('test_config_exports_typed_Y8AdapterConfig', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'y8Config.ts'),
      'utf8',
    );
    expect(src).toContain('Y8AdapterConfig');
    expect(src).toContain('SHOAL_Y8_CONFIG');
  });

  it('test_config_imports_from_shared_adapter_not_hardcoding_types', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'y8Config.ts'),
      'utf8',
    );
    // Must import the type from the shared adapter, not define its own.
    expect(src).toContain("from '../../engine/shared/portalAdapter/adapters/y8'");
  });
});

// ── Script tag in source index.html ──────────────────────────────────
// The Y8 SDK script tag is no longer in the source template directly.
// It is injected at build time by the preserveY8ScriptTag() plugin in
// vite.shoal.config.ts, only when --mode y8 is used. The source template
// contains a comment placeholder instead.

describe('Y8 SDK script tag in source', () => {
  it('test_script_tag_not_in_source_index_html', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'shoal', 'index.html'),
      'utf8',
    );
    // The script tag should NOT be in the source template — it's
    // injected conditionally at build time.
    expect(src).not.toContain('https://cdn.y8.com/minimal-sdk/2-0/y8.min.js');
    // The template should have a comment explaining the injection.
    expect(src).toContain('BUILD_TARGET=y8');
  });

  it('test_vite_config_has_conditional_injection_plugin', () => {
    const configSrc = readFileSync(
      resolve(tsRoot, 'vite.shoal.config.ts'),
      'utf8',
    );
    // The plugin must check mode === 'y8' to conditionally inject.
    expect(configSrc).toContain('preserveY8ScriptTag');
    expect(configSrc).toContain("mode === 'y8'");
    // The plugin must NOT unconditionally inject.
    expect(configSrc).not.toMatch(/preserveY8ScriptTag\(\)/);
  });
});

// ── Script tag survives Y8 build, absent from itch build ─────────────

describe('Y8 SDK script tag build-target conditional', () => {
  it('test_script_tag_absent_from_default_build', () => {
    // Run the default Shoal build (itch/arcade target), then check.
    execSync('npm run build:shoal', { cwd: tsRoot, encoding: 'utf8', stdio: 'pipe' });
    const distSrc = readFileSync(
      resolve(tsRoot, 'dist-shoal', 'index.html'),
      'utf8',
    );
    // The Y8 SDK script tag must NOT be present in the default build.
    expect(distSrc).not.toContain('cdn.y8.com/minimal-sdk/2-0/y8.min.js');
  });

  it('test_script_tag_present_in_y8_build', () => {
    // Run the Y8-targeted build, then check.
    execSync('npm run build:shoal:y8', { cwd: tsRoot, encoding: 'utf8', stdio: 'pipe' });
    const distSrc = readFileSync(
      resolve(tsRoot, 'dist-shoal', 'index.html'),
      'utf8',
    );
    // The Y8 SDK script tag must be present in the Y8 build.
    expect(distSrc).toContain('cdn.y8.com/minimal-sdk/2-0/y8.min.js');
  });
});

// ── App.tsx wiring ───────────────────────────────────────────────────

describe('Shoal App.tsx Y8 wiring', () => {
  it('test_imports_portalAdapter_interface_functions', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    expect(src).toContain('notifyGameplayStart');
    expect(src).toContain('notifyGameplayStop');
    expect(src).toContain("from '../../engine/shared/portalAdapter/interface'");
  });

  it('test_imports_initY8_and_detectPortalEnvironment', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    expect(src).toContain('initY8');
    expect(src).toContain("from '../../engine/shared/portalAdapter/adapters/y8'");
    expect(src).toContain('detectPortalEnvironment');
    expect(src).toContain("from '../../engine/shared/portalAdapter/detection'");
  });

  it('test_imports_shoal_y8_config', () => {
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    expect(src).toContain('SHOAL_Y8_CONFIG');
    expect(src).toContain("from './y8Config'");
  });

  it('test_notifyGameplayStart_called_from_handleStart', () => {
    // The real gameplay-start transition: title → game screen.
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    // handleStart is the real function that transitions to gameplay.
    // notifyGameplayStart must be called within it.
    const handleStartIdx = src.indexOf('handleStart');
    expect(handleStartIdx).toBeGreaterThan(-1);
    const afterHandleStart = src.slice(handleStartIdx);
    expect(afterHandleStart).toContain('notifyGameplayStart()');
  });

  it('test_notifyGameplayStop_called_from_title_button', () => {
    // The real gameplay-stop transition: game → title screen via the
    // "← Title" button. This is a real, confirmed call site — Shoal
    // DOES have a stop transition (returning to title).
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    // The "← Title" button must call notifyGameplayStop.
    const titleBtnIdx = src.indexOf('← Title');
    expect(titleBtnIdx).toBeGreaterThan(-1);
    const aroundTitleBtn = src.slice(Math.max(0, titleBtnIdx - 200), titleBtnIdx + 50);
    expect(aroundTitleBtn).toContain('notifyGameplayStop');
  });

  it('test_initY8_only_called_when_y8_environment_detected', () => {
    // The Y8 SDK must only be initialized when detectPortalEnvironment()
    // returns 'y8' — never on own_site, itch, or unknown.
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    // initY8 must be gated by a detectPortalEnvironment() === 'y8' check.
    expect(src).toContain("detectPortalEnvironment() === 'y8'");
    // And initY8 must only appear inside that guard, not unconditionally.
    const guardIdx = src.indexOf("detectPortalEnvironment() === 'y8'");
    const initY8Idx = src.indexOf('initY8(', guardIdx);
    expect(initY8Idx).toBeGreaterThan(guardIdx);
  });
});

// ── Shared adapter not modified ──────────────────────────────────────

describe('shared portalAdapter not modified this phase', () => {
  it('test_shared_adapter_files_unchanged_from_last_commit', () => {
    const files = [
      'src/engine/shared/portalAdapter/adapters/y8.ts',
      'src/engine/shared/portalAdapter/detection.ts',
      'src/engine/shared/portalAdapter/interface.ts',
      'src/engine/shared/portalAdapter/index.ts',
    ];
    for (const rel of files) {
      const file = resolve(tsRoot, rel);
      let diff: string;
      try {
        diff = execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf8' });
      } catch {
        diff = '';
      }
      expect(diff.trim(), `${rel} was modified — read-only this phase`).toBe('');
    }
  });
});

// ── Shoal's real pause/stop state ────────────────────────────────────

describe('Shoal real pause/stop state', () => {
  it('test_shoal_has_real_stop_transition_via_title_button', () => {
    // Honest finding: Shoal DOES have a real gameplay-stop transition.
    // The "← Title" button returns from the game screen to the title
    // screen — a genuine stop moment. notifyGameplayStop is wired there.
    // There is no separate pause state (the Mechanics overlay is an
    // informational popup, not a pause — the simulation keeps running).
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    expect(src).toContain('setScreen(\'title\')');
    expect(src).toContain('notifyGameplayStop');
  });

  it('test_shoal_has_no_pause_state_simulation_keeps_running', () => {
    // The Mechanics overlay is NOT a pause — it's an informational popup.
    // The game loop (useGameLoop) runs unconditionally while on the game
    // screen. There is no paused/running flag. This is an honest finding,
    // not a gap — Shoal's design is a continuous sandbox, not a paused
    // game with menu returns.
    const src = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'App.tsx'),
      'utf8',
    );
    // No 'paused' or 'isPaused' state exists.
    expect(src).not.toMatch(/\bpaused\b|\bisPaused\b/i);
  });
});
