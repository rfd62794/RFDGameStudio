import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import type { GameConfig } from '../src/engine/types';
import gameMetadata from '../src/games/game-metadata.json';

const GAME_METADATA = gameMetadata as Record<string, { last_updated?: string }>;

// ── Registry mock harness ─────────────────────────────────────────────
// GAME_REGISTRY is a getter-only ESM export, so we mock the module
// with a mutable backing array that each test populates with the
// controlled configs it wants to assert against. The real GameSelector
// imports GAME_REGISTRY from this mocked module, so it sees exactly
// the configs the test installs — no dependence on the live catalog's
// evolving contents.

let mockRegistry: GameConfig[] = [];

vi.mock('../src/games/registry', () => ({
  get GAME_REGISTRY(): GameConfig[] {
    return mockRegistry;
  },
  findGame: (id: string) => mockRegistry.find(g => g.gameId === id),
}));

// Import after mock is registered so GameSelector picks up the mock.
const GameSelector = (await import('../src/arcade/GameSelector')).default;
const { GAME_REGISTRY } = await import('../src/games/registry');

// ── matchMedia harness ────────────────────────────────────────────────
// jsdom does not implement matchMedia by default, so useHoverCapable
// treats the environment as touch-only (returns false) — the real,
// accessible default. These tests install a real matchMedia mock to
// drive the hover-capable path where needed, and restore the
// touch-only default otherwise.

type Mql = { matches: boolean; addEventListener: () => void; removeEventListener: () => void };
let realMatchMedia: typeof window.matchMedia | undefined;
let hoverMatches = false;

