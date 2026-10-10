// new: ts/tools/playtest/entries.ts
import type { SmokeEntry } from './manifest';

export const SMOKE_ENTRIES: SmokeEntry[] = [
  {
    id: 'systemic_extract',
    start: { kind: 'embed', slug: 'systemic_extract' },
    firstMinute: [],
    changeChecks: [
      [{ do: 'click', target: { text: 'NEW RUN' }, expect: ['CONFIRM NEW RUN?'] }],
    ],
    controls: ['NEW RUN'],
    notes: 'top bar clipped NEW RUN off screen at 390 (local safe check 2026-10-04)',
  },
  {
    id: 'slither_rogue',
    start: { kind: 'arcade', gameId: 'slither_rogue' },
    firstMinute: [],
    changeChecks: [],
    controls: ['Restart this run'],
    notes: 'Time NaN and a black canvas at the same check; bodyText must never contain NaN',
  },
  {
    id: 'scrapcrawl',
    start: { kind: 'arcade', gameId: 'scrapcrawl' },
    firstMinute: [],
    changeChecks: [],
    controls: [],
    notes: 'lose path shows RUN OVER and a Restart button; win path needs a human once',
  },
  {
    id: 'slimeworld',
    start: { kind: 'arcade', gameId: 'slimeworld' },
    firstMinute: [],
    changeChecks: [
      [
        {
          do: 'click',
          target: { text: 'New Campaign' },
          expect: ['CONFIRM HARD RESET', 'CANCEL'],
        },
      ],
    ],
    controls: ['New Campaign'],
    notes: 'two-step hard reset',
  },
  {
    id: 'kingmaker_squads',
    start: { kind: 'embed', slug: 'kingmaker_squads' },
    firstMinute: [],
    changeChecks: [
      [{ do: 'click', target: { text: 'Restart' }, expect: ['Confirm restart?'] }],
    ],
    controls: ['Restart'],
    notes: 'no native confirm dialog',
  },
];
