import type {Inventory} from '../data/materials';
import { PLAYER, requiredExp } from '../data/config';
import { readWardrobe, type Wardrobe } from '../data/shop';
import type { LearningProgress } from '../education/types';
import type { ActiveTool } from '../data/tools';
export interface Progress { inventory:Inventory; level: number; exp: number; gold: number; kills: number; learning: LearningProgress; wardrobe: Wardrobe; tool:ActiveTool }
export const newProgress = (): Progress => ({ inventory:{}, level: 1, exp: 0, gold: 0, kills: 0, tool:'scissors', wardrobe:readWardrobe(), learning: { rank: '입문', completedMissionIds: [] } });
export class ProgressionSystem {
  constructor(public state: Progress) {}
  get maxHp() { return PLAYER.baseHp + (this.state.level - 1) * PLAYER.hpPerLevel; }
  get attack() { return PLAYER.baseAttack + (this.state.level - 1) * PLAYER.attackPerLevel; }
  reward(exp: number, gold: number, kill = true) {
    this.state.exp += exp; this.state.gold += gold; if (kill) this.state.kills++;
    let levels = 0;
    while (this.state.exp >= requiredExp(this.state.level) && this.state.level < 100) { this.state.exp -= requiredExp(this.state.level); this.state.level++; levels++; }
    return levels;
  }
}
