import type { RenderState } from '../types';

/**
 * Ecological events derived from consecutive render-state diffs.
 * The simulation owns no event stream (RenderState.events is always
 * empty) — these are observed, not reported, so tick behaviour stays
 * untouched.
 */
export type ReefEvent =
  | 'feed'          // a fish grazed a nodule, or a shark took a flesh chunk
  | 'strike'        // a fish died — predation, cold, or cull
  | 'shark_loss'    // a shark died — starvation or cull
  | 'core_bloom'    // a decomposed chunk seeded a new algae core
  | 'core_collapse' // an algae core starved out for good
  | 'extinction';   // every fish and shark gone — the reef went silent

export function detectReefEvents(prev: RenderState, next: RenderState): ReefEvent[] {
  const events: ReefEvent[] = [];

  if (next.stats.fish_count < prev.stats.fish_count) events.push('strike');
  if (next.stats.shark_count < prev.stats.shark_count) events.push('shark_loss');

  const grazed = next.stats.algae_count < prev.stats.algae_count;
  // A chunk leaving without a new core means a shark ate it (or it fed an
  // existing core on decompose). A chunk leaving WITH a new core is a
  // bloom, not a meal.
  const chunkTaken =
    next.stats.chunk_count < prev.stats.chunk_count &&
    next.algae.length <= prev.algae.length;
  if (grazed || chunkTaken) events.push('feed');

  if (next.algae.length > prev.algae.length) events.push('core_bloom');
  else if (next.algae.length < prev.algae.length) events.push('core_collapse');

  if (
    prev.stats.fish_count + prev.stats.shark_count > 0 &&
    next.stats.fish_count + next.stats.shark_count === 0
  ) {
    events.push('extinction');
  }

  return events;
}
