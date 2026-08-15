export type ProjectCategory =
  | 'live_catalog'            // registered, TS-native or Lua-backed
  | 'ai_studio_track'         // built via AI Studio, not in games/registry.ts
  | 'separate_infrastructure' // own tech stack (VoidDrift/Rust, House of Kings/Firebase)
  | 'retired';

export type ProjectStatus =
  | 'active'
  | 'shipped_mature'
  | 'shipped_deliberately_paused'
  | 'blocked'
  | 'status_unconfirmed'
  | 'retired';

export interface ProjectEntry {
  id: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  currentState: string;      // one line
  nextAction?: string;       // one line, omit if nothing blocking
  supersededBy?: string;     // retired entries only
  link?: string;             // itch.io / arcade route, if live
  lastUpdated: string;       // ISO date — makes staleness visible in the UI itself, not just in a doc's prose
}
