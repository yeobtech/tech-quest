import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teacherQuests} from '../src/education/questMenu.ts';
import {newProgress} from '../src/systems/ProgressionSystem.ts';
import {lessons} from '../src/education/stage1Data.ts';

test('new player sees only tool and first study quests, not sensor hardware',()=>{
 const p=newProgress(),before=structuredClone(p);
 assert.deepEqual(teacherQuests(p).filter(q=>q.available).map(q=>q.id),['nippers','study-1']);
 assert.deepEqual(p,before);
});
test('level 13 offers board practice through wiring; real measurement waits for level 15',()=>{
 const p=newProgress();p.level=13;
 assert.deepEqual(teacherQuests(p).filter(q=>q.available&&q.kind==='practical').map(q=>q.level),[11,12,13]);
 p.level=15;assert.equal(teacherQuests(p).filter(q=>q.available&&q.kind==='practical').length,5);
});
test('study order remains enforced and existing study progress remains reachable',()=>{
 const p=newProgress();p.level=8;
 assert.equal(teacherQuests(p).find(q=>q.id==='study-2')!.available,false);
 p.stage1.accepted=true;p.stage1.solved=lessons[0].questions.map(q=>q.id);
 p.stage1.activities[1]={text:'직접 살펴보고 역할을 기록했어요.',submittedAt:new Date().toISOString(),selfReported:true};
 p.level=1;
 assert.equal(teacherQuests(p).find(q=>q.id==='study-1')!.recorded,true);
 assert.equal(teacherQuests(p).find(q=>q.id==='study-2')!.available,true);
 assert.equal(teacherQuests(p).find(q=>q.id==='study-3')!.available,false);
});
test('old low-level practical drafts and historical stage unlock are preserved',()=>{
 const p=newProgress();p.practical2[15].draft.result='온도 25도';p.stage1.bossCleared=true;
 assert.equal(teacherQuests(p).find(q=>q.id==='practical-15')!.available,true);
 assert.equal(teacherQuests(p).find(q=>q.id==='practical-11')!.available,true);
 assert.equal(teacherQuests(p).find(q=>q.id==='practical-14')!.available,false);
});
test('past quest status does not grant equipment or teacher approval',()=>{
 const p=newProgress();p.learning.completedMissionIds.push('nippers-basics');p.practical2[13].virtualAt=new Date().toISOString();
 const before=structuredClone(p),quests=teacherQuests(p);
 assert.equal(quests.find(q=>q.id==='nippers')!.recorded,true);
 assert.equal(quests.find(q=>q.id==='practical-13')!.recorded,true);
 assert.equal(p.practical2[13].receipt,null);assert.equal(p.tool,'scissors');assert.deepEqual(p,before);
});
