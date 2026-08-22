export type ApproachId = 'whisper' | 'appeal' | 'evidence' | 'indictment' | 'discredit';

/**
 * Real state-transition function for AudienceStage's progressive
 * disclosure (ADR-006). Extracted so tests exercise the exact same
 * function the component calls, not a reimplementation — this is what
 * proves "only one approach expanded at a time" as a real invariant
 * across a sequence of selections, not just that each panel can
 * independently render when told to.
 *
 * Selecting a new approach always replaces whichever was previously
 * expanded (never adds to a set). Re-selecting the currently expanded
 * approach collapses it back to none.
 */
export function nextExpandedApproach(
  current: ApproachId | null,
  selected: ApproachId
): ApproachId | null {
  return current === selected ? null : selected;
}
