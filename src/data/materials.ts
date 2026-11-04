import type { EnemyKind } from './config';

export const materials = {
  jelly: { icon:'🟢', name:'슬라임 젤리', description:'새싹 슬라임이 남긴 말랑한 초록 젤리.' },
  gear: { icon:'⚙️', name:'고장 난 톱니', description:'로봇에서 떨어져 나온 금속 톱니바퀴.' },
  badge: { icon:'🌟', name:'희귀 기술 배지', description:'별 모양이 새겨진 희귀한 기술자 배지.' }
} as const;
export type MaterialId = keyof typeof materials;
export type Inventory = Partial<Record<MaterialId, number>>;
const drops: {enemy:EnemyKind|'all'; id:MaterialId; chance:number}[] = [
  {enemy:'slime',id:'jelly',chance:0.30}, {enemy:'bot',id:'gear',chance:0.25},
  {enemy:'all',id:'badge',chance:0.03}
];
export function rollDrops(kind:EnemyKind, random = Math.random):MaterialId[] {
  return drops.filter(rule=>(rule.enemy==='all'||rule.enemy===kind) && random()<rule.chance).map(rule=>rule.id);
}
export function readInventory(raw?:unknown):Inventory {
  const result:Inventory={};
  if(raw && typeof raw==='object')for(const id of Object.keys(materials) as MaterialId[]){
    const n=(raw as Inventory)[id];
    if(typeof n==='number' && Number.isSafeInteger(n) && n>0)result[id]=n;
  }
  return result;
}
