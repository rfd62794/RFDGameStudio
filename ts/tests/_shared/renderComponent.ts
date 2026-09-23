/**
 * Shared L2 test helper: renderComponent
 *
 * Formalizes the inline `async function render()` pattern already used
 * ad-hoc in 4+ component tests (test_brewfield_shared_ui, test_dissonance_shared_ui,
 * test_ui_shared_templates, test_more_games_by_me). All of those tests
 * independently defined the identical createRoot + act boilerplate.
 */
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

export interface RenderResult {
  container: HTMLDivElement;
  root: Root;
}

/**
 * Renders a React element into an in-memory DOM container via createRoot + act.
 * Returns both the container (for querySelector-based assertions) and the root
 * (for cleanup / unmount).
 */
export async function renderComponent(element: React.ReactElement): Promise<RenderResult> {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}
