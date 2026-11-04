import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProgress} from '../src/systems/ProgressionSystem.ts';
import {craft,recipes} from '../src/data/recipes.ts';
import {purchase,equip,readWardrobe} from '../src/data/shop.ts';
test('craft only unlocks on successful save and consumes each ingredient exactly once',()=>{
  const p=newProgress(),r=recipes[0];p.gold=999;p.tool='nippers';
  assert.equal(purchase(p,r.result),false);
  for(const inventory of [{jelly:9,gear:10},{jelly:10,gear:9}]){
    p.inventory=inventory;
    assert.equal(craft(p,r,()=>assert.fail()),'missing');
  }
  p.inventory={jelly:11,gear:10};
  assert.equal(craft(p,r,()=>false),'failed');
  assert.deepEqual(p.inventory,{jelly:11,gear:10});assert.ok(!p.wardrobe.owned.includes(r.result));
  let writes=0;
  assert.equal(craft(p,r,next=>{writes++;return next.wardrobe.owned.includes(r.result)&&!next.inventory.gear}),'crafted');
  assert.equal(craft(p,r,()=>assert.fail()),'owned');assert.equal(writes,1);
  assert.deepEqual(p.inventory,{jelly:1});assert.equal(p.tool,'nippers');
  assert.equal(equip(p.wardrobe,r.result),true);
  assert.equal(readWardrobe(p.wardrobe).equipped.WeaponSkin,r.result);
  assert.equal(equip(p.wardrobe,r.result),true);assert.equal(p.wardrobe.equipped.WeaponSkin,'scissors');
});
