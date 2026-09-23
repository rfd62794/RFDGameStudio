/**
 * Public exports for the shared portal adapter.
 *
 * Phase 1: detection + safe-by-default interface shell.
 * Phase 2: Y8 adapter — real SDK wrapper behind the locked interface.
 *
 * Detection logic is pure and fully testable. The interface functions
 * are safe-by-default — they check the detected environment and dispatch
 * to the relevant portal adapter, or no-op when no portal is present.
 */
export * from './detection';
export * from './interface';
export * from './adapters/y8';
