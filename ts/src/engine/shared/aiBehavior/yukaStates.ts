/**
 * Yuka-based behavioral state machine adapter.
 *
 * This module wraps Yuka's StateMachine/State classes to provide a
 * real, generic behavioral state layer for game entities. States
 * select and weight which steering forces apply each tick — they do
 * NOT reimplement or replace the force math itself.
 *
 * CRITICAL BOUNDARY: Yuka ships its own steering-behavior classes
 * (seek, flee, separation, alignment, cohesion, etc.). These are
 * NEVER imported, used, or referenced by this module or any consumer
 * in this studio. Yuka is used exclusively for its FSM layer
 * (StateMachine/State). The force computation lives in
 * `steering.ts`, extracted from Shoal's proven implementation.
 */

import { State, StateMachine } from 'yuka';

/**
 * A force request produced by a state's execute() — describes which
 * steering force to apply and at what weight multiplier. The actual
 * force computation is done by the caller using the existing
 * `steering.ts` functions.
 */
export interface ForceRequest {
  /** Which steering force to apply. */
  type: 'seek_algae' | 'flee_shark' | 'separate' | 'align' | 'cohere' | 'avoid_chunk' | 'depth_bias' | 'wander' | 'seek_fish' | 'seek_flesh' | 'retreat';
  /** Weight multiplier for this force (1.0 = use config default). */
  weight: number;
}

/**
 * Context passed to a state's execute() — contains the real
 * simulation values the state needs to decide which forces to apply.
 * This is a generic interface; consumers populate it with their
 * entity's actual state fields.
 */
export interface StateContext {
  /** Entity's hunger level (0 = satiated, higher = hungrier). */
  hunger: number;
  /** Entity's exposure/cold level (0 = safe, higher = more exposed). */
  exposure: number;
  /** Whether a threat (shark for fish, none for shark) is nearby. */
  threatNearby: boolean;
  /** Whether food (algae for fish, fish/chunks for shark) is nearby. */
  foodNearby: boolean;
  /** Whether the entity is in retreat (shark exposure retreat). */
  inRetreat: boolean;
  /** Tick count for timing-based transitions. */
  tickCount: number;
}

/**
 * A behavioral state that produces force requests each tick.
 * Extends Yuka's State class — the execute() method returns an
 * array of ForceRequests instead of directly computing forces.
 */
export class BehavioralState extends State {
  /** Force requests produced by the last execute() call. */
  forceRequests: ForceRequest[] = [];

  /**
   * Called per simulation step. Subclasses override this to produce
   * force requests based on the context. The owner entity is expected
   * to have a `_stateContext` property with the current StateContext.
   */
  execute(owner?: any): void {
    const ctx = owner?._stateContext as StateContext | undefined;
    if (ctx) {
      this.forceRequests = this.computeForces(ctx);
    }
  }

  /**
   * Subclasses override this to return the force requests for this
   * state given the current context.
   */
  computeForces(_ctx: StateContext): ForceRequest[] {
    return [];
  }
}

/**
 * A state machine for a game entity. Wraps Yuka's StateMachine and
 * adds transition logic based on StateContext.
 */
export class BehavioralStateMachine extends StateMachine {
  /** The current state context for this entity. */
  _stateContext: StateContext | null = null;

  /**
   * Updates the state machine: evaluates transitions, then executes
   * the current state. The `_stateContext` is used for both transition
   * evaluation and state execution. We bypass Yuka's super.update()
   * because it passes `this.owner` (null) to execute(), whereas the
   * context lives on `_stateContext` directly.
   */
  update(): void {
    const ctx = this._stateContext;
    if (!ctx) return;
    this.evaluateTransitions(ctx);
    if (this.currentState instanceof BehavioralState) {
      this.currentState.forceRequests = this.currentState.computeForces(ctx);
    }
  }

  /**
   * Subclasses override this to define state transition logic.
   * Called before execute() each tick.
   */
  evaluateTransitions(_ctx: StateContext): void {
    // Override in subclasses
  }

  /**
   * Returns the force requests from the current state's last execute().
   */
  getForceRequests(): ForceRequest[] {
    if (this.currentState instanceof BehavioralState) {
      return this.currentState.forceRequests;
    }
    return [];
  }
}

/**
 * Creates a behavioral state with a given name and force computation.
 * Convenience factory for defining states concisely.
 */
export function createBehavioralState(
  name: string,
  computeForces: (ctx: StateContext) => ForceRequest[],
): BehavioralState {
  const state = new BehavioralState();
  state.computeForces = computeForces;
  (state as any)._name = name;
  return state;
}
