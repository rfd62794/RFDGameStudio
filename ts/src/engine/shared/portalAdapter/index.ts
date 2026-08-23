/**
 * Public exports for the shared portal adapter (v1: detection + shell).
 *
 * Detection logic is pure and fully testable. The interface functions
 * are safe-by-default no-ops this phase — real SDK wiring is a later,
 * separate phase per RFDGameStudio_MultiPortalPublishing.md.
 */
export * from './detection';
export * from './interface';
