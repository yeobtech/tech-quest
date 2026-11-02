import type { EnemyKind } from './config';
export interface MapData { id: string; name: string; width: number; spawn: { x: number; y: number }; platforms: { x: number; y: number; w: number }[]; enemies: { kind: EnemyKind; x: number; min: number; max: number }[] }
export const FOREST: MapData = {
  id: 'beginner-forest', name: '초보자의 숲', width: 3200, spawn: { x: 180, y: 450 },
  platforms: [{ x: 1600, y: 630, w: 3200 }, { x: 510, y: 556, w: 240 }, { x: 790, y: 490, w: 240 }, { x: 1100, y: 540, w: 260 }, { x: 1420, y: 540, w: 260 }, { x: 1740, y: 470, w: 280 }, { x: 2060, y: 540, w: 240 }, { x: 2400, y: 478, w: 320 }, { x: 2750, y: 530, w: 240 }],
  enemies: [
    { kind: 'slime', x: 530, min: 400, max: 650 },
    { kind: 'slime', x: 780, min: 660, max: 900 },
    { kind: 'bot', x: 1040, min: 920, max: 1150 },
    { kind: 'slime', x: 1300, min: 1170, max: 1410 },
    { kind: 'bot', x: 1560, min: 1430, max: 1690 },
    { kind: 'slime', x: 1820, min: 1700, max: 1940 },
    { kind: 'bot', x: 2080, min: 1960, max: 2200 },
    { kind: 'slime', x: 2340, min: 2220, max: 2460 },
    { kind: 'bot', x: 2600, min: 2480, max: 2720 },
    { kind: 'slime', x: 2880, min: 2740, max: 3060 },
  ],
};

export const TRAINING: MapData = {
  id: 'training-yard', name: '기술자 훈련장', width: 2140, spawn: { x: 90, y: 580 },
  platforms: [
    { x: 1070, y: 630, w: 2140 }, { x: 325, y: 562, w: 200 },
    { x: 565, y: 502, w: 200 }, { x: 810, y: 550, w: 210 },
    { x: 1110, y: 490, w: 230 }, { x: 1390, y: 545, w: 240 },
    { x: 1650, y: 485, w: 210 }, { x: 1940, y: 430, w: 290 }
  ],
  enemies: [{ kind: 'slime', x: 505, min: 420, max: 610 },
    { kind: 'bot', x: 960, min: 860, max: 1050 },
    { kind: 'slime', x: 1490, min: 1410, max: 1570 }]
};
export const YARD = {
  ladders: [{ x: 1110, top: 490, bottom: 630 }, { x: 1940, top: 430, bottom: 630 }],
  spikes: [{ x: 680, y: 630 }, { x: 1260, y: 630 }, { x: 1730, y: 630 }],
  chest: { x: 580, y: 502 }, exit: { x: 2020, y: 430 }
};
