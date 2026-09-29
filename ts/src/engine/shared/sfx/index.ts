/**
 * Shared procedural SFX module (ADR-014 posture): one Web Audio engine,
 * one named-event registry, wired into every arcade game that wants
 * sound. Procedural only — no audio asset files.
 *
 * Usage: `sfx.autoUnlock()` once on mount, then `sfx.play('hit')` at
 * game events. Muted until the player's first interaction.
 */
export * from './types';
export * from './events';
export * from './engine';
