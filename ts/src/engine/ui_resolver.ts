/**
 * RFDGameStudio — Layout Resolver (TypeScript)
 * Same algorithm as engine/ui/resolver.lua and engine/ui/resolver.py.
 * Runs in the browser without a Lua bridge — pure math.
 */

export interface LayoutNode {
  id?: string;
  direction?: 'column' | 'row';
  height?: number;   // fraction of parent height (0.0-1.0)
  width?: number;    // fraction of parent width  (0.0-1.0)
  flex?: number;     // proportional share of remaining space
  children?: LayoutNode[];
}

export interface ResolvedBounds {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function resolveLayout(
  node: LayoutNode,
  parent: Viewport,
  results: ResolvedBounds[] = []
): ResolvedBounds[] {
  const isColumn = (node.direction ?? 'column') === 'column';
  const children = node.children ?? [];

  const x = parent.x;
  const y = parent.y;
  const w = parent.w;
  const h = parent.h;

  if (node.id) {
    results.push({ id: node.id, x, y, w, h });
  }

  if (children.length === 0) return results;

  // Measure fixed and flex children
  let fixedTotal = 0;
  let totalFlex = 0;

  for (const child of children) {
    if (isColumn) {
      if (child.height !== undefined) fixedTotal += child.height * h;
      else if (child.flex !== undefined) totalFlex += child.flex;
    } else {
      if (child.width !== undefined) fixedTotal += child.width * w;
      else if (child.flex !== undefined) totalFlex += child.flex;
    }
  }

  const mainSize = isColumn ? h : w;
  const remaining = Math.max(0, mainSize - fixedTotal);
  const flexUnit = totalFlex > 0 ? remaining / totalFlex : 0;

  let cursor = 0;

  for (const child of children) {
    let childMain: number;
    let childCross: number;
    let childBounds: Viewport;

    if (isColumn) {
      childCross = w;
      if (child.height !== undefined) childMain = child.height * h;
      else if (child.flex !== undefined) childMain = flexUnit * child.flex;
      else childMain = 0;
      childBounds = { x, y: y + cursor, w: childCross, h: childMain };
    } else {
      childCross = h;
      if (child.width !== undefined) childMain = child.width * w;
      else if (child.flex !== undefined) childMain = flexUnit * child.flex;
      else childMain = 0;
      childBounds = { x: x + cursor, y, w: childMain, h: childCross };
    }

    resolveLayout(child, childBounds, results);
    cursor += childMain;
  }

  return results;
}

export function resolveViewport(
  tree: LayoutNode,
  viewportW: number,
  viewportH: number
): ResolvedBounds[] {
  return resolveLayout(tree, { x: 0, y: 0, w: viewportW, h: viewportH });
}

/**
 * Build a bounds lookup map from a resolved array.
 * Usage: const bounds = buildBoundsMap(resolved); bounds['header'] → {x,y,w,h}
 */
export function buildBoundsMap(
  resolved: ResolvedBounds[]
): Record<string, ResolvedBounds> {
  return Object.fromEntries(resolved.map(b => [b.id, b]));
}
