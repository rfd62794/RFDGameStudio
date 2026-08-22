/**
 * Public exports for the shared person generator (v1: role symbols).
 *
 * Pure logic (archetypes, roleSymbols) is re-exported here for direct
 * consumption. The React component is exported separately so non-rendering
 * consumers (tests, logic-only callers) don't pull a .tsx into their graph.
 */
export * from './archetypes';
export * from './roleSymbols';
export { RoleSymbol, default } from './RoleSymbol';
export type { RoleSymbolProps } from './RoleSymbol';
