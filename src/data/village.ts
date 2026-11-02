import type { MapData } from './maps';
export const VILLAGE: MapData = {
  id: 'technician-village', name: '기술자 마을', width: 1760,
  spawn: { x: 120, y: 600 }, platforms: [{ x: 880, y: 630, w: 1760 }], enemies: []
};
export const FOREST_GATE = 50;
export const VILLAGERS = [
  { x: 430, instructor:true, name: '기술 교관', building: '학습 공방', coat: 0x69b7a7,
    speech: '견습 기술자, 발판을 X로 측정해 보게. 양 끝에서 뻗는 선은 치수 보조선이고, 너비를 나타내는 선은 치수선이야. 연습하려면 숲 시작점에서 E로 훈련장에 들어가게.' },
  { x: 920, shop:true, name: '상점 주인', building: '작업복 가게', coat: 0xdfab65,
    speech: '새 고글과 가위를 착용해 보세요.' },
  { x: 1460, name: '전직 교관', building: '전직 길드', coat: 0x969ace,
    speech: '전투 레벨과 기술 등급은 따로 성장한다네. 기술 등급은 입문, 탐구, 설계, 제작 순서야. 수행평가 보스는 배운 기술을 점검하는 도전으로 준비 중이라네.' }
];
