import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..');

/**
 * Test anchors for the four-document documentation architecture
 * (ADR-017). Verifies that the new doc structure exists and the old
 * current.md files are retired.
 */
describe('Four-Document Documentation Architecture (ADR-017)', () => {

  // ---------------------------------------------------------------------------
  // Anchor 1: Studio-wide four documents exist
  // ---------------------------------------------------------------------------
  describe('test_studio_wide_four_docs_exist', () => {
    const studioDocs = [
      { name: 'CHANGELOG.md', path: 'CHANGELOG.md' },
      { name: 'ROADMAP.md', path: 'ROADMAP.md' },
      { name: 'docs/status.md', path: 'docs/status.md' },
      { name: 'docs/adr/', path: 'docs/adr' },
    ];

    for (const doc of studioDocs) {
      it(`${doc.name} exists at repo root`, () => {
        const fullPath = resolve(REPO_ROOT, doc.path);
        expect(existsSync(fullPath)).toBe(true);
      });
    }

    it('docs/status.md is short (under 200 lines)', () => {
      const content = readFileSync(
        resolve(REPO_ROOT, 'docs/status.md'),
        'utf-8'
      );
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThan(200);
    });
  });

  // ---------------------------------------------------------------------------
  // Anchor 2: Per-project CHANGELOG.md files exist
  // ---------------------------------------------------------------------------
  describe('test_per_project_changelogs_exist', () => {
    const projectChangelogs = [
      'ts/src/engine/paperDoll/CHANGELOG.md',
      'ts/src/games/planetofgreed/CHANGELOG.md',
      'games/shoal/CHANGELOG.md',
      'games/dissonance/CHANGELOG.md',
      'games/slimeworld/CHANGELOG.md',
      'ts/src/games/mutant_battle_ball/CHANGELOG.md',
      'ts/src/games/character_viewer/CHANGELOG.md',
      '_check/antsim-redux/CHANGELOG.md',
    ];

    for (const relPath of projectChangelogs) {
      it(`${relPath} exists`, () => {
        const fullPath = resolve(REPO_ROOT, relPath);
        expect(existsSync(fullPath)).toBe(true);
      });
    }

    it('each per-project CHANGELOG links to studio-wide summary', () => {
      for (const relPath of projectChangelogs) {
        const content = readFileSync(
          resolve(REPO_ROOT, relPath),
          'utf-8'
        );
        expect(content).toMatch(/CHANGELOG\.md/);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Anchor 3: Per-project ROADMAP.md files exist where expected
  // ---------------------------------------------------------------------------
  describe('test_per_project_roadmaps_exist', () => {
    const projectRoadmaps = [
      'games/shoal/ROADMAP.md',
      '_check/antsim-redux/ROADMAP.md',
    ];

    for (const relPath of projectRoadmaps) {
      it(`${relPath} exists`, () => {
        const fullPath = resolve(REPO_ROOT, relPath);
        expect(existsSync(fullPath)).toBe(true);
      });
    }

    it('each ROADMAP links to studio-wide roadmap', () => {
      for (const relPath of projectRoadmaps) {
        const content = readFileSync(
          resolve(REPO_ROOT, relPath),
          'utf-8'
        );
        expect(content).toMatch(/ROADMAP\.md/);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Anchor 4: New ADRs exist (ADR-017 through ADR-020)
  // ---------------------------------------------------------------------------
  describe('test_new_adrs_exist', () => {
    const newAdrs = [
      'docs/adr/ADR-017-four-doc-documentation-architecture.md',
      'docs/adr/ADR-018-shoal-ts-native-simulation-migration.md',
      'docs/adr/ADR-019-paper-doll-shared-composition-layer.md',
      'docs/adr/ADR-020-character-viewer-tool-status.md',
    ];

    for (const relPath of newAdrs) {
      it(`${relPath} exists`, () => {
        const fullPath = resolve(REPO_ROOT, relPath);
        expect(existsSync(fullPath)).toBe(true);
      });
    }

    it('ADR-017 documents the four-doc decision', () => {
      const content = readFileSync(
        resolve(REPO_ROOT, newAdrs[0]),
        'utf-8'
      );
      expect(content).toMatch(/ADR-017/);
      expect(content).toMatch(/CHANGELOG/);
      expect(content).toMatch(/ROADMAP/);
      expect(content).toMatch(/status\.md/);
    });

    it('all new ADRs have Accepted status', () => {
      for (const relPath of newAdrs) {
        const content = readFileSync(
          resolve(REPO_ROOT, relPath),
          'utf-8'
        );
        expect(content).toMatch(/\*\*Status:\*\* Accepted/i);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Anchor 5: current.md files are retired (replaced with redirect notes)
  // ---------------------------------------------------------------------------
  describe('test_current_md_files_retired', () => {
    const retiredFiles = [
      'docs/state/current.md',
      'games/shoal/docs/state/current.md',
      '_check/antsim-redux/docs/state/current.md',
    ];

    for (const relPath of retiredFiles) {
      it(`${relPath} contains retirement notice`, () => {
        const fullPath = resolve(REPO_ROOT, relPath);
        expect(existsSync(fullPath)).toBe(true);
        const content = readFileSync(fullPath, 'utf-8');
        expect(content).toMatch(/retired/i);
        expect(content).toMatch(/ADR-017/i);
      });

      it(`${relPath} is short (under 50 lines)`, () => {
        const fullPath = resolve(REPO_ROOT, relPath);
        const content = readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;
        expect(lineCount).toBeLessThan(50);
      });
    }
  });
});
