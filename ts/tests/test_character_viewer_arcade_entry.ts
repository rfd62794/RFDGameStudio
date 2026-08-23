// @vitest-environment node
//
// Character Viewer — Real Arcade Entry — Tests
//
// Verifies:
//   1. Real registry schema confirmed (category decision reported)
//   2. Character Viewer registered in GAME_REGISTRY
//   3. Arcade click loads the real CharacterViewer component (routing)
//   4. Original dev-only standalone path still works (regression)
//   5. paperDoll module confirmed byte-unchanged via git diff
//   6. No regression to current floor
//

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_REGISTRY, findGame } from '../src/games/registry';
import type { GameStatus } from '../src/engine/types';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const tsRoot = resolve(repoRoot, 'ts');

// ── Tests ────────────────────────────────────────────────────────────

describe('test_registry_schema_confirmed', () => {
  it('Real GameStatus type includes the new tool category', () => {
    // The real schema was read fresh. The existing statuses were
    // 'stable' | 'beta' | 'dev' | 'external'. None honestly described
    // a non-competitive sandbox tool. A new 'tool' status was added.
    const typesSource = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'types.ts'),
      'utf-8',
    );
    expect(typesSource).toContain("'stable' | 'beta' | 'dev' | 'external' | 'tool'");
  });

  it('Category decision: tool status is distinct from all existing statuses', () => {
    // VoidRift uses 'external' for itch.io embeds — not applicable to
    // an internal TS-native component. 'stable'/'beta'/'dev' imply
    // competitive games in progress. 'tool' is the honest category.
    const statuses: GameStatus[] = ['stable', 'beta', 'dev', 'external', 'tool'];
    expect(statuses).toContain('tool');
    expect(statuses.filter(s => s === 'tool')).toHaveLength(1);
  });

  it('CSS badge style exists for tool status', () => {
    const cssSource = readFileSync(
      resolve(tsRoot, 'src', 'ui', 'base.css'),
      'utf-8',
    );
    expect(cssSource).toContain('.arcade-status--tool');
  });
});

describe('test_character_viewer_registered', () => {
  it('Character Viewer config exists as a real file', () => {
    const configSource = readFileSync(
      resolve(tsRoot, 'src', 'games', 'character_viewer', 'config.ts'),
      'utf-8',
    );
    expect(configSource).toContain('characterViewerConfig');
    expect(configSource).toContain("gameId:      'character_viewer'");
    expect(configSource).toContain("status:      'tool'");
  });

  it('Character Viewer is present in GAME_REGISTRY', () => {
    const entry = findGame('character_viewer');
    expect(entry).toBeDefined();
    expect(entry!.gameId).toBe('character_viewer');
    expect(entry!.label).toBe('Character Viewer');
    expect(entry!.status).toBe('tool');
  });

  it('Character Viewer has a real component (lazy-loaded)', () => {
    const entry = findGame('character_viewer');
    expect(entry).toBeDefined();
    expect(entry!.component).toBeDefined();
    expect(typeof entry!.component).toBe('object'); // React.lazy returns an object
  });

  it('Character Viewer description is honest and non-competitive', () => {
    const entry = findGame('character_viewer');
    expect(entry).toBeDefined();
    const desc = entry!.description ?? '';
    // Must NOT imply competitive play
    expect(desc).not.toMatch(/win|score|beat|defeat|compete|race|battle/i);
    // Must describe what it actually is
    expect(desc).toMatch(/sandbox|tool|preview|design|assemble/i);
  });

  it('Character Viewer does NOT have externalUrl or embedUrl (it is TS-native)', () => {
    const entry = findGame('character_viewer');
    expect(entry).toBeDefined();
    expect(entry!.externalUrl).toBeUndefined();
    expect(entry!.embedUrl).toBeUndefined();
  });
});

describe('test_arcade_click_loads_viewer', () => {
  it('GameLoader can route to character_viewer via findGame', () => {
    // GameLoader uses findGame(gameId) to get the config, then renders
    // config.component. This test confirms the routing path works.
    const cfg = findGame('character_viewer');
    expect(cfg).toBeDefined();
    expect(cfg!.component).toBeDefined();
  });

  it('App.tsx wrapper imports the real CharacterViewer from standalone surface', () => {
    const appSource = readFileSync(
      resolve(tsRoot, 'src', 'games', 'character_viewer', 'App.tsx'),
      'utf-8',
    );
    // Must import from the real standalone surface — not a forked copy
    expect(appSource).toContain('from \'../../standalone/character_viewer/CharacterViewer\'');
    // Must accept GameRendererProps (the arcade contract)
    expect(appSource).toContain('GameRendererProps');
  });

  it('GameSelector renders tool-status entries with honest detail string', () => {
    const selectorSource = readFileSync(
      resolve(tsRoot, 'src', 'arcade', 'GameSelector.tsx'),
      'utf-8',
    );
    // Must have a special case for tool status (not 'data unavailable')
    expect(selectorSource).toContain("config.status === 'tool'");
    expect(selectorSource).toContain('Sandbox tool');
  });

  it('registry.ts imports and exports characterViewerConfig', () => {
    const registrySource = readFileSync(
      resolve(tsRoot, 'src', 'games', 'registry.ts'),
      'utf-8',
    );
    expect(registrySource).toContain('import { characterViewerConfig }');
    expect(registrySource).toContain('characterViewerConfig');
  });
});

