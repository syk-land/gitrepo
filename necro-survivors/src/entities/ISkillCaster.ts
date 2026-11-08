import { CombatStats } from '../data/types';

export interface Vector2 {
  x: number;
  y: number;
}

export interface ISkillCaster {
  getPosition(): Vector2;
  getFacingDirection(): Vector2;
  getEffectiveStats(): CombatStats;
  isAlive(): boolean;
  getCasterName(): string;
}
