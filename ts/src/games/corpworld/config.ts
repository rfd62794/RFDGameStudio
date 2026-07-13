import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'corpworld',
  label: 'CorpWorld',
  description: 'A cold-corporate land-grab on a newly-discovered planet — Voronoi-tessellated territory, symmetric fog-of-war, deterministic Circle/Square/Triangle combat. EARLY PROTOTYPE (v0.1.0R2): core loop plays and holds up under playtesting, but the combat damage formula does not yet scale with a unit's current strength (wounded units still hit at full force) — fix pending.',
  color: '#f59e0b',
  status: 'external',
  embedUrl: '/arcade/corpworld/',
};

export default config;
