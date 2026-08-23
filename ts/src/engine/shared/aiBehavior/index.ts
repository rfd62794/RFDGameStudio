/**
 * Shared AI behavior module — public exports.
 *
 * Phase 1: steering forces extracted from Shoal's proven implementation.
 * Phase 2: Yuka-based behavioral state machine adapter added — provides
 * a real State Machine / goal-driven agent design layer on top of the
 * existing steering forces. Yuka is used exclusively for its FSM layer;
 * its own steering-behavior classes are never imported or used.
 */

export {
  forceSeek,
  forceFlee,
  forceSeparate,
  forceAvoid,
  forceAlign,
  forceCohere,
} from './steering';

export {
  BehavioralState,
  BehavioralStateMachine,
  createBehavioralState,
} from './yukaStates';

export type {
  ForceRequest,
  StateContext,
} from './yukaStates';
