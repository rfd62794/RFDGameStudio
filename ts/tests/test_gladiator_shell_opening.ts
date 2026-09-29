import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const appSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/gladiator_arena/App.tsx'),
  'utf-8'
);
const primerSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/gladiator_arena/components/ManagerPrimer.tsx'),
  'utf-8'
);
const combatSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/gladiator_arena/components/ArenaCombatView.tsx'),
  'utf-8'
);

describe('test_gameshell_wraps_all_states', () => {
  it('GameShell is imported in App.tsx', () => {
    expect(appSource).toContain("import { GameShell }");
  });

  it('Title screen render state is wrapped in GameShell', () => {
    const titleBlock = appSource.match(/if \(showTitleScreen\)[\s\S]*?return \(\s*<GameShell/);
    expect(titleBlock).toBeTruthy();
  });

  it('Primer render state is wrapped in GameShell', () => {
    const primerBlock = appSource.match(/if \(showPrimer\)[\s\S]*?return \(\s*<GameShell/);
    expect(primerBlock).toBeTruthy();
  });

  it('Main game render state is wrapped in GameShell', () => {
    const mainReturn = appSource.match(/return \(\s*<>[\s\S]*?<GameShell[\s\S]*?RosterView/);
    expect(mainReturn).toBeTruthy();
  });
});

describe('test_titlescreen_present', () => {
  it('TitleScreen is imported in App.tsx', () => {
    expect(appSource).toContain('TitleScreen');
    expect(appSource).toContain("from '../../ui/components/TitleScreen'");
  });

  it('TitleScreen renders before the primer gate', () => {
    const titleIndex = appSource.indexOf('if (showTitleScreen)');
    const primerIndex = appSource.indexOf('if (showPrimer)');
    expect(titleIndex).toBeGreaterThan(-1);
    expect(primerIndex).toBeGreaterThan(-1);
    expect(titleIndex).toBeLessThan(primerIndex);
  });

  it('TitleScreen has real content (title, tagline, pitch)', () => {
    expect(appSource).toContain('title="Gladiator Arena"');
    expect(appSource).toContain('tagline=');
    expect(appSource).toContain('pitch=');
  });

  it('TitleScreen orients the stable (frames, gold, record, tier)', () => {
    expect(appSource).toContain('roster.length');
    expect(appSource).toContain('gold');
    expect(appSource).toContain('wins');
    expect(appSource).toContain('losses');
    expect(appSource).toContain('currentTier.name');
  });

  it('TitleScreen has enter and primer menu items', () => {
    expect(appSource).toContain('ga-enter-arena');
    expect(appSource).toContain('ga-primer');
    expect(appSource).toContain('handleEnterArena');
    expect(appSource).toContain('handleShowPrimer');
  });
});

describe('test_primer_first_launch_only', () => {
  it('ManagerPrimer is imported and rendered', () => {
    expect(appSource).toContain('ManagerPrimer');
    expect(appSource).toContain("from './components/ManagerPrimer'");
  });

  it('Uses the shared OnboardingGate hook', () => {
    expect(appSource).toContain('useOnboardingGate');
    expect(appSource).toContain("from '../../ui/components/OnboardingGate'");
  });

  it('Primer auto-fires only when no save exists', () => {
    const enterBlock = appSource.match(/handleEnterArena[\s\S]*?\}/);
    expect(enterBlock).toBeTruthy();
    expect(enterBlock![0]).toContain('if (!hasSave) triggerPrimer()');
  });

  it('Save detection reads the real storage key via shared persistence', () => {
    expect(appSource).toContain('loadSave');
    expect(appSource).toContain('STORAGE_KEY');
    expect(appSource).toContain("from '../../engine/shared/persistence'");
  });

  it('Primer covers the real loop: recruit, equip, fight, anatomy, repair', () => {
    expect(primerSource).toContain('Recruit');
    expect(primerSource).toContain('Forge');
    expect(primerSource).toContain('Arena Bouts');
    expect(primerSource).toContain('scar');
    expect(primerSource).toContain('Medbay');
  });

  it('Primer has a completion affordance wired to the gate', () => {
    expect(primerSource).toContain('onComplete');
    expect(primerSource).toContain('ga-primer-complete');
    expect(appSource).toContain('completePrimer');
  });
});

describe('test_combat_hud_readability', () => {
  it('Turn order indicator surfaces currentTurnActor', () => {
    expect(combatSource).toContain('currentTurnActor');
    expect(combatSource).toContain('Up Next:');
  });

  it('Per-side integrity and wound chips exist', () => {
    expect(combatSource).toContain('Integrity');
    expect(combatSource).toContain('Crippled');
    expect(combatSource).toContain('Scarred');
    expect(combatSource).toContain('totalScars');
  });
});

describe('test_no_regression', () => {
  it('Local sound engine still used (reference implementation)', () => {
    expect(appSource).toContain("from './utils/soundEffects'");
    expect(appSource).toContain('sound.isSoundEnabled');
    expect(appSource).toContain('toggleSound');
  });

  it('Combat view keeps existing animation and log systems', () => {
    expect(combatSource).toContain('StickFighter');
    expect(combatSource).toContain('logContainerRef');
    expect(combatSource).toContain('crowdFavor');
  });

  it('Reset flow still present', () => {
    expect(appSource).toContain('resetGame');
    expect(appSource).toContain('showResetConfirm');
  });
});
