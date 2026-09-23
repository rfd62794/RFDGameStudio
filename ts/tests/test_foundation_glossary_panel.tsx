import { describe, expect, it } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GlossaryPanel, glossaryPanelRequested, parseGlossary } from '../src/foundation/glossary';
import { GameShell } from '../src/components/GameShell';

async function render(el: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => { root.render(el); });
  return { container, root };
}

describe('GlossaryPanel', () => {
  it('lists_entries_with_kind_and_label', async () => {
    const result = parseGlossary('version: 1\nentries:\n  hp: { kind: stat, label: HP, bind: a }\n');
    const { container, root } = await render(<GlossaryPanel result={result} />);
    expect(container.querySelector('[data-glossary-entry="hp"]')?.textContent).toContain('HP');
    expect(container.querySelector('[data-glossary-entry="hp"]')?.textContent).toContain('stat');
    root.unmount();
  });

  it('shows_issues_in_an_error_box', async () => {
    const result = parseGlossary('version: 1\nentries:\n  bad: { kind: potion, label: X }\n');
    const { container, root } = await render(<GlossaryPanel result={result} />);
    expect(container.querySelector('.error-box')?.textContent).toContain('bad');
    root.unmount();
  });

  it('shows_a_whole_file_failure', async () => {
    const { container, root } = await render(<GlossaryPanel result={parseGlossary('version: 9\nentries: {}\n')} />);
    expect(container.querySelector('.error-box')?.textContent).toMatch(/version/);
    root.unmount();
  });
});

describe('glossaryPanelRequested', () => {
  it('reads_the_query_flag', () => {
    expect(glossaryPanelRequested('?game=dissonance&glossary')).toBe(true);
    expect(glossaryPanelRequested('?game=dissonance&glossary=1')).toBe(true);
    expect(glossaryPanelRequested('?game=dissonance')).toBe(false);
  });
});

describe('GameShell', () => {
  it('renders_no_panel_without_the_flag', async () => {
    const { container, root } = await render(<GameShell gameLabel="D" gameId="dissonance"><p>x</p></GameShell>);
    expect(container.querySelector('.glossary-panel')).toBeNull();
    root.unmount();
  });
});
