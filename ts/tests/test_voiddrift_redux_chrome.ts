import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * test_voiddrift_redux_chrome
 *
 * Covers the VoidDrift Redux chrome pass
 * (Revamp_VoidDriftRedux_Continue_Directive): shared TitleScreen menu
 * with a How to Play entry, the OnboardingGate first-run drift primer,
 * and the shared procedural sfx wiring incl. a mute toggle.
 * Component wiring is asserted at source level per suite convention
 * (test_shoal_chrome_polish, test_horse_racing_polish).
 */

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/voiddrift_redux/App.tsx'),
  'utf8'
);
const primerSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/voiddrift_redux/components/DriftPrimer.tsx'),
  'utf8'
);

describe('VoidDrift Redux chrome — title menu', () => {
  it('is built on the shared ui/components TitleScreen', () => {
    expect(appSource).toContain("from '../../ui/components'");
    expect(appSource).toContain('TitleScreen');
    expect(appSource).toContain('menuItems');
  });

  it('gates the sim behind a title screen', () => {
    expect(appSource).toContain("useState<'title' | 'sim'>('title')");
    expect(appSource).toContain("screen === 'title'");
    expect(appSource).toContain("setScreen('sim')");
    expect(appSource).toContain("setScreen('title')");
  });

  it('has a Start entry and a How to Play entry point', () => {
    expect(appSource).toContain("id: 'voiddrift-start-sim'");
    expect(appSource).toContain("label: 'How to Play'");
    expect(appSource).toContain('handleHowToPlay');
    expect(appSource).toContain('triggerPrimer');
  });

  it('keeps a way back to the menu from the sim', () => {
    expect(appSource).toContain('id="voiddrift-menu-btn"');
    expect(appSource).toContain('← Menu');
  });
});

describe('VoidDrift Redux chrome — first-run primer', () => {
  it('gates the primer via the shared OnboardingGate + persisted flag', () => {
    expect(appSource).toContain('useOnboardingGate');
    expect(appSource).toContain("'voiddrift_redux_tutorial_seen'");
    expect(appSource).toContain('loadSave<boolean>(TUTORIAL_SEEN_KEY)');
    expect(appSource).toContain('writeSave(TUTORIAL_SEEN_KEY, true)');
  });

  it('fires on first sim start and from the menu, not on re-entry', () => {
    expect(appSource).toContain('if (!loadSave<boolean>(TUTORIAL_SEEN_KEY)) triggerPrimer();');
  });

  it('renders 3-5 teaching lines covering the real loop', () => {
    expect(primerSource).toContain('data-testid="voiddrift-drift-primer"');
    const lineCount = (primerSource.match(/text: '/g) ?? []).length;
    expect(lineCount).toBeGreaterThanOrEqual(3);
    expect(lineCount).toBeLessThanOrEqual(5);
    expect(primerSource).toContain('Ring 1');
    expect(primerSource).toContain('Ring 2');
    expect(primerSource).toContain('fragment');
    expect(primerSource).toContain('Smelter');
  });

  it('renders as an overlay on both the title and sim screens', () => {
    expect(appSource).toContain('showPrimer ? <DriftPrimer');
    // rendered once per screen branch
    expect(appSource.match(/\{primer\}/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe('VoidDrift Redux chrome — sound', () => {
  it('uses the shared procedural sfx engine with a mute toggle', () => {
    expect(appSource).toContain("from '../../engine/shared/sfx'");
    expect(appSource).toContain('sfx.autoUnlock()');
    expect(appSource).toContain('sfx.play(');
    expect(appSource).toContain('sfx.setMuted(');
    expect(appSource).toContain('id="voiddrift-sound-toggle"');
  });
});

describe('VoidDrift Redux chrome — sim preserved', () => {
  it('keeps GameShell, the orbital canvas, and the FSM panels mounted', () => {
    expect(appSource).toContain('GameShell');
    expect(appSource).toContain('OrbitalCanvas');
    expect(appSource).toContain('FSMInspector');
    expect(appSource).toContain('SmelterPanel');
    expect(appSource).toContain('DetectionRadarPanel');
    expect(appSource).toContain('PassFailDiagnosticsModal');
  });
});
