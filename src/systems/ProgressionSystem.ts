import { PLAYER, requiredExp } from '../data/config';
import type { LearningProgress } from '../education/types';
export interface Progress { level: number; exp: number; gold: number; kills: number; learning: LearningProgress }
export const newProgress = (): Progress => ({ level: 1, exp: 0, gold: 0, kills: 0, learning: { rank: '입문', completedMissionIds: [] } });
export class ProgressionSystem {
  constructor(public state: Progress) {}
  get maxHp() { return PLAYER.baseHp + (this.state.level - 1) * PLAYER.hpPerLevel; }
  get attack() { return PLAYER.baseAttack + (this.state.level - 1) * PLAYER.attackPerLevel; }
  reward(exp: number, gold: number) {
    this.state.exp += exp; this.state.gold += gold; this.state.kills++;
    let levels = 0;
    while (this.state.exp >= requiredExp(this.state.level) && this.state.level < 100) { this.state.exp -= requiredExp(this.state.level); this.state.level++; levels++; }
    return levels;
  }
}
