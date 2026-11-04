import type {MaterialId} from './materials';
import type {Progress} from '../systems/ProgressionSystem';

export interface Recipe {
  id:string;
  result:string;
  ingredients:Partial<Record<MaterialId,number>>;
}
export const recipes:readonly Recipe[]=[
  {id:'gear-scissors',result:'gear-scissors',ingredients:{jelly:10,gear:10}}
];
export function ingredients(recipe:Recipe){
  return Object.entries(recipe.ingredients) as [MaterialId,number][];
}
export function craftStatus(p:Progress,r:Recipe){
  if(p.wardrobe.owned.includes(r.result))return 'owned';
  return ingredients(r).every(([id,n])=>(p.inventory[id]??0)>=n)?'ready':'missing';
}
export function craft(p:Progress,r:Recipe,save:(next:Progress)=>boolean){
  const status=craftStatus(p,r);
  if(status!=='ready')return status;
  const inventory={...p.inventory};
  for(const [id,n] of ingredients(r)){
    const left=inventory[id]!-n;
    if(left)inventory[id]=left;else delete inventory[id];
  }
  const wardrobe={...p.wardrobe,owned:[...p.wardrobe.owned,r.result]};
  const next={...p,inventory,wardrobe};
  if(!save(next))return 'failed';
  Object.assign(p,next);
  return 'crafted';
}
