import { World } from '../ecs';
import { TileState, ActiveBuffs } from '../../types';
import { ISystem } from '../core/system-types';
import { STRUCTURE_BLUEPRINTS } from '../blueprints';
import { sound } from '../audio';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM: Physical ECS Construction & Megabase Buff Engine (10Hz - ADR 011)
 * Validates grid-snapped 3x3 structure placement, deducts Inert Matter,
 * instantiates physical structures in the Faraday Sanctuary, and computes
 * passive operational buffs (Damage, Regeneration, Armor, Velocity).
 */
export class BuildSystem implements ISystem {
  public readonly name = 'BuildSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    // 1. Recalculate Active Operational Buffs from Built Structures
    const buffs: ActiveBuffs = {
      damageBonus: 0,
      regenRate: 0,
      armorRating: 0,
      speedMultiplier: 1.0,
    };

    for (const [, struct] of world.structures.entries()) {
      if (struct.buffType === 'damage') buffs.damageBonus += struct.buffValue;
      if (struct.buffType === 'regen') buffs.regenRate += struct.buffValue;
      if (struct.buffType === 'armor') buffs.armorRating += struct.buffValue;
      if (struct.buffType === 'speed') buffs.speedMultiplier += struct.buffValue;
    }

    sim.activeBuffs = buffs;

    // 2. Apply passive health regeneration from Biolabs if damaged
    if (buffs.regenRate > 0 && !sim.isPlayerDead) {
      const playerHealth = world.healths.get(sim.playerEntityId);
      if (playerHealth && playerHealth.current < playerHealth.max) {
        playerHealth.current = Math.min(playerHealth.max, playerHealth.current + buffs.regenRate * dt);
      }
    }
  }

  /**
   * Evaluates whether a 3x3 structure can be placed at the given top-left grid tile (originX, originY).
   */
  public static canPlaceStructure(
    blueprintId: string,
    originX: number,
    originY: number,
    world: World,
    map: TileState[][],
    availableScrap: number
  ): { valid: boolean; reason?: string } {
    const bp = STRUCTURE_BLUEPRINTS[blueprintId];
    if (!bp) return { valid: false, reason: 'Invalid blueprint specification' };

    if (availableScrap < bp.cost) {
      return { valid: false, reason: `Insufficient scrap (${availableScrap}/${bp.cost})` };
    }

    // 1. Must be strictly inside the Faraday Sanctuary (82 <= x <= 118, 82 <= y <= 118)
    const maxX = originX + bp.width;
    const maxY = originY + bp.height;

    if (originX < 82 || maxX > 118 || originY < 82 || maxY > 118) {
      return { valid: false, reason: 'Construction only permitted inside Faraday Sanctuary' };
    }

    // 2. Must not overlap Sanctuary Core (center at 100, 100, clear radius 3)
    for (let y = originY; y < maxY; y++) {
      for (let x = originX; x < maxX; x++) {
        if (Math.abs(x - 100) <= 2 && Math.abs(y - 100) <= 2) {
          return { valid: false, reason: 'Area reserved for Sanctuary Core Terminal' };
        }

        // Must not overlap any existing solid wall
        const tile = map[y]?.[x];
        if (!tile || tile.wallEntityId !== null) {
          return { valid: false, reason: 'Footprint blocked by bulkhead' };
        }
      }
    }

    // 3. Must not overlap existing structures
    for (const [, existing] of world.structures.entries()) {
      const ex1 = existing.originX;
      const ex2 = existing.originX + existing.width;
      const ey1 = existing.originY;
      const ey2 = existing.originY + existing.height;

      const overlapX = originX < ex2 && maxX > ex1;
      const overlapY = originY < ey2 && maxY > ey1;
      if (overlapX && overlapY) {
        return { valid: false, reason: 'Footprint overlaps an existing facility' };
      }
    }

    return { valid: true };
  }

  /**
   * Instantiates the 3x3 structure into the ECS world and deducts cost.
   */
  public static placeStructure(
    blueprintId: string,
    originX: number,
    originY: number,
    world: World,
    map: TileState[][],
    sim: Simulation
  ): boolean {
    const totalScrap = sim.bankedScrap + sim.scrapCollectedInRaid;
    const check = BuildSystem.canPlaceStructure(blueprintId, originX, originY, world, map, totalScrap);
    if (!check.valid) {
      sim.addLog('info', `[CONSTRUCTION BLOCKED] ${check.reason}`);
      sound.playDryFire();
      return false;
    }

    const bp = STRUCTURE_BLUEPRINTS[blueprintId];

    // Deduct cost prioritizing carried scrap, then banked scrap
    let remainingCost = bp.cost;
    if (sim.scrapCollectedInRaid >= remainingCost) {
      sim.scrapCollectedInRaid -= remainingCost;
      remainingCost = 0;
    } else {
      remainingCost -= sim.scrapCollectedInRaid;
      sim.scrapCollectedInRaid = 0;
      sim.bankedScrap -= remainingCost;
    }

    const structEntityId = world.spawn('Structure');
    world.gridPositions.set(structEntityId, {
      x: originX + bp.width / 2,
      y: originY + bp.height / 2,
    });
    world.structures.set(structEntityId, {
      blueprintId: bp.id,
      name: bp.name,
      originX,
      originY,
      width: bp.width,
      height: bp.height,
      level: 1,
      color: bp.color,
      accentColor: bp.accentColor,
      buffType: bp.buffType,
      buffValue: bp.buffValue,
    });
    world.visuals.set(structEntityId, {
      renderX: originX + bp.width / 2,
      renderY: originY + bp.height / 2,
      facingAngle: 0,
      flashTime: 0,
      colorOverride: bp.color,
    });

    sim.addLog('loot', `[CONSTRUCTION COMPLETE] Assembled [${bp.name}]! Active buff applied.`);
    sim.spawnParticles(originX + 1.5, originY + 1.5, 20, 'blast', bp.color);
    sound.playUpgradeSuccess();
    return true;
  }
}
