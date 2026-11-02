import { newProgress, type Progress } from './ProgressionSystem';
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
      return { ...newProgress(), level: p.level, exp: p.exp, gold: p.gold, kills: p.kills };
    } catch { return newProgress(); }
  }
  save(progress: Progress): boolean { try { this.storage.setItem(KEY, JSON.stringify({ version: 1, progress })); return true; } catch { return false; } }
}
