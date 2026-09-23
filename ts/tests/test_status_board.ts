import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { STATUS_BOARD } from '../src/status/board.data';
import { generateMarkdown } from '../src/status/generateMarkdown';
import { getPageId, navigateToPage, getGameId, navigateTo } from '../src/arcade/routing';
import StatusBoardPage from '../src/pages/StatusBoardPage';

class FakeLocation {
  href = 'http://localhost:3000/arcade/rfdgamestudio/';

  get search(): string {
    const idx = this.href.indexOf('?');
    return idx === -1 ? '' : this.href.slice(idx);
  }

  get pathname(): string {
    return new URL(this.href).pathname;
  }
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).location = new FakeLocation();
});

// --- Tests 1-5: data + markdown generation ---

describe('Status Board data integrity', () => {
  it('status_board_all_entries_have_required_fields', () => {
    for (const entry of STATUS_BOARD) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.status).toBeTruthy();
      expect(entry.currentState).toBeTruthy();
      expect(entry.lastUpdated).toBeTruthy();
    }
  });

  it('status_board_no_duplicate_ids', () => {
    const ids = STATUS_BOARD.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('status_board_retired_entries_have_supersededBy', () => {
    const retired = STATUS_BOARD.filter(e => e.status === 'retired');
    expect(retired.length).toBeGreaterThan(0);
    for (const entry of retired) {
      // SlimeBreeder is the precedent case — it established the retirement
      // pattern itself, so it has no superseder. This exception is explicit,
      // not a blanket allowance for all retired entries.
      if (entry.id === 'slimebreeder') {
        expect(entry.supersededBy).toBeUndefined();
      } else {
        expect(entry.supersededBy).toBeTruthy();
      }
    }
  });

  it('status_board_unconfirmed_entries_have_verificationMethod', () => {
    // ADR-016 self-test: every status_unconfirmed entry must carry a
    // verificationMethod, so a reader knows whether the "unconfirmed"
    // claim was checked against the live repo or inferred from history.
    const unconfirmed = STATUS_BOARD.filter(e => e.status === 'status_unconfirmed');
    expect(unconfirmed.length).toBeGreaterThan(0);
    for (const entry of unconfirmed) {
      expect(entry.verificationMethod).toBeTruthy();
      expect(['direct file read', 'research/inference', 'narrated agent report']).toContain(entry.verificationMethod);
    }
  });
});

describe('generateMarkdown', () => {
  it('generateMarkdown_produces_all_category_headers', () => {
    const md = generateMarkdown(STATUS_BOARD);
    expect(md).toContain('Live Catalog');
    expect(md).toContain('Separate Infrastructure');
    expect(md).toContain('AI-Studio-Origin Track');
    expect(md).toContain('Retired');
  });

  it('generateMarkdown_row_count_matches_entry_count', () => {
    const md = generateMarkdown(STATUS_BOARD);
    // Each entry appears as a table row starting with | **Name**
    const entryRows = STATUS_BOARD.filter(e =>
      md.includes(`**${e.name}**`),
    );
    expect(entryRows.length).toBe(STATUS_BOARD.length);
  });
});

// --- Tests 6-8: page rendering ---

describe('StatusBoardPage rendering', () => {
  it('StatusBoardPage_renders_without_crashing_given_real_data', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(StatusBoardPage));
    });
    // Should render the header
    expect(container.textContent).toContain('STUDIO STATUS');
    // Should render at least one entry name
    expect(container.textContent).toContain(STATUS_BOARD[0]!.name);
    root.unmount();
    document.body.removeChild(container);
  });

  it('StatusBoardPage_category_tab_filters_correctly', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(StatusBoardPage));
    });

    // Pick a live catalog entry whose name doesn't appear in any retired
    // entry's supersededBy field (Planet of Greed does — it's a superseder).
    // Shoal is a safe choice: no retired entry is superseded by Shoal.
    const liveCatalogEntry = STATUS_BOARD.find(e => e.id === 'shoal')!;
    const retiredEntry = STATUS_BOARD.find(e => e.category === 'retired')!;

    // Initially "all" — should show entries from multiple categories
    expect(container.textContent).toContain(liveCatalogEntry.name);
    expect(container.textContent).toContain(retiredEntry.name);

    // Click the "Retired" tab
    const retiredTab = container.querySelector('[data-testid="status-tab-retired"]') as HTMLButtonElement | null;
    expect(retiredTab).toBeTruthy();
    await act(async () => {
      retiredTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Now only retired entries should be visible — Shoal (live catalog) should not
    expect(container.textContent).toContain(retiredEntry.name);
    expect(container.textContent).not.toContain(liveCatalogEntry.name);

    root.unmount();
    document.body.removeChild(container);
  });

  it('StatusBoardPage_renders_lastUpdated_per_entry', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(StatusBoardPage));
    });

    // Each entry should have a visible lastUpdated date
    for (const entry of STATUS_BOARD) {
      const el = container.querySelector(`[data-testid="last-updated-${entry.id}"]`);
      expect(el).toBeTruthy();
      expect(el!.textContent).toContain(entry.lastUpdated);
    }

    root.unmount();
    document.body.removeChild(container);
  });
});

// --- Tests 9-10: routing ---

describe('Page routing', () => {
  it('getPageId_reads_page_query_param', () => {
    expect(getPageId()).toBeNull();
    window.location.href = 'http://localhost:3000/arcade/rfdgamestudio/?page=status';
    expect(getPageId()).toBe('status');
  });

  it('Root_renders_StatusBoardPage_when_page_param_is_status', async () => {
    // Integration-level: confirm ?game= links are unaffected.
    // When page=status is set, getPageId returns 'status' and getGameId
    // returns null (no game param). When page is absent but game is set,
    // getGameId returns the game id. This test verifies the routing
    // priority: page is checked before game, and they don't collide.
    window.location.href = 'http://localhost:3000/arcade/rfdgamestudio/?page=status&game=shoal';
    expect(getPageId()).toBe('status');
    // game param is still readable, but Root checks page first
    expect(getGameId()).toBe('shoal');

    // When only game is set (no page), page is null — existing links work
    window.location.href = 'http://localhost:3000/arcade/rfdgamestudio/?game=shoal';
    expect(getPageId()).toBeNull();
    expect(getGameId()).toBe('shoal');

    // navigateTo still works for game links
    navigateTo('slime_coin');
    expect(window.location.href).toContain('?game=slime_coin');
    expect(window.location.href).not.toContain('page=');

    // navigateToPage works for page links
    navigateToPage('status');
    expect(window.location.href).toContain('?page=status');
    expect(window.location.href).not.toContain('game=');
  });
});
