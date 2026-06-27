import { describe, it, expect, vi } from 'vitest';

// Test hooks module exports
describe('Hooks module', () => {
  it('test_hooks_module_exports_cooldown_ticker', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useCooldownTicker).toBe('function');
  });

  it('test_hooks_module_exports_lua_call', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useLuaCall).toBe('function');
  });

  it('test_hooks_module_exports_game_loop', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useGameLoop).toBe('function');
  });

  it('test_hooks_module_exports_game_state', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useGameState).toBe('function');
  });
});

// Test components module exports
describe('Components module', () => {
  it('test_components_module_exports_tab_manager', async () => {
    const mod = await import('../src/components/index');
    expect(typeof mod.TabManager).toBe('function');
  });

  it('test_components_module_exports_game_shell', async () => {
    const mod = await import('../src/components/index');
    expect(typeof mod.GameShell).toBe('function');
  });
});
