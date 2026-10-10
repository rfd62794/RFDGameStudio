// new: ts/src/games/house_of_kings_collab/howItWorks.ts

export interface HowItWorksStep {
  title: string;
  body: string;
}

export const HOW_IT_WORKS_HEADING = 'How it works behind the scenes';

export const HOW_IT_WORKS_INTRO =
  'House of Kings is an exhibit of how to build a shared kingdom game that costs nothing while nobody is playing. Here is the trick, in three steps.';

/** Distilled from ARCHITECTURE.md, section 1 (visit-triggered evaluation). No timers run in the background. */
export const HOW_IT_WORKS_STEPS: ReadonlyArray<HowItWorksStep> = [
  {
    title: 'You visit the kingdom',
    body: 'Each time someone opens the kingdom, the server checks one timestamp: when did this kingdom last settle its day?',
  },
  {
    title: 'The server settles the day, once',
    body: 'If a full day has passed, one safe transaction settles it: scores update, daily counters reset and the clock moves forward. If a hundred players arrive at the same moment, only one settlement happens.',
  },
  {
    title: 'Everyone sees the same result',
    body: 'Nothing runs in the background, so there is nothing to forget, repeat or pay for while the kingdom sleeps.',
  },
];

export const HOW_IT_WORKS_NOTE =
  'This page is an exhibit. Signing in needs its own hosted backend, so you may not be able to play.';
