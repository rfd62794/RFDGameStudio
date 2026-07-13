import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'corpworld',
  label: 'CorpWorld',
  description: 'A cold-corporate land-grab on a newly-discovered planet — Voronoi-tessellated territory, symmetric fog-of-war, deterministic Circle/Square/Triangle combat. EARLY PROTOTYPE (v0.1.0R3): core loop plays and holds up under playtesting; three real bugs found and fixed against source, not just agent summary — neutral-cell capture delay, a save/reload crash, and a wounded-unit damage-scaling gap in combat.',
  color: '#f59e0b',
  status: 'external',
  embedUrl: '/arcade/corpworld/',
};

export default config;
