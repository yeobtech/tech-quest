export const PLAYER = { speed: 240, jump: 481, baseHp: 100, hpPerLevel: 15, baseAttack: 18, attackPerLevel: 3, cooldown: 380, invulnerability: 1100 };
export const WORLD_GRAVITY = 1200;
export const LEVEL_EXP = [0, 100, 180, 280, 420, 600, 840, 1120, 1460, 1860];
export const requiredExp = (level: number) => LEVEL_EXP[level] ?? Math.round(1860 * Math.pow(1.24, level - 9));
export type EnemyKind = 'slime' | 'bot';
export const ENEMIES = {
  slime: { name: '새싹 슬라임', hp: 36, speed: 48, damage: 8, exp: 18, gold: 8, respawn: 6000, color: 0x8edb83 },
  bot: { name: '고장난 로봇', hp: 65, speed: 65, damage: 13, exp: 32, gold: 15, respawn: 8500, color: 0xf1bc73 },
} satisfies Record<EnemyKind, object>;
