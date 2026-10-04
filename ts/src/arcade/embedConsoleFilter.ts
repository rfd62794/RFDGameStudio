/**
 * Console messages that an embedded third-party frame (an itch.io page) raises on its own.
 * The studio cannot fix these from outside the iframe, so the A1 smoke records them
 * but does not count them as a failure of the demo.
 */
export const THIRD_PARTY_FRAME_ERRORS: readonly RegExp[] = [
  /Blocked autofocusing on a <input> element in a cross-origin subframe/i,
];

export function isThirdPartyFrameError(message: string): boolean {
  return THIRD_PARTY_FRAME_ERRORS.some((pattern) => pattern.test(message));
}

export interface SplitConsoleErrors {
  /** Errors that count against A1. */
  ours: string[];
  /** Recorded, not counted. */
  thirdParty: string[];
}

/** Splits console error texts. Non-embed demos pass `isEmbed: false` and keep every error. */
export function splitConsoleErrors(messages: readonly string[], isEmbed: boolean): SplitConsoleErrors {
  if (!isEmbed) return { ours: [...messages], thirdParty: [] };
  const ours: string[] = [];
  const thirdParty: string[] = [];
  for (const message of messages) {
    (isThirdPartyFrameError(message) ? thirdParty : ours).push(message);
  }
  return { ours, thirdParty };
}
