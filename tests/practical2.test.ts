import {examQuestions,takeExam,beginExam} from '../src/education/promotion.ts';
import {requiredExp} from '../src/data/config.ts';
import {MeasurementRun,readMeasurement} from '../src/education/measurement2.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProgress} from '../src/systems/ProgressionSystem.ts';
import {SaveSystem} from '../src/systems/SaveSystem.ts';
import {labAction,labStatus,measurementStatus,recordMeasurement,recordWiring,missionWiringError,newNotes,findingRoles,jumperTasks,exportPractical2,readPractical2,type Finding} from '../src/education/practical2.ts';
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

test('real measurement requires three 2-second samples; mock, failure, stale, bursts and reconnect reset the run',()=>{
 const run=new MeasurementRun(),sample={temperature:23.5,humidity:51};run.receive('serial',sample,1000);assert.equal(run.count,0);run.open();
 run.receive('mock',sample,1000);assert.equal(run.count,0);
 for(const at of [1000,3000,5000])run.receive('serial',sample,at);assert.equal(run.count,3);assert.ok(run.evidence());
 run.receive('serial',null,7000);assert.equal(run.count,0);run.receive('serial',sample,9000);run.receive('serial',sample,9001);assert.equal(run.count,1);
 run.receive('serial',sample,11001);run.receive('mock',sample,13001);assert.equal(run.count,0);
 run.receive('serial',sample,15000);run.expire(21000);assert.equal(run.count,0);
 run.receive('serial',sample,23000);run.close();run.open();assert.equal(run.count,0);assert.equal(run.evidence(),null);
 for(const at of [25000,27000,29000])run.receive('serial',sample,at);assert.ok(run.evidence());
 run.receive('serial',{temperature:NaN,humidity:51},31000);assert.equal(run.count,0);
});
test('measurement evidence saves atomically; restored and forged local records never show verified or official approval',()=>{
 const p=newProgress(),run=new MeasurementRun();run.open();assert.equal(recordMeasurement(p,run,()=>true),false);
 for(const at of [1000,3000,5000])run.receive('serial',{temperature:24,humidity:55},at);
 const before=structuredClone(p);assert.equal(recordMeasurement(p,run,()=>false),false);assert.deepEqual(p,before);
 let data='';const save=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});assert.equal(recordMeasurement(p,run,n=>save.save(n)),true);assert.match(measurementStatus(p),/^실물 검증 완료/);
 const loaded=save.load();assert.deepEqual(loaded.practical2[15].measurement,p.practical2[15].measurement);assert.match(measurementStatus(loaded),/재검증 대기/);assert.equal(loaded.exp,0);assert.deepEqual(loaded.learning.completedMissionIds,[]);
 assert.equal(readMeasurement({source:'mock',samples:run.evidence()!.samples}),null);
 assert.equal(readMeasurement({source:'serial',samples:[null,null,null]}),null);
 assert.equal(readMeasurement({source:'serial',samples:[{at:1000,temperature:24,humidity:55},{at:1001,temperature:24,humidity:55},{at:1002,temperature:24,humidity:55}]}),null);
});
test('upload self-report remains pending and practical drafts do not affect knowledge exams or RPG rewards',()=>{
 const p=newProgress(),original=structuredClone(p);
 labAction(p,14,{kind:'notes',notes:{...notes(),result:'업로드 성공이라고 학생이 기록'},submit:true},()=>true);
 assert.match(labStatus(p,14),/실물 검증 대기/);assert.match(labStatus(p,14),/교사 확인 대기/);assert.equal(p.practical2[15].measurement,null);
 assert.deepEqual(p.stage1,original.stage1);assert.deepEqual(p.exam,original.exam);assert.deepEqual(p.wardrobe,original.wardrobe);assert.equal(p.gold,original.gold);
});

test('knowledge exam success is recorded separately and grants no practical completion',()=>{
 const p=newProgress();p.level=11;p.exp=requiredExp(11);beginExam(p,()=>true);for(const q of examQuestions(p))takeExam(p,{kind:'answer',level:11,id:q.id,choice:q.answer},()=>true);
 assert.ok(p.practical2[11].knowledgePassedAt);assert.equal(p.practical2[11].virtualAt,null);assert.equal(p.practical2[11].started,false);assert.equal(p.practical2[11].submission,null);assert.equal(p.practical2[15].measurement,null);
});
