/**
 * Bevy-inspired Entity Component System (ECS) Architecture
 * Provides archetype-style component storage, queries, and system registration.
 */

import {
  EntityId,
  EntityKind,
  GridPosition,
  Health,
  Flammable,
  HazardState,
  Faction,
  AIComponent,
  ExplosiveComponent,
  LootComponent,
  VisualComponent,
  SpawnerComponent,
  WeaponHardpoint,
  ResistanceComponent,
  ProjectileComponent,
  TransformComponent,
  ResidentComponent,
  FollowTargetComponent,
  StructureComponent,
} from '../types';

export class World {
  private nextEntityId: EntityId = 1;
  private activeEntities: Set<EntityId> = new Set();

  // Component Storages
  public kinds: Map<EntityId, EntityKind> = new Map();
  public gridPositions: Map<EntityId, GridPosition> = new Map();
  public transforms: Map<EntityId, TransformComponent> = new Map();
  public healths: Map<EntityId, Health> = new Map();
  public flammables: Map<EntityId, Flammable> = new Map();
  public hazardStates: Map<EntityId, HazardState> = new Map();
  public factions: Map<EntityId, Faction> = new Map();
  public aiComponents: Map<EntityId, AIComponent> = new Map();
  public explosives: Map<EntityId, ExplosiveComponent> = new Map();
  public loots: Map<EntityId, LootComponent> = new Map();
  public visuals: Map<EntityId, VisualComponent> = new Map();
  public spawners: Map<EntityId, SpawnerComponent> = new Map();
  public weapons: Map<EntityId, WeaponHardpoint> = new Map();
  public resistances: Map<EntityId, ResistanceComponent> = new Map();
  public projectiles: Map<EntityId, ProjectileComponent> = new Map();
  public residents: Map<EntityId, ResidentComponent> = new Map();
  public followers: Map<EntityId, FollowTargetComponent> = new Map();
  public structures: Map<EntityId, StructureComponent> = new Map();

  // ADR 007 Systemic Projectile Memory Pool (prevents garbage collection churn)
  private projectilePoolIds: EntityId[] = [];
  public readonly POOL_SIZE = 128;

  constructor() {
    this.initProjectilePool();
  }