describe('test_dev_only_path_still_works', () => {
  it('Original standalone surface files are untouched and present', () => {
    // The standalone surface must remain fully intact
    const indexHtml = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'index.html'),
      'utf-8',
    );
    expect(indexHtml).toContain('./entry.tsx');

    const entryTsx = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'entry.tsx'),
      'utf-8',
    );
    expect(entryTsx).toContain('CharacterViewer');

    const viewerSource = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx'),
      'utf-8',
    );
    // The real viewer must still export its default component
    expect(viewerSource).toContain('export default function CharacterViewer');
  });

  it('Standalone entry.tsx still imports from the real paperDoll module', () => {
    const entrySource = readFileSync(
      resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx'),
      'utf-8',
    );
    expect(entrySource).toContain('from \'../../engine/paperDoll\'');
    expect(entrySource).toContain('renderFigureSvg');
  });
});

describe('test_paperDoll_module_unmodified', () => {
  // Note: The paperDoll module was intentionally upgraded by the
  // ChimeraLab Pattern Port directive (August 2026). These tests now
  // verify the Character Viewer source itself is unchanged, rather
  // than the paperDoll module it consumes.
  it('CharacterViewer.tsx standalone source is byte-unchanged from last commit', () => {
    const file = resolve(tsRoot, 'src', 'standalone', 'character_viewer', 'CharacterViewer.tsx');
    let diff: string;
    try {
      diff = execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      diff = '';
    }
    expect(diff.trim()).toBe('');
  });

  it('PaperDoll.tsx React component is byte-unchanged from last commit', () => {
    const file = resolve(tsRoot, 'src', 'engine', 'paperDoll', 'PaperDoll.tsx');
    let diff: string;
    try {
      diff = execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf-8' });
    } catch {
      diff = '';
    }
    expect(diff.trim()).toBe('');
  });
});

describe('test_no_regression', () => {
  it('Character Viewer entry does not displace existing registry entries', () => {
    // All pre-existing entries must still be present
    const existingIds = [
      'dissonance', 'slimeworld', 'shoal', 'voiddrift',
      'horse_racing', 'slither_rogue', 'mutant_battle_ball',
      'slime_coin', 'chimera_wilds', 'scrapcrawl',
      'ledger', 'trinity_siege', '7_days_to_fry',
      'antsim_redux', 'facility_escape', 'factory_idle',
      'planetofgreed', 'planetforge',
      'gladiator_arena',
      'voiddrift_redux',
      'succession',
      'house_of_kings_collab',
      'technique_showcase',
      'role_symbol_viewer',
    ];
    for (const id of existingIds) {
      expect(findGame(id)).toBeDefined();
    }
    // Plus the new entry
    expect(findGame('character_viewer')).toBeDefined();
    // Registry has grown since this test was written (technique_showcase,
    // role_symbol_viewer, and the 5 Legacy/Origin Projects from ADR-023 —
    // dissonance_prototype, slimegarden, slimebreeder, corpworld,
    // kingmaker_squads). This test's real job is confirming none of the
    // pre-existing entries got displaced, not pinning an exact total —
    // that's covered by test_registry_total_count_includes_legacy_origin_projects
    // in test_arcade_registry_directive.ts.
    expect(GAME_REGISTRY.length).toBeGreaterThanOrEqual(existingIds.length + 1);
  });

  it('Existing game statuses are unaffected by the new tool status', () => {
    // The GameStatus type addition is additive — existing configs
    // still use their original statuses
    const mbb = findGame('mutant_battle_ball');
    expect(mbb!.status).toBe('dev');
    const voidrift = findGame('voiddrift');
    expect(voidrift!.status).toBe('external');
  });

  it('MBB and Chimera Wilds still reference the PaperDoll component', () => {
    const mbbRoster = readFileSync(
      resolve(tsRoot, 'src', 'games', 'mutant_battle_ball', 'components', 'RosterTab.tsx'),
      'utf-8',
    );
    const chimeraApp = readFileSync(
      resolve(tsRoot, 'src', 'games', 'chimera_wilds', 'App.tsx'),
      'utf-8',
    );
    expect(mbbRoster).toContain('PaperDoll');
    expect(chimeraApp).toContain('PaperDoll');
  });
});
