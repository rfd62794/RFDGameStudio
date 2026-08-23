// Patch-notes loader — Arcade Metadata Expansion (Aug 23 2026).
//
// Real per-game patch notes files (e.g. succession/PATCH_NOTES_v0.2.0.md)
// are loaded at build time via Vite's import.meta.glob, keyed by their
// path relative to this file's directory (ts/src/games/). This means a
// `GameConfig.patchNotesPath` value like 'succession/PATCH_NOTES_v0.2.0.md'
// resolves to the real, actual file content — never a duplicated/copied
// string baked into a component.
//
// If a `patchNotesPath` is set but no matching file was found at build
// time, loadPatchNotes returns null. Callers must render a real, visible
// "patch notes unavailable" state — never silently hide the section or
// fabricate placeholder content.
const PATCH_NOTES_FILES = import.meta.glob('./*/PATCH_NOTES*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function loadPatchNotes(patchNotesPath: string): string | null {
  const key = `./${patchNotesPath}`;
  return Object.prototype.hasOwnProperty.call(PATCH_NOTES_FILES, key)
    ? PATCH_NOTES_FILES[key]
    : null;
}
