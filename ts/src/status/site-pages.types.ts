/**
 * Types for the Interactive Status Board site pages.
 *
 * These pages are generated as Hugo-compatible markdown from structured
 * data in RFDGameStudio, then ported to the RFD_IT_Services_Site repo
 * via scripts/site/sync_status_pages.py — same build-pipeline pattern
 * as sync_games.py (which ports the game registry).
 *
 * The pattern reuses the existing "Games, Engines, and Systems" hub/
 * card/detail-page structure: one hub page with clickable cards, each
 * linking to a dedicated breakdown page with the full content.
 */

/** Status badge displayed on each hub card and detail page. */
export type StatusBadge = 'Live' | 'In Progress' | 'Designed' | 'Complete';

/**
 * One project thread in the Interactive Status Board.
 *
 * The `cardSummary` is the short text shown on the hub card.
 * The `bodyContent` is the full markdown for the dedicated breakdown
 * page — the real, detailed content, not the compressed card summary.
 */
export interface SiteStatusEntry {
  /** Slug used for the Hugo page filename and permalink. */
  id: string;
  /** Display name shown on the card and detail page title. */
  name: string;
  /** Status badge (Live / In Progress / Designed / Complete). */
  statusBadge: StatusBadge;
  /** Short tagline for Hugo front matter and card subtitle. */
  tagline: string;
  /** One-line problem statement for Hugo front matter. */
  problem: string;
  /** Approach bullets for Hugo front matter. */
  approach: string[];
  /** Highlight bullets for Hugo front matter. */
  highlights: string[];
  /** Tech stack tags for Hugo front matter. */
  stack: string[];
  /** Short summary shown on the hub card (2-3 sentences). */
  cardSummary: string;
  /** Full markdown body for the dedicated breakdown page. */
  bodyContent: string;
}

/**
 * The hub page metadata. The hub page itself is a `type: system` page
 * in the same category as games-engines-systems.md and legacy-projects.md.
 */
export interface SiteStatusHub {
  /** Slug for the Hugo page filename. */
  id: string;
  /** Display title. */
  title: string;
  /** Tagline for Hugo front matter. */
  tagline: string;
  /** Problem statement for Hugo front matter. */
  problem: string;
  /** Approach bullets for Hugo front matter. */
  approach: string[];
  /** Highlight bullets for Hugo front matter. */
  highlights: string[];
  /** Tech stack tags for Hugo front matter. */
  stack: string[];
  /** Intro paragraph shown above the card grid. */
  intro: string;
  /** Footer note about deferred/routed-elsewhere items. */
  deferredNote: string;
}
