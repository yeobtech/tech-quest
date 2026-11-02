import type { ToolKind } from './tools';

export type Slot = 'Head' | 'Outfit' | 'Back' | 'Gloves' | 'WeaponSkin';
export interface Item {
  id: string; slot: Slot; name: string; price: number; description: string;
  tool?: ToolKind; gloveType?: 'ordinary' | 'protective';
}
export const catalog: readonly Item[] = [
  { id:'uniform', slot:'Outfit', name:'기본 작업복', price:0, description:'첫 실습을 함께하는 후드와 공구 벨트.' },
  { id:'scissors', slot:'WeaponSkin', tool:'scissors', name:'기본 안전가위', price:0, description:'빨간 손잡이의 견습생용 안전가위.' },
  { id:'goggles', slot:'Head', name:'탐험가 고글', price:100, description:'황동 테와 청록 렌즈가 달린 고글.' },
  { id:'pin', slot:'Head', name:'별 장식 머리핀', price:100, description:'머리에 꽂는 작은 금빛 별.' },
  { id:'pack', slot:'Back', name:'기술자 가방', price:150, description:'구리 버클이 달린 청록색 공구 가방.' },
  { id:'reinforced', slot:'WeaponSkin', tool:'scissors', name:'강화 안전가위', price:200, description:'청색 손잡이와 금속 리벳. 푸른 호를 그립니다.' },
  { id:'starlight', slot:'WeaponSkin', tool:'scissors', name:'별빛 가위', price:350, description:'금빛 별 장식. 휘두르면 별가루가 반짝입니다.' },
  { id:'future', slot:'WeaponSkin', tool:'scissors', name:'미래형 가위', price:500, description:'기계식 손잡이와 민트색 에너지 궤적.' },
];
export interface Wardrobe { owned: string[]; equipped: Partial<Record<Slot,string>> }
export function readWardrobe(raw?: Partial<Wardrobe> | null): Wardrobe {
  const owned = catalog.filter(i=>!i.price || (Array.isArray(raw?.owned) && raw.owned.includes(i.id))).map(i=>i.id);
  const equipped: Wardrobe['equipped'] = { Outfit:'uniform', WeaponSkin:'scissors' };
  for (const i of catalog) if (owned.includes(i.id) && raw?.equipped?.[i.slot]===i.id) equipped[i.slot]=i.id;
  return {owned,equipped};
}
export function purchase(state: { gold:number; wardrobe:Wardrobe }, id:string) {
  const item=catalog.find(i=>i.id===id);
  if (!item || state.wardrobe.owned.includes(id) || state.gold<item.price) return false;
  state.gold-=item.price; state.wardrobe.owned.push(id); return true;
}
export function equip(w:Wardrobe,id:string) {
  const item=catalog.find(i=>i.id===id);
  if (!item || !w.owned.includes(id)) return false;
  if (w.equipped[item.slot]===id) {
    if (!item.price) return false;
    delete w.equipped[item.slot];
    if(item.slot==='WeaponSkin') w.equipped.WeaponSkin='scissors';
  } else w.equipped[item.slot]=id;
  return true;
}
