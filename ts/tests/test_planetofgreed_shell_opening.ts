import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const appSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'),
  'utf-8'
);
const openingSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/components/OpeningSequence.tsx'),
  'utf-8'
);

describe('test_gameshell_wraps_all_states', () => {
  it('GameShell is imported in App.tsx', () => {
    expect(appSource).toContain("import { GameShell }");
    expect(appSource).toContain("from '../../components/GameShell'");
  });

  it('Title screen render state is wrapped in GameShell', () => {
    // The title screen return block contains GameShell
    expect(appSource).toContain('showTitleScreen');
    // Find the title screen block and verify it wraps in GameShell
    const titleBlock = appSource.match(/if \(showTitleScreen\)[\s\S]*?return \(\s*<GameShell/);
    expect(titleBlock).toBeTruthy();
  });

  it('Opening sequence render state is wrapped in GameShell', () => {
    const openingBlock = appSource.match(/if \(showOpeningSequence\)[\s\S]*?return \(\s*<GameShell/);
    expect(openingBlock).toBeTruthy();
  });

  it('Culture selection render state is wrapped in GameShell', () => {
    const cultureBlock = appSource.match(/if \(pendingCultureSelection\)[\s\S]*?return \(\s*<GameShell/);
    expect(cultureBlock).toBeTruthy();
  });

  it('Loading state is wrapped in GameShell', () => {
    const loadingBlock = appSource.match(/if \(!gameState\)[\s\S]*?return \(\s*<GameShell/);
    expect(loadingBlock).toBeTruthy();
  });

  it('Main game render state is wrapped in GameShell', () => {
    // The main return (after all early returns) wraps in GameShell
    // Find the last return statement that contains the BoardroomHeader
    const mainReturn = appSource.match(/return \(\s*<GameShell[\s\S]*?BoardroomHeader/);
    expect(mainReturn).toBeTruthy();
  });

  it('back-to-lobby button is present via GameShell (not a custom button)', () => {
    // GameShell renders the back button — confirm no custom back button
    // was added that would duplicate or replace it
    expect(appSource).not.toContain('navigateHome');
    // GameShell is the only place the back button lives
    expect(appSource).toContain('GameShell');
  });
});

describe('test_titlescreen_present', () => {
  it('TitleScreen is imported in App.tsx', () => {
    expect(appSource).toContain("TitleScreen");
    expect(appSource).toContain("from '../../ui/components/TitleScreen'");
  });

  it('TitleScreen renders before culture selection', () => {
    // The title screen check comes before the pendingCultureSelection check
    const titleIndex = appSource.indexOf('if (showTitleScreen)');
    const cultureIndex = appSource.indexOf('if (pendingCultureSelection)');
    expect(titleIndex).toBeGreaterThan(-1);
    expect(cultureIndex).toBeGreaterThan(-1);
    expect(titleIndex).toBeLessThan(cultureIndex);
  });

  it('TitleScreen has real content (title, tagline, pitch)', () => {
    expect(appSource).toContain('title="Planet of Greed"');
    expect(appSource).toContain('tagline=');
    expect(appSource).toContain('pitch=');
  });

  it('TitleScreen has New Campaign and Continue menu items', () => {
    expect(appSource).toContain('New Campaign');
    expect(appSource).toContain('Continue');
    expect(appSource).toContain('handleTitleNewGame');
    expect(appSource).toContain('handleTitleContinue');
  });
});

describe('test_opening_sequence_new_game_only', () => {
  it('OpeningSequence is imported and rendered', () => {
    expect(appSource).toContain("OpeningSequence");
    expect(appSource).toContain("from './components/OpeningSequence'");
  });

  it('showOpeningSequence is set to true on new game (handleTitleNewGame)', () => {
    // The new-game path sets showOpeningSequence=true
    const newGameBlock = appSource.match(/handleTitleNewGame[\s\S]*?setShowOpeningSequence\(true\)/);
    expect(newGameBlock).toBeTruthy();
  });

  it('showOpeningSequence is set to false on continue (handleTitleContinue)', () => {
    // The continue path sets showOpeningSequence=false
    const continueBlock = appSource.match(/handleTitleContinue[\s\S]*?setShowOpeningSequence\(false\)/);
    expect(continueBlock).toBeTruthy();
  });

  it('showOpeningSequence is set to false on resume from localStorage', () => {
    // When loading a saved game, the opening sequence is skipped
    const resumeBlock = appSource.match(/setGameState\(rehydrateState[\s\S]*?setShowOpeningSequence\(false\)/);
    expect(resumeBlock).toBeTruthy();
  });

  it('showOpeningSequence is set to false on reset (handleRequestNewGame)', () => {
    // Reset does NOT trigger the opening — it goes straight to culture selection
    const resetBlock = appSource.match(/handleRequestNewGame[\s\S]*?setShowOpeningSequence\(false\)/);
    expect(resetBlock).toBeTruthy();
  });

  it('OpeningSequence has a skip button (matches KingMaker pattern)', () => {
    expect(openingSource).toContain('Skip');
    expect(openingSource).toContain('onComplete');
    expect(openingSource).toContain('data-testid="pog-skip-opening"');
  });

  it('OpeningSequence calls onComplete when finished', () => {
    expect(appSource).toContain('handleOpeningComplete');
    // handleOpeningComplete clears the opening and proceeds to culture selection
    const completeBlock = appSource.match(/handleOpeningComplete[\s\S]*?setShowOpeningSequence\(false\)[\s\S]*?setPendingCultureSelection\(true\)/);
    expect(completeBlock).toBeTruthy();
  });
});

describe('test_opening_sequence_content_grounded', () => {
  it('Beat 1 covers Genesis Ore (locked narrative)', () => {
    expect(openingSource).toContain('Genesis Ore');
    expect(openingSource).toContain('Seed Engine');
    expect(openingSource).toContain('data-testid="pog-opening-beat-ore"');
  });

  it('Beat 2 covers the six Houses with real descriptions', () => {
    expect(openingSource).toContain('HOUSE_DESCRIPTIONS');
    expect(openingSource).toContain('data-testid="pog-opening-beat-wheel"');
    // All six cultures should be referenced via the descriptions
    expect(openingSource).toContain('Object.entries(HOUSE_DESCRIPTIONS)');
  });

  it('Beat 3 covers the wheel-locked rival placement', () => {
    expect(openingSource).toContain('wheel');
    expect(openingSource).toContain('rival');
    expect(openingSource).toContain('Ember opposite Tundra');
    expect(openingSource).toContain('data-testid="pog-opening-beat-rival"');
  });

  it('Beat 4 covers the stakes (House Arrest, winning is losing)', () => {
    expect(openingSource).toContain('Rank 1');
    expect(openingSource).toContain('Engine fires');
    expect(openingSource).toContain('arrest');
    expect(openingSource).toContain('data-testid="pog-opening-beat-stakes"');
  });

  it('Signal flavor note is present in the opening', () => {
    expect(openingSource).toContain('signal anomaly');
  });

  it('Content references locked narrative elements, not generic filler', () => {
    // The opening should reference specific locked narrative elements
    expect(openingSource).toContain('Genesis Ore');
    expect(openingSource).toContain('Seed Engine');
    expect(openingSource).toContain('Fragments');
    expect(openingSource).toContain('wheel');
    // Should NOT contain generic placeholder text
    expect(openingSource).not.toContain('Lorem ipsum');
    expect(openingSource).not.toContain('placeholder');
  });

  it('Beat count is 4 (justified against KingMaker 5 / Dissonance 1)', () => {
    expect(openingSource).toContain("'ore'");
    expect(openingSource).toContain("'wheel'");
    expect(openingSource).toContain("'rival'");
    expect(openingSource).toContain("'stakes'");
    const beatCount = (openingSource.match(/data-testid="pog-opening-beat-/g) || []).length;
    expect(beatCount).toBe(4);
  });
});

describe('test_no_regression', () => {
  it('GuidedWalkthrough still imported and used', () => {
    expect(appSource).toContain('GuidedWalkthrough');
    expect(appSource).toContain('isPlanningPhase');
  });

  it('WeeklyOrdersPanel still available for non-planning inspection', () => {
    expect(appSource).toContain('WeeklyOrdersPanel');
  });

  it('ENDING_TEXT still used for ending screen', () => {
    expect(appSource).toContain('ENDING_TEXT.title');
    expect(appSource).toContain('ENDING_TEXT.body');
  });

  it('HOUSE_DESCRIPTIONS still used on culture selection', () => {
    expect(appSource).toContain('HOUSE_DESCRIPTIONS');
  });

  it('CORPWORLD branding not present', () => {
    expect(appSource).not.toContain('CORPWORLD');
    expect(appSource).not.toContain('BOOTING CORPWORLD');
  });

  it('Dark corporate identity maintained in main game', () => {
    expect(appSource).toContain('#1a1a2e');
    expect(appSource).toContain('amber-');
  });

  it('Population Balance triggers still present', () => {
    expect(appSource).toContain('applyPublicOpinionOffset');
    expect(appSource).toContain('territory * 10 + avgPublicOpinion');
  });

  it('data-testid attributes preserved for E2E tests', () => {
    expect(appSource).toContain('data-testid={`pog-culture-');
    expect(appSource).toContain('data-testid="pog-ending-placeholder"');
    // rank-display and fragment-counter are in BoardroomHeader
    const headerSource = readFileSync(
      resolve(repoRoot, 'ts/src/engine/shared/components/BoardroomHeader.tsx'),
      'utf-8'
    );
    expect(headerSource).toContain('data-testid="rank-display"');
    expect(headerSource).toContain('data-testid="fragment-counter"');
  });
});
