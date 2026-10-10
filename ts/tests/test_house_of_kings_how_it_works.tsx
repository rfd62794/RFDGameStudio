// @vitest-environment node
// new: ts/tests/test_house_of_kings_how_it_works.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { HowItWorks } from '../src/games/house_of_kings_collab/components/HowItWorks';
import {
  HOW_IT_WORKS_HEADING, HOW_IT_WORKS_INTRO, HOW_IT_WORKS_STEPS, HOW_IT_WORKS_NOTE,
} from '../src/games/house_of_kings_collab/howItWorks';

describe('test_house_of_kings_how_it_works', () => {
  it('renders the heading, three numbered steps and the honest note without any sign-in', () => {
    const html = renderToStaticMarkup(<HowItWorks />);
    expect(html).toContain(HOW_IT_WORKS_HEADING);
    expect(HOW_IT_WORKS_STEPS.length).toBe(3);
    for (const step of HOW_IT_WORKS_STEPS) {
      expect(html).toContain(step.title);
    }
    expect(html).toContain(HOW_IT_WORKS_NOTE);
  });

  it('copy is plain player language: no internal markers and no jargon', () => {
    const text = [HOW_IT_WORKS_HEADING, HOW_IT_WORKS_INTRO, HOW_IT_WORKS_NOTE, ...HOW_IT_WORKS_STEPS.flatMap((s) => [s.title, s.body])].join(' ');
    for (const marker of ['TODO', 'TBD', 'LEAST-VERIFIED', 'fabricated']) {
      expect(text).not.toContain(marker);
    }
    for (const jargon of ['zero-trust', 'Admin SDK', 'Firestore', 'setInterval', 'Cloud Run']) {
      expect(text.toLowerCase()).not.toContain(jargon.toLowerCase());
    }
  });

  it('the signed-out landing page includes the exhibit', () => {
    const landing = readFileSync(new URL('../src/games/house_of_kings_collab/components/LandingPage.tsx', import.meta.url), 'utf8');
    expect(landing).toContain("import { HowItWorks } from './HowItWorks';");
    expect(landing).toContain('<HowItWorks />');
  });
});
