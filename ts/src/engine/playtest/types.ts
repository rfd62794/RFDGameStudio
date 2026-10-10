// new: ts/src/engine/playtest/types.ts
export interface PlaytestAdapter<S = unknown, A = unknown> {
  readonly gameId: string;
  init(seed: number): void;             // fresh session, deterministic for a seed
  observe(): S;                         // what a player could see
  legalActions(): A[];                  // empty while not terminal = a dead end
  act(a: A): void;                      // may throw; the runner records it
  isTerminal(): boolean;
  outcome(): string;                    // the game's own word: 'victory', 'game_over', 'playing', ...
  metrics(): Record<string, number>;    // flat numbers (hp, gold, ...); every value must be finite
  fingerprint(): string;                // cheap stable string of the state, for stall detection
}
export type Policy<S = unknown, A = unknown> = (obs: S, legal: A[], rng: () => number) => A;
export interface Violation { check: string; seed: number; step: number; message: string }
export interface RunResult {
  seed: number; steps: number; outcome: string; terminal: boolean;
  violations: Violation[]; metrics: Record<string, number>;
}
export type ExtraCheck = { name: string; check: (adapter: PlaytestAdapter, step: number) => string | null };
export interface RunOptions { maxSteps?: number; stallWindow?: number; extraChecks?: ExtraCheck[] } // defaults 500 and 25
