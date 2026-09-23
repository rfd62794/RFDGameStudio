/**
 * Combat system types — shared between games that use the
 * Circle/Square/Triangle RPS combat resolver.
 *
 * Currently consumed by Planet of Greed (converted from examples/).
 * CorpWorld (examples/corpworld/) has its own byte-identical copy and
 * is retired, not converted — its copy stays as a reference artifact.
 */

export type UnitType = 'circle' | 'square' | 'triangle';

export interface UnitGroup {
  circle: number;
  square: number;
  triangle: number;
}

export interface CombatLogEntry {
  round: number;
  message: string;
  survivingUnits: { [corpId: string]: UnitGroup };
}

export interface CellCombatState {
  cellId: number;
  cellName: string;
  initialUnits: { [corpId: string]: UnitGroup };
  roundsLog: CombatLogEntry[];
  victorId: string | null;
  finalUnits: { [corpId: string]: UnitGroup };
  fortificationsLost: number;
}
