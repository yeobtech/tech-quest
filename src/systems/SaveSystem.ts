import {readExam} from '../education/promotion';
import {readStage1} from '../education/stage1';
import {earned,readJournal} from '../data/quests';
import {readInventory} from '../data/materials';
import { newProgress, type Progress } from './ProgressionSystem';
import { readWardrobe } from '../data/shop';
import { restoreTool } from '../data/tools';
const KEY = 'tech-quest:v1';
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export class SaveSystem {
  constructor(private storage: StoragePort) {}
  load(): Progress {
    try {
      const data = JSON.parse(this.storage.getItem(KEY) ?? 'null');
      if (data?.version !== 1) return newProgress();
      const p = data.progress;
      if (!p || !['level', 'exp', 'gold', 'kills'].every(k => Number.isSafeInteger(p[k]) && p[k] >= 0) || p.level < 1 || p.level > 100) return newProgress();
      const result = { ...newProgress(), inventory:readInventory(p.inventory), level: p.level, exp: p.exp, gold: p.gold, kills: p.kills, wardrobe: readWardrobe(p.wardrobe) };
      if (['입문','탐구','설계','제작'].includes(p.learning?.rank) && Array.isArray(p.learning.completedMissionIds) && p.learning.completedMissionIds.every((v:unknown)=>typeof v==='string')) result.learning=p.learning;
      result.stage1=readStage1(p.stage1);
      result.exam=readExam(p.exam,result);
      result.factoryCleared=p.factoryCleared===true;
      result.journal=readJournal(p.journal);
      result.achieved=Array.isArray(p.achieved)?p.achieved:[];
      result.achieved=earned(result);
      result.tool=restoreTool(p.tool,result.learning.completedMissionIds);
      return result;
    } catch { return newProgress(); }
  }
  save(progress: Progress): boolean { try { const achieved=earned(progress); this.storage.setItem(KEY, JSON.stringify({ version: 1, progress:{...progress,achieved} })); progress.achieved=achieved; return true; } catch { return false; } }
}

