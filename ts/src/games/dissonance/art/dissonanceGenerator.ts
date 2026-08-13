/**
 * Dissonance Depths — SVG art generator (TypeScript).
 *
 * Ported from scripts/generate_dissonance_art.py. Produces the same 106
 * SVG files (56 cards + 12 relics + 38 enemies) using the shared artGen
 * primitives and the Dissonance-specific config in dissonance.config.ts.
 *
 * The Python generator is the original source of truth (it produced the
 * committed SVGs). This TypeScript port must produce byte-identical output
 * — verified by test_dissonance_zero_regression.
 *
 * Key difference from the Python version: this uses artGen's shared
 * renderGradientBackground, renderBorder, renderShape, and renderSpikyStar
 * functions instead of inline Python string formatting. The config is
 * externalized to dissonance.config.ts.
 */

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

import {
  renderGradientBackground,
  renderBorder,
  renderShape,
  renderSpikyStar,
} from '../../../engine/artGen/shapes';
import type { ColorSource } from '../../../engine/artGen/types';

import {
  ELEMENT_COLORS,
  SURFACE,
  COMPONENT_TO_SHAPE,
  COMPONENT_SCALE,
  RELATION_TO_BORDER,
  CARD_WIDTH,
  CARD_HEIGHT,
  RELIC_COLORS,
  RELIC_SIZE,
  TIER_VISUALS,
  ENEMY_SIZE,
  ENEMY_CENTER,
  ENEMY_STAR_POINTS,
  ENEMY_SECTIONS,
} from './dissonance.config';

// --- Card generation ---

export function generateCardSVG(card: Record<string, unknown>): string {
  const cid = card.id as string;
  const el1 = card.el1 as string;
  const el2 = card.el2 as string | undefined;
  const relationType = (card.relationType as string) ?? 'single';
  const component = cid.split('_').pop() ?? '';

  const color = ELEMENT_COLORS[el1] ?? '#94a3b8';
  const colorSource: ColorSource = el2
    ? { primary: color, secondary: ELEMENT_COLORS[el2] ?? color }
    : color;

  const bg = renderGradientBackground({
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    gradientId: 'bg',
    color: colorSource,
    surface: SURFACE,
  });

  const border = renderBorder({
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    color,
    style: RELATION_TO_BORDER[relationType] ?? 'solid',
  });

  const shape = renderShape({
    shape: COMPONENT_TO_SHAPE[component] ?? 'blade',
    color,
    cx: 60,
    cy: 85,
    scale: COMPONENT_SCALE[component] ?? 1,
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">\n` +
    `  ${bg}\n` +
    `  ${border}\n` +
    `  ${shape}\n` +
    `</svg>`
  );
}

// --- Relic generation ---
//
// Relics use absolute coordinates (not the <g transform> wrapper that
// renderShape produces). The Python generator emits shapes directly with
// hardcoded coords. We replicate that exactly here — these are NOT going
// through artGen's renderShape because the committed SVGs don't use the
// transform wrapper for relics. This is the byte-identical requirement.

function relicShape(category: string, color: string): string {
  switch (category) {
    case 'economy':
      return (
        `<circle cx="50" cy="50" r="28" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<text x="50" y="62" text-anchor="middle" fill="${color}" font-size="26" font-family="monospace">$</text>`
      );
    case 'safety-net':
      return (
        `<path d="M50,18 C75,18 88,35 88,55 C88,82 50,105 50,105 C50,105 12,82 12,55 C12,35 25,18 50,18 Z" ` +
        `fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="M50,42 L50,70 M36,56 L64,56" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`
      );
    case 'info':
      return (
        `<ellipse cx="50" cy="50" rx="34" ry="26" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<circle cx="50" cy="50" r="10" fill="${color}"/>` +
        `<circle cx="66" cy="44" r="4" fill="${color}"/>`
      );
    case 'utility': {
      // gear
      let teeth = '';
      for (let i = 0; i < 8; i++) {
        const angle = i * 45;
        teeth += `<rect x="46" y="8" width="8" height="12" fill="${color}" transform="rotate(${angle} 50 50)"/>`;
      }
      return (
        teeth +
        `<circle cx="50" cy="50" r="20" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<circle cx="50" cy="50" r="8" fill="${color}"/>`
      );
    }
    case 'risk':
      return (
        `<rect x="20" y="20" width="60" height="60" rx="6" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<circle cx="35" cy="35" r="5" fill="${color}"/>` +
        `<circle cx="65" cy="35" r="5" fill="${color}"/>` +
        `<circle cx="35" cy="65" r="5" fill="${color}"/>` +
        `<circle cx="50" cy="50" r="5" fill="${color}"/>` +
        `<circle cx="65" cy="65" r="5" fill="${color}"/>`
      );
    default: // synergy
      return (
        `<circle cx="32" cy="50" r="14" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<circle cx="68" cy="50" r="14" fill="none" stroke="${color}" stroke-width="5"/>` +
        `<path d="M44,50 L56,50" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`
      );
  }
}

export function generateRelicSVG(relic: Record<string, unknown>): string {
  const category = (relic.category as string) ?? 'utility';
  const color = RELIC_COLORS[category] ?? '#a78bfa';
  const shape = relicShape(category, color);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RELIC_SIZE} ${RELIC_SIZE}" width="${RELIC_SIZE}" height="${RELIC_SIZE}">\n` +
    `  <rect width="${RELIC_SIZE}" height="${RELIC_SIZE}" rx="12" fill="${SURFACE}"/>\n` +
    `  <rect x="3" y="3" width="94" height="94" rx="10" fill="none" stroke="${color}" stroke-width="3"/>\n` +
    `  ${shape}\n` +
    `</svg>`
  );
}

