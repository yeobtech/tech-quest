import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tools } from '../src/data/tools.ts';
import { SaveSystem } from '../src/systems/SaveSystem.ts';
import { newProgress } from '../src/systems/ProgressionSystem.ts';
test('tool selection is gated by learning and preserves the independent scissors skin',()=>{
 let value:string|null=null;
 const store=new SaveSystem({getItem:()=>value,setItem:(_,v)=>{value=v}});
 const p=newProgress();p.tool='nippers';p.wardrobe.owned.push('future');p.wardrobe.equipped.WeaponSkin='future';
 store.save(p);assert.equal(store.load().tool,'scissors');
 p.learning.completedMissionIds.push(tools.nippers.mission);store.save(p);
 assert.deepEqual(store.load(),p);p.tool='scissors';store.save(p);assert.equal(store.load().wardrobe.equipped.WeaponSkin,'future');
});
test('legacy progress omitting tool defaults to scissors without losing currency',()=>{
 const legacy={...newProgress(),tool:undefined,gold:57};
 const s=new SaveSystem({getItem:()=>JSON.stringify({version:1,progress:legacy}),setItem(){}});
 assert.equal(s.load().tool,'scissors');assert.equal(s.load().gold,57);
});
