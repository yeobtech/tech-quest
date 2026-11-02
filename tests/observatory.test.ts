import {test} from 'node:test';import assert from 'node:assert/strict';
import {Observatory,principle,recordTitle} from '../src/observatory/mission.ts';
import {newProgress} from '../src/systems/ProgressionSystem.ts';
import {SaveSystem} from '../src/systems/SaveSystem.ts';
test('award persists once alongside growth, gear and unlocked tools',()=>{
  const p=newProgress();p.level=3;p.gold=55;p.exp=17;p.tool='nippers';p.learning.completedMissionIds.push('nippers-basics');
  p.wardrobe.owned.push('future');p.wardrobe.equipped.WeaponSkin='future';
  let value='';const save=new SaveSystem({getItem:()=>value,setItem:(_,v)=>{value=v}});
  assert.ok(recordTitle(p.learning.completedMissionIds,'serial'));save.save(p);
  const loaded=save.load();assert.deepEqual(loaded,p);assert.equal(recordTitle(loaded.learning.completedMissionIds,'serial'),false);
});
test('mock, invalid and disconnected samples cannot release the shield',()=>{
 const m=new Observatory(),v={temperature:25,humidity:55};m.setWired(true);m.connected=true;
 for(let i=0;i<4;i++)m.receive('mock',v);assert.equal(m.answer(principle),false);
 m.receive('serial',v);m.receive('serial',null);assert.equal(m.count,0);
 for(let i=0;i<3;i++)m.receive('serial',v);m.resetConnection();assert.equal(m.answer(principle),false);
 m.connected=true;for(let i=0;i<3;i++)m.receive('serial',v);
 assert.equal(m.answer('틀림'),false);assert.equal(m.answer(principle),true);
 const ids=['nippers-basics'];assert.ok(recordTitle(ids,m.cleared));assert.equal(recordTitle(ids,m.cleared),false);assert.equal(ids.length,2);
});
test('teacher completion requires external verification and remains distinguishable',async()=>{
 const m=new Observatory();m.setWired(true);
 await m.teacherComplete(principle,{verifyForCurrentLearner:async()=>false});assert.equal(m.cleared,null);
 await m.teacherComplete(principle,{verifyForCurrentLearner:async()=>true});assert.equal(m.cleared,'teacher');
});
