// new: ts/src/games/planetofgreed/endingView.ts
import type { Corporation, EndingEvent, GameDate } from './types';
import { arcadeGameHref } from './gameLinks';

/** The chapter the ending hands off to (docs/gdd/PlanetOfGreed_Design_v0.2.md, Chapter 2). */
export const NEXT_CHAPTER_ID = 'facility_escape';
export const NEXT_CHAPTER_LABEL = 'Continue to Facility Escape';

export interface EndingViewModel {
  houseName: string;
  /** e.g. "Rank 1" */
  rankLabel: string;
  /** e.g. "4 of 6" */
  fragmentsLabel: string;
  /** e.g. "Year 3" */
  yearLabel: string;
  allFragments: boolean;
}

/** Pure: everything the ending screen shows about the finished campaign. */
export function buildEndingViewModel(
  player: Pick<Corporation, 'name' | 'rank'>,
  event: EndingEvent,
  date: Pick<GameDate, 'year'>,
): EndingViewModel {
  return {
    houseName: player.name,
    rankLabel: `Rank ${player.rank}`,
    fragmentsLabel: `${event.fragmentCount} of ${event.total}`,
    yearLabel: `Year ${Math.max(1, Math.min(date.year, 3))}`,
    allFragments: event.fragmentCount === event.total,
  };
}

export function nextChapterHref(mode: 'arcade' | 'standalone', currentHref: string): string | null {
  return arcadeGameHref(mode, currentHref, NEXT_CHAPTER_ID);
}
