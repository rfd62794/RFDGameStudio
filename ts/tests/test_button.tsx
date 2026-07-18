import { describe, expect, it } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Button } from '../src/ui/components';

async function renderButton(element: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

describe('Button', () => {
  it('test_button_icon_only_renders', async () => {
    const { container, root } = await renderButton(
      <Button icon={<span data-testid="icon">confirm</span>} onClick={() => {}} title="Confirm" />
    );

    expect(container.querySelector('[data-testid="icon"]')?.textContent).toBe('confirm');
    expect(container.querySelector('button')?.textContent).toBe('confirm');
    expect(container.querySelector('button')?.getAttribute('title')).toBe('Confirm');
    root.unmount();
  });

  it('test_button_icon_and_label_renders_both', async () => {
    const { container, root } = await renderButton(
      <Button label="Save" icon={<span data-testid="icon">disk</span>} onClick={() => {}} />
    );

    expect(container.querySelector('[data-testid="icon"]')).toBeTruthy();
    expect(container.querySelector('button')?.textContent).toBe('diskSave');
    root.unmount();
  });

  it('test_button_existing_usages_unchanged', async () => {
    const { container, root } = await renderButton(
      <Button label="New Race" onClick={() => {}} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toBe('btn-primary');
    expect(button?.textContent).toBe('New Race');
    root.unmount();
  });

  it('test_button_className_escape_hatch', async () => {
    const { container, root } = await renderButton(
      <Button label="Assign" onClick={() => {}} variant="neutral" className="custom-worker-color" />
    );

    const button = container.querySelector('button');
    expect(button?.classList.contains('btn-neutral')).toBe(true);
    expect(button?.classList.contains('custom-worker-color')).toBe(true);
    root.unmount();
  });
});