  /**
   * Pre-allocates fixed projectile entities in memory.
   */
  public initProjectilePool(): void {
    this.projectilePoolIds = [];
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const id = this.spawn('Projectile');
      this.projectilePoolIds.push(id);
      this.projectiles.set(id, {
        isActive: false,
        element: 'kinetic',
        damage: 0,
        knockback: 0,
        piercing: false,
        startX: 0,
        startY: 0,
        currentX: -100,
        currentY: -100,
        vx: 0,
        vy: 0,
        range: 0,
        distanceTraveled: 0,
        sourceEntityId: 0,
        hitEntityIds: new Set(),
        isHostile: false,
      });
      this.visuals.set(id, {
        renderX: -100,
        renderY: -100,
        facingAngle: 0,
        flashTime: 0,
        colorOverride: '#fbbf24',
      });
    }
  }

  /**
   * Acquires an inactive projectile from the memory pool.
   */
  public acquireProjectile(): EntityId | null {
    for (const id of this.projectilePoolIds) {
      const p = this.projectiles.get(id);
      if (p && !p.isActive) {
        return id;
      }
    }
    // If pool is fully saturated, recycle the first projectile
    if (this.projectilePoolIds.length > 0) {
      const recycledId = this.projectilePoolIds[0];
      this.releaseProjectile(recycledId);
      return recycledId;
    }
    return null;
  }

  /**
   * Recycles a projectile back into the pool without despawning.
   */
  public releaseProjectile(id: EntityId): void {
    const p = this.projectiles.get(id);
    if (p) {
      p.isActive = false;
      p.isHostile = false;
      p.currentX = -100;
      p.currentY = -100;
      p.vx = 0;
      p.vy = 0;
      p.hitEntityIds.clear();
    }
    const v = this.visuals.get(id);
    if (v) {
      v.renderX = -100;
      v.renderY = -100;
    }
  }

  /**
   * Spawns a new entity and returns its unique ID
   */
  public spawn(kind: EntityKind): EntityId {
    const id = this.nextEntityId++;
    this.activeEntities.add(id);
    this.kinds.set(id, kind);
    return id;
  }

  /**
   * Despawns an entity and removes all attached components
   */
  public despawn(id: EntityId): void {
    this.activeEntities.delete(id);
    this.kinds.delete(id);
    this.gridPositions.delete(id);
    this.transforms.delete(id);
    this.healths.delete(id);
    this.flammables.delete(id);
    this.hazardStates.delete(id);
    this.factions.delete(id);
    this.aiComponents.delete(id);
    this.explosives.delete(id);
    this.loots.delete(id);
    this.visuals.delete(id);
    this.spawners.delete(id);
    this.weapons.delete(id);
    this.resistances.delete(id);
    this.projectiles.delete(id);
    this.residents.delete(id);
    this.followers.delete(id);
    this.structures.delete(id);
  }

  public isAlive(id: EntityId): boolean {
    return this.activeEntities.has(id);
  }

  public getAllEntities(): EntityId[] {
    return Array.from(this.activeEntities);
  }

  public getEntityCount(): number {
    return this.activeEntities.size;
  }

  /**
   * Query entities that have a specific combination of components
   */
  public queryGridEntities(): { id: EntityId; pos: GridPosition; kind: EntityKind }[] {
    const results: { id: EntityId; pos: GridPosition; kind: EntityKind }[] = [];
    for (const id of this.activeEntities) {
      const pos = this.gridPositions.get(id);
      const kind = this.kinds.get(id);
      if (pos && kind) {
        results.push({ id, pos, kind });
      }
    }
    return results;
  }

  public queryCombatants(): {
    id: EntityId;
    pos: GridPosition;
    health: Health;
    faction: Faction;
    visual: VisualComponent;
  }[] {
    const results: {
      id: EntityId;
      pos: GridPosition;
      health: Health;
      faction: Faction;
      visual: VisualComponent;
    }[] = [];
    for (const id of this.activeEntities) {
      const pos = this.gridPositions.get(id);
      const health = this.healths.get(id);
      const faction = this.factions.get(id);
      const visual = this.visuals.get(id);
      if (pos && health && faction && visual) {
        results.push({ id, pos, health, faction, visual });
      }
    }
    return results;
  }

  public queryFlammables(): {
    id: EntityId;
    pos: GridPosition;
    flammable: Flammable;
    health?: Health;
  }[] {
    const results: {
      id: EntityId;
      pos: GridPosition;
      flammable: Flammable;
      health?: Health;
    }[] = [];
    for (const id of this.activeEntities) {
      const pos = this.gridPositions.get(id);
      const flammable = this.flammables.get(id);
      if (pos && flammable) {
        results.push({
          id,
          pos,
          flammable,
          health: this.healths.get(id),
        });
      }
    }
    return results;
  }

  public queryAI(): {
    id: EntityId;
    pos: GridPosition;
    ai: AIComponent;
    health: Health;
    faction: Faction;
    visual: VisualComponent;
  }[] {
    const results: {
      id: EntityId;
      pos: GridPosition;
      ai: AIComponent;
      health: Health;
      faction: Faction;
      visual: VisualComponent;
    }[] = [];
    for (const id of this.activeEntities) {
      const pos = this.gridPositions.get(id);
      const ai = this.aiComponents.get(id);
      const health = this.healths.get(id);
      const faction = this.factions.get(id);
      const visual = this.visuals.get(id);
      if (pos && ai && health && faction && visual) {
        results.push({ id, pos, ai, health, faction, visual });
      }
    }
    return results;
  }

  public queryExplosives(): {
    id: EntityId;
    pos: GridPosition;
    explosive: ExplosiveComponent;
  }[] {
    const results: {
      id: EntityId;
      pos: GridPosition;
      explosive: ExplosiveComponent;
    }[] = [];
    for (const id of this.activeEntities) {
      const pos = this.gridPositions.get(id);
      const explosive = this.explosives.get(id);
      if (pos && explosive) {
        results.push({ id, pos, explosive });
      }
    }
    return results;
  }

  public clear(): void {
    this.activeEntities.clear();
    this.kinds.clear();
    this.gridPositions.clear();
    this.transforms.clear();
    this.healths.clear();
    this.flammables.clear();
    this.hazardStates.clear();
    this.factions.clear();
    this.aiComponents.clear();
    this.explosives.clear();
    this.loots.clear();
    this.visuals.clear();
    this.spawners.clear();
    this.weapons.clear();
    this.resistances.clear();
    this.projectiles.clear();
    this.residents.clear();
    this.followers.clear();
    this.structures.clear();
    this.nextEntityId = 1;
    this.initProjectilePool();
  }
}
