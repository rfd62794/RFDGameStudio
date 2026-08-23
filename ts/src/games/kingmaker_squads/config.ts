import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// Kingmaker Squads was Planet of Greed's wheel/culture-identity design
// source, superseded by the current, live Planet of Greed
// (ts/src/games/planetofgreed/). Presented here as real origin history,
// not as a new game competing with the one it led to.
const config: GameConfig = {
  gameId: 'kingmaker_squads',
  label: 'Kingmaker Squads (Origin)',
  description: 'Origin project — Planet of Greed\'s wheel/culture-identity design source, superseded by the current, live Planet of Greed (ts/src/games/planetofgreed/). A tactical squad strategy game.',
  color: '#6c8ef7',
  status: 'external',
  embedUrl: '/arcade/kingmaker_squads/',
};

export default config;
