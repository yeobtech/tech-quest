export const PLAYER = { speed: 240, acceleration: 2100, drag: 3000, coyote: 85, buffer: 110, windup: 95, swing: 230, jump: 481, baseHp: 100, hpPerLevel: 15, baseAttack: 18, attackPerLevel: 3, cooldown: 380, invulnerability: 1100 };
export const WORLD_GRAVITY = 1200;
export const LEVEL_EXP = [0, 100, 180, 280, 420, 600, 840, 1120, 1460, 1860];
export const requiredExp = (level: number) => LEVEL_EXP[level] ?? Math.round(1860 * Math.pow(1.24, level - 9));
export type EnemyKind = 'slime' | 'bot' | 'motor' | 'drone' | 'drill';
export const ENEMIES = {
  drill:{name:'굴착 드릴봇',hp:54,speed:48,damage:9,exp:26,gold:10,respawn:10000,color:0xe3a749},
  motor:{name:'폭주 모터',hp:48,speed:70,damage:8,exp:24,gold:9,respawn:9000,color:0xce7043},
  drone:{name:'고장 난 드론',hp:36,speed:78,damage:7,exp:22,gold:9,respawn:9000,color:0x81729f},
  slime: { name: '새싹 슬라임', hp: 36, speed: 48, damage: 8, exp: 18, gold: 8, respawn: 6000, color: 0x8edb83 },
  bot: { name: '고장난 로봇', hp: 65, speed: 65, damage: 13, exp: 32, gold: 15, respawn: 8500, color: 0xf1bc73 },
} satisfies Record<EnemyKind, object>;
