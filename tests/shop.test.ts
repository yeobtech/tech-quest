import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equip, purchase } from '../src/data/shop.ts';
import { newProgress } from '../src/systems/ProgressionSystem.ts';
import { SaveSystem } from '../src/systems/SaveSystem.ts';
test('purchase charges once and only owned items may occupy their slot',()=>{
 const s=newProgress();s.gold=100;
 assert.equal(purchase(s,'pack'),false);assert.equal(equip(s.wardrobe,'pack'),false);
 assert.equal(purchase(s,'pin'),true);assert.equal(purchase(s,'pin'),false);assert.equal(s.gold,0);
 s.gold=100;purchase(s,'goggles');equip(s.wardrobe,'pin');equip(s.wardrobe,'goggles');
 assert.equal(s.wardrobe.equipped.Head,'goggles');equip(s.wardrobe,'goggles');assert.equal(s.wardrobe.equipped.Head,undefined);
});
test('legacy progress and learning survive migration and equipped scissors survive reload',()=>{
 let raw=JSON.stringify({version:1,progress:{level:3,gold:500,exp:21,kills:8,learning:{rank:'탐구',completedMissionIds:['first']}}});
 const save=new SaveSystem({getItem:()=>raw,setItem:(_,v)=>{raw=v}});
 const s=save.load();assert.equal(s.learning.rank,'탐구');assert.equal(s.wardrobe.equipped.WeaponSkin,'scissors');
 purchase(s,'future');equip(s.wardrobe,'future');save.save(s);const after=save.load();assert.deepEqual(after,s);assert.equal(after.gold,0);
 equip(after.wardrobe,'future');assert.equal(after.wardrobe.equipped.WeaponSkin,'scissors');
});
