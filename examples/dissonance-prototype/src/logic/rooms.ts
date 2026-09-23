import { NodeDefinition } from '../types';

export type RoomType =
  | { type: 'StandardFight'; enemyName: string; enemyHp: number }
  | { type: 'Rest' }
  | { type: 'Boss'; enemyName: string; enemyHp: number; rewardTier: 'same' | 'adjacent' | 'opposed' };

export function StandardFight(enemyName: string, enemyHp: number): RoomType {
  return { type: 'StandardFight', enemyName, enemyHp };
}

export function Rest(): RoomType {
  return { type: 'Rest' };
}

export function Boss(enemyName: string, enemyHp: number, rewardTier: 'same' | 'adjacent' | 'opposed'): RoomType {
  return { type: 'Boss', enemyName, enemyHp, rewardTier };
}

export function composeSequence(pattern: RoomType[]): NodeDefinition[] {
  return pattern.map((room, index) => {
    const id = index + 1;
    if (room.type === 'StandardFight') {
      return {
        id,
        type: 'fight',
        enemyName: room.enemyName,
        enemyHp: room.enemyHp,
      };
    } else if (room.type === 'Boss') {
      return {
        id,
        type: 'fight',
        enemyName: room.enemyName,
        enemyHp: room.enemyHp,
        rewardTier: room.rewardTier,
      };
    } else {
      return {
        id,
        type: 'rest_craft',
      };
    }
  });
}
