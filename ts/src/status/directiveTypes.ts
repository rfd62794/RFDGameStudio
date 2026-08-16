/**
 * Directive Lifecycle Tracker — type definitions.
 *
 * Matches the StatusBoard pattern: types in types.ts, data in
 * directiveTracker.data.ts, generation in generate-directive-tracker.ts.
 */

export type DirectiveState = 'drafted' | 'dispatched' | 'verified' | 'closed';

export type RoundOutcome = 'fabricated' | 'wrong-hypothesis' | 'partial' | 'correct';

export interface RoundEntry {
  roundNumber: number;
  outcome: RoundOutcome;
  note: string;  // one real, specific line — what happened, not a vague status word
}

export interface DirectiveEntry {
  name: string;              // real, human-readable directive name
  project: string;           // cross-references the StatusBoard's game name
  state: DirectiveState;
  rounds: RoundEntry[];       // real, one entry per real submission
  lastUpdated: string;       // ISO date
}
