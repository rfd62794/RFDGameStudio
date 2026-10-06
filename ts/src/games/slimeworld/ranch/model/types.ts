// new: ts/src/games/slimeworld/ranch/model/types.ts
/** Injectable random source: a function returning a number in [0, 1). Ranch code never reads a global random or clock source. */
export type Rng = () => number;

export type Affinity = 'none' | 'meadow' | 'frost' | 'fire' | 'cave';
export type SlimeSize = 'S' | 'M' | 'L';
export type ZoneId = 'meadow' | 'frost';

export interface Traits {
  /** Index into the ranch colour palette (a small integer; the palette itself is a later UI concern). */
  colorIndex: number;
  size: SlimeSize;
  affinity: Affinity;
}

/** How many fruit of each element this slime has been fed since it was caught or mixed. */
export type Lean = Partial<Record<Affinity, number>>;

export interface Slime {
  id: string;
  speciesId: string;
  traits: Traits;
  lean: Lean;
}

export interface SaleRecord {
  speciesId: string;
  atAction: number;
}

export interface RanchState {
  /** Slimes carried home, at most PEN_CAPACITY. */
  pen: Slime[];
  /** Fruit in the basket or Hub, by fruit id. */
  fruit: Record<string, number>;
  /** Plorts owned, by species id (one plort type per species). */
  plorts: Record<string, number>;
  /** Species ids ever owned: the collection grid fills from this. */
  collection: string[];
  /** Proceeds of selling plorts. PROPOSED name: Robert's "plorts are the single currency" wording is unresolved. */
  plortCredit: number;
  /** Hub actions taken (feed, mix, sell). The only clock: nothing here uses real time. */
  actionCount: number;
  /** Recent sales, for flood-decay pricing. */
  sales: SaleRecord[];
  /** Counter for new slime ids. */
  nextId: number;
}

/** Every rule function returns a new state or a plain reason; none throws and none mutates its input. */
export type RuleResult<T> = ({ ok: true } & T) | { ok: false; reason: string };
