// new: ts/src/games/planetofgreed/originGames.ts
import { arcadeGameHref } from './gameLinks';

export interface OriginLink {
  id: string;
  label: string;
  blurb: string;
  href: string;
}

/** The two earlier games Planet of Greed grew out of. Each id must be a registry entry with `supersededBy: 'planetofgreed'`. */
export const ORIGIN_GAMES: ReadonlyArray<{ id: string; label: string; blurb: string }> = [
  { id: 'corpworld', label: 'CorpWorld', blurb: 'the first land-grab prototype' },
  { id: 'kingmaker_squads', label: 'Kingmaker Squads', blurb: 'a complete tactical squad campaign' },
];

export const ORIGINS_HEADING = 'Curious where Planet of Greed began?';

/** Links for the title screen. A standalone build has no arcade to link to, so the row is empty there. */
export function originLinks(mode: 'arcade' | 'standalone', currentHref: string): OriginLink[] {
  const links: OriginLink[] = [];
  for (const g of ORIGIN_GAMES) {
    const href = arcadeGameHref(mode, currentHref, g.id);
    if (href) links.push({ ...g, href });
  }
  return links;
}
