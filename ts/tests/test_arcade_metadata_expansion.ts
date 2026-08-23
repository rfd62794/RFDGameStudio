import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY } from '../src/games/registry';
import type { GameConfig, PrimaryGenre } from '../src/engine/types';
import { GameDetailView, resolveDetailDescription } from '../src/arcade/GameDetailView';
import { loadPatchNotes } from '../src/games/patchNotesLoader';
import gameMetadata from '../src/games/game-metadata.json';

const tsRoot = resolve(import.meta.dirname, '..');

// ── GameConfig new fields are genuinely optional ─────────────────────

describe('Arcade Metadata Expansion — GameConfig backward compatibility', () => {
  it('test_existing_registry_entries_without_new_fields_still_valid', () => {
    // Every entry in the real registry must still satisfy GameConfig's
    // shape whether or not it has adopted the new optional fields.
    for (const config of GAME_REGISTRY) {
      expect(config.gameId).toBeTruthy();
      expect(config.label).toBeTruthy();
      // New fields are optional — undefined is a valid, real state.
      if (config.shortDescription !== undefined) {
        expect(typeof config.shortDescription).toBe('string');
      }
      if (config.longDescription !== undefined) {
        expect(typeof config.longDescription).toBe('string');
      }
      if (config.tags !== undefined) {
        expect(Array.isArray(config.tags)).toBe(true);
      }
    }
  });

  it('test_genre_values_are_from_the_curated_taxonomy_when_set', () => {
    const validGenres: PrimaryGenre[] = [
      'creature-collector', 'combat-arena', 'economic-precarity',
      'colony-4x', 'idle-incremental', 'roguelike', 'racing',
      'puzzle-stealth', 'cooperative', 'narrative-persuasion',
      'management-sim',
    ];
    for (const config of GAME_REGISTRY) {
      if (config.genre !== undefined) {
        expect(validGenres).toContain(config.genre);
      }
    }
  });

  it('test_honest_taxonomy_gaps_are_real_and_documented', () => {
    // Real, honest finding from the genre-classification pass: these
    // games genuinely don't fit the 11-value taxonomy cleanly and were
    // left without a `genre` rather than forced — confirmed here so a
    // future regression (accidentally forcing a wrong fit) is caught.
    const noCleanFitIds = ['shoal', 'slime_coin', '7_days_to_fry'];
    for (const gameId of noCleanFitIds) {
      const config = GAME_REGISTRY.find(g => g.gameId === gameId);
      expect(config).toBeDefined();
      expect(config!.genre).toBeUndefined();
    }
  });
});

// ── Detail view fallback chain ───────────────────────────────────────

describe('Arcade Metadata Expansion — detail view description fallback', () => {
  it('test_fallback_uses_longDescription_when_present', () => {
    const config: GameConfig = {
      gameId: 'x', label: 'X',
      description: 'short existing',
      shortDescription: 'card length',
      longDescription: 'the real long detail-view text',
    };
    expect(resolveDetailDescription(config)).toBe('the real long detail-view text');
  });

  it('test_fallback_uses_shortDescription_when_longDescription_absent', () => {
    const config: GameConfig = {
      gameId: 'x', label: 'X',
      description: 'existing description',
      shortDescription: 'card length text',
    };
    expect(resolveDetailDescription(config)).toBe('card length text');
  });

  it('test_fallback_uses_existing_description_when_both_new_fields_absent', () => {
    const config: GameConfig = {
      gameId: 'x', label: 'X',
      description: 'the only description this game has',
    };
    expect(resolveDetailDescription(config)).toBe('the only description this game has');
  });

  it('test_fallback_returns_empty_string_when_nothing_set', () => {
    const config: GameConfig = { gameId: 'x', label: 'X' };
    expect(resolveDetailDescription(config)).toBe('');
  });
});

// ── Patch notes: real load + honest failure ──────────────────────────

describe('Arcade Metadata Expansion — patch notes loading', () => {
  it('test_succession_real_patch_notes_file_loads', () => {
    const content = loadPatchNotes('succession/PATCH_NOTES_v0.2.0.md');
    expect(content).not.toBeNull();
    expect(content).toContain('Succession');
  });

  it('test_missing_patch_notes_file_returns_null_not_fabricated_content', () => {
    const content = loadPatchNotes('not_a_real_game/PATCH_NOTES_v9.9.9.md');
    expect(content).toBeNull();
  });

  it('test_succession_config_patchNotesPath_matches_real_file_on_disk', () => {
    const succession = GAME_REGISTRY.find(g => g.gameId === 'succession');
    expect(succession?.patchNotesPath).toBeDefined();
    const filePath = resolve(tsRoot, 'src', 'games', succession!.patchNotesPath!);
    // Real file existence check, not just a loader-level assertion.
    expect(() => readFileSync(filePath, 'utf-8')).not.toThrow();
  });

  it('test_detail_view_renders_honest_unavailable_state_for_missing_patch_notes', async () => {
    const config: GameConfig = {
      gameId: 'fake_game',
      label: 'Fake Game',
      patchNotesPath: 'fake_game/PATCH_NOTES_does_not_exist.md',
    };
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config, onClose: () => {} }));
    });
    const unavailable = container.querySelector('[data-testid="game-detail-patch-notes-unavailable"]');
    expect(unavailable).not.toBeNull();
    expect(unavailable!.textContent).toContain('unavailable');
    // Never a fabricated content block alongside the honest failure state.
    const content = container.querySelector('[data-testid="game-detail-patch-notes-content"]');
    expect(content).toBeNull();
    root.unmount();
  });

  it('test_detail_view_renders_real_patch_notes_content_for_succession', async () => {
    const succession = GAME_REGISTRY.find(g => g.gameId === 'succession')!;
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config: succession, onClose: () => {} }));
    });
    const content = container.querySelector('[data-testid="game-detail-patch-notes-content"]');
    expect(content).not.toBeNull();
    expect(content!.textContent).toContain('Succession');
    const unavailable = container.querySelector('[data-testid="game-detail-patch-notes-unavailable"]');
    expect(unavailable).toBeNull();
    root.unmount();
  });

  it('test_detail_view_omits_patch_notes_section_when_no_path_set', async () => {
    const config: GameConfig = { gameId: 'no_patch_notes', label: 'No Patch Notes' };
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config, onClose: () => {} }));
    });
    expect(container.querySelector('[data-testid="game-detail-patch-notes"]')).toBeNull();
    root.unmount();
  });
});