// --- Enemy generation ---

export function generateEnemySVG(enemy: Record<string, unknown>): string {
  const tier = (enemy.tier as string) ?? 'basic';
  const vis = TIER_VISUALS[tier] ?? TIER_VISUALS.basic;

  const shape = renderSpikyStar({
    radius: vis.radius,
    fill: vis.fill,
    stroke: vis.stroke,
    strokeWidth: vis.strokeWidth,
    center: ENEMY_CENTER,
    points: ENEMY_STAR_POINTS,
  });

  let glow = '';
  let shapeWithGlow = shape;
  if (tier === 'master') {
    glow = (
      '<filter id="boss-glow" x="-25%" y="-25%" width="150%" height="150%">' +
      '<feGaussianBlur stdDeviation="4" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    );
    shapeWithGlow = shape.replace('/>', ' filter="url(#boss-glow)"/>');
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ENEMY_SIZE} ${ENEMY_SIZE}" width="${ENEMY_SIZE}" height="${ENEMY_SIZE}">\n` +
    `  <rect width="${ENEMY_SIZE}" height="${ENEMY_SIZE}" rx="14" fill="${SURFACE}"/>\n` +
    `  ${glow}\n` +
    `  ${shapeWithGlow}\n` +
    `</svg>`
  );
}

// --- Data loading + manifest generation ---

export interface DissonanceData {
  named_cards?: Record<string, unknown>[];
  relics?: Record<string, unknown>[];
  enemies?: Record<string, Record<string, unknown>[]>;
}

export function loadDissonanceData(repoRoot?: string): DissonanceData {
  const root = repoRoot ?? resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', '..');
  const dataPath = resolve(root, 'games', 'dissonance', 'data.yaml');
  return load(readFileSync(dataPath, 'utf-8')) as DissonanceData;
}

export interface GeneratedManifest {
  cards: string[];
  relics: string[];
  enemies: string[];
}

/**
 * Generate SVGs for all Dissonance entities from data.yaml.
 * Returns a manifest of ids grouped by kind. Does NOT write to disk —
 * the caller decides whether to write files or compare in-memory.
 */
export function generateAllSVGs(data: DissonanceData): Record<string, string> {
  const svgs: Record<string, string> = {};

  for (const card of data.named_cards ?? []) {
    const id = card.id as string;
    svgs[`cards/${id}`] = generateCardSVG(card);
  }

  for (const relic of data.relics ?? []) {
    const id = relic.id as string;
    svgs[`relics/${id}`] = generateRelicSVG(relic);
  }

  for (const section of ENEMY_SECTIONS) {
    for (const enemy of data.enemies?.[section] ?? []) {
      const id = enemy.id as string;
      svgs[`enemies/${id}`] = generateEnemySVG(enemy);
    }
  }

  return svgs;
}

/**
 * Build the id manifest (without generating SVG content) for exact-count
 * verification against the committed files.
 */
export function buildIdManifest(data: DissonanceData): GeneratedManifest {
  const manifest: GeneratedManifest = { cards: [], relics: [], enemies: [] };

  manifest.cards = (data.named_cards ?? []).map((c) => c.id as string);
  manifest.relics = (data.relics ?? []).map((r) => r.id as string);

  for (const section of ENEMY_SECTIONS) {
    manifest.enemies.push(...(data.enemies?.[section] ?? []).map((e) => e.id as string));
  }

  return manifest;
}
