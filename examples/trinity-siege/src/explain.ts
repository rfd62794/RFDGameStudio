/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// One plain sentence per duel: why it went the way it did. Pure, no React.
import { DuelLog, SHAPE_MATRIX, UnitShape } from "./types";

const SHAPES = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE];

/** The shape that beats `shape` (SHAPE_MATRIX[x][shape] > 1). */
export function counterTo(shape: UnitShape): UnitShape {
  return SHAPES.find(s => SHAPE_MATRIX[s][shape] > 1.0) ?? shape;
}

export function explainDuel(d: DuelLog): string {
  const defEdge = SHAPE_MATRIX[d.defenderShape][d.attackerShape]; // >1 = defender's shape counters
  const wall = d.defenderHasWall ? " The wall doubled its strength." : "";
  if (d.outcome === "both_die") {
    return "Evenly matched: both fell.";
  }
  if (d.outcome === "defender_wins") {
    if (defEdge > 1) return `${d.defenderShape} counters ${d.attackerShape}, so your defender won easily.${wall}`;
    if (defEdge < 1) return `${d.attackerShape} counters ${d.defenderShape}, but your defender was strong enough to win.${wall}`;
    return `Same shape, and your defender was stronger.${wall}`;
  }
  if (defEdge < 1) {
    return `${d.attackerShape} counters ${d.defenderShape}. Next time put a ${counterTo(d.attackerShape)} here.`;
  }
  if (defEdge > 1) return `Your ${d.defenderShape} had the edge, but the attacker was much stronger. Add more defenders or a wall.`;
  return `Same shape, and the attacker was stronger. Add a wall or another defender.`;
}