// ── last_updated genuinely pulled from game-metadata.json ────────────

describe('Arcade Metadata Expansion — last_updated sourcing', () => {
  it('test_last_updated_matches_real_game_metadata_json_value', async () => {
    const succession = GAME_REGISTRY.find(g => g.gameId === 'succession')!;
    const realValue = (gameMetadata as Record<string, { last_updated?: string }>)['succession']?.last_updated;
    expect(realValue).toBeTruthy();

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config: succession, onClose: () => {} }));
    });
    const el = container.querySelector('[data-testid="game-detail-last-updated"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toContain(realValue);
    root.unmount();
  });

  it('test_last_updated_absent_for_a_game_with_no_metadata_entry', async () => {
    // gladiator_arena has a real GameConfig but no game-metadata.json
    // entry (not in GAME_PATHS on the Python side) — the detail view
    // must degrade honestly, not fabricate a date.
    const gladiator = GAME_REGISTRY.find(g => g.gameId === 'gladiator_arena')!;
    expect((gameMetadata as Record<string, unknown>)['gladiator_arena']).toBeUndefined();

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config: gladiator, onClose: () => {} }));
    });
    expect(container.querySelector('[data-testid="game-detail-last-updated"]')).toBeNull();
    root.unmount();
  });
});

// ── Genre/tags render honestly, no fabricated placeholders ───────────

describe('Arcade Metadata Expansion — genre/tags honest rendering', () => {
  it('test_genre_and_tags_render_when_present', async () => {
    const succession = GAME_REGISTRY.find(g => g.gameId === 'succession')!;
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config: succession, onClose: () => {} }));
    });
    const genreTags = container.querySelector('[data-testid="game-detail-genre-tags"]');
    expect(genreTags).not.toBeNull();
    expect(genreTags!.textContent).toContain('Narrative/Persuasion');
    root.unmount();
  });

  it('test_no_fabricated_genre_tags_section_when_absent', async () => {
    // shoal genuinely has no `genre` set (real taxonomy gap) — the
    // section must not render a fabricated placeholder in its place.
    const shoal = GAME_REGISTRY.find(g => g.gameId === 'shoal')!;
    expect(shoal.genre).toBeUndefined();
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config: shoal, onClose: () => {} }));
    });
    // shoal does have tags, so the section still renders — but only
    // real tag content, never a fabricated genre badge.
    const genreTags = container.querySelector('[data-testid="game-detail-genre-tags"]');
    if (genreTags) {
      expect(genreTags.textContent).not.toMatch(/undefined|null|placeholder/i);
    }
    root.unmount();
  });

  it('test_no_genre_tags_section_when_neither_present', async () => {
    const config: GameConfig = { gameId: 'bare', label: 'Bare Game' };
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameDetailView, { config, onClose: () => {} }));
    });
    expect(container.querySelector('[data-testid="game-detail-genre-tags"]')).toBeNull();
    root.unmount();
  });
});

// ── GameSelector card-level wiring ────────────────────────────────────

describe('Arcade Metadata Expansion — GameSelector card wiring', () => {
  it('test_card_shows_shortDescription_fallback_to_description', async () => {
    const GameSelector = (await import('../src/arcade/GameSelector')).default;
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    const successionCard = Array.from(container.querySelectorAll('.arcade-card'))
      .find(c => c.textContent?.includes('Succession'));
    expect(successionCard).toBeDefined();
    const desc = successionCard!.querySelector('.arcade-card-desc');
    expect(desc?.textContent).toBe(
      GAME_REGISTRY.find(g => g.gameId === 'succession')!.shortDescription,
    );
    root.unmount();
  });

  it('test_details_button_opens_detail_view_without_navigating', async () => {
    const GameSelector = (await import('../src/arcade/GameSelector')).default;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    const successionCard = Array.from(container.querySelectorAll('.arcade-card'))
      .find(c => c.textContent?.includes('Succession'))!;
    const detailsBtn = successionCard.querySelector('[data-testid="arcade-card-details-btn-succession"]') as HTMLButtonElement;
    expect(detailsBtn).toBeTruthy();
    await act(async () => {
      detailsBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="game-detail-view"]')).not.toBeNull();
    document.body.removeChild(container);
    root.unmount();
  });
});
