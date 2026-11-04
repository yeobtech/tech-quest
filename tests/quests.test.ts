import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quests,ready} from '../src/data/quests.ts';
import {ProgressionSystem,newProgress} from '../src/systems/ProgressionSystem.ts';
import {SaveSystem} from '../src/systems/SaveSystem.ts';
test('gear quest uses owned stock; failed writes and repeated claims do not change rewards',()=>{
  const p=new ProgressionSystem(newProgress()),q=quests[2];p.state.inventory.gear=3;
  let data='';const saves=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});
  assert.equal(p.questAction(q,false,()=>true),'unavailable');
  assert.equal(p.questAction(q,true,n=>saves.save(n)),'accepted');assert.ok(ready(p.state,q));
  assert.equal(p.questAction(q,false,()=>false),'failed');assert.equal(p.state.gold,0);
  assert.equal(p.questAction(q,false,n=>saves.save(n)),'claimed');
  const restored=new ProgressionSystem(saves.load());
  assert.equal(restored.questAction(q,true,()=>true),'unavailable');
  assert.deepEqual([restored.state.inventory.gear,restored.state.gold,restored.state.exp,restored.state.kills],[3,30,40,0]);
});
test('legacy achievements migrate from evidence only; earned titles survive later inventory changes',()=>{
  const legacy=newProgress();legacy.kills=10;legacy.inventory.badge=1;legacy.learning.completedMissionIds=['nippers-basics'];
  let data=JSON.stringify({version:1,progress:{...legacy,achieved:undefined,journal:undefined}});
  const saves=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});
  const p=saves.load();assert.deepEqual(p.journal,{});assert.deepEqual(p.achieved,['first','ten','badge','nippers']);
  delete p.inventory.badge;p.achieved.push('yard');saves.save(p);assert.equal(saves.load().achieved.length,5);
});
