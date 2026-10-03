import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUCCESSION_DIR = resolve(__dirname, '../src/games/succession');
const appSource = readFileSync(resolve(SUCCESSION_DIR, 'App.tsx'), 'utf-8');
const primerSource = readFileSync(
  resolve(SUCCESSION_DIR, 'components/CourtPrimer.tsx'),
  'utf-8'
);

// First-run court primer (directive: Tutorial via the shared
// OnboardingGate — same pattern as scrapcrawl's CrawlPrimer and
// slither_rogue's TutorialPrimer). Structural checks against the real
// sources, matching the established gameshell_and_disclosure style.
describe('First-run CourtPrimer via shared OnboardingGate', () => {
  it('App imports useOnboardingGate from the shared ui/components module', () => {
    expect(appSource).toMatch(
      /import\s*\{\s*useOnboardingGate\s*\}\s*from\s*'\.\.\/\.\.\/ui\/components\/OnboardingGate'/
    );
  });

  it('App uses the shared engine persistence helpers for the seen-once flag', () => {
    expect(appSource).toMatch(
      /import\s*\{\s*loadSave,\s*writeSave\s*\}\s*from\s*'\.\.\/\.\.\/engine\/shared\/persistence'/
    );
    expect(appSource).toContain("PRIMER_SEEN_STORAGE_KEY = 'succession_tutorial_seen'");
  });

  it('the gate is boolean mode and fires from handleBegin only when never onboarded', () => {
    expect(appSource).toMatch(/useOnboardingGate\(\{\s*mode:\s*'boolean',\s*initialShow:\s*false\s*\}\)/);
    expect(appSource).toMatch(/loadSave<boolean>\(PRIMER_SEEN_STORAGE_KEY\)\s*===\s*true/);
    expect(appSource).toContain('if (!hasOnboarded) triggerPrimer()');
  });

  it('completing the primer persists the flag, marks onboarded, and closes the gate', () => {
    expect(appSource).toContain('writeSave(PRIMER_SEEN_STORAGE_KEY, true)');
    expect(appSource).toContain('setHasOnboarded(true)');
    expect(appSource).toContain('completePrimer()');
  });

  it('renders CourtPrimer only while the gate says so', () => {
    expect(appSource).toContain('{showPrimer && <CourtPrimer onComplete={handlePrimerComplete} />}');
  });

  it('CourtPrimer carries stable test ids for the dialog and its complete action', () => {
    expect(primerSource).toContain('data-testid="succession-court-primer"');
    expect(primerSource).toContain('data-testid="succession-primer-complete"');
    expect(primerSource).toMatch(/onClick=\{onComplete\}/);
  });

  it('ADR-005 contextual first-use tips still fire alongside the primer — not replaced by it', () => {
    expect(appSource).toContain('import { OnboardingTip }');
    expect(appSource).toContain('determineTip(gameState, moveType, tipId)');
    expect(appSource).toContain('<OnboardingTip tip={ONBOARDING_TIPS[activeTip]}');
  });
});
