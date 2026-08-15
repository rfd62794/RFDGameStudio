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

/**
 * Per ADR-016: any "still open / unconfirmed" claim must carry a
 * verification method so a reader knows whether it was checked against
 * the live repo or inferred. Required on status_unconfirmed entries;
 * optional on others (a shipped_mature game's state isn't a staleness
 * claim in the same sense).
 */
export type VerificationMethod =
  | 'direct file read'
  | 'research/inference'
  | 'narrated agent report';

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
  verificationMethod?: VerificationMethod;  // required on status_unconfirmed per ADR-016
}
