/**
 * Build the arcade manifest the website consumes (the site derives
 * data/arcade.json from it). Pure: all file access goes through `readText`,
 * so tests use fixtures and the CLI (tools/export-arcade-manifest.ts) reads disk.
 */
import type { GameConfig, LeaderboardDef } from '../engine/types';
import type { SiteStatusEntry } from '../status/site-pages.types';
import { parseChangelog, parseIntakeManifest, parsePatchNotes, type DevlogEntry, type ParseResult } from './devlog';

export const ARCADE_PROTOCOL = 'rfd-arcade/1';

export interface GameMeta {
  version?: string;
  last_updated?: string;
  pipeline_stage?: string;
}

export interface ManifestGame {
  gameId: string;
  label: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  color?: string;
  status?: string;
  genre?: string;
  tags: string[];
  embedUrl?: string;
  externalUrl?: string;
  embedWidth?: number;
  embedHeight?: number;
  hasComponent: boolean;
  supersededBy?: string;
  controlsHint?: string;
  stack?: string[];
  platforms?: string[];
  devlogTag: string;
  arcadeSection?: string;
  itch?: { url: string; gameId?: number };
  leaderboards: LeaderboardDef[];
  saves: boolean;
  version: string | null;
  lastUpdated: string | null;
  pipelineStage: string | null;
  statusReport: { badge: string; tagline: string; body: string; updated: string } | null;
  devlog: DevlogEntry[];
}

export interface ArcadeManifest {
  generatedAt: string;
  protocol: string;
  games: ManifestGame[];
  skipped: string[];
}

export interface ManifestInputs {
  registry: GameConfig[];
  metadata: Record<string, GameMeta>;
  statusEntries: SiteStatusEntry[];
  /** Read a repo-relative file; null when it doesn't exist. */
  readText: (repoRelativePath: string) => string | null;
  now?: () => string;
}

export function kebab(gameId: string): string {
  return gameId.replace(/_/g, '-');
}

function itchFor(g: GameConfig): ManifestGame['itch'] {
  if (g.itch) return g.itch;
  if (g.externalUrl && /^https:\/\/([a-z0-9-]+\.)?itch\.io\//.test(g.externalUrl)) return { url: g.externalUrl };
  return undefined;
}

export function buildArcadeManifest(inputs: ManifestInputs): ArcadeManifest {
  const skipped: string[] = [];
  const games = inputs.registry.map((g): ManifestGame => {
    const devlog: DevlogEntry[] = [];
    const collect = (result: ParseResult, source: string) => {
      devlog.push(...result.entries);
      skipped.push(...result.skipped.map(title => `${g.gameId}: ${source}: ${title}`));
    };

    const changelog = inputs.readText(`games/${g.gameId}/CHANGELOG.md`);
    if (changelog) collect(parseChangelog(changelog), 'changelog');
    if (g.patchNotesPath) {
      const notes = inputs.readText(`ts/src/games/${g.patchNotesPath}`);
      if (notes) collect(parsePatchNotes(notes, g.patchNotesPath), 'patch-notes');
    }
    const intake = inputs.readText(`intake/${kebab(g.gameId)}/MANIFEST.md`);
    if (intake) collect(parseIntakeManifest(intake), 'intake');

    const report = inputs.statusEntries.find(e => e.gameId === g.gameId);
    if (report) devlog.push({ date: report.updated, title: `Development status: ${report.statusBadge}`, source: 'status' });
    devlog.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

    const meta = inputs.metadata[g.gameId] ?? {};
    return {
      gameId: g.gameId,
      label: g.label,
      description: g.description ?? '',
      shortDescription: g.shortDescription,
      longDescription: g.longDescription,
      color: g.color,
      status: g.status,
      genre: g.genre,
      tags: g.tags ?? [],
      embedUrl: g.embedUrl,
      externalUrl: g.externalUrl,
      embedWidth: g.embedWidth,
      embedHeight: g.embedHeight,
      hasComponent: Boolean(g.component),
      supersededBy: g.supersededBy,
      controlsHint: g.controlsHint,
      stack: g.stack,
      platforms: g.platforms,
      devlogTag: g.devlogTag ?? kebab(g.gameId),
      arcadeSection: g.arcadeSection,
      itch: itchFor(g),
      leaderboards: g.leaderboards ?? [],
      saves: g.saves ?? false,
      version: (meta.version ?? '').replace(/^﻿/, '').trim() || null,
      lastUpdated: meta.last_updated || null,
      pipelineStage: meta.pipeline_stage ?? null,
      statusReport: report
        ? { badge: report.statusBadge, tagline: report.tagline, body: report.bodyContent, updated: report.updated }
        : null,
      devlog,
    };
  });
  const now = inputs.now ?? (() => new Date().toISOString());
  return { generatedAt: now(), protocol: ARCADE_PROTOCOL, games, skipped };
}
