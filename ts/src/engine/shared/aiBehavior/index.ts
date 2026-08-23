/**
 * Shared AI behavior module — public exports.
 *
 * Phase 1: steering forces extracted from Shoal's proven implementation.
 * Future phases will add decision-making utilities (utility AI, state
 * machines) as real, proven needs emerge from other games.
 */

export {
  forceSeek,
  forceFlee,
  forceSeparate,
  forceAvoid,
  forceAlign,
  forceCohere,
} from './steering';

export type {
  SteeringEntity,
  SteeringObstacle,
} from './steering';
