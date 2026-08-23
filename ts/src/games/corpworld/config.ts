import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// CorpWorld was Planet of Greed's fork ancestor, superseded by the
// current, live Planet of Greed (ts/src/games/planetofgreed/). Presented
// here as real origin history, not as a new game competing with the one
// it led to.
const config: GameConfig = {
  gameId: 'corpworld',
  label: 'CorpWorld (Origin)',
  description: 'Origin project — Planet of Greed\'s fork ancestor, superseded by the current, live Planet of Greed (ts/src/games/planetofgreed/). A cold-corporate land-grab on a newly-discovered planet — Voronoi-tessellated territory, symmetric fog-of-war, deterministic Circle/Square/Triangle combat, multi-action weekly orders, and per-sector Civic Directives.',
  color: '#f59e0b',
  status: 'external',
  genre: 'colony-4x',
  tags: ['origin-project', 'territory-control'],
  embedUrl: '/arcade/corpworld/',
};

export default config;
