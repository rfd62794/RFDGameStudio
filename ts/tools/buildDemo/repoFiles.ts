// new: Phase 1 D1.4 -- the real-filesystem implementation of the probes, shared by the CLI and its tests.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EmbedFiles } from './embedCheck';
import type { RepoProbe } from './plan';

const SKIP_DIRS = new Set(['node_modules', 'dist']);

export function makeRepoFiles(repoRoot: string): RepoProbe & EmbedFiles {
  const abs = (repoPath: string) => resolve(repoRoot, repoPath);
  return {
    exists: p => existsSync(abs(p)),
    readText: p => readFileSync(abs(p), 'utf-8'),
    listFiles: dir => {
      const out: string[] = [];
      const walk = (d: string) => {
        for (const name of readdirSync(abs(d))) {
          if (SKIP_DIRS.has(name)) continue;
          const rel = `${d}/${name}`;
          if (statSync(abs(rel)).isDirectory()) walk(rel);
          else out.push(rel);
        }
      };
      walk(dir);
      return out;
    },
  };
}

export { SKIP_DIRS };
