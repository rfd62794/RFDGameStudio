import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { renderGradientBackground, renderBorder, renderShape } from '../src/engine/artGen';
import type { BorderStyle, ShapeId } from '../src/engine/artGen';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

const DATA_PATH = resolve(repoRoot, 'games', 'dissonance', 'data.yaml');
const OUT_DIR = resolve(repoRoot, 'ts', 'public', 'assets', 'dissonance');

const ELEMENT_COLORS: Record<string, string> = {
  ember: '#f97316',
  ash: '#94a3b8',
  spark: '#22d3ee',
  cinder: '#991b1b',
};
const SURFACE = '#0f172a';

const RELATION_TO_BORDER: Record<string, BorderStyle> = {
  single: 'solid',
  adjacent: 'thick',
  same: 'glow',
  opposed: 'dashed',
};

const COMPONENT_TO_SHAPE: Record<string, ShapeId> = {
  sever: 'blade',
  mend: 'cross',
  guard: 'shield',
  unmake: 'spiral',
};

function generateCardSVG(card: any): string {
  const cid: string = card.id;
  const el1: string = card.el1;
  const el2: string | undefined = card.el2;
  const relationType: string = card.relationType ?? 'single';
  const component = cid.split('_').pop() ?? '';

  const color = ELEMENT_COLORS[el1] ?? '#94a3b8';
  const colorSource = el2 ? { primary: color, secondary: ELEMENT_COLORS[el2] ?? color } : color;

  const bg = renderGradientBackground({
    width: 120,
    height: 160,
    gradientId: 'bg',
    color: colorSource,
    surface: SURFACE,
  });

  const border = renderBorder({
    width: 120,
    height: 160,
    color,
    style: RELATION_TO_BORDER[relationType] ?? 'solid',
  });

  const shape = renderShape({
    shape: COMPONENT_TO_SHAPE[component] ?? 'blade',
    color,
    cx: 60,
    cy: 85,
    scale: component === 'sever' ? 1.2 : component === 'guard' ? 0.9 : 1,
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">\n` +
    `  ${bg}\n` +
    `  ${border}\n` +
    `  ${shape}\n` +
    `</svg>`
  );
}

describe('artGen shapes match committed Dissonance card SVGs', () => {
  const data = load(readFileSync(DATA_PATH, 'utf-8')) as any;
  const cards = (data.named_cards ?? []) as any[];

  it.each(cards.map((card) => [card.id, card] as const))(
    'card %s matches the committed SVG',
    (id, card) => {
      const generated = generateCardSVG(card);
      const committed = readFileSync(resolve(OUT_DIR, 'cards', `${id}.svg`), 'utf-8').replace(/\r\n/g, '\n');
      expect(generated).toBe(committed);
    }
  );
});
