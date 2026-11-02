import { newProgress, type Progress } from './ProgressionSystem';
import { readWardrobe } from '../data/shop';
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
      const result = { ...newProgress(), level: p.level, exp: p.exp, gold: p.gold, kills: p.kills, wardrobe: readWardrobe(p.wardrobe) };
      if (['입문','탐구','설계','제작'].includes(p.learning?.rank) && Array.isArray(p.learning.completedMissionIds) && p.learning.completedMissionIds.every((v:unknown)=>typeof v==='string')) result.learning=p.learning;
      return result;
    } catch { return newProgress(); }
  }
  save(progress: Progress): boolean { try { this.storage.setItem(KEY, JSON.stringify({ version: 1, progress })); return true; } catch { return false; } }
}
