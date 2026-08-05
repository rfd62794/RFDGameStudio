/**
 * test_shared_fixtures.tsx — Confirms the new L1/L2 shared helpers
 * actually work correctly, not just that they exist.
 *
 * Corresponds to test anchor: test_shared_fixtures_produce_valid_starter_pairs
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { loadGame } from '../src/engine/runtime';
import { createStarter, createStarterPair, expectBridgeField, renderComponent } from './_shared';
import { slimeToLua, type SlimeColor } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

describe('Shared L1/L2 fixtures', () => {
  it('createStarter produces a valid slime with all required fields', () => {
    const slime = createStarter(session, 'Red', 'test_id_1', 'TestSlime');
    expect(slime.id).toBe('test_id_1');
    expect(slime.name).toBe('TestSlime');
    expect(slime.color).toBe('Red');
    expect(slime.stage).toBe('Hatchling');
    expect(slime.level).toBeGreaterThanOrEqual(1);
    expect(slime.diffusionRatio).toBeGreaterThan(0);
    expect(slime.vertexCount).toBeGreaterThan(0);
  });

  it('createStarterPair produces two same-color slimes with distinct ids', () => {
    const colors: SlimeColor[] = ['Red', 'Blue', 'Yellow'];
    for (const color of colors) {
      const [a, b] = createStarterPair(session, color);
      expect(a.color).toBe(color);
      expect(b.color).toBe(color);
      expect(a.id).not.toBe(b.id);
      expect(a.name).not.toBe(b.name);
    }
  });

  it('expectBridgeField correctly asserts bridge field values', () => {
    const slime = createStarter(session, 'Blue', 'bridge_test', 'BridgeTest');
    slime.diffusionRatio = 25;
    const raw = slimeToLua(slime);
    expectBridgeField(raw, 'diffusion_ratio', 25, 'Blue bridge test');
  });

  it('renderComponent mounts a React element and returns queryable container', async () => {
    const { container, root } = await renderComponent(
      React.createElement('div', { 'data-testid': 'fixture-probe' }, 'hello')
    );
    const probe = container.querySelector('[data-testid="fixture-probe"]');
    expect(probe).not.toBeNull();
    expect(probe!.textContent).toBe('hello');
    root.unmount();
  });
});
