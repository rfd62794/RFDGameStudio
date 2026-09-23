import { Ant, Colony, SimConfig } from './types';
import { ColonyLifecycle } from './colony_lifecycle';

export class CombatSystem {
  public encounterRadius: number;
  public baseRequiredRatio: number;
  public baseCombatDamage: number;
  public contactRadius: number = 12;

  constructor(public config: SimConfig) {
    this.encounterRadius = config.encounterRadius ?? 40;
    this.baseRequiredRatio = config.baseRequiredRatio ?? 1.2;
    this.baseCombatDamage = config.baseCombatDamage ?? 0.05;
  }

  public assessEncounter(ant: Ant, ownColony: Colony, enemyColony: Colony): void {
    if (ant.health <= 0) {
      ant.combatAction = undefined;
      ant.combatAllyCount = undefined;
      ant.combatEnemyCount = undefined;
      return;
    }

    // 1. Count real living enemies within encounterRadius
    const isInSharedLane = ant.y >= 200 && ant.y <= 600;
    const isAntInfiltrator = ant.currentAction === 'infiltrate' || ant.currentAction === 'smuggle_home';

    const enemiesInRange: Ant[] = [];
    for (const enemy of enemyColony.ants) {
      if (enemy.health <= 0) continue;
      const dist = Math.hypot(enemy.x - ant.x, enemy.y - ant.y);
      if (dist <= this.encounterRadius) {
        const isEnemyInfiltrator = enemy.currentAction === 'infiltrate' || enemy.currentAction === 'smuggle_home';
        if (isInSharedLane || isAntInfiltrator || isEnemyInfiltrator) {
          enemiesInRange.push(enemy);
        }
      }
    }

    // 2. If no enemies within range, clear combatAction and return
    if (enemiesInRange.length === 0) {
      ant.combatAction = undefined;
      ant.combatAllyCount = undefined;
      ant.combatEnemyCount = undefined;
      return;
    }

    // 3. Count real living allies within encounterRadius
    let allyCount = 0;
    for (const ally of ownColony.ants) {
      if (ally.health <= 0 || ally.id === ant.id) continue;
      const dist = Math.hypot(ally.x - ant.x, ally.y - ant.y);
      if (dist <= this.encounterRadius) {
        allyCount++;
      }
    }

    const totalAllies = allyCount + 1; // +1 counts ant itself
    const totalEnemies = enemiesInRange.length;

    ant.combatAllyCount = totalAllies;
    ant.combatEnemyCount = totalEnemies;

    // 4. Compute localRatio = (allyCount + 1) / enemyCount
    const localRatio = totalAllies / totalEnemies;

    // 5. Compute ageFraction and requiredRatio
    const maxAge = this.config.workerMaxAge ?? 20000;
    const ageFraction = Math.min(1.0, Math.max(0.0, (ant.age || 0) / maxAge));
    const requiredRatio = this.baseRequiredRatio * (1.0 - 0.5 * ageFraction);

    // 6. Set combatAction
    const isInOwnTerritory = (ant.colonyId ?? ownColony.id) === 0
      ? ant.y >= 600
      : ant.y <= 200;

    const isDefenderAgainstIntruder = isInOwnTerritory && !isAntInfiltrator && enemiesInRange.some(e => e.currentAction === 'infiltrate' || e.currentAction === 'smuggle_home');

    if (isDefenderAgainstIntruder) {
      ant.combatAction = 'engage';
    } else if (localRatio >= requiredRatio) {
      ant.combatAction = 'engage';
    } else {
      ant.combatAction = 'flee';

      // Apply flee steering bias away from nearest enemy
      let nearestEnemy = enemiesInRange[0];
      let minDist = Math.hypot(nearestEnemy.x - ant.x, nearestEnemy.y - ant.y);
      for (let i = 1; i < enemiesInRange.length; i++) {
        const d = Math.hypot(enemiesInRange[i].x - ant.x, enemiesInRange[i].y - ant.y);
        if (d < minDist) {
          minDist = d;
          nearestEnemy = enemiesInRange[i];
        }
      }

      const dx = nearestEnemy.x - ant.x;
      const dy = nearestEnemy.y - ant.y;
      const dist = Math.hypot(dx, dy);

      let repX = 0;
      let repY = 0;

      if (dist >= 0.001) {
        repX = -dx / dist;
        repY = -dy / dist;
      } else {
        const speed = Math.hypot(ant.vx, ant.vy);
        if (speed > 0.0001) {
          const sideSign = (ant.id % 2 === 0) ? 1 : -1;
          repX = (-ant.vy / speed) * sideSign;
          repY = (ant.vx / speed) * sideSign;
        }
      }

      const repStrength = 0.70;
      const targetSpeed = this.config.antSpeed;
      ant.vx = ant.vx + repX * repStrength * targetSpeed;
      ant.vy = ant.vy + repY * repStrength * targetSpeed;

      const newSpeed = Math.hypot(ant.vx, ant.vy);
      if (newSpeed > 0.0001) {
        ant.vx = (ant.vx / newSpeed) * targetSpeed;
        ant.vy = (ant.vy / newSpeed) * targetSpeed;
      }
    }
  }

  public resolveCombat(colonyA: Colony, colonyB: Colony, colonyLifecycle?: ColonyLifecycle): void {
    const contactsA: { ant: Ant; damage: number }[] = [];
    const contactsB: { ant: Ant; damage: number }[] = [];

    // Evaluate engaging ants in Colony A
    for (const antA of colonyA.ants) {
      if (antA.health <= 0 || antA.combatAction !== 'engage') continue;

      let inContact = false;
      for (const antB of colonyB.ants) {
        if (antB.health <= 0 || antB.combatAction !== 'engage') continue;
        const dist = Math.hypot(antA.x - antB.x, antA.y - antB.y);
        if (dist <= this.contactRadius) {
          inContact = true;
          break;
        }
      }

      if (inContact) {
        const allies = antA.combatAllyCount ?? 1;
        const enemies = antA.combatEnemyCount ?? 1;
        const damage = this.baseCombatDamage * (enemies ** 2) / Math.max(1, allies ** 2);
        contactsA.push({ ant: antA, damage });
      }
    }

    // Evaluate engaging ants in Colony B
    for (const antB of colonyB.ants) {
      if (antB.health <= 0 || antB.combatAction !== 'engage') continue;

      let inContact = false;
      for (const antA of colonyA.ants) {
        if (antA.health <= 0 || antA.combatAction !== 'engage') continue;
        const dist = Math.hypot(antB.x - antA.x, antB.y - antA.y);
        if (dist <= this.contactRadius) {
          inContact = true;
          break;
        }
      }

      if (inContact) {
        const allies = antB.combatAllyCount ?? 1;
        const enemies = antB.combatEnemyCount ?? 1;
        const damage = this.baseCombatDamage * (enemies ** 2) / Math.max(1, allies ** 2);
        contactsB.push({ ant: antB, damage });
      }
    }

    // Apply calculated damage
    for (const item of contactsA) {
      item.ant.lastDamageSource = 'combat';
      if (colonyLifecycle) {
        colonyLifecycle.damageAnt(item.ant, item.damage);
      } else {
        item.ant.health = Math.max(0, item.ant.health - item.damage);
      }
    }

    for (const item of contactsB) {
      item.ant.lastDamageSource = 'combat';
      if (colonyLifecycle) {
        colonyLifecycle.damageAnt(item.ant, item.damage);
      } else {
        item.ant.health = Math.max(0, item.ant.health - item.damage);
      }
    }
  }
}
