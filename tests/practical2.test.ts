import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProgress} from '../src/systems/ProgressionSystem.ts';
import {SaveSystem} from '../src/systems/SaveSystem.ts';
import {labAction,labStatus,recordWiring,missionWiringError,newNotes,findingRoles,jumperTasks,exportPractical2,readPractical2,type Finding} from '../src/education/practical2.ts';
const notes=()=>({...newNotes(),task:'보드 탐험',result:'단자를 찾음',problem:'문제 없음',cause:'표기 확인',solution:'자료 비교',improvement:'실물 비교'});
test('stage2 practical is independent of EXP, atomic, persisted and exportable without official approval',()=>{
 const p=newProgress();let data='';const s=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});const before=structuredClone(p);
 assert.equal(labAction(p,11,{kind:'notes',notes:notes(),submit:false},()=>false),'failed');assert.deepEqual(p,before);
 assert.equal(labAction(p,11,{kind:'notes',notes:notes(),submit:true},n=>s.save(n)),'saved');const id=p.practical2[11].submission!.id;
 labAction(p,11,{kind:'notes',notes:notes(),submit:true},n=>s.save(n));assert.equal(p.practical2[11].submission!.id,id);
 const restored=s.load();assert.deepEqual(restored.practical2,p.practical2);assert.equal(restored.level,1);assert.equal(restored.exp,0);assert.match(labStatus(restored,11),/교사 확인 대기/);
 assert.deepEqual(exportPractical2(restored).missions,restored.practical2);
 labAction(p,11,{kind:'notes',notes:{...notes(),result:'실물을 다시 비교'},submit:true},()=>true);assert.equal(p.practical2[11].submission!.revision,2);
 const forged=structuredClone(p.practical2);forged[11].receipt={id:'fake',teacherId:'self',approvedAt:new Date().toISOString(),submissionId:id};assert.equal(readPractical2(forged)[11].receipt,null);
});
test('board selection and explanations require all five roles; jumpers and voltage safety allow retry',()=>{
 const p=newProgress();assert.equal(labAction(p,11,{kind:'finding',key:'GPIO',explanation:''},()=>true),'incomplete');
 for(const key of Object.keys(findingRoles) as Finding[])labAction(p,11,{kind:'finding',key,explanation:findingRoles[key]},()=>true);
 assert.ok(p.practical2[11].virtualAt);assert.match(labStatus(p,11),/가상/);
 for(const q of jumperTasks){assert.equal(labAction(p,12,{kind:'jumper',id:q.id,answer:'wrong'},()=>true),'wrong');assert.equal(labAction(p,12,{kind:'jumper',id:q.id,answer:q.answer},()=>true),'saved')}
 assert.ok(p.practical2[12].virtualAt);assert.equal(p.exp,0);assert.deepEqual(p.stage1.activities,{});
});

test('Lv13 preserves shared wiring rules but requires GPIO21; virtual record is atomic and not physical proof',()=>{
 const p=newProgress(),w={VCC:'3V3',DATA:'GPIO21',GND:'GND'};assert.equal(missionWiringError(w,'3v3',0),null);
 for(const bad of [{...w,VCC:'5V'},{...w,GND:'GPIO21'},{...w,DATA:'GPIO4'}])assert.ok(missionWiringError(bad,'3v3',0));
 assert.ok(missionWiringError(w,'unknown',0));assert.ok(missionWiringError(w,'3v3',1));const before=structuredClone(p);
 assert.equal(recordWiring(p,w,'3v3',0,()=>false),false);assert.deepEqual(p,before);
 assert.equal(recordWiring(p,w,'3v3',0,()=>true),true);assert.deepEqual(readPractical2(p.practical2)[13].wiring,w);assert.match(labStatus(p,13),/가상/);assert.equal(p.practical2[15].virtualAt,null);
});
