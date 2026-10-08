// new: ts/tools/playtest/pageProbes.ts
import type { ChainLink } from './verdict';

export function collectClipChain(el: Element): ChainLink[] {
  const chain: ChainLink[] = [];
  let node: Element | null = el;
  while (node) {
    const r = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    chain.push({
      tag: node.tagName.toLowerCase(),
      rect: { x: r.left, y: r.top, w: r.width, h: r.height },
      overflowX: style.overflowX,
      overflowY: style.overflowY,
    });
    node = node.parentElement;
  }
  return chain;
}

export function readPageFacts(): {
  scrollWidth: number;
  innerWidth: number;
  bodyText: string;
} {
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyText: document.body.innerText,
  };
}
