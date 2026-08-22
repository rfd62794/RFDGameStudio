import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { nextExpandedApproach, ApproachId } from '../src/games/succession/utils/approachDisclosure';

const APP_TSX_PATH = resolve(__dirname, '../src/games/succession/App.tsx');
const appSource = readFileSync(APP_TSX_PATH, 'utf-8');

// ADR-006 §1: GameShell adoption. Structural checks against the real
// App.tsx source — not a rendered snapshot — confirming the actual
// wiring the directive requires, matching its own "structural check,
// not a snapshot test" instruction.
describe('GameShell adoption (ADR-006)', () => {
  it('imports GameShell from the shared components module', () => {
    expect(appSource).toMatch(/import\s*\{\s*GameShell\s*\}\s*from\s*'\.\.\/\.\.\/components'/);
  });

  it('renders every real view (title, verdict, playing) through GameShell, not a hand-rolled root div', () => {
    const gameShellOpenTags = appSource.match(/<GameShell\b/g) || [];
    // One real branch per view: title, verdict, playing.
    expect(gameShellOpenTags.length).toBe(3);

    // The old hand-rolled root (`min-h-screen ... flex flex-col`) must
    // no longer be the outermost returned element for the playing view.
    expect(appSource).not.toMatch(/return\s*\(\s*<div className="min-h-screen/);
  });

  it('applies mainClassName="game-shell-main--scrollable" on every GameShell usage — the real fix for the arcade-shell overflow:hidden clipping bug', () => {
    const gameShellBlocks = appSource.split('<GameShell').slice(1);
    expect(gameShellBlocks.length).toBe(3);
    for (const block of gameShellBlocks) {
      // The opening tag's props end at the first line consisting only
      // of ">" (the JSX children start after it) — safer than the
      // first raw ">" in the block, which can appear inside a nested
      // element's props (e.g. statusArea={<SegmentHeader ... />}).
      const propsSection = block.slice(0, block.indexOf('\n    >'));
      expect(propsSection).toContain('mainClassName="game-shell-main--scrollable"');
    }
  });

  it('does not leave a hand-rolled arcade-level back button in App.tsx (GameShell owns that single back button)', () => {
    expect(appSource).not.toMatch(/Back to (Grand )?Arcade/);
    // AudienceStage's own "Step Back to Grand Chamber" is real in-game
    // navigation (Audience -> Chamber, a PlayStage transition), not
    // arcade-level shell chrome, so its wiring (onBackToChamber) is
    // expected to remain in App.tsx — distinct from GameShell's
    // arcade-back link, which is what this test guards against duplicating.
    expect(appSource).toContain('onBackToChamber={() => setPlayStage(\'chamber\')}');
    expect(readFileSync(resolve(__dirname, '../src/games/succession/components/AudienceStage.tsx'), 'utf-8')).toContain(
      'Step Back to Grand Chamber'
    );
  });
});

// ADR-006 §2: Progressive disclosure. Real state-transition tests
// against nextExpandedApproach — the exact function AudienceStage.tsx
// calls from toggleApproach — not a reimplementation, and not merely
// checking that each panel can independently render when told to.
describe('AudienceStage progressive disclosure (ADR-006)', () => {
  it('starts with nothing expanded (collapsed by default)', () => {
    // AudienceStage initializes useState<ApproachId | null>(null) —
    // verified directly against the real component source since this
    // is the initial value, not a transition nextExpandedApproach can
    // express on its own.
    const audienceSource = readFileSync(
      resolve(__dirname, '../src/games/succession/components/AudienceStage.tsx'),
      'utf-8'
    );
    expect(audienceSource).toMatch(/useState<ApproachId \| null>\(null\)/);
  });

  it('selecting a second approach collapses the first — never both expanded at once', () => {
    let expanded: ApproachId | null = null;
    expanded = nextExpandedApproach(expanded, 'whisper');
    expect(expanded).toBe('whisper');

    // Real regression this guards: an accidental Set<ApproachId>-based
    // implementation would allow 'whisper' to remain expanded alongside
    // 'evidence'. This proves the real transition replaces, not adds.
    expanded = nextExpandedApproach(expanded, 'evidence');
    expect(expanded).toBe('evidence');
    expect(expanded).not.toBe('whisper');
  });

  it('re-selecting the currently expanded approach collapses it back to none, and the invariant holds across a full 5-approach sequence', () => {
    const sequence: ApproachId[] = ['whisper', 'appeal', 'evidence', 'indictment', 'discredit'];
    let expanded: ApproachId | null = null;

    for (const approach of sequence) {
      expanded = nextExpandedApproach(expanded, approach);
      // Invariant: after every real selection, exactly the just-selected
      // approach is expanded — never a second one lingering from before.
      expect(expanded).toBe(approach);
    }

    // Re-selecting the last-expanded approach collapses to none.
    expanded = nextExpandedApproach(expanded, 'discredit');
    expect(expanded).toBeNull();
  });
});
