import {newStage1,type Stage1Progress} from '../education/stage1';
import {factoryReward} from '../data/factory';
import {ready,type Journal,type Quest} from '../data/quests';
import type {Inventory} from '../data/materials';
import { PLAYER, requiredExp } from '../data/config';
import { readWardrobe, type Wardrobe } from '../data/shop';
import type { LearningProgress } from '../education/types';
import type { ActiveTool } from '../data/tools';
export interface Progress { stage1:Stage1Progress; factoryCleared:boolean; journal:Journal; achieved:string[]; inventory:Inventory; level: number; exp: number; gold: number; kills: number; learning: LearningProgress; wardrobe: Wardrobe; tool:ActiveTool }
export const newProgress = (): Progress => ({ stage1:newStage1(), factoryCleared:false, journal:{}, achieved:[], inventory:{}, level: 1, exp: 0, gold: 0, kills: 0, tool:'scissors', wardrobe:readWardrobe(), learning: { rank: '입문', completedMissionIds: [] } });
export class ProgressionSystem {
  constructor(public state: Progress) {}
  questAction(q:Quest,atBoard:boolean,save:(next:Progress)=>boolean){
    const next={...this.state,journal:{...this.state.journal}};
    const claim=ready(this.state,q);
    if(claim){
      next.journal[q.id]='claimed';
      new ProgressionSystem(next).reward(q.exp,q.gold,false);
    }else if(atBoard && next.journal[q.id]===undefined)next.journal[q.id]=0;
    else return 'unavailable';
    if(!save(next))return 'failed';
    Object.assign(this.state,next);
    return claim?'claimed':'accepted';
  }
  clearFactory(save:(next:Progress)=>boolean){
    if(this.state.factoryCleared)return 'repeat';
    const next={...this.state,factoryCleared:true};
    new ProgressionSystem(next).reward(factoryReward.exp,factoryReward.gold,false);
    if(!save(next))return 'failed';
    Object.assign(this.state,next);
    return 'first';
  }
  get maxHp() { return PLAYER.baseHp + (this.state.level - 1) * PLAYER.hpPerLevel; }
  get attack() { return PLAYER.baseAttack + (this.state.level - 1) * PLAYER.attackPerLevel; }
  reward(exp: number, gold: number, kill = true) {
    this.state.exp += exp; this.state.gold += gold; if (kill) this.state.kills++;
    let levels = 0;
    while (this.state.exp >= requiredExp(this.state.level) && this.state.level < 100) { this.state.exp -= requiredExp(this.state.level); this.state.level++; levels++; }
    return levels;
  }
}

