/**
 * Vitest global setup — polyfills browser APIs not provided by jsdom.
 *
 * jsdom doesn't implement Path2D (it's a canvas API). We provide a
 * minimal polyfill that's sufficient for testing cache identity and
 * invalidation — the actual path geometry is verified in the browser.
 */

// Minimal Path2D polyfill — stores path commands for inspection
class Path2DPolyfill {
  private commands: Array<{ type: string; args: number[] }> = [];

  moveTo(x: number, y: number): void {
    this.commands.push({ type: 'moveTo', args: [x, y] });
  }
  lineTo(x: number, y: number): void {
    this.commands.push({ type: 'lineTo', args: [x, y] });
  }
  bezierCurveTo(
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x: number, y: number
  ): void {
    this.commands.push({ type: 'bezierCurveTo', args: [cp1x, cp1y, cp2x, cp2y, x, y] });
  }
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.commands.push({ type: 'quadraticCurveTo', args: [cpx, cpy, x, y] });
  }
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.commands.push({ type: 'arc', args: [x, y, radius, startAngle, endAngle] });
  }
  closePath(): void {
    this.commands.push({ type: 'closePath', args: [] });
  }
  rect(x: number, y: number, w: number, h: number): void {
    this.commands.push({ type: 'rect', args: [x, y, w, h] });
  }

  /** Get the list of path commands (for testing/debugging). */
  getCommands(): Array<{ type: string; args: number[] }> {
    return this.commands;
  }
}

// Only polyfill if Path2D doesn't exist (jsdom)
if (typeof globalThis.Path2D === 'undefined') {
  (globalThis as Record<string, unknown>).Path2D = Path2DPolyfill;
}
