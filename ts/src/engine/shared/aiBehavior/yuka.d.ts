declare module 'yuka' {
  /**
   * Minimal type declarations for the Yuka AI library.
   * Only the FSM (State/StateMachine) subset is declared —
   * Yuka's steering-behavior classes are intentionally NOT
   * declared here, enforcing the boundary that they must not
   * be imported or used in this studio.
   */

  export class State {
    enter(owner?: any): void;
    execute(owner?: any): void;
    exit(owner?: any): void;
    onMessage(owner?: any, telegram?: any): boolean;
    toJSON(): Record<string, unknown>;
    fromJSON(json: Record<string, unknown>): this;
    resolveReferences(entities?: Map<string, GameEntity>): this;
  }

  export class StateMachine {
    constructor(owner?: GameEntity);
    currentState: State | null;
    previousState: State | null;
    globalState: State | null;
    owner: GameEntity | null;
    states: Map<string, State>;

    update(): void;
    add(id: string, state: State): this;
    remove(id: string): this;
    get(id: string): State | undefined;
    changeTo(id: string): this;
    revert(): this;
    in(id: string): boolean;
    handleMessage(telegram: any): boolean;
    toJSON(): Record<string, unknown>;
    fromJSON(json: Record<string, unknown>): this;
    resolveReferences(entities?: Map<string, GameEntity>): this;
    registerType(type: string, constructor: new (...args: any[]) => State): this;
  }

  // Referenced in signatures but not used by this studio.
  export class GameEntity {
    uuid: string;
    name: string;
  }
}
