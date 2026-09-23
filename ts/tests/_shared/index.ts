/**
 * Shared L1/L2 test fixtures — barrel export.
 *
 * Import from 'tests/_shared' in any test file to use the formalized
 * helpers without duplicating boilerplate.
 */
export { renderComponent } from './renderComponent';
export type { RenderResult } from './renderComponent';
export { createStarter, createStarterPair } from './createStarterPair';
export { expectBridgeField } from './expectBridgeField';