function installMatchMedia(matches: boolean): void {
  hoverMatches = matches;
  realMatchMedia = window.matchMedia;
  window.matchMedia = ((query: string): Mql => ({
    matches: query === '(hover: hover)' ? hoverMatches : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

function restoreMatchMedia(): void {
  if (realMatchMedia !== undefined) {
    window.matchMedia = realMatchMedia;
  } else {
    delete (window as { matchMedia?: typeof window.matchMedia }).matchMedia;
  }
}

async function renderGameSelector(): Promise<{
  container: HTMLElement;
  root: ReturnType<typeof createRoot>;
  cleanup: () => void;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(GameSelector));
  });
  return {
    container,
    root,
    cleanup: () => {
      document.body.removeChild(container);
      root.unmount();
    },
  };
}

const fullConfig: GameConfig = {
  gameId: 'preview_full',
  label: 'Preview Full',
  description: 'legacy description',
  shortDescription: 'card-length short description',
  genre: 'combat-arena',
  tags: ['real-tag-a', 'real-tag-b'],
};

const noShortConfig: GameConfig = {
  gameId: 'preview_no_short',
  label: 'Preview No Short',
  description: 'the only description available',
};

const noGenreTagsConfig: GameConfig = {
  gameId: 'preview_no_genre_tags',
  label: 'Preview No Genre Tags',
  description: 'has a description but no genre or tags',
  shortDescription: 'short only',
};

describe('Arcade Hover Preview', () => {
  beforeEach(() => {
    mockRegistry = [];
    restoreMatchMedia();
  });
  afterEach(() => {
    mockRegistry = [];
    restoreMatchMedia();
    vi.restoreAllMocks();
  });

  // ── §3 anchor 1: shortDescription fallback to description ──────────

  it('test_preview_shows_shortDescription_when_present', async () => {
    installMatchMedia(false); // touch mode — preview is toggleable
    mockRegistry = [fullConfig];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_full"]',
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const desc = container.querySelector(
      '[data-testid="arcade-card-preview-desc-preview_full"]',
    );
    expect(desc?.textContent).toBe('card-length short description');
    cleanup();
  });

  it('test_preview_falls_back_to_description_when_shortDescription_absent', async () => {
    installMatchMedia(false);
    mockRegistry = [noShortConfig];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_no_short"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const desc = container.querySelector(
      '[data-testid="arcade-card-preview-desc-preview_no_short"]',
    );
    // Real fallback: shortDescription absent → description is shown,
    // never an empty string or fabricated placeholder.
    expect(desc?.textContent).toBe('the only description available');
    cleanup();
  });

  // ── §3 anchor 2: genre/tags render when present, degrade honestly ──

  it('test_preview_renders_genre_and_tags_when_present', async () => {
    installMatchMedia(false);
    mockRegistry = [fullConfig];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_full"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const tags = container.querySelector(
      '[data-testid="arcade-card-preview-tags-preview_full"]',
    );
    expect(tags).toBeTruthy();
    // Genre label resolved via GENRE_LABELS (combat-arena → Combat Arena).
    expect(tags?.textContent).toContain('Combat Arena');
    expect(tags?.textContent).toContain('real-tag-a');
    expect(tags?.textContent).toContain('real-tag-b');
    cleanup();
  });

  it('test_preview_degrades_honestly_when_genre_and_tags_absent', async () => {
    installMatchMedia(false);
    mockRegistry = [noGenreTagsConfig];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_no_genre_tags"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // No fabricated tags/genre section — the block is omitted entirely.
    const tags = container.querySelector(
      '[data-testid="arcade-card-preview-tags-preview_no_genre_tags"]',
    );
    expect(tags).toBeNull();
    // The description is still shown — no placeholder pretending the
    // missing fields have content.
    const desc = container.querySelector(
      '[data-testid="arcade-card-preview-desc-preview_no_genre_tags"]',
    );
    expect(desc?.textContent).toBe('short only');
    expect(desc?.textContent).not.toMatch(/undefined|null|placeholder/i);
    cleanup();
  });

  // ── §3 anchor 3: last_updated genuinely pulled from game-metadata.json ──

  it('test_preview_last_updated_pulled_from_real_metadata_for_succession', async () => {
    installMatchMedia(false);
    // Use the real succession config from the live registry (imported
    // via the un-mocked path is not possible here, so reconstruct from
    // the real GAME_REGISTRY re-export we grabbed at load time). The
    // real last_updated value comes from game-metadata.json, which is
    // imported directly above — not mocked.
    const succession = GAME_REGISTRY.find(g => g.gameId === 'succession');
    // If the live registry isn't available under the mock, fall back to
    // a config that carries succession's gameId so the metadata lookup
    // resolves against the real game-metadata.json.
    const config: GameConfig =
      succession ??
      ({
        gameId: 'succession',
        label: 'Succession',
        description: 'succession',
        shortDescription: 'succession short',
        genre: 'narrative-persuasion',
        tags: ['succession-tag'],
      } as GameConfig);
    const realValue = GAME_METADATA['succession']?.last_updated;
    expect(realValue).toBeTruthy();
    mockRegistry = [config];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-succession"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const updated = container.querySelector(
      '[data-testid="arcade-card-preview-updated-succession"]',
    );
    expect(updated).toBeTruthy();
    // Real date prefix (YYYY-MM-DD) sourced from game-metadata.json.
    expect(updated?.textContent).toContain(realValue!.slice(0, 10));
    cleanup();
  });

  it('test_preview_omits_last_updated_when_no_metadata_entry', async () => {
    installMatchMedia(false);
    // Synthetic gameId with no game-metadata.json entry — the date
    // block must be omitted, never fabricated.
    const untracked: GameConfig = {
      gameId: 'preview_untracked_no_meta',
      label: 'Untracked',
      description: 'no metadata entry',
    };
    expect(GAME_METADATA['preview_untracked_no_meta']).toBeUndefined();
    mockRegistry = [untracked];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_untracked_no_meta"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      container.querySelector(
        '[data-testid="arcade-card-preview-updated-preview_untracked_no_meta"]',
      ),
    ).toBeNull();
    cleanup();
  });

  // ── §3 anchor 4 (REQUIRED): touch-device tap-to-reveal path works ──

  it('test_touch_device_renders_preview_toggle_button_not_hover_only', async () => {
    // Real touch device: matchMedia('(hover: hover)') does NOT match.
    installMatchMedia(false);
    mockRegistry = [fullConfig];
    const { container, cleanup } = await renderGameSelector();
    // The real "Preview" toggle button must be present on touch —
    // hover-only would leave no way to reach the preview content.
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_full"]',
    );
    expect(toggle).toBeTruthy();
    cleanup();
  });

  it('test_touch_tap_opens_preview_with_same_content_as_hover_would_show', async () => {
    installMatchMedia(false);
    mockRegistry = [fullConfig];
    const { container, cleanup } = await renderGameSelector();
    const preview = container.querySelector(
      '[data-testid="arcade-card-preview-preview_full"]',
    );
    // Before tap: preview is rendered but not marked open.
    expect(preview?.classList.contains('arcade-card-preview--open')).toBe(false);
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_full"]',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // After tap: same real content (desc + genre + tags) is reachable.
    const openPreview = container.querySelector(
      '[data-testid="arcade-card-preview-preview_full"]',
    );
    expect(openPreview?.classList.contains('arcade-card-preview--open')).toBe(true);
    expect(
      container.querySelector('[data-testid="arcade-card-preview-desc-preview_full"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="arcade-card-preview-tags-preview_full"]'),
    ).toBeTruthy();
    // aria-expanded reflects the real toggled state.
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    cleanup();
  });

  it('test_touch_tap_again_closes_preview', async () => {
    installMatchMedia(false);
    mockRegistry = [fullConfig];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_full"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      container
        .querySelector('[data-testid="arcade-card-preview-preview_full"]')
        ?.classList.contains('arcade-card-preview--open'),
    ).toBe(true);
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      container
        .querySelector('[data-testid="arcade-card-preview-preview_full"]')
        ?.classList.contains('arcade-card-preview--open'),
    ).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    cleanup();
  });

  it('test_touch_preview_toggle_does_not_navigate_the_card', async () => {
    installMatchMedia(false);
    mockRegistry = [fullConfig];
    const routing = await import('../src/arcade/routing');
    const navigateTo = vi.spyOn(routing, 'navigateTo');
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_full"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // stopPropagation on the toggle must prevent the card's onClick
    // navigation handler from firing — the tap reveals the preview,
    // it doesn't launch the game.
    expect(navigateTo).not.toHaveBeenCalled();
    cleanup();
  });

  it('test_hover_capable_device_omits_touch_toggle_button', async () => {
    // Real desktop: matchMedia('(hover: hover)') matches → the touch
    // fallback button must NOT be rendered (the CSS :hover path is
    // the real interaction instead).
    installMatchMedia(true);
    mockRegistry = [fullConfig];
    const { container, cleanup } = await renderGameSelector();
    expect(
      container.querySelector(
        '[data-testid="arcade-card-preview-toggle-preview_full"]',
      ),
    ).toBeNull();
    // The preview surface itself is still present in the DOM (CSS
    // controls its visibility on hover), with the same real content.
    expect(
      container.querySelector('[data-testid="arcade-card-preview-preview_full"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="arcade-card-preview-desc-preview_full"]'),
    ).toBeTruthy();
    cleanup();
  });

  // ── Regression: hover preview must not block click-through ─────────
  // Real bug, found live on localhost: the preview overlay is a
  // position:absolute, inset:0 full-card layer once revealed on hover
  // (base.css .arcade-card-preview). It previously carried
  // onClick={(e) => e.stopPropagation()}, which swallowed every click
  // on the card while hovering -- the card was visually there but
  // functionally unclickable. This test simulates the real hover-
  // capable desktop path (matchMedia hover:hover matches) and clicks
  // directly on the preview surface itself, since that is the exact
  // element a hovering user's click actually lands on.

  it('test_clicking_preview_surface_on_hover_capable_device_navigates_to_game', async () => {
    installMatchMedia(true); // real desktop: CSS :hover path, no toggle button
    mockRegistry = [fullConfig];
    const routing = await import('../src/arcade/routing');
    const navigateTo = vi.spyOn(routing, 'navigateTo');
    const { container, cleanup } = await renderGameSelector();
    const preview = container.querySelector(
      '[data-testid="arcade-card-preview-preview_full"]',
    ) as HTMLElement;
    expect(preview).toBeTruthy();
    await act(async () => {
      preview.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // The click must bubble up to the card's own onClick handler and
    // actually navigate -- not get swallowed by the preview overlay.
    expect(navigateTo).toHaveBeenCalledWith('preview_full');
    cleanup();
  });
  // ── Honest-degradation guard: no fabricated content anywhere ───────

  it('test_no_fabricated_placeholder_content_for_any_missing_field', async () => {
    installMatchMedia(false);
    const bare: GameConfig = {
      gameId: 'preview_bare',
      label: 'Bare',
      // No shortDescription, no description, no genre, no tags.
    };
    mockRegistry = [bare];
    const { container, cleanup } = await renderGameSelector();
    const toggle = container.querySelector(
      '[data-testid="arcade-card-preview-toggle-preview_bare"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const preview = container.querySelector(
      '[data-testid="arcade-card-preview-preview_bare"]',
    );
    expect(preview).toBeTruthy();
    // No tags/genre block, no updated block, and the desc is empty —
    // never a placeholder string standing in for missing data.
    expect(
      container.querySelector('[data-testid="arcade-card-preview-tags-preview_bare"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="arcade-card-preview-updated-preview_bare"]'),
    ).toBeNull();
    const desc = container.querySelector(
      '[data-testid="arcade-card-preview-desc-preview_bare"]',
    );
    expect(desc?.textContent).toBe('');
    expect(preview?.textContent).not.toMatch(/undefined|null|placeholder|n\/a|tbd/i);
    cleanup();
  });
});
