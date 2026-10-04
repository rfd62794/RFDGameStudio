// new: Phase 1 D1.4 -- the install-free check for an example embed.
import type { GameConfig } from '../../src/engine/types';

export interface EmbedFiles {
  exists(repoPath: string): boolean;
  readText(repoPath: string): string;
  /** Repo-relative paths of every file under the folder, skipping node_modules and dist. */
  listFiles(repoDir: string): string[];
}

export interface EmbedCheckResult {
  problems: string[];
  warnings: string[];
}

const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['OpenAI-style key', /\bsk-[A-Za-z0-9]{20,}/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];
const TEXT_FILE = /\.(html?|[cm]?[jt]sx?|json|css|md|txt|ya?ml|env[^/]*)$/i;
const MAX_SCAN_BYTES = 1_000_000;

/**
 * Checks an example embed without installing anything: package.json has a vite build script, index.html
 * and its module entry exist, the vite base matches the config's embedUrl, and no file holds a secret.
 */
export function checkEmbed(game: GameConfig, sourceDir: string, files: EmbedFiles): EmbedCheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  const pkgPath = `${sourceDir}/package.json`;
  try {
    const pkg = JSON.parse(files.readText(pkgPath)) as { scripts?: Record<string, string> };
    if (!/vite/.test(pkg.scripts?.build ?? '')) problems.push(`${pkgPath}: scripts.build is not a vite build`);
  } catch {
    problems.push(`${pkgPath}: missing or not valid JSON`);
  }

  const htmlPath = `${sourceDir}/index.html`;
  if (!files.exists(htmlPath)) {
    problems.push(`${htmlPath}: missing`);
  } else {
    const entry = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(files.readText(htmlPath))?.[1];
    if (!entry) problems.push(`${htmlPath}: no <script type="module" src=...> entry`);
    else if (!files.exists(`${sourceDir}/${entry.replace(/^\.?\//, '')}`)) problems.push(`${htmlPath}: entry ${entry} not found in ${sourceDir}`);
  }

  const configPath = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].map(n => `${sourceDir}/${n}`).find(p => files.exists(p));
  const base = configPath ? /\bbase:\s*['"]([^'"]+)['"]/.exec(files.readText(configPath))?.[1] : undefined;
  if (game.embedUrl) {
    if (!configPath) problems.push(`${sourceDir}: no vite.config.* but the config has embedUrl ${game.embedUrl}`);
    else if (!base) problems.push(`${configPath}: no literal base but the config has embedUrl ${game.embedUrl}`);
    else if (base !== game.embedUrl) problems.push(`${configPath}: base ${base} does not match embedUrl ${game.embedUrl}`);
  } else {
    warnings.push('config has no embedUrl (the embed is not served at /arcade/<id>/)');
  }

  for (const path of files.listFiles(sourceDir)) {
    if (!TEXT_FILE.test(path)) continue;
    const text = files.readText(path);
    if (text.length > MAX_SCAN_BYTES) continue;
    for (const [name, pattern] of SECRET_PATTERNS) {
      if (pattern.test(text)) problems.push(`${path}: looks like a ${name}`);
    }
  }
  return { problems, warnings };
}
